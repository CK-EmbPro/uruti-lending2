import { Injectable, Logger } from '@nestjs/common';

/**
 * Service for providing explainable AI features
 * Implements SHAP values, LIME, and feature importance for regulatory compliance
 */
@Injectable()
export class ExplainabilityService {
  private readonly logger = new Logger(ExplainabilityService.name);

  /**
   * Calculate SHAP (SHapley Additive exPlanations) values
   * Provides feature importance based on game theory
   */
  calculateSHAPValues(
    features: Record<string, number>,
    featureWeights: Record<string, number>,
    baselineScore: number,
  ): Record<string, number> {
    const shapValues: Record<string, number> = {};

    // Simplified SHAP calculation
    // In production, use actual SHAP library (shap.js or Python bridge)
    for (const [feature, value] of Object.entries(features)) {
      const weight = featureWeights[feature] || 0;
      // SHAP value is the contribution of this feature
      // Simplified: contribution = feature_value * feature_weight
      shapValues[feature] = value * weight;
    }

    // Normalize to sum to difference from baseline
    const totalContribution = Object.values(shapValues).reduce((sum, val) => sum + Math.abs(val), 0);
    if (totalContribution > 0) {
      const currentScore = Object.values(shapValues).reduce((sum, val) => sum + val, 0) + baselineScore;
      const scoreDifference = currentScore - baselineScore;

      // Scale SHAP values to match score difference
      if (scoreDifference !== 0 && totalContribution > 0) {
        const scale = scoreDifference / totalContribution;
        Object.keys(shapValues).forEach((key) => {
          shapValues[key] = shapValues[key] * scale;
        });
      }
    }

    return shapValues;
  }

  /**
   * Calculate LIME (Local Interpretable Model-agnostic Explanations)
   * Provides local explanations for individual predictions
   */
  calculateLIME(
    features: Record<string, number>,
    featureWeights: Record<string, number>,
    prediction: number,
  ): {
    explanation: string;
    topFeatures: Array<{ feature: string; contribution: number; importance: number }>;
    localModel: Record<string, number>;
  } {
    // Simplified LIME calculation
    // In production, use actual LIME library or implement full algorithm
    const contributions: Array<{ feature: string; contribution: number; importance: number }> = [];

    for (const [feature, value] of Object.entries(features)) {
      const weight = featureWeights[feature] || 0;
      const contribution = value * weight;
      const importance = Math.abs(contribution);

      contributions.push({
        feature,
        contribution,
        importance,
      });
    }

    // Sort by importance
    contributions.sort((a, b) => b.importance - a.importance);

    // Get top 5 features
    const topFeatures = contributions.slice(0, 5);

    // Generate explanation
    const explanation = this.generateLIMEExplanation(topFeatures, prediction);

    // Local model (simplified linear model)
    const localModel: Record<string, number> = {};
    contributions.forEach((c) => {
      localModel[c.feature] = c.contribution;
    });

    return {
      explanation,
      topFeatures,
      localModel,
    };
  }

  /**
   * Generate human-readable explanation from LIME results
   */
  private generateLIMEExplanation(
    topFeatures: Array<{ feature: string; contribution: number; importance: number }>,
    prediction: number,
  ): string {
    const parts: string[] = [];
    parts.push(`This credit score (${Math.round(prediction)}) is primarily influenced by:`);

    topFeatures.forEach((feature, index) => {
      const direction = feature.contribution > 0 ? 'positively' : 'negatively';
      const featureName = feature.feature.replace(/([A-Z])/g, ' $1').trim();
      parts.push(
        `${index + 1}. ${featureName} (${direction} impacts score by ${Math.abs(feature.contribution).toFixed(1)} points)`,
      );
    });

    return parts.join(' ');
  }

  /**
   * Get comprehensive explanation for regulatory compliance
   */
  getComplianceExplanation(
    score: number,
    featureImportance: Record<string, number>,
    shapValues: Record<string, number>,
    limeExplanation: string,
    riskFactors: string[],
  ): {
    score: number;
    explanation: string;
    featureImportance: Array<{ feature: string; importance: number; shapValue: number }>;
    topContributingFactors: Array<{ factor: string; impact: string }>;
    riskFactors: string[];
    regulatoryFormat: {
      decision: string;
      primaryFactors: string[];
      adverseFactors: string[];
      positiveFactors: string[];
    };
  } {
    // Combine feature importance and SHAP values
    const combinedFeatures = Object.keys(featureImportance).map((feature) => ({
      feature,
      importance: featureImportance[feature],
      shapValue: shapValues[feature] || 0,
    }));

    // Sort by importance
    combinedFeatures.sort((a, b) => b.importance - a.importance);

    // Identify top contributing factors
    const topContributingFactors = combinedFeatures.slice(0, 5).map((f) => ({
      factor: f.feature.replace(/([A-Z])/g, ' $1').trim(),
      impact: f.shapValue > 0 ? 'Positive' : 'Negative',
    }));

    // Separate positive and adverse factors
    const positiveFactors = combinedFeatures
      .filter((f) => f.shapValue > 0)
      .slice(0, 3)
      .map((f) => f.feature.replace(/([A-Z])/g, ' $1').trim());

    const adverseFactors = combinedFeatures
      .filter((f) => f.shapValue < 0)
      .slice(0, 3)
      .map((f) => f.feature.replace(/([A-Z])/g, ' $1').trim());

    // Generate comprehensive explanation
    const explanation = `${limeExplanation}\n\nRisk factors identified: ${riskFactors.join(', ')}`;

    return {
      score,
      explanation,
      featureImportance: combinedFeatures,
      topContributingFactors,
      riskFactors,
      regulatoryFormat: {
        decision: score >= 700 ? 'Approved' : score >= 600 ? 'Conditional' : 'Declined',
        primaryFactors: topContributingFactors.map((f) => f.factor),
        adverseFactors,
        positiveFactors,
      },
    };
  }

  /**
   * Export explanation in regulatory compliance format (JSON)
   */
  exportComplianceFormat(explanation: any): string {
    return JSON.stringify(
      {
        creditScore: explanation.score,
        decision: explanation.regulatoryFormat.decision,
        explanation: explanation.explanation,
        primaryFactors: explanation.regulatoryFormat.primaryFactors,
        adverseFactors: explanation.regulatoryFormat.adverseFactors,
        positiveFactors: explanation.regulatoryFormat.positiveFactors,
        featureImportance: explanation.featureImportance.slice(0, 10),
        generatedAt: new Date().toISOString(),
      },
      null,
      2,
    );
  }

  /**
   * Get feature importance ranking
   */
  getFeatureImportanceRanking(
    featureImportance: Record<string, number>,
    limit: number = 10,
  ): Array<{ feature: string; importance: number; percentage: number }> {
    const entries = Object.entries(featureImportance)
      .map(([feature, importance]) => ({
        feature,
        importance,
        percentage: importance,
      }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);

    return entries;
  }
}

