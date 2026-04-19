# Script de vérification de l'état du backend avant push
# Date: 19 avril 2026

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║           VÉRIFICATION ÉTAT BACKEND PYTHON                     ║" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 1. Vérifier l'existence du dossier
Write-Host "1. Vérification du dossier py_backend..." -ForegroundColor Yellow
if (Test-Path "py_backend") {
    Write-Host "   ✓ Dossier py_backend existe" -ForegroundColor Green
    
    # Compter les fichiers
    $fileCount = (Get-ChildItem -Path "py_backend" -Recurse -File).Count
    Write-Host "   ℹ Nombre de fichiers: $fileCount" -ForegroundColor Cyan
} else {
    Write-Host "   ✗ Dossier py_backend non trouvé!" -ForegroundColor Red
    exit 1
}

# 2. Vérifier l'état Git
Write-Host ""
Write-Host "2. État Git du backend..." -ForegroundColor Yellow
$gitStatus = git status py_backend/ --short

if ($gitStatus) {
    Write-Host "   ⚠ Modifications non commitées détectées:" -ForegroundColor Yellow
    Write-Host ""
    git status py_backend/
    Write-Host ""
} else {
    Write-Host "   ✓ Aucune modification non commitée" -ForegroundColor Green
}

# 3. Vérifier le remote actuel
Write-Host ""
Write-Host "3. Remote Git actuel..." -ForegroundColor Yellow
$currentRemote = git remote get-url origin
Write-Host "   Remote: $currentRemote" -ForegroundColor Cyan

if ($currentRemote -match "Back-end-python") {
    Write-Host "   ⚠ ATTENTION: Remote pointe vers le repo backend!" -ForegroundColor Red
    Write-Host "   Utilisez le script de restauration si nécessaire" -ForegroundColor Yellow
} else {
    Write-Host "   ✓ Remote correct (repo principal)" -ForegroundColor Green
}

# 4. Vérifier la branche
Write-Host ""
Write-Host "4. Branche Git actuelle..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
Write-Host "   Branche: $currentBranch" -ForegroundColor Cyan

if ($currentBranch -eq "master") {
    Write-Host "   ✓ Sur la branche master" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Pas sur la branche master" -ForegroundColor Yellow
}

# 5. Vérifier les derniers commits
Write-Host ""
Write-Host "5. Derniers commits..." -ForegroundColor Yellow
Write-Host "   3 derniers commits:" -ForegroundColor Cyan
git log --oneline -3

# 6. Vérifier les fichiers modifiés récemment
Write-Host ""
Write-Host "6. Fichiers modifiés récemment dans py_backend/..." -ForegroundColor Yellow
$recentFiles = Get-ChildItem -Path "py_backend" -Recurse -File | 
    Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-1) } |
    Select-Object -First 10

if ($recentFiles) {
    Write-Host "   Fichiers modifiés dans les dernières 24h:" -ForegroundColor Cyan
    foreach ($file in $recentFiles) {
        $relativePath = $file.FullName.Replace((Get-Location).Path + "\", "")
        $time = $file.LastWriteTime.ToString("HH:mm:ss")
        Write-Host "   - $relativePath ($time)" -ForegroundColor Gray
    }
} else {
    Write-Host "   ℹ Aucun fichier modifié dans les dernières 24h" -ForegroundColor Gray
}

# 7. Vérifier la taille du dossier
Write-Host ""
Write-Host "7. Taille du dossier py_backend..." -ForegroundColor Yellow
$size = (Get-ChildItem -Path "py_backend" -Recurse -File | Measure-Object -Property Length -Sum).Sum
$sizeMB = [math]::Round($size / 1MB, 2)
Write-Host "   Taille totale: $sizeMB MB" -ForegroundColor Cyan

if ($sizeMB -gt 100) {
    Write-Host "   ⚠ Taille importante (> 100 MB)" -ForegroundColor Yellow
} else {
    Write-Host "   ✓ Taille acceptable" -ForegroundColor Green
}

# 8. Résumé
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║                      RÉSUMÉ                                    ║" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Dossier       : py_backend/" -ForegroundColor White
Write-Host "Fichiers      : $fileCount" -ForegroundColor White
Write-Host "Taille        : $sizeMB MB" -ForegroundColor White
Write-Host "Branche       : $currentBranch" -ForegroundColor White
Write-Host "Remote        : $currentRemote" -ForegroundColor White
Write-Host ""

# 9. Recommandation
if ($gitStatus) {
    Write-Host "⚠ RECOMMANDATION: Commitez les modifications avant de pusher" -ForegroundColor Yellow
} else {
    Write-Host "✓ Prêt pour le push vers GitHub" -ForegroundColor Green
}

Write-Host ""
Write-Host "Pour sauvegarder le backend:" -ForegroundColor Cyan
Write-Host "  .\Doc backend github\Scripts\push-backend-to-github.ps1" -ForegroundColor White
Write-Host ""
