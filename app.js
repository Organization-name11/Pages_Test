
(() => {
  console.log("[app.js] loaded");

  const start = () => {
    // UMD の存在確認
    if (!window.SpatialId || !window.SpatialId.Space) {
      console.error("SpatialId (UMD) が読み込まれていません。index.html の <script> 読み込み順を確認してください。");
      const msgEl = document.getElementById('msg');
      if (msgEl) msgEl.textContent = "ライブラリが読み込めていません。ページのスクリプト設定をご確認ください。";
      return;
    }

    // 要素取得
    const $ = (id) => {
      const el = document.getElementById(id);
      if (!el) throw new Error(`Element #${id} not found`);
      return el;
    };
    const formEl       = $('calc-form');
    const msgEl        = $('msg');
    const zfxyEl       = $('zfxy');
    const tilehashEl   = $('tilehash');
    const centerEl     = $('center');
    const clearEl      = $('clear');

    const parentListEl   = $('parent-list');
    const childrenListEl = $('children-list');
    const aroundListEl   = $('around-list');

    const zoomPlusBtn  = $('zoom-plus');   // 親へ（ズーム +1）
    const zoomMinusBtn = $('zoom-minus');  // 子へ（ズーム -1）

    const { Space } = window.SpatialId;
    let currentSpace = null;

    // 行生成（ボタンなし）
    const rowForSpace = (space) => {
      const div = document.createElement('div');
      div.className = 'list-item';
      const left = document.createElement('div');
      left.innerHTML = `
        <div><strong>${space.zfxyStr.replace(/^\//, "")}</strong></div>
        <div class="mini">zoom=${space.zoom}, alt=${space.alt}, tilehash=${space.id}</div>
      `;
      div.appendChild(left);
      return div;
    };

    const renderMain = (space) => {
      zfxyEl.textContent = space.zfxyStr.replace(/^\//, "");
      tilehashEl.textContent = space.id;
      const c = space.center;
      centerEl.textContent = `${c.lng.toFixed(6)}, ${c.lat.toFixed(6)}, ${c.alt}`;
    };

    const renderParent = (space) => {
      const parent = space.parent(); // 1段粗く
      parentListEl.innerHTML = '';
      parentListEl.appendChild(rowForSpace(parent));
    };

    const renderChildren = (space) => {
      const children = space.children(); // 次のズーム（細かく）
      childrenListEl.innerHTML = '';
      if (!children || children.length === 0) {
        const div = document.createElement('div');
        div.className = 'mini';
        div.textContent = '子がありません';
        childrenListEl.appendChild(div);
        return;
      }
      children.forEach(child => {
        childrenListEl.appendChild(rowForSpace(child));
      });
    };

    const renderAround = (space) => {
      const around = space.surroundings();
      aroundListEl.innerHTML = '';
      if (!around || around.length === 0) {
        const div = document.createElement('div');
        div.className = 'mini';
        div.textContent = '周辺がありません';
        aroundListEl.appendChild(div);
        return;
      }
      around.forEach(s => {
        aroundListEl.appendChild(rowForSpace(s));
      });
    };

    const renderAll = (space) => {
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
    };

    const syncInputsFromSpace = (space) => {
      const c = space.center;
      $('lat').value = String(c.lat);
      $('lng').value = String(c.lng);
      $('z').value   = String(space.zoom);
      $('h').value   = String(c.alt ?? 0);
    };

    const resetPanels = () => {
      zfxyEl.textContent = "-";
      tilehashEl.textContent = "-";
      centerEl.textContent = "-";
      parentListEl.innerHTML   = '<div class="mini">未計算</div>';
      childrenListEl.innerHTML = '<div class="mini">未計算</div>';
      aroundListEl.innerHTML   = '<div class="mini">未計算</div>';
    };

    // フォーム送信
    formEl.addEventListener('submit', (ev) => {
      ev.preventDefault();

      const lat = parseFloat($('lat').value);
      const lng = parseFloat($('lng').value);
      const z   = parseInt($('z').value, 10);
      const h   = parseFloat($('h').value);

      if ([lat, lng, z, h].some(v => Number.isNaN(v))) {
        msgEl.textContent = "入力値を確認してください（緯度・経度・ズーム・高さ）。";
        resetPanels();
        return;
      }
      if (z < 0 || z > 30) {
        msgEl.textContent = "ズームレベルは 0〜30 の範囲で入力してください。";
        return;
      }

      currentSpace = Space.getSpaceByLocation({ lat, lng, alt: h }, z);
      renderAll(currentSpace);
    });

    // クリア
    clearEl.addEventListener('click', () => {
      $('lat').value = "";
      $('lng').value = "";
      $('z').value   = "25";
      $('h').value   = "0";
      resetPanels();
      msgEl.textContent = "入力値をクリアしました。";
    });


// ズーム +1（細かく：数値を増やす）
zoomPlusBtn.addEventListener('click', () => {
  if (!currentSpace) {
    msgEl.textContent = 'まず入力して「計算」を実行してください。';
    return;
  }
  const { Space } = window.SpatialId;
  const c = currentSpace.center;          // { lng, lat, alt }
  const nextZoom = currentSpace.zoom + 1;

  if (nextZoom > 30) {
    msgEl.textContent = 'これ以上ズームを上げられません（最大 30）。';
    return;
  }

  currentSpace = Space.getSpaceByLocation(
    { lat: c.lat, lng: c.lng, alt: c.alt },
    nextZoom
  );
  syncInputsFromSpace(currentSpace);
  renderAll(currentSpace);
});

// ズーム -1（粗く：数値を減らす）
zoomMinusBtn.addEventListener('click', () => {
  if (!currentSpace) {
    msgEl.textContent = 'まず入力して「計算」を実行してください。';
    return;
  }
  const { Space } = window.SpatialId;
  const c = currentSpace.center;          // { lng, lat, alt }
  const nextZoom = currentSpace.zoom - 1;

  if (nextZoom < 0) {
    msgEl.textContent = 'これ以上ズームを下げられません（最小 0）。';
    return;
  }

  currentSpace = Space.getSpaceByLocation(
    { lat: c.lat, lng: c.lng, alt: c.alt },
    nextZoom
   );
  syncInputsFromSpace(currentSpace);
  renderAll(currentSpace);

    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
``
