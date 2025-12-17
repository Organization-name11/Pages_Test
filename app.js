
// --- 読み込み確認（必要なら残してください） ---
console.log("[app.js] loaded");

// 仕様定数（UNVT ZFXY 仕様案の定義に基づく）
const Z = 25;                 // ズーム25で高さ1mのボクセル
const H = 2 ** Z;             // [m]
const MAX_LAT = 85.05112878;  // Web Mercator の緯度範囲（概ね）

function clampLat(latDeg) {
  return Math.min(Math.max(latDeg, -MAX_LAT), MAX_LAT);
}

// ZFXY 計算（UNVT仕様案 + Slippy Map）
// f = floor(n * h / H)
// x = floor( n * ((lng + 180) / 360) )
// y = floor( n * (1 - log(tan(lat_rad) + (1 / cos(lat_rad))) / π) / 2 )
function computeZFXY({ latDeg, lngDeg, z, hMeters }) {
  const n = 2 ** z;

  const latClamped = clampLat(latDeg);
  const latRad = latClamped * Math.PI / 180;

  const f = Math.floor((n * hMeters) / H);
  const xFloat = n * ((lngDeg + 180) / 360);
  const x = Math.floor(xFloat);

  const yFloat = n * (1 - (Math.log(Math.tan(latRad) + (1 / Math.cos(latRad))) / Math.PI)) / 2;
  const y = Math.floor(yFloat);

  return { z, f, x, y };
}

// 表示用（小文字・先頭スラッシュなし）
function toLowerId({ z, f, x, y }) {
  return `${z}/${f}/${x}/${y}`;
}

// 要素取得（null防止のため事前バインド）
const formEl = document.getElementById('calc-form');
const msgEl  = document.getElementById('msg');
const outEl  = document.getElementById('zfxy');
const clearEl= document.getElementById('clear');

// クリックログ（イベント確認用）
formEl.addEventListener('submit', (ev) => {
  console.log("[calc-form] submit clicked");
  ev.preventDefault();

  // 入力値
  const lat = parseFloat(document.getElementById('lat').value);
  const lng = parseFloat(document.getElementById('lng').value);
  const z   = parseInt(document.getElementById('z').value, 10);
  const h   = parseFloat(document.getElementById('h').value);

  // 入力チェック
  if (Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(z) || Number.isNaN(h)) {
    msgEl.textContent = "入力値を確認してください（緯度・経度・ズーム・高さ）。";
    outEl.textContent = "-";
    return;
  }
  if (z < 0 || z > 30) {
    msgEl.textContent = "ズームレベルは 0〜30 の範囲で入力してください。";
    outEl.textContent = "-";
    return;
  }

  // 計算
  const zfxy = computeZFXY({ latDeg: lat, lngDeg: lng, z, hMeters: h });

  // 表示（小文字／先頭スラッシュなし）
  outEl.textContent = toLowerId(zfxy);

  // メッセージ更新
  msgEl.textContent = `計算しました（lat=${lat}, lng=${lng}, z=${z}, h=${h}）`;
});

// クリアボタン
clearEl.addEventListener('click', () => {
  document.getElementById('lat').value = "";
  document.getElementById('lng').value = "";
  document.getElementById('z').value   = "25";
  document.getElementById('h').value   = "0";
  outEl.textContent = "-";
  msgEl.textContent = "入力値をクリアしました。";
});
``
