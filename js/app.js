// SciPlot Pin — Main Application Controller
// Pinterest Masonry Layout, Category & Multi-Tag Filtering, Custom User Tagging ("打标签"),
// Real-Time Matplotlib Palette Switching, Detail Modal, SVG/PNG/Python Export.
(function () {
  'use strict';

  const { PALETTES, getById: getPaletteById } = window.SciPlot.Palettes;
  const {
    CATEGORIES,
    PRESET_USER_TAGS,
    TAG_GROUPS,
    STYLES,
    buildFullMplScript,
    buildRcParamsBlock,
    buildMplStyleFile,
    getById: getStyleById
  } = window.SciPlot.Catalog;
  const Engine = window.SciPlot.Engine;

  const STORAGE_KEYS = {
    pins: 'sciplot_pinned_v1',
    userTags: 'sciplot_usertags_v1',
    palette: 'sciplot_palette_v1',
    customColors: 'sciplot_custom_colors_v1',
    density: 'sciplot_density_v1'
  };

  // Approximate SVG aspect ratios (height / width) for accurate shortest-column placement
  const ASPECT_RATIOS = {
    'hybrid-dual-regime-bar': 355 / 420,
    'bar-nature-jitter': 350 / 420,
    'bar-ieee-hatch': 318 / 420,
    'bar-stacked-flow': 455 / 420,
    'bar-diverging-lollipop': 486 / 420,
    'scatter-joint-marginal': 435 / 420,
    'scatter-volcano-quadrant': 445 / 420,
    'scatter-paired-slope': 480 / 420,
    'scatter-kde-contour': 400 / 420,
    'radar-polygon-benchmark': 418 / 420,
    'radar-nightingale-rose': 420 / 420,
    'radar-spider-minimal': 425 / 420,
    'line-ci-band': 312 / 420,
    'line-inset-zoom': 355 / 420,
    'line-small-multiples': 430 / 420,
    'line-dual-phase': 308 / 420,
    'dist-raincloud': 380 / 420,
    'dist-box-signif': 435 / 420,
    'dist-ridgeline': 492 / 420,
    'dist-ecdf-step': 345 / 420,
    'matrix-corr-tri': 412 / 420,
    'matrix-clustered-zscore': 492 / 420,
    'matrix-contour-field': 366 / 420,
    'comp-forest-plot': 496 / 420,
    'comp-panel-ab': 485 / 420
  };

  const state = {
    viewMode: 'all', // 'all' | 'pinned'
    category: 'all',
    activeTags: new Set(),
    search: '',
    paletteId: 'npg',
    density: 4, // 3 | 4 | 5 on wide screens
    taxonomyOpen: false,
    popoverCardId: null,
    modalStyleId: null,
    modalCodeTab: 'script', // 'script' | 'rcparams' | 'mplstyle'
    modalCanvasBg: 'white', // 'white' | 'warm' | 'transparent'
    pinned: new Set(),
    userTags: {}
  };

  function loadPersistedState() {
    try {
      const savedPins = JSON.parse(localStorage.getItem(STORAGE_KEYS.pins) || 'null');
      if (Array.isArray(savedPins)) {
        state.pinned = new Set(savedPins);
      }

      const savedTags = JSON.parse(localStorage.getItem(STORAGE_KEYS.userTags) || 'null');
      if (savedTags && typeof savedTags === 'object') {
        state.userTags = savedTags;
      } else {
        // Seed 2 starter custom tags on very first visit so user immediately sees custom tags in action
        state.userTags = {
          'bar-nature-jitter': ['⭐ 论文候选'],
          'dist-raincloud': ['⭐ 论文候选']
        };
      }

      const savedPal = localStorage.getItem(STORAGE_KEYS.palette);
      if (savedPal && PALETTES.some(p => p.id === savedPal)) {
        state.paletteId = savedPal;
      }

      const savedCustom = JSON.parse(localStorage.getItem(STORAGE_KEYS.customColors) || 'null');
      if (Array.isArray(savedCustom) && savedCustom.length === 6) {
        const customObj = getPaletteById('custom');
        customObj.colors = savedCustom;
      }

      const savedDensity = parseInt(localStorage.getItem(STORAGE_KEYS.density) || '4', 10);
      if ([3, 4, 5].includes(savedDensity)) {
        state.density = savedDensity;
      }
    } catch (_) {
      // Ignore storage restrictions
    }
  }

  function savePins() {
    try {
      localStorage.setItem(STORAGE_KEYS.pins, JSON.stringify([...state.pinned]));
    } catch (_) {}
  }

  function saveUserTags() {
    try {
      localStorage.setItem(STORAGE_KEYS.userTags, JSON.stringify(state.userTags));
    } catch (_) {}
  }

  function getActivePalette() {
    return getPaletteById(state.paletteId);
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  let toastTimer = null;
  function showToast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  function copyText(text, successMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => showToast(successMsg),
        () => fallbackCopy(text, successMsg)
      );
    } else {
      fallbackCopy(text, successMsg);
    }
  }

  function fallbackCopy(text, successMsg) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast(successMsg);
    } catch (_) {
      showToast('复制失败，请手动全选复制');
    }
    document.body.removeChild(ta);
  }

  function getUserTagsFor(styleId) {
    return state.userTags[styleId] || [];
  }

  function getAllUniqueUserTags() {
    const counts = new Map();
    Object.values(state.userTags).forEach(arr => {
      (arr || []).forEach(t => counts.set(t, (counts.get(t) || 0) + 1));
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }

  function addTagToCard(styleId, rawTag) {
    const clean = (rawTag || '').trim().replace(/^#+/, '');
    if (!clean) return;
    const list = state.userTags[styleId] ? [...state.userTags[styleId]] : [];
    if (!list.includes(clean)) {
      list.push(clean);
      state.userTags[styleId] = list;
      saveUserTags();
      showToast(`已添加标签「${clean}」`);
    }
    renderTagBar();
    renderMasonry();
    if (state.modalStyleId === styleId) {
      renderModalRight();
    }
  }

  function removeUserTagFromCard(styleId, tag) {
    const list = (state.userTags[styleId] || []).filter(t => t !== tag);
    if (list.length > 0) {
      state.userTags[styleId] = list;
    } else {
      delete state.userTags[styleId];
    }
    if (state.activeTags.has(tag)) {
      const remaining = getAllUniqueUserTags().some(([k]) => k === tag);
      if (!remaining) state.activeTags.delete(tag);
    }
    saveUserTags();
    renderTagBar();
    renderMasonry();
    if (state.modalStyleId === styleId) {
      renderModalRight();
    }
  }

  function toggleUserTagOnCard(styleId, tag) {
    const list = getUserTagsFor(styleId);
    if (list.includes(tag)) {
      removeUserTagFromCard(styleId, tag);
    } else {
      addTagToCard(styleId, tag);
    }
  }

  function togglePin(styleId) {
    if (state.pinned.has(styleId)) {
      state.pinned.delete(styleId);
      showToast('已从收藏夹移除');
    } else {
      state.pinned.add(styleId);
      showToast('📌 已收藏该科研绘图风格');
    }
    savePins();
    updateHeaderCounts();
    renderMasonry();
    if (state.modalStyleId === styleId) {
      renderModalRight();
    }
  }

  // ==================== FILTERING ====================
  function getFilteredStyles() {
    const q = state.search.trim().toLowerCase();
    return STYLES.filter(item => {
      if (state.viewMode === 'pinned' && !state.pinned.has(item.id)) return false;
      if (state.category !== 'all' && item.category !== state.category) return false;

      const uTags = getUserTagsFor(item.id);
      if (state.activeTags.size > 0) {
        for (const reqTag of state.activeTags) {
          if (!item.tags.includes(reqTag) && !uTags.includes(reqTag)) {
            return false;
          }
        }
      }

      if (q) {
        const hay = [
          item.id,
          item.title,
          item.enTitle,
          item.venueBadge,
          item.summary,
          ...item.tags,
          ...uTags,
          ...item.mplApis
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  // ==================== RENDER CONTROLS ====================
  function updateHeaderCounts() {
    const pinBadge = document.getElementById('pinCountBadge');
    if (pinBadge) pinBadge.textContent = state.pinned.size;

    document.querySelectorAll('.nav-mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === state.viewMode);
    });

    document.querySelectorAll('.density-btn').forEach(btn => {
      btn.classList.toggle('active', Number(btn.dataset.cols) === state.density);
    });
  }

  function renderCategoryBar() {
    const el = document.getElementById('categoryBar');
    if (!el) return;

    el.innerHTML = CATEGORIES.map(cat => {
      const cnt = cat.id === 'all'
        ? STYLES.length
        : STYLES.filter(s => s.category === cat.id).length;
      const active = state.category === cat.id ? 'active' : '';
      return `<button class="cat-pill ${active}" data-cat="${cat.id}">
        <span>${cat.icon}</span>
        <span>${escHtml(cat.name)}</span>
        <span class="cat-count">${cnt}</span>
      </button>`;
    }).join('');

    el.querySelectorAll('.cat-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        state.category = btn.dataset.cat;
        renderCategoryBar();
        renderMasonry();
      });
    });
  }

  function renderPaletteBar() {
    const scrollEl = document.getElementById('paletteScroll');
    const customEditor = document.getElementById('customPaletteEditor');
    if (!scrollEl || !customEditor) return;

    scrollEl.innerHTML = PALETTES.map(pal => {
      const active = pal.id === state.paletteId ? 'active' : '';
      const dots = pal.colors.map(hex => `<span class="swatch-dot" style="background:${hex}"></span>`).join('');
      return `<button class="palette-chip ${active}" data-pal="${pal.id}" title="${escHtml(pal.subtitle)}">
        <span class="swatch-row">${dots}</span>
        <span class="palette-chip-name">${escHtml(pal.name)}</span>
      </button>`;
    }).join('');

    scrollEl.querySelectorAll('.palette-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        setPalette(btn.dataset.pal);
      });
    });

    // Custom color slots
    const customPal = getPaletteById('custom');
    customEditor.classList.toggle('open', state.paletteId === 'custom');
    if (state.paletteId === 'custom') {
      customEditor.innerHTML = `<span class="section-label">自定义 6 色槽：</span>` +
        customPal.colors.map((hex, idx) => `
          <label class="custom-color-slot">
            <input type="color" data-slot="${idx}" value="${hex}">
            <input type="text" data-hex-slot="${idx}" value="${hex}" maxlength="7">
          </label>
        `).join('');

      customEditor.querySelectorAll('input[type="color"]').forEach(inp => {
        inp.addEventListener('input', () => {
          const i = Number(inp.dataset.slot);
          customPal.colors[i] = inp.value.toUpperCase();
          const txtInp = customEditor.querySelector(`input[data-hex-slot="${i}"]`);
          if (txtInp) txtInp.value = customPal.colors[i];
          persistAndRefreshPalette();
        });
      });

      customEditor.querySelectorAll('input[data-hex-slot]').forEach(inp => {
        inp.addEventListener('change', () => {
          const i = Number(inp.dataset.hexSlot);
          let v = inp.value.trim();
          if (!v.startsWith('#')) v = '#' + v;
          if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
            customPal.colors[i] = v.toUpperCase();
            persistAndRefreshPalette();
            renderPaletteBar();
          }
        });
      });
    }
  }

  function persistAndRefreshPalette() {
    try {
      localStorage.setItem(STORAGE_KEYS.customColors, JSON.stringify(getPaletteById('custom').colors));
    } catch (_) {}
    refreshAllVisiblePlotSvgs();
    if (state.modalStyleId) {
      renderModalLeft();
      renderModalCode();
    }
  }

  function setPalette(palId) {
    state.paletteId = palId;
    try {
      localStorage.setItem(STORAGE_KEYS.palette, palId);
    } catch (_) {}
    renderPaletteBar();
    refreshAllVisiblePlotSvgs();
    updateStatusStrip(getFilteredStyles().length);
    if (state.modalStyleId) {
      renderModalLeft();
      renderModalCode();
    }
  }

  // Fast in-place SVG re-render across all cards without layout jump
  function refreshAllVisiblePlotSvgs() {
    const pal = getActivePalette();
    document.querySelectorAll('.pin-svg-holder[data-style-id]').forEach(holder => {
      const sid = holder.dataset.styleId;
      holder.innerHTML = Engine.render(sid, pal);
    });
  }

  function renderTagBar() {
    const quickEl = document.getElementById('quickTagChips');
    const drawerEl = document.getElementById('tagTaxonomyDrawer');
    const clearBtn = document.getElementById('clearFiltersBtn');
    const toggleBtn = document.getElementById('toggleAllTagsBtn');
    if (!quickEl || !drawerEl) return;

    const userTagEntries = getAllUniqueUserTags();
    const featuredSystemTags = [
      '个体+均值混合', '空心符号',
      'Nature/CNS风', 'IEEE/物理风', '医学/Lancet风', 'AI顶会风',
      '去上右边框', '四框内刻度', '黑白打印友好', '误差棒',
      '原始样本点', '置信阴影带', '显著性标注', '分面小多图'
    ];

    let html = '';
    userTagEntries.forEach(([tag, cnt]) => {
      const active = state.activeTags.has(tag) ? 'active' : '';
      html += `<button class="filter-tag user-custom ${active}" data-tag="${escHtml(tag)}">
        <span>🏷️ ${escHtml(tag)}</span>
        <span style="opacity:0.75">(${cnt})</span>
      </button>`;
    });

    featuredSystemTags.forEach(tag => {
      const active = state.activeTags.has(tag) ? 'active' : '';
      html += `<button class="filter-tag ${active}" data-tag="${escHtml(tag)}">#${escHtml(tag)}</button>`;
    });

    quickEl.innerHTML = html;
    quickEl.querySelectorAll('.filter-tag').forEach(btn => {
      btn.addEventListener('click', () => toggleFilterTag(btn.dataset.tag));
    });

    // Full taxonomy drawer
    drawerEl.classList.toggle('open', state.taxonomyOpen);
    if (toggleBtn) {
      toggleBtn.textContent = state.taxonomyOpen ? '收起标签库 ▲' : '展开全部标签维度 ▼';
    }

    drawerEl.innerHTML = TAG_GROUPS.map(grp => {
      const chips = grp.tags.map(tag => {
        const active = state.activeTags.has(tag) ? 'active' : '';
        return `<button class="filter-tag ${active}" data-tag="${escHtml(tag)}">#${escHtml(tag)}</button>`;
      }).join('');
      return `<div class="taxonomy-group">
        <span class="taxonomy-group-title">${escHtml(grp.label)}</span>
        <div style="display:flex;flex-wrap:wrap;gap:6px;flex:1">${chips}</div>
      </div>`;
    }).join('');

    drawerEl.querySelectorAll('.filter-tag').forEach(btn => {
      btn.addEventListener('click', () => toggleFilterTag(btn.dataset.tag));
    });

    const hasFilters = state.category !== 'all' || state.activeTags.size > 0 || state.search.trim() !== '' || state.viewMode !== 'all';
    if (clearBtn) {
      clearBtn.style.display = hasFilters ? 'inline-flex' : 'none';
    }
  }

  function toggleFilterTag(tag) {
    if (state.activeTags.has(tag)) {
      state.activeTags.delete(tag);
    } else {
      state.activeTags.add(tag);
    }
    renderTagBar();
    renderMasonry();
  }

  function updateStatusStrip(shownCount) {
    const statusEl = document.getElementById('statusStripText');
    if (!statusEl) return;
    const pal = getActivePalette();
    const tagPart = state.activeTags.size > 0
      ? ` · 已筛选标签：${[...state.activeTags].map(t => `#${t}`).join(' + ')}`
      : '';
    statusEl.innerHTML = `当前展示 <span class="status-highlight">${shownCount} / ${STYLES.length}</span> 种科研数据绘图风格（纯数据图表 · Matplotlib 引擎） · 当前配色：<span class="status-highlight">${escHtml(pal.name)}</span>${escHtml(tagPart)}`;
  }

  // ==================== PINTEREST SHORTEST-COLUMN MASONRY ====================
  function computeColumnCount() {
    const w = window.innerWidth;
    if (w < 640) return 1;
    if (w < 980) return 2;
    if (w < 1080) return Math.min(3, state.density);
    return state.density;
  }

  function renderMasonry() {
    const wall = document.getElementById('masonryWall');
    const emptyEl = document.getElementById('emptyState');
    if (!wall || !emptyEl) return;

    const items = getFilteredStyles();
    updateStatusStrip(items.length);

    if (items.length === 0) {
      wall.innerHTML = '';
      emptyEl.style.display = 'block';
      return;
    }
    emptyEl.style.display = 'none';

    const colCount = computeColumnCount();
    const cols = Array.from({ length: colCount }, () => []);
    const colHeights = new Array(colCount).fill(0);
    const pal = getActivePalette();

    items.forEach(item => {
      // Find shortest column
      let minIdx = 0;
      for (let c = 1; c < colCount; c++) {
        if (colHeights[c] < colHeights[minIdx]) minIdx = c;
      }
      cols[minIdx].push(item);
      const figRatio = ASPECT_RATIOS[item.id] || 0.95;
      colHeights[minIdx] += figRatio * 340 + 150;
    });

    wall.innerHTML = cols.map((colItems, ci) => {
      const cardsHtml = colItems.map(item => buildCardHtml(item, pal)).join('');
      return `<div class="masonry-col" data-col="${ci}">${cardsHtml}</div>`;
    }).join('');

    bindCardEvents(wall);
  }

  function buildCardHtml(item, pal) {
    const isSaved = state.pinned.has(item.id);
    const catObj = CATEGORIES.find(c => c.id === item.category);
    const uTags = getUserTagsFor(item.id);
    const popOpen = state.popoverCardId === item.id;

    const userTagHtml = uTags.map(t => {
      const active = state.activeTags.has(t) ? 'active' : '';
      return `<span class="card-tag user-tag ${active}" data-filter-tag="${escHtml(t)}">
        <span>${escHtml(t)}</span>
        <span class="card-tag-remove" data-remove-tag="${escHtml(t)}" data-card="${item.id}" title="移除该标签">×</span>
      </span>`;
    }).join('');

    const sysTagHtml = item.tags.map(t => {
      const active = state.activeTags.has(t) ? 'active' : '';
      return `<button class="card-tag ${active}" data-filter-tag="${escHtml(t)}">#${escHtml(t)}</button>`;
    }).join('');

    return `<article class="pin-card ${popOpen ? 'popover-open' : ''}" data-id="${item.id}">
      <div class="pin-figure-stage" data-open-modal="${item.id}">
        <div class="pin-svg-holder" data-style-id="${item.id}">${Engine.render(item.id, pal)}</div>
        ${isSaved ? `<div class="pinned-indicator" title="已收藏">📌</div>` : ''}
        <div class="pin-hover-layer">
          <div class="pin-hover-top">
            <span class="venue-pill">${escHtml(item.venueBadge)}</span>
            <button class="pin-save-btn ${isSaved ? 'saved' : ''}" data-pin="${item.id}">
              ${isSaved ? '已收藏 ✓' : '收藏风格'}
            </button>
          </div>
          <div class="pin-hover-bottom">
            <button class="hover-action-btn" data-open-tagger="${item.id}">🏷️ 打标签</button>
            <button class="hover-action-btn" data-copy-id="${item.id}" title="复制 ID: ${escHtml(item.id)}">⧉ 复制 ID</button>
            <button class="hover-action-btn" data-copy-code="${item.id}">&lt;/&gt; 代码</button>
          </div>
        </div>
      </div>

      <div class="pin-body">
        <div class="pin-meta-top">
          <span class="pin-cat-badge">${catObj ? escHtml(catObj.name) : ''}</span>
          <button class="pin-id-btn" data-copy-id="${item.id}" title="点击复制图表 ID: ${escHtml(item.id)}">
            <span>ID: ${escHtml(item.id)}</span>
            <span class="pin-id-copy-icon">⧉</span>
          </button>
        </div>
        <h3 class="pin-title" data-open-modal="${item.id}">${escHtml(item.title)}</h3>
        <p class="pin-summary">${escHtml(item.summary)}</p>
        <div class="pin-tags-wrap">
          ${userTagHtml}
          ${sysTagHtml}
          <button class="add-tag-mini-btn" data-open-tagger="${item.id}">+ 打标签</button>
        </div>
      </div>

      ${popOpen ? buildTagPopoverHtml(item.id) : ''}
    </article>`;
  }

  function buildTagPopoverHtml(styleId) {
    const current = getUserTagsFor(styleId);
    const allCustom = getAllUniqueUserTags().map(([k]) => k);
    const mergedPresets = [...new Set([...PRESET_USER_TAGS, ...allCustom])];

    const chips = mergedPresets.map(t => {
      const sel = current.includes(t) ? 'selected' : '';
      return `<button class="preset-tag-chip ${sel}" data-toggle-utag="${escHtml(t)}" data-target-id="${styleId}">
        ${sel ? '✓ ' : '+ '}${escHtml(t)}
      </button>`;
    }).join('');

    return `<div class="tag-popover" data-popover-box="${styleId}">
      <div class="tag-popover-head">
        <span>🏷️ 为该图表风格打标签</span>
        <button class="tag-popover-close" data-close-popover="1">×</button>
      </div>
      <div class="tag-input-group">
        <input type="text" class="custom-tag-input" data-tag-input="${styleId}" placeholder="输入自定义标签，如：Fig2候选、投Nature..." maxlength="24">
        <button data-submit-tag="${styleId}">添加</button>
      </div>
      <div class="preset-tags-list">${chips}</div>
    </div>`;
  }

  function bindCardEvents(wall) {
    wall.querySelectorAll('[data-open-modal]').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.closest('button') || e.target.closest('.tag-popover')) return;
        openModal(el.dataset.openModal);
      });
    });

    wall.querySelectorAll('[data-pin]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        togglePin(btn.dataset.pin);
      });
    });

    wall.querySelectorAll('[data-copy-id]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.dataset.copyId;
        copyText(id, `已复制图表 ID：${id}`);
        btn.classList.add('copied');
        const iconEl = btn.querySelector('.pin-id-copy-icon');
        if (iconEl) iconEl.textContent = '✓';
        setTimeout(() => {
          btn.classList.remove('copied');
          if (iconEl) iconEl.textContent = '⧉';
        }, 1200);
      });
    });

    wall.querySelectorAll('[data-copy-code]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const item = getStyleById(btn.dataset.copyCode);
        const code = buildFullMplScript(item, getActivePalette());
        copyText(code, `已复制「${item.title}」完整 Matplotlib 代码`);
      });
    });

    wall.querySelectorAll('[data-open-tagger]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.dataset.openTagger;
        state.popoverCardId = state.popoverCardId === id ? null : id;
        renderMasonry();
        if (state.popoverCardId) {
          const inp = document.querySelector(`input[data-tag-input="${state.popoverCardId}"]`);
          if (inp) inp.focus();
        }
      });
    });

    wall.querySelectorAll('[data-close-popover]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        state.popoverCardId = null;
        renderMasonry();
      });
    });

    wall.querySelectorAll('[data-submit-tag]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const sid = btn.dataset.submitTag;
        const inp = wall.querySelector(`input[data-tag-input="${sid}"]`);
        if (inp && inp.value.trim()) {
          addTagToCard(sid, inp.value);
        }
      });
    });

    wall.querySelectorAll('input[data-tag-input]').forEach(inp => {
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter' && inp.value.trim()) {
          e.preventDefault();
          addTagToCard(inp.dataset.tagInput, inp.value);
        } else if (e.key === 'Escape') {
          state.popoverCardId = null;
          renderMasonry();
        }
      });
    });

    wall.querySelectorAll('[data-toggle-utag]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        toggleUserTagOnCard(btn.dataset.targetId, btn.dataset.toggleUtag);
      });
    });

    wall.querySelectorAll('[data-filter-tag]').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.closest('[data-remove-tag]')) return;
        e.stopPropagation();
        toggleFilterTag(el.dataset.filterTag);
      });
    });

    wall.querySelectorAll('[data-remove-tag]').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        removeUserTagFromCard(el.dataset.card, el.dataset.removeTag);
      });
    });
  }

  // ==================== PINTEREST DETAIL MODAL ====================
  function openModal(styleId) {
    state.modalStyleId = styleId;
    state.popoverCardId = null;
    const backdrop = document.getElementById('modalBackdrop');
    if (!backdrop) return;
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
    renderModalLeft();
    renderModalRight();
  }

  function closeModal() {
    state.modalStyleId = null;
    const backdrop = document.getElementById('modalBackdrop');
    if (backdrop) backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  function renderModalLeft() {
    const item = getStyleById(state.modalStyleId);
    if (!item) return;
    const pal = getActivePalette();
    const figBox = document.getElementById('modalFigureCard');
    const miniPals = document.getElementById('modalMiniPalettes');

    const bgColor = state.modalCanvasBg === 'warm'
      ? '#FAF8F5'
      : (state.modalCanvasBg === 'transparent' ? 'transparent' : '#FFFFFF');

    if (figBox) {
      figBox.classList.toggle('bg-warm', state.modalCanvasBg === 'warm');
      figBox.classList.toggle('bg-checker', state.modalCanvasBg === 'transparent');
      figBox.innerHTML = Engine.render(item.id, pal, { bg: bgColor });
    }

    document.querySelectorAll('.bg-toggle-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.bg === state.modalCanvasBg);
    });

    if (miniPals) {
      miniPals.innerHTML = PALETTES.map(p => {
        const active = p.id === state.paletteId ? 'active' : '';
        const dots = p.colors.slice(0, 4).map(h => `<span class="swatch-dot" style="width:9px;height:9px;background:${h}"></span>`).join('');
        return `<button class="mini-pal-btn ${active}" data-modal-pal="${p.id}">
          <span class="swatch-row">${dots}</span>
          <span>${escHtml(p.name.split(' ')[0])}</span>
        </button>`;
      }).join('');

      miniPals.querySelectorAll('[data-modal-pal]').forEach(btn => {
        btn.addEventListener('click', () => setPalette(btn.dataset.modalPal));
      });
    }
  }

  function renderModalRight() {
    const item = getStyleById(state.modalStyleId);
    const rightEl = document.getElementById('modalRightContent');
    if (!item || !rightEl) return;

    const isSaved = state.pinned.has(item.id);
    const catObj = CATEGORIES.find(c => c.id === item.category);
    const uTags = getUserTagsFor(item.id);
    const allCustom = getAllUniqueUserTags().map(([k]) => k);
    const mergedPresets = [...new Set([...PRESET_USER_TAGS, ...allCustom])];

    const uTagChips = uTags.map(t => `<span class="card-tag user-tag">
      <span>${escHtml(t)}</span>
      <span class="card-tag-remove" data-modal-rm-tag="${escHtml(t)}">×</span>
    </span>`).join('');

    const sTagChips = item.tags.map(t => `<button class="card-tag" data-modal-jump-tag="${escHtml(t)}">#${escHtml(t)}</button>`).join('');

    const presetHtml = mergedPresets.map(t => {
      const sel = uTags.includes(t) ? 'selected' : '';
      return `<button class="preset-tag-chip ${sel}" data-modal-toggle-tag="${escHtml(t)}">${sel ? '✓ ' : '+ '}${escHtml(t)}</button>`;
    }).join('');

    rightEl.innerHTML = `
      <div class="modal-header-row">
        <div>
          <span class="pin-cat-badge">${catObj ? escHtml(catObj.name) : ''} · ${escHtml(item.venueBadge)}</span>
          <h2 class="modal-title">${escHtml(item.title)}</h2>
          <p class="modal-entitle">${escHtml(item.enTitle)}</p>
          <div class="modal-id-bar">
            <span class="section-label">图表 ID：</span>
            <button class="pin-id-btn" id="modalCopyIdBtn" title="点击复制图表 ID: ${escHtml(item.id)}">
              <span>${escHtml(item.id)}</span>
              <span class="pin-id-copy-icon">⧉ 复制</span>
            </button>
          </div>
        </div>
        <button class="pin-save-btn ${isSaved ? 'saved' : ''}" id="modalPinBtn">
          ${isSaved ? '已收藏 ✓' : '📌 收藏风格'}
        </button>
      </div>

      <p class="modal-desc">${escHtml(item.summary)}</p>

      <div class="api-pills">
        <span class="section-label">核心 Matplotlib 接口：</span>
        ${item.mplApis.map(a => `<span class="api-pill">${escHtml(a)}</span>`).join('')}
      </div>

      <div class="modal-tag-box">
        <div class="section-label">🏷️ 风格标签管理（点击系统标签可筛选画廊，或添加你的专属分类标签）</div>
        <div class="pin-tags-wrap">${uTagChips}${sTagChips}</div>
        <div class="tag-input-group">
          <input type="text" id="modalTagInput" placeholder="添加自定义标签（如：毕业论文第3章、主图备选）回车确认..." maxlength="24">
          <button id="modalAddTagBtn">打标签</button>
        </div>
        <div class="preset-tags-list">${presetHtml}</div>
      </div>

      <div class="code-studio">
        <div class="code-studio-bar">
          <div class="code-tabs">
            <button class="code-tab ${state.modalCodeTab === 'script' ? 'active' : ''}" data-ctab="script">完整 Matplotlib 脚本 (.py)</button>
            <button class="code-tab ${state.modalCodeTab === 'rcparams' ? 'active' : ''}" data-ctab="rcparams">rcParams 样式头</button>
            <button class="code-tab ${state.modalCodeTab === 'mplstyle' ? 'active' : ''}" data-ctab="mplstyle">.mplstyle 配置文件</button>
          </div>
          <div class="code-actions">
            <button class="code-btn" id="modalDownloadPyBtn">下载代码</button>
            <button class="code-btn primary" id="modalCopyCodeBtn">复制代码</button>
          </div>
        </div>
        <pre class="code-pre"><code id="modalCodeBlock"></code></pre>
      </div>
    `;

    renderModalCode();

    document.getElementById('modalPinBtn').addEventListener('click', () => togglePin(item.id));
    const modalCopyIdBtn = document.getElementById('modalCopyIdBtn');
    if (modalCopyIdBtn) {
      modalCopyIdBtn.addEventListener('click', () => {
        copyText(item.id, `已复制图表 ID：${item.id}`);
        modalCopyIdBtn.classList.add('copied');
        const iconEl = modalCopyIdBtn.querySelector('.pin-id-copy-icon');
        if (iconEl) iconEl.textContent = '✓ 已复制';
        setTimeout(() => {
          modalCopyIdBtn.classList.remove('copied');
          if (iconEl) iconEl.textContent = '⧉ 复制';
        }, 1200);
      });
    }
    document.getElementById('modalAddTagBtn').addEventListener('click', () => {
      const inp = document.getElementById('modalTagInput');
      if (inp && inp.value.trim()) addTagToCard(item.id, inp.value);
    });
    document.getElementById('modalTagInput').addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.value.trim()) {
        addTagToCard(item.id, e.target.value);
      }
    });

    rightEl.querySelectorAll('[data-modal-rm-tag]').forEach(el => {
      el.addEventListener('click', () => removeUserTagFromCard(item.id, el.dataset.modalRmTag));
    });
    rightEl.querySelectorAll('[data-modal-toggle-tag]').forEach(btn => {
      btn.addEventListener('click', () => toggleUserTagOnCard(item.id, btn.dataset.modalToggleTag));
    });
    rightEl.querySelectorAll('[data-modal-jump-tag]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = btn.dataset.modalJumpTag;
        closeModal();
        state.activeTags.clear();
        state.activeTags.add(tag);
        renderTagBar();
        renderMasonry();
      });
    });

    rightEl.querySelectorAll('[data-ctab]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.modalCodeTab = btn.dataset.ctab;
        rightEl.querySelectorAll('[data-ctab]').forEach(b => b.classList.toggle('active', b === btn));
        renderModalCode();
      });
    });

    document.getElementById('modalCopyCodeBtn').addEventListener('click', () => {
      copyText(getCurrentModalCodeText(), '已复制 Matplotlib 代码到剪贴板');
    });

    document.getElementById('modalDownloadPyBtn').addEventListener('click', () => {
      const pal = getActivePalette();
      const ext = state.modalCodeTab === 'mplstyle' ? 'mplstyle' : 'py';
      downloadBlob(getCurrentModalCodeText(), `${item.id}_${pal.id}.${ext}`, 'text/plain;charset=utf-8');
    });
  }

  function getCurrentModalCodeText() {
    const item = getStyleById(state.modalStyleId);
    const pal = getActivePalette();
    if (!item) return '';
    if (state.modalCodeTab === 'rcparams') return buildRcParamsBlock(item, pal);
    if (state.modalCodeTab === 'mplstyle') return buildMplStyleFile(item, pal);
    return buildFullMplScript(item, pal);
  }

  function renderModalCode() {
    const codeEl = document.getElementById('modalCodeBlock');
    if (!codeEl) return;
    codeEl.textContent = getCurrentModalCodeText();
  }

  // ==================== FILE EXPORTS (SVG / PNG / STYLE SPEC) ====================
  function downloadBlob(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadModalSvg() {
    const item = getStyleById(state.modalStyleId);
    if (!item) return;
    const pal = getActivePalette();
    const bgColor = state.modalCanvasBg === 'transparent' ? 'transparent' : '#FFFFFF';
    const svgText = Engine.render(item.id, pal, { bg: bgColor });
    downloadBlob(svgText, `${item.id}_${pal.id}.svg`, 'image/svg+xml;charset=utf-8');
    showToast('已导出矢量图 SVG');
  }

  function downloadModalPng() {
    const item = getStyleById(state.modalStyleId);
    if (!item) return;
    const pal = getActivePalette();
    const bgColor = state.modalCanvasBg === 'transparent' ? 'transparent' : '#FFFFFF';
    const svgText = Engine.render(item.id, pal, { bg: bgColor });

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    const svgNode = doc.documentElement;
    const vb = (svgNode.getAttribute('viewBox') || '0 0 420 400').split(/\s+/).map(Number);
    const w = vb[2] || 420;
    const h = vb[3] || 400;
    const scale = 3; // High-DPI export

    const img = new Image();
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `${item.id}_${pal.id}_3x.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
        showToast('已导出高分辨率 PNG 图表');
      }, 'image/png');
    };
    img.src = url;
  }

  function exportSelectedStylePack() {
    const pal = getActivePalette();
    const chosen = state.pinned.size > 0
      ? STYLES.filter(s => state.pinned.has(s.id))
      : getFilteredStyles();

    const lines = [
      `# 科研数据图风格挑选清单 (Matplotlib Style Pack)`,
      ``,
      `- **导出时间**: ${new Date().toLocaleString('zh-CN')}`,
      `- **选定调色盘**: ${pal.name} (${pal.subtitle})`,
      `- **离散色值列表**: \`[${pal.colors.map(c => `'${c}'`).join(', ')}]\``,
      `- **推荐连续/发散色阶**: \`${pal.mplCmapSeq}\` / \`${pal.mplCmapDiv}\``,
      `- **包含图表数量**: ${chosen.length} 种`,
      ``
    ];

    chosen.forEach((item, idx) => {
      const uTags = getUserTagsFor(item.id);
      lines.push(`## ${idx + 1}. ${item.title} (\`${item.id}\`)`);
      lines.push(`- **图表 ID**: \`${item.id}\``);
      lines.push(`- **所属分类**: ${item.category} | **风格定位**: ${item.venueBadge}`);
      lines.push(`- **系统标签**: ${item.tags.map(t => `#${t}`).join(' ')}`);
      if (uTags.length > 0) {
        lines.push(`- **我的标签**: ${uTags.join(', ')}`);
      }
      lines.push(`- **适用说明**: ${item.summary}`);
      lines.push(``);
      lines.push('```python');
      lines.push(buildFullMplScript(item, pal).trim());
      lines.push('```');
      lines.push(``);
    });

    const fname = state.pinned.size > 0
      ? `matplotlib_pinned_styles_${pal.id}.md`
      : `matplotlib_filtered_styles_${pal.id}.md`;
    downloadBlob(lines.join('\n'), fname, 'text/markdown;charset=utf-8');
    showToast(`已导出 ${chosen.length} 个科研绘图风格配置清单 (.md)`);
  }

  // ==================== INITIALIZATION ====================
  function init() {
    loadPersistedState();
    updateHeaderCounts();
    renderCategoryBar();
    renderPaletteBar();
    renderTagBar();
    renderMasonry();

    // Header view mode buttons (All vs Pinned)
    document.querySelectorAll('.nav-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.viewMode = btn.dataset.mode;
        updateHeaderCounts();
        renderTagBar();
        renderMasonry();
      });
    });

    // Search input
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    const searchKbd = document.getElementById('searchKbd');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        state.search = searchInput.value;
        const hasText = state.search.length > 0;
        if (searchClear) searchClear.classList.toggle('visible', hasText);
        if (searchKbd) searchKbd.style.display = hasText ? 'none' : 'block';
        renderTagBar();
        renderMasonry();
      });
    }
    if (searchClear) {
      searchClear.addEventListener('click', () => {
        state.search = '';
        searchInput.value = '';
        searchClear.classList.remove('visible');
        if (searchKbd) searchKbd.style.display = 'block';
        renderTagBar();
        renderMasonry();
      });
    }

    // Column density buttons
    document.querySelectorAll('.density-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.density = Number(btn.dataset.cols);
        try {
          localStorage.setItem(STORAGE_KEYS.density, String(state.density));
        } catch (_) {}
        updateHeaderCounts();
        renderMasonry();
      });
    });

    // Copy active palette HEX Python array
    const copyPalBtn = document.getElementById('copyPaletteHexBtn');
    if (copyPalBtn) {
      copyPalBtn.addEventListener('click', () => {
        const pal = getActivePalette();
        const snippet = `PALETTE = [${pal.colors.map(c => `'${c}'`).join(', ')}]  # ${pal.name}`;
        copyText(snippet, `已复制 ${pal.name} Python 色盘数组`);
      });
    }

    // Toggle full tag taxonomy
    const toggleTagsBtn = document.getElementById('toggleAllTagsBtn');
    if (toggleTagsBtn) {
      toggleTagsBtn.addEventListener('click', () => {
        state.taxonomyOpen = !state.taxonomyOpen;
        renderTagBar();
      });
    }

    // Clear all filters
    const clearBtn = document.getElementById('clearFiltersBtn');
    const resetEmptyBtn = document.getElementById('resetEmptyFiltersBtn');
    const resetAll = () => {
      state.viewMode = 'all';
      state.category = 'all';
      state.activeTags.clear();
      state.search = '';
      if (searchInput) searchInput.value = '';
      if (searchClear) searchClear.classList.remove('visible');
      if (searchKbd) searchKbd.style.display = 'block';
      updateHeaderCounts();
      renderCategoryBar();
      renderTagBar();
      renderMasonry();
    };
    if (clearBtn) clearBtn.addEventListener('click', resetAll);
    if (resetEmptyBtn) resetEmptyBtn.addEventListener('click', resetAll);

    // Export & batch copy IDs buttons
    const exportBtn = document.getElementById('exportPackBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportSelectedStylePack);

    const copyIdsBtn = document.getElementById('copySelectedIdsBtn');
    if (copyIdsBtn) {
      copyIdsBtn.addEventListener('click', () => {
        const chosen = state.pinned.size > 0
          ? STYLES.filter(s => state.pinned.has(s.id))
          : getFilteredStyles();
        const idList = chosen.map(s => s.id).join(', ');
        const scopeLabel = state.pinned.size > 0 ? '已收藏' : '当前筛选';
        copyText(idList, `已复制 ${chosen.length} 个${scopeLabel}图表 ID`);
      });
    }

    // Modal backdrop & buttons
    const backdrop = document.getElementById('modalBackdrop');
    const closeBtn = document.getElementById('modalCloseBtn');
    if (backdrop) {
      backdrop.addEventListener('click', e => {
        if (e.target === backdrop) closeModal();
      });
    }
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    document.querySelectorAll('.bg-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.modalCanvasBg = btn.dataset.bg;
        renderModalLeft();
      });
    });

    const dlSvgBtn = document.getElementById('dlSvgBtn');
    const dlPngBtn = document.getElementById('dlPngBtn');
    if (dlSvgBtn) dlSvgBtn.addEventListener('click', downloadModalSvg);
    if (dlPngBtn) dlPngBtn.addEventListener('click', downloadModalPng);

    // Close card tag popover on outside click
    document.addEventListener('click', e => {
      if (state.popoverCardId && !e.target.closest('.tag-popover') && !e.target.closest('[data-open-tagger]')) {
        state.popoverCardId = null;
        renderMasonry();
      }
    });

    // Global keyboard shortcuts ('/' to search, Escape to close modal)
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (state.modalStyleId) closeModal();
        else if (state.popoverCardId) {
          state.popoverCardId = null;
          renderMasonry();
        }
      } else if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (searchInput) searchInput.focus();
      }
    });

    // Responsive resize reflow
    let lastCols = computeColumnCount();
    window.addEventListener('resize', () => {
      const nextCols = computeColumnCount();
      if (nextCols !== lastCols) {
        lastCols = nextCols;
        renderMasonry();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
