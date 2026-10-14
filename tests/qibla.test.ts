import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateQibla } from '../src/lib/qibla.ts';
import { getHeadingDifference, normalizeDegrees } from '../src/lib/angles.ts';

test('Istanbul has the expected southeasterly bearing and distance', () => {
  const result = calculateQibla({ latitude: 41.0082, longitude: 28.9784 });
  assert.ok(Math.abs(result.bearing - 151.6) < 0.1);
  assert.ok(Math.abs(result.distanceKm - 2405.1) < 0.1);
});

test('Locations on the Kaaba meridian point north or south', () => {
  assert.equal(calculateQibla({ latitude: 0, longitude: 39.826206 }).bearing, 0);
  assert.equal(calculateQibla({ latitude: 40, longitude: 39.826206 }).bearing, 180);
});

test('Distance is zero at the Kaaba and finite at its antipode', () => {
  assert.equal(calculateQibla({ latitude: 21.422487, longitude: 39.826206 }).distanceKm, 0);
  const antipode = calculateQibla({ latitude: -21.422487, longitude: -140.173794 });
  assert.ok(Number.isFinite(antipode.distanceKm));
  assert.ok(Math.abs(antipode.distanceKm - 20_015) < 1);
});

test('Turns take the shortest path across north', () => {
  assert.equal(getHeadingDifference(1, 359), 2);
  assert.equal(getHeadingDifference(359, 1), -2);
  assert.equal(getHeadingDifference(90, 90), 0);
  assert.equal(normalizeDegrees(-10), 350);
  assert.equal(normalizeDegrees(720), 0);
});
