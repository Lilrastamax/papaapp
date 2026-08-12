# Design — Chantier 3 : Refonte cloud Supabase (tables + synchro)

**Date :** 2026-08-12
**Statut :** Validé
**Sujet :** Chantier 3/3 — remplacer la colonne JSON `school_data` par de vraies tables

## Objectif

Remplacer la synchro actuelle (tout écrasé dans une colonne JSON `settings.school_data`) par un stockage par-item dans Supabase, propre et sans perte de données locales.

## Contexte validé

- L'utilisateur a accès au dashboard Supabase (peut exécuter le SQL).
- **On repart de zéro côté cloud** : aucune migration des anciennes données cloud. Le `localStorage` reste la source de vérité ; au premier sync, le cloud se remplit tout seul.

## Schéma cible (2 tables)

`settings` :
- `id uuid PK default gen_random_uuid()`
- `user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE DEFAULT auth.uid()`
- `name`, `child_name`, `child_birth_date`, `first_sunday_date`, `sunday_interval int`, `first_sunday_note`
- `checklists jsonb`, `school jsonb`
- `updated_at timestamptz`

`items` :
- `id text NOT NULL` (= `_id` local)
- `user_id uuid ... DEFAULT auth.uid()`
- `type text NOT NULL` (un des 27 types de listes)
- `data jsonb`
- `updated_at timestamptz`
- `PRIMARY KEY (user_id, id)`

RLS « Own data only » sur les deux tables. Index `(user_id, type)` sur `items`. Bucket Storage `documents` inchangé.

## Les 27 types de listes

`documents, vaccines, appointments, growth, expenses, memories, contacts, schoolItems, schoolDates, medications, shoppingList, sundayNotes, sundayOverrides, papaAppointments, papaNotes, teeth, clothingHistory, recurringTasks, extraVisits, papaActivites, papaAydenActivites, factures, vehicule, revenus, abonnements, contrats, activites`.

(`settings` et `school` sont des objets → dans `settings.checklists` / `settings.school`.)

## Synchro (`js/api.js`)

- **`cloudPushSettings()`** (push, local = source) : upsert `settings`, puis `DELETE` tous les `items` de l'utilisateur (RLS), puis `POST` tous les items en un batch. 3 requêtes.
- **`cloudSync()`** (pull) : GET `settings` (merge dans `DB.settings`), GET tous les `items`, reconstruit les listes **par type seulement si le cloud en a** (sinon on garde le local). Si aucun `settings` côté cloud (premier lancement), on pousse le local pour amorcer.
- Fonctions pures testables extraites : `buildItemRows(db)` et `applyCloudItems(db, items)`.
- Supprimer `mapFromCloud` / `mergeCloudSettings` (obsolètes).

## Fichiers touchés

- `supabase-schema.sql` (réécrit).
- `js/api.js` (réécriture de `cloudSync`/`cloudPushSettings`, ajout `buildItemRows`/`applyCloudItems`, retrait des fonctions obsolètes).
- `tests/api.test.js` (nouveau : tests des fonctions pures).

## Vérification

- `node --check` + `node --test` (nouveaux tests verts) + import graph OK.
- L'utilisateur exécute le SQL dans Supabase, puis test navigateur : sync OK, données locales intactes.

## Non inclus

- Conflits multi-appareils (last-write-wins) : hors périmètre (mono-utilisateur).
- Suppression des anciennes tables/colonnes cloud : inutile (on repart de zéro, l'ancien projet Supabase peut être vidé).
