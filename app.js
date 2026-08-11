/* ================================================================
   PapaApp v4 — Refonte propre
   Supabase REST API · PIN · PWA · Offline-first
   ================================================================ */

// ========== CONFIGURATION ==========
const CFG = {
  url: 'https://uvrazdcpymexbmlctdlh.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cmF6ZGNweW1leGJtbGN0ZGxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMjM3NjQsImV4cCI6MjEwMTc5OTc2NH0.glIiIF_qXgJwXHFJJacbeHhNeaDYk2cQaP-a8YZPSP0',
  bucket: 'documents',
  autoLockMs: 10 * 60 * 1000
};

// ========== ÉTAT GLOBAL ==========
let S = { token: null, refresh: null, screen: 'home', weekOffset: 0, fabOpen: false, calMonth: 0 };
let DB = null;
let lockTimer = null;

// ========== SERVICE WORKER ==========
// Pas de service worker — l'appli fonctionne sans

// ========== UTILITAIRES ==========
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const fmt = (d, opts) => d ? new Date(d).toLocaleDateString('fr-FR', opts) : '';
const fmtLong = d => fmt(d, { day: 'numeric', month: 'long', year: 'numeric' });
const fmtShort = d => fmt(d, { day: 'numeric', month: 'short' });
const fmtToday = () => new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const daysUntil = d => { if (!d) return 9999; const a = new Date(d), b = new Date(); a.setHours(0, 0, 0, 0); b.setHours(0, 0, 0, 0); return Math.ceil((a - b) / 86400000); };
const childAge = bd => Math.floor((Date.now() - new Date(bd)) / 31557600000);
const dateISO = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const todayISO = () => dateISO(new Date());
async function sha256(m) { const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(m)); return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join(''); }
const apptIcon = (t) => { const x = (t || '').toLowerCase(); if (x.includes('pédiatre') || x.includes('medecin') || x.includes('dentiste') || x.includes('ophtalmo') || x.includes('orl') || x.includes('kiné') || x.includes('vaccin') || x.includes('orthophoniste')) return '🩺'; if (x.includes('voiture') || x.includes('révision') || x.includes('contrôle')) return '🚗'; if (x.includes('coiffeur') || x.includes('barbier')) return '💇'; if (x.includes('admin') || x.includes('banque') || x.includes('impôt')) return '📋'; if (x.includes('travail') || x.includes('boulot')) return '💼'; return '📅'; };
const isMedical = (t) => { const x = (t || '').toLowerCase(); return x.includes('pédiatre') || x.includes('medecin') || x.includes('dentiste') || x.includes('ophtalmo') || x.includes('orl') || x.includes('kiné') || x.includes('vaccin') || x.includes('orthophoniste') || x.includes('hôpital') || x.includes('infirmier'); };
const activiteIcon = (t) => { const x = (t || '').toLowerCase(); if (x.includes('sport') || x.includes('foot') || x.includes('muscu')) return '⚽'; if (x.includes('musique') || x.includes('chant') || x.includes('piano')) return '🎵'; if (x.includes('danse')) return '💃'; if (x.includes('piscine') || x.includes('natation')) return '🏊'; if (x.includes('arts') || x.includes('dessin') || x.includes('peinture')) return '🎨'; if (x.includes('loisir') || x.includes('jeu')) return '🎮'; return '🎯'; };

// ========== DONNÉES LOCALES ==========
function defaultDB() {
  return {
    settings: { pinHash: null, name: '', childName: 'Ayden', childBirthDate: '2023-08-28', firstSundayDate: '', sundayInterval: 14, firstSundayNote: '' },
    documents: [], vaccines: [], appointments: [], growth: [], expenses: [], memories: [],
    contacts: [
      { _id: uid(), name: 'SAMU', specialty: 'Urgence', role: 'Urgences médicales', phone: '15', notes: '' },
      { _id: uid(), name: 'Pompiers', specialty: 'Urgence', role: 'Incendie, accident', phone: '18', notes: '' },
      { _id: uid(), name: 'Police', specialty: 'Urgence', role: 'Secours', phone: '17', notes: '' }
    ],
    checklists: {
      morning: [{ id: 'm1', label: 'Réveil & câlin' }, { id: 'm2', label: 'Brosser les dents' }, { id: 'm3', label: 'Petit-déjeuner' }, { id: 'm4', label: "S'habiller" }, { id: 'm5', label: 'Sac prêt' }, { id: 'm6', label: 'Doudou' }],
      evening: [{ id: 'e1', label: 'Bain / toilette' }, { id: 'e2', label: 'Brosser les dents' }, { id: 'e3', label: 'Pyjama' }, { id: 'e4', label: 'Histoire' }, { id: 'e5', label: 'Bonne nuit' }],
      sunday: [{ id: 's1', label: 'Doudou' }, { id: 's2', label: 'Change' }, { id: 's3', label: 'Gourde' }, { id: 's4', label: 'Carnet de santé' }, { id: 's5', label: 'Goûter' }, { id: 's6', label: 'Manteau' }]
    },
    school: { name: '', teacher: '', director: '', phone: '', address: '', startDate: '', notes: '' },
    schoolItems: [{ id: 'sc1', label: 'Cartable' }, { id: 'sc2', label: 'Gourde' }, { id: 'sc3', label: 'Blouse / tablier' }, { id: 'sc4', label: 'Chaussons' }, { id: 'sc5', label: 'Change complet' }, { id: 'sc6', label: 'Couches / culottes' }, { id: 'sc7', label: 'Doudou' }, { id: 'sc8', label: 'Tétine' }, { id: 'sc9', label: 'Marquer vêtements' }, { id: 'sc10', label: "Dossier d'inscription" }],
    schoolDates: [], medications: [], shoppingList: [], sundayNotes: [], sundayOverrides: [],
    papaAppointments: [], papaNotes: [], teeth: [], clothingHistory: [], recurringTasks: [], extraVisits: [], papaActivites: [], papaAydenActivites: [],
    factures: [], vehicule: [], revenus: [], abonnements: [], contrats: [], activites: [],
    _synced: false
  };
}

function loadDB() { try { const r = localStorage.getItem('papaapp_db'); return r ? JSON.parse(r) : defaultDB(); } catch (e) { return defaultDB(); } }
function saveDB() { localStorage.setItem('papaapp_db', JSON.stringify(DB)); }
function delFrom(arr, id) { const i = arr.findIndex(x => x._id === id); if (i < 0 || !confirm('Supprimer ?')) return; arr.splice(i, 1); saveDB(); cloudPushSettings(); render(); toast('🗑️ Supprimé'); }
window.delFrom = delFrom;
window.DB = DB;

// ========== SUPABASE API ==========
function sbHeaders() { const h = { apikey: CFG.key, 'Content-Type': 'application/json' }; if (S.token) h['Authorization'] = 'Bearer ' + S.token; return h; }
function cloudReady() { return !!S.token && navigator.onLine; }

async function cloudAuth(email, password, mode) {
  const ep = mode === 'signup' ? 'signup' : 'token?grant_type=password';
  const res = await fetch(`${CFG.url}/auth/v1/${ep}`, {
    method: 'POST', headers: { apikey: CFG.key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const json = await res.json();
  if (!res.ok) return { ok: false, error: json.msg || json.message || 'Erreur ' + res.status };
  if (mode === 'signup') return { ok: true, needsSignin: true };
  S.token = json.access_token; S.refresh = json.refresh_token;
  localStorage.setItem('papaapp_token', S.token);
  localStorage.setItem('papaapp_refresh', S.refresh);
  return { ok: true };
}

async function cloudSync() {
  if (!cloudReady()) return;
  try {
    // Fetch settings (which contains all data)
    const s = await fetch(`${CFG.url}/rest/v1/settings?select=*&limit=1`, { headers: sbHeaders() });
    const sd = await s.json();
    if (Array.isArray(sd) && sd[0]) {
      mergeCloudSettings(sd[0]);
      console.log('Sync OK, appointments from cloud:', DB.appointments.length);
    } else {
      console.log('Sync: no settings row found');
    }
    DB._synced = true; saveDB();
  } catch(e) { console.warn('Sync error:', e.message); }
}

function mapFromCloud(t, r) {
  const b = { _id: r.id };
  const m = {
    documents: { name: r.name, category: r.category, dateAdded: r.date_added, status: r.status || 'ok', notes: r.notes, scanUrl: r.scan_url, scanData: r.scan_data, fileType: r.file_type },
    vaccines: { name: r.name, ageMonths: r.age_months, done: r.done, dateDone: r.date_done },
    appointments: { type: r.type, doctor: r.doctor, date: r.date, time: r.time, notes: r.notes },
    growth: { date: r.date, weight: r.weight, height: r.height, notes: r.notes },
    expenses: { date: r.date, category: r.category, amount: r.amount, note: r.note },
    memories: { date: r.date, text: r.text, mood: r.mood || '💎' },
    contacts: { name: r.name, specialty: r.specialty, role: r.role, phone: r.phone, notes: r.notes }
  };
  return { ...b, ...(m[t] || r) };
}

function mergeCloudSettings(sd) {
  const s = DB.settings;
  if (sd.name) s.name = sd.name;
  if (sd.child_name) s.childName = sd.child_name;
  if (sd.child_birth_date) s.childBirthDate = sd.child_birth_date;
  if (sd.first_sunday_date) s.firstSundayDate = sd.first_sunday_date;
  if (sd.sunday_interval) s.sundayInterval = sd.sunday_interval;
  if (sd.first_sunday_note) s.firstSundayNote = sd.first_sunday_note;
  if (sd.checklists_state) try { DB.checklists = { ...DB.checklists, ...JSON.parse(sd.checklists_state) }; } catch (e) { }
  if (sd.school_data) try {
    const sc = JSON.parse(sd.school_data);
    const keys = ['school', 'dates', 'items', 'medications', 'shoppingList', 'sundayNotes', 'sundayOverrides', 'papaAppointments', 'papaNotes', 'teeth', 'clothingHistory', 'recurringTasks', 'factures', 'vehicule', 'revenus', 'abonnements', 'contrats', 'activites', 'extraVisits', 'papaActivites', 'papaAydenActivites', 'appointments', 'vaccines', 'documents', 'growth', 'expenses', 'memories', 'contacts'];
    for (const k of keys) {
      const key = k === 'dates' ? 'schoolDates' : k === 'items' ? 'schoolItems' : k;
      if (sc[k] !== undefined) {
        if (typeof DB[key] === 'object' && !Array.isArray(DB[key])) DB[key] = { ...DB[key], ...sc[k] };
        else DB[key] = sc[k];
      }
    }
  } catch (e) { }
}

async function cloudPushSettings() {
  if (!cloudReady()) { console.warn('Push skipped: not ready'); return; }
  try {
    const body = {
      name: DB.settings.name, child_name: DB.settings.childName,
      child_birth_date: DB.settings.childBirthDate,
      checklists_state: JSON.stringify(DB.checklists),
      school_data: JSON.stringify({
      school: DB.school, dates: DB.schoolDates, items: DB.schoolItems,
      medications: DB.medications, shoppingList: DB.shoppingList,
      sundayNotes: DB.sundayNotes, sundayOverrides: DB.sundayOverrides,
      papaAppointments: DB.papaAppointments, papaNotes: DB.papaNotes,
      teeth: DB.teeth, clothingHistory: DB.clothingHistory,
      recurringTasks: DB.recurringTasks, factures: DB.factures,
      vehicule: DB.vehicule, revenus: DB.revenus,
        abonnements: DB.abonnements, contrats: DB.contrats, activites: DB.activites, extraVisits: DB.extraVisits, papaActivites: DB.papaActivites, papaAydenActivites: DB.papaAydenActivites,
      appointments: DB.appointments, vaccines: DB.vaccines,
      documents: DB.documents, growth: DB.growth,
      expenses: DB.expenses, memories: DB.memories, contacts: DB.contacts
    })
  };
  // Try PATCH existing row first
    const r = await fetch(`${CFG.url}/rest/v1/settings?select=id&limit=1`, { headers: sbHeaders() });
    const data = await r.json();
    let res;
    if (Array.isArray(data) && data[0]) {
      res = await fetch(`${CFG.url}/rest/v1/settings?id=eq.${data[0].id}`, { method: 'PATCH', headers: { ...sbHeaders(), 'Prefer': 'return=minimal' }, body: JSON.stringify(body) });
    } else {
      // Insert: let user_id default to auth.uid()
      res = await fetch(`${CFG.url}/rest/v1/settings`, { method: 'POST', headers: { ...sbHeaders(), 'Prefer': 'return=minimal' }, body: JSON.stringify(body) });
    }
    if (!res.ok) console.warn('Push failed:', res.status, await res.text());
    else console.log('Push OK, appointments:', DB.appointments.length);
  } catch(e) { console.warn('Push error:', e.message); }
}

// ========== DIMANCHES ==========
function getNextSundays() {
  const fd = DB.settings.firstSundayDate;
  if (!fd) return [];
  const ref = new Date(fd), now = new Date(); now.setHours(0, 0, 0, 0);
  let d = new Date(ref);
  while (d <= now) d.setDate(d.getDate() + (DB.settings.sundayInterval || 14));
  const out = [];
  for (let i = 0; i < 4; i++) { out.push(new Date(d)); d.setDate(d.getDate() + (DB.settings.sundayInterval || 14)); }
  return out;
}
function getUpcomingSunday() { const s = getNextSundays(); return s.length ? s[0] : null; }

// ========== AUTH SCREEN ==========
function initAuthScreen() {
  if ($('#authScreen')) return;
  $('#app').insertAdjacentHTML('afterbegin', `
    <div class="lock-screen" id="authScreen">
      <div class="lock-icon">🛡️</div><div class="lock-title">PapaApp</div><div class="lock-sub">Connectez-vous</div>
      <div style="width:260px;display:flex;flex-direction:column;gap:10px;margin:12px 0;">
        <input type="email" id="authEmail" placeholder="Email" style="padding:12px 14px;border-radius:12px;border:1.5px solid #E8ECF0;font-size:15px;text-align:center;outline:none;">
        <input type="password" id="authPassword" placeholder="Mot de passe" style="padding:12px 14px;border-radius:12px;border:1.5px solid #E8ECF0;font-size:15px;text-align:center;outline:none;">
      </div>
      <div class="lock-error" id="authError"></div>
      <div style="display:flex;gap:10px;"><button class="btn btn-outline btn-sm" id="btnSignIn" style="width:120px;">Se connecter</button><button class="btn btn-primary btn-sm" id="btnSignUp" style="width:120px;">Créer un compte</button></div>
      <button class="btn btn-outline btn-sm" id="btnSkip" style="margin-top:16px;width:260px;">Continuer sans synchro</button>
    </div>`);
  $('#btnSignIn').onclick = () => doAuth('signin');
  $('#btnSignUp').onclick = () => doAuth('signup');
  $('#btnSkip').onclick = () => { $('#authScreen').classList.add('hidden'); showLockScreen(); };
  $('#authPassword').onkeydown = e => { if (e.key === 'Enter') doAuth('signin'); };
}

async function doAuth(mode) {
  const email = $('#authEmail').value.trim(), pw = $('#authPassword').value, err = $('#authError');
  if (!email || !pw) { err.textContent = 'Email et mot de passe requis'; return; }
  if (pw.length < 6) { err.textContent = '6 caractères minimum'; return; }
  err.textContent = 'Connexion...';
  let r = await cloudAuth(email, pw, mode);
  if (!r.ok) { err.textContent = r.error; return; }
  if (r.needsSignin) r = await cloudAuth(email, pw, 'signin');
  if (!r.ok) { err.textContent = r.error; return; }
  $('#authScreen').classList.add('hidden');
  await cloudSync();
  toast('☁️ Synchronisé');
  showLockScreen();
}

// ========== LOCK SCREEN ==========
function initLockHTML() {
  if ($('#lockScreen')) return;
  $('#app').insertAdjacentHTML('afterbegin', `
    <div class="lock-screen hidden" id="lockScreen">
      <div class="lock-icon">🔒</div><div class="lock-title" id="lockTitle">PapaApp</div><div class="lock-sub" id="lockSub">Entrez votre code PIN</div>
      <div class="pin-dots" id="pinDots"><div class="pin-dot"></div><div class="pin-dot"></div><div class="pin-dot"></div><div class="pin-dot"></div></div>
      <div class="lock-error" id="lockError"></div><div class="pin-pad" id="pinPad"></div>
    </div>`);
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].forEach(n => {
    const b = document.createElement('div');
    b.className = 'pin-key' + (n === '' ? ' empty' : n === '⌫' ? ' del' : '');
    b.textContent = n; $('#pinPad').appendChild(b);
  });
  window._lp = '';
  const dots = $$('#pinDots .pin-dot');
  $('#pinPad').onclick = async e => {
    const k = e.target.closest('.pin-key');
    if (!k || k.classList.contains('empty')) return;
    if (k.classList.contains('del')) { if (window._lp.length > 0) { window._lp = window._lp.slice(0, -1); dots[window._lp.length].classList.remove('filled', 'error'); } return; }
    if (window._lp.length < 4) { window._lp += k.textContent; dots[window._lp.length - 1].classList.add('filled'); if (window._lp.length === 4) verifyPin(window._lp); }
  };
}

function showLockScreen() {
  initLockHTML();
  $('#lockScreen').classList.remove('hidden');
  if (!DB.settings.pinHash) { $('#lockTitle').textContent = 'Bienvenue'; $('#lockSub').textContent = 'Choisissez un code PIN à 4 chiffres'; }
}

async function verifyPin(entry) {
  const dots = $$('#pinDots .pin-dot'), err = $('#lockError');
  if (!DB.settings.pinHash) { DB.settings.pinHash = await sha256(entry); saveDB(); unlockApp(); return; }
  if (await sha256(entry) === DB.settings.pinHash) { unlockApp(); return; }
  dots.forEach(d => { d.classList.add('error'); d.classList.remove('filled'); });
  err.textContent = 'Code incorrect';
  setTimeout(() => { dots.forEach(d => d.classList.remove('error', 'filled')); err.textContent = ''; window._lp = ''; }, 600);
}

function unlockApp() {
  $('#lockScreen').classList.add('hidden'); window._lp = '';
  $$('#pinDots .pin-dot').forEach(d => d.classList.remove('filled', 'error'));
  const er = $('#lockError'); if (er) er.textContent = '';
  resetAutoLock(); updateHeader();
  if (S.token) cloudSync().then(() => render());
  else render();
  scheduleReminders(); checkYearAgo();
}

function lockApp(reason) {
  if (!$('#lockScreen')) initLockHTML();
  $('#lockScreen').classList.remove('hidden'); window._lp = '';
  $$('#pinDots .pin-dot').forEach(d => d.classList.remove('filled', 'error'));
  const er = $('#lockError'); if (er) er.textContent = '';
  if (reason === 'inactivity') { $('#lockTitle').textContent = 'Verrouillé'; $('#lockSub').textContent = 'Inactivité'; }
  clearTimeout(lockTimer);
}

function updateHeader() {
  const n = DB.settings.name || 'Papa', a = childAge(DB.settings.childBirthDate);
  $('#headerTitle').textContent = DB.settings.name ? 'Salut ' + n : 'PapaApp';
  $('#headerSub').textContent = DB.settings.childName + ' · ' + a + ' an' + (a > 1 ? 's' : '');
}

function resetAutoLock() { clearTimeout(lockTimer); lockTimer = setTimeout(() => lockApp('inactivity'), CFG.autoLockMs); }
document.addEventListener('click', resetAutoLock);
document.addEventListener('keydown', resetAutoLock);
document.addEventListener('touchstart', resetAutoLock, { passive: true });

// ========== NAVIGATION ==========
function initNav() {
  $$('#bottomNav .nav-item').forEach(i => i.onclick = () => navigate(i.dataset.screen));
  $('#btnSettings').onclick = showSettings;
  $('#btnEmergency').onclick = showEmergency;
  $('#btnDark').onclick = toggleDark;
  $('#btnLock').onclick = () => lockApp('manual');
  initFab();
}

function navigate(s) {
  S.screen = s;
  render();
  $$('#bottomNav .nav-item').forEach(n => n.classList.toggle('active', n.dataset.screen === s === true));
  $('#screenContainer').scrollTop = 0;
  updateFab();
}

// ========== FAB ==========
function initFab() {
  const fab = $('#fab');
  if (!fab) return;
  fab.onclick = () => { S.fabOpen = !S.fabOpen; fab.classList.toggle('open', S.fabOpen); $('#fabMenu').classList.toggle('visible', S.fabOpen); };
  document.addEventListener('click', e => { if (S.fabOpen && !e.target.closest('#fab') && !e.target.closest('#fabMenu')) { S.fabOpen = false; fab.classList.remove('open'); $('#fabMenu').classList.remove('visible'); } });
}

function updateFab() {
  const m = $('#fabMenu');
  if (!m) return;
  const actions = [];
  const add = (e, t, a) => actions.push({ e, t, a });
  if (S.screen === 'home') { add('📸', 'Scanner', 'add-doc'); add('🩺', 'RDV Ayden', 'add-appointment'); add('👨', 'RDV Papa', 'add-papa-appt'); add('🧾', 'Dépense', 'add-expense'); add('📝', 'Souvenir', 'add-memory'); }
  if (S.screen === 'health') { add('🩺', 'RDV Ayden', 'add-appointment'); add('👨', 'Mon RDV', 'add-papa-appt'); add('💉', 'Vaccin', 'add-vaccine'); add('💊', 'Médicament', 'add-med'); add('📏', 'Croissance', 'add-growth'); add('🦷', 'Dent', 'add-tooth'); add('👤', 'Contact médical', 'add-contact'); }
  if (S.screen === 'agenda') { add('📝', 'Note dimanche', 'add-sunday-note'); add('🩺', 'RDV', 'add-appointment'); }
  if (S.screen === 'activites') { add('👨‍👦', 'Ensemble', 'add-ensemble-activite'); add('🎯', 'Ayden', 'add-activite'); add('👨', 'Papa', 'add-papa-activite'); }
  if (S.screen === 'school') { add('📅', 'Date école', 'add-school-date'); add('📸', 'Scanner doc', 'add-doc'); }
  if (S.screen === 'maison') { add('🧾', 'Dépense', 'add-expense'); add('📑', 'Abonnement', 'add-abo'); add('📋', 'Contrat', 'add-contrat'); add('🚗', 'Véhicule', 'add-vehicule'); add('📸', 'Scanner', 'add-doc'); }
  m.innerHTML = actions.map(a => `<button class="fab-action" data-action="${a.a}"><span>${a.e}</span> ${a.t}</button>`).join('');
  $$('.fab-action').forEach(b => {
    b.onclick = () => { S.fabOpen = false; $('#fab').classList.remove('open'); $('#fabMenu').classList.remove('visible'); handleAction(b.dataset.action); };
  });
}

// ========== RENDU ==========
function render() {
  let h = '';
  switch (S.screen) {
    case 'home': h = renderHome(); break;
    case 'health': h = renderHealth(); break;
    case 'agenda': h = renderAgenda(); break;
    case 'school': h = renderSchool(); break;
    case 'activites': h = renderActivites(); break;
    case 'maison': h = renderMaison(); break;
    case 'plus': h = renderPlus(); break;
    case 'docs': h = renderDocs(); break;
    case 'contacts': h = renderContacts(); break;
    case 'daily': h = renderDaily(); break;
  }
  $('#screenContainer').innerHTML = h;
  bindEvents();
}

// ----- HOME -----
function renderHome() {
  const s = DB.settings, age = childAge(s.childBirthDate);
  const today = todayISO();
  const todayAppts = DB.appointments.filter(a => a.date === today);
  const todayPapa = (DB.papaAppointments || []).filter(a => a.date === today);
  const todaySchool = (DB.schoolDates || []).filter(d => d.date === today);
  const isSundayMom = getNextSundays().some(d => dateISO(d) === today);
  const ns = getUpcomingSunday();
  const nv = DB.vaccines.find(v => !v.done);

  let todayInfo = [];
  if (todayAppts.length) todayInfo.push(todayAppts.map(a => '🩺 ' + a.type).join(', '));
  if (todayPapa.length) todayInfo.push('👨 ' + todayPapa.map(a => a.type).join(', '));
  if (todaySchool.length) todayInfo.push('🏫 ' + todaySchool.map(d => d.label).join(', '));
  if (isSundayMom) todayInfo.push('👩‍👦 Dimanche chez Maman');
  if (!todayInfo.length) todayInfo.push('✨ Journée libre');

  const reminders = [];
  if (nv) reminders.push(`💉 <b>${nv.name}</b>`);
  DB.appointments.filter(a => daysUntil(a.date) <= 7 && daysUntil(a.date) >= 0).forEach(a => reminders.push(`🩺 ${a.type} · ${fmtShort(a.date)}`));
  (DB.papaAppointments || []).filter(a => daysUntil(a.date) <= 3 && daysUntil(a.date) >= 0).forEach(a => reminders.push(`👨 ${a.type} · ${fmtShort(a.date)}`));
  (DB.schoolDates || []).filter(d => daysUntil(d.date) <= 7 && daysUntil(d.date) >= 0).forEach(d => reminders.push(`🏫 ${d.label} · ${fmtShort(d.date)}`));
  if (ns && daysUntil(ns) <= 3) reminders.push('🎒 Sac du dimanche');
  if (!reminders.length) reminders.push('✅ Rien de pressant');

  return `<div class="home-grid">
    <div class="hero-card" style="grid-column:1/-1;background:var(--card);"><div style="font-size:12px;color:var(--text-light);">${fmtToday()}</div><div style="font-size:20px;font-weight:800;margin:4px 0;">${s.childName}, ${age} an${age>1?'s':''}</div><div style="font-size:12px;color:var(--text-light);">${todayInfo.join(' · ')}</div></div>
    ${renderWeekCalendar()}
    <div class="stats-row" style="grid-column:1/-1;">
      <div class="stat-card"><div class="icon">💉</div><div class="val">${nv ? nv.name.split(' ')[0] : 'OK'}</div><div class="lbl">Vaccin</div></div>
      <div class="stat-card"><div class="icon">🏥</div><div class="val">${DB.appointments.filter(a => daysUntil(a.date) >= 0).length}</div><div class="lbl">RDV Ayden</div></div>
      <div class="stat-card"><div class="icon">👨</div><div class="val">${(DB.papaAppointments || []).filter(a => daysUntil(a.date) >= 0).length}</div><div class="lbl">RDV Papa</div></div>
    </div>
    ${ns ? `<div class="alert alert-info" style="grid-column:1/-1;">📅 Prochain dimanche Maman : <b>${fmtLong(ns)}</b> (${daysUntil(ns)}j)</div>` : (s.firstSundayDate ? `<div class="alert alert-info" style="grid-column:1/-1;">📅 Aucun dimanche prochainement</div>` : `<div class="alert alert-warn" style="grid-column:1/-1;cursor:pointer" onclick="showSettings()">⚠️ Configure les dimanches dans ⚙️</div>`)}
    <div class="card"><div class="card-title">🔔 Rappels</div><div style="font-size:13px;color:var(--text);line-height:2.2;">${reminders.join('<br>')}</div></div>
    <div class="card"><div class="card-title">🌅 Routines</div>
      <div style="font-size:11px;line-height:2;">${DB.checklists.morning.slice(0, 3).map(i => `<div class="cl-item" style="padding:2px 0;"><input type="checkbox" id="hm-${i.id}" ${i.checked ? 'checked' : ''} data-cl="morning" data-id="${i.id}" style="width:16px;height:16px;"><label for="hm-${i.id}" style="font-size:11px;">${i.label}</label></div>`).join('')}
      <div style="font-size:10px;color:var(--text-light);">+ ${DB.checklists.morning.length - 3} tâches</div></div>
    </div>
    <div class="card"><div class="card-title">🛒 Courses</div>
      <div style="font-size:11px;color:var(--text-light);">${(DB.shoppingList || []).filter(i => !i.checked).length} articles en attente</div>
      ${(DB.shoppingList || []).filter(i => !i.checked).slice(0, 3).map(i => `<div style="font-size:11px;">· ${i.label}</div>`).join('') || '<div style="font-size:11px;">Liste vide</div>'}
    </div>
    <div class="card" style="grid-column:1/-1;"><div class="card-title">📸 Derniers souvenirs</div>
      ${DB.memories.slice(-2).reverse().map((m, i) => `<div class="mem-card"><div class="mem-img c${(i % 3) + 1}">${m.mood || '💎'}</div><div class="mem-body"><div class="date">${fmtLong(m.date)}</div><div class="text">${m.text}</div></div></div>`).join('') || '<div class="empty"><div class="icon">📝</div><div class="title">Aucun souvenir</div></div>'}
    </div>
  </div>`;
}

function renderWeekCalendar() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const sow = new Date(today); sow.setDate(today.getDate() - today.getDay() + 1 + S.weekOffset * 7);
  const eow = new Date(sow); eow.setDate(sow.getDate() + 6);
  const dn = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const isCW = S.weekOffset === 0;
  let days = '';
  for (let i = 0; i < 7; i++) {
    const d = new Date(sow); d.setDate(d.getDate() + i);
    const ds = dateISO(d);
    const isToday = d.getTime() === today.getTime();
    const labels = [];
    DB.appointments.filter(a => a.date === ds).slice(0, 2).forEach(a => labels.push({ t: (a.time ? a.time + ' ' : '') + a.type, c: '#3A4AB5', bg: '#D0D4F5' }));
    (DB.papaAppointments || []).filter(a => a.date === ds).slice(0, 2).forEach(a => labels.push({ t: (a.time ? a.time + ' ' : '') + a.type, c: '#B06520', bg: '#FDE8D0' }));
    getNextSundays().filter(s => dateISO(s) === ds && d.getDay() === 0).forEach(() => labels.push({ t: 'Maman', c: '#A05060', bg: '#FDE0E5' }));
    (DB.extraVisits || []).filter(v => v.date === ds).forEach(v => labels.push({ t: 'Maman', c: '#A05060', bg: '#FDE0E5' }));
    (DB.schoolDates || []).filter(sd => sd.date === ds).forEach(sd => labels.push({ t: sd.label.slice(0, 8), c: '#408050', bg: '#D8F0E0' }));
    days += `<div style="flex:1;text-align:center;padding:10px 4px;border-radius:14px;cursor:pointer;min-width:0;${isToday ? (document.body.classList.contains('dark') ? 'background:#E8E2D8;color:#2A2722;font-weight:700;' : 'background:#4A4038;color:#fff;font-weight:700;') : i === 6 ? 'background:#FFF0F3;' : 'background:var(--card-alt);'}" class="${isToday ? 'cal-today' : ''}" onclick="addApptForDate('${ds}')">
      <div style="font-size:11px;font-weight:700;margin-bottom:4px;">${dn[i]}</div><div style="font-size:22px;font-weight:${isToday ? '800' : '600'};line-height:1;">${d.getDate()}</div>
      <div style="margin-top:6px;display:flex;flex-direction:column;gap:2px;">${labels.map(l => `<span style="font-size:9px;font-weight:700;padding:1px 5px;border-radius:5px;background:${l.bg};color:${l.c};overflow:hidden;text-overflow:ellipsis;">${l.t}</span>`).join('')}</div>
      ${!labels.length ? `<div style="margin-top:6px;font-size:16px;opacity:0.3;">+</div>` : ''}
    </div>`;
  }
  return `<div class="card" style="grid-column:1/-1;padding:14px 12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <button class="btn-lock" style="width:30px;height:30px;" onclick="event.stopPropagation();S.weekOffset--;render();">◀</button>
      <span style="font-size:14px;font-weight:700;">${fmtLong(sow)} – ${fmtLong(eow)}${isCW ? ' (cette semaine)' : ''}</span>
      <button class="btn-lock" style="width:30px;height:30px;" onclick="event.stopPropagation();S.weekOffset++;render();">▶</button>
    </div>
    <div style="display:flex;gap:4px;">${days}</div>
    <div style="display:flex;justify-content:space-around;margin-top:6px;font-size:8px;color:var(--text-light);"><span>🔵 Ayden</span><span>🟠 Papa</span><span>🔴 Maman</span><span>🟢 École</span></div>
  </div>`;
}
window.addApptForDate = d => showApptModal(d);

// ----- HEALTH -----
function renderHealth() {
  const v = DB.vaccines.sort((a, b) => a.ageMonths - b.ageMonths);
  const a = DB.appointments.sort((a, b) => daysUntil(a.date) - daysUntil(b.date));
  const g = DB.growth;
  const lw = g.length ? g[g.length - 1].weight : null;
  return `<div class="agenda-grid">
    <div class="card" style="grid-column:1/-1;background:var(--card);border:1px solid var(--border);"><div class="card-title">👨‍👦 ${DB.settings.childName}</div></div>
    <div class="card"><div class="card-title">💉 Vaccins</div>${v.length ? `<div class="timeline">${v.map(vx => `<div class="tl-item ${vx.done ? 'done' : ''}"><div class="tl-date">${vx.ageMonths} mois ${vx.done ? '✓' : ''}</div><div class="tl-title">${vx.name}</div>${vx.dateDone ? `<div class="tl-info">${fmtLong(vx.dateDone)}</div>` : '<span class="badge badge-urgent">À faire</span>'}</div>`).join('')}</div>` : '<div class="empty"><div class="sub">Aucun vaccin</div></div>'}<button class="btn btn-outline btn-full btn-sm" style="margin-top:8px" data-action="add-vaccine">+ Vaccin</button></div>
    <div class="card"><div class="card-title">📅 RDV</div>${a.filter(x => daysUntil(x.date) >= 0).map(x => `<div class="doc-item"><div class="doc-icon">${apptIcon(x.type)}</div><div class="doc-info"><div class="name">${x.doctor} · ${x.type}${x.time ? ' ' + x.time : ''}</div><div class="meta">${x.notes || ''}</div></div><span class="badge badge-${daysUntil(x.date) <= 3 ? 'urgent' : 'ok'}">${fmtShort(x.date)}</span><button class="btn-del" onclick="event.stopPropagation();delFrom(DB.appointments,'${x._id}')">×</button></div>`).join('') || '<div class="empty"><div class="sub">Aucun RDV</div></div>'}<button class="btn btn-outline btn-full btn-sm" style="margin-top:8px" data-action="add-appointment">+ RDV</button></div>
    <div class="card"><div class="card-title">📈 Croissance</div>${g.length ? `<div>Poids: ${g[g.length - 1].weight}kg | Taille: ${g[g.length - 1].height}cm</div><div style="font-size:11px;color:var(--text-light);">${fmtLong(g[g.length - 1].date)}</div><div style="display:flex;gap:2px;align-items:flex-end;height:40px;margin-top:8px;">${g.slice(-10).map(m => { const mx = Math.max(...g.map(x => x.weight || 0), 1); return `<div style="flex:1;text-align:center;"><div style="width:100%;background:var(--primary);border-radius:2px 2px 0 0;height:${(m.weight / mx * 100)}%;min-height:3px;"></div><div style="font-size:7px;color:var(--text-light);">${fmtShort(m.date)}</div></div>`; }).join('')}</div>` : '<div class="empty"><div class="sub">Aucune mesure</div></div>'}<button class="btn btn-outline btn-full btn-sm" style="margin-top:8px" data-action="add-growth">+ Mesure</button></div>
    <div class="card"><div class="card-title">💊 Médicaments</div>${(DB.medications || []).length ? DB.medications.map(m => { const dose = m.perKg && lw ? Math.round(m.perKg * lw * 10) / 10 : ''; return `<div class="doc-item"><div class="doc-icon">💊</div><div class="doc-info"><div class="name">${m.name}</div><div class="meta">${m.freq || ''}${dose ? ' · ' + dose + ' ' + (m.unit || 'ml') + ' (~' + lw + 'kg)' : ''} · ${m.notes || ''}</div></div><button class="btn-del" onclick="event.stopPropagation();delFrom(DB.medications,'${m._id}')">×</button></div>`; }).join('') : '<div class="empty"><div class="sub">Ajoute les médicaments</div></div>'}<button class="btn btn-outline btn-full btn-sm" style="margin-top:8px" data-action="add-med">+ Médicament</button></div>
    <div class="card"><div class="card-title">🦷 Dents</div>${(DB.teeth || []).length ? DB.teeth.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).map(t => `<div class="doc-item"><div class="doc-icon">🦷</div><div class="doc-info"><div class="name">${t.name}</div><div class="meta">${fmtLong(t.date)}${t.notes ? ' · ' + t.notes : ''}</div></div><button class="btn-del" onclick="event.stopPropagation();delFrom(DB.teeth,'${t._id}')">×</button></div>`).join('') : '<div class="empty"><div class="sub">Suis la poussée des dents</div></div>'}<button class="btn btn-outline btn-full btn-sm" style="margin-top:8px" data-action="add-tooth">+ Dent</button></div>
    <div class="card" style="grid-column:1/-1;"><div class="card-title">👨 Papa</div></div>
    <div class="card"><div class="card-title">📅 Mes RDV santé</div>${(DB.papaAppointments || []).filter(x => daysUntil(x.date) >= 0 && isMedical(x.type)).sort((a, b) => daysUntil(a.date) - daysUntil(b.date)).map(x => `<div class="doc-item"><div class="doc-icon">${apptIcon(x.type)}</div><div class="doc-info"><div class="name">${x.type}${x.time ? ' ' + x.time : ''}</div><div class="meta">${x.doctor || ''} · ${x.notes || ''}</div></div><span class="badge badge-${daysUntil(x.date) <= 3 ? 'urgent' : 'ok'}">${fmtShort(x.date)}</span><button class="btn-del" onclick="event.stopPropagation();delFrom(DB.papaAppointments,'${x._id}')">×</button></div>`).join('') || '<div class="empty"><div class="sub">Ajoute tes RDV médicaux</div></div>'}<button class="btn btn-outline btn-full btn-sm" style="margin-top:8px" data-action="add-papa-appt">+ Mon RDV</button></div>
    <div class="card"><div class="card-title">👨‍⚕️ Contacts médicaux</div>
      ${DB.contacts.filter(c => ['SAMU', 'Pompiers', 'Police'].includes(c.name)).map(c => `<div class="doc-item"><div class="doc-icon">${c.name === 'SAMU' ? '🏥' : c.name === 'Pompiers' ? '🚒' : '👮'}</div><div class="doc-info"><div class="name">${c.name}</div><div class="meta">${c.role}</div></div><a href="tel:${c.phone}" style="font-weight:700;color:var(--danger);text-decoration:none;">${c.phone}</a></div>`).join('')}
      ${DB.contacts.filter(c => c.specialty && !['SAMU', 'Pompiers', 'Police'].includes(c.name)).map(c => `<div class="doc-item"><div class="doc-icon">${c.specialty === 'Pédiatre' ? '🩺' : c.specialty === 'Dentiste' ? '🦷' : c.specialty === 'Ophtalmo' ? '👁️' : '💊'}</div><div class="doc-info"><div class="name">${c.name}</div><div class="meta">${c.specialty} · ${c.phone}</div></div><a href="tel:${c.phone}" style="font-weight:600;color:var(--primary);text-decoration:none;">📞</a><button class="btn-del" onclick="event.stopPropagation();delFrom(DB.contacts,'${c._id}')">×</button></div>`).join('') || '<div class="empty"><div class="sub">Ajoute pédiatre, dentiste...</div></div>'}
      <button class="btn btn-outline btn-full btn-sm" style="margin-top:8px" data-action="add-contact">+ Contact</button></div>
  </div>`;
}

// ----- AGENDA -----
function renderAgenda() {
  const s = DB.settings, sundays = getNextSundays();
  const pastCount = (() => { const fd = s.firstSundayDate; if (!fd) return 0; const ref = new Date(fd), now = new Date(); now.setHours(0, 0, 0, 0); let d = new Date(ref), count = 0; while (d < now) { if (d.getDay() === 0) count++; d.setDate(d.getDate() + (s.sundayInterval || 14)); } return count; })();
  // Build list of automatic Sunday dates to distinguish them from manual extras
  const autoSundays = (() => { const fd = s.firstSundayDate; if (!fd) return []; const ref = new Date(fd), now = new Date(); now.setHours(0,0,0,0); let d = new Date(ref); const list=[]; while (d < now) { if (d.getDay()===0) list.push(dateISO(d)); d.setDate(d.getDate()+(s.sundayInterval||14)); } return list; })();
  const overs = DB.sundayOverrides || [];
  const cancelledAuto = overs.filter(o => autoSundays.includes(o.date) && o.cancelled).length;
  const cancelledExtra = overs.filter(o => !autoSundays.includes(o.date) && o.cancelled).length + (DB.extraVisits||[]).filter(v=>v.cancelled).length;
  const totalCancelled = cancelledAuto + cancelledExtra;
  const extraDays = overs.filter(o => !autoSundays.includes(o.date) && !o.cancelled).length + (DB.extraVisits||[]).filter(v=>!v.cancelled).length;
  const effectiveSundays = pastCount - cancelledAuto;
  return `<div class="agenda-grid">
    <div class="card" style="grid-column:1/-1;"><div class="card-title">📊 En chiffres</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;text-align:center;">
        <div><div style="font-size:18px;font-weight:800;">${effectiveSundays}</div><div style="font-size:10px;color:var(--text-light);">Dimanches</div></div>
        <div><div style="font-size:18px;font-weight:800;color:var(--danger);">${totalCancelled}</div><div style="font-size:10px;color:var(--text-light);">Annulés</div></div>
        <div><div style="font-size:18px;font-weight:800;">${extraDays}</div><div style="font-size:10px;color:var(--text-light);">Jours supp.</div></div>
        <div><div style="font-size:18px;font-weight:800;color:var(--accent);">${effectiveSundays + extraDays}</div><div style="font-size:10px;color:var(--text-light);">Effectués</div></div>
      </div></div>
    ${renderMonthCalendar()}
    ${renderPastSundays()}
  </div>`;
}

function renderPastSundays() {
  const today = todayISO(), fd = DB.settings.firstSundayDate;
  if (!fd) return '';
  const iv = DB.settings.sundayInterval || 14;
  const ref = new Date(fd), now = new Date(today); now.setHours(0, 0, 0, 0);
  const past = [];
  let d = new Date(ref);
  while (d < now) {
    const ds = dateISO(d);
    if (d.getDay() === 0) {
      const ov = (DB.sundayOverrides || []).find(o => o.date === ds) || {};
      const sn = (DB.sundayNotes || []).find(n => n.date === ds);
      past.push({ dateStr: ds, note: sn ? sn.note : '', time: ov.time || DB.settings.firstSundayNote || '', cancelled: ov.cancelled });
    }
    d.setDate(d.getDate() + iv);
  }
  if (!past.length) return '';
  const lastAll = past.reverse();
  const shown = lastAll.slice(0, 10);
  const more = lastAll.length > 10;
  const cancelledSundays = past.filter(p => p.cancelled).length;
  const cancelledExtra = (DB.extraVisits || []).filter(v => v.cancelled).length;
  const totalCancelled = cancelledSundays + cancelledExtra;
  return `<div class="card" style="grid-column:1/-1;"><div class="card-title">📊 Récap des dimanches passés</div>
    ${shown.map(p => `<div class="doc-item" onclick="showSundayOverrideModal('${p.dateStr}')" style="cursor:pointer;"><div class="doc-icon">${p.cancelled ? '❌' : '✅'}</div><div class="doc-info"><div class="name">${fmtLong(p.dateStr)}</div><div class="meta">${p.cancelled ? 'Annulé' + (p.note ? ': ' + p.note : '') : (p.time || '')}${!p.cancelled && p.note ? ' · ' + p.note : ''}</div></div></div>`).join('')}
    ${more ? `<details style="margin-top:8px;"><summary style="cursor:pointer;font-size:12px;font-weight:600;color:var(--primary);">Voir les ${lastAll.length - 10} dimanches précédents</summary><div style="margin-top:6px;">${lastAll.slice(10).map(p => `<div class="doc-item" onclick="showSundayOverrideModal('${p.dateStr}')" style="cursor:pointer;"><div class="doc-icon">${p.cancelled ? '❌' : '✅'}</div><div class="doc-info"><div class="name">${fmtLong(p.dateStr)}</div><div class="meta">${p.cancelled ? 'Annulé' + (p.note ? ': ' + p.note : '') : (p.time || '')}${!p.cancelled && p.note ? ' · ' + p.note : ''}</div></div></div>`).join('')}</div></details>` : ''}
    <div style="font-size:11px;color:var(--text-light);text-align:center;">Total: ${past.length} dimanche${past.length > 1 ? 's' : ''} · Annulés: ${totalCancelled > 0 ? totalCancelled : 0} (${cancelledSundays} dim. + ${cancelledExtra} autres)</div></div>`;
}

// ----- SCHOOL -----
function renderSchool() {
  const sc = DB.school || {}, dates = DB.schoolDates || [], items = DB.schoolItems || [];
  const done = items.filter(i => i.checked).length, pct = items.length ? Math.round(done / items.length * 100) : 0;
  return `<div class="agenda-grid">
    <div class="hero-card" style="grid-column:1/-1;cursor:pointer;" onclick="showSchoolEditModal()"><div style="font-size:18px;font-weight:800;">🏫 ${sc.name || 'Mon école'} ${!sc.name ? '— clique pour configurer' : ''}</div><div style="font-size:12px;opacity:0.9;">${sc.teacher ? '👩‍🏫 ' + sc.teacher + ' · ' : ''}${sc.startDate ? 'Rentrée ' + fmtLong(sc.startDate) : ''}</div></div>
    ${sc.name ? `<div class="card"><div class="card-title">📋 Infos <button class="btn-del" style="margin-left:auto;" onclick="event.stopPropagation();showSchoolEditModal()">✏️</button></div><div style="font-size:13px;line-height:2;">${sc.director ? '<div><b>Directeur:</b> ' + sc.director + '</div>' : ''}${sc.phone ? '<div><a href="tel:' + sc.phone + '" style="color:var(--primary);text-decoration:none;">📞 ' + sc.phone + '</a></div>' : ''}${sc.address ? '<div>📍 ' + sc.address + '</div>' : ''}${sc.notes ? '<div style="color:var(--text-light);">💬 ' + sc.notes + '</div>' : ''}</div></div>` : ''}
    <div class="card"><div class="card-title">📅 Dates clés</div>${dates.length ? dates.sort((a, b) => daysUntil(a.date) - daysUntil(b.date)).map((d, i) => `<div class="doc-item"><div class="doc-icon">${daysUntil(d.date) < 0 ? '✅' : daysUntil(d.date) <= 3 ? '🔔' : '📅'}</div><div class="doc-info"><div class="name">${d.label}</div><div class="meta">${fmtLong(d.date)}${daysUntil(d.date) >= 0 ? ' · ' + daysUntil(d.date) + 'j' : ' (passé)'}</div></div><button class="btn-del" onclick="event.stopPropagation();DB.schoolDates.splice(${i},1);saveDB();cloudPushSettings();render();">×</button></div>`).join('') : '<div class="empty"><div class="sub">Rentrée, vacances, réunions...</div></div>'}<button class="btn btn-outline btn-full btn-sm" style="margin-top:8px" data-action="add-school-date">+ Date</button></div>
    <div class="card"><div class="card-title">🎒 Fournitures</div><div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;"><div class="progress" style="flex:1;margin:0;"><div class="fill ${pct === 100 ? '' : pct < 30 ? 'danger' : 'warn'}" style="width:${pct}%"></div></div><span style="font-size:12px;font-weight:700;">${done}/${items.length}</span></div>${items.map(i => `<div class="cl-item"><input type="checkbox" id="sc-${i.id}" ${i.checked ? 'checked' : ''} data-cl="schoolItems" data-id="${i.id}"><label for="sc-${i.id}">${i.label}</label></div>`).join('')}</div>
    <div class="card"><div class="card-title">📞 Contacts école</div>${sc.phone || sc.director ? `<div class="doc-item"><div class="doc-icon">🏫</div><div class="doc-info"><div class="name">${sc.name || 'École'}</div><div class="meta">${sc.director ? 'Directeur: ' + sc.director + ' · ' : ''}${sc.phone || ''}${sc.address ? ' · ' + sc.address : ''}</div></div>${sc.phone ? '<a href="tel:' + sc.phone + '" style="font-weight:600;color:var(--primary);text-decoration:none;">📞</a>' : ''}</div>` : ''}${DB.contacts.filter(c => c.specialty === 'Crèche' || (c.role || '').toLowerCase().includes('école')).map(c => `<div class="doc-item"><div class="doc-icon">👤</div><div class="doc-info"><div class="name">${c.name}</div><div class="meta">${c.role || ''} · ${c.phone || ''}</div></div><a href="tel:${c.phone}" style="font-weight:600;color:var(--primary);text-decoration:none;">📞</a></div>`).join('') || (!sc.phone ? '<div class="empty"><div class="sub">Ajoute dans ⚙️ ou Contacts</div></div>' : '')}</div>
  </div>`;
}

// ----- MAISON -----
function formatActiviteMeta(a) { if (a.recurring) return `🔄 Chaque ${a.day || '?'} · ${a.time || ''}${a.lieu ? ' · ' + a.lieu : ''}${a.coach ? ' · ' + a.coach : ''}${a.notes ? ' · ' + a.notes : ''}`; return `📅 ${a.date ? fmtLong(a.date) : ''} · ${a.time || ''}${a.lieu ? ' · ' + a.lieu : ''}${a.coach ? ' · ' + a.coach : ''}${a.notes ? ' · ' + a.notes : ''}`; }

function renderActivites() {
  const actAyden = (DB.activites || []).sort((a, b) => { const days = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']; return days.indexOf(a.day || '') - days.indexOf(b.day || ''); });
  const actPapa = (DB.papaActivites || []).sort((a, b) => { const days = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']; return days.indexOf(a.day || '') - days.indexOf(b.day || ''); });
  const actEnsemble = (DB.papaAydenActivites || []).sort((a, b) => { const days = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']; return days.indexOf(a.day || '') - days.indexOf(b.day || ''); });
  return `<div class="agenda-grid">
    <div class="card" style="grid-column:1/-1;"><div class="card-title">👨‍👦 Ensemble</div></div>
    <div class="card"><div class="card-title">🎯 Activités à deux</div>
      ${actEnsemble.length ? actEnsemble.map(a => `<div class="doc-item"><div class="doc-icon">${activiteIcon(a.type)}</div><div class="doc-info"><div class="name">${a.label}</div><div class="meta">${a.day || ''} ${a.time || ''} · ${a.lieu || ''}${a.notes ? ' · ' + a.notes : ''}</div></div><button class="btn-del" onclick="event.stopPropagation();delFrom(DB.papaAydenActivites,'${a._id}')">×</button></div>`).join('') : '<div class="empty"><div class="sub">Parc, sorties, balades...</div></div>'}
      <button class="btn btn-outline btn-full btn-sm" style="margin-top:8px" data-action="add-ensemble-activite">+ Activité</button></div>
    <div class="card" style="grid-column:1/-1;"><div class="card-title">👦 ${DB.settings.childName}</div></div>
    <div class="card"><div class="card-title">🎯 Ses activités</div>
      ${actAyden.length ? actAyden.map(a => `<div class="doc-item"><div class="doc-icon">${activiteIcon(a.type)}</div><div class="doc-info"><div class="name">${a.label}</div><div class="meta">${formatActiviteMeta(a)}</div></div><button class="btn-del" onclick="event.stopPropagation();delFrom(DB.activites,'${a._id}')">×</button></div>`).join('') : '<div class="empty"><div class="sub">Foot, piscine, danse...</div></div>'}
      <button class="btn btn-outline btn-full btn-sm" style="margin-top:8px" data-action="add-activite">+ Activité</button></div>
    <div class="card" style="grid-column:1/-1;"><div class="card-title">👨 Papa</div></div>
    <div class="card"><div class="card-title">🎯 Mes activités</div>
      ${actPapa.length ? actPapa.map(a => `<div class="doc-item"><div class="doc-icon">${activiteIcon(a.type)}</div><div class="doc-info"><div class="name">${a.label}</div><div class="meta">${formatActiviteMeta(a)}</div></div><button class="btn-del" onclick="event.stopPropagation();delFrom(DB.papaActivites,'${a._id}')">×</button></div>`).join('') : '<div class="empty"><div class="sub">Sport, musique, loisirs...</div></div>'}
      <button class="btn btn-outline btn-full btn-sm" style="margin-top:8px" data-action="add-papa-activite">+ Mon activité</button></div>
  </div>`;
}


function renderMonthCalendar() {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const displayDate = new Date(now.getFullYear(), now.getMonth() + S.calMonth, 1);
  const year = displayDate.getFullYear(), month = displayDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday=0
  const daysInMonth = lastDay.getDate();
  const today = dateISO(new Date());

  // Build custody map: determine who has Ayden on each day
  const custodyMap = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const ds = dateISO(date);
    custodyMap[ds] = 'papa'; // default: Papa
  }

  // Mark automatic Sundays
  const sundayDates = getNextSundays().map(s => dateISO(s));
  // Also generate ALL sundays for this month (past and future)
  const fd = DB.settings.firstSundayDate;
  if (fd) {
    const ref = new Date(fd);
    const iv = DB.settings.sundayInterval || 14;
    // Go backwards to find sundays in this month too
    let d = new Date(ref);
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    while (d <= monthEnd) {
      const ds = dateISO(d);
      if (d >= monthStart && d.getDay() === 0) {
        const ov = (DB.sundayOverrides || []).find(o => o.date === ds) || {};
        if (ov.cancelled) custodyMap[ds] = 'cancelled';
        else custodyMap[ds] = 'maman';
      }
      d.setDate(d.getDate() + iv);
    }
  }

  // Mark extra visits
  (DB.extraVisits || []).forEach(v => {
    if (v.date && v.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) {
      if (v.cancelled) custodyMap[v.date] = 'cancelled';
      else custodyMap[v.date] = 'extra';
    }
  });

  // Apply manual overrides from sundayOverrides
  (DB.sundayOverrides || []).forEach(o => {
    if (o.date && o.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) {
      if (o.cancelled) custodyMap[o.date] = 'cancelled';
      else if (o.who === 'Maman') custodyMap[o.date] = 'maman';
      else if (o.who === 'Papy/Mamie') custodyMap[o.date] = 'papy';
      else custodyMap[o.date] = 'other';
    }
  });

  const headers = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  let html = '<div class="cal-month">' + headers.map(h => `<div class="cal-month-header">${h}</div>`).join('');

  // Empty cells before first day
  for (let i = 0; i < startDow; i++) html += '<div class="cal-day cal-day-empty"></div>';

  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const type = custodyMap[ds] || 'papa';
    const isToday = ds === today;
    const cls = `cal-day cal-day-${type}${isToday ? ' cal-day-today' : ''}`;
    html += `<div class="${cls}" onclick="showCustodyModal('${ds}','${type}')">${d}<div style="font-size:7px;margin-top:-2px;">${type === 'maman' ? 'Ma' : type === 'extra' ? '+' : type === 'cancelled' ? '✕' : type === 'papy' ? 'PM' : type === 'other' ? '?' : ''}</div></div>`;
  }

  html += '</div>';

  return `<div class="card" style="grid-column:1/-1;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
      <button class="btn-lock" style="width:30px;height:30px;" onclick="event.stopPropagation();S.calMonth--;render();">◀</button>
      <span style="font-size:14px;font-weight:700;color:var(--text);">${displayDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
      <button class="btn-lock" style="width:30px;height:30px;" onclick="event.stopPropagation();S.calMonth++;render();">▶</button>
    </div>
    ${html}
    <div style="display:flex;gap:12px;margin-top:10px;font-size:11px;color:var(--text-light);justify-content:center;">
      <span>🔴 Maman</span><span>🟢 Papy/Mamie</span><span>⚫ Annulé</span>
    </div>
  </div>`;
}




function showCustodyModal(dateStr, currentType) {
  const existingOv = (DB.sundayOverrides || []).find(o => o.date === dateStr);
  const savedWho = existingOv ? (existingOv.who || 'Maman') : 'Maman';
  const savedNote = existingOv ? (existingOv.note || '') : '';
  const isCancelled = currentType === 'cancelled';
  const isSet = currentType !== 'papa';

  showModal(fmtLong(dateStr), [
    { id: 'who', l: 'Ayden est chez...', t: 'sel', opts: ['Maman', 'Papy/Mamie', 'Tata/Tonton', 'Autre'] },
    { id: 'cancelled', l: 'Annulé ?', t: 'sel', opts: ['Non', 'Oui'] },
    { id: 'note', l: 'Note', p: '' },
    { id: 'reset', t: 'btn', x: '<button type="button" class="btn btn-outline btn-sm btn-full" onclick="event.preventDefault();DB.sundayOverrides=(DB.sundayOverrides||[]).filter(o=>o.date!==' + "'" + dateStr + "'" + ');saveDB();cloudPushSettings();navigate(' + "'agenda'" + ');closeM();toast(' + "'Remis par défaut'" + ')" style="margin-top:8px;">↩ Remettre par défaut (Papa)</button>' }
  ], function(d) {
    var isCanc = d.cancelled === 'Oui';
    var who = d.who || 'Maman';
    DB.sundayOverrides = (DB.sundayOverrides || []).filter(function(o) { return o.date !== dateStr; });
    DB.sundayOverrides.push({ date: dateStr, who: who, note: d.note || '', cancelled: isCanc });
    saveDB(); cloudPushSettings();
    closeM();
    setTimeout(function() { navigate('agenda'); toast(isCanc ? 'Annulé' : 'Chez ' + who); }, 50);
  });

  setTimeout(function() {
    var elW = document.getElementById('fm-who');
    var elC = document.getElementById('fm-cancelled');
    var elN = document.getElementById('fm-note');
    if (elW) elW.value = isSet ? savedWho : 'Maman';
    if (elC) elC.value = isCancelled ? 'Oui' : 'Non';
    if (elN) elN.value = savedNote;
  }, 150);
}
window.showCustodyModal = showCustodyModal;

window.showCustodyModal = showCustodyModal;

window.showCustodyModal = showCustodyModal;

window.showCustodyModal = showCustodyModal;

function renderMaison() {
  const now = new Date(), mois = now.toISOString().slice(0, 7);
  const depensesMois = DB.expenses.filter(e => e.date && e.date.startsWith(mois)).reduce((s, e) => s + (e.amount || 0), 0);
  const aboMois = (DB.abonnements || []).reduce((s, a) => s + (a.amount || 0), 0);
  return `<div class="agenda-grid">
    <div class="card" style="grid-column:1/-1;"><div class="card-title">📊 Dépenses — ${now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</div><div style="text-align:center;margin-bottom:10px;"><div style="font-size:32px;font-weight:800;">${depensesMois}€</div><div style="font-size:11px;color:var(--text-light);">ce mois-ci</div></div>${DB.expenses.filter(e => e.date && e.date.startsWith(mois)).slice(-6).reverse().map(e => `<div class="doc-item"><div style="flex:1;font-size:12px;"><b>${e.category}</b>${e.note ? ' · ' + e.note : ''}</div><div style="font-size:12px;font-weight:600;margin-right:8px;">${e.amount}€</div><div style="font-size:10px;color:var(--text-light);">${fmtShort(e.date)}</div><button class="btn-del" onclick="event.stopPropagation();delFrom(DB.expenses,'${e._id}')">×</button></div>`).join('') || '<div class="empty"><div class="sub">Aucune dépense ce mois</div></div>'}<button class="btn btn-outline btn-full btn-sm" style="margin-top:8px" data-action="add-expense">+ Dépense</button></div>
    <div class="card"><div class="card-title">📑 Abonnements ${aboMois > 0 ? `<span style="font-size:11px;font-weight:400;color:var(--text-light);">${aboMois}€/mois</span>` : ''}</div>${(DB.abonnements || []).length ? DB.abonnements.map(a => `<div class="doc-item"><div class="doc-icon">📑</div><div class="doc-info"><div class="name">${a.label}</div><div class="meta">${a.amount}€/mois · ${a.notes || ''}</div></div><button class="btn-del" onclick="event.stopPropagation();delFrom(DB.abonnements,'${a._id}')">×</button></div>`).join('') : '<div class="empty"><div class="sub">Netflix, Spotify, forfait...</div></div>'}<button class="btn btn-outline btn-full btn-sm" style="margin-top:8px" data-action="add-abo">+ Abonnement</button></div>
    <div class="card"><div class="card-title">📋 Contrats</div>${(DB.contrats || []).length ? DB.contrats.sort((a, b) => (a.echeance || '').localeCompare(b.echeance || '')).map(c => `<div class="doc-item"><div class="doc-icon">${c.echeance && daysUntil(c.echeance) <= 30 ? '🔔' : '📋'}</div><div class="doc-info"><div class="name">${c.label}</div><div class="meta">${c.montant ? c.montant + ' · ' : ''}Échéance: ${fmtLong(c.echeance)}${c.echeance && daysUntil(c.echeance) <= 30 ? ' · <span style="color:var(--danger);">dans ' + daysUntil(c.echeance) + 'j</span>' : ''}</div></div><button class="btn-del" onclick="event.stopPropagation();delFrom(DB.contrats,'${c._id}')">×</button></div>`).join('') : '<div class="empty"><div class="sub">Assurance, loyer, mutuelle...</div></div>'}<button class="btn btn-outline btn-full btn-sm" style="margin-top:8px" data-action="add-contrat">+ Contrat</button></div>
    <div class="card"><div class="card-title">🚗 Véhicule</div>${(DB.vehicule || []).length ? DB.vehicule.sort((a, b) => (a.nextDue || '').localeCompare(b.nextDue || '')).map(v => `<div class="doc-item"><div class="doc-icon">🚗</div><div class="doc-info"><div class="name">${v.label}</div><div class="meta">${v.nextDue ? 'Prochain: ' + fmtLong(v.nextDue) : ''}${v.nextDue && daysUntil(v.nextDue) <= 7 ? ' <span class="badge badge-urgent">' + daysUntil(v.nextDue) + 'j</span>' : ''}</div></div><button class="btn-del" onclick="event.stopPropagation();delFrom(DB.vehicule,'${v._id}')">×</button></div>`).join('') : '<div class="empty"><div class="sub">Contrôle technique, révision...</div></div>'}<button class="btn btn-outline btn-full btn-sm" style="margin-top:8px" data-action="add-vehicule">+ Véhicule</button></div>
    <div class="card" onclick="navigate('docs')" style="cursor:pointer;grid-column:1/-1;"><div class="card-title">📂 Documents</div><div style="font-size:12px;color:var(--text-light);">${DB.documents.length} document${DB.documents.length > 1 ? 's' : ''}</div></div>
    <div class="card"><div class="card-title">📅 Mes RDV / Événements</div>
      ${(DB.papaAppointments || []).filter(x => daysUntil(x.date) >= 0 && !isMedical(x.type)).sort((a, b) => daysUntil(a.date) - daysUntil(b.date)).map(x => `<div class="doc-item"><div class="doc-icon">${apptIcon(x.type)}</div><div class="doc-info"><div class="name">${x.type}${x.time ? ' ' + x.time : ''}</div><div class="meta">${x.doctor || ''} · ${x.notes || ''}</div></div><span class="badge badge-${daysUntil(x.date) <= 3 ? 'urgent' : 'ok'}">${fmtShort(x.date)}</span><button class="btn-del" onclick="event.stopPropagation();delFrom(DB.papaAppointments,'${x._id}')">×</button></div>`).join('') || '<div class="empty" style="padding:8px"><div class="sub">Voiture, admin, travail...</div></div>'}
    </div>
  </div>`;
}

// ----- DOCS, CONTACTS, DAILY, PLUS -----
function renderDocs() {
  return `<div class="card"><div class="card-title">📂 Documents</div>${DB.documents.length ? DB.documents.map(d => `<div class="doc-item"><div class="doc-icon">${getDocDisplay(d)}</div><div class="doc-info"><div class="name">${d.name}${d.fileType === 'pdf' ? ' (PDF)' : ''}</div><div class="meta">${d.category} · ${d.notes || fmtLong(d.dateAdded)}</div></div><span class="badge badge-${d.status === 'warn' ? 'warn' : 'ok'}">${d.status === 'warn' ? '⚠️' : '✓'}</span><button class="btn-del" onclick="event.stopPropagation();delFrom(DB.documents,'${d._id}')">×</button></div>`).join('') : '<div class="empty"><div class="icon">📂</div><div class="title">Aucun document</div><div class="sub">Scanne ou importe PDF, images...</div></div>'}<button class="btn btn-primary btn-full" style="margin-top:8px" data-action="add-doc">📎 Importer</button></div>`;
}

function renderContacts() {
  const em = DB.contacts.filter(c => ['SAMU', 'Pompiers', 'Police'].includes(c.name));
  const med = DB.contacts.filter(c => c.specialty && !em.includes(c));
  const other = DB.contacts.filter(c => !em.includes(c) && !med.includes(c));
  return `<div class="card"><div class="card-title">🆘 Urgences</div>${em.map(c => `<div class="doc-item"><div class="doc-icon">${c.name === 'SAMU' ? '🏥' : c.name === 'Pompiers' ? '🚒' : '👮'}</div><div class="doc-info"><div class="name">${c.name}</div><div class="meta">${c.role}</div></div><a href="tel:${c.phone}" style="font-weight:700;color:var(--danger);text-decoration:none;">${c.phone}</a></div>`).join('')}</div>
    <div class="card"><div class="card-title">👨‍⚕️ Médical</div>${med.length ? med.map(c => `<div class="doc-item"><div class="doc-icon">${c.specialty === 'Pédiatre' ? '🩺' : c.specialty === 'Dentiste' ? '🦷' : c.specialty === 'Ophtalmo' ? '👁️' : '💊'}</div><div class="doc-info"><div class="name">${c.name}</div><div class="meta">${c.specialty} · ${c.phone}${c.notes ? ' · ' + c.notes : ''}</div></div><a href="tel:${c.phone}" style="font-weight:600;color:var(--primary);text-decoration:none;">📞</a><button class="btn-del" onclick="event.stopPropagation();delFrom(DB.contacts,'${c._id}')">×</button></div>`).join('') : '<div class="empty"><div class="sub">Aucun contact médical</div></div>'}</div>
    <div class="card"><div class="card-title">👥 Autres</div>${other.length ? other.map(c => `<div class="doc-item"><div class="doc-icon">👤</div><div class="doc-info"><div class="name">${c.name}</div><div class="meta">${c.role}${c.notes ? ' · ' + c.notes : ''}</div></div><a href="tel:${c.phone}" style="font-weight:600;color:var(--primary);text-decoration:none;">📞</a><button class="btn-del" onclick="event.stopPropagation();delFrom(DB.contacts,'${c._id}')">×</button></div>`).join('') : '<div class="empty"><div class="sub">Ajoute tes contacts</div></div>'}<button class="btn btn-outline btn-full btn-sm" style="margin-top:8px" data-action="add-contact">+ Contact</button></div>`;
}

function renderDaily() {
  return `<div class="card"><div class="card-title">🌅 Matin</div>${DB.checklists.morning.map(i => `<div class="cl-item"><input type="checkbox" id="mor-${i.id}" ${i.checked ? 'checked' : ''} data-cl="morning" data-id="${i.id}"><label for="mor-${i.id}">${i.label}</label></div>`).join('')}</div>
    <div class="card"><div class="card-title">🌙 Soir</div>${DB.checklists.evening.map(i => `<div class="cl-item"><input type="checkbox" id="eve-${i.id}" ${i.checked ? 'checked' : ''} data-cl="evening" data-id="${i.id}"><label for="eve-${i.id}">${i.label}</label></div>`).join('')}</div>
    <div class="card"><div class="card-title">🛒 Courses</div>${(DB.shoppingList || []).length ? DB.shoppingList.map((it, i) => `<div class="cl-item"><input type="checkbox" id="shop-${i}" ${it.checked ? 'checked' : ''} data-cl="shopping" data-idx="${i}"><label for="shop-${i}">${it.label}</label><button class="btn-del" onclick="event.stopPropagation();DB.shoppingList.splice(${i},1);saveDB();cloudPushSettings();render();">×</button></div>`).join('') : '<div class="empty"><div class="sub">Ajoute des articles</div></div>'}<div style="display:flex;gap:8px;margin-top:8px;"><input type="text" id="shopInput" placeholder="Article" style="flex:1;padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-size:13px;"><button class="btn btn-primary btn-sm" id="shopAdd">+</button></div></div>
    <div class="card"><div class="card-title">👕 Tailles de ${DB.settings.childName}</div>${renderClothingSizes()}<button class="btn btn-outline btn-full btn-sm" style="margin-top:8px" data-action="add-clothing">+ Vêtement</button></div>
    <div class="card"><div class="card-title">🔁 Tâches récurrentes</div>${renderRecurringTasks()}<button class="btn btn-outline btn-full btn-sm" style="margin-top:8px" data-action="add-recurring">+ Tâche</button></div>
    <div class="card"><div class="card-title">💎 Journal</div>${DB.memories.slice(-5).reverse().map((m, i) => `<div class="mem-card"><div class="mem-img c${(i % 3) + 1}">${m.mood || '💎'}</div><div class="mem-body"><div class="date">${fmtLong(m.date)}</div><div class="text">${m.text}</div></div></div>`).join('') || '<div class="empty"><div class="sub">Aucun souvenir</div></div>'}<button class="btn btn-outline btn-full btn-sm" style="margin-top:4px" data-action="add-memory">+ Souvenir</button></div>`;
}

function renderPlus() {
  return `<div class="card" onclick="navigate('daily')" style="cursor:pointer;"><div class="card-title">🌿 Quotidien</div><div style="font-size:12px;color:var(--text-light);">Routines, courses, journal, tailles, tâches</div></div>
    <div class="card" onclick="navigate('docs')" style="cursor:pointer;"><div class="card-title">📂 Documents</div><div style="font-size:12px;color:var(--text-light);">Scans, papiers administratifs</div></div>
    <div class="card" onclick="navigate('contacts')" style="cursor:pointer;"><div class="card-title">📞 Contacts</div><div style="font-size:12px;color:var(--text-light);">Urgences, médecin, crèche, famille</div></div>
    <div class="card" onclick="showSettings()" style="cursor:pointer;"><div class="card-title">⚙️ Paramètres</div><div style="font-size:12px;color:var(--text-light);">Profil, dimanches, école, PIN</div></div>
    <div class="card" onclick="exportData()" style="cursor:pointer;"><div class="card-title">📤 Sauvegarder</div><div style="font-size:12px;color:var(--text-light);">Télécharger une copie de toutes tes données</div></div>`;
}

function renderClothingSizes() {
  const ch = (DB.clothingHistory || []).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  if (!ch.length) return '<div class="empty"><div class="sub">Ajoute la taille actuelle</div></div>';
  const latest = {}; ch.forEach(c => { if (!latest[c.category]) latest[c.category] = c; });
  return `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">${Object.entries(latest).map(([cat, c]) => `<div style="background:var(--primary-light);border-radius:12px;padding:8px 14px;text-align:center;"><div style="font-size:10px;color:var(--text-light);font-weight:600;">${cat}</div><div style="font-size:16px;font-weight:800;color:var(--primary);">${c.size || '?'}</div></div>`).join('')}</div>${ch.slice(0, 3).map(c => `<div class="doc-item"><div style="flex:1;font-size:11px;"><b>${c.category}:</b> ${c.item || c.size}${c.outgrown ? ' <span style="color:var(--danger);">(trop petit)</span>' : ''}</div><div style="font-size:10px;color:var(--text-light);">${fmtShort(c.date)}</div><button class="btn-del" onclick="event.stopPropagation();delFrom(DB.clothingHistory,'${c._id}')">×</button></div>`).join('')}`;
}

function renderRecurringTasks() {
  const tasks = (DB.recurringTasks || []).sort((a, b) => (a.nextDue || '').localeCompare(b.nextDue || ''));
  if (!tasks.length) return '<div class="empty"><div class="sub">Ajoute des tâches récurrentes</div></div>';
  return tasks.map(t => { const overdue = new Date(t.nextDue) < new Date(todayISO()); return `<div class="cl-item"><input type="checkbox" id="rt-${t._id}" ${t.lastDone === todayISO() ? 'checked' : ''} onchange="doRecurringTask('${t._id}',this.checked)"><label for="rt-${t._id}">${t.label} <span style="font-size:10px;color:${overdue ? 'var(--danger)' : 'var(--text-light)'};">${overdue ? '⚠️ ' : ''}${fmtShort(t.nextDue)} (${t.freq})</span></label><button class="btn-del" onclick="event.stopPropagation();delFrom(DB.recurringTasks,'${t._id}')">×</button></div>`; }).join('');
}
function doRecurringTask(id, checked) {
  const t = (DB.recurringTasks || []).find(x => x._id === id); if (!t) return;
  if (checked) { t.lastDone = todayISO(); const nd = new Date(); nd.setDate(nd.getDate() + t.intervalDays); t.nextDue = dateISO(nd); }
  saveDB(); cloudPushSettings(); render();
}
window.doRecurringTask = doRecurringTask;

// ========== EVENTS ==========
function bindEvents() {
  // Checkboxes
  $$('input[type=checkbox]').forEach(cb => {
    cb.addEventListener('change', () => {
      const cl = cb.dataset.cl;
      if (cl === 'schoolItems') { const it = (DB.schoolItems || []).find(i => i.id === cb.dataset.id); if (it) { it.checked = cb.checked; saveDB(); cloudPushSettings(); } }
      else if (cl === 'shopping') { const idx = parseInt(cb.dataset.idx); if (DB.shoppingList && DB.shoppingList[idx]) { DB.shoppingList[idx].checked = cb.checked; saveDB(); cloudPushSettings(); } }
      else { const it = DB.checklists[cl]?.find(i => i.id === cb.dataset.id); if (it) { it.checked = cb.checked; saveDB(); cloudPushSettings(); } }
    });
  });
  const sa = $('#shopAdd'), si = $('#shopInput');
  if (sa && si) { sa.onclick = () => { const v = si.value.trim(); if (!v) return; if (!DB.shoppingList) DB.shoppingList = []; DB.shoppingList.push({ label: v, checked: false }); si.value = ''; saveDB(); cloudPushSettings(); render(); }; si.onkeydown = e => { if (e.key === 'Enter') sa.click(); }; }
  // All data-action buttons
  $$('[data-action]').forEach(b => { b.addEventListener('click', () => { const a = b.dataset.action; if (a) handleAction(a); }); });
}

function handleAction(a) {
  const actions = {
    'add-memory': showMemoryModal, 'add-expense': showExpenseModal, 'add-appointment': showApptModal,
    'add-doc': triggerScan, 'add-vaccine': showVaccineModal, 'add-growth': showGrowthModal,
    'add-contact': showContactModal, 'add-school-date': showSchoolDateModal,
    'add-med': showMedicationModal, 'add-sunday-note': showSundayNoteModal,
    'add-papa-appt': showPapaApptModal, 'add-tooth': showToothModal,
    'add-clothing': showClothingModal, 'add-recurring': showRecurringTaskModal,
    'add-facture': showFactureModal, 'add-vehicule': showVehiculeModal,
    'add-revenu': showRevenuModal, 'add-abo': showAboModal, 'add-contrat': showContratModal,
    'add-activite': showActiviteModal, 'add-extra-visit': () => showExtraVisitModal(), 'add-extra-visit-new': () => showExtraVisitModal(),
    'add-papa-activite': showPapaActiviteModal, 'add-ensemble-activite': showEnsembleActiviteModal
  };
  if (actions[a]) actions[a]();
}

// ========== SCAN & DOCUMENTS ==========
function triggerScan() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*,.pdf,application/pdf'; inp.capture = 'environment';
  inp.onchange = () => { if (inp.files[0]) uploadAndShowDoc(inp.files[0]); };
  inp.click();
}

async function uploadAndShowDoc(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const isImg = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  const fileType = isImg ? 'image' : ext === 'pdf' ? 'pdf' : 'file';
  const fileName = uid() + '.' + ext;
  toast('Upload en cours...');
  try {
    const headers = { apikey: CFG.key, Authorization: 'Bearer ' + S.token };
    let blob = file;
    if (isImg && file.size > 200000) { try { blob = await compressImage(file); } catch (e) { } }
    const res = await fetch(CFG.url + '/storage/v1/object/' + CFG.bucket + '/' + fileName, { method: 'POST', headers, body: blob });
    if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Upload failed'); }
    const publicUrl = CFG.url + '/storage/v1/object/public/' + CFG.bucket + '/' + fileName;
    showDocModal(publicUrl, file.name, fileType);
  } catch (e) { toast('Erreur upload: ' + (e.message || '')); }
}

async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image(), canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
    img.onload = () => { const maxW = 1200; let w = img.width, h = img.height; if (w > maxW) { h = h * maxW / w; w = maxW; } canvas.width = w; canvas.height = h; ctx.drawImage(img, 0, 0, w, h); canvas.toBlob(b => { if (b) resolve(b); else reject(new Error('compress failed')); }, 'image/jpeg', 0.8); };
    img.onerror = reject; img.src = URL.createObjectURL(file);
  });
}

function getDocDisplay(d) {
  if (d.scanUrl || d.scanData) {
    const src = d.scanUrl || d.scanData;
    return '<div onclick="event.stopPropagation();viewDocument(\x27' + d._id + '\x27)" style="cursor:pointer;display:flex;align-items:center;gap:6px;">' + (d.fileType === 'image' ? '<img src="' + src + '" style="width:32px;height:32px;border-radius:6px;object-fit:cover;">' : d.fileType === 'pdf' ? '&#128213;' : '&#128206;') + '<span style="font-size:11px;color:var(--primary);">Voir</span></div>';
  }
  return '&#128196;';
}

function viewDocument(id) {
  const d = DB.documents.find(x => x._id === id); if (!d) return;
  const src = d.scanUrl || d.scanData; if (!src) return;
  if (d.fileType === 'image') {
    const h = '<div class="modal-overlay" id="docViewer" onclick="this.remove()"><div class="modal" style="text-align:center;padding:20px;" onclick="event.stopPropagation()"><h3>' + d.name + '</h3><img src="' + src + '" style="max-width:100%;max-height:60vh;border-radius:12px;margin:12px 0;"><br><button class="btn btn-outline btn-sm" onclick="document.getElementById(\x27docViewer\x27).remove()">Fermer</button></div></div>';
    document.getElementById('app').insertAdjacentHTML('beforeend', h);
  } else { window.open(src, '_blank'); }
}
window.viewDocument = viewDocument;

// ========== MODALS ==========
function showModal(title, fields, cb) {
  const ex = $('#modalOverlay'); if (ex) ex.remove();
  let inputsHtml = fields.map(f => {
    if (f.t === 'btn') return f.x || '';
    let input = '';
    if (f.t === 'sel') { input = '<select id="fm-' + f.id + '" style="width:100%;padding:12px 14px;border-radius:12px;border:1.5px solid var(--border);font-size:14px;color:var(--text);background:var(--card-alt);outline:none;">' + (f.opts || []).map(o => '<option>' + o + '</option>').join('') + '</select>'; }
    else if (f.t === 'ta') { input = '<textarea id="fm-' + f.id + '" placeholder="' + (f.p || '') + '"></textarea>'; }
    else { input = '<input type="' + (f.t || 'text') + '" id="fm-' + f.id + '" placeholder="' + (f.p || '') + '">'; }
    return '<div class="form-group"><label>' + f.l + '</label>' + input + (f.x || '') + '</div>';
  }).join('');
  $('#app').insertAdjacentHTML('beforeend', '<div class="modal-overlay" id="modalOverlay"><div class="modal"><h3>' + title + '</h3>' + inputsHtml + '<div class="modal-btns"><button class="btn btn-outline" id="mCancel">Annuler</button><button class="btn btn-primary" id="mSave">Enregistrer</button></div></div></div>');
  $('#modalOverlay').onclick = e => { if (e.target === $('#modalOverlay')) closeM(); };
  $('#mCancel').onclick = closeM;
  $('#mSave').onclick = () => { const d = {};     fields.forEach(f => { if (f.t !== 'btn') d[f.id] = $('#fm-' + f.id).value; }); cb(d); closeM(); };
}
function closeM() { const m = $('#modalOverlay'); if (m) m.remove(); }

function showDocModal(scan, fileName, fileType) {
  const defCat = S.screen === 'health' ? 'Santé' : S.screen === 'school' ? 'École' : S.screen === 'maison' ? 'Maison' : 'Autre';
  showModal('Nouveau document', [{ id: 'name', l: 'Nom', p: fileName || 'Document' }, { id: 'category', l: 'Catégorie', p: 'Santé, École, Maison...' }, { id: 'notes', l: 'Notes', p: '' }], d => {
    const it = { _id: uid(), name: d.name || fileName || 'Document', category: d.category || defCat, dateAdded: new Date().toISOString().slice(0, 10), status: 'ok', notes: d.notes, scanUrl: scan, fileType: fileType || 'file' };
    DB.documents.push(it); saveDB(); cloudPushSettings(); render(); toast('Document enregistré');
  });
  setTimeout(() => { const el = $('#fm-category'); if (el) el.value = defCat; }, 100);
}

function showMemoryModal() { showModal('Nouveau souvenir', [{ id: 'date', l: 'Date', t: 'date' }, { id: 'text', l: 'Texte', t: 'ta', p: 'Premier mot, anecdote...' }, { id: 'mood', l: 'Émoji', p: '😂🥰😭', x: '<small style="font-size:11px;color:#999;">Vide = 💎</small>' }], d => { const it = { _id: uid(), date: d.date || todayISO(), text: d.text, mood: d.mood || '💎' }; DB.memories.unshift(it); saveDB(); cloudPushSettings(); render(); toast('Souvenir enregistré'); }); }

function showExpenseModal() { showModal('Nouvelle dépense', [{ id: 'date', l: 'Date', t: 'date' }, { id: 'category', l: 'Catégorie', p: 'Alimentation...' }, { id: 'amount', l: 'Montant (€)', t: 'number', p: '0' }, { id: 'note', l: 'Note', p: '' }], d => { const it = { _id: uid(), date: d.date || todayISO(), category: d.category || 'Divers', amount: parseFloat(d.amount) || 0, note: d.note }; DB.expenses.push(it); saveDB(); cloudPushSettings(); render(); toast('Dépense ajoutée'); }); }

function showApptModal(preDate) {
  const aydenTypes = ['Pédiatre', 'Dentiste', 'Ophtalmo', 'ORL', 'Vaccin', 'Kiné', 'Orthophoniste', 'Urgence', 'Autre'];
  const papaTypes = ['Médecin traitant', 'Dentiste', 'Ophtalmo', 'Coiffeur / Barbier', 'Kiné', 'Voiture', 'Admin', 'Travail', 'Sport', 'Autre'];
  showModal('Nouveau RDV', [{ id: 'date', l: 'Date début', t: 'date' }, { id: 'endDate', l: 'Date fin (si plage)', t: 'date' }, { id: 'who', l: 'Qui ?', t: 'sel', opts: ['Ayden', 'Papa'] }, { id: 'type', l: 'Type', t: 'sel', opts: aydenTypes }, { id: 'time', l: 'Heure', t: 'sel', opts: ['', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '13:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'] }, { id: 'doctor', l: 'Docteur / Lieu', p: '' }, { id: 'notes', l: 'Notes', p: '' }], d => {
    const who = d.who || 'Ayden', type = d.type || 'Autre';
    const item = { _id: uid(), type, who, doctor: d.doctor || '', date: d.date, endDate: d.endDate || '', time: d.time || '', notes: d.notes || '' };
    if (who === 'Papa') { if (!DB.papaAppointments) DB.papaAppointments = []; DB.papaAppointments.push(item); }
    else { DB.appointments.push(item); }
    saveDB(); cloudPushSettings(); render(); toast(who === 'Papa' ? 'RDV Papa' : 'RDV Ayden');
  });
  if (preDate) setTimeout(() => { const el = $('#fm-date'); if (el) el.value = preDate; }, 100);
  setTimeout(() => { const whoSel = $('#fm-who'), typeSel = $('#fm-type'); if (whoSel && typeSel) { whoSel.onchange = () => { typeSel.innerHTML = (whoSel.value === 'Papa' ? papaTypes : aydenTypes).map(t => '<option>' + t + '</option>').join(''); }; } }, 150);
}

function showVaccineModal() { showModal('Nouveau vaccin', [{ id: 'name', l: 'Nom', p: 'DTP, ROR...' }, { id: 'ageMonths', l: 'Âge (mois)', t: 'number' }, { id: 'done', l: 'Fait ? (oui/non)', p: 'oui' }, { id: 'dateDone', l: 'Date (si fait)', t: 'date' }], d => { DB.vaccines.push({ _id: uid(), name: d.name, ageMonths: parseInt(d.ageMonths) || 0, done: (d.done || '').toLowerCase() === 'oui', dateDone: d.dateDone || null }); saveDB(); cloudPushSettings(); render(); toast('Vaccin ajouté'); }); }

function showGrowthModal() { showModal('Nouvelle mesure', [{ id: 'date', l: 'Date', t: 'date' }, { id: 'weight', l: 'Poids (kg)', t: 'number', p: '14.2' }, { id: 'height', l: 'Taille (cm)', t: 'number', p: '96' }, { id: 'notes', l: 'Notes', p: '' }], d => { DB.growth.push({ _id: uid(), date: d.date || todayISO(), weight: parseFloat(d.weight) || 0, height: parseFloat(d.height) || 0, notes: d.notes }); saveDB(); cloudPushSettings(); render(); toast('Mesure ajoutée'); }); }

function showContactModal() { showModal('Nouveau contact', [{ id: 'name', l: 'Nom', p: '' }, { id: 'specialty', l: 'Spécialité', t: 'sel', opts: ['', 'Pédiatre', 'Dentiste', 'Ophtalmo', 'ORL', 'Généraliste', 'Hôpital', 'Infirmier', 'Kiné', 'Orthophoniste', 'Crèche', 'Famille', 'Autre'] }, { id: 'role', l: 'Rôle / Notes', p: '' }, { id: 'phone', l: 'Téléphone', t: 'tel', p: '' }, { id: 'notes', l: 'Adresse / Infos', p: '' }], d => { DB.contacts.push({ _id: uid(), name: d.name, specialty: d.specialty || '', role: d.role || (d.specialty || ''), phone: d.phone, notes: d.notes }); saveDB(); cloudPushSettings(); render(); toast('Contact ajouté'); }); }

function showSchoolDateModal() { showModal('Nouvelle date scolaire', [{ id: 'label', l: 'Événement', p: 'Rentrée, Vacances...' }, { id: 'date', l: 'Date', t: 'date' }], d => { if (!DB.schoolDates) DB.schoolDates = []; DB.schoolDates.push({ date: d.date, label: d.label }); saveDB(); cloudPushSettings(); render(); toast('Date ajoutée'); }); }

function showMedicationModal() { const lw = DB.growth.length ? DB.growth[DB.growth.length - 1].weight : null; showModal('Nouveau médicament', [{ id: 'name', l: 'Nom', p: 'Doliprane...' }, { id: 'perKg', l: 'Dose par kg', t: 'number', p: lw ? 'ex: 15 (mg/kg)' : '' }, { id: 'unit', l: 'Unité', p: 'ml, mg...' }, { id: 'freq', l: 'Fréquence', p: '3x/jour' }, { id: 'notes', l: 'Notes', p: '' }], d => { if (!DB.medications) DB.medications = []; DB.medications.push({ _id: uid(), name: d.name, perKg: parseFloat(d.perKg) || 0, unit: d.unit || 'ml', freq: d.freq || '', notes: d.notes || '' }); saveDB(); cloudPushSettings(); render(); toast('Médicament ajouté'); }); }

function showSundayNoteModal() { const ns = getUpcomingSunday(); const defDate = ns ? dateISO(ns) : ''; showModal('Note de dimanche', [{ id: 'date', l: 'Date', t: 'date' }, { id: 'note', l: 'Note', t: 'ta', p: '' }], d => { if (!DB.sundayNotes) DB.sundayNotes = []; DB.sundayNotes.push({ date: d.date, note: d.note }); saveDB(); cloudPushSettings(); render(); toast('Note enregistrée'); }); setTimeout(() => { const el = $('#fm-date'); if (el && defDate) el.value = defDate; }, 100); }

function showSundayOverrideModal(dateStr) { const existing = (DB.sundayOverrides || []).find(o => o.date === dateStr) || { date: dateStr, time: '', note: '', cancelled: false }; showModal('Modifier le dimanche ' + fmtLong(dateStr), [{ id: 'time', l: 'Horaires', p: DB.settings.firstSundayNote || '9h-18h' }, { id: 'cancelled', l: 'Annulé ?', t: 'sel', opts: ['Non', 'Oui'] }, { id: 'note', l: 'Raison (si annulé)', p: 'Maman malade, empêchement...' }], d => { if (!DB.sundayOverrides) DB.sundayOverrides = []; const idx = DB.sundayOverrides.findIndex(o => o.date === dateStr); const obj = { date: dateStr, time: d.time || '', note: d.note || '', cancelled: d.cancelled === 'Oui' }; if (idx >= 0) DB.sundayOverrides[idx] = obj; else DB.sundayOverrides.push(obj); saveDB(); cloudPushSettings(); render(); toast('Dimanche mis à jour'); }); setTimeout(() => { $('#fm-time').value = existing.time || DB.settings.firstSundayNote || ''; $('#fm-cancelled').value = existing.cancelled ? 'Oui' : 'Non'; $('#fm-note').value = existing.note || ''; const cs = $('#fm-cancelled'); const ng = $('#fm-note').closest('.form-group'); if (cs) { cs.onchange = () => { if (ng) ng.style.display = cs.value === 'Oui' ? '' : 'none'; }; if (ng) ng.style.display = cs.value === 'Oui' ? '' : 'none'; } }, 150); }

function showPapaApptModal() { showModal('RDV Papa', [{ id: 'date', l: 'Date', t: 'date' }, { id: 'type', l: 'Type', p: 'Médecin, Dentiste...' }, { id: 'doctor', l: 'Docteur / Lieu', p: '' }, { id: 'notes', l: 'Notes', p: '' }], d => { if (!DB.papaAppointments) DB.papaAppointments = []; DB.papaAppointments.push({ _id: uid(), type: d.type || 'RDV', doctor: d.doctor || '', date: d.date, notes: d.notes || '' }); saveDB(); cloudPushSettings(); render(); toast('RDV Papa'); }); }
function showToothModal() { showModal('Nouvelle dent', [{ id: 'name', l: 'Dent', p: 'Incisive, molaire...' }, { id: 'date', l: 'Date', t: 'date' }, { id: 'notes', l: 'Notes', p: '' }], d => { if (!DB.teeth) DB.teeth = []; DB.teeth.push({ _id: uid(), name: d.name, date: d.date || todayISO(), notes: d.notes || '' }); saveDB(); cloudPushSettings(); render(); toast('Dent notée'); }); }
function showClothingModal() { showModal('Nouveau vêtement', [{ id: 'date', l: 'Date', t: 'date' }, { id: 'category', l: 'Catégorie', p: 'Hauts, Pantalons...' }, { id: 'size', l: 'Taille', p: '3 ans, 98cm...' }, { id: 'item', l: 'Article', p: '' }, { id: 'notes', l: 'Notes', p: '' }], d => { if (!DB.clothingHistory) DB.clothingHistory = []; DB.clothingHistory.push({ _id: uid(), date: d.date || todayISO(), category: d.category || 'Autre', size: d.size || '', item: d.item || '', notes: d.notes || '', outgrown: false }); saveDB(); cloudPushSettings(); render(); toast('Taille notée'); }); }
function showRecurringTaskModal() { showModal('Tâche récurrente', [{ id: 'label', l: 'Nom', p: 'Couper les ongles...' }, { id: 'intervalDays', l: 'Fréquence (jours)', t: 'number', p: '7 = chaque semaine' }, { id: 'notes', l: 'Notes', p: '' }], d => { if (!DB.recurringTasks) DB.recurringTasks = []; const intv = parseInt(d.intervalDays) || 7; const nd = new Date(); nd.setDate(nd.getDate() + intv); DB.recurringTasks.push({ _id: uid(), label: d.label || 'Tâche', intervalDays: intv, freq: intv === 7 ? 'Hebdo' : intv + 'j', lastDone: null, nextDue: todayISO(), notes: d.notes || '' }); saveDB(); cloudPushSettings(); render(); toast('Tâche ajoutée'); }); }
function showFactureModal() { showModal('Nouvelle facture', [{ id: 'label', l: 'Libellé', p: '' }, { id: 'amount', l: 'Montant (€)', t: 'number' }, { id: 'dueDate', l: 'Échéance', t: 'date' }, { id: 'notes', l: 'Notes', p: '' }], d => { if (!DB.factures) DB.factures = []; DB.factures.push({ _id: uid(), label: d.label, amount: parseFloat(d.amount) || 0, dueDate: d.dueDate || '', notes: d.notes || '', paid: false }); saveDB(); cloudPushSettings(); render(); toast('Facture ajoutée'); }); }
function showVehiculeModal() { showModal('Suivi véhicule', [{ id: 'label', l: 'Libellé', p: '' }, { id: 'nextDue', l: 'Prochaine échéance', t: 'date' }, { id: 'notes', l: 'Notes', p: '' }], d => { if (!DB.vehicule) DB.vehicule = []; DB.vehicule.push({ _id: uid(), label: d.label, nextDue: d.nextDue || '', notes: d.notes || '' }); saveDB(); cloudPushSettings(); render(); toast('Suivi ajouté'); }); }
function showRevenuModal() { showModal('Nouveau revenu', [{ id: 'date', l: 'Date', t: 'date' }, { id: 'label', l: 'Libellé', p: 'Salaire, CAF...' }, { id: 'amount', l: 'Montant (€)', t: 'number' }, { id: 'notes', l: 'Notes', p: '' }], d => { if (!DB.revenus) DB.revenus = []; DB.revenus.push({ _id: uid(), date: d.date || todayISO(), label: d.label, amount: parseFloat(d.amount) || 0, notes: d.notes || '' }); saveDB(); cloudPushSettings(); render(); toast('Revenu ajouté'); }); }
function showAboModal() { showModal('Nouvel abonnement', [{ id: 'label', l: 'Nom', p: 'Netflix, Spotify...' }, { id: 'amount', l: 'Montant mensuel (€)', t: 'number' }, { id: 'notes', l: 'Notes', p: '' }], d => { if (!DB.abonnements) DB.abonnements = []; DB.abonnements.push({ _id: uid(), label: d.label, amount: parseFloat(d.amount) || 0, notes: d.notes || '' }); saveDB(); cloudPushSettings(); render(); toast('Abonnement ajouté'); }); }
function showContratModal() { showModal('Nouveau contrat', [{ id: 'label', l: 'Nom', p: 'Assurance, Loyer...' }, { id: 'montant', l: 'Montant', p: '' }, { id: 'echeance', l: 'Échéance', t: 'date' }, { id: 'notes', l: 'Notes', p: '' }], d => { if (!DB.contrats) DB.contrats = []; DB.contrats.push({ _id: uid(), label: d.label, montant: d.montant || '', echeance: d.echeance || '', notes: d.notes || '' }); saveDB(); cloudPushSettings(); render(); toast('Contrat ajouté'); }); }
function showActiviteModal() { showModal("Nouvelle activité", [{ id: "label", l: "Nom", p: "Foot, Judo..." }, { id: "type", l: "Type", t: "sel", opts: ["Sport", "Musique", "Danse", "Piscine", "Arts", "Autre"] }, { id: "recurring", l: "Récurrent ?", t: "sel", opts: ["Oui (chaque semaine)", "Non (date précise)"] }, { id: "day", l: "Jour", t: "sel", opts: ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"] }, { id: "date", l: "Date (si ponctuel)", t: "date" }, { id: "time", l: "Horaire", p: "14h-15h" }, { id: "lieu", l: "Lieu", p: "" }, { id: "coach", l: "Contact", p: "" }, { id: "notes", l: "Équipement / Notes", p: "" }], d => { if (!DB.activites) DB.activites = []; const isRec = (d.recurring || "").startsWith("Oui"); DB.activites.push({ _id: uid(), label: d.label, type: d.type || "Autre", recurring: isRec, day: d.day || "", date: d.date || "", time: d.time || "", lieu: d.lieu || "", coach: d.coach || "", notes: d.notes || "" }); saveDB(); cloudPushSettings(); render(); toast("Activité ajoutée"); }); }
function showExtraVisitModal(id) { const existing = id ? (DB.extraVisits || []).find(v => v._id === id) : null; const def = existing || { date: '', time: '', note: '', cancelled: false }; showModal(existing ? 'Modifier la journée' : 'Nouvelle journée', [{ id: 'date', l: 'Date', t: 'date' }, { id: 'time', l: 'Horaires', p: '10h-18h' }, { id: 'cancelled', l: 'Annulé ?', t: 'sel', opts: ['Non', 'Oui'] }, { id: 'note', l: 'Note', p: '' }], d => { if (!DB.extraVisits) DB.extraVisits = []; const obj = { _id: existing ? existing._id : uid(), date: d.date, time: d.time || '', note: d.note || '', cancelled: d.cancelled === 'Oui' }; if (existing) { const i = DB.extraVisits.findIndex(v => v._id === id); if (i >= 0) DB.extraVisits[i] = obj; } else { DB.extraVisits.push(obj); } saveDB(); cloudPushSettings(); render(); toast(existing ? 'Journée modifiée' : 'Journée ajoutée'); }); setTimeout(() => { $('#fm-date').value = def.date || ''; $('#fm-time').value = def.time || ''; $('#fm-cancelled').value = def.cancelled ? 'Oui' : 'Non'; $('#fm-note').value = def.note || ''; }, 100); }
window.showExtraVisitModal = showExtraVisitModal;
function showPapaActiviteModal() { showModal('Mon activité', [{ id: 'label', l: 'Nom', p: 'Foot, Muscu...' }, { id: 'type', l: 'Type', t: 'sel', opts: ['Sport', 'Musique', 'Danse', 'Piscine', 'Loisir', 'Autre'] }, { id: 'recurring', l: 'Récurrent ?', t: 'sel', opts: ['Oui (chaque semaine)', 'Non (date précise)'] }, { id: 'day', l: 'Jour', t: 'sel', opts: ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] }, { id: 'date', l: 'Date (si ponctuel)', t: 'date' }, { id: 'time', l: 'Horaire', p: '18h-19h' }, { id: 'lieu', l: 'Lieu', p: '' }, { id: 'notes', l: 'Notes', p: '' }], d => { if (!DB.papaActivites) DB.papaActivites = []; const isRec = (d.recurring || '').startsWith('Oui'); DB.papaActivites.push({ _id: uid(), label: d.label, type: d.type || 'Autre', recurring: isRec, day: d.day || '', date: d.date || '', time: d.time || '', lieu: d.lieu || '', notes: d.notes || '' }); saveDB(); cloudPushSettings(); render(); toast('Activité ajoutée'); }); }
function showEnsembleActiviteModal() { showModal('Activité ensemble', [{ id: 'label', l: 'Nom', p: 'Parc, Balade...' }, { id: 'type', l: 'Type', t: 'sel', opts: ['Parc', 'Balade', 'Cinéma', 'Sport', 'Piscine', 'Loisir', 'Autre'] }, { id: 'recurring', l: 'Récurrent ?', t: 'sel', opts: ['Oui (chaque semaine)', 'Non (date précise)'] }, { id: 'day', l: 'Jour', t: 'sel', opts: ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] }, { id: 'date', l: 'Date (si ponctuel)', t: 'date' }, { id: 'time', l: 'Horaire', p: '10h-12h' }, { id: 'lieu', l: 'Lieu', p: '' }, { id: 'notes', l: 'Notes', p: '' }], d => { if (!DB.papaAydenActivites) DB.papaAydenActivites = []; const isRec = (d.recurring || '').startsWith('Oui'); DB.papaAydenActivites.push({ _id: uid(), label: d.label, type: d.type || 'Autre', recurring: isRec, day: d.day || '', date: d.date || '', time: d.time || '', lieu: d.lieu || '', notes: d.notes || '' }); saveDB(); cloudPushSettings(); render(); toast('Activité ajoutée'); }); }

// ========== SETTINGS ==========
function showSettings() {
  const s = DB.settings;
  showModal('⚙️ Paramètres', [{ id: 'name', l: 'Ton prénom', p: '' }, { id: 'childName', l: "Prénom de l'enfant", p: '' }, { id: 'childBirthDate', l: 'Date de naissance', t: 'date' }, { id: 'firstSundayDate', l: '1er dimanche chez Maman', t: 'date' }, { id: 'sundayNote', l: 'Note dimanche', p: 'ex: 9h-18h' }, { id: 'changePin', l: 'Nouveau PIN (vide = inchangé)', t: 'password' }], async d => {
    s.name = d.name; s.childName = d.childName; s.childBirthDate = d.childBirthDate;
    s.firstSundayDate = d.firstSundayDate || ''; s.firstSundayNote = d.sundayNote || '';
    if (d.changePin && d.changePin.length === 4) { s.pinHash = await sha256(d.changePin); toast('PIN modifié'); }
    saveDB(); cloudPushSettings(); updateHeader(); render(); toast('Sauvegardé');
  });
  setTimeout(() => { $('#fm-name').value = s.name || ''; $('#fm-childName').value = s.childName; $('#fm-childBirthDate').value = s.childBirthDate; $('#fm-firstSundayDate').value = s.firstSundayDate || ''; $('#fm-sundayNote').value = s.firstSundayNote || ''; }, 100);
}

function showSchoolEditModal() {
  const sc = DB.school || {};
  showModal("Modifier l'école", [{ id: 'schoolName', l: 'Nom', p: '' }, { id: 'schoolTeacher', l: 'Maître(sse)', p: '' }, { id: 'schoolDirector', l: 'Directeur/trice', p: '' }, { id: 'schoolPhone', l: 'Téléphone', t: 'tel', p: '' }, { id: 'schoolAddress', l: 'Adresse', p: '' }, { id: 'schoolStartDate', l: 'Date de rentrée', t: 'date' }, { id: 'schoolNotes', l: 'Notes (ATSEM, garderie...)', p: '' }], d => {
    DB.school = { name: d.schoolName || '', teacher: d.schoolTeacher || '', director: d.schoolDirector || '', phone: d.schoolPhone || '', address: d.schoolAddress || '', startDate: d.schoolStartDate || '', notes: d.schoolNotes || '' };
    saveDB(); cloudPushSettings(); render(); toast('École mise à jour');
  });
  setTimeout(() => { $('#fm-schoolName').value = sc.name || ''; $('#fm-schoolTeacher').value = sc.teacher || ''; $('#fm-schoolDirector').value = sc.director || ''; $('#fm-schoolPhone').value = sc.phone || ''; $('#fm-schoolAddress').value = sc.address || ''; $('#fm-schoolStartDate').value = sc.startDate || ''; $('#fm-schoolNotes').value = sc.notes || ''; }, 100);
}
window.showSchoolEditModal = showSchoolEditModal;

// ========== EMERGENCY ==========
function showEmergency() {
  const em = DB.contacts.filter(c => ['SAMU', 'Pompiers', 'Police'].includes(c.name));
  const med = DB.contacts.filter(c => c.specialty && !em.includes(c));
  let h = '<div class="modal-overlay" id="emOverlay"><div class="modal"><h3>🆘 Urgence</h3><div style="font-size:12px;color:#999;margin-bottom:12px;">Appuie pour appeler</div>';
  [...em, ...med].forEach(c => {
    h += '<a href="tel:' + c.phone + '" style="display:flex;align-items:center;gap:12px;padding:14px;background:var(--card-alt);border-radius:12px;margin-bottom:8px;text-decoration:none;color:var(--text);border:1px solid var(--border);"><div style="font-size:28px;">' + (em.includes(c) ? (c.name === 'SAMU' ? '🏥' : c.name === 'Pompiers' ? '🚒' : '👮') : '🩺') + '</div><div style="flex:1;"><div style="font-size:14px;font-weight:700;">' + c.name + '</div><div style="font-size:11px;color:#999;">' + (c.phone || '') + '</div></div><div style="font-size:24px;">📞</div></a>';
  });
  h += '<button class="btn btn-outline btn-full" id="emClose" style="margin-top:8px;">Fermer</button></div></div>';
  const ex = $('#emOverlay'); if (ex) ex.remove();
  $('#app').insertAdjacentHTML('beforeend', h);
  $('#emClose').onclick = () => { const m = $('#emOverlay'); if (m) m.remove(); };
  $('#emOverlay').onclick = e => { if (e.target === $('#emOverlay')) { const m = $('#emOverlay'); if (m) m.remove(); } };
}

// ========== NOTIFICATIONS ==========
async function scheduleReminders() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') try { await Notification.requestPermission(); } catch (e) { }
  if (Notification.permission !== 'granted') return;
  const nv = DB.vaccines.find(v => !v.done);
  if (nv && !localStorage.getItem('n_v_' + nv._id)) { new Notification('Vaccin à prévoir', { body: DB.settings.childName + ': ' + nv.name, icon: '/icon-192.png' }); localStorage.setItem('n_v_' + nv._id, '1'); }
  DB.appointments.filter(a => daysUntil(a.date) <= 2 && daysUntil(a.date) >= 0).forEach(a => { if (!localStorage.getItem('n_a_' + a._id)) { new Notification('RDV bientôt', { body: a.type + ' - ' + fmtLong(a.date), icon: '/icon-192.png' }); localStorage.setItem('n_a_' + a._id, '1'); } });
  const ns = getUpcomingSunday();
  if (ns && daysUntil(ns) === 1 && !localStorage.getItem('n_s_' + dateISO(ns))) { new Notification('Demain dimanche !', { body: 'Sac de ' + DB.settings.childName + ' prêt ?', icon: '/icon-192.png' }); localStorage.setItem('n_s_' + dateISO(ns), '1'); }
}

function checkYearAgo() {
  const today = new Date(), ya = new Date(today); ya.setFullYear(ya.getFullYear() - 1);
  const key = dateISO(ya);
  const mem = DB.memories.find(m => m.date === key);
  if (mem) setTimeout(() => toast('💭 Il y a 1 an : ' + mem.text.slice(0, 80) + (mem.text.length > 80 ? '...' : '')), 1500);
}

// ========== TOAST ==========
function toast(msg) {
  const ex = $('.toast'); if (ex) ex.remove();
  $('#app').insertAdjacentHTML('beforeend', '<div class="toast">' + msg + '</div>');
  setTimeout(() => { const t = $('.toast'); if (t) t.remove(); }, 2500);
}

// ========== DARK MODE ==========
function toggleDark() { document.body.classList.toggle('dark'); localStorage.setItem('papaapp_dark', document.body.classList.contains('dark') ? '1' : '0'); }
function initDark() { if (localStorage.getItem('papaapp_dark') === '1') document.body.classList.add('dark'); else if (localStorage.getItem('papaapp_dark') === null && window.matchMedia('(prefers-color-scheme:dark)').matches) document.body.classList.add('dark'); }

// ========== EXPORT/IMPORT ==========
function exportData() {
  const exp = { version: 4, exported: new Date().toISOString(), settings: DB.settings, documents: DB.documents, vaccines: DB.vaccines, appointments: DB.appointments, growth: DB.growth, expenses: DB.expenses, memories: DB.memories, contacts: DB.contacts, checklists: DB.checklists, school: DB.school, schoolItems: DB.schoolItems, schoolDates: DB.schoolDates, medications: DB.medications, shoppingList: DB.shoppingList, sundayNotes: DB.sundayNotes, sundayOverrides: DB.sundayOverrides, papaAppointments: DB.papaAppointments, papaNotes: DB.papaNotes, teeth: DB.teeth, clothingHistory: DB.clothingHistory, recurringTasks: DB.recurringTasks, factures: DB.factures, vehicule: DB.vehicule, revenus: DB.revenus, abonnements: DB.abonnements, contrats: DB.contrats, activites: DB.activites, extraVisits: DB.extraVisits, papaActivites: DB.papaActivites, papaAydenActivites: DB.papaAydenActivites };
  delete exp.settings.pinHash;
  const blob = new Blob([JSON.stringify(exp, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'papaapp-backup-' + todayISO() + '.json'; a.click();
  toast('Sauvegarde téléchargée');
}
window.exportData = exportData;

function importData() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json';
  inp.onchange = () => {
    if (!inp.files[0]) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        if (!data.version || !data.settings) { toast('Fichier invalide'); return; }
        if (!confirm('Remplacer toutes les données ?')) return;
        DB.settings = { ...defaultDB().settings, ...data.settings };
        ['documents', 'vaccines', 'appointments', 'growth', 'expenses', 'memories'].forEach(k => { DB[k] = data[k] || []; });
        DB.contacts = data.contacts || defaultDB().contacts;
        DB.checklists = data.checklists || defaultDB().checklists;
        DB.school = data.school || {};
        ['schoolItems', 'schoolDates', 'medications', 'shoppingList', 'sundayNotes', 'sundayOverrides', 'papaAppointments', 'papaNotes', 'teeth', 'clothingHistory', 'recurringTasks', 'factures', 'vehicule', 'revenus', 'abonnements', 'contrats', 'activites', 'extraVisits', 'papaActivites', 'papaAydenActivites'].forEach(k => { DB[k] = data[k] || []; });
        DB._synced = false; saveDB(); cloudPushSettings(); updateHeader(); render(); toast('Données restaurées');
      } catch (e) { toast('Erreur de lecture'); }
    };
    r.readAsText(inp.files[0]);
  };
  inp.click();
}

// ========== RESET DAILY ==========
function resetDailyChecklists() {
  const today = todayISO();
  if (localStorage.getItem('papaapp_reset') !== today) {
    ['morning', 'evening', 'sunday'].forEach(k => { if (DB.checklists[k]) DB.checklists[k].forEach(i => { i.checked = false; }); });
    localStorage.setItem('papaapp_reset', today); saveDB();
  }
}

// ========== INIT ==========
async function init() {
  DB = loadDB();
  const def = defaultDB();
  DB.settings = { ...def.settings, ...DB.settings };
  DB.checklists = { ...def.checklists, ...DB.checklists };
  DB.school = { ...def.school, ...(DB.school || {}) };
  const arrDefaults = ['schoolItems', 'schoolDates', 'medications', 'shoppingList', 'sundayNotes', 'sundayOverrides', 'papaAppointments', 'papaNotes', 'teeth', 'clothingHistory', 'recurringTasks', 'factures', 'vehicule', 'revenus', 'abonnements', 'contrats', 'activites', 'extraVisits'];
  arrDefaults.forEach(k => { if (!DB[k]) DB[k] = []; if (Array.isArray(def[k]) && DB[k].length === 0) DB[k] = def[k]; });
  saveDB();

  S.token = localStorage.getItem('papaapp_token') || null;
  S.refresh = localStorage.getItem('papaapp_refresh') || null;

  initNav();
  initLockHTML();
  resetDailyChecklists();
  updateHeader();
  initDark();

  if (window.innerWidth >= 769) $('#app').classList.add('desktop-layout');

  if (S.token) { await cloudSync(); showLockScreen(); }
  else { initAuthScreen(); $('#authScreen').classList.remove('hidden'); }
}

document.addEventListener('DOMContentLoaded', init);

