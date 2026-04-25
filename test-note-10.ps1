# Script de test pour la Note 10 - Résultat
# Date: 25 Avril 2026

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST NOTE 10 - RÉSULTAT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Python est disponible
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "ERREUR: Python n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    exit 1
}

Write-Host "1. Vérification de l'environnement..." -ForegroundColor Yellow
Write-Host "   Python version:" -NoNewline
python --version

Write-Host ""
Write-Host "2. Exécution du calculateur Note 10..." -ForegroundColor Yellow
Write-Host ""

# Exécuter le script de calcul
python "py_backend/Doc calcul notes annexes/Scripts/calculer_note_10.py"

$exitCode = $LASTEXITCODE

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  TEST RÉUSSI ✓" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Fichiers générés:" -ForegroundColor Cyan
    Write-Host "  - py_backend/Doc calcul notes annexes/Tests/test_note_10.html" -ForegroundColor White
    Write-Host "  - py_backend/Doc calcul notes annexes/Tests/trace_note_10.json" -ForegroundColor White
    Write-Host ""
    Write-Host "Pour visualiser le résultat:" -ForegroundColor Yellow
    Write-Host "  Ouvrir test_note_10.html dans un navigateur" -ForegroundColor White
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  TEST ÉCHOUÉ ✗" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Code de sortie: $exitCode" -ForegroundColor Red
}

Write-Host ""
