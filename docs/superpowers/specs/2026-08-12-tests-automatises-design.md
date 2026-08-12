# Design — Chantier 2 : Tests automatisés (logique pure)

**Date :** 2026-08-12
**Statut :** Validé
**Sujet :** Chantier 2/3 — tests automatisés

## Objectif

Ajouter des tests automatisés pour la logique « pure » de PapaApp (sans navigateur), exécutables via `npm test`, afin de détecter les régressions après chaque modification (règle AGENTS.md n°3).

## Outil

- **Node 24 `node --test`** : test runner intégré, zéro dépendance à installer.
- `package.json` : ajouter `"scripts": { "test": "node --test" }` (le fichier a déjà `"type": "module"`).

## Périmètre testé (et non testé)

**Testé** (logique pure, sans DOM) :
- `js/utils.js` : `dateISO`, `daysUntil`, `apptIcon`, `isMedical`, `activiteIcon`, `sha256`, `uid`.
- `js/sundays.js` : `getNextSundays`, `getUpcomingSunday` (calcul de garde, historique de bugs).
- `js/store.js` : `defaultDB`, `loadDB`, `saveDB`, `resetDailyChecklists` (avec un faux `localStorage` en mémoire).

**Non testé** (nécessiterait un navigateur simulé) : rendu des écrans, modales, clics, Supabase réseau. Reporté.

## Contraintes techniques

- Les tests importent les modules ES6 (`import ... from '../js/...'`). L'import du graphe fonctionne dans Node (vérifié : `import('./js/main.js')` OK, aucun accès DOM/localStorage au niveau module).
- `sundays.js` lit `DB.settings` : les tests initialisent l'état via `setDB(defaultDB())` puis fixent `DB.settings.firstSundayDate` / `sundayInterval`.
- `store.js` utilise `localStorage` et `delFrom` appelle `confirm`/`render`/`toast` (DOM) : on teste `defaultDB`, `loadDB`, `saveDB`, `resetDailyChecklists` avec un `localStorage` factice ; on **ne teste pas** `delFrom`.
- Tests déterministes (indépendants de la date du jour) : utiliser une date de dimanche dans le futur (ex. `2030-01-06`, un dimanche) pour `getNextSundays`.

## Structure cible

```
PapaApp/
├── package.json          → + "scripts": { "test": "node --test" }
├── tests/
│   ├── utils.test.js     → utilitaires
│   ├── sundays.test.js   → calcul des dimanches de garde
│   └── store.test.js     → persistance + défauts
```

## Vérification

`npm test` (ou `node --test`) → tous les tests passent, 0 échec.
