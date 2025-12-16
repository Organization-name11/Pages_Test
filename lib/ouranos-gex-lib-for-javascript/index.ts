
// 型のみ（runtime では参照しない） → import type
import type { LngLatWithAltitude } from "./types";
import type { ZFXYTile } from "./zfxy";
import type { Geometry, Polygon, Position } from "geojson";

// 値（関数／定数など、runtime で使う） → 通常の import
import {
  calculateZFXY,
  getBBox,
  getChildren,
  getFloor,
  getParent,
  isZFXYTile,
  parseZFXYString,
  zfxyWraparound,        // ← 値（関数）。type ではなく通常 import
  getSurrounding,
  getCenterLngLatAlt
} from "./zfxy";

import { generateTilehash, parseZFXYTilehash } from "./zfxy_tilehash";

// Turf は値（関数）なので通常の import（@turf/* は default export を提供）
import turfBBox from "@turf/bbox";
import turfBooleanIntersects from "@turf/boolean-intersects";

import { bboxToTile, pointToTile } from "./tilebelt";

const DEFAULT_ZOOM = 25 as const;

/* ------------------------------------------------------------------ */
/* 数値保証ヘルパー                                                    */
/* ------------------------------------------------------------------ */

/**
 * 値が number であることを保証（undefined の場合はエラー）
 */
function assertNumber(v: unknown, name: string): number {
  if (typeof v !== "number" || Number.isNaN(v)) {
    throw new Error(`Expected number for '${name}', got ${String(v)}`);
  }
  return v;
}

/**
 * getBBox の戻り値を [minX, minY, maxX, maxY] に正規化する
 * サポートする形式:
 * - [number, number, number, number]
 * - [LngLatLike, LngLatLike] （min/max の 2点: {lng, lat} or [lng, lat]）
 */
function normalizeBBoxToNumbers(
  b: unknown
): [number, number, number, number] {
  if (
    Array.isArray(b) &&
    b.length === 4 &&
    b.every((v) => typeof v === "number")
  ) {
    // すでに [minX, minY, maxX, maxY]
    return b as [number, number, number, number];
  }

  if (Array.isArray(b) && b.length === 2) {
    const min = b[0] as any;
    const max = b[1] as any;

    // LngLat ライクに対応
    const minX = (typeof min?.lng === "number") ? min.lng
               : (Array.isArray(min) ? min[0] : undefined);
    const minY = (typeof min?.lat === "number") ? min.lat
               : (Array.isArray(min) ? min[1] : undefined);
    const maxX = (typeof max?.lng === "number") ? max.lng
               : (Array.isArray(max) ? max[0] : undefined);
    const maxY = (typeof max?.lat === "number") ? max.lat
               : (Array.isArray(max) ? max[1] : undefined);

    return [
      assertNumber(minX, "bbox.minX"),
      assertNumber(minY, "bbox.minY"),
      assertNumber(maxX, "bbox.maxX"),
      assertNumber(maxY, "bbox.maxY"),
    ];
  }

  throw new Error("Unsupported BBox format returned by getBBox()");
}

export class Space {
  center!: LngLatWithAltitude;
  alt!: number;
  zoom!: number;
  zfxy!: ZFXYTile;
  id!: string;
  zfxyStr!: string;
  tilehash!: string;
  // 必要なら bbox を保持したい場合は下記を使用
  // bbox?: [number, number, number, number];

  /**
   * Create a new Space
   *
   * @param input A LngLatWithAltitude or string containing either a ZFXY or tilehash-encoded ZFXY.
   * @param zoom Optional. Defaults to 25 when `input` is LngLatWithAltitude. Ignored when ZXFY or tilehash is provided.
   */
  constructor(input: LngLatWithAltitude | ZFXYTile | string, zoom?: number) {
    if (typeof input === 'string') {
      // parse string
      const zfxy = parseZFXYString(input) || parseZFXYTilehash(input);
      if (zfxy) {
        this.zfxy = zfxy;
        this._regenerateAttributesFromZFXY();
      } else {
        throw new Error(`parse ZFXY failed with input: ${input}`);
      }
      return;
    } else if (isZFXYTile(input)) {
      this.zfxy = input;
      this._regenerateAttributesFromZFXY();
      return;
    } else {
      // LngLatWithAltitude から計算
      const z = (typeof zoom !== 'undefined') ? zoom : DEFAULT_ZOOM;
      this.zfxy = calculateZFXY({ ...input, zoom: z });
    }

    this._regenerateAttributesFromZFXY();
  }

  /* - PUBLIC API - */

  up(by: number = 1) {
    return this.move({ f: by });
  }

  down(by: number = 1) {
    return this.move({ f: -by });
  }

  north(by: number = 1) {
    return this.move({ y: by });
  }

  south(by: number = 1) {
    return this.move({ y: -by });
  }

  east(by: number = 1) {
    return this.move({ x: by });
  }

  west(by: number = 1) {
    return this.move({ x: -by });
  }

  move(by: Partial<Omit<ZFXYTile, 'z'>>) {
    const newSpace = new Space(this.zfxy);
    const z = assertNumber(newSpace.zfxy.z, "zfxy.z");
    const f = assertNumber(newSpace.zfxy.f, "zfxy.f") + (by.f ?? 0);
    const x = assertNumber(newSpace.zfxy.x, "zfxy.x") + (by.x ?? 0);
    const y = assertNumber(newSpace.zfxy.y, "zfxy.y") + (by.y ?? 0);

    newSpace.zfxy = zfxyWraparound({ z, f, x, y });
    newSpace._regenerateAttributesFromZFXY();
    return newSpace;
  }

  parent(atZoom?: number) {
    const steps = (typeof atZoom === 'undefined')
      ? 1
      : assertNumber(this.zfxy.z, "zfxy.z") - assertNumber(atZoom, "atZoom");
    return new Space(getParent(this.zfxy, steps));
  }

  children() {
    return getChildren(this.zfxy).map((tile) => new Space(tile));
  }

  surroundings(): Space[] {
    // 同ズーム・同フロアの近傍（自分自身を除外）
    const sameLevel = getSurrounding(this.zfxy)
      .filter(({ z, f, x, y }) => `/${z}/${f}/${x}/${y}` !== this.zfxyStr)
      .map((tile) => new Space(tile));

    // 一つ上のフロアの近傍
    const upperLevel = getSurrounding(this.up().zfxy)
      .map((tile) => new Space(tile));

    // 一つ下のフロアの近傍
    const lowerLevel = getSurrounding(this.down().zfxy)
      .map((tile) => new Space(tile));

    return [
      ...sameLevel,
      ...upperLevel,
      ...lowerLevel,
    ];
  }

  /**
   * 現在の ZFXY タイルの GeoJSON Polygon を返す
   * - GeoJSON Position は [lng, lat]（または [lng, lat, alt]）の数値配列
   * - getBBox の戻り値形式差異を吸収してから生成
   */
  toPolygon(): Polygon {
    const bboxUnknown = getBBox(this.zfxy);
    const [minX, minY, maxX, maxY] = normalizeBBoxToNumbers(bboxUnknown);

    const ring: Position[] = [
      [minX, minY],
      [maxX, minY],
      [maxX, maxY],
      [minX, maxY],
      [minX, minY],
    ];
    return {
      type: "Polygon",
      coordinates: [ring],
    };
  }

  /**
   * Geometry と当該タイルが交差するかどうかの簡易判定
   */
  intersects(geometry: Geometry): boolean {
    const poly = this.toPolygon();
    return turfBooleanIntersects(poly as unknown as Geometry, geometry);
  }

  /**
   * 与えられた Geometry の bbox とこの Space の近傍タイル群のうち交差するものを返す（例）
   */
  intersectingNeighbors(geometry: Geometry): Space[] {
    const targetBBox = turfBBox(geometry); // [minX, minY, maxX, maxY]
    const repTile = bboxToTile(targetBBox); // 想定: [x, y, z?]
    const repX = assertNumber(repTile[0], "repTile.x");
    const repY = assertNumber(repTile[1], "repTile.y");
    const currentZ = assertNumber(this.zfxy.z, "zfxy.z");
    const repZ = (typeof repTile[2] === "number") ? repTile[2] : currentZ;

    const repSpace = new Space({ z: repZ, f: assertNumber(this.zfxy.f, "zfxy.f"), x: repX, y: repY });
    return repSpace.surroundings().filter(s => s.intersects(geometry));
  }

  /**
   * 任意の経緯度（高度付き）から、この Space を生成
   */
  static fromCenter(center: LngLatWithAltitude, zoom: number = DEFAULT_ZOOM): Space {
    const z = assertNumber(zoom, "zoom");
    return new Space(center, z);
  }

  /**
   * 任意のポイント（LngLat）を含むタイル（同ズーム・指定フロア）を生成
   */
  static fromPoint(lng: number, lat: number, f: number, z: number = DEFAULT_ZOOM): Space {
    const lon = assertNumber(lng, "lng");
    const la = assertNumber(lat, "lat");
    const zoom = assertNumber(z, "z");
    const floor = assertNumber(f, "f");

    const tile = pointToTile(lon, la, zoom); // 正しいシグネチャ（lon, lat, z）
    const x = assertNumber(tile[0], "tile.x");
    const y = assertNumber(tile[1], "tile.y");
    return new Space({ z: zoom, f: floor, x, y });
  }

  /* - PRIVATE - */

  private _regenerateAttributesFromZFXY(): void {
    if (!this.zfxy) {
      throw new Error('zfxy is not set');
    }

    const z = assertNumber(this.zfxy.z, "zfxy.z");
    const f = assertNumber(this.zfxy.f, "zfxy.f");
    const x = assertNumber(this.zfxy.x, "zfxy.x");
    const y = assertNumber(this.zfxy.y, "zfxy.y");

    // ズームと ZFXY の文字列表現
    this.zoom = z;
    this.zfxyStr = `/${z}/${f}/${x}/${y}`;

    // タイルハッシュと ID（必要に応じて規則変更可）
    this.tilehash = generateTilehash({ z, f, x, y });
    this.id = this.tilehash;

    // 中心座標（高度付き）
    const center = getCenterLngLatAlt({ z, f, x, y });
    this.center = center;
    this.alt = assertNumber(center.alt, "center.alt");

    // 必要なら bbox を保持
    // const bboxNumbers = normalizeBBoxToNumbers(getBBox({ z, f, x, y }));
    // this.bbox = bboxNumbers;
  }
}

/* ユーティリティの再エクスポート（必要に応じて） */
export {
  calculateZFXY,
  getBBox,
  getChildren,
  getFloor,
  getParent,
  isZFXYTile,
  parseZFXYString,
  zfxyWraparound,
  getSurrounding,
  getCenterLngLatAlt,
  generateTilehash,
  parseZFXYTilehash,
  bboxToTile,
  pointToTile,
};
``
