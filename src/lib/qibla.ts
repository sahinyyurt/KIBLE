import type { Coordinates } from '../types/location.ts';
import { normalizeDegrees, toDegrees, toRadians } from './angles.ts';

const KAABA: Coordinates = { latitude: 21.422487, longitude: 39.826206 };
const EARTH_RADIUS_KM = 6371;

export interface QiblaResult {
  bearing: number;
  distanceKm: number;
}

/** Initial great-circle bearing from true north and distance to the Kaaba. */
export function calculateQibla(coordinates: Coordinates): QiblaResult {
  const latitude = toRadians(coordinates.latitude);
  const kaabaLatitude = toRadians(KAABA.latitude);
  const longitudeDifference = toRadians(KAABA.longitude - coordinates.longitude);

  const bearingY = Math.sin(longitudeDifference) * Math.cos(kaabaLatitude);
  const bearingX =
    Math.cos(latitude) * Math.sin(kaabaLatitude) -
    Math.sin(latitude) * Math.cos(kaabaLatitude) * Math.cos(longitudeDifference);

  const haversine =
    Math.sin((kaabaLatitude - latitude) / 2) ** 2 +
    Math.cos(latitude) * Math.cos(kaabaLatitude) * Math.sin(longitudeDifference / 2) ** 2;
  // Floating-point rounding can put the haversine just outside [0, 1].
  const clampedHaversine = Math.min(1, Math.max(0, haversine));
  const centralAngle = 2 * Math.atan2(Math.sqrt(clampedHaversine), Math.sqrt(1 - clampedHaversine));

  return {
    bearing: normalizeDegrees(toDegrees(Math.atan2(bearingY, bearingX))),
    distanceKm: EARTH_RADIUS_KM * centralAngle,
  };
}
