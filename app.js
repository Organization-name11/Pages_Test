
// ---- ロード確認（コンソールに出ます） ----
console.log("[app.js] loaded");

// 仕様定数（UNVT ZFXY 仕様案の定義）
const Z = 25;                 // ズーム25で高さ1mのボクセル
const H = 2 ** Z;             // [m]
const MAX_LAT = 85.05112878;  // Web Mercator の緯度範囲（概ね）

function clampLat(latDeg) {
  return Math.min(Math.max(latDeg, -MAX_LAT), MAX_LAT);
}

// ZFXY 計算（UNVT仕様案 + Slippy Map）
function computeZFXY({ latDeg, lngDeg, z, hMeters }) {
  const n = 2 ** z;

  const latClamped = clampLat(latDeg);
  const latRad = latClamped * Math.PI / 180;

  // 垂直インデックス（f）
  const f = Math.floor((n * hMeters) / H);

  // 水平タイル（x, y）
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

// 要素のバインド（nullチェック付）
function $(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element #${id} not found`);
  return el;
}
const formEl  = $('calc-form');
const msgEl   = $('msg');
const outEl   = $('zfxy');
const btnEl   = $('btn');
const clearEl = $('clear');

// 送信ハンドラ（必ず反応）
formEl.addEventListener('submit', (ev) => {
  console.log("[calc-form] submit clicked");
  ev.preventDefault();

  // 入力値取得
  const lat = parseFloat($('lat').value);
  const lng = parseFloat($('lng').value);
  const z   = parseInt($('z').value, 10);
  const h   = parseFloat($('h').value);

  // 入力検証（エラーメッセージを表示）
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

  // 結果表示（小文字・先頭スラッシュなし）
  outEl.textContent = toLowerId(zfxy);

  // 実行メッセージ
  msgEl.textContent = `計算しました（lat=${lat}, lng=${lng}, z=${z}, h=${h}）`;
});

// クリアボタン
clearEl.addEventListener('click', () => {
  $('lat').value = "";
  $('lng').value = "";
  $('z').value   = "25";
  $('h').value   = "0";
  outEl.textContent = "-";
  msgEl.textContent = "入力値をクリアしました。";
});
``
