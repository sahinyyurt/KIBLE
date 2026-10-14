import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCoordinates } from '../src/lib/location.ts';

test('Coordinates accept decimal dots, Turkish decimal commas and zero', () => {
  assert.deepEqual(parseCoordinates('41,0082', '28.9784'), {
    latitude: 41.0082,
    longitude: 28.9784,
  });
  assert.deepEqual(parseCoordinates(' 0 ', '0'), { latitude: 0, longitude: 0 });
});

test('Empty, non-finite and out-of-range coordinates are rejected', () => {
  const invalidInputs: [string, string][] = [
    ['', '0'],
    ['0', ' '],
    ['abc', '0'],
    ['Infinity', '0'],
    ['90', '0'],
    ['-90', '0'],
    ['91', '0'],
    ['0', '181'],
    ['0', '-181'],
  ];

  for (const [latitude, longitude] of invalidInputs) {
    assert.equal(parseCoordinates(latitude, longitude), null);
  }
});

test('Both antimeridian boundaries are valid longitudes', () => {
  assert.deepEqual(parseCoordinates('0', '-180'), { latitude: 0, longitude: -180 });
  assert.deepEqual(parseCoordinates('0', '180'), { latitude: 0, longitude: 180 });
});
