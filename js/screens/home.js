import { DB, S } from '../store.js';
import { fmtLong, fmtShort, fmtToday, todayISO, dateISO, daysUntil, childAge } from '../utils.js';
import { getNextSundays, getUpcomingSunday } from '../sundays.js';
import { showApptModal } from '../modal.js';

// ----- HOME -----
export function renderHome() {
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

export function renderWeekCalendar() {
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

export function addApptForDate(d) { showApptModal(d); }
