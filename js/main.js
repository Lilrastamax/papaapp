import { DB, S, loadDB, setDB, saveDB, defaultDB, resetDailyChecklists } from './store.js';
import { todayISO } from './utils.js';
import { cloudSync, cloudPushSettings } from './api.js';
import { render } from './render.js';
import { initNav } from './nav.js';
import { initLockHTML, showLockScreen, updateHeader, initDark, bindGlobalEvents, initAuthScreen, toast } from './ui.js';
import { exposeGlobals } from './globals.js';

export function exportData() {
  const exp = { version: 4, exported: new Date().toISOString(), settings: DB.settings, documents: DB.documents, vaccines: DB.vaccines, appointments: DB.appointments, growth: DB.growth, expenses: DB.expenses, memories: DB.memories, contacts: DB.contacts, checklists: DB.checklists, school: DB.school, schoolItems: DB.schoolItems, schoolDates: DB.schoolDates, medications: DB.medications, shoppingList: DB.shoppingList, sundayNotes: DB.sundayNotes, sundayOverrides: DB.sundayOverrides, papaAppointments: DB.papaAppointments, papaNotes: DB.papaNotes, teeth: DB.teeth, clothingHistory: DB.clothingHistory, recurringTasks: DB.recurringTasks, factures: DB.factures, vehicule: DB.vehicule, revenus: DB.revenus, abonnements: DB.abonnements, contrats: DB.contrats, activites: DB.activites, extraVisits: DB.extraVisits, papaActivites: DB.papaActivites, papaAydenActivites: DB.papaAydenActivites };
  delete exp.settings.pinHash;
  const blob = new Blob([JSON.stringify(exp, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'papaapp-backup-' + todayISO() + '.json'; a.click();
  toast('Sauvegarde téléchargée');
}

export function importData() {
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

export async function init() {
  setDB(loadDB());
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
