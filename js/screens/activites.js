import { DB } from '../store.js';
import { fmtLong, activiteIcon } from '../utils.js';

// ----- ACTIVITÉS -----
export function formatActiviteMeta(a) { if (a.recurring) return `🔄 Chaque ${a.day || '?'} · ${a.time || ''}${a.lieu ? ' · ' + a.lieu : ''}${a.coach ? ' · ' + a.coach : ''}${a.notes ? ' · ' + a.notes : ''}`; return `📅 ${a.date ? fmtLong(a.date) : ''} · ${a.time || ''}${a.lieu ? ' · ' + a.lieu : ''}${a.coach ? ' · ' + a.coach : ''}${a.notes ? ' · ' + a.notes : ''}`; }

export function renderActivites() {
  const DAYS = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const actAyden = (DB.activites || []).sort((a, b) => { return DAYS.indexOf(a.day || '') - DAYS.indexOf(b.day || ''); });
  const actPapa = (DB.papaActivites || []).sort((a, b) => { return DAYS.indexOf(a.day || '') - DAYS.indexOf(b.day || ''); });
  const actEnsemble = (DB.papaAydenActivites || []).sort((a, b) => { return DAYS.indexOf(a.day || '') - DAYS.indexOf(b.day || ''); });
  return `<div class="agenda-grid">
    <div class="card" style="grid-column:1/-1;"><div class="card-title">👨‍👦 Ensemble</div></div>
    <div class="card"><div class="card-title">🎯 Activités à deux</div>
      ${actEnsemble.length ? actEnsemble.map(a => `<div class="doc-item" style="cursor:pointer;" onclick="editItem('papaAydenActivites','${a._id}')"><div class="doc-icon">${activiteIcon(a.type)}</div><div class="doc-info"><div class="name">${a.label}</div><div class="meta">${a.day || ''} ${a.time || ''} · ${a.lieu || ''}${a.notes ? ' · ' + a.notes : ''}</div></div><button class="btn-del" onclick="event.stopPropagation();delFrom(DB.papaAydenActivites,'${a._id}')">×</button></div>`).join('') : '<div class="empty"><div class="sub">Parc, sorties, balades...</div></div>'}
      <button class="btn btn-outline btn-full btn-sm" style="margin-top:8px" data-action="add-ensemble-activite">+ Activité</button></div>
    <div class="card" style="grid-column:1/-1;"><div class="card-title">👦 ${DB.settings.childName}</div></div>
    <div class="card"><div class="card-title">🎯 Ses activités</div>
      ${actAyden.length ? actAyden.map(a => `<div class="doc-item" style="cursor:pointer;" onclick="editItem('activites','${a._id}')"><div class="doc-icon">${activiteIcon(a.type)}</div><div class="doc-info"><div class="name">${a.label}</div><div class="meta">${formatActiviteMeta(a)}</div></div><button class="btn-del" onclick="event.stopPropagation();delFrom(DB.activites,'${a._id}')">×</button></div>`).join('') : '<div class="empty"><div class="sub">Foot, piscine, danse...</div></div>'}
      <button class="btn btn-outline btn-full btn-sm" style="margin-top:8px" data-action="add-activite">+ Activité</button></div>
    <div class="card" style="grid-column:1/-1;"><div class="card-title">👨 Papa</div></div>
    <div class="card"><div class="card-title">🎯 Mes activités</div>
      ${actPapa.length ? actPapa.map(a => `<div class="doc-item" style="cursor:pointer;" onclick="editItem('papaActivites','${a._id}')"><div class="doc-icon">${activiteIcon(a.type)}</div><div class="doc-info"><div class="name">${a.label}</div><div class="meta">${formatActiviteMeta(a)}</div></div><button class="btn-del" onclick="event.stopPropagation();delFrom(DB.papaActivites,'${a._id}')">×</button></div>`).join('') : '<div class="empty"><div class="sub">Sport, musique, loisirs...</div></div>'}
      <button class="btn btn-outline btn-full btn-sm" style="margin-top:8px" data-action="add-papa-activite">+ Mon activité</button></div>
  </div>`;
}
