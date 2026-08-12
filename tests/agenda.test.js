import { test } from 'node:test';
import assert from 'node:assert/strict';
import { custodyType } from '../js/screens/agenda.js';

test('custodyType: jour normal = papa', () => {
  assert.equal(custodyType('2026-08-12', new Set(), [], []), 'papa');
});

test('custodyType: dimanche automatique = maman', () => {
  assert.equal(custodyType('2026-08-16', new Set(['2026-08-16']), [], []), 'maman');
});

test('custodyType: override Papa gagne sur dimanche automatique', () => {
  const auto = new Set(['2026-08-16']);
  const overrides = [{ date: '2026-08-16', who: 'Papa', cancelled: false }];
  assert.equal(custodyType('2026-08-16', auto, overrides, []), 'papa');
});

test('custodyType: annulé', () => {
  const auto = new Set(['2026-08-16']);
  const overrides = [{ date: '2026-08-16', who: 'Maman', cancelled: true }];
  assert.equal(custodyType('2026-08-16', auto, overrides, []), 'cancelled');
});

test('custodyType: papy/mamie', () => {
  const overrides = [{ date: '2026-08-16', who: 'Papy/Mamie', cancelled: false }];
  assert.equal(custodyType('2026-08-16', new Set(), overrides, []), 'papy');
});

test('custodyType: visite supplémentaire', () => {
  const extra = [{ date: '2026-08-16', cancelled: false }];
  assert.equal(custodyType('2026-08-16', new Set(), [], extra), 'extra');
});
