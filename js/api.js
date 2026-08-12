// ========== SUPABASE API ==========
import { CFG } from './config.js';
import { DB, S } from './store.js';
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

export async function cloudSync() {
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

export function mapFromCloud(t, r) {
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

export function mergeCloudSettings(sd) {
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

export async function cloudPushSettings() {
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
