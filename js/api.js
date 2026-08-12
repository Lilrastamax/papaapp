// ========== SUPABASE API ==========
import { CFG } from './config.js';
import { DB, S, saveDB } from './store.js';
import { uid } from './utils.js';
import { showDocModal } from './modal.js';
import { toast } from './ui.js';

export function sbHeaders() { const h = { apikey: CFG.key, 'Content-Type': 'application/json' }; if (S.token) h['Authorization'] = 'Bearer ' + S.token; return h; }
export function cloudReady() { return !!S.token && navigator.onLine; }

export async function cloudAuth(email, password, mode) {
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

export async function refreshAccessToken() {
  if (!S.refresh) return false;
  try {
    const res = await fetch(`${CFG.url}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST', headers: { apikey: CFG.key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: S.refresh })
    });
    const json = await res.json();
    if (!res.ok || !json.access_token) return false;
    S.token = json.access_token;
    if (json.refresh_token) S.refresh = json.refresh_token;
    localStorage.setItem('papaapp_token', S.token);
    localStorage.setItem('papaapp_refresh', S.refresh);
    return true;
  } catch (e) { return false; }
}

function clearSession() {
  S.token = null; S.refresh = null;
  localStorage.removeItem('papaapp_token');
  localStorage.removeItem('papaapp_refresh');
  toast('Session expirée — reconnecte-toi pour la synchro');
}

// ========== MAPPING LOCAL <-> CLOUD ==========
export const ITEM_TYPES = [
  'documents', 'vaccines', 'appointments', 'growth', 'expenses', 'memories', 'contacts',
  'schoolItems', 'schoolDates', 'medications', 'shoppingList', 'sundayNotes', 'sundayOverrides',
  'papaAppointments', 'papaNotes', 'teeth', 'clothingHistory', 'recurringTasks', 'extraVisits',
  'papaActivites', 'papaAydenActivites', 'factures', 'vehicule', 'revenus', 'abonnements', 'contrats', 'activites'
];

export function buildItemRows(db) {
  const rows = [];
  for (const type of ITEM_TYPES) {
    const list = db[type] || [];
    list.forEach((item, index) => {
      const { _id, ...data } = item;
      const id = item._id || item.id || (type + ':' + index);
      rows.push({ id, type, data });
    });
  }
  return rows;
}

export function applyCloudItems(db, items) {
  const byType = {};
  for (const it of items) {
    if (!it || !it.type || !ITEM_TYPES.includes(it.type)) continue;
    (byType[it.type] = byType[it.type] || []).push({ _id: it.id, ...(it.data || {}) });
  }
  for (const [type, list] of Object.entries(byType)) {
    if (db[type] !== undefined) db[type] = list;
  }
}

export async function cloudSync() {
  if (!cloudReady()) return;
  try {
    let s = await fetch(`${CFG.url}/rest/v1/settings?select=*&limit=1`, { headers: sbHeaders() });
    if (s.status === 401) {
      if (await refreshAccessToken()) s = await fetch(`${CFG.url}/rest/v1/settings?select=*&limit=1`, { headers: sbHeaders() });
      else { clearSession(); return; }
    }
    if (!s.ok) { console.warn('Sync annulée, statut', s.status); return; }
    const srows = await s.json();
    const hasSettings = Array.isArray(srows) && srows[0];
    if (hasSettings) {
      const sd = srows[0], st = DB.settings;
      if (sd.name) st.name = sd.name;
      if (sd.child_name) st.childName = sd.child_name;
      if (sd.child_birth_date) st.childBirthDate = sd.child_birth_date;
      if (sd.first_sunday_date) st.firstSundayDate = sd.first_sunday_date;
      if (sd.sunday_interval) st.sundayInterval = sd.sunday_interval;
      if (sd.first_sunday_note) st.firstSundayNote = sd.first_sunday_note;
      if (sd.checklists) DB.checklists = { ...DB.checklists, ...sd.checklists };
      if (sd.school) DB.school = { ...DB.school, ...sd.school };
    }
    const ir = await fetch(`${CFG.url}/rest/v1/items?select=id,type,data`, { headers: sbHeaders() });
    if (ir.ok) {
      const items = await ir.json();
      if (Array.isArray(items)) applyCloudItems(DB, items);
    }
    DB._synced = true; saveDB();
    if (!hasSettings) await cloudPushSettings();
  } catch (e) { console.warn('Sync error:', e.message); }
}

export async function cloudPushSettings() {
  if (!cloudReady()) { console.warn('Push skipped: not ready'); return; }
  try {
    const body = {
      name: DB.settings.name, child_name: DB.settings.childName,
      child_birth_date: DB.settings.childBirthDate,
      first_sunday_date: DB.settings.firstSundayDate || null,
      sunday_interval: DB.settings.sundayInterval,
      first_sunday_note: DB.settings.firstSundayNote,
      checklists: DB.checklists, school: DB.school
    };
    let r = await fetch(`${CFG.url}/rest/v1/settings?select=id&limit=1`, { headers: sbHeaders() });
    if (r.status === 401) {
      if (await refreshAccessToken()) r = await fetch(`${CFG.url}/rest/v1/settings?select=id&limit=1`, { headers: sbHeaders() });
      else { clearSession(); return; }
    }
    if (!r.ok) { console.warn('Push annulé (settings), statut', r.status); return; }
    const rows = await r.json();
    if (Array.isArray(rows) && rows[0]) {
      await fetch(`${CFG.url}/rest/v1/settings?id=eq.${rows[0].id}`, { method: 'PATCH', headers: { ...sbHeaders(), 'Prefer': 'return=minimal' }, body: JSON.stringify(body) });
    } else {
      await fetch(`${CFG.url}/rest/v1/settings`, { method: 'POST', headers: { ...sbHeaders(), 'Prefer': 'return=minimal' }, body: JSON.stringify(body) });
    }
    await fetch(`${CFG.url}/rest/v1/items`, { method: 'DELETE', headers: { ...sbHeaders(), 'Prefer': 'return=minimal' } });
    const itemRows = buildItemRows(DB);
    if (itemRows.length) {
      await fetch(`${CFG.url}/rest/v1/items`, { method: 'POST', headers: { ...sbHeaders(), 'Prefer': 'return=minimal' }, body: JSON.stringify(itemRows) });
    }
    console.log('Push OK, items:', itemRows.length);
  } catch (e) { console.warn('Push error:', e.message); }
}

// ========== SCAN & DOCUMENTS ==========
export function triggerScan() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*,.pdf,application/pdf'; inp.capture = 'environment';
  inp.onchange = () => { if (inp.files[0]) uploadAndShowDoc(inp.files[0]); };
  inp.click();
}

export async function uploadAndShowDoc(file) {
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

export async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image(), canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
    img.onload = () => { const maxW = 1200; let w = img.width, h = img.height; if (w > maxW) { h = h * maxW / w; w = maxW; } canvas.width = w; canvas.height = h; ctx.drawImage(img, 0, 0, w, h); canvas.toBlob(b => { if (b) resolve(b); else reject(new Error('compress failed')); }, 'image/jpeg', 0.8); };
    img.onerror = reject; img.src = URL.createObjectURL(file);
  });
}
