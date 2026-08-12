# Chantier 2 : Tests automatisés — Plan d'implémentation

**Goal:** Ajouter des tests automatisés (`node --test`) pour la logique pure et une commande `npm test`.

**Tech Stack:** Node 24 (test runner intégré), ES modules.

## Tâches

### Task 1: `package.json` + `tests/utils.test.js`

- Modifier `package.json` : ajouter `"scripts": { "test": "node --test" }`.
- Créer `tests/utils.test.js` :
  - `dateISO(new Date(2026, 7, 12))` → `'2026-08-12'`.
  - `daysUntil` : une date dans 3 jours → `3`.
  - `apptIcon('RDV pédiatre')` → `'🩺'` ; `apptIcon('Réunion')` → `'📅'`.
  - `isMedical('pédiatre')` → `true` ; `isMedical('coiffeur')` → `false`.
  - `activiteIcon('foot')` → `'⚽'`.
  - `sha256('abc')` → `'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'`.
  - `uid()` : deux appels → valeurs différentes, non vides.

### Task 2: `tests/sundays.test.js`

- Importer `setDB`, `defaultDB` de `../js/store.js` et `getNextSundays`, `getUpcomingSunday` de `../js/sundays.js`.
- Setup : `setDB(defaultDB()); DB.settings.firstSundayDate = '2030-01-06'; DB.settings.sundayInterval = 14;`.
- Test : `getNextSundays().map(d => dateISO(d))` → `['2030-01-06','2030-01-20','2030-02-03','2030-02-17']` (4 dimanches, espacement 14 j).
- Test : `getUpcomingSunday()` → `2030-01-06`.
- Test : `firstSundayDate` vide → `getNextSundays()` → `[]`.

### Task 3: `tests/store.test.js`

- Importer `defaultDB`, `loadDB`, `saveDB`, `setDB`, `resetDailyChecklists` de `../js/store.js`.
- Installer un faux `localStorage` en mémoire (`globalThis.localStorage = {...}`) avant les tests.
- Test : `defaultDB()` a `settings`, `contacts` (3 urgences), `checklists` (morning/evening/sunday).
- Test : `saveDB` + `loadDB` : round-trip (`setDB(defaultDB())`, modifier, `saveDB()`, recharger, vérifier).
- Test : `resetDailyChecklists` : cocher un item puis réinitialiser → `checked === false`.

### Task 4: Lancer et corriger

- `npm test` (ou `node --test`) → vert (0 échec). Corriger les tests/sources si besoin.

### Task 5: Commit

- `git add package.json tests/` + `git commit -m "test: ajoute les tests de la logique pure (node --test)"`.

## Global Constraints (rappel)

- Tout en français (messages de commit ; noms de tests clairs).
- Aucun changement de la logique de `js/` sauf si un test révèle un vrai bug.
- `npm test` doit passer avant de considérer la tâche finie.
