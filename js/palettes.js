// Scientific Publication Color Palettes & Color Utilities for Matplotlib Style Gallery
(function () {
  'use strict';

  const PALETTES = [
    {
      id: 'npg',
      name: 'Nature (NPG)',
      subtitle: 'Nature 出版集团经典高辨识科研色盘',
      category: '顶刊经典',
      colors: ['#E64B35', '#4DBBD5', '#00A087', '#3C5488', '#F39B7F', '#8491B4'],
      mplCmapSeq: 'YlGnBu',
      mplCmapDiv: 'RdBu_r'
    },
    {
      id: 'aaas',
      name: 'Science (AAAS)',
      subtitle: 'Science 期刊稳重深蓝与高对比红绿配比',
      category: '顶刊经典',
      colors: ['#3B4992', '#EE0000', '#008B45', '#631879', '#008280', '#BB0021'],
      mplCmapSeq: 'PuBu',
      mplCmapDiv: 'coolwarm'
    },
    {
      id: 'nejm',
      name: 'NEJM 医学经典',
      subtitle: '新英格兰医学杂志温润砖红与钴蓝配色',
      category: '顶刊经典',
      colors: ['#BC3C29', '#0072B5', '#E18727', '#20854E', '#7876B1', '#6F99AD'],
      mplCmapSeq: 'GnBu',
      mplCmapDiv: 'RdYlBu_r'
    },
    {
      id: 'lancet',
      name: 'Lancet 柳叶刀',
      subtitle: '强对比皇家蓝与鲜红，适合临床与森林图',
      category: '顶刊经典',
      colors: ['#00468B', '#ED0000', '#42B540', '#0099B4', '#925E9F', '#FDAF91'],
      mplCmapSeq: 'Blues',
      mplCmapDiv: 'bwr'
    },
    {
      id: 'jama',
      name: 'JAMA 沉稳石板',
      subtitle: '深灰蓝主调搭配暖琥珀色，克制耐看',
      category: '顶刊经典',
      colors: ['#374E55', '#DF8F44', '#00A1D5', '#B24745', '#79AF97', '#6A6599'],
      mplCmapSeq: 'YlGnBu',
      mplCmapDiv: 'BrBG_r'
    },
    {
      id: 'okabe_ito',
      name: 'Okabe-Ito 色盲安全',
      subtitle: 'Nature Methods 官方推荐色觉无障碍标准',
      category: '无障碍与感知',
      colors: ['#0072B2', '#D55E00', '#009E73', '#CC79A7', '#E69F00', '#56B4E9'],
      mplCmapSeq: 'cividis',
      mplCmapDiv: 'PuOr_r'
    },
    {
      id: 'tol_muted',
      name: 'Paul Tol Muted',
      subtitle: '欧洲物理与地球科学界广泛使用的柔和色盘',
      category: '柔和学术',
      colors: ['#332288', '#88CCEE', '#44AA99', '#117733', '#DDCC77', '#CC6677'],
      mplCmapSeq: 'YlGnBu',
      mplCmapDiv: 'PRGn_r'
    },
    {
      id: 'morandi',
      name: 'Academic Morandi',
      subtitle: '低饱和度高级灰调科研配色，适合多组堆积与综述',
      category: '柔和学术',
      colors: ['#4E6E8E', '#C96A5B', '#679B8B', '#D6A15C', '#8874A3', '#7B8B97'],
      mplCmapSeq: 'PuBuGn',
      mplCmapDiv: 'RdBu_r'
    },
    {
      id: 'sage_espresso',
      name: 'Sage & Espresso 鼠尾草棕',
      subtitle: '生物力学/神经工程经典大地深棕与鼠尾草绿低饱和对比',
      category: '柔和学术',
      colors: ['#6D4534', '#9EAB88', '#3D5A6C', '#C97B53', '#7D6B8D', '#8C857B'],
      mplCmapSeq: 'YlGn',
      mplCmapDiv: 'BrBG_r'
    },
    {
      id: 'viridis',
      name: 'Viridis 感知均匀',
      subtitle: 'Matplotlib 标志性亮度单调递增科学色盘',
      category: '无障碍与感知',
      colors: ['#440154', '#3B528B', '#21918C', '#5EC962', '#AADC32', '#FDE725'],
      mplCmapSeq: 'viridis',
      mplCmapDiv: 'viridis'
    },
    {
      id: 'nordic',
      name: 'AI Conference 冷调',
      subtitle: 'NeurIPS / ICML / CVPR 常见深海蓝与珊瑚橙配色',
      category: '现代会议',
      colors: ['#1D3557', '#E76F51', '#2A9D8F', '#457B9D', '#E9C46A', '#6D597A'],
      mplCmapSeq: 'YlGnBu',
      mplCmapDiv: 'RdBu_r'
    },
    {
      id: 'grayscale',
      name: 'IEEE 黑白印刷检视',
      subtitle: '模拟纸刊黑白打印效果，检验线型/纹理辨识度',
      category: '印刷检视',
      colors: ['#141414', '#4D4D4D', '#7F7F7F', '#A6A6A6', '#303030', '#949494'],
      mplCmapSeq: 'Greys',
      mplCmapDiv: 'Greys'
    },
    {
      id: 'custom',
      name: '自定义调色盘 (Custom)',
      subtitle: '自由拾取或输入 6 组科研专属 HEX 色值',
      category: '自定义',
      colors: ['#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51', '#6D597A'],
      mplCmapSeq: 'YlGnBu',
      mplCmapDiv: 'RdBu_r',
      isCustom: true
    }
  ];

  function hexToRgb(hex) {
    const clean = (hex || '#000000').replace('#', '').trim();
    const full = clean.length === 3
      ? clean.split('').map(ch => ch + ch).join('')
      : clean.padEnd(6, '0').slice(0, 6);
    const num = parseInt(full, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  function rgbToHex(r, g, b) {
    const clamp = v => Math.max(0, Math.min(255, Math.round(v)));
    return '#' + [clamp(r), clamp(g), clamp(b)]
      .map(v => v.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }

  function lerpColor(hexA, hexB, t) {
    const u = Math.max(0, Math.min(1, t));
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    return rgbToHex(
      a.r + (b.r - a.r) * u,
      a.g + (b.g - a.g) * u,
      a.b + (b.b - a.b) * u
    );
  }

  function multiStopLerp(stops, t) {
    const u = Math.max(0, Math.min(1, t));
    if (stops.length === 1) return stops[0];
    const scaled = u * (stops.length - 1);
    const idx = Math.min(stops.length - 2, Math.floor(scaled));
    const frac = scaled - idx;
    return lerpColor(stops[idx], stops[idx + 1], frac);
  }

  function relativeLuminance(hex) {
    const { r, g, b } = hexToRgb(hex);
    const chan = [r, g, b].map(v => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * chan[0] + 0.7152 * chan[1] + 0.0722 * chan[2];
  }

  function contrastText(bgHex) {
    return relativeLuminance(bgHex) > 0.36 ? '#182026' : '#FFFFFF';
  }

  // Derive a clean sequential ramp [0..1] matching any discrete palette
  function seqColor(palette, t) {
    const c = palette.colors;
    if (palette.id === 'viridis') {
      return multiStopLerp(['#440154', '#3B528B', '#21918C', '#5EC962', '#FDE725'], t);
    }
    if (palette.id === 'grayscale') {
      return multiStopLerp(['#F7F7F7', '#CCCCCC', '#888888', '#444444', '#141414'], t);
    }
    // Sort two darkest/richest colors and blend from light paper tint -> mid -> deep
    const sorted = [...c].sort((a, b) => relativeLuminance(a) - relativeLuminance(b));
    const deep = sorted[0];
    const mid = c[2] || sorted[2];
    const accent = c[1] || sorted[3];
    const veryLight = lerpColor('#FFFFFF', accent, 0.14);
    const light = lerpColor('#FFFFFF', mid, 0.48);
    return multiStopLerp([veryLight, light, mid, deep], t);
  }

  // Derive a balanced diverging ramp for v in [-1..+1] (e.g. correlation / Z-score)
  function divColor(palette, v) {
    const clamped = Math.max(-1, Math.min(1, v));
    if (palette.id === 'grayscale') {
      const u = (clamped + 1) / 2;
      return multiStopLerp(['#262626', '#8C8C8C', '#F7F7F7', '#BFBFBF', '#111111'], u);
    }
    // Pick coolest color for negative pole and warmest color for positive pole
    const c = palette.colors;
    let negPole = c[1];
    let posPole = c[0];
    let bestWarm = -999;
    let bestCool = -999;
    c.forEach(hex => {
      const { r, g, b } = hexToRgb(hex);
      const warmScore = r - 0.65 * b - 0.2 * g;
      const coolScore = b + 0.35 * g - 0.7 * r;
      if (warmScore > bestWarm) {
        bestWarm = warmScore;
        posPole = hex;
      }
      if (coolScore > bestCool) {
        bestCool = coolScore;
        negPole = hex;
      }
    });
    if (posPole === negPole) {
      negPole = c[3] || c[1];
    }
    const neutral = '#F8FAFC';
    if (clamped < 0) {
      return multiStopLerp([negPole, lerpColor(negPole, neutral, 0.55), neutral], clamped + 1);
    }
    return multiStopLerp([neutral, lerpColor(posPole, neutral, 0.45), posPole], clamped);
  }

  window.SciPlot = window.SciPlot || {};
  window.SciPlot.Palettes = {
    PALETTES,
    hexToRgb,
    rgbToHex,
    lerpColor,
    multiStopLerp,
    relativeLuminance,
    contrastText,
    seqColor,
    divColor,
    getById(id) {
      return PALETTES.find(p => p.id === id) || PALETTES[0];
    }
  };
})();
