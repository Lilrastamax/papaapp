# Chantier 3 : Refonte cloud Supabase — Plan d'implémentation

**Goal:** Remplacer la colonne JSON `school_data` par 2 tables (`settings` + `items`) et réécrire la synchro.

**Tech Stack:** Supabase PostgREST (REST), SQL/RLS, ES modules, `node --test`.

## Global Constraints

- `localStorage` reste la source de vérité ; aucune perte de données locales.
- Tout en français (messages de commit).
- `npm test` vert avant de finir.
- Ne pas modifier la logique des écrans/modal (seulement `api.js` + SQL + tests).
- Chaque push est un « snapshot » complet (local = source), mono-utilisateur.

## Tâches

### Task 1: Réécrire `supabase-schema.sql`

Remplacer le contenu par le schéma à 2 tables (settings + items) + RLS + index, conforme au spec.

### Task 2: Réécrire `js/api.js`

- Ajouter `export const ITEM_TYPES = [...]` (les 27 types).
- Ajouter `export function buildItemRows(db)` → `[{ id, type, data }]` (data = item sans `_id`).
- Ajouter `export function applyCloudItems(db, items)` → pour chaque type présent dans `items`, remplace `db[type]` par les items (`{ _id: id, ...data }`) ; les types absents sont laissés inchangés.
- Réécrire `cloudSync()` : GET settings (merge) + GET items (applyCloudItems) ; si aucun settings cloud → `cloudPushSettings()` pour amorcer. Conserver la logique refresh 401.
- Réécrire `cloudPushSettings()` : upsert settings (PATCH/POST) + DELETE items + POST items (batch). Conserver refresh 401.
- Supprimer `mapFromCloud` et `mergeCloudSettings` (plus utilisés).
- Garder `sbHeaders`, `cloudReady`, `cloudAuth`, `refreshAccessToken`, `triggerScan`, `uploadAndShowDoc`, `compressImage` inchangés.

### Task 3: `tests/api.test.js`

- Tester `buildItemRows` (2 listes → bonnes lignes, `_id` retiré de `data`, `type` correct).
- Tester `applyCloudItems` (remplace les types présents, laisse les absents).

### Task 4: Vérifier et committer

- `node --check js/api.js` + `node --test` (vert) + import graph OK.
- Commit `feat: refonte sync cloud (tables settings + items)`.

### Task 5: Appliquer le SQL côté Supabase (utilisateur)

- Fournir à l'utilisateur le SQL à coller dans l'éditeur Supabase (ou le pointer vers `supabase-schema.sql`).
- Test navigateur : login → sync → données locales intactes, push/pull OK.
