// ========== ÉTAT GLOBAL & DONNÉES LOCALES ==========
import { uid, todayISO } from './utils.js';
import { cloudPushSettings } from './api.js';
import { render } from './render.js';
import { toast } from './ui.js';

export let S = { token: null, refresh: null, screen: 'home', weekOffset: 0, fabOpen: false, calMonth: 0 };
export let DB = null;

export function defaultDB() {
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

export function loadDB() { try { const r = localStorage.getItem('papaapp_db'); return r ? JSON.parse(r) : defaultDB(); } catch (e) { return defaultDB(); } }
export function saveDB() { localStorage.setItem('papaapp_db', JSON.stringify(DB)); }
export function delFrom(arr, id) { const i = arr.findIndex(x => x._id === id); if (i < 0 || !confirm('Supprimer ?')) return; arr.splice(i, 1); saveDB(); cloudPushSettings(); render(); toast('🗑️ Supprimé'); }

export function resetDailyChecklists() {
  const today = todayISO();
  if (localStorage.getItem('papaapp_reset') !== today) {
    ['morning', 'evening', 'sunday'].forEach(k => { if (DB.checklists[k]) DB.checklists[k].forEach(i => { i.checked = false; }); });
    localStorage.setItem('papaapp_reset', today); saveDB();
  }
}
