// ========== UI : VERROU, AUTH, THÈME, NOTIFICATIONS, TOAST ==========
import { CFG } from './config.js';
import { DB, S, saveDB } from './store.js';
import { $, $$, todayISO, dateISO, fmtLong, childAge, sha256, daysUntil } from './utils.js';
import { cloudAuth, cloudSync } from './api.js';
import { getUpcomingSunday } from './sundays.js';
import { render } from './render.js';

let lockTimer = null;
let _lp = '';

// ========== TOAST ==========
export function toast(msg) {
  const ex = $('.toast'); if (ex) ex.remove();
  $('#app').insertAdjacentHTML('beforeend', '<div class="toast">' + msg + '</div>');
  setTimeout(() => { const t = $('.toast'); if (t) t.remove(); }, 2500);
}

// ========== DARK MODE ==========
export function toggleDark() { document.body.classList.toggle('dark'); localStorage.setItem('papaapp_dark', document.body.classList.contains('dark') ? '1' : '0'); }
export function initDark() { if (localStorage.getItem('papaapp_dark') === '1') document.body.classList.add('dark'); else if (localStorage.getItem('papaapp_dark') === null && window.matchMedia('(prefers-color-scheme:dark)').matches) document.body.classList.add('dark'); }

// ========== AUTH SCREEN ==========
export function initAuthScreen() {
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

export async function doAuth(mode) {
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
export function initLockHTML() {
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
  _lp = '';
  const dots = $$('#pinDots .pin-dot');
  $('#pinPad').onclick = async e => {
    const k = e.target.closest('.pin-key');
    if (!k || k.classList.contains('empty')) return;
    if (k.classList.contains('del')) { if (_lp.length > 0) { _lp = _lp.slice(0, -1); dots[_lp.length].classList.remove('filled', 'error'); } return; }
    if (_lp.length < 4) { _lp += k.textContent; dots[_lp.length - 1].classList.add('filled'); if (_lp.length === 4) verifyPin(_lp); }
  };
}

export function showLockScreen() {
  initLockHTML();
  $('#lockScreen').classList.remove('hidden');
  if (!DB.settings.pinHash) { $('#lockTitle').textContent = 'Bienvenue'; $('#lockSub').textContent = 'Choisissez un code PIN à 4 chiffres'; }
}

export async function verifyPin(entry) {
  const dots = $$('#pinDots .pin-dot'), err = $('#lockError');
  if (!DB.settings.pinHash) { DB.settings.pinHash = await sha256(entry); saveDB(); unlockApp(); return; }
  if (await sha256(entry) === DB.settings.pinHash) { unlockApp(); return; }
  dots.forEach(d => { d.classList.add('error'); d.classList.remove('filled'); });
  err.textContent = 'Code incorrect';
  setTimeout(() => { dots.forEach(d => d.classList.remove('error', 'filled')); err.textContent = ''; _lp = ''; }, 600);
}

export function unlockApp() {
  $('#lockScreen').classList.add('hidden'); _lp = '';
  $$('#pinDots .pin-dot').forEach(d => d.classList.remove('filled', 'error'));
  const er = $('#lockError'); if (er) er.textContent = '';
  resetAutoLock(); updateHeader();
  if (S.token) cloudSync().then(() => render());
  else render();
  scheduleReminders(); checkYearAgo();
}

export function lockApp(reason) {
  if (!$('#lockScreen')) initLockHTML();
  $('#lockScreen').classList.remove('hidden'); _lp = '';
  $$('#pinDots .pin-dot').forEach(d => d.classList.remove('filled', 'error'));
  const er = $('#lockError'); if (er) er.textContent = '';
  if (reason === 'inactivity') { $('#lockTitle').textContent = 'Verrouillé'; $('#lockSub').textContent = 'Inactivité'; }
  clearTimeout(lockTimer);
}

export function updateHeader() {
  const n = DB.settings.name || 'Papa', a = childAge(DB.settings.childBirthDate);
  $('#headerTitle').textContent = DB.settings.name ? 'Salut ' + n : 'PapaApp';
  $('#headerSub').textContent = DB.settings.childName + ' · ' + a + ' an' + (a > 1 ? 's' : '');
}

export function resetAutoLock() { clearTimeout(lockTimer); lockTimer = setTimeout(() => lockApp('inactivity'), CFG.autoLockMs); }

export function bindGlobalEvents() {
  document.addEventListener('click', resetAutoLock);
  document.addEventListener('keydown', resetAutoLock);
  document.addEventListener('touchstart', resetAutoLock, { passive: true });
}

// ========== EMERGENCY ==========
export function showEmergency() {
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
export async function scheduleReminders() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') try { await Notification.requestPermission(); } catch (e) { }
  if (Notification.permission !== 'granted') return;
  const nv = DB.vaccines.find(v => !v.done);
  if (nv && !localStorage.getItem('n_v_' + nv._id)) { new Notification('Vaccin à prévoir', { body: DB.settings.childName + ': ' + nv.name, icon: '/icon-192.png' }); localStorage.setItem('n_v_' + nv._id, '1'); }
  DB.appointments.filter(a => daysUntil(a.date) <= 2 && daysUntil(a.date) >= 0).forEach(a => { if (!localStorage.getItem('n_a_' + a._id)) { new Notification('RDV bientôt', { body: a.type + ' - ' + fmtLong(a.date), icon: '/icon-192.png' }); localStorage.setItem('n_a_' + a._id, '1'); } });
  const ns = getUpcomingSunday();
  if (ns && daysUntil(ns) === 1 && !localStorage.getItem('n_s_' + dateISO(ns))) { new Notification('Demain dimanche !', { body: 'Sac de ' + DB.settings.childName + ' prêt ?', icon: '/icon-192.png' }); localStorage.setItem('n_s_' + dateISO(ns), '1'); }
}

export function checkYearAgo() {
  const today = new Date(), ya = new Date(today); ya.setFullYear(ya.getFullYear() - 1);
  const key = dateISO(ya);
  const mem = DB.memories.find(m => m.date === key);
  if (mem) setTimeout(() => toast('💭 Il y a 1 an : ' + mem.text.slice(0, 80) + (mem.text.length > 80 ? '...' : '')), 1500);
}
