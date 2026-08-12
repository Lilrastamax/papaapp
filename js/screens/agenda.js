import { DB, S, saveDB } from '../store.js';
import { dateISO, todayISO, fmtLong } from '../utils.js';
import { getNextSundays } from '../sundays.js';
import { cloudPushSettings } from '../api.js';
import { showModal, closeM } from '../modal.js';
import { navigate } from '../nav.js';
import { toast } from '../ui.js';

// ----- AGENDA -----
export function renderAgenda() {
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

export function renderPastSundays() {
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

export function renderMonthCalendar() {
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

export function showCustodyModal(dateStr, currentType) {
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
