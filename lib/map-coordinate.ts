import type { LatLngTuple } from "leaflet";

export type CoordinateValue = string | number | null | undefined;

/**
 * Converts API/database coordinate values into finite numbers in the expected
 * geographic range. Decimal comma values are supported because coordinates
 * may originate from Indonesian spreadsheets.
 */
export function parseMapCoordinate(
  value: CoordinateValue,
  min: number,
  max: number,
): number | null {
  if (value == null) return null;

  const normalized = String(value).trim().replace(",", ".");
  if (!normalized) return null;

  const coordinate = Number(normalized);
  if (!Number.isFinite(coordinate) || coordinate < min || coordinate > max) {
    return null;
  }

  return coordinate;
}

/**
 * Returns a Leaflet-safe position or null when either coordinate is missing,
 * malformed, infinite, or outside the valid latitude/longitude range.
 * The pair (0, 0) is treated as an unset placeholder while valid points on the
 * equator or prime meridian remain accepted.
 */
export function getValidMapPosition(site: {
  lat: CoordinateValue;
  lng: CoordinateValue;
}): LatLngTuple | null {
  const lat = parseMapCoordinate(site.lat, -90, 90);
  const lng = parseMapCoordinate(site.lng, -180, 180);

  if (lat == null || lng == null || (lat === 0 && lng === 0)) return null;

  return [lat, lng];
}
