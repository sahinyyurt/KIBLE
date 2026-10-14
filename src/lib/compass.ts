import { normalizeDegrees, toDegrees, toRadians } from './angles.ts';

const MIN_HORIZONTAL_PROJECTION = 0.15;
const MAX_COMPASS_ACCURACY_DEGREES = 30;

export interface CompassReading {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
  absolute: boolean;
  webkitCompassHeading?: number;
  webkitCompassAccuracy?: number;
}

// W3C intrinsic Z-X'-Y'' orientation; Earth X=east, Y=north.
export function tiltHeading(
  alpha: number,
  beta: number,
  gamma: number,
  screenAngle = 0,
): number | null {
  if (![alpha, beta, gamma, screenAngle].every(Number.isFinite)) {
    return null;
  }

  const yaw = toRadians(alpha);
  const pitch = toRadians(beta);
  const roll = toRadians(gamma);
  const screenRotation = toRadians(screenAngle);
  const cosYaw = Math.cos(yaw);
  const sinYaw = Math.sin(yaw);
  const cosPitch = Math.cos(pitch);
  const sinPitch = Math.sin(pitch);
  const cosRoll = Math.cos(roll);
  const sinRoll = Math.sin(roll);

  // Project the visible screen-top axis onto the ground using Rz(alpha)
  // Rx(beta) Ry(gamma). The perpendicular of screen-right is NOT equivalent
  // when the phone is tilted around more than one axis.
  const projectedEast =
    -sinYaw * cosPitch * Math.cos(screenRotation) +
    (cosYaw * cosRoll - sinYaw * sinPitch * sinRoll) * Math.sin(screenRotation);
  const projectedNorth =
    cosYaw * cosPitch * Math.cos(screenRotation) +
    (sinYaw * cosRoll + cosYaw * sinPitch * sinRoll) * Math.sin(screenRotation);

  // A nearly vertical top edge has no reliable horizontal direction.
  if (Math.hypot(projectedEast, projectedNorth) < MIN_HORIZONTAL_PROJECTION) {
    return null;
  }

  return normalizeDegrees(toDegrees(Math.atan2(projectedEast, projectedNorth)));
}

/** Undefined readings are ignored; null clears a heading at an unstable tilt. */
export function readCompassHeading(
  reading: CompassReading,
  screenAngle: number,
): number | null | undefined {
  const { webkitCompassHeading, webkitCompassAccuracy, absolute, alpha, beta, gamma } = reading;

  if (typeof webkitCompassHeading === 'number' && Number.isFinite(webkitCompassHeading)) {
    if (
      typeof webkitCompassAccuracy === 'number' &&
      (webkitCompassAccuracy < 0 || webkitCompassAccuracy > MAX_COMPASS_ACCURACY_DEGREES)
    ) {
      return undefined;
    }

    // Safari provides a north-referenced compass heading directly.
    return normalizeDegrees(webkitCompassHeading + screenAngle);
  }

  if (absolute && alpha !== null && beta !== null && gamma !== null) {
    return tiltHeading(alpha, beta, gamma, screenAngle);
  }

  return undefined;
}
