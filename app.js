
cat > app.js <<'EOF'
// 仕様定数
const Z = 25;                 // ズーム25で高さ1mのボクセル
const H = 2 ** Z;             // [m]
const MAX_LAT = 85.05112878;  // Web Mercator の緯度範囲（概ね）
/*
  Web Mercator の有効範囲は各種資料で ±85.051129° 程度とされます。
  参考: Wikipedia "Web Mercator projection"
*/

function clampLat(latDeg) {
  return Math.min(Math.max(latDeg, -MAX_LAT), MAX_LAT);
}

// UNVT ZFXY 仕様案 & Slippy Map に基づく計算
function computeZFXY({ latDeg, lngDeg, z, hMeters }) {
  const n = 2 ** z;

  // 緯度をレンジに収める
  const latClamped = clampLat(latDeg);
  const latRad = latClamped * Math.PI / 180;

  // f（垂直）
  const f = Math.floor((n * hMeters) / H);

  // x（経度方向）
  const xFloat = n * ((lngDeg + 180) / 360);
  const x = Math.floor(xFloat);

  // y（緯度方向）
  // y = floor( n * (1 - log(tan(lat_rad) + (1 / cos(lat_rad))) / π) / 2 )
  const yFloat = n * (1 - (Math.log(Math.tan(latRad) + (1 / Math.cos(latRad))) / Math.PI)) / 2;
  const y = Math.floor(yFloat);

  return { z, f, x, y };
}

function toPath({ z, f, x, y }) {
  return `/${z}/${f}/${x}/${y}`;
}
function toZXY({ z, x, y }) {
  return `/${z}/${x}/${y}`;
}

document.getElementById('calc-form').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const lat = parseFloat(document.getElementById('lat').value);
  const lng = parseFloat(document.getElementById('lng').value);
  const z   = parseInt(document.getElementById('z').value, 10);
  const h   = parseFloat(document.getElementById('h').value);

  if (Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(z) || Number.isNaN(h)) {
    alert('数値を確認してください。');
    return;
  }
  if (z < 0 || z > 30) {
    alert('ズームレベルは 0〜30 の範囲で入力してください。');
    return;
  }

  const zfxy = computeZFXY({ latDeg: lat, lngDeg: lng, z, hMeters: h });
  document.getElementById('zfxy').textContent = toPath(zfxy);
  document.getElementById('zxy').textContent  = toZXY(zfxy);
});
