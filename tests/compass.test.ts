import test from 'node:test';
import assert from 'node:assert/strict';
import { readCompassHeading, tiltHeading, type CompassReading } from '../src/lib/compass.ts';

const absoluteReading: CompassReading = { absolute: true, alpha: 90, beta: 0, gamma: 0 };

test('Tilting sideways around a north-pointing top edge does not change its bearing', () => {
  // Rz(0) Rx(60) Ry(45) leaves the screen-top axis pointing north/up.
  // Its east component is zero, so its azimuth must remain north.
  assert.equal(tiltHeading(0, 60, 45), 0);
  assert.equal(tiltHeading(270, 60, 45), 90);
});

test('Cardinal headings remain stable while the top edge has a horizontal projection', () => {
  for (const pitch of [-60, -30, 0, 30, 60, 80]) {
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
  assert.equal(tiltHeading(0, 90, 0), null);
  assert.equal(tiltHeading(0, 89, 45), null);
  assert.equal(tiltHeading(0, 0, 90, 90), null);
  assert.equal(tiltHeading(NaN, 0, 0), null);
});

test('Landscape uses the visible top edge, including compound tilt', () => {
  // In landscape the top is the physical right edge. At this pose its
  // east/north components are sqrt(1/2) and sqrt(3/8).
  const expected = (Math.atan2(Math.SQRT1_2, Math.sqrt(3 / 8)) * 180) / Math.PI;
  assert.ok(Math.abs(tiltHeading(0, 60, 45, 90)! - expected) < 1e-8);
  assert.ok(Math.abs(tiltHeading(0, 60, 45, 270)! - (expected + 180)) < 1e-8);
  assert.equal(tiltHeading(0, 0, 0, 180), 180);
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
  assert.equal(readCompassHeading({ ...absoluteReading, alpha: 0, beta: 90 }, 0), null);
});
