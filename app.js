
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

    const zoomPlusBtn  = $('zoom-plus');   // ズーム +1
    const zoomMinusBtn = $('zoom-minus');  // ズーム -1

    // SVG要素
    const pathCurrent  = $('preview-current');
    const centerDot    = $('preview-center');

    const { Space } = window.SpatialId;
    let currentSpace = null;

    // ------- 表示ユーティリティ -------
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
      const parent = space.parent();
      parentListEl.innerHTML = '';
      parentListEl.appendChild(rowForSpace(parent));
    };

    const renderChildren = (space) => {
      const children = space.children();
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

    // ------- GeoJSON 正規化・描画 -------
    // FeatureCollection → 最初の Feature、Geometry → Feature 化
    const normalizeFeature = (geo) => {
      if (!geo) return null;
      if (geo.type === 'FeatureCollection') {
        return (geo.features && geo.features.length) ? geo.features[0] : null;
      }
      if (geo.type === 'Feature') return geo;
      if (geo.type) return { type: 'Feature', geometry: geo, properties: {} };
      return null;
    };

    // Polygon/MultiPolygon から最大リング（外周）を返す
    const largestRingFromGeometry = (geometry) => {
      if (!geometry) return null;

      if (geometry.type === 'Polygon') {
        const rings = geometry.coordinates || [];
        if (!rings.length) return null;
        // 外周は通常 index=0、ただし保険で頂点数の大きいものを選ぶ
        return rings.sort((a, b) => (b?.length || 0) - (a?.length || 0))[0];
      }

      if (geometry.type === 'MultiPolygon') {
        const polys = geometry.coordinates || [];
        if (!polys.length) return null;
        let best = null;
        let bestLen = -1;
        for (const rings of polys) {
          const ring = (Array.isArray(rings) && rings.length) ? rings[0] : null; // 各Polygonの外周
          const len = ring ? ring.length : 0;
          if (len > bestLen) { best = ring; bestLen = len; }
        }
        return best;
      }

      return null; // その他の geometry type は未対応（LineStringなど）
    };

    const bboxFromRing = (ring) => {
      let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
      for (const p of ring) {
        const lng = p[0];
        const lat = p[1];
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
      const eps = 1e-9; // ゼロ幅対策
      if (maxLng - minLng < eps) maxLng = minLng + eps;
      if (maxLat - minLat < eps) maxLat = minLat + eps;
      return { minLng, maxLng, minLat, maxLat };
    };

    // 線形マッピング（bbox → viewBox 0..400、paddingあり）
    const projectToViewBox = (lng, lat, bbox, width = 400, height = 400, padding = 12) => {
      const { minLng, maxLng, minLat, maxLat } = bbox;
      const dx = (maxLng - minLng);
      const dy = (maxLat - minLat);
      const w = width  - padding * 2;
      const h = height - padding * 2;
      const x = ((lng - minLng) / dx) * w + padding;
      const y = ((maxLat - lat) / dy) * h + padding; // 北が上へ来るように反転
      return { x, y };
    };

    const renderPreview = (space) => {
      try {
        const raw = space.toGeoJSON();
        const feat = normalizeFeature(raw);
        if (!feat || !feat.geometry) {
          console.warn('renderPreview: invalid feature', raw);
          pathCurrent.setAttribute('d', '');
          centerDot.setAttribute('cx', '0');
          centerDot.setAttribute('cy', '0');
          return;
        }

        const ring = largestRingFromGeometry(feat.geometry);
        if (!ring || ring.length < 3) {
          console.warn('renderPreview: ring not found or too short', feat.geometry);
          pathCurrent.setAttribute('d', '');
          centerDot.setAttribute('cx', '0');
          centerDot.setAttribute('cy', '0');
          return;
        }

        const bbox = bboxFromRing(ring);
        const width = 400, height = 400, padding = 12;

        let d = '';
        ring.forEach(([lng, lat], i) => {
          const { x, y } = projectToViewBox(lng, lat, bbox, width, height, padding);
          d += (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
        });
        d += ' Z';
        pathCurrent.setAttribute('d', d);

        const c = space.center;
        const { x: cx, y: cy } = projectToViewBox(c.lng, c.lat, bbox, width, height, padding);
        centerDot.setAttribute('cx', String(cx));
        centerDot.setAttribute('cy', String(cy));
      } catch (e) {
        console.error('renderPreview error:', e);
        pathCurrent.setAttribute('d', '');
        centerDot.setAttribute('cx', '0');
        centerDot.setAttribute('cy', '0');
      }
    };

    const renderAll = (space) => {
      try {
        renderMain(space);
        renderParent(space);
        renderChildren(space);
        renderAround(space);
        renderPreview(space);
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
      pathCurrent.setAttribute('d', '');
      centerDot.setAttribute('cx', '0');
      centerDot.setAttribute('cy', '0');
    };

    // ------- フォーム送信 -------
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

    // ------- クリア -------
    clearEl.addEventListener('click', () => {
      $('lat').value = "";
      $('lng').value = "";
      $('z').value   = "25";
      $('h').value   = "0";
      resetPanels();
      msgEl.textContent = "入力値をクリアしました。";
    });

    // ------- ズーム ±1（中心座標を維持して再生成） -------
    zoomPlusBtn.addEventListener('click', () => {
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
      syncInputsFromSpace(currentSpace);
      renderAll(currentSpace);
    });

    zoomMinusBtn.addEventListener('click', () => {
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
      syncInputsFromSpace(currentSpace);
      renderAll(currentSpace);
       });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})