
// /workspaces/Pages_Test/pages/index.js
import { useState } from 'react';
// 自前ライブラリを直接 import（相対パス）
import { Space } from '../lib/ouranos-gex-lib-for-javascript/index';

// basePath を next.config.js から取得（画像等の静的資産参照に使う場合）
const nextConfig = require('../next.config.js');
const BASE_PATH = nextConfig.basePath || '';

export default function Home() {
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [zoom, setZoom] = useState('25');
  const [alt, setAlt] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    try {
      // 入力の必須チェック
      if (!lat || !lon) {
        setError('lat と lon は必須です');
        return;
      }

      const latNum = parseFloat(lat);
      const lonNum = parseFloat(lon);
      const zoomNum = parseInt(zoom || '25', 10);
      const altNum = alt !== '' ? parseFloat(alt) : undefined;

      if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
        setError('lat と lon は数値である必要があります');
        return;
      }
      if (!Number.isFinite(zoomNum)) {
        setError('zoom は数値である必要があります');
        return;
      }
      if (alt !== '' && !Number.isFinite(altNum)) {
        setError('alt が指定されている場合は数値である必要があります');
        return;
      }
      if (latNum < -85.0511287798 || latNum > 85.0511287798) {
        setError('lat の範囲は ±85.0511287798');
        return;
      }
      if (lonNum < -180 || lonNum > 180) {
        setError('lon の範囲は ±180');
        return;
      }
      if (zoomNum < 0 || zoomNum > 35) {
        setError('zoom は 0〜35');
        return;
      }

      // Space の入力（alt が未指定ならプロパティ自体を省略）
      const coord =
        altNum === undefined
          ? { lng: lonNum, lat: latNum }
          : { lng: lonNum, lat: latNum, alt: altNum };

      // ★ API は使わず、クライアントで直接計算
      const space = new Space(coord, zoomNum);

      setResult({
        zfxyStr: space.zfxyStr,
        tilehash: space.tilehash,
        zfxy: space.zfxy,
        zoom: space.zoom,
        center: space.center,
        alt: space.alt
      });
    } catch (err) {
      console.error('[client calc] error:', err);
      setError('計算エラー: ' + (err?.message || String(err)));
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Spatial ID 計算ツール（クライアント計算）</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>緯度(lat): </label>
          <input value={lat} onChange={(e) => setLat(e.target.value)} required />
        </div>
        <div>
          <label>経度(lon): </label>
          <input value={lon} onChange={(e) => setLon(e.target.value)} required />
        </div>
        <div>
          <label>ズーム(zoom): </label>
          <input value={zoom} onChange={(e) => setZoom(e.target.value)} />
        </div>
        <div>
          <label>高度(alt): </label>
          <input value={alt} onChange={(e) => setAlt(e.target.value)} />
        </div>
        <button type="submit">計算</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {result && (
        <div style={{ marginTop: '20px' }}>
          <h2>結果</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      {/* 静的資産 (例: 画像) は basePath を付けて参照 */}
      <img alt="logo" src={`${BASE_PATH}/vercel.svg`} width={120} height={36} />
    </div>
  );
}
