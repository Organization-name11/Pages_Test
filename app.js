
(() => {
  console.log("[app.js] loaded");

  // 初期化（DOM構築後に開始）
  const start = () => {
    // UMD の存在確認
    if (!window.SpatialId || !window.SpatialId.Space) {
      console.error("SpatialId (UMD) が読み込まれていません。index.html の <script src> のパス/順序を確認してください。");
      const m = document.getElementById('msg');
      if (m) m.textContent = "ライブラリが読み込めていません。ページのスクリプト設定をご確認ください。";
      return;
    }

    // 要素取得ヘルパー
    const $ = (id) => {
      const el = document.getElementById(id);
      if (!el) throw new Error(`Element #${id} not found`);
      return el;
    };

    const formEl     = $('calc-form');
    const msgEl      = $('msg');
    const zfxyEl     = $('zfxy');
    const tilehashEl = $('tilehash');
    const centerEl   = $('center');
    const clearEl    = $('clear');

    const { Space } = window.SpatialId;
    let currentSpace = null;

    // 結果レンダリング
    const render = (space) => {
      // z/f/x/y（先頭スラッシュ削除）
      zfxyEl.textContent = space.zfxyStr.replace(/^\//, "");
      // tilehash
      tilehashEl.textContent = space.id;
      // 中心座標
      const c = space.center; // {lng, lat, alt}
      centerEl.textContent = `${c.lng.toFixed(6)}, ${c.lat.toFixed(6)}, ${c.alt}`;
    };

    // 送信（計算）
    formEl.addEventListener('submit', (ev) => {
      ev.preventDefault();

      const lat = parseFloat(($('lat').value || "").trim());
      const lng = parseFloat(($('lng').value || "").trim());
      const z   = parseInt(($('z').value  || "25").trim(), 10);
      const h   = parseFloat(($('h').value || "0").trim());

      if ([lat, lng, z, h].some(v => Number.isNaN(v))) {
        msgEl.textContent = "入力値を確認してください（緯度・経度・ズーム・高さ）。";
        zfxyEl.textContent = "-";
        tilehashEl.textContent = "-";
        centerEl.textContent = "-";
        return;
      }
      if (z < 0 || z > 30) {
        msgEl.textContent = "ズームレベルは 0〜30 の範囲で入力してください。";
        return;
      }

      try {
        currentSpace = Space.getSpaceByLocation({ lat, lng, alt: h }, z);
        render(currentSpace);
        msgEl.textContent = `計算しました（z=${z}）。`;
      } catch (e) {
        console.error(e);
        msgEl.textContent = "計算中にエラーが発生しました。入力値とズームを確認してください。";
        zfxyEl.textContent = "-";
        tilehashEl.textContent = "-";
        centerEl.textContent = "-";
      }
    });

    // クリア
    clearEl.addEventListener('click', () => {
      $('lat').value = "";
      $('lng').value = "";
      $('z').value   = "25";
      $('h').value   = "0";
      zfxyEl.textContent   = "-";
      tilehashEl.textContent = "-";
      centerEl.textContent = "-";
      msgEl.textContent    = "入力値をクリアしました。";
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
