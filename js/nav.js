import { S } from './store.js';
import { $, $$ } from './utils.js';
import { render, handleAction } from './render.js';
import { showSettings } from './modal.js';
import { showEmergency, toggleDark, lockApp } from './ui.js';

// ========== NAVIGATION ==========
export function initNav() {
  $$('#bottomNav .nav-item').forEach(i => i.onclick = () => navigate(i.dataset.screen));
  $('#btnSettings').onclick = showSettings;
  $('#btnEmergency').onclick = showEmergency;
  $('#btnDark').onclick = toggleDark;
  $('#btnLock').onclick = () => lockApp('manual');
  initFab();
}

export function navigate(s) {
  S.screen = s;
  render();
  $$('#bottomNav .nav-item').forEach(n => n.classList.toggle('active', n.dataset.screen === s === true));
  $('#screenContainer').scrollTop = 0;
  updateFab();
}

// ========== FAB ==========
export function initFab() {
  const fab = $('#fab');
  if (!fab) return;
  fab.onclick = () => { S.fabOpen = !S.fabOpen; fab.classList.toggle('open', S.fabOpen); $('#fabMenu').classList.toggle('visible', S.fabOpen); };
  document.addEventListener('click', e => { if (S.fabOpen && !e.target.closest('#fab') && !e.target.closest('#fabMenu')) { S.fabOpen = false; fab.classList.remove('open'); $('#fabMenu').classList.remove('visible'); } });
}

export function updateFab() {
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
