
(() => {
  console.log("[app.js] loaded");

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

    const zoomPlusBtn  = document.getElementById('zoom-plus');
    const zoomMinusBtn = document.getElementById('zoom-minus');
    const aroundListEl = document.getElementById('around-list');

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

    // 周辺タイルリスト
    const rowForSpace = (space) => {
      const div = document.createElement('div');
      div.className = 'list-item';
      div.innerHTML = `
        <div><strong>${space.zfxyStr.replace(/^\//, "")}</strong></div>
        <div class="mini">zoom=${space.zoom}, tilehash=${space.id}</div>
      `;
      return div;
    };

    const renderAround = (space) => {
      try {
        const around = space.surroundings(); // Space[]
        aroundListEl.innerHTML = '';
        if (!around || around.length === 0) {
          aroundListEl.innerHTML = '<div class="mini">周辺がありません</div>';
          return;
        }
        around.forEach(s => {
          aroundListEl.appendChild(rowForSpace(s));
        });
      } catch (e) {
        console.error(e);
        aroundListEl.innerHTML = '<div class="mini">周辺の表示でエラーが発生しました</div>';
      }
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
        aroundListEl.innerHTML = '<div class="mini">未計算</div>';
        return;
      }
      if (z < 0 || z > 30) {
        msgEl.textContent = "ズームレベルは 0〜30 の範囲で入力してください。";
        return;
      }

      try {
        currentSpace = Space.getSpaceByLocation({ lat, lng, alt: h }, z);
        render(currentSpace);
        renderAround(currentSpace);
        msgEl.textContent = `計算しました（z=${z}）。`;
      } catch (e) {
        console.error(e);
        msgEl.textContent = "計算中にエラーが発生しました。入力値とズームを確認してください。";
        zfxyEl.textContent = "-";
        tilehashEl.textContent = "-";
        centerEl.textContent = "-";
        aroundListEl.innerHTML = '<div class="mini">未計算</div>';
      }
    });

    // ズーム +1（中心座標を維持して再計算）
    zoomPlusBtn?.addEventListener('click', () => {
      if (!currentSpace) {
        msgEl.textContent = 'まず入力して「計算」を実行してください。';
        return;
      }
      const c = currentSpace.center;
      const nextZoom = currentSpace.zoom + 1;
      if (nextZoom > 30) {
        msgEl.textContent = 'これ以上ズームを上げられません（最大 30）。';
        return;
      }
      currentSpace = Space.getSpaceByLocation({ lat: c.lat, lng: c.lng, alt: c.alt }, nextZoom);
      // 入力欄へ反映
      $('z').value = String(currentSpace.zoom);
      render(currentSpace);
      renderAround(currentSpace);
      msgEl.textContent = `ズームを ${nextZoom} に変更しました。`;
    });

    // ズーム -1（中心座標を維持して再計算）
    zoomMinusBtn?.addEventListener('click', () => {
      if (!currentSpace) {
        msgEl.textContent = 'まず入力して「計算」を実行してください。';
        return;
      }
      const c = currentSpace.center;
      const nextZoom = currentSpace.zoom - 1;
      if (nextZoom < 0) {
        msgEl.textContent = 'これ以上ズームを下げられません（最小 0）。';
        return;
      }
      currentSpace = Space.getSpaceByLocation({ lat: c.lat, lng: c.lng, alt: c.alt }, nextZoom);
      $('z').value = String(currentSpace.zoom);
      render(currentSpace);
      renderAround(currentSpace);
      msgEl.textContent = `ズームを ${nextZoom} に変更しました。`;
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
      aroundListEl.innerHTML = '<div class="mini">未計算</div>';
           msgEl.textContent    = "入力値をクリアしました。";
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})