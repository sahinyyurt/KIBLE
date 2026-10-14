export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

/** Signed shortest turn from the current heading to the target: positive is right. */
export function getHeadingDifference(target: number, current: number): number {
  return normalizeDegrees(target - current + 180) - 180;
}
