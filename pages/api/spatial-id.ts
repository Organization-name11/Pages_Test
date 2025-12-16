
// /workspaces/Pages_Test/pages/api/spatial-id.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Space } from '../../lib/ouranos-gex-lib-for-javascript/index';

// ユーティリティ: query を string に正規化（string[] の場合は先頭要素）
function toStringOrUndefined(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

// CORS ヘッダー（デモ用。必要に応じて制限する）
function setCorsHeaders(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// GET /api/spatial-id?lat=...&lon=...&zoom=25&alt=...
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS: OPTIONS は 204 で返す
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    setCorsHeaders(res);
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    setCorsHeaders(res);

    // クエリ取得（string | string[] | undefined）
    const latStr = toStringOrUndefined(req.query.lat);
    const lonStr = toStringOrUndefined(req.query.lon);
    const zoomStr = toStringOrUndefined(req.query.zoom) ?? '25'; // 既定値 25
    const altStr = toStringOrUndefined(req.query.alt);

    // 必須チェック
    if (!latStr || !lonStr) {
      return res.status(400).json({ error: 'lat と lon は必須です' });
    }

    // 数値化
    const latNum = parseFloat(latStr);
    const lonNum = parseFloat(lonStr);
    const zoomNum = parseInt(zoomStr, 10);
    const altNum = altStr !== undefined ? parseFloat(altStr) : undefined;

    // 数値バリデーション
    if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
      return res.status(400).json({ error: 'lat と lon は数値である必要があります' });
    }
    if (!Number.isFinite(zoomNum)) {
      return res.status(400).json({ error: 'zoom は数値である必要があります' });
    }
    if (altStr !== undefined && !Number.isFinite(altNum)) {
      return res.status(400).json({ error: 'alt が指定されている場合は数値である必要があります' });
    }

    // 範囲チェック
    if (latNum < -85.0511287798 || latNum > 85.0511287798) {
      return res.status(400).json({ error: 'lat の範囲は ±85.0511287798' });
    }
    if (lonNum < -180 || lonNum > 180) {
      return res.status(400).json({ error: 'lon の範囲は ±180' });
    }
    if (zoomNum < 0 || zoomNum > 35) {
      return res.status(400).json({ error: 'zoom は 0〜35' });
    }

    // Space の第1引数は string | LngLatWithAltitude | ZFXYTile
    // exactOptionalPropertyTypes: true のため、alt が undefined の場合はプロパティ自体を省略する
    const coord =
      altNum === undefined
        ? { lng: lonNum, lat: latNum }
        : { lng: lonNum, lat: latNum, alt: altNum };

    const space = new Space(coord, zoomNum);

    return res.status(200).json({
      result: {
        zfxyStr: space.zfxyStr,
        tilehash: space.tilehash,
        zfxy: space.zfxy,
        zoom: space.zoom,
        center: space.center,
        alt: space.alt,
      },
    });
  } catch (e) {
    console.error('[api/spatial-id] error:', e);
    setCorsHeaders(res);
    return res.status(500).json({ error: String(e) });
   }
  }