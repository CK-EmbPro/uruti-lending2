# Script to add AuthModule import to all modules that use JwtAuthGuard
# This follows the centralized JWT pattern

$modules = @(
    "advanced-ai\advanced-ai.module.ts",
    "advanced-analytics-bi\advanced-analytics-bi.module.ts",
    "advanced-caching\advanced-caching.module.ts",
    "advanced-security\advanced-security.module.ts",
    "analytics\analytics.module.ts",
    "api-documentation\api-documentation.module.ts",
    "api-gateway\api-gateway.module.ts",
    "blockchain\blockchain.module.ts",
    "collaboration\collaboration.module.ts",
    "credit-monitoring\credit-monitoring.module.ts",
    "credit-scoring-engine\credit-scoring-engine.module.ts",
    "customer-portal-enhanced\customer-portal-enhanced.module.ts",
    "customer-service\customer-service.module.ts",
    "data-migration\data-migration.module.ts",
    "elasticsearch\elasticsearch.module.ts",
    "email\email.module.ts",
    "event-driven\event-driven.module.ts",
    "excel\excel.module.ts",
    "file-processing\file-processing.module.ts",
    "file-upload\file-upload.module.ts",
    "jsreport\jsreport.module.ts",
    "loan\loan.module.ts",
    "loan-application\loan-application.module.ts",
    "loan-repayment\loan-repayment.module.ts",
    "loan-servicing\loan-servicing.module.ts",
    "marketplace-enhanced\marketplace-enhanced.module.ts",
    "microservices-communication\microservices-communication.module.ts",
    "monitoring-observability\monitoring-observability.module.ts",
    "multi-tenant\multi-tenant.module.ts",
    "open-banking\open-banking.module.ts",
    "p2p-lending\p2p-lending.module.ts",
    "performance-optimization\performance-optimization.module.ts",
    "predictive-analytics\predictive-analytics.module.ts",
    "qrcode\qrcode.module.ts",
    "rate-limiting\rate-limiting.module.ts",
    "real-time\real-time.module.ts",
    "risk-modeling\risk-modeling.module.ts",
    "social-lending\social-lending.module.ts",
    "testing-qa\testing-qa.module.ts",
    "white-label\white-label.module.ts",
    "workflow-engine-enhanced\workflow-engine-enhanced.module.ts"
)

$basePath = "src\modules"

foreach ($module in $modules) {
    $filePath = Join-Path $basePath $module
    
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw
        
        # Check if AuthModule is already imported
        if ($content -notmatch "AuthModule") {
            Write-Host "Processing: $filePath" -ForegroundColor Cyan
            
            # Check if controller uses JwtAuthGuard
            $controllerPath = $filePath -replace "\.module\.ts$", ".controller.ts"
            if (Test-Path $controllerPath) {
                $controllerContent = Get-Content $controllerPath -Raw
                if ($controllerContent -match "JwtAuthGuard") {
                    Write-Host "  -> Needs AuthModule (uses JwtAuthGuard)" -ForegroundColor Yellow
                    
                    # Add import if not present
                    if ($content -notmatch "import.*AuthModule") {
                        # Find the last import statement
                        if ($content -match "(import.*from.*['\`"].*['\`"];[\r\n]+)") {
                            $content = $content -replace "(import.*from.*['\`"].*['\`"];[\r\n]+)(?=@Module)", "`$1import { AuthModule } from '../auth/auth.module';`r`n"
                        } else {
                            # Add after other imports
                            $content = $content -replace "(@Module)", "import { AuthModule } from '../auth/auth.module';`r`n`r`n`$1"
                        }
                    }
                    
                    # Add to imports array if not present
                    if ($content -match "imports:\s*\[" -and $content -notmatch "AuthModule,") {
                        # Find the imports array and add AuthModule
                        $content = $content -replace "(imports:\s*\[[\s\S]*?)(\],)", "`$1    AuthModule,`r`n`$2"
                    }
                    
                    # Write back
                    Set-Content -Path $filePath -Value $content -NoNewline
                    Write-Host "  -> Fixed!" -ForegroundColor Green
                }
            }
        } else {
            Write-Host "Skipping: $filePath (already has AuthModule)" -ForegroundColor Gray
        }
    } else {
        Write-Host "Not found: $filePath" -ForegroundColor Red
    }
}

Write-Host "`nDone! Review the changes before committing." -ForegroundColor Green

