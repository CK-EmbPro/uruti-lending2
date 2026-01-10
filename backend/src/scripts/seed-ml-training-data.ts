import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MLSeedDataGeneratorService } from '../modules/credit-scoring-engine/services/ml-seed-data-generator.service';
import { MLModelTrainingService } from '../modules/credit-scoring-engine/services/ml-model-training.service';
import { ModelType } from '../modules/credit-scoring-engine/dto/ml-model.dto';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  let app;
  let seedDataGenerator: MLSeedDataGeneratorService;
  let modelTrainingService: MLModelTrainingService;
  
  // Set a timeout for database connection
  const initPromise = NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'], // Reduce logging noise
  });
  
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Database connection timeout - continuing anyway')), 5000)
  );
  
  try {
    app = await Promise.race([initPromise, timeoutPromise]) as any;
    seedDataGenerator = app.get(MLSeedDataGeneratorService);
    modelTrainingService = app.get(MLModelTrainingService);
  } catch (error) {
    // If database connection fails or times out, create services directly
    // The services don't require database for data generation
    console.warn('⚠️  Database connection issue detected, creating services directly...');
    console.warn('   (This is expected if database is not configured)');
    
    // Create services directly without NestJS DI
    seedDataGenerator = new MLSeedDataGeneratorService();
    modelTrainingService = new MLModelTrainingService(new (await import('@nestjs/config')).ConfigService());
  }

  try {
    // Parse command line arguments
    // npm may consume -- arguments, so we check both command line and environment variables
    const args = process.argv.slice(2);
    
    const getArg = (name: string, envName?: string): string | null => {
      // 1. Try environment variable first (most reliable with npm)
      if (envName && process.env[envName]) {
        return process.env[envName];
      }
      // 2. Try --name=value format in command line
      const eqArg = args.find(a => a.startsWith(`--${name}=`));
      if (eqArg) {
        const parts = eqArg.split('=');
        return parts.slice(1).join('='); // Handle paths with = in them
      }
      // 3. Try --name value format
      const idx = args.indexOf(`--${name}`);
      if (idx >= 0 && idx < args.length - 1) return args[idx + 1];
      return null;
    };
    
    const countArg = getArg('count', 'SEED_COUNT');
    const outputArg = getArg('output', 'SEED_OUTPUT');
    const trainArg = args.includes('--train') || process.env.SEED_TRAIN === 'true';
    const activateArg = args.includes('--activate') || process.env.SEED_ACTIVATE === 'true';
    const trafficArg = getArg('traffic', 'SEED_TRAFFIC');
    const modelTypeArg = getArg('model-type', 'SEED_MODEL_TYPE');

    const sampleCount = countArg ? parseInt(countArg) : 10000;
    const outputPath = outputArg || null;
    const shouldTrain = trainArg || false;
    const shouldActivate = activateArg || false;
    const trafficPercentage = trafficArg ? parseInt(trafficArg) : 0;
    const modelType = (modelTypeArg || 'credit_score') as ModelType;

    console.log('🌱 Starting ML Training Data Generation...');
    console.log(`📊 Sample Count: ${sampleCount.toLocaleString()}`);
    console.log(`📁 Output: ${outputPath || 'No file output (API only)'}`);
    console.log(`🤖 Train Model: ${shouldTrain ? 'Yes' : 'No'}`);
    console.log(`🚀 Auto-Activate: ${shouldActivate ? 'Yes' : 'No'}`);
    if (shouldActivate) {
      console.log(`📈 Traffic Percentage: ${trafficPercentage}%`);
    }

    // Generate training data
    console.log('\n📦 Generating training samples...');
    const startTime = Date.now();
    const trainingData = await seedDataGenerator.generateBulkTrainingData(sampleCount, {
      riskDistribution: {
        high: 0.2,
        medium: 0.4,
        low: 0.4,
      },
    });
    const generationTime = Date.now() - startTime;

    console.log(`✅ Generated ${trainingData.samples.length.toLocaleString()} samples in ${(generationTime / 1000).toFixed(2)}s`);
    console.log(`📋 Features: ${trainingData.featureNames?.length || 0} features`);

    // Save to file if output path specified
    if (outputPath) {
      const fullPath = path.resolve(outputPath);
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // For large datasets, write in chunks to avoid memory issues
      console.log('💾 Writing to file...');
      const writeStream = fs.createWriteStream(fullPath);
      writeStream.write('{\n');
      writeStream.write(`  "samples": [\n`);
      
      // Write samples in chunks
      const chunkSize = 100;
      for (let i = 0; i < trainingData.samples.length; i++) {
        const sample = trainingData.samples[i];
        const isLast = i === trainingData.samples.length - 1;
        const indent = '    ';
        writeStream.write(indent + JSON.stringify(sample));
        if (!isLast) writeStream.write(',');
        writeStream.write('\n');
        
        // Log progress for large datasets
        if ((i + 1) % 1000 === 0) {
          process.stdout.write(`\r   Writing... ${((i + 1) / trainingData.samples.length * 100).toFixed(1)}%`);
        }
      }
      
      writeStream.write('  ],\n');
      writeStream.write(`  "featureNames": ${JSON.stringify(trainingData.featureNames || [])}\n`);
      writeStream.write('}\n');
      writeStream.end();
      
      // Wait for file to be written
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', reject);
      });
      
      console.log(`\n💾 Saved to: ${fullPath}`);
      console.log(`📏 File size: ${(fs.statSync(fullPath).size / 1024 / 1024).toFixed(2)} MB`);
    }

    // Train model if requested
    if (shouldTrain) {
      console.log('\n🤖 Training ML model...');
      const trainStartTime = Date.now();
      const model = await modelTrainingService.trainModel(
        trainingData,
        modelType,
        {
          maxDepth: 6,
          learningRate: 0.1,
          nEstimators: 100,
        },
      );
      const trainTime = Date.now() - trainStartTime;

      console.log(`✅ Model trained: ${model.id}`);
      console.log(`⏱️  Training time: ${(trainTime / 1000).toFixed(2)}s`);
      console.log(`📊 Metrics:`);
      console.log(`   - MAE: ${model.metrics.mae.toFixed(2)}`);
      console.log(`   - RMSE: ${model.metrics.rmse.toFixed(2)}`);
      console.log(`   - R²: ${model.metrics.r2.toFixed(3)}`);
      if (model.metrics.accuracy) {
        console.log(`   - Accuracy: ${(model.metrics.accuracy * 100).toFixed(1)}%`);
      }

      // Activate model if requested
      if (shouldActivate) {
        console.log(`\n🚀 Activating model with ${trafficPercentage}% traffic...`);
        modelTrainingService.setActiveModel(modelType, model.id, trafficPercentage);
        console.log(`✅ Model activated: ${model.id}`);
      }
    }

    console.log('\n✅ Seed data generation completed successfully!');
    if (app) {
      await app.close();
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating seed data:', error);
    if (app) {
      await app.close();
    }
    process.exit(1);
  }
}

bootstrap();

