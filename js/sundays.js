import { DB } from './store.js';
import { dateISO } from './utils.js';

// ========== DIMANCHES ==========
export function getNextSundays() {
  const fd = DB.settings.firstSundayDate;
  if (!fd) return [];
  const ref = new Date(fd), now = new Date(); now.setHours(0, 0, 0, 0);
  let d = new Date(ref);
  while (d <= now) d.setDate(d.getDate() + (DB.settings.sundayInterval || 14));
  const out = [];
  for (let i = 0; i < 4; i++) { out.push(new Date(d)); d.setDate(d.getDate() + (DB.settings.sundayInterval || 14)); }
  return out;
}
export function getUpcomingSunday() { const s = getNextSundays(); return s.length ? s[0] : null; }
