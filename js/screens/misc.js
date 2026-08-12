import { DB, saveDB } from '../store.js';
import { fmtLong, fmtShort, todayISO, dateISO } from '../utils.js';
import { cloudPushSettings } from '../api.js';
import { render, getDocDisplay } from '../render.js';

// ----- DOCS, CONTACTS, DAILY, PLUS -----
export function renderDocs() {
  return `<div class="card"><div class="card-title">📂 Documents</div>${DB.documents.length ? DB.documents.map(d => `<div class="doc-item"><div class="doc-icon">${getDocDisplay(d)}</div><div class="doc-info"><div class="name">${d.name}${d.fileType === 'pdf' ? ' (PDF)' : ''}</div><div class="meta">${d.category} · ${d.notes || fmtLong(d.dateAdded)}</div></div><span class="badge badge-${d.status === 'warn' ? 'warn' : 'ok'}">${d.status === 'warn' ? '⚠️' : '✓'}</span><button class="btn-del" onclick="event.stopPropagation();delFrom(DB.documents,'${d._id}')">×</button></div>`).join('') : '<div class="empty"><div class="icon">📂</div><div class="title">Aucun document</div><div class="sub">Scanne ou importe PDF, images...</div></div>'}<button class="btn btn-primary btn-full" style="margin-top:8px" data-action="add-doc">📎 Importer</button></div>`;
}

export function renderContacts() {
  const em = DB.contacts.filter(c => ['SAMU', 'Pompiers', 'Police'].includes(c.name));
  const med = DB.contacts.filter(c => c.specialty && !em.includes(c));
  const other = DB.contacts.filter(c => !em.includes(c) && !med.includes(c));
  return `<div class="card"><div class="card-title">🆘 Urgences</div>${em.map(c => `<div class="doc-item"><div class="doc-icon">${c.name === 'SAMU' ? '🏥' : c.name === 'Pompiers' ? '🚒' : '👮'}</div><div class="doc-info"><div class="name">${c.name}</div><div class="meta">${c.role}</div></div><a href="tel:${c.phone}" style="font-weight:700;color:var(--danger);text-decoration:none;">${c.phone}</a></div>`).join('')}</div>
    <div class="card"><div class="card-title">👨‍⚕️ Médical</div>${med.length ? med.map(c => `<div class="doc-item"><div class="doc-icon">${c.specialty === 'Pédiatre' ? '🩺' : c.specialty === 'Dentiste' ? '🦷' : c.specialty === 'Ophtalmo' ? '👁️' : '💊'}</div><div class="doc-info"><div class="name">${c.name}</div><div class="meta">${c.specialty} · ${c.phone}${c.notes ? ' · ' + c.notes : ''}</div></div><a href="tel:${c.phone}" style="font-weight:600;color:var(--primary);text-decoration:none;">📞</a><button class="btn-del" onclick="event.stopPropagation();delFrom(DB.contacts,'${c._id}')">×</button></div>`).join('') : '<div class="empty"><div class="sub">Aucun contact médical</div></div>'}</div>
    <div class="card"><div class="card-title">👥 Autres</div>${other.length ? other.map(c => `<div class="doc-item"><div class="doc-icon">👤</div><div class="doc-info"><div class="name">${c.name}</div><div class="meta">${c.role}${c.notes ? ' · ' + c.notes : ''}</div></div><a href="tel:${c.phone}" style="font-weight:600;color:var(--primary);text-decoration:none;">📞</a><button class="btn-del" onclick="event.stopPropagation();delFrom(DB.contacts,'${c._id}')">×</button></div>`).join('') : '<div class="empty"><div class="sub">Ajoute tes contacts</div></div>'}<button class="btn btn-outline btn-full btn-sm" style="margin-top:8px" data-action="add-contact">+ Contact</button></div>`;
}

export function renderDaily() {
  return `<div class="card"><div class="card-title">🌅 Matin</div>${DB.checklists.morning.map(i => `<div class="cl-item"><input type="checkbox" id="mor-${i.id}" ${i.checked ? 'checked' : ''} data-cl="morning" data-id="${i.id}"><label for="mor-${i.id}">${i.label}</label></div>`).join('')}</div>
    <div class="card"><div class="card-title">🌙 Soir</div>${DB.checklists.evening.map(i => `<div class="cl-item"><input type="checkbox" id="eve-${i.id}" ${i.checked ? 'checked' : ''} data-cl="evening" data-id="${i.id}"><label for="eve-${i.id}">${i.label}</label></div>`).join('')}</div>
    <div class="card"><div class="card-title">🛒 Courses</div>${(DB.shoppingList || []).length ? DB.shoppingList.map((it, i) => `<div class="cl-item"><input type="checkbox" id="shop-${i}" ${it.checked ? 'checked' : ''} data-cl="shopping" data-idx="${i}"><label for="shop-${i}">${it.label}</label><button class="btn-del" onclick="event.stopPropagation();DB.shoppingList.splice(${i},1);saveDB();cloudPushSettings();render();">×</button></div>`).join('') : '<div class="empty"><div class="sub">Ajoute des articles</div></div>'}<div style="display:flex;gap:8px;margin-top:8px;"><input type="text" id="shopInput" placeholder="Article" style="flex:1;padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-size:13px;"><button class="btn btn-primary btn-sm" id="shopAdd">+</button></div></div>
    <div class="card"><div class="card-title">👕 Tailles de ${DB.settings.childName}</div>${renderClothingSizes()}<button class="btn btn-outline btn-full btn-sm" style="margin-top:8px" data-action="add-clothing">+ Vêtement</button></div>
    <div class="card"><div class="card-title">🔁 Tâches récurrentes</div>${renderRecurringTasks()}<button class="btn btn-outline btn-full btn-sm" style="margin-top:8px" data-action="add-recurring">+ Tâche</button></div>
    <div class="card"><div class="card-title">💎 Journal</div>${DB.memories.slice(-5).reverse().map((m, i) => `<div class="mem-card"><div class="mem-img c${(i % 3) + 1}">${m.mood || '💎'}</div><div class="mem-body"><div class="date">${fmtLong(m.date)}</div><div class="text">${m.text}</div></div></div>`).join('') || '<div class="empty"><div class="sub">Aucun souvenir</div></div>'}<button class="btn btn-outline btn-full btn-sm" style="margin-top:4px" data-action="add-memory">+ Souvenir</button></div>`;
}

export function renderPlus() {
  return `<div class="card" onclick="navigate('daily')" style="cursor:pointer;"><div class="card-title">🌿 Quotidien</div><div style="font-size:12px;color:var(--text-light);">Routines, courses, journal, tailles, tâches</div></div>
    <div class="card" onclick="navigate('docs')" style="cursor:pointer;"><div class="card-title">📂 Documents</div><div style="font-size:12px;color:var(--text-light);">Scans, papiers administratifs</div></div>
    <div class="card" onclick="navigate('contacts')" style="cursor:pointer;"><div class="card-title">📞 Contacts</div><div style="font-size:12px;color:var(--text-light);">Urgences, médecin, crèche, famille</div></div>
    <div class="card" onclick="showSettings()" style="cursor:pointer;"><div class="card-title">⚙️ Paramètres</div><div style="font-size:12px;color:var(--text-light);">Profil, dimanches, école, PIN</div></div>
    <div class="card" onclick="exportData()" style="cursor:pointer;"><div class="card-title">📤 Sauvegarder</div><div style="font-size:12px;color:var(--text-light);">Télécharger une copie de toutes tes données</div></div>`;
}

export function renderClothingSizes() {
  const ch = (DB.clothingHistory || []).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  if (!ch.length) return '<div class="empty"><div class="sub">Ajoute la taille actuelle</div></div>';
  const latest = {}; ch.forEach(c => { if (!latest[c.category]) latest[c.category] = c; });
  return `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">${Object.entries(latest).map(([cat, c]) => `<div style="background:var(--primary-light);border-radius:12px;padding:8px 14px;text-align:center;"><div style="font-size:10px;color:var(--text-light);font-weight:600;">${cat}</div><div style="font-size:16px;font-weight:800;color:var(--primary);">${c.size || '?'}</div></div>`).join('')}</div>${ch.slice(0, 3).map(c => `<div class="doc-item"><div style="flex:1;font-size:11px;"><b>${c.category}:</b> ${c.item || c.size}${c.outgrown ? ' <span style="color:var(--danger);">(trop petit)</span>' : ''}</div><div style="font-size:10px;color:var(--text-light);">${fmtShort(c.date)}</div><button class="btn-del" onclick="event.stopPropagation();delFrom(DB.clothingHistory,'${c._id}')">×</button></div>`).join('')}`;
}

export function renderRecurringTasks() {
  const tasks = (DB.recurringTasks || []).sort((a, b) => (a.nextDue || '').localeCompare(b.nextDue || ''));
  if (!tasks.length) return '<div class="empty"><div class="sub">Ajoute des tâches récurrentes</div></div>';
  return tasks.map(t => { const overdue = new Date(t.nextDue) < new Date(todayISO()); return `<div class="cl-item"><input type="checkbox" id="rt-${t._id}" ${t.lastDone === todayISO() ? 'checked' : ''} onchange="doRecurringTask('${t._id}',this.checked)"><label for="rt-${t._id}">${t.label} <span style="font-size:10px;color:${overdue ? 'var(--danger)' : 'var(--text-light)'};">${overdue ? '⚠️ ' : ''}${fmtShort(t.nextDue)} (${t.freq})</span></label><button class="btn-del" onclick="event.stopPropagation();delFrom(DB.recurringTasks,'${t._id}')">×</button></div>`; }).join('');
}
export function doRecurringTask(id, checked) {
  const t = (DB.recurringTasks || []).find(x => x._id === id); if (!t) return;
  if (checked) { t.lastDone = todayISO(); const nd = new Date(); nd.setDate(nd.getDate() + t.intervalDays); t.nextDue = dateISO(nd); }
  saveDB(); cloudPushSettings(); render();
}
