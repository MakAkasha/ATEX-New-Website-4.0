# ATEX Website - Hostinger Deployment ZIP Builder
# Run from the project root:  .\make-deploy-zip.ps1

$ErrorActionPreference = "Stop"

$OutputZip = "atex-deploy.zip"
$TempDir   = ".\__deploy_temp__"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ATEX - Building Hostinger Deploy ZIP  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Clean up any previous temp/zip
if (Test-Path $TempDir)   { Remove-Item $TempDir   -Recurse -Force }
if (Test-Path $OutputZip) { Remove-Item $OutputZip -Force }

New-Item -ItemType Directory -Path $TempDir | Out-Null

# Folders to copy
$folders = @("admin", "assets", "data", "public", "server", "uploads", "views")

foreach ($folder in $folders) {
    if (Test-Path $folder) {
        Write-Host "  Copying $folder/ ..." -ForegroundColor Gray
        $dest = Join-Path $TempDir $folder
        Copy-Item -Path $folder -Destination $dest -Recurse -Force
        # Remove SQLite WAL/SHM temp files
        Get-ChildItem -Path $dest -Recurse -Include "*.sqlite-shm","*.sqlite-wal" | Remove-Item -Force -ErrorAction SilentlyContinue
    } else {
        Write-Warning "  Folder '$folder' not found - skipping."
    }
}

# Root files to copy
$rootFiles = @(".env", ".npmrc", "index.html", "package.json", "package-lock.json")

foreach ($file in $rootFiles) {
    if (Test-Path $file) {
        Write-Host "  Copying $file ..." -ForegroundColor Gray
        Copy-Item -Path $file -Destination $TempDir -Force
    } else {
        Write-Warning "  File '$file' not found - skipping."
    }
}

# Check .env exists
$envDest = Join-Path $TempDir ".env"
if (-not (Test-Path $envDest)) {
    Write-Host ""
    Write-Host "  WARNING: .env file was NOT found!" -ForegroundColor Yellow
    Write-Host "  The app will CRASH on Hostinger without SESSION_SECRET." -ForegroundColor Yellow
    Write-Host "  Either add .env to the project root, or set env vars in Hostinger panel." -ForegroundColor Yellow
    Write-Host ""
}

# Create ZIP
Write-Host ""
Write-Host "  Creating $OutputZip ..." -ForegroundColor White
Compress-Archive -Path "$TempDir\*" -DestinationPath $OutputZip -Force

# Clean up temp dir
Remove-Item $TempDir -Recurse -Force

# Done
$zipSizeBytes = (Get-Item $OutputZip).Length
$zipSizeMB = [math]::Round($zipSizeBytes / 1MB, 2)
$zipSizeStr = "$zipSizeMB MB"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Done!  File: $OutputZip ($zipSizeStr)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Upload atex-deploy.zip to Hostinger (Websites > Deployments)" -ForegroundColor Gray
Write-Host "  2. Build command:  npm install" -ForegroundColor Gray
Write-Host "  3. Start command:  npm start" -ForegroundColor Gray
Write-Host "  4. Node version:   22.x" -ForegroundColor Gray
Write-Host "  5. After deploy:   https://atex.sa/healthz" -ForegroundColor Gray
Write-Host ""
Write-Host "See DEPLOY.md for the full guide." -ForegroundColor Cyan
Write-Host ""
