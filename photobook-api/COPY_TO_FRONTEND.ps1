# Script PowerShell pour copier les fichiers frontend vers photobook-front
# À exécuter depuis le dossier photobook-api

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  📸 PHOTOBOOK STUDIO - FRONTEND SETUP  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$sourceDir = "FRONTEND_FILES"
$destDir = "..\photobook-front\src"

# Vérifier que le dossier source existe
if (-not (Test-Path $sourceDir)) {
    Write-Host "❌ Erreur: Le dossier FRONTEND_FILES n'existe pas" -ForegroundColor Red
    exit 1
}

# Vérifier que le dossier de destination existe
if (-not (Test-Path $destDir)) {
    Write-Host "❌ Erreur: Le dossier photobook-front/src n'existe pas" -ForegroundColor Red
    exit 1
}

# Fonction pour copier récursivement
function Copy-FrontendFiles {
    param (
        [string]$Source,
        [string]$Destination
    )
    
    # Créer le dossier de destination s'il n'existe pas
    if (-not (Test-Path $Destination)) {
        New-Item -ItemType Directory -Path $Destination -Force | Out-Null
        Write-Host "✓ Dossier créé: $Destination" -ForegroundColor Green
    }
    
    # Copier tous les fichiers
    Get-ChildItem -Path $Source -File | ForEach-Object {
        Copy-Item -Path $_.FullName -Destination $Destination -Force
        Write-Host "  ✓ Copié: $($_.Name)" -ForegroundColor Gray
    }
    
    # Copier récursivement les sous-dossiers
    Get-ChildItem -Path $Source -Directory | ForEach-Object {
        $newSource = Join-Path $Source $_.Name
        $newDest = Join-Path $Destination $_.Name
        Copy-FrontendFiles -Source $newSource -Destination $newDest
    }
}

# Copier tous les fichiers
Write-Host "`n📁 Copie en cours..." -ForegroundColor Yellow
Copy-FrontendFiles -Source $sourceDir -Destination $destDir

# Créer le fichier .env si nécessaire
$envFile = "..\photobook-front\.env"
if (-not (Test-Path $envFile)) {
    Write-Host "`n📝 Création du fichier .env..." -ForegroundColor Yellow
    $envContent = "VITE_API_BASE_URL=http://localhost/photobook-api/public/api"
    Set-Content -Path $envFile -Value $envContent
    Write-Host "✓ Fichier .env créé" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Le fichier .env existe déjà" -ForegroundColor Yellow
}

# Compter les fichiers copiés
$fileCount = (Get-ChildItem -Path $sourceDir -File -Recurse).Count

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  ✅ COPIE TERMINÉE AVEC SUCCÈS !  " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Statistiques:" -ForegroundColor Yellow
Write-Host "  • $fileCount fichiers copiés" -ForegroundColor White
Write-Host "  • Destination: photobook-front/src/" -ForegroundColor White
Write-Host ""
Write-Host "📝 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "  1️⃣  cd ..\photobook-front" -ForegroundColor White
Write-Host "  2️⃣  npm install (si pas déjà fait)" -ForegroundColor White
Write-Host "  3️⃣  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "🌐 L'application sera accessible sur:" -ForegroundColor Cyan
Write-Host "   http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "🔑 Comptes de test:" -ForegroundColor Yellow
Write-Host "  Admin:        admin@photobook.com / admin123" -ForegroundColor White
Write-Host "  Photographe:  photographe@photobook.com / photo123" -ForegroundColor White
Write-Host "  Client:       mamadou.diallo@example.com / client123" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation disponible dans FRONTEND_GUIDE/" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
