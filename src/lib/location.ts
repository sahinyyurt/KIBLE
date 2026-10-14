import type { Coordinates } from '../types/location.ts';

export function parseCoordinates(
  latitudeInput: string,
  longitudeInput: string,
): Coordinates | null {
  const latitude = Number(latitudeInput.replace(',', '.'));
  const longitude = Number(longitudeInput.replace(',', '.'));

  if (
    !latitudeInput.trim() ||
    !longitudeInput.trim() ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude <= -90 ||
    latitude >= 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}
