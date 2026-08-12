import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DB, setDB, defaultDB, loadDB, saveDB, resetDailyChecklists } from '../js/store.js';

const mem = {};
globalThis.localStorage = {
  getItem: k => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: k => { delete mem[k]; },
  clear: () => { for (const k in mem) delete mem[k]; }
};

beforeEach(() => {
  localStorage.clear();
  setDB(defaultDB());
});

test('defaultDB a la structure attendue', () => {
  const db = defaultDB();
  assert.equal(db.settings.childName, 'Ayden');
  assert.equal(db.contacts.length, 3);
  assert.ok(db.checklists.morning && db.checklists.evening && db.checklists.sunday);
  assert.equal(db.checklists.morning.length, 6);
});

test('saveDB puis loadDB (round-trip)', () => {
  DB.settings.childName = 'Ayden';
  DB.appointments.push({ _id: 'x1', type: 'Pédiatre' });
  saveDB();
  const fresh = loadDB();
  assert.equal(fresh.settings.childName, 'Ayden');
  assert.equal(fresh.appointments[0].type, 'Pédiatre');
});

test('resetDailyChecklists décoche les routines', () => {
  DB.checklists.morning[0].checked = true;
  DB.checklists.evening[1].checked = true;
  resetDailyChecklists();
  assert.equal(DB.checklists.morning[0].checked, false);
  assert.equal(DB.checklists.evening[1].checked, false);
});
