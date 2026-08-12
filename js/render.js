import { S, DB, saveDB } from './store.js';
import { $, $$ } from './utils.js';
import { cloudPushSettings, triggerScan } from './api.js';
import { renderHome } from './screens/home.js';
import { renderHealth } from './screens/health.js';
import { renderAgenda } from './screens/agenda.js';
import { renderSchool } from './screens/school.js';
import { renderActivites } from './screens/activites.js';
import { renderMaison } from './screens/maison.js';
import { renderDocs, renderContacts, renderDaily, renderPlus } from './screens/misc.js';
import { showMemoryModal, showExpenseModal, showApptModal, showVaccineModal, showGrowthModal, showContactModal, showSchoolDateModal, showMedicationModal, showSundayNoteModal, showPapaApptModal, showToothModal, showClothingModal, showRecurringTaskModal, showFactureModal, showVehiculeModal, showRevenuModal, showAboModal, showContratModal, showActiviteModal, showExtraVisitModal, showPapaActiviteModal, showEnsembleActiviteModal } from './modal.js';

// ========== RENDU ==========
export function render() {
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

// ========== EVENTS ==========
export function bindEvents() {
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

export function handleAction(a) {
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

export function getDocDisplay(d) {
  if (d.scanUrl || d.scanData) {
    const src = d.scanUrl || d.scanData;
    return '<div onclick="event.stopPropagation();viewDocument(\'' + d._id + '\')" style="cursor:pointer;display:flex;align-items:center;gap:6px;">' + (d.fileType === 'image' ? '<img src="' + src + '" style="width:32px;height:32px;border-radius:6px;object-fit:cover;">' : d.fileType === 'pdf' ? '&#128213;' : '&#128206;') + '<span style="font-size:11px;color:var(--primary);">Voir</span></div>';
  }
  return '&#128196;';
}

export function viewDocument(id) {
  const d = DB.documents.find(x => x._id === id); if (!d) return;
  const src = d.scanUrl || d.scanData; if (!src) return;
  if (d.fileType === 'image') {
    const h = '<div class="modal-overlay" id="docViewer" onclick="this.remove()"><div class="modal" style="text-align:center;padding:20px;" onclick="event.stopPropagation()"><h3>' + d.name + '</h3><img src="' + src + '" style="max-width:100%;max-height:60vh;border-radius:12px;margin:12px 0;"><br><button class="btn btn-outline btn-sm" onclick="document.getElementById(\'docViewer\').remove()">Fermer</button></div></div>';
    document.getElementById('app').insertAdjacentHTML('beforeend', h);
  } else { window.open(src, '_blank'); }
}
