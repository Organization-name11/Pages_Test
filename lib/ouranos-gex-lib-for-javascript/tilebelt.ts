
import type { BBox } from "geojson";

const d2r = Math.PI / 180,
      r2d = 180 / Math.PI,
      MAX_ZOOM = 28;

/**
 * BBox（geojson の型は number[]）を 4 要素のタプル
 * [minX, minY, maxX, maxY] に正規化するヘルパー。
 * noUncheckedIndexedAccess=true 下での undefined を除去します。
 */
function assertNumber(v: unknown, name: string): number {
  if (typeof v !== "number" || Number.isNaN(v)) {
    throw new Error(`Expected number for '${name}', got ${String(v)}`);
  }
  return v;
}

function ensureBBox4(bbox: BBox): [number, number, number, number] {
  // geojson の BBox は number[] なので、長さ保証がない前提で取り出す
  const minX = assertNumber(bbox[0], "bbox[0] (minX)");
  const minY = assertNumber(bbox[1], "bbox[1] (minY)");
  const maxX = assertNumber(bbox[2], "bbox[2] (maxX)");
  const maxY = assertNumber(bbox[3], "bbox[3] (maxY)");
  return [minX, minY, maxX, maxY];
}

export function getBboxZoom(bbox: BBox): number {
  // ビット演算を行うため、4要素へ正規化する
  const [minX, minY, maxX, maxY] = ensureBBox4(bbox);

  for (let z = 0; z < MAX_ZOOM; z++) {
    const mask = 1 << (32 - (z + 1));
    if (((minX & mask) !== (maxX & mask)) ||
        ((minY & mask) !== (maxY & mask))) {
      return z;
    }
  }

  return MAX_ZOOM;
}

/**
 * Get the smallest tile to cover a bbox
 * 戻り値は [x, y, z] のタプル
 */
export function bboxToTile(bboxCoords: BBox, minZoom?: number): [number, number, number] {
  const [minX, minY, maxX, maxY] = ensureBBox4(bboxCoords);

  const min: [number, number, number] = pointToTile(minX, minY, 32);
  const max: [number, number, number] = pointToTile(maxX, maxY, 32);
  const bbox4: [number, number, number, number] = [min[0], min[1], max[0], max[1]];

  const z = Math.min(getBboxZoom(bbox4), typeof minZoom !== 'undefined' ? minZoom : MAX_ZOOM);
  if (z === 0) return [0, 0, 0];

  const x = bbox4[0] >>> (32 - z);
  const y = bbox4[1] >>> (32 - z);
  return [x, y, z];
}

/**
 * Get the tile for a point at a specified zoom level
 * 戻り値は [x, y, z] のタプル
 */
export function pointToTile(lon: number, lat: number, z: number): [number, number, number] {
  const tile: [number, number, number] = pointToTileFraction(lon, lat, z);
  tile[0] = Math.floor(tile[0]);
  tile[1] = Math.floor(tile[1]);
  return tile;
}

/**
 * Get the precise fractional tile location for a point at a zoom level
 * 戻り値は [x, y, z] のタプル
 */
function pointToTileFraction(lon: number, lat: number, z: number): [number, number, number] {
  let sin = Math.sin(lat * d2r),
      z2 = Math.pow(2, z),
      x = z2 * (lon / 360 + 0.5),
      y = z2 * (0.5 - 0.25 * Math.log((1 + sin) / (1 - sin)) / Math.PI);

  // Wrap Tile X
  x = x % z2;
  if (x < 0) x = x + z2;
   return [x, y, z];
}