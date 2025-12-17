
// ---- ロード確認 ----
console.log("[app.js] loaded");

// 簡易クエリ
function $(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element #${id} not found`);
  return el;
}

// 要素
const formEl       = $('calc-form');
const msgEl        = $('msg');
const zfxyEl       = $('zfxy');
const tilehashEl   = $('tilehash');
const centerEl     = $('center');
const clearEl      = $('clear');

const parentListEl   = $('parent-list');
const childrenListEl = $('children-list');
const aroundListEl   = $('around-list');

const toParentBtn    = $('to-parent');

// 状態：現在の Space
let currentSpace = null;

// コピー（data-copy-target で参照）
document.querySelectorAll('.btn.copy').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.getAttribute('data-copy-target');
    const target = document.getElementById(id);
    if (!target) return;
    const text = target.textContent || '';
    navigator.clipboard.writeText(text).then(() => {
      btn.textContent = 'コピー済み';
      setTimeout(() => btn.textContent = 'コピー', 1200);
    }).catch(() => {
      msgEl.textContent = 'コピーに失敗しました。権限設定をご確認ください。';
    });
  });
});

// レンダリング：結果パネル
function renderMain(space) {
  // z/f/x/y
  zfxyEl.textContent = space.zfxyStr.replace(/^\//, "");

  // tilehash
  tilehashEl.textContent = space.id;

  // center
  const c = space.center; // {lng, lat, alt}
  centerEl.textContent = `${c.lng.toFixed(6)}, ${c.lat.toFixed(6)}, ${c.alt}`;
}

// レンダリング：親リスト（1段 or 指定 atZoom）
function renderParent(space) {
  // 1段親
  const parent = space.parent(); // デフォルトで1段階
  parentListEl.innerHTML = '';
  parentListEl.appendChild(rowForSpace(parent));
}

// レンダリング：子リスト（次のズームの全子）
function renderChildren(space) {
  const children = space.children(); // Space[]
  childrenListEl.innerHTML = '';
  if (!children || children.length === 0) {
    const div = document.createElement('div');
    div.className = 'mini';
    div.textContent = '子がありません';
    childrenListEl.appendChild(div);
    return;
  }
  children.forEach(child => {
    const row = rowForSpace(child, { clickable: true });
    childrenListEl.appendChild(row);
  });
}

// レンダリング：周辺
function renderAround(space) {
  const around = space.surroundings(); // Space[]
  aroundListEl.innerHTML = '';
  if (!around || around.length === 0) {
    const div = document.createElement('div');
    div.className = 'mini';
    div.textContent = '周辺がありません';
    aroundListEl.appendChild(div);
    return;
  }
  around.forEach(s => {
    const row = rowForSpace(s, { clickable: true });
    aroundListEl.appendChild(row);
  });
}

// Space を1行表示するユーティリティ
function rowForSpace(space, opts = {}) {
  const { clickable = false } = opts;
  const div = document.createElement('div');
  div.className = 'list-item';

  const left = document.createElement('div');
  left.innerHTML = `
    <div><strong>${space.zfxyStr.replace(/^\//, "")}</strong></div>
    <div class="mini">zoom=${space.zoom}, alt=${space.alt}, tilehash=${space.id}</div>
  `;

  const right = document.createElement('div');
  const goBtn = document.createElement('button');
  goBtn.className = 'btn small';
  goBtn.textContent = clickable ? 'ここへ移動' : '詳細';
  goBtn.addEventListener('click', () => {
    // 現在の Space をこの Space に変更して再レンダリング
    currentSpace = space;
    syncInputsFromSpace(space);
    renderAll(space);
  });

  const copyBtn = document.createElement('button');
  copyBtn.className = 'btn copy small';
  copyBtn.textContent = 'コピー';
  copyBtn.addEventListener('click', () => {
    const text = space.zfxyStr.replace(/^\//, "");
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = 'コピー済み';
      setTimeout(() => copyBtn.textContent = 'コピー', 1200);
    });
  });

  right.appendChild(goBtn);
  right.appendChild(copyBtn);

  div.appendChild(left);
  div.appendChild(right);
  return div;
}

// Space から入力欄へ反映
function syncInputsFromSpace(space) {
  const c = space.center;
  $('lat').value = String(c.lat);
  $('lng').value = String(c.lng);
  $('z').value   = String(space.zoom);
  $('h').value   = String(c.alt ?? 0);
}

// 全レンダリング
function renderAll(space) {
  try {
    renderMain(space);
    renderParent(space);
    renderChildren(space);
    renderAround(space);
    msgEl.textContent = `レンダリング完了: ${space.zfxyStr}`;
  } catch (e) {
    console.error(e);
    msgEl.textContent = 'レンダリング時にエラーが発生しました。';
  }
}

// 計算（フォーム送信）
formEl.addEventListener('submit', (ev) => {
  console.log("[calc-form] submit clicked");
  ev.preventDefault();

  const lat = parseFloat($('lat').value);
  const lng = parseFloat($('lng').value);
  const z   = parseInt($('z').value, 10);
  const h   = parseFloat($('h').value);

  if ([lat, lng, z, h].some(v => Number.isNaN(v))) {
    msgEl.textContent = "入力値を確認してください（緯度・経度・ズーム・高さ）。";
    zfxyEl.textContent = "-";
    tilehashEl.textContent = "-";
    centerEl.textContent = "-";
    parentListEl.innerHTML = '<div class="mini">未計算</div>';
    childrenListEl.innerHTML = '<div class="mini">未計算</div>';
    aroundListEl.innerHTML = '<div class="mini">未計算</div>';
    return;
  }
  if (z < 0 || z > 30) {
    msgEl.textContent = "ズームレベルは 0〜30 の範囲で入力してください。";
    return;
  }

  const { Space } = window.SpatialId;
  currentSpace = Space.getSpaceByLocation({ lat, lng, alt: h }, z);
  renderAll(currentSpace);
});

// クリア
clearEl.addEventListener('click', () => {
  $('lat').value = "";
  $('lng').value = "";
  $('z').value   = "25";
  $('h').value   = "0";
  zfxyEl.textContent = "-";
  tilehashEl.textContent = "-";
  centerEl.textContent = "-";
  parentListEl.innerHTML = '<div class="mini">未計算</div>';
  childrenListEl.innerHTML = '<div class="mini">未計算</div>';
  aroundListEl.innerHTML = '<div class="mini">未計算</div>';
  msgEl.textContent = "入力値をクリアしました。";
});

// 親へ移動ボタン
toParentBtn.addEventListener('click', () => {
  if (!currentSpace) {
    msgEl.textContent = 'まず入力して「計算」を実行してください。';
    return;
  }
  currentSpace = currentSpace.parent(); // 1段親へ
  syncInputsFromSpace(currentSpace);
   renderAll(currentSpace);})
