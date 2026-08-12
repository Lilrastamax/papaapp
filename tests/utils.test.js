import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dateISO, todayISO, daysUntil, apptIcon, isMedical, activiteIcon, sha256, uid } from '../js/utils.js';

test('dateISO formate une date en ISO local', () => {
  assert.equal(dateISO(new Date(2026, 7, 12)), '2026-08-12');
});

test('todayISO a le format AAAA-MM-JJ', () => {
  assert.match(todayISO(), /^\d{4}-\d{2}-\d{2}$/);
});

test('daysUntil renvoie 9999 sans date, négatif pour le passé', () => {
  assert.equal(daysUntil(), 9999);
  assert.equal(daysUntil(''), 9999);
  assert.ok(daysUntil('2000-01-01') < 0);
});

test('apptIcon reconnaît les catégories', () => {
  assert.equal(apptIcon('RDV pédiatre'), '🩺');
  assert.equal(apptIcon('Coiffeur'), '💇');
  assert.equal(apptIcon('Réunion'), '📅');
});

test('isMedical détecte le médical', () => {
  assert.equal(isMedical('pédiatre'), true);
  assert.equal(isMedical('infirmier'), true);
  assert.equal(isMedical('coiffeur'), false);
});

test('activiteIcon reconnaît les activités', () => {
  assert.equal(activiteIcon('foot'), '⚽');
  assert.equal(activiteIcon('piano'), '🎵');
});

test('sha256 produit le bon hash', async () => {
  assert.equal(await sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('uid génère des identifiants uniques non vides', () => {
  const a = uid(), b = uid();
  assert.ok(a.length > 0 && b.length > 0);
  assert.notEqual(a, b);
});
