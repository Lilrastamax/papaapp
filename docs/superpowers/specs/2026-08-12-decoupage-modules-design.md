# Design — Découpage de PapaApp en modules ES6

**Date :** 2026-08-12
**Statut :** Validé (en attente du plan d'implémentation)
**Sujet :** Chantier 1/3 — restructuration du code

## Contexte

PapaApp est une PWA monopage : `index.html` (coquille), `app.css` (styles), `app.js` (toute la logique, 1042 lignes). L'app est déployée sur GitHub Pages à `lilrastamax.github.io/papaapp/` — d'où le préfixe `/papaapp/` dans tous les chemins. Les données sont stockées en local (`localStorage`, clé `papaapp_db`) et synchronisées vers Supabase.

Le fichier unique `app.js` devient difficile à maintenir. On découpe le code en modules ES6 sans changer le comportement.

## Objectif

Découper `app.js` en modules ES6 (`import`/`export`) avec des responsabilités claires, tout en gardant **exactement le même comportement** et **sans perdre aucune donnée**.

## Non-objectifs (chantiers suivants)

- Chantier 2 : tests automatisés (installation de Node + test runner).
- Chantier 3 : refonte de la synchro cloud Supabase (remplacer la colonne JSON `school_data` par les vraies tables déjà présentes dans `supabase-schema.sql`).
- Suppression des `onclick` inline dans le HTML généré (reportée, via le pont `globals.js`).

## Contrainte clé : le pont `globals.js`

Le HTML est généré par concaténation de chaînes et contient des handlers inline : `onclick="delFrom(...)"`, `onclick="navigate('daily')"`, `onclick="S.weekOffset--;render()"`, `onclick="showSettings()"`, etc. En modules ES6, ces noms ne sont plus globaux.

Pour ne pas changer le HTML généré, on crée **un seul fichier** `js/globals.js` qui ré-expose sur `window` la liste restreinte des noms utilisés par le HTML :

- `DB`, `S` (état)
- `render`, `navigate`, `showSettings`
- `delFrom`, `saveDB`, `cloudPushSettings`
- `addApptForDate`, `showCustodyModal`, `showSundayOverrideModal`, `showSchoolEditModal`, `showExtraVisitModal`
- `doRecurringTask`, `viewDocument`, `exportData`

Ce pont est temporaire et documenté ; il sera supprimé quand on passera des `onclick` inline aux `data-action` + délégation d'événements.

## Structure cible

```
PapaApp/
├── index.html          → charge uniquement <script type="module" src="/papaapp/js/main.js">
├── app.css             → inchangé
├── manifest.json       → inchangé
├── sw.js               → inchangé
├── js/
│   ├── main.js         → init(), DOMContentLoaded, exportData/importData
│   ├── config.js       → CFG (url/key Supabase, bucket, autoLockMs)
│   ├── store.js        → S, DB, defaultDB(), loadDB(), saveDB(), delFrom(), resetDailyChecklists()
│   ├── utils.js        → $, $$, uid, fmt*, dateISO, todayISO, daysUntil, childAge, sha256, apptIcon, isMedical, activiteIcon
│   ├── api.js          → sbHeaders, cloudReady, cloudAuth, cloudSync, mergeCloudSettings, cloudPushSettings, upload/compress image
│   ├── sundays.js      → getNextSundays(), getUpcomingSunday()  (calculs purs, testables)
│   ├── modal.js        → showModal(), closeM(), tous les showXxxModal(), showSettings(), showSchoolEditModal()
│   ├── ui.js           → initAuthScreen, doAuth, initLockHTML, showLockScreen, verifyPin, unlockApp, lockApp, updateHeader, resetAutoLock, showEmergency, toast, toggleDark, initDark, scheduleReminders, checkYearAgo
│   ├── nav.js          → initNav(), navigate(), initFab(), updateFab()
│   ├── render.js       → render() (switch), bindEvents()
│   ├── globals.js      → pont window.* (voir ci-dessus)
│   └── screens/
│       ├── home.js        → renderHome(), renderWeekCalendar()
│       ├── health.js      → renderHealth()
│       ├── agenda.js      → renderAgenda(), renderPastSundays(), renderMonthCalendar(), showCustodyModal()
│       ├── school.js      → renderSchool()
│       ├── activites.js   → formatActiviteMeta(), renderActivites()
│       ├── maison.js      → renderMaison()
│       └── misc.js        → renderDocs(), renderContacts(), renderDaily(), renderPlus(), renderClothingSizes(), renderRecurringTasks(), doRecurringTask()
```

## Responsabilités par module

| Module | Rôle | Dépendances |
|--------|------|-------------|
| `config.js` | Constantes de config | — |
| `utils.js` | Helpers purs (dates, DOM, hachage, icônes) | — |
| `sundays.js` | Calcul des dimanches de garde | `store`, `utils` |
| `store.js` | État (`S`, `DB`), persistance localStorage | `utils` (uid), `config` |
| `api.js` | Auth + sync + upload Supabase | `config`, `store` |
| `modal.js` | Formulaires (générique + spécifiques) | `store`, `utils`, `api`, `sundays` |
| `screens/*` | Rendu HTML d'un écran (fonctions pures de rendu) | `store`, `utils`, `api`, `sundays`, `modal`, `nav` |
| `render.js` | Ordonnanceur de rendu + liaison des événements | `screens/*`, `store` |
| `nav.js` | Navigation + FAB | `render`, `store` |
| `ui.js` | Écrans de verrouillage/auth, notifications, thème | `store`, `utils`, `api`, `render` |
| `globals.js` | Pont `window.*` pour le HTML inline | tous |
| `main.js` | Point d'entrée, init, export/import | tous |

**Note sur les dépendances circulaires :** `agenda.js` (via `showCustodyModal`) appelle `navigate()`, qui vit dans `nav.js`, qui importe `render.js`, qui importe les `screens/*` → cycle `agenda → nav → render → agenda`. Les cycles ES6 sont tolérés pour des fonctions appelées au runtime, mais on évitera le risque en faisant passer `navigate`/`render` par le pont `globals.js` (comme le HTML inline) plutôt que par un import direct depuis les screens.

## Flux de données (inchangé)

1. `init()` charge `DB` depuis `localStorage` (`papaapp_db`), fusionne avec `defaultDB()`.
2. Chaque action (ajout/suppression/modification) : muter `DB` → `saveDB()` (localStorage) → `cloudPushSettings()` (Supabase) → `render()`.
3. `render()` fait un `switch` sur `S.screen`, appelle le `renderXxx()` correspondant, injecte le HTML dans `#screenContainer`, puis `bindEvents()`.

## Stratégie de migration

- Déplacer le code par blocs (les 30 sections commentées d'`app.js`) vers les modules cibles, **sans modifier la logique**.
- Garder les mêmes noms de fonctions et la même structure de `DB`/`localStorage`.
- Aucune migration de données : la clé `papaapp_db` et son format restent identiques.
- Un commit git à chaque étape qui fonctionne (règle AGENTS.md n°6).

## Nettoyages inclus (sans impact comportement)

- Supprimer les 4 déclarations redondantes `window.showCustodyModal` (lignes 674-680), en garder une seule.
- Regrouper le tableau `days = ['','Lundi',...]` répété 3 fois dans `renderActivites()`.
- Aucun autre changement de logique.

## Vérification

- Déployer sur GitHub Pages, rafraîchir : comportement identique, toutes les données intactes.
- Console du navigateur (F12) : aucune erreur rouge.
- Toutes les fonctionsnalités existantes testables à la main (onglets, modales, synchro, verrouillage).

## Découpage en sous-projets (vue d'ensemble)

1. **Chantier 1 (ce doc)** : découpage en modules ES6.
2. **Chantier 2** : tests automatisés (Node + test runner), ciblant `sundays.js`, `utils.js`, `store.js`.
3. **Chantier 3** : refonte cloud Supabase (vraies tables, remplacement de `school_data`).
