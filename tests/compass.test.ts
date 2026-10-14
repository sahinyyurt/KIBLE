import test from 'node:test';
import assert from 'node:assert/strict';
import { readCompassHeading, tiltHeading, type CompassReading } from '../src/lib/compass.ts';

const absoluteReading: CompassReading = { absolute: true, alpha: 90, beta: 0, gamma: 0 };

test('Cardinal headings remain stable from flat to upright', () => {
  for (const pitch of [0, 30, 60, 89, 90, 110]) {
    for (const yaw of [0, 90, 180, 270]) {
      const heading = tiltHeading(yaw, pitch, 0);
      assert.notEqual(heading, null);
      assert.ok(heading !== null && Math.abs(heading - ((360 - yaw) % 360)) < 1e-8);
    }
  }
});

test('Landscape rotates the screen reference', () => {
  assert.equal(tiltHeading(0, 0, 0, 90), 90);
  assert.equal(tiltHeading(0, 0, 0, 270), 270);
});

test('Unstable and invalid readings are not shown as a heading', () => {
  assert.equal(tiltHeading(0, 90, 0, 90), null);
  assert.equal(tiltHeading(NaN, 0, 0), null);
});

test('Safari headings use the screen rotation and ignore inaccurate readings', () => {
  assert.equal(readCompassHeading({ ...absoluteReading, webkitCompassHeading: 350 }, 90), 80);
  for (const accuracy of [-1, 31]) {
    assert.equal(
      readCompassHeading(
        { ...absoluteReading, webkitCompassHeading: 90, webkitCompassAccuracy: accuracy },
        0,
      ),
      undefined,
    );
  }
});

test('Only complete absolute orientation readings supply a heading', () => {
  assert.equal(readCompassHeading(absoluteReading, 0), 270);
  assert.equal(readCompassHeading({ ...absoluteReading, absolute: false }, 0), undefined);
  assert.equal(readCompassHeading({ ...absoluteReading, alpha: null }, 0), undefined);
});

test('Unstable tilt clears the current heading instead of being ignored', () => {
  assert.equal(readCompassHeading({ ...absoluteReading, alpha: 0, beta: 90 }, 90), null);
});
