import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildItemRows, applyCloudItems } from '../js/api.js';

test('buildItemRows extrait _id vers id et garde data sans _id', () => {
  const db = {
    appointments: [{ _id: 'a1', type: 'Pédiatre', date: '2026-09-01' }],
    vaccines: [{ _id: 'v1', name: 'DTP', done: false }]
  };
  const rows = buildItemRows(db);
  const apt = rows.find(r => r.id === 'a1');
  assert.equal(apt.type, 'appointments');
  assert.deepEqual(apt.data, { type: 'Pédiatre', date: '2026-09-01' });
  assert.equal(apt.data._id, undefined);
});

test('buildItemRows génère un id pour les items sans _id', () => {
  const db = { schoolDates: [{ date: '2026-09-01', label: 'Rentrée' }] };
  const rows = buildItemRows(db);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].type, 'schoolDates');
  assert.ok(rows[0].id);
  assert.equal(rows[0].data.date, '2026-09-01');
  assert.equal(rows[0].data.label, 'Rentrée');
});

test('applyCloudItems reconstruit les listes présentes', () => {
  const db = { appointments: [{ _id: 'old', type: 'X' }], vaccines: [] };
  applyCloudItems(db, [
    { id: 'a1', type: 'appointments', data: { type: 'Pédiatre' } },
    { id: 'v1', type: 'vaccines', data: { name: 'DTP' } }
  ]);
  assert.deepEqual(db.appointments, [{ _id: 'a1', type: 'Pédiatre' }]);
  assert.deepEqual(db.vaccines, [{ _id: 'v1', name: 'DTP' }]);
});

test('applyCloudItems laisse les types absents inchangés', () => {
  const db = { appointments: [{ _id: 'old', type: 'X' }] };
  applyCloudItems(db, []);
  assert.deepEqual(db.appointments, [{ _id: 'old', type: 'X' }]);
});
