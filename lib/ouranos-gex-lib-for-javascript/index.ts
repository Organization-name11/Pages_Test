
import type { LngLatWithAltitude } from "./types";
import {
  calculateZFXY,
  getBBox,
  getChildren,
  getFloor,
  getParent,
  isZFXYTile,
  parseZFXYString,
  zfxyWraparound,
  getSurrounding,
  getCenterLngLatAlt
} from "./zfxy";
import type { ZFXYTile } from "./zfxy"; // 型は type-only import に分離
import { generateTilehash, parseZFXYTilehash } from "./zfxy_tilehash";
import turfBBox from '@turf/bbox';
import turfBooleanIntersects from '@turf/boolean-intersects';
import type { Geometry, Polygon } from "geojson";
import { bboxToTile, pointToTile } from "./tilebelt";

const DEFAULT_ZOOM = 25 as const;

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
      this.zfxy = calculateZFXY({
        ...input,
        zoom: (typeof zoom !== 'undefined') ? zoom : DEFAULT_ZOOM,
      });
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
    newSpace.zfxy = zfxyWraparound({
      z: newSpace.zfxy.z,
      f: newSpace.zfxy.f + (by.f || 0),
      x: newSpace.zfxy.x + (by.x || 0),
      y: newSpace.zfxy.y + (by.y || 0),
    });
    newSpace._regenerateAttributesFromZFXY();
    return newSpace;
  }

  parent(atZoom?: number) {
    const steps = (typeof atZoom === 'undefined') ? 1 : this.zfxy.z - atZoom;
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
   * 現在の ZFXY タイルの GeoJSON Polygon を返す（必要なら）
   * getBBox の返り値仕様に合わせてください。
   */
  toPolygon(): Polygon {
    const bbox = getBBox(this.zfxy); // [minX, minY, maxX, maxY] の想定
    const [minX, minY, maxX, maxY] = bbox;
    const coordinates = [
      [
        [minX, minY],
        [maxX, minY],
        [maxX, maxY],
        [minX, maxY],
        [minX, minY],
      ]
    ];
    return {
      type: "Polygon",
      coordinates,
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
   * 与えられた Geometry の bbox とこの Space の bbox が交差する近傍タイル群を返す（例）
   * 利用ケースにあわせてチューニングしてください。
   */
  intersectingNeighbors(geometry: Geometry): Space[] {
    const targetBBox = turfBBox(geometry); // [minX, minY, maxX, maxY]
    const repTile = bboxToTile(targetBBox);
    const repSpace = new Space({ z: this.zfxy.z, f: this.zfxy.f, x: repTile[0], y: repTile[1] });
    return repSpace.surroundings().filter(s => s.intersects(geometry));
  }

  /**
   * 任意の経緯度（高度付き）から、この Space を生成
   */
  static fromCenter(center: LngLatWithAltitude, zoom: number = DEFAULT_ZOOM): Space {
    return new Space(center, zoom);
  }

  /**
   * 任意のポイント（LngLat）を含むタイル（同ズーム・指定フロア）を生成
   */
  static fromPoint(lng: number, lat: number, f: number, z: number = DEFAULT_ZOOM): Space {
    const tile = pointToTile([lng, lat], z);
    return new Space({ z, f, x: tile[0], y: tile[1] });
  }

  /* - PRIVATE - */

  private _regenerateAttributesFromZFXY(): void {
    if (!this.zfxy) {
      throw new Error('zfxy is not set');
    }

    const { z, f, x, y } = this.zfxy;

    // ズームと ZFXY の文字列表現
    this.zoom = z;
    this.zfxyStr = `/${z}/${f}/${x}/${y}`;

    // タイルハッシュと ID（必要に応じて規則変更可）
    this.tilehash = generateTilehash(this.zfxy);
    this.id = this.tilehash;

    // 中心座標（高度付き）
    const center = getCenterLngLatAlt(this.zfxy);
    this.center = center;
    this.alt = center.alt;

    // 必要なら bbox を計算して保持（フィールドを定義した場合のみ）
    // const bbox = getBBox(this.zfxy);
    // this.bbox = bbox;
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
  parse  parseZFXYTilehash,
  bboxToTile,
  pointToTile,
