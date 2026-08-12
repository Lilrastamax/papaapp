# Découpage de PapaApp en modules ES6 — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Découper `app.js` (1042 lignes) en modules ES6 dans `js/` sans changer le comportement ni perdre de données.

**Architecture:** Modules ES6 chargés par `<script type="module">` depuis `index.html`. Un fichier par responsabilité : config, utilitaires, état/localStorage, Supabase, calculs des dimanches, rendu des écrans, modales, UI, navigation, rendu, pont `window.*`, point d'entrée.

**Tech Stack:** JavaScript ES6 (navigateur), PowerShell (serveur local), Node.js (uniquement pour `node --check`, validation de syntaxe), GitHub Pages (déploiement).

## Global Constraints

- Tous les chemins d'assets restent préfixés par `/papaapp/` (déploiement GitHub Pages `lilrastamax.github.io/papaapp/`).
- Aucune perte de données : clé `localStorage` `papaapp_db` inchangée, structure de `DB` inchangée, mêmes noms de fonctions.
- Tout en français (interface et messages de commit) — règle AGENTS.md n°8.
- Bumper `?v=N` dans `index.html` à chaque modif de code (règle AGENTS.md n°4).
- Un commit git par tâche qui fonctionne (règle AGENTS.md n°6).
- Le test de base de chaque tâche = `node --check` sur le fichier créé (aucune erreur de syntaxe). Le test fonctionnel final = déploiement + refresh + parcours manuel (règle AGENTS.md n°3).
- Les cycles d'import ES6 (ex. `store → api → store`) sont acceptés : ils ne contiennent que des `function` déclarées (hoistées) appelées au runtime, jamais à l'évaluation des modules.

---

## Source de vérité du code

Tout le code à déplacer provient de `C:\Users\Max\OneDrive\Projets\PapaApp\app.js`. Les références `app.js:N-M` désignent les lignes exactes à **copier telles quelles** (aucune modification de logique). Seuls les ajouts d'`export`/`import` et la suppression des `window.*` sont autorisés.

Mapping des sections d'`app.js` (repères stables) :

| Section | Lignes |
|---------|--------|
| `CFG` (config) | 6-12 |
| État global (`S`, `DB`, `lockTimer`) | 14-17 |
| Utilitaires | 22-37 |
| Données locales (`defaultDB`…`delFrom`) | 39-67 |
| API Supabase | 69-174 |
| Dimanches | 176-187 |
| Auth screen | 189-222 |
| Lock screen | 224-291 |
| Navigation | 293-309 |
| FAB | 311-334 |
| Rendu (`render`) | 336-353 |
| Home | 355-438 |
| Health | 440-460 |
| Agenda | 462-514 |
| School | 516-527 |
| Activités | 529-550 |
| Calendrier mois + garde | 553-680 |
| Maison | 682-696 |
| Docs/Contacts/Daily/Plus | 698-746 |
| Événements (`bindEvents`) | 748-763 |
| Actions (`handleAction`) | 765-779 |
| Scan & documents | 781-829 |
| Modales | 831-903 |
| Settings | 905-925 |
| Urgence | 927-940 |
| Notifications | 942-959 |
| Toast | 961-966 |
| Dark mode | 968-970 |
| Export/Import | 972-1004 |
| Reset daily | 1006-1013 |
| Init | 1015-1041 |

**Règle de complétion des imports** : les blocs `Consumes` de chaque tâche listent les imports *nécessaires* connus. L'exécutant doit, après avoir copié le code, **vérifier chaque symbole utilisé** et compléter l'import depuis le module `Produces` correspondant (le mapping module → symboles exportés est donné dans les blocs `Produces`). Aucun symbole ne doit rester non importé ; aucun import inutile n'est bloquant mais doit être retiré.

---

### Task 0: Prérequis — Node.js + package.json

**Files:**
- Create: `package.json`
- Create: `js/` (dossier vide)

**Interfaces:**
- Produces: `node --check` utilisable sur les fichiers `.js` ES modules.

- [ ] **Step 1: Installer Node.js**

Vérifier si Node est déjà là : `node --version`.
Si absent, installer via winget (Windows) :

```powershell
winget install OpenJS.NodeJS.LTS
```

Puis **rouvrir le terminal** (pour recharger le PATH) et vérifier : `node --version`.

Si `winget` n'existe pas, télécharger le LTS sur https://nodejs.org et l'installer.

- [ ] **Step 2: Créer `package.json`**

```json
{
  "name": "papaapp",
  "version": "4.0.0",
  "type": "module",
  "private": true
}
```

Le champ `"type": "module"` est indispensable : il indique à Node que les `.js` sont des modules ES6 (donc `node --check js/config.js` fonctionne).

- [ ] **Step 3: Vérifier**

```powershell
node --check package.json
```
Expected: aucune sortie (aucune erreur). `node --check` sur un JSON est sans objet ; à la place, vérifier que `node -e "console.log('ok')"` affiche `ok`.

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore: ajout Node (type module) pour le check syntaxe"
```

---

### Task 1: `js/config.js` + `js/utils.js`

**Files:**
- Create: `js/config.js`
- Create: `js/utils.js`

**Interfaces:**
- Produces `config.js`: `export const CFG = { url, key, bucket, autoLockMs }`.
- Produces `utils.js`: `export { $, $$, uid, fmt, fmtLong, fmtShort, fmtToday, daysUntil, childAge, dateISO, todayISO, sha256, apptIcon, isMedical, activiteIcon }`.

- [ ] **Step 1: Créer `js/config.js`**

Copier `app.js:6-12` (l'objet `CFG`). Ajouter `export` :

```js
export const CFG = {
  url: 'https://uvrazdcpymexbmlctdlh.supabase.co',
  key: 'eyJ...',  // copier la valeur exacte de app.js:9
  bucket: 'documents',
  autoLockMs: 10 * 60 * 1000
};
```

- [ ] **Step 2: Créer `js/utils.js`**

Copier les fonctions `app.js:22-37` ($, $$, uid, fmt, fmtLong, fmtShort, fmtToday, daysUntil, childAge, dateISO, todayISO, sha256, apptIcon, isMedical, activiteIcon), puis remplacer les `const x = ...` par `export const x = ...` et `async function sha256` par `export async function sha256`. Aucune dépendance (module feuille).

- [ ] **Step 3: Vérifier la syntaxe**

```powershell
node --check js/config.js
node --check js/utils.js
```
Expected: aucune sortie (pas d'erreur).

- [ ] **Step 4: Commit**

```bash
git add js/config.js js/utils.js
git commit -m "refactor: extrait config et utilitaires en modules"
```

---

### Task 2: `js/store.js`

**Files:**
- Create: `js/store.js`

**Interfaces:**
- Consumes: `uid` depuis `./utils.js`.
- Produces: `export let S` (objet mutable), `export let DB` (réassigné au chargement), `export function defaultDB`, `export function loadDB`, `export function saveDB`, `export function delFrom`, `export function resetDailyChecklists`.

- [ ] **Step 1: Créer `js/store.js`**

- Copier `app.js:14-17` pour `S`, `DB` (sans `lockTimer` qui part dans `ui.js`).
- Copier `app.js:39-63` : `defaultDB`, `loadDB`, `saveDB`.
- Copier `app.js:65` : `delFrom` (le corps appelle `saveDB`, `cloudPushSettings`, `render`, `toast` — ces imports sont décrits à l'étape suivante).
- Copier `app.js:1006-1013` : `resetDailyChecklists`.
- **Supprimer** `app.js:66-67` (`window.delFrom`, `window.DB`) — ils partent dans `globals.js`.
- Ajouter les exports en tête :

```js
import { uid } from './utils.js';

export let S = { token: null, refresh: null, screen: 'home', weekOffset: 0, fabOpen: false, calMonth: 0 };
export let DB = null;
```

- [ ] **Step 2: Ajouter les imports nécessaires à `delFrom`**

En haut de `store.js`, ajouter (cycle acceptable — appelé uniquement au runtime) :

```js
import { cloudPushSettings } from './api.js';
import { render } from './render.js';
import { toast } from './ui.js';
```

- [ ] **Step 3: Vérifier la syntaxe**

```powershell
node --check js/store.js
```
Expected: aucune erreur. (`node --check` ne résout pas les imports, donc l'absence de `api.js`/`render.js`/`ui.js` à ce stade n'est pas bloquante.)

- [ ] **Step 4: Commit**

```bash
git add js/store.js
git commit -m "refactor: extrait l'état et la persistance locale"
```

---

### Task 3: `js/sundays.js`

**Files:**
- Create: `js/sundays.js`

**Interfaces:**
- Consumes: `DB` depuis `./store.js` ; `dateISO` depuis `./utils.js`.
- Produces: `export function getNextSundays`, `export function getUpcomingSunday`.

- [ ] **Step 1: Créer `js/sundays.js`**

Copier `app.js:176-187` (`getNextSundays`, `getUpcomingSunday`), ajouter les `export` et en tête :

```js
import { DB } from './store.js';
import { dateISO } from './utils.js';
```

- [ ] **Step 2: Vérifier**

```powershell
node --check js/sundays.js
```
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add js/sundays.js
git commit -m "refactor: extrait le calcul des dimanches"
```

---

### Task 4: `js/api.js`

**Files:**
- Create: `js/api.js`

**Interfaces:**
- Consumes: `CFG` depuis `./config.js` ; `DB`, `S` depuis `./store.js`.
- Produces: `export function sbHeaders`, `export function cloudReady`, `export async function cloudAuth`, `export async function cloudSync`, `export function mapFromCloud`, `export function mergeCloudSettings`, `export async function cloudPushSettings`, `export function triggerScan`, `export async function uploadAndShowDoc`, `export async function compressImage`.

- [ ] **Step 1: Créer `js/api.js`**

- Copier `app.js:69-174` : `sbHeaders`, `cloudReady`, `cloudAuth`, `cloudSync`, `mapFromCloud`, `mergeCloudSettings`, `cloudPushSettings`.
- Copier `app.js:782-811` : `triggerScan`, `uploadAndShowDoc`, `compressImage`.
- Ajouter les `export` sur chaque déclaration et en tête :

```js
import { CFG } from './config.js';
import { DB, S } from './store.js';
import { uid } from './utils.js';
import { showDocModal } from './modal.js';
import { toast } from './ui.js';
```

(`uploadAndShowDoc` appelle `uid()`, `showDocModal()`, `toast()`.)

- [ ] **Step 2: Vérifier**

```powershell
node --check js/api.js
```
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add js/api.js
git commit -m "refactor: extrait l'API Supabase et l'upload"
```

---

### Task 5: `js/screens/home.js`

**Files:**
- Create: `js/screens/home.js`

**Interfaces:**
- Consumes: `DB`, `S` depuis `../store.js` ; `fmt`, `fmtLong`, `fmtShort`, `fmtToday`, `todayISO`, `dateISO`, `daysUntil`, `childAge` depuis `../utils.js` ; `getNextSundays`, `getUpcomingSunday` depuis `../sundays.js`.
- Produces: `export function renderHome`, `export function renderWeekCalendar`, `export function addApptForDate`.

- [ ] **Step 1: Créer `js/screens/home.js`**

- Copier `app.js:355-403` (`renderHome`), `app.js:405-437` (`renderWeekCalendar`), `app.js:438` (`window.addApptForDate = d => showApptModal(d);`) — le remplacer par `export function addApptForDate(d) { showApptModal(d); }`.
- Ajouter en tête les imports listés ci-dessus, plus `import { showApptModal } from '../modal.js';`.
- Note : `renderWeekCalendar` référence `document.body.classList.contains('dark')` — c'est du runtime, pas de souci.

- [ ] **Step 2: Vérifier**

```powershell
node --check js/screens/home.js
```
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add js/screens/home.js
git commit -m "refactor: extrait l'écran Accueil"
```

---

### Task 6: `js/screens/health.js`

**Files:**
- Create: `js/screens/health.js`

**Interfaces:**
- Consumes: `DB` depuis `../store.js` ; `fmtLong`, `fmtShort`, `daysUntil`, `apptIcon`, `isMedical` depuis `../utils.js`.
- Produces: `export function renderHealth`.

- [ ] **Step 1: Créer `js/screens/health.js`**

Copier `app.js:440-460` (`renderHealth`), ajouter `export function renderHealth` et les imports ci-dessus.

- [ ] **Step 2: Vérifier** → `node --check js/screens/health.js` (aucune erreur).

- [ ] **Step 3: Commit**

```bash
git add js/screens/health.js
git commit -m "refactor: extrait l'écran Santé"
```

---

### Task 7: `js/screens/agenda.js`

**Files:**
- Create: `js/screens/agenda.js`

**Interfaces:**
- Consumes: `DB`, `S` depuis `../store.js` ; `fmtLong`, `fmtShort`, `todayISO`, `dateISO`, `daysUntil` depuis `../utils.js` ; `getNextSundays` depuis `../sundays.js` ; `navigate` via le pont global (pas d'import direct — voir note design).
- Produces: `export function renderAgenda`, `export function renderPastSundays`, `export function renderMonthCalendar`, `export function showCustodyModal`.

- [ ] **Step 1: Créer `js/screens/agenda.js`**

- Copier `app.js:462-514` (`renderAgenda`, `renderPastSundays`).
- Copier `app.js:553-638` (`renderMonthCalendar`).
- Copier `app.js:643-673` (`showCustodyModal`). **Supprimer les lignes redondantes `app.js:674-680`** (4× `window.showCustodyModal = showCustodyModal`), en gardant un seul `export function showCustodyModal`.
- Dans `showCustodyModal`, `navigate('agenda')` et `closeM()` sont appelés : les obtenir via le pont global (défini en Task 16), donc ne pas les importer ici. Remplacer les appels directs par des appels via `window.navigate`/`window.closeM` n'est **pas** nécessaire — à la place, `renderMonthCalendar`/`showCustodyModal` restent identiques et `navigate` sera exposé sur `window` par `globals.js`. Le code copié utilise `navigate(...)` directement ; pour que ça compile en module, ajouter l'import suivant (cycle acceptable) :

```js
import { navigate } from '../nav.js';
import { closeM } from '../modal.js';
import { showModal } from '../modal.js';
```

- [ ] **Step 2: Vérifier** → `node --check js/screens/agenda.js` (aucune erreur).

- [ ] **Step 3: Commit**

```bash
git add js/screens/agenda.js
git commit -m "refactor: extrait l'écran Garde + corrige doublons showCustodyModal"
```

---

### Task 8: `js/screens/school.js`

**Files:**
- Create: `js/screens/school.js`

**Interfaces:**
- Consumes: `DB` depuis `../store.js` ; `fmtLong`, `daysUntil` depuis `../utils.js` ; `saveDB`, `cloudPushSettings` via imports (cf. ci-dessous).
- Produces: `export function renderSchool`.

- [ ] **Step 1: Créer `js/screens/school.js`**

Copier `app.js:516-527` (`renderSchool`). Le HTML généré contient des `onclick` inline (`DB.schoolDates.splice(...);saveDB();cloudPushSettings();render();`, `showSchoolEditModal()`). Ces chaînes restent **inchangées** (résolues au runtime via `window.*`). Ajouter `export` et les imports :

```js
import { DB } from '../store.js';
import { fmtLong, daysUntil } from '../utils.js';
```

- [ ] **Step 2: Vérifier** → `node --check js/screens/school.js` (aucune erreur).

- [ ] **Step 3: Commit**

```bash
git add js/screens/school.js
git commit -m "refactor: extrait l'écran École"
```

---

### Task 9: `js/screens/activites.js`

**Files:**
- Create: `js/screens/activites.js`

**Interfaces:**
- Consumes: `DB` depuis `../store.js` ; `fmtLong`, `activiteIcon` depuis `../utils.js`.
- Produces: `export function formatActiviteMeta`, `export function renderActivites`.

- [ ] **Step 1: Créer `js/screens/activites.js`**

- Copier `app.js:529-550` (`formatActiviteMeta`, `renderActivites`).
- **Nettoyage inclus** : extraire le tableau `const days = ['','Lundi',...]` répété 3 fois en une seule constante locale `const DAYS = [...]` utilisée par les trois `sort`.

- [ ] **Step 2: Vérifier** → `node --check js/screens/activites.js` (aucune erreur).

- [ ] **Step 3: Commit**

```bash
git add js/screens/activites.js
git commit -m "refactor: extrait l'écran Activités + déduplique les tris"
```

---

### Task 10: `js/screens/maison.js`

**Files:**
- Create: `js/screens/maison.js`

**Interfaces:**
- Consumes: `DB` depuis `../store.js` ; `fmtLong`, `fmtShort`, `daysUntil`, `apptIcon`, `isMedical` depuis `../utils.js`.
- Produces: `export function renderMaison`.

- [ ] **Step 1: Créer `js/screens/maison.js`**

Copier `app.js:682-696` (`renderMaison`), ajouter `export` et les imports ci-dessus.

- [ ] **Step 2: Vérifier** → `node --check js/screens/maison.js` (aucune erreur).

- [ ] **Step 3: Commit**

```bash
git add js/screens/maison.js
git commit -m "refactor: extrait l'écran Maison"
```

---

### Task 11: `js/screens/misc.js`

**Files:**
- Create: `js/screens/misc.js`

**Interfaces:**
- Consumes: `DB` depuis `../store.js` ; `fmtLong`, `fmtShort`, `todayISO`, `dateISO` depuis `../utils.js`.
- Produces: `export function renderDocs`, `export function renderContacts`, `export function renderDaily`, `export function renderPlus`, `export function renderClothingSizes`, `export function renderRecurringTasks`, `export function doRecurringTask`.

- [ ] **Step 1: Créer `js/screens/misc.js`**

- Copier `app.js:698-746` : `renderDocs`, `renderContacts`, `renderDaily`, `renderPlus`, `renderClothingSizes`, `renderRecurringTasks`, `doRecurringTask`.
- **Supprimer** `app.js:746` (`window.doRecurringTask = doRecurringTask`) — part dans `globals.js`.
- Ajouter les `export` et les imports. `doRecurringTask` appelle `saveDB`, `cloudPushSettings`, `render` : ajouter `import { saveDB } from '../store.js'; import { cloudPushSettings } from '../api.js'; import { render } from '../render.js';`.

- [ ] **Step 2: Vérifier** → `node --check js/screens/misc.js` (aucune erreur).

- [ ] **Step 3: Commit**

```bash
git add js/screens/misc.js
git commit -m "refactor: extrait les écrans Docs/Contacts/Quotidien/Plus"
```

---

### Task 12: `js/modal.js`

**Files:**
- Create: `js/modal.js`

**Interfaces:**
- Consumes: `DB`, `S`, `saveDB` depuis `./store.js` ; `uid`, `todayISO`, `fmtLong` depuis `./utils.js` ; `cloudPushSettings` depuis `./api.js` ; `getUpcomingSunday` depuis `./sundays.js` ; `render` depuis `./render.js` ; `toast` depuis `./ui.js`.
- Produces: `export function showModal`, `export function closeM`, et toutes les fonctions `showXxxModal` + `showSettings` + `showSchoolEditModal` (liste exacte ci-dessous).

- [ ] **Step 1: Créer `js/modal.js`**

Copier les blocs suivants en ajoutant `export` à chaque déclaration :
- `app.js:831-903` : `showModal`, `closeM`, `showDocModal`, `showMemoryModal`, `showExpenseModal`, `showApptModal`, `showVaccineModal`, `showGrowthModal`, `showContactModal`, `showSchoolDateModal`, `showMedicationModal`, `showSundayNoteModal`, `showSundayOverrideModal`, `showPapaApptModal`, `showToothModal`, `showClothingModal`, `showRecurringTaskModal`, `showFactureModal`, `showVehiculeModal`, `showRevenuModal`, `showAboModal`, `showContratModal`, `showActiviteModal`, `showExtraVisitModal`, `showPapaActiviteModal`, `showEnsembleActiviteModal`.
- `app.js:905-925` : `showSettings`, `showSchoolEditModal`.
- **Supprimer** `app.js:901` (`window.showExtraVisitModal = ...`), `app.js:925` (`window.showSchoolEditModal = ...`) — partent dans `globals.js`.
- Ajouter en tête :

```js
import { DB, S, saveDB } from './store.js';
import { uid, todayISO, fmtLong, daysUntil, childAge } from './utils.js';
import { cloudPushSettings } from './api.js';
import { getUpcomingSunday } from './sundays.js';
import { render } from './render.js';
import { toast } from './ui.js';
```

- [ ] **Step 2: Vérifier** → `node --check js/modal.js` (aucune erreur).

- [ ] **Step 3: Commit**

```bash
git add js/modal.js
git commit -m "refactor: extrait les modales et formulaires"
```

---

### Task 13: `js/ui.js`

**Files:**
- Create: `js/ui.js`

**Interfaces:**
- Consumes: `DB`, `S`, `saveDB` depuis `./store.js` ; `todayISO`, `dateISO`, `fmtLong`, `childAge`, `sha256`, `daysUntil` depuis `./utils.js` ; `cloudAuth`, `cloudSync` depuis `./api.js` ; `getUpcomingSunday` depuis `./sundays.js` ; `render` depuis `./render.js`.
- Produces: `export function toast`, `export function toggleDark`, `export function initDark`, `export function updateHeader`, `export function initAuthScreen`, `export async function doAuth`, `export function initLockHTML`, `export function showLockScreen`, `export async function verifyPin`, `export function unlockApp`, `export function lockApp`, `export function resetAutoLock`, `export function showEmergency`, `export async function scheduleReminders`, `export function checkYearAgo`, `export function bindGlobalEvents`.

- [ ] **Step 1: Créer `js/ui.js`**

Copier en ajoutant `export` :
- `app.js:961-966` (`toast`), `app.js:968-970` (`toggleDark`, `initDark`).
- `app.js:282-291` (`updateHeader`, `resetAutoLock`) + la variable `let lockTimer` (depuis `app.js:17`).
- `app.js:189-222` (`initAuthScreen`, `doAuth`).
- `app.js:224-280` (`initLockHTML`, `showLockScreen`, `verifyPin`, `unlockApp`, `lockApp`).
- `app.js:927-940` (`showEmergency`).
- `app.js:942-959` (`scheduleReminders`, `checkYearAgo`).
- **Renommage interne sûr** : `window._lp` (utilisé dans lock) devient un `let _lp` local au module — aucune référence extérieure.
- **Déplacer les side effects** : les `document.addEventListener('click'/'keydown'/'touchstart', resetAutoLock)` (actuellement `app.js:289-291`) deviennent une fonction exportée :

```js
export function bindGlobalEvents() {
  document.addEventListener('click', resetAutoLock);
  document.addEventListener('keydown', resetAutoLock);
  document.addEventListener('touchstart', resetAutoLock, { passive: true });
}
```

- [ ] **Step 2: Vérifier** → `node --check js/ui.js` (aucune erreur).

- [ ] **Step 3: Commit**

```bash
git add js/ui.js
git commit -m "refactor: extrait UI (verrou, auth, thème, notifications)"
```

---

### Task 14: `js/nav.js`

**Files:**
- Create: `js/nav.js`

**Interfaces:**
- Consumes: `S`, `DB` depuis `./store.js` ; `render`, `handleAction` depuis `./render.js` ; `showSettings` depuis `./modal.js` ; `showEmergency`, `toggleDark` depuis `./ui.js`.
- Produces: `export function initNav`, `export function navigate`, `export function initFab`, `export function updateFab`.

- [ ] **Step 1: Créer `js/nav.js`**

Copier `app.js:293-334` (`initNav`, `navigate`, `initFab`, `updateFab`), ajouter les `export`. `navigate` appelle `render()` et `updateFab()` (même module). `updateFab` référence `handleAction` (depuis `./render.js` — voir Task 15). Ajouter :

```js
import { S, DB } from './store.js';
import { render, handleAction } from './render.js';
import { showSettings } from './modal.js';
import { showEmergency, toggleDark } from './ui.js';
```

- [ ] **Step 2: Vérifier** → `node --check js/nav.js` (aucune erreur).

- [ ] **Step 3: Commit**

```bash
git add js/nav.js
git commit -m "refactor: extrait la navigation et le FAB"
```

---

### Task 15: `js/render.js`

**Files:**
- Create: `js/render.js`

**Interfaces:**
- Consumes: `S`, `DB`, `saveDB` depuis `./store.js` ; `cloudPushSettings` depuis `./api.js` ; tous les `renderXxx` depuis `./screens/*` ; toutes les `showXxxModal` depuis `./modal.js` ; `triggerScan` depuis `./api.js` ; `viewDocument` (local, cf. ci-dessous).
- Produces: `export function render`, `export function bindEvents`, `export function handleAction`, `export function getDocDisplay`, `export function viewDocument`.

- [ ] **Step 1: Créer `js/render.js`**

- Copier `app.js:336-353` (`render`) — le `switch` référence `renderHome`, `renderHealth`, `renderAgenda`, `renderSchool`, `renderActivites`, `renderMaison`, `renderPlus`, `renderDocs`, `renderContacts`, `renderDaily`.
- Copier `app.js:748-763` (`bindEvents`).
- Copier `app.js:765-779` (`handleAction`).
- Copier `app.js:813-829` (`getDocDisplay`, `viewDocument`) + **supprimer** `app.js:829` (`window.viewDocument = ...`).
- Ajouter en tête :

```js
import { S, DB, saveDB } from './store.js';
import { cloudPushSettings } from './api.js';
import { triggerScan } from './api.js';
import { renderHome } from './screens/home.js';
import { renderHealth } from './screens/health.js';
import { renderAgenda } from './screens/agenda.js';
import { renderSchool } from './screens/school.js';
import { renderActivites } from './screens/activites.js';
import { renderMaison } from './screens/maison.js';
import { renderDocs, renderContacts, renderDaily, renderPlus } from './screens/misc.js';
import {
  showMemoryModal, showExpenseModal, showApptModal, showVaccineModal, showGrowthModal,
  showContactModal, showSchoolDateModal, showMedicationModal, showSundayNoteModal,
  showPapaApptModal, showToothModal, showClothingModal, showRecurringTaskModal,
  showFactureModal, showVehiculeModal, showRevenuModal, showAboModal, showContratModal,
  showActiviteModal, showExtraVisitModal, showPapaActiviteModal, showEnsembleActiviteModal
} from './modal.js';
```

- [ ] **Step 2: Vérifier** → `node --check js/render.js` (aucune erreur).

- [ ] **Step 3: Commit**

```bash
git add js/render.js
git commit -m "refactor: extrait l'ordonnanceur de rendu et les actions"
```

---

### Task 16: `js/globals.js`

**Files:**
- Create: `js/globals.js`

**Interfaces:**
- Consumes: `DB`, `S`, `saveDB`, `delFrom` depuis `./store.js` ; `cloudPushSettings` depuis `./api.js` ; `render`, `viewDocument`, `doRecurringTask` (depuis `./screens/misc.js`) ; `navigate` depuis `./nav.js` ; `showSettings`, `showSchoolEditModal`, `showExtraVisitModal`, `showCustodyModal`, `showSundayOverrideModal`, `addApptForDate`, `exportData`.

- [ ] **Step 1: Créer `js/globals.js`** — le seul endroit où on touche `window` :

```js
import { DB, S, saveDB, delFrom } from './store.js';
import { cloudPushSettings } from './api.js';
import { render } from './render.js';
import { navigate } from './nav.js';
import { showSettings } from './modal.js';
import { showSchoolEditModal, showExtraVisitModal } from './modal.js';
import { showCustodyModal } from './screens/agenda.js';
import { showSundayOverrideModal } from './modal.js';
import { addApptForDate } from './screens/home.js';
import { viewDocument } from './render.js';
import { doRecurringTask } from './screens/misc.js';
import { exportData } from './main.js';

export function exposeGlobals() {
  window.DB = DB;
  window.S = S;
  window.saveDB = saveDB;
  window.delFrom = delFrom;
  window.cloudPushSettings = cloudPushSettings;
  window.render = render;
  window.navigate = navigate;
  window.showSettings = showSettings;
  window.showSchoolEditModal = showSchoolEditModal;
  window.showExtraVisitModal = showExtraVisitModal;
  window.showCustodyModal = showCustodyModal;
  window.showSundayOverrideModal = showSundayOverrideModal;
  window.addApptForDate = addApptForDate;
  window.viewDocument = viewDocument;
  window.doRecurringTask = doRecurringTask;
  window.exportData = exportData;
}
```

**Important** : `window.DB` doit rester synchronisé quand `DB` est réassigné (`loadDB()` dans `init`, `importData()`). Ajouter `window.DB = DB;` juste après chaque réassignation de `DB` dans `main.js` (Task 17).

- [ ] **Step 2: Vérifier** → `node --check js/globals.js` (aucune erreur).

- [ ] **Step 3: Commit**

```bash
git add js/globals.js
git commit -m "refactor: ajoute le pont window.* pour les onclick inline"
```

---

### Task 17: `js/main.js`

**Files:**
- Create: `js/main.js`

**Interfaces:**
- Consumes: tous les modules ci-dessus.
- Produces: `export function init`, `export function exportData`, `export function importData`.

- [ ] **Step 1: Créer `js/main.js`**

- Copier `app.js:972-1004` (`exportData`, `importData`). `exportData` supprime déjà `pinHash` avant export (conservé). `importData` réassigne `DB` : ajouter `window.DB = DB;` après le remplacement.
- Copier `app.js:1015-1039` (`init`) : après `DB = loadDB();` ajouter `window.DB = DB;`.
- Copier `app.js:1041` (`document.addEventListener('DOMContentLoaded', init)`) → remplacer par :

```js
import { CFG } from './config.js';
import { DB, S, loadDB, saveDB, defaultDB, resetDailyChecklists } from './store.js';
import { initNav } from './nav.js';
import { initLockHTML, showLockScreen, updateHeader, initDark, bindGlobalEvents, initAuthScreen } from './ui.js';
import { cloudSync } from './api.js';
import { exposeGlobals } from './globals.js';
import { render } from './render.js';

export function exportData() { /* copie app.js:973-979 */ }
export function importData() { /* copie app.js:982-1004 + window.DB = DB */ }

export async function init() {
  DB = loadDB();
  window.DB = DB;
  const def = defaultDB();
  DB.settings = { ...def.settings, ...DB.settings };
  DB.checklists = { ...def.checklists, ...DB.checklists };
  DB.school = { ...def.school, ...(DB.school || {}) };
  const arrDefaults = ['schoolItems', 'schoolDates', 'medications', 'shoppingList', 'sundayNotes', 'sundayOverrides', 'papaAppointments', 'papaNotes', 'teeth', 'clothingHistory', 'recurringTasks', 'factures', 'vehicule', 'revenus', 'abonnements', 'contrats', 'activites', 'extraVisits'];
  arrDefaults.forEach(k => { if (!DB[k]) DB[k] = []; if (Array.isArray(def[k]) && DB[k].length === 0) DB[k] = def[k]; });
  saveDB();
  S.token = localStorage.getItem('papaapp_token') || null;
  S.refresh = localStorage.getItem('papaapp_refresh') || null;
  exposeGlobals();
  initNav();
  initLockHTML();
  resetDailyChecklists();
  updateHeader();
  initDark();
  bindGlobalEvents();
  if (window.innerWidth >= 769) document.getElementById('app').classList.add('desktop-layout');
  if (S.token) { await cloudSync(); showLockScreen(); }
  else { initAuthScreen(); document.getElementById('authScreen').classList.remove('hidden'); }
}

if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', init);
```

Note : `CFG` n'est pas utilisé directement par `main.js` (les accès Supabase passent par `api.js`) — le retirer si inutilisé. `render` est importé car `init` ne l'appelle pas directement ; vérifier et retirer si inutile.

- [ ] **Step 2: Vérifier**

```powershell
node --check js/main.js
```
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add js/main.js
git commit -m "refactor: ajoute le point d'entrée main.js"
```

---

### Task 18: Basculer `index.html` et supprimer `app.js`

**Files:**
- Modify: `index.html:51`
- Delete: `app.js`

- [ ] **Step 1: Modifier `index.html`**

Remplacer la ligne 51 :

```html
<script src="/papaapp/app.js?v=13"></script>
```

par :

```html
<script type="module" src="/papaapp/js/main.js?v=14"></script>
```

- [ ] **Step 2: Supprimer `app.js`**

```powershell
Remove-Item -LiteralPath "app.js"
```

- [ ] **Step 3: Vérification statique de tout le graphe d'imports**

Un module peut passer `node --check` seul mais avoir un import mal orthographié. Vérifier que **tous** les imports se résolvent en lançant Node sur un point d'entrée. Comme `main.js` garde son accès à `document` derrière le garde `typeof document !== 'undefined'`, l'import ne doit **pas** déclencher d'accès DOM :

```powershell
node --input-type=module -e "await import('./js/main.js'); console.log('imports OK')"
```
Expected: `imports OK`, sans stack trace d'erreur.

- [ ] **Step 4: Commit**

```bash
git add index.html
git rm app.js
git commit -m "refactor: bascule sur les modules ES6"
```

---

### Task 19: Vérification fonctionnelle complète (manuel)

**Files:** aucun (vérification).

- [ ] **Step 1: Déployer** — `git push` (déclenche GitHub Pages), ou vérifier localement via `serve.ps1` corrigé (voir note).

- [ ] **Step 2: Ouvrir l'app et rafraîchir** — l'app doit charger sans erreur console (F12).

- [ ] **Step 3: Parcourir le checklist fonctionnel** :
  - [ ] Verrou : PIN demandé / déverrouillage OK.
  - [ ] Accueil : calendrier semaine, rappels, routines, courses, souvenirs affichés.
  - [ ] Santé : vaccins, RDV, croissance, médicaments, dents, contacts.
  - [ ] Garde : chiffres, calendrier mensuel, récap dimanches, modale de garde.
  - [ ] École : infos, dates, fournitures (checkboxes), contacts.
  - [ ] Activités : ensemble / Ayden / Papa.
  - [ ] Maison : dépenses, abonnements, contrats, véhicule.
  - [ ] FAB : ajout d'un élément dans chaque onglet.
  - [ ] Modales : ajouter puis supprimer un élément (ex. une dépense).
  - [ ] Mode sombre, urgence 🆘, paramètres ⚙️.
  - [ ] Export (Sauvegarder) → fichier JSON téléchargé.
  - [ ] Refresh → **toutes les données saisies toujours là** (règle n°2).

- [ ] **Step 4: Commit final si des corrections ont été faites.**

**Note serveur local (optionnel)** : `serve.ps1` n'envoie pas de `Content-Type`, ce qui casse les modules ES6 en local. Pour un test local, utiliser `server.ps1` (qui définit `.js = application/javascript`). Corriger `serve.ps1` est hors périmètre de ce chantier.
