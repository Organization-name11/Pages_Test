
// /workspaces/Pages_Test/pages/index.js
import React, { useState } from 'react';

// Web Mercator の緯度範囲
const LAT_MIN = -85.0511287798;
const LAT_MAX =  85.0511287798;

// 経度→x（タイル列）
function calcTileX(lonDeg, z) {
  const n = Math.pow(2, z);
  return Math.floor(((lonDeg + 180) / 360) * n);
}

// 緯度→y（タイル行）
function calcTileY(latDeg, z) {
  const n = Math.pow(2, z);
  const latRad = (latDeg * Math.PI) / 180;
  const yMerc = Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)); // ln(tanφ + secφ)
  const t = (1 - yMerc / Math.PI) / 2; // 0..1
  return Math.floor(t * n);
}

// 垂直解像度（暫定：z=25で1m/フロア。仕様があれば差し替えます）
function metersPerFloor(z) {
  const baseZoom = 25;
  const perFloorAtBase = 1;
  const delta = baseZoom - z;
  return perFloorAtBase * Math.pow(2, delta);
}

// f（フロア）
function calcFloorIndex(altMeters, z) {
  if (altMeters === undefined || altMeters === null || Number.isNaN(altMeters)) {
    return 0; // 未指定は暫定で 0 階
  }
  const mpf = metersPerFloor(z);
  return Math.floor(altMeters / mpf);
}

export default function Home() {
  const [lat,  setLat]  = useState('');
  const [lon,  setLon]  = useState('');
  const [zoom, setZoom] = useState('25');
  const [alt,  setAlt]  = useState('');

  const [result, setResult] = useState(null);
  const [error,  setError]  = useState('');
  const [status, setStatus] = useState('準備完了：数値を入れて「計算」を押してください');

  // 送信ではなく、クリックで計算（入力は保持され続けます）
  const onCalc = () => {
    try {
      console.log('[onCalc click]', { lat, lon, zoom, alt });
      setStatus('計算中...');
      setError('');
      // 入力値の数値化（入力は保持）
      const latNum = parseFloat(lat);
      const lonNum = parseFloat(lon);
      const zNum   = parseInt(zoom || '25', 10);
      const altNum = alt !== '' ? parseFloat(alt) : undefined;

      if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
        throw new Error('lat / lon は数値で入力してください');
      }
      if (!Number.isFinite(zNum)) {
        throw new Error('zoom は数値で入力してください');
      }
      if (alt !== '' && !Number.isFinite(altNum)) {
        throw new Error('alt が指定されている場合は数値で入力してください');
      }
      if (latNum < LAT_MIN || latNum > LAT_MAX) {
        throw new Error(`lat は ${LAT_MIN}〜${LAT_MAX} の範囲で入力してください`);
      }
      if (lonNum < -180 || lonNum > 180) {
        throw new Error('lon は ±180 の範囲で入力してください');
      }
      if (zNum < 0 || zNum > 35) {
        throw new Error('zoom は 0〜35 の範囲で入力してください');
      }

      const x = calcTileX(lonNum, zNum);
      const y = calcTileY(latNum, zNum);
      const f = calcFloorIndex(altNum, zNum);

      const r = { z: zNum, f, x, y };
      console.log('[calc result]', r);
      setResult(r);
      setStatus('計算完了');
    } catch (e) {
      console.error('[calc error]', e);
      setResult(null);
      setStatus('エラー発生');
      setError(e?.message || String(e));
    }
  };

  return (
    <main style={{ padding: 20, fontFamily: 'system-ui, sans-serif', lineHeight: 1.6 }}>
      <h1>Spatial ID（ZFXY）計算：f / x / y</h1>

      {/* ステータスは常に上に表示 */}
      <div style={{ marginBottom: 8, color: '#555' }}>{status}</div>

      {/* 結果・エラーは常に上に表示 */}
      {error && (
        <div style={{ color: 'white', background: '#d33', padding: 8, borderRadius: 6, maxWidth: 560 }}>
          エラー: {error}
        </div>
      )}
      {result && (
        <div style={{
          marginTop: 12, padding: 12, border: '1px solid #ddd', borderRadius: 8,
          background: '#fafafa', maxWidth: 560, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace'
        }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>計算結果</div>
          <div>z: <strong>{result.z}</strong></div>
          <div>f: <strong>{result.f}</strong></div>
          <div>x: <strong>{result.x}</strong></div>
          <div>y: <strong>{result.y}</strong></div>
        </div>
      )}

      {/* 入力（送信しない、onClickで計算。入力値は消えません） */}
      <section style={{ marginTop: 16, display: 'grid', gap: 10, maxWidth: 500 }}>
        <label>緯度 (lat)
          <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="例: 35.68" />
        </label>
        <label>経度 (lon)
          <input value={lon} onChange={(e) => setLon(e.target.value)} placeholder="例: 139.76" />
        </label>
        <label>ズーム (zoom)
          <input value={zoom} onChange={(e) => setZoom(e.target.value)} placeholder="例: 25" />
        </label>
        <label>標高 (alt, m)
          <input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="例: 10（任意）" />
        </label>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onCalc} style={{ padding: '8px 14px' }}>計算</button>
          <button
            type="button"
            onClick={() => { setError(''); setResult(null); setStatus('準備完了：数値を入れて「計算」を押してください'); }}
            style={{ padding: '8px 14px', background: '#eee' }}
          >
            結果クリア（入力は保持）
          </button>
        </div>
      </section>
    </main>
  );
}