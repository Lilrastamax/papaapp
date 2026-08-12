import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DB, setDB, defaultDB } from '../js/store.js';
import { getNextSundays, getUpcomingSunday } from '../js/sundays.js';
import { dateISO } from '../js/utils.js';

test('getNextSundays renvoie 4 dimanches espacés de 14 jours (date future)', () => {
  setDB(defaultDB());
  DB.settings.firstSundayDate = '2030-01-06';
  DB.settings.sundayInterval = 14;
  const dates = getNextSundays().map(d => dateISO(d));
  assert.deepEqual(dates, ['2030-01-06', '2030-01-20', '2030-02-03', '2030-02-17']);
});

test('getUpcomingSunday renvoie le prochain dimanche', () => {
  setDB(defaultDB());
  DB.settings.firstSundayDate = '2030-01-06';
  DB.settings.sundayInterval = 14;
  assert.equal(dateISO(getUpcomingSunday()), '2030-01-06');
});

test('getNextSundays renvoie [] sans firstSundayDate', () => {
  setDB(defaultDB());
  DB.settings.firstSundayDate = '';
  assert.deepEqual(getNextSundays(), []);
});
