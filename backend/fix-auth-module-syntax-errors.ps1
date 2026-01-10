# Fix syntax errors introduced by the previous script
# The script incorrectly inserted AuthModule in wrong places

$modules = @(
    "advanced-caching\advanced-caching.module.ts",
    "analytics\analytics.module.ts",
    "api-documentation\api-documentation.module.ts",
    "credit-scoring-engine\credit-scoring-engine.module.ts",
    "customer-service\customer-service.module.ts",
    "data-migration\data-migration.module.ts",
    "email\email.module.ts",
    "file-processing\file-processing.module.ts",
    "file-upload\file-upload.module.ts",
    "jsreport\jsreport.module.ts",
    "loan-application\loan-application.module.ts",
    "loan-repayment\loan-repayment.module.ts",
    "multi-tenant\multi-tenant.module.ts",
    "qrcode\qrcode.module.ts"
)

$basePath = "src\modules"

foreach ($module in $modules) {
    $filePath = Join-Path $basePath $module
    
    if (Test-Path $filePath) {
        Write-Host "Fixing: $filePath" -ForegroundColor Cyan
        $content = Get-Content $filePath -Raw
        
        # Fix pattern 1: imports: [ConfigModule    AuthModule, -> imports: [ConfigModule],
        $content = $content -replace "imports:\s*\[ConfigModule\s+AuthModule,", "imports: [ConfigModule],"
        
        # Fix pattern 2: imports: [TypeOrmModule.forFeature([CacheEntry])    AuthModule, -> imports: [TypeOrmModule.forFeature([CacheEntry]), AuthModule,
        $content = $content -replace "(\[TypeOrmModule\.forFeature\(\[[^\]]+\]\))\s+AuthModule,", "`$1,`r`n    AuthModule,"
        
        # Fix pattern 3: Remove duplicate JwtModule if AuthModule is present
        if ($content -match "import.*AuthModule" -and $content -match "JwtModule\.registerAsync") {
            # Remove JwtModule import
            $content = $content -replace "import\s+\{\s*JwtModule\s+\}\s+from\s+['\`"]@nestjs/jwt['\`"];[\r\n]+", ""
            # Remove ConfigModule import if only used for JWT
            # Remove JwtModule.registerAsync block
            $content = $content -replace "JwtModule\.registerAsync\(\{[^}]+\}\),[\r\n\s]*", ""
            # Remove ConfigModule, ConfigService imports if not used elsewhere (simplified - may need manual check)
        }
        
        # Ensure AuthModule is in imports array (not inside nested arrays)
        if ($content -match "import.*AuthModule" -and $content -notmatch "imports:\s*\[[\s\S]*?AuthModule,") {
            # Add AuthModule to main imports array
            $content = $content -replace "(imports:\s*\[)", "`$1`r`n    AuthModule,"
        }
        
        # Clean up: Remove AuthModule from wrong places
        $content = $content -replace "ConfigModule\s+AuthModule", "ConfigModule"
        $content = $content -replace "CacheEntry\]\)\s+AuthModule", "CacheEntry]),`r`n    AuthModule"
        
        Set-Content -Path $filePath -Value $content -NoNewline
        Write-Host "  -> Fixed!" -ForegroundColor Green
    }
}

Write-Host "`nDone! Please review the changes." -ForegroundColor Green

