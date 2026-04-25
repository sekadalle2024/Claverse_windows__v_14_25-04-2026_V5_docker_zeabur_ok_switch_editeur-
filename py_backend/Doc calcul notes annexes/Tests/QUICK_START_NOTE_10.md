# Quick Start - Note 10 (Résultat)

## Vue d'ensemble

La Note 10 calcule les mouvements du résultat (bénéfices et pertes) à partir des balances SYSCOHADA.

## Structure de la Note 10

La Note 10 contient **6 lignes de détail** + 1 ligne de total:

1. **Report à nouveau créditeur** (compte 121)
2. **Report à nouveau débiteur** (compte 129)
3. **Résultat en instance d'affectation - Bénéfice** (compte 1301)
4. **Résultat en instance d'affectation - Perte** (compte 1309)
5. **Résultat net de l'exercice - Bénéfice** (compte 131)
6. **Résultat net de l'exercice - Perte** (compte 139)
7. **TOTAL RÉSULTAT** (somme des lignes 1-6)

## Mapping des comptes SYSCOHADA

| Ligne | Comptes bruts | Comptes amortissement |
|-------|---------------|----------------------|
| Report à nouveau créditeur | 121 | Aucun |
| Report à nouveau débiteur | 129 | Aucun |
| Résultat en instance - Bénéfice | 1301 | Aucun |
| Résultat en instance - Perte | 1309 | Aucun |
| Résultat net - Bénéfice | 131 | Aucun |
| Résultat net - Perte | 139 | Aucun |

**Note**: Les comptes de résultat ne font pas l'objet d'amortissements.

## Exécution rapide

### Option 1: Script PowerShell (recommandé)

```powershell
.\test-note-10.ps1
```

### Option 2: Ligne de commande Python

```bash
# Avec le fichier de balance par défaut
python "py_backend/Doc calcul notes annexes/Scripts/calculer_note_10.py"

# Avec un fichier de balance personnalisé
python "py_backend/Doc calcul notes annexes/Scripts/calculer_note_10.py" "chemin/vers/balance.xlsx"

# Avec des chemins de sortie personnalisés
python "py_backend/Doc calcul notes annexes/Scripts/calculer_note_10.py" \
    --output-html "mon_rapport.html" \
    --output-trace "ma_trace.json"
```

## Fichiers générés

Après exécution, les fichiers suivants sont créés:

1. **test_note_10.html** - Tableau HTML formaté de la Note 10
2. **trace_note_10.json** - Fichier de traçabilité avec détails des calculs

## Structure du tableau HTML

Le tableau généré contient **11 colonnes**:

### Groupe 1: VALEURS BRUTES
- Début exercice (ouverture N-1)
- Augmentations (mouvements débit N)
- Diminutions (mouvements crédit N)
- Fin exercice (clôture N)

### Groupe 2: AMORTISSEMENTS
- Début exercice (toujours 0 pour le résultat)
- Dotations (toujours 0)
- Reprises (toujours 0)
- Fin exercice (toujours 0)

### Groupe 3: VALEURS NETTES
- Début exercice (VNC ouverture)
- Fin exercice (VNC clôture)

## Validation des résultats

### Vérifications automatiques

Le script effectue automatiquement:

1. **Cohérence comptable**: Vérifie que Clôture = Ouverture + Augmentations - Diminutions
2. **Chargement des balances**: Vérifie que les 3 exercices (N, N-1, N-2) sont présents
3. **Traçabilité**: Enregistre tous les comptes sources utilisés

### Vérifications manuelles recommandées

1. **Total cohérent**: Le total doit correspondre à la somme des lignes
2. **Signes corrects**: 
   - Comptes créditeurs (121, 1301, 131) = montants positifs
   - Comptes débiteurs (129, 1309, 139) = montants négatifs
3. **Continuité temporelle**: Clôture N-1 = Ouverture N

## Exemple de sortie console

```
================================================================================
  CALCULATEUR NOTE 10 - RÉSULTAT
================================================================================

📂 Chargement des balances depuis: ../../../P000 -BALANCE DEMO N_N-1_N-2.xls
✓ Balance N   : 150 lignes chargées
✓ Balance N-1 : 150 lignes chargées
✓ Balance N-2 : 150 lignes chargées

🔢 Calcul de la note 10...
  Calcul: Report à nouveau créditeur...
  Calcul: Report à nouveau débiteur...
  Calcul: Résultat en instance d'affectation - Bénéfice...
  Calcul: Résultat en instance d'affectation - Perte...
  Calcul: Résultat net de l'exercice - Bénéfice...
  Calcul: Résultat net de l'exercice - Perte...
✓ Note calculée: 7 lignes

📄 Génération du HTML...
✓ HTML généré

✓ Fichier HTML sauvegardé: ../Tests/test_note_10.html
✓ Fichier de trace sauvegardé: ../Tests/trace_note_10.json

────────────────────────────────────────────────────────────────────────────────
  RÉSUMÉ NOTE 10
────────────────────────────────────────────────────────────────────────────────

  Nombre de lignes: 6
  VNC Ouverture:           5,000,000
  VNC Clôture:             6,500,000
  Variation:               1,500,000

================================================================================
  ✓ NOTE 10 CALCULÉE AVEC SUCCÈS EN 2.45s
================================================================================
```

## Dépannage

### Erreur: "Balance non trouvée"
- Vérifier que le fichier `P000 -BALANCE DEMO N_N-1_N-2.xls` existe
- Vérifier les onglets: "BALANCE N", "BALANCE N-1", "BALANCE N-2"

### Erreur: "Module non trouvé"
- Vérifier que tous les modules sont dans `py_backend/Doc calcul notes annexes/Modules/`
- Modules requis: balance_reader, account_extractor, movement_calculator, vnc_calculator, html_generator, trace_manager

### Avertissement: "Incohérence détectée"
- Normal si les balances de test ne sont pas parfaitement équilibrées
- Vérifier l'écart affiché et investiguer si > 1%

## Prochaines étapes

Après avoir validé la Note 10:

1. Vérifier le fichier HTML généré dans un navigateur
2. Consulter le fichier de trace JSON pour les détails
3. Passer à la Note 11 (Provisions) si nécessaire

## Support

Pour plus d'informations:
- Consulter le README principal: `py_backend/Doc calcul notes annexes/README.md`
- Consulter la documentation des modules: `py_backend/Doc calcul notes annexes/Modules/`
- Consulter les tests: `py_backend/Doc calcul notes annexes/Tests/`
