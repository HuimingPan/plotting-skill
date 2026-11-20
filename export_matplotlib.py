#!/usr/bin/env python3
"""SciPlot Pin — Companion Matplotlib CLI Figure Exporter (25 Styles)"""
import argparse, os, sys
PALETTES = {
  "npg": {
    "name": "Nature (NPG)",
    "colors": [
      "#E64B35",
      "#4DBBD5",
      "#00A087",
      "#3C5488",
      "#F39B7F",
      "#8491B4"
    ],
    "seq": "YlGnBu",
    "div": "RdBu_r"
  },
  "aaas": {
    "name": "Science (AAAS)",
    "colors": [
      "#3B4992",
      "#EE0000",
      "#008B45",
      "#631879",
      "#008280",
      "#BB0021"
    ],
    "seq": "PuBu",
    "div": "coolwarm"
  },
  "nejm": {
    "name": "NEJM 医学经典",
    "colors": [
      "#BC3C29",
      "#0072B5",
      "#E18727",
      "#20854E",
      "#7876B1",
      "#6F99AD"
    ],
    "seq": "GnBu",
    "div": "RdYlBu_r"
  },
  "lancet": {
    "name": "Lancet 柳叶刀",
    "colors": [
      "#00468B",
      "#ED0000",
      "#42B540",
      "#0099B4",
      "#925E9F",
      "#FDAF91"
    ],
    "seq": "Blues",
    "div": "bwr"
  },
  "jama": {
    "name": "JAMA 沉稳石板",
    "colors": [
      "#374E55",
      "#DF8F44",
      "#00A1D5",
      "#B24745",
      "#79AF97",
      "#6A6599"
    ],
    "seq": "YlGnBu",
    "div": "BrBG_r"
  },
  "okabe_ito": {
    "name": "Okabe-Ito 色盲安全",
    "colors": [
      "#0072B2",
      "#D55E00",
      "#009E73",
      "#CC79A7",
      "#E69F00",
      "#56B4E9"
    ],
    "seq": "cividis",
    "div": "PuOr_r"
  },
  "tol_muted": {
    "name": "Paul Tol Muted",
    "colors": [
      "#332288",
      "#88CCEE",
      "#44AA99",
      "#117733",
      "#DDCC77",
      "#CC6677"
    ],
    "seq": "YlGnBu",
    "div": "PRGn_r"
  },
  "morandi": {
    "name": "Academic Morandi",
    "colors": [
      "#4E6E8E",
      "#C96A5B",
      "#679B8B",
      "#D6A15C",
      "#8874A3",
      "#7B8B97"
    ],
    "seq": "PuBuGn",
    "div": "RdBu_r"
  },
  "sage_espresso": {
    "name": "Sage & Espresso 鼠尾草棕",
    "colors": [
      "#6D4534",
      "#9EAB88",
      "#3D5A6C",
      "#C97B53",
      "#7D6B8D",
      "#8C857B"
    ],
    "seq": "YlGn",
    "div": "BrBG_r"
  },
  "viridis": {
    "name": "Viridis 感知均匀",
    "colors": [
      "#440154",
      "#3B528B",
      "#21918C",
      "#5EC962",
      "#AADC32",
      "#FDE725"
    ],
    "seq": "viridis",
    "div": "viridis"
  },
  "nordic": {
    "name": "AI Conference 冷调",
    "colors": [
      "#1D3557",
      "#E76F51",
      "#2A9D8F",
      "#457B9D",
      "#E9C46A",
      "#6D597A"
    ],
    "seq": "YlGnBu",
    "div": "RdBu_r"
  },
  "grayscale": {
    "name": "IEEE 黑白印刷检视",
    "colors": [
      "#141414",
      "#4D4D4D",
      "#7F7F7F",
      "#A6A6A6",
      "#303030",
      "#949494"
    ],
    "seq": "Greys",
    "div": "Greys"
  },
  "custom": {
    "name": "自定义调色盘 (Custom)",
    "colors": [
      "#264653",
      "#2A9D8F",
      "#E9C46A",
      "#F4A261",
      "#E76F51",
      "#6D597A"
    ],
    "seq": "YlGnBu",
    "div": "RdBu_r"
  }
}
STYLES = {
  'hybrid-dual-regime-bar': {"category": 'hybrid', "title": '双工况跨被试实虚轨迹 + 右侧分层双簇均值柱图', "en_title": 'Dual-Regime Subject Curves with Stratified Mean Clusters', "venue": '多工况对照 / 疲劳与稳态交叉设计', "rc_preset": 'nature-sans', "code": "subjects = [f'S{i}' for i in range(1, 9)]\nx_sub = np.arange(len(subjects))\n\nmethods = [\n    ('Adaptive-Synergy', 'o',\n     [0.055, 0.062, 0.078, 0.051, 0.064, 0.048, 0.059, 0.044],\n     [0.098, 0.112, 0.125, 0.094, 0.106, 0.089, 0.104, 0.118]),\n    ('Spectral-CNN', '^',\n     [0.115, 0.128, 0.144, 0.109, 0.121, 0.102, 0.118, 0.132],\n     [0.212, 0.236, 0.224, 0.188, 0.195, 0.218, 0.206, 0.248]),\n    ('Static-MVC', 's',\n     [0.168, 0.182, 0.195, 0.154, 0.148, 0.172, 0.164, 0.189],\n     [0.315, 0.298, 0.334, 0.256, 0.242, 0.288, 0.274, 0.358]),\n]\n\nfig, ax = plt.subplots(figsize=(6.4, 4.3), dpi=300)\nax.axvspan(7.85, 11.9, color='#F8FAFC', zorder=0)\nax.axvline(7.85, color='#94A3B8', linestyle='--', lw=1.0)\nax.hlines(0.080, -0.4, 7.6, colors='#64748B', linestyles='--', lw=0.95)\n\nbw = 0.42\nfor i, (name, mk, nf, ft) in enumerate(methods):\n    col = PALETTE[i % len(PALETTE)]\n    nf_arr, ft_arr = np.array(nf), np.array(ft)\n    ax.plot(x_sub, nf_arr, '-', lw=2.0, color=col, marker=mk, ms=6, mfc='none', mec=col, mew=1.6, label=name)\n    if i != 1:\n        ax.plot(x_sub, ft_arr, '--', lw=1.45, color=col, alpha=0.65, marker=mk, ms=5, mfc='none', mec=col, mew=1.2)\n\n    for center, arr, alpha in [(8.95, nf_arr, 0.78), (10.75, ft_arr, 0.94)]:\n        cx = center + (i - 1) * (bw + 0.05)\n        m, sd = arr.mean(), arr.std(ddof=1)\n        ax.bar(cx, m, width=bw, color=col, alpha=alpha, zorder=3)\n        _, caps, _ = ax.errorbar(cx, m, yerr=[[0], [sd]], fmt='none',\n                                 ecolor='#111827', elinewidth=1.15, capsize=3, zorder=4)\n        caps[0].set_visible(False)\n        ax.plot(cx, 0.022, marker=mk, ms=4.5, mfc='none', mec='white', mew=1.25, zorder=5)\n\ndef bracket(x1, x2, y, stars, h=0.012):\n    ax.plot([x1, x1, x2, x2], [y - h, y, y, y - h], color='#111827', lw=1.05)\n    ax.text((x1 + x2) / 2, y + 0.004, stars, ha='center', va='bottom', fontsize=10.5, fontweight='bold')\n\nbracket(8.95 - 0.47, 8.95 + 0.47, 0.225, '**')\nbracket(10.75 - 0.47, 10.75 + 0.47, 0.365, '***')\nbracket(8.95 - 0.47, 10.75 - 0.47, 0.420, '*')\n\nax.set_xticks(list(x_sub) + [8.95, 10.75], subjects + ['Mean-NF', 'Mean-FT'])\nax.set_xlim(-0.45, 11.9)\nax.set_ylim(0, 0.46)\nax.set_xlabel('Individual Subjects (S1-S8) & Stratified Regime Means')\nax.set_ylabel('Force Estimation Error (N*m)')\nax.yaxis.grid(True, linestyle='--', alpha=0.35)\nax.spines[['top', 'right']].set_visible(False)\nax.legend(ncol=3, loc='lower center', bbox_to_anchor=(0.45, 1.02), frameon=False, fontsize=8.8)"},
  'bar-nature-jitter': {"category": 'bar', "title": '均值柱状 + 原始样本抖动误差图', "en_title": 'Mean Bar with Jittered Samples & SEM', "venue": 'Nature / Cell 生物统计标配', "rc_preset": 'nature-sans', "code": "rng = np.random.default_rng(42)\nlabels = ['Vehicle', 'Low Dose', 'High Dose', 'Combo']\nmeans_true = [2.4, 4.7, 6.9, 8.6]\nsds_true = [0.55, 0.78, 0.85, 0.72]\ndata = [rng.normal(m, s, size=9) for m, s in zip(means_true, sds_true)]\n\nfig, ax = plt.subplots(figsize=(5.2, 4.2), dpi=300)\nx = np.arange(len(labels))\n\nfor i, samples in enumerate(data):\n    m = np.mean(samples)\n    sem = np.std(samples, ddof=1) / np.sqrt(len(samples))\n    col = PALETTE[i % len(PALETTE)]\n    ax.bar(x[i], m, width=0.58, color=col, alpha=0.74, edgecolor=col, linewidth=1.2, zorder=2)\n    _, caps, _ = ax.errorbar(x[i], m, yerr=[[0], [sem]], fmt='none', ecolor='#182026',\n                             capsize=4, capthick=1.2, elinewidth=1.2, zorder=4)\n    caps[0].set_visible(False)  # 仅保留单上侧误差线与上帽\n    jitter = rng.uniform(-0.14, 0.14, size=len(samples))\n    ax.scatter(x[i] + jitter, samples, s=28, facecolor='white', edgecolor=col, linewidth=1.35, zorder=5)\n\n# Significance bracket helper (asterisks only)\ndef add_bracket(ax, x1, x2, y, text, h=0.25):\n    ax.plot([x1, x1, x2, x2], [y - h, y, y, y - h], lw=1.05, c='#182026')\n    ax.text((x1 + x2) / 2, y + 0.08, text, ha='center', va='bottom', fontsize=10.5, fontweight='bold')\n\nadd_bracket(ax, 0, 2, 9.2, '**')\nadd_bracket(ax, 0, 3, 10.4, '***')\n\nax.set_xticks(x, labels)\nax.set_ylim(0, 11.5)\nax.set_ylabel('Relative mRNA Level (a.u.)')\nax.set_xlabel('Treatment Regimen')\nax.yaxis.grid(True, linestyle='--', alpha=0.35, zorder=0)\nax.spines[['top', 'right']].set_visible(False)"},
  'bar-ieee-hatch': {"category": 'bar', "title": 'IEEE 四框内刻度纹理分组柱状图', "en_title": 'Framed Grouped Bar with Print-Safe Hatches', "venue": 'IEEE / 物理工科双栏规范', "rc_preset": 'ieee-serif', "code": "suites = ['Workload-A', 'Workload-B', 'Workload-C', 'Workload-D']\nmethods = [\n    ('Baseline', '//', [52, 48, 61, 55], [3.2, 2.8, 3.5, 3.0]),\n    ('Heuristic', '..', [68, 64, 74, 71], [3.6, 3.1, 3.4, 3.3]),\n    ('Proposed', 'xx', [86, 83, 92, 89], [2.9, 2.5, 2.7, 2.6]),\n]\n\nfig, ax = plt.subplots(figsize=(5.6, 4.0), dpi=300)\nx = np.arange(len(suites))\nwidth = 0.24\n\nfor i, (name, hatch, vals, errs) in enumerate(methods):\n    pos = x + (i - 1) * (width + 0.02)\n    ax.bar(\n        pos, vals, width=width, label=name,\n        color=PALETTE[i % len(PALETTE)], alpha=0.84,\n        edgecolor='#111827', linewidth=0.95, hatch=hatch, zorder=3\n    )\n    _, caps, _ = ax.errorbar(pos, vals, yerr=[np.zeros_like(errs), errs], fmt='none',\n                             ecolor='#111827', elinewidth=1.0, capsize=3, zorder=4)\n    caps[0].set_visible(False)  # 单上侧误差线\n\nax.set_xticks(x, suites)\nax.set_ylim(0, 108)\nax.set_ylabel('Normalized Throughput (ops/s)')\nax.set_xlabel('Evaluation Benchmark Suite')\nax.yaxis.grid(True, linestyle=':', alpha=0.45, zorder=0)\nax.minorticks_on()\nax.tick_params(axis='x', which='minor', bottom=False, top=False)\nax.legend(ncol=3, loc='upper left', frameon=True, edgecolor='#111827', fancybox=False, fontsize=8.5)"},
  'bar-stacked-flow': {"category": 'bar', "title": '100% 构成堆积柱状 + 组间迁移丝带图', "en_title": 'Stacked Composition Bar with Flow Ribbons', "venue": 'Microbiome / 生态组学经典', "rc_preset": 'nature-sans', "code": "from matplotlib.path import Path\nimport matplotlib.patches as patches\n\nstages = ['Day 0', 'Day 3', 'Day 7', 'Day 14']\ntaxa = ['Bacteroidota', 'Firmicutes', 'Proteobacteria', 'Actinomycetota', 'Verrucomicrobia']\ncomp = np.array([\n    [38, 30, 14, 11, 7],\n    [29, 35, 18, 10, 8],\n    [21, 41, 15, 13, 10],\n    [16, 46, 11, 14, 13],\n], dtype=float)\n\nfig, ax = plt.subplots(figsize=(5.2, 5.6), dpi=300)\nx = np.arange(len(stages))\nbar_w = 0.48\nbottoms = np.zeros(len(stages))\n\nfor k, taxon in enumerate(taxa):\n    vals = comp[:, k]\n    col = PALETTE[k % len(PALETTE)]\n    ax.bar(x, vals, width=bar_w, bottom=bottoms, color=col, edgecolor='white', linewidth=1.0, label=taxon, zorder=3)\n    # Smooth cubic Bezier ribbon between adjacent bars\n    for g in range(len(stages) - 1):\n        x0, x1 = x[g] + bar_w / 2, x[g + 1] - bar_w / 2\n        xm = 0.5 * (x0 + x1)\n        y0_lo, y0_hi = bottoms[g], bottoms[g] + vals[g]\n        y1_lo, y1_hi = bottoms[g + 1], bottoms[g + 1] + vals[g + 1]\n        verts = [\n            (x0, y0_hi), (xm, y0_hi), (xm, y1_hi), (x1, y1_hi),\n            (x1, y1_lo), (xm, y1_lo), (xm, y0_lo), (x0, y0_lo), (x0, y0_hi)\n        ]\n        codes = [\n            Path.MOVETO, Path.CURVE4, Path.CURVE4, Path.CURVE4,\n            Path.LINETO, Path.CURVE4, Path.CURVE4, Path.CURVE4, Path.CLOSEPOLY\n        ]\n        ax.add_patch(patches.PathPatch(Path(verts, codes), facecolor=col, alpha=0.20, edgecolor='none', zorder=2))\n    bottoms += vals\n\nax.set_xticks(x, stages)\nax.set_ylim(0, 100)\nax.set_ylabel('Community Composition (%)')\nax.set_xlabel('Sampling Timepoint')\nax.spines[['top', 'right']].set_visible(False)\nax.legend(ncol=2, loc='lower center', bbox_to_anchor=(0.5, 1.02), frameon=False, fontsize=8.5)"},
  'bar-diverging-lollipop': {"category": 'bar', "title": '双向正负偏差水平棒棒糖图', "en_title": 'Diverging Horizontal Lollipop Chart', "venue": '极简高数据墨水比', "rc_preset": 'nature-sans', "code": "items = [\n    ('NF-kB Inflammation', -35.7), ('HIF-1a Glycolysis', -28.9),\n    ('De Novo Lipogenesis', -21.3), ('mTORC1 Activity', -14.6),\n    ('Pentose Phosphate', -7.8), ('Mito. Biogenesis', 9.5),\n    ('Autophagy Flux', 16.2), ('AMPK Signaling', 22.6),\n    ('Fatty Acid Beta-Ox.', 29.1), ('Oxidative Phos.', 38.4),\n]\nnames = [d[0] for d in items]\nvals = np.array([d[1] for d in items])\ny = np.arange(len(items))\ncolors = [PALETTE[0] if v >= 0 else PALETTE[3 % len(PALETTE)] for v in vals]\n\nfig, ax = plt.subplots(figsize=(5.4, 6.0), dpi=300)\nax.axvline(0, color='#1E242B', linestyle='--', linewidth=1.1, zorder=2)\nax.hlines(y, 0, vals, color=colors, linewidth=2.3, zorder=3)\nax.scatter(vals, y, color=colors, s=55, edgecolor='white', linewidth=1.2, zorder=4)\n\nfor yi, v, col in zip(y, vals, colors):\n    offset = 2.0 if v >= 0 else -2.0\n    ha = 'left' if v >= 0 else 'right'\n    ax.text(v + offset, yi, f'{v:+.1f}%', va='center', ha=ha, fontsize=8.5, fontweight='bold', color=col)\n\nax.set_yticks(y, names)\nax.set_xlim(-50, 54)\nax.set_xlabel('Standardized Effect Size Delta (%) vs. Control')\nax.xaxis.grid(True, linestyle='--', alpha=0.35, zorder=0)\nax.spines[['top', 'right', 'left']].set_visible(False)\nax.tick_params(axis='y', length=0)"},
  'scatter-joint-marginal': {"category": 'scatter', "title": '联合分布线性回归 + 边缘直方核密度图', "en_title": 'Joint OLS Fit with Marginal Histograms & KDE', "venue": '高信息密度相关性标配', "rc_preset": 'ieee-serif', "code": "from matplotlib.gridspec import GridSpec\n\nrng = np.random.default_rng(205)\nfig = plt.figure(figsize=(5.6, 5.6), dpi=300)\ngs = GridSpec(4, 4, figure=fig, hspace=0.12, wspace=0.12)\nax = fig.add_subplot(gs[1:, :3])\nax_top = fig.add_subplot(gs[0, :3], sharex=ax)\nax_right = fig.add_subplot(gs[1:, 3], sharey=ax)\n\nspecs = [\n    ('WT-Catalyst', PALETTE[0], 'o', 4.1, 1.5, 0.88, 1.5),\n    ('Doped-SingleAtom', PALETTE[1], 's', 6.3, 1.4, 1.02, 2.4),\n]\n\nx_grid = np.linspace(0.5, 9.5, 100)\nfor name, col, marker, mx, sx, slope, ic in specs:\n    xs = np.clip(rng.normal(mx, sx, 38), 0.6, 9.4)\n    ys = ic + slope * xs + rng.normal(0, 0.82, size=xs.size)\n    ax.scatter(xs, ys, s=30, c=col, marker=marker, edgecolors='white', linewidths=0.6, alpha=0.88, label=name)\n\n    # Analytical OLS & 95% confidence band\n    b1, b0 = np.polyfit(xs, ys, 1)\n    y_hat = b0 + b1 * x_grid\n    se = np.sqrt(np.sum((ys - (b0 + b1 * xs)) ** 2) / (xs.size - 2))\n    ci = 2.02 * se * np.sqrt(1 / xs.size + (x_grid - xs.mean()) ** 2 / np.sum((xs - xs.mean()) ** 2))\n    ax.plot(x_grid, y_hat, color=col, lw=1.9)\n    ax.fill_between(x_grid, y_hat - ci, y_hat + ci, color=col, alpha=0.18)\n\n    ax_top.hist(xs, bins=12, density=True, color=col, alpha=0.35, edgecolor=col, lw=0.9)\n    ax_right.hist(ys, bins=12, density=True, orientation='horizontal', color=col, alpha=0.35, edgecolor=col, lw=0.9)\n\nax_top.spines[['top', 'right', 'left']].set_visible(False)\nax_right.spines[['top', 'right', 'bottom']].set_visible(False)\nax_top.tick_params(labelbottom=False, left=False, labelleft=False)\nax_right.tick_params(labelleft=False, bottom=False, labelbottom=False)\n\nax.set_xlabel('Catalyst Loading x (wt%)')\nax.set_ylabel('Conversion Yield y (mmol/h)')\nax.grid(True, linestyle='--', alpha=0.3)\nax.legend(loc='upper left', frameon=True, fontsize=8.5)"},
  'scatter-volcano-quadrant': {"category": 'scatter', "title": '多维阈值象限火山气泡散点图', "en_title": 'Quadrant Threshold Volcano Bubble Plot', "venue": '组学筛选 / 效应显著性分析', "rc_preset": 'nature-sans', "code": "rng = np.random.default_rng(309)\nfc = rng.normal(0, 1.55, 160)\nneg_log_p = np.abs(fc) * 0.95 + np.abs(rng.normal(0.5, 1.15, 160))\nsizes = rng.uniform(18, 95, 160)\n\nup = (fc >= 1.0) & (neg_log_p >= 1.3)\ndown = (fc <= -1.0) & (neg_log_p >= 1.3)\nns = ~(up | down)\n\nfig, ax = plt.subplots(figsize=(5.2, 5.2), dpi=300)\nax.scatter(fc[ns], neg_log_p[ns], s=sizes[ns], c='#CBD5E1', alpha=0.55, edgecolors='none', label='NS')\nax.scatter(fc[down], neg_log_p[down], s=sizes[down], c=PALETTE[1], alpha=0.82, edgecolors='white', lw=0.5, label='Down-regulated')\nax.scatter(fc[up], neg_log_p[up], s=sizes[up], c=PALETTE[0], alpha=0.82, edgecolors='white', lw=0.5, label='Up-regulated')\n\nfor xv in (-1.0, 1.0):\n    ax.axvline(xv, color='#64748B', linestyle='--', lw=1.0)\nax.axhline(1.3, color='#64748B', linestyle='--', lw=1.0)\n\nhits = [('SPP1', 3.15, 6.35), ('CXCL9', 2.45, 5.15), ('APOE', -2.95, 5.85), ('TREM2', -2.15, 4.45)]\nfor name, hx, hy in hits:\n    col = PALETTE[0] if hx > 0 else PALETTE[1]\n    ax.scatter([hx], [hy], s=85, c=col, edgecolors='#111827', lw=1.1, zorder=5)\n    dx = 0.55 if hx > 0 else -0.55\n    ax.annotate(name, xy=(hx, hy), xytext=(hx + dx, hy + 0.35),\n                ha='left' if hx > 0 else 'right', fontsize=8.8, fontweight='bold',\n                arrowprops=dict(arrowstyle='-', color='#1E242B', lw=0.85))\n\nax.set_xlim(-4.5, 4.5)\nax.set_ylim(0, 7.5)\nax.set_xlabel('log2(Fold Change)')\nax.set_ylabel('-log10(Adjusted P-value)')\nax.legend(loc='upper center', bbox_to_anchor=(0.5, 1.08), ncol=3, frameon=False, fontsize=8.5)"},
  'scatter-paired-slope': {"category": 'scatter', "title": '配对前后个体响应斜率连线图', "en_title": 'Paired Pre-Post Slopegraph with Group SEM', "venue": 'NEJM / Lancet 临床与配对实验', "rc_preset": 'nature-sans', "code": "rng = np.random.default_rng(412)\nn = 14\ncohorts = [\n    ('Placebo Arm', 0.35, 1.15, PALETTE[3 % len(PALETTE)], 44.0, 3.5, 'ns'),\n    ('Intervention Arm', 2.05, 2.85, PALETTE[0], 43.0, 26.5, '***'),\n]\n\nfig, ax = plt.subplots(figsize=(5.0, 5.8), dpi=300)\nax.axvline(1.6, color='#E2E8F0', linestyle='--', lw=1.1)\n\nfor title, x1, x2, col, m0, delta, p_str in cohorts:\n    pre = rng.normal(m0, 8.2, size=n)\n    post = pre + rng.normal(delta, 5.6, size=n)\n    j1 = rng.uniform(-0.03, 0.03, size=n)\n    j2 = rng.uniform(-0.03, 0.03, size=n)\n    for a, b, ja, jb in zip(pre, post, j1, j2):\n        ax.plot([x1 + ja, x2 + jb], [a, b], color=col, alpha=0.32, lw=1.15)\n    ax.scatter(x1 + j1, pre, s=28, facecolor='white', edgecolor=col, lw=1.3, zorder=3)\n    ax.scatter(x2 + j2, post, s=28, facecolor=col, edgecolor='white', lw=0.8, zorder=3)\n\n    # Group means + upper-only 95% CI\n    ax.plot([x1, x2], [pre.mean(), post.mean()], color='#111827', lw=2.2, zorder=4)\n    for xp, arr, shift in [(x1, pre, -0.15), (x2, post, 0.15)]:\n        ci = 1.96 * arr.std(ddof=1) / np.sqrt(n)\n        _, caps, _ = ax.errorbar(xp + shift, arr.mean(), yerr=[[0], [ci]], fmt='D', ms=5.5,\n                                 mfc=col, mec='#111827', ecolor='#111827', elinewidth=1.4, capsize=3.5, zorder=5)\n        caps[0].set_visible(False)\n    ax.plot([x1, x1, x2, x2], [86.5, 88.0, 88.0, 86.5], color='#111827', lw=1.0)\n    ax.text((x1 + x2) / 2, 88.8, p_str, ha='center', fontsize=9.8, fontweight='bold')\n\nax.set_xticks([0.35, 1.15, 2.05, 2.85], ['Baseline', 'Week 12', 'Baseline', 'Week 12'])\nax.set_ylim(15, 95)\nax.set_ylabel('Functional Recovery Score')\nax.yaxis.grid(True, linestyle='--', alpha=0.35)\nax.spines[['top', 'right']].set_visible(False)"},
  'scatter-kde-contour': {"category": 'scatter', "title": '大样本二维核密度等高线散点场图', "en_title": '2D Density Contourf with Tail Scatter', "venue": '物理 / 天文 / 单细胞大样本风', "rc_preset": 'ieee-serif', "code": "rng = np.random.default_rng(523)\nx1, y1 = rng.multivariate_normal([-0.75, -0.55], [[0.75, 0.25], [0.25, 0.70]], 1100).T\nx2, y2 = rng.multivariate_normal([0.95, 0.85], [[0.56, 0.05], [0.05, 0.60]], 1300).T\nxs, ys = np.concatenate([x1, x2]), np.concatenate([y1, y2])\n\n# Smooth 2D histogram / Gaussian kernel evaluation on grid\nXg, Yg = np.meshgrid(np.linspace(-3, 3, 80), np.linspace(-3, 3, 80))\ndx = Xg[..., None] - xs[None, None, :]\ndy = Yg[..., None] - ys[None, None, :]\nZ = np.exp(-0.5 * (dx ** 2 + dy ** 2) / (0.38 ** 2)).mean(axis=-1)\nZ /= Z.max()\n\nfig, ax = plt.subplots(figsize=(5.2, 4.6), dpi=300)\nlevels = [0.12, 0.26, 0.42, 0.60, 0.78, 1.0]\ncf = ax.contourf(Xg, Yg, Z, levels=levels, cmap=CMAP_SEQ, alpha=0.88)\nax.contour(Xg, Yg, Z, levels=levels[:-1], colors='#1E242B', linewidths=0.85, alpha=0.65)\nax.scatter(xs[::12], ys[::12], s=6, c='#0F172A', alpha=0.32, linewidths=0)\n\ncbar = fig.colorbar(cf, ax=ax, pad=0.03, fraction=0.046)\ncbar.set_label('Normalized Density')\nax.set_xlim(-3, 3)\nax.set_ylim(-3, 3)\nax.set_xlabel('Latent Principal Mode $z_1$')\nax.set_ylabel('Latent Principal Mode $z_2$')\nax.minorticks_on()"},
  'radar-polygon-benchmark': {"category": 'radar', "title": '多模型六维多边形层叠雷达图', "en_title": 'Multi-Model Polygon Benchmark Radar', "venue": 'AI 顶会综合指标对比', "rc_preset": 'nature-sans', "code": "metrics = ['Accuracy', 'Robustness', 'Throughput', 'Calibration', 'Data Eff.', 'Generalization']\nmodels = [\n    ('Proposed (Ours)', [93, 88, 84, 90, 86, 91], 'o'),\n    ('ViT-Large', [85, 72, 64, 79, 71, 78], 's'),\n    ('ConvNeXt-B', [79, 76, 89, 74, 68, 72], '^'),\n]\n\nangles = np.linspace(0, 2 * np.pi, len(metrics), endpoint=False).tolist()\nangles += angles[:1]\n\nfig, ax = plt.subplots(figsize=(5.2, 5.2), subplot_kw=dict(polar=True), dpi=300)\nax.set_theta_offset(np.pi / 2)\nax.set_theta_direction(-1)\n\nfor i, (name, vals, marker) in enumerate(models):\n    closed = vals + vals[:1]\n    col = PALETTE[i % len(PALETTE)]\n    ax.plot(angles, closed, color=col, lw=2.0, marker=marker, ms=5, mec='white', mew=0.8, label=name)\n    ax.fill(angles, closed, color=col, alpha=0.17)\n\nax.set_xticks(angles[:-1], metrics)\nax.set_ylim(0, 100)\nax.set_yticks([20, 40, 60, 80, 100])\nax.yaxis.grid(True, linestyle='--', color='#CBD5E1')\nax.xaxis.grid(True, color='#CBD5E1')\nax.spines['polar'].set_color('#94A3B8')\nax.legend(loc='upper center', bbox_to_anchor=(0.5, 1.14), ncol=3, frameon=False, fontsize=8.8)"},
  'radar-nightingale-rose': {"category": 'radar', "title": '极坐标南丁格尔玫瑰扇区柱图', "en_title": 'Polar Nightingale Rose Bar Diagram', "venue": '环境科学 / 周期方位频谱', "rc_preset": 'nature-sans', "code": "dirs = ['N', 'NNE', 'ENE', 'E', 'ESE', 'SSE', 'S', 'SSW', 'WSW', 'W', 'WNW', 'NNW']\ntotal = np.array([78, 92, 84, 63, 48, 42, 55, 68, 88, 96, 74, 62], dtype=float)\nbase_tier = total * 0.56\npeak_tier = total - base_tier\n\ntheta = np.linspace(0, 2 * np.pi, len(dirs), endpoint=False)\nwidth = (2 * np.pi / len(dirs)) * 0.84\n\nfig, ax = plt.subplots(figsize=(5.2, 5.2), subplot_kw=dict(polar=True), dpi=300)\nax.set_theta_offset(np.pi / 2)\nax.set_theta_direction(-1)\n\nax.bar(theta, base_tier, width=width, color=PALETTE[1], edgecolor='white', lw=1.1, label='Base Regime (<5 m/s)')\nax.bar(theta, peak_tier, width=width, bottom=base_tier, color=PALETTE[0], edgecolor='white', lw=1.1, label='Peak Gust (>=5 m/s)')\n\nax.set_xticks(theta, dirs)\nax.set_ylim(0, 105)\nax.set_yticks([25, 50, 75, 100])\nax.yaxis.grid(True, linestyle='--', alpha=0.55)\nax.spines['polar'].set_color('#94A3B8')\nax.legend(loc='lower center', bbox_to_anchor=(0.5, -0.13), ncol=2, frameon=False, fontsize=8.8)"},
  'radar-spider-minimal': {"category": 'radar', "title": '无底色实虚线高对比学术蜘蛛图', "en_title": 'Unfilled Print-Safe Stroke Spider Plot', "venue": '黑白打印安全 / 严谨对比', "rc_preset": 'ieee-serif', "code": "axes_names = ['Precision', 'Recall', 'F1-Macro', 'AUROC', 'Spec.', 'NPV', 'Latency^-1']\nseries = [\n    ('Ensemble-Net', '-', 'o', [94, 89, 91, 96, 92, 88, 83]),\n    ('ResNet-50', '--', 's', [82, 78, 80, 86, 84, 79, 91]),\n    ('Linear-SVM', ':', 'D', [71, 66, 68, 74, 77, 70, 95]),\n]\n\nangles = np.linspace(0, 2 * np.pi, len(axes_names), endpoint=False).tolist()\nangles += angles[:1]\n\nfig, ax = plt.subplots(figsize=(5.2, 5.2), subplot_kw=dict(polar=True), dpi=300)\nax.set_theta_offset(np.pi / 2)\nax.set_theta_direction(-1)\n\nfor i, (name, ls, mk, vals) in enumerate(series):\n    closed = vals + vals[:1]\n    col = PALETTE[i % len(PALETTE)]\n    ax.plot(angles, closed, linestyle=ls, lw=1.9, color=col,\n            marker=mk, ms=5.5, mfc='white', mec=col, mew=1.6, label=name)\n\nax.set_xticks(angles[:-1], axes_names)\nax.set_ylim(0, 100)\nax.set_yticks([25, 50, 75, 100])\nax.spines['polar'].set_color('#475569')\nax.legend(loc='upper center', bbox_to_anchor=(0.5, 1.14), ncol=3, frameon=False, fontsize=8.8)"},
  'line-ci-band': {"category": 'line', "title": '多序列均值折线 + 标准差置信阴影带', "en_title": 'Multi-Curve Trajectory with Shaded SD Ribbon', "venue": 'NeurIPS / ICML / 动力学标配', "rc_preset": 'nature-sans', "code": "epochs = np.linspace(0, 100, 60)\nconfigs = [\n    ('Ours (Adaptive)', '-', lambda x: 93.5 - 48 * np.exp(-x / 18), 1.8),\n    ('Cosine-Warmup', '-', lambda x: 87.2 - 44 * np.exp(-x / 23), 2.1),\n    ('Step-Decay', '--', lambda x: 81.5 - 39 * np.exp(-x / 27) + np.where(x > 50, 2.4, 0), 2.3),\n    ('SGD-Const', ':', lambda x: 74.0 - 31 * np.exp(-x / 24), 2.5),\n]\n\nfig, ax = plt.subplots(figsize=(5.6, 3.9), dpi=300)\nfor i, (name, ls, fn, sd) in enumerate(configs):\n    col = PALETTE[i % len(PALETTE)]\n    y = fn(epochs) + 0.4 * np.sin(epochs * 0.35)\n    err = sd * (0.65 + 0.6 * np.exp(-epochs / 35))\n    ax.plot(epochs, y, linestyle=ls, lw=2.0, color=col, label=name)\n    ax.fill_between(epochs, y - err, y + err, color=col, alpha=0.17, linewidth=0)\n\nax.set_xlim(0, 100)\nax.set_ylim(40, 98)\nax.set_xlabel('Training Epochs')\nax.set_ylabel('Test Accuracy (%)')\nax.grid(True, linestyle='--', alpha=0.32)\nax.spines[['top', 'right']].set_visible(False)\nax.legend(ncol=4, loc='lower center', bbox_to_anchor=(0.5, 1.02), frameon=False, fontsize=8.2)"},
  'line-inset-zoom': {"category": 'line', "title": '四框内刻度光谱曲线 + 局部放大子图', "en_title": 'Framed Spectroscopy Line with Inset Zoom', "venue": 'Physical Review / 化学光谱风', "rc_preset": 'ieee-serif', "code": "wl = np.linspace(300, 800, 500)\ndef spectrum(x, shift, split, amp):\n    p1 = amp * np.exp(-((x - (478 + shift)) / 14) ** 2)\n    p2 = amp * 0.82 * np.exp(-((x - (502 + shift + split)) / 12) ** 2)\n    return 0.04 + 0.08 * np.exp(-(x - 300) / 140) + p1 + p2 + 0.24 * np.exp(-((x - 610) / 48) ** 2)\n\ncurves = [\n    ('300 K (Pristine)', spectrum(wl, 0, 0, 0.96)),\n    ('200 K (Annealed)', spectrum(wl, -3, 4, 0.78)),\n    ('80 K (Cryo)', spectrum(wl, -6, 8, 0.62)),\n]\n\nfig, ax = plt.subplots(figsize=(5.6, 4.4), dpi=300)\naxins = ax.inset_axes([0.53, 0.50, 0.43, 0.43])\n\nfor i, (label, y) in enumerate(curves):\n    col = PALETTE[i % len(PALETTE)]\n    ax.plot(wl, y, lw=1.7, color=col, label=label)\n    axins.plot(wl, y, lw=1.6, color=col)\n\naxins.set_xlim(455, 530)\naxins.set_ylim(0.42, 1.06)\naxins.tick_params(direction='in', top=True, right=True, labelsize=7.5)\nax.indicate_inset_zoom(axins, edgecolor='#475569', linestyle='--')\n\nax.set_xlim(300, 800)\nax.set_ylim(0, 1.15)\nax.set_xlabel('Wavelength $\\lambda$ (nm)')\nax.set_ylabel('Normalized Absorbance (a.u.)')\nax.minorticks_on()\nax.legend(loc='lower right', frameon=False, fontsize=8.8)"},
  'line-small-multiples': {"category": 'line', "title": '分面小多图 + 全局灰色背景参照曲线', "en_title": 'Small Multiples with Context Ghost Lines', "venue": 'Nature Climate / 多实验面板风', "rc_preset": 'nature-sans', "code": "t = np.linspace(0, 24, 60)\nseries = [\n    ('a  Catalyst Ni-CeO2', 18 + 72 * (1 - np.exp(-t / 4.5)) - 0.3 * t),\n    ('b  Catalyst Co-ZrO2', 15 + 62 * (1 - np.exp(-t / 6.8))),\n    ('c  Catalyst Cu-ZnO', 16 + 68 * (1 - np.exp(-t / 3.8)) - 1.35 * np.maximum(0, t - 8)),\n    ('d  Catalyst Ru-Al2O3', 12 + 79 / (1 + np.exp(-(t - 8.5) / 2.4))),\n]\n\nfig, axes = plt.subplots(2, 2, figsize=(5.6, 5.4), sharex=True, sharey=True, dpi=300)\nfor idx, (ax, (title, y_cur)) in enumerate(zip(axes.flat, series)):\n    for j, (_, y_bg) in enumerate(series):\n        if j != idx:\n            ax.plot(t, y_bg, color='#CBD5E1', lw=1.2, zorder=1)\n    col = PALETTE[idx % len(PALETTE)]\n    ax.plot(t, y_cur, color=col, lw=2.3, zorder=3)\n    ax.fill_between(t, 0, y_cur, color=col, alpha=0.10, zorder=2)\n    ax.scatter([t[-1]], [y_cur[-1]], color=col, s=30, zorder=4)\n    ax.set_title(title, loc='left', fontsize=9.8, fontweight='bold')\n    ax.set_ylim(0, 100)\n    ax.set_xlim(0, 24)\n    ax.yaxis.grid(True, linestyle='--', alpha=0.35)\n    ax.spines[['top', 'right']].set_visible(False)\n\nfig.supxlabel('Time-on-Stream Duration (hours)', fontsize=10)\nfig.supylabel('CH4 Conversion (%)', fontsize=10)\nfig.tight_layout()"},
  'line-dual-phase': {"category": 'line', "title": '实验阶段阴影分区 + 误差采样时序图', "en_title": 'Regime-Annotated Time Series with Errorbars', "venue": '生理监测 / 地球化学干预过程', "rc_preset": 'ieee-serif', "code": "ts = np.array([3, 9, 15, 21, 27, 33, 39, 45, 51, 57])\nwt = np.array([1.00, 1.02, 0.99, 1.62, 2.15, 2.28, 1.54, 1.22, 1.08, 1.04])\nko = np.array([1.00, 0.98, 1.01, 1.18, 1.32, 1.29, 1.12, 1.04, 1.01, 0.99])\n\nfig, ax = plt.subplots(figsize=(5.8, 3.9), dpi=300)\nax.axvspan(18, 38, color=PALETTE[0], alpha=0.08, zorder=0)\nfor xv in (18, 38):\n    ax.axvline(xv, color='#475569', linestyle='--', lw=1.0)\n\n_, caps_wt, _ = ax.errorbar(ts, wt, yerr=[np.zeros_like(wt), np.full_like(wt, 0.11)], fmt='-o',\n                            lw=1.9, ms=5, color=PALETTE[0], mec='white', mew=0.8, capsize=3, label='Wild-Type')\ncaps_wt[0].set_visible(False)\n_, caps_ko, _ = ax.errorbar(ts, ko, yerr=[np.zeros_like(ko), np.full_like(ko, 0.08)], fmt='-s',\n                            lw=1.9, ms=5, color=PALETTE[1], mec='white', mew=0.8, capsize=3, label='Knockout (KO)')\ncaps_ko[0].set_visible(False)\n\nfor xm, label in [(9, 'I. Baseline'), (28, 'II. Hypoxic Stress'), (49, 'III. Reperfusion')]:\n    ax.text(xm, 2.66, label, ha='center', va='bottom', fontsize=9, fontweight='bold')\n\nax.set_xlim(0, 60)\nax.set_ylim(0.4, 2.6)\nax.set_xlabel('Elapsed Time (min)')\nax.set_ylabel('Normalized Flux $J / J_0$')\nax.yaxis.grid(True, linestyle='--', alpha=0.35)\nax.legend(loc='upper right', frameon=True, fontsize=8.8)"},
  'dist-raincloud': {"category": 'distribution', "title": '云雨图：半小提琴核密度 + 窄箱线 + 散点', "en_title": 'Raincloud Plot (Half-Violin + Box + Jitter)', "venue": 'Nature Methods 现代统计强烈推荐', "rc_preset": 'nature-sans', "code": 'rng = np.random.default_rng(618)\ngroups = [\'Control\', \'Peptide-A\', \'Peptide-B\', \'Synergy\']\nsamples = [\n    rng.normal(4.2, 0.85, 32),\n    rng.normal(5.8, 1.05, 32),\n    rng.normal(7.3, 0.78, 32),\n    rng.normal(8.6, 0.92, 32),\n]\n\nfig, ax = plt.subplots(figsize=(5.6, 4.6), dpi=300)\ny_pos = np.arange(len(groups))\n\nparts = ax.violinplot(samples, positions=y_pos + 0.08, vert=False, widths=0.72,\n                      showmeans=False, showextrema=False)\nfor i, body in enumerate(parts[\'bodies\']):\n    # Clip lower half of horizontal violin to keep upper "cloud"\n    m = np.mean(body.get_paths()[0].vertices[:, 1])\n    body.get_paths()[0].vertices[:, 1] = np.clip(body.get_paths()[0].vertices[:, 1], y_pos[i] + 0.08, np.inf)\n    col = PALETTE[i % len(PALETTE)]\n    body.set_facecolor(col)\n    body.set_edgecolor(col)\n    body.set_alpha(0.62)\n\nax.boxplot(samples, positions=y_pos - 0.02, vert=False, widths=0.13, showfliers=False,\n           patch_artist=True, boxprops=dict(facecolor=\'white\', edgecolor=\'#1E242B\', lw=1.1),\n           medianprops=dict(color=\'#111827\', lw=2.0), whiskerprops=dict(color=\'#1E242B\', lw=1.1))\n\nfor i, arr in enumerate(samples):\n    jitter = rng.uniform(-0.28, -0.13, size=arr.size)\n    ax.scatter(arr, y_pos[i] + jitter, s=18, color=PALETTE[i % len(PALETTE)], alpha=0.78, edgecolors=\'white\', lw=0.4)\n\nax.set_yticks(y_pos, groups)\nax.set_xlabel(\'Binding Affinity Score (-log Kd)\')\nax.xaxis.grid(True, linestyle=\'--\', alpha=0.35)\nax.spines[[\'top\', \'right\']].set_visible(False)'},
  'dist-box-signif': {"category": 'distribution', "title": '显著性阶梯括号科研分组箱线图', "en_title": 'Framed Statistical Boxplot with P-Brackets', "venue": '生物医药 / 材料力学经典', "rc_preset": 'ieee-serif', "code": "rng = np.random.default_rng(704)\nlabels = ['Mock', 'siRNA-1', 'siRNA-2', 'CRISPRi', 'Rescue']\nmeans = [76, 54, 46, 31, 73]\ndata = [rng.normal(m, 8.2, size=24) for m in means]\n\nfig, ax = plt.subplots(figsize=(5.2, 5.2), dpi=300)\nbp = ax.boxplot(data, widths=0.52, patch_artist=True, showfliers=False,\n                medianprops=dict(color='#111827', lw=2.0),\n                whiskerprops=dict(linestyle='--', lw=1.1, color='#1E242B'))\n\nfor i, (patch, arr) in enumerate(zip(bp['boxes'], data)):\n    col = PALETTE[i % len(PALETTE)]\n    patch.set_facecolor(col)\n    patch.set_alpha(0.35)\n    patch.set_edgecolor(col)\n    patch.set_linewidth(1.5)\n    jx = (i + 1) + rng.uniform(-0.12, 0.12, size=arr.size)\n    ax.scatter(jx, arr, s=18, color=col, alpha=0.75, zorder=3)\n\ndef bracket(x1, x2, y, label):\n    ax.plot([x1, x1, x2, x2], [y - 1.5, y, y, y - 1.5], color='#1E242B', lw=1.05)\n    ax.text((x1 + x2) / 2, y + 0.8, label, ha='center', fontsize=8.8, fontweight='bold')\n\nbracket(1, 2, 92, '**')\nbracket(1, 4, 99, '***')\nbracket(1, 5, 106, 'ns')\n\nax.set_xticklabels(labels)\nax.set_ylim(10, 113)\nax.set_ylabel('Elastic Modulus E (kPa)')\nax.set_xlabel('Genetic Perturbation')\nax.yaxis.grid(True, linestyle='--', alpha=0.35)"},
  'dist-ridgeline': {"category": 'distribution', "title": '山脊核密度层叠演化分布图', "en_title": 'Stacked Ridgeline KDE Evolution Plot', "venue": 'Science / 连续参数分布演化', "rc_preset": 'nature-sans', "code": "temps = ['300 K', '350 K', '400 K', '450 K', '500 K', '550 K']\nx = np.linspace(-2, 10, 300)\ncmap = plt.get_cmap(CMAP_SEQ)\n\nfig, ax = plt.subplots(figsize=(5.0, 5.8), dpi=300)\nfor idx, label in enumerate(temps):\n    row = len(temps) - 1 - idx\n    base = row * 1.0\n    mu1, mu2 = 1.1 + idx * 1.05, 3.2 + idx * 0.85\n    w2 = 0.22 + idx * 0.09\n    dens = ((1 - w2) * np.exp(-0.5 * ((x - mu1) / 0.82) ** 2) +\n            w2 * np.exp(-0.5 * ((x - mu2) / 0.68) ** 2)) * 1.38\n\n    col = cmap(0.25 + 0.68 * idx / (len(temps) - 1))\n    z = idx * 3 + 2\n    ax.axhline(base, color='#CBD5E1', lw=0.8, zorder=1)\n    ax.fill_between(x, base, base + dens, color=col, alpha=0.85, zorder=z)\n    ax.plot(x, base + dens, color='white', lw=2.4, zorder=z + 1)\n    ax.plot(x, base + dens, color='#182026', lw=1.1, zorder=z + 2)\n\nax.set_yticks(np.arange(len(temps)), temps[::-1])\nax.set_xlim(-2, 10)\nax.set_xlabel('Activation Energy Barrier $\\Delta E$ (eV)')\nax.spines[['top', 'right', 'left']].set_visible(False)\nax.tick_params(axis='y', length=0)\nax.xaxis.grid(True, linestyle='--', alpha=0.35)"},
  'dist-ecdf-step': {"category": 'distribution', "title": '经验累积分布阶梯图 (ECDF) + KS 检验', "en_title": 'Empirical CDF Step Plot with KS Distance', "venue": '系统工程 / 基因组距离无参对比', "rc_preset": 'ieee-serif', "code": "rng = np.random.default_rng(815)\nsystems = [\n    ('Zero-Copy Kernel', '-', 28, 9.5),\n    ('Async-Batch', '--', 49, 14.5),\n    ('TCP-Baseline', ':', 68, 18.0),\n]\n\nfig, ax = plt.subplots(figsize=(5.4, 4.2), dpi=300)\nfor i, (name, ls, mu, sd) in enumerate(systems):\n    arr = np.sort(np.clip(rng.normal(mu, sd, 60), 2, 118))\n    y = np.arange(1, arr.size + 1) / arr.size\n    ax.step(np.r_[0, arr, 120], np.r_[0, y, 1.0], where='post',\n            linestyle=ls, lw=2.0, color=PALETTE[i % len(PALETTE)], label=name)\n\nfor q in (0.50, 0.95):\n    ax.axhline(q, color='#94A3B8', linestyle='--', lw=0.9)\n\nax.set_xlim(0, 120)\nax.set_ylim(0, 1.04)\nax.set_xlabel('Tail Response Latency (ms)')\nax.set_ylabel('Empirical CDF $F(x)$')\nax.grid(True, linestyle='--', alpha=0.32)\nax.legend(loc='lower right', frameon=True, fontsize=8.8)"},
  'matrix-corr-tri': {"category": 'heatmap', "title": '下三角显著性星号相关性热力矩阵', "en_title": 'Lower-Triangle Annotated Correlation Matrix', "venue": '多变量耦合分析清爽标配', "rc_preset": 'nature-sans', "code": "vars_name = ['TOC', 'TN', 'pH', 'Moisture', 'Enzyme-A', 'Microb-C', 'CO2-Flux']\ncorr = np.array([\n    [ 1.00,  0.84, -0.46,  0.62,  0.76,  0.81,  0.72],\n    [ 0.84,  1.00, -0.38,  0.55,  0.71,  0.78,  0.66],\n    [-0.46, -0.38,  1.00, -0.29, -0.58, -0.52, -0.64],\n    [ 0.62,  0.55, -0.29,  1.00,  0.49,  0.57,  0.61],\n    [ 0.76,  0.71, -0.58,  0.49,  1.00,  0.83,  0.79],\n    [ 0.81,  0.78, -0.52,  0.57,  0.83,  1.00,  0.88],\n    [ 0.72,  0.66, -0.64,  0.61,  0.79,  0.88,  1.00],\n])\nmask = np.triu(np.ones_like(corr, dtype=bool), k=1)\nmasked = np.ma.masked_where(mask, corr)\n\nfig, ax = plt.subplots(figsize=(5.4, 5.0), dpi=300)\nim = ax.imshow(masked, cmap=CMAP_DIV, vmin=-1, vmax=1)\n\nn = len(vars_name)\nax.set_xticks(np.arange(n), vars_name, rotation=35, ha='right')\nax.set_yticks(np.arange(n), vars_name)\nax.set_xticks(np.arange(-0.5, n, 1), minor=True)\nax.set_yticks(np.arange(-0.5, n, 1), minor=True)\nax.grid(which='minor', color='white', linestyle='-', linewidth=2.2)\nax.tick_params(which='minor', bottom=False, left=False)\nax.spines[:].set_visible(False)\n\nfor r in range(n):\n    for c in range(r + 1):\n        val = corr[r, c]\n        stars = '' if r == c else ('**' if abs(val) >= 0.75 else ('*' if abs(val) >= 0.5 else ''))\n        txt_col = 'white' if abs(val) > 0.58 else '#182026'\n        ax.text(c, r, f'{val:.2f}{stars}', ha='center', va='center', fontsize=8, color=txt_col)\n\ncbar = fig.colorbar(im, ax=ax, shrink=0.78, pad=0.03)\ncbar.set_label('Pearson r')"},
  'matrix-clustered-zscore': {"category": 'heatmap', "title": '带样本分组色条的标准化表达热力图', "en_title": 'Z-Score Expression Heatmap with Group Strip', "venue": 'Cell / 生信转录组与特征矩阵', "rc_preset": 'nature-sans', "code": "from matplotlib.gridspec import GridSpec\n\nrng = np.random.default_rng(908)\ngenes = ['STAT1', 'IRF7', 'ISG15', 'CXCL10', 'IFIT3', 'MX1', 'OAS2',\n         'MKI67', 'TOP2A', 'CDK1', 'PCNA', 'COL1A1', 'FN1', 'ACTA2']\nsamples = [f'S{i+1}' for i in range(12)]\nZ = rng.normal(0, 0.35, size=(len(genes), 12))\nZ[:7, 4:8] += 1.45; Z[:7, :4] -= 1.15\nZ[7:11, 8:] += 1.35; Z[7:11, :4] -= 0.85\nZ[11:, :4] += 1.25; Z[11:, 4:] -= 0.95\n\nfig = plt.figure(figsize=(5.2, 6.2), dpi=300)\ngs = GridSpec(2, 2, height_ratios=[0.35, 12], width_ratios=[12, 0.55], hspace=0.05, wspace=0.18)\nax_bar = fig.add_subplot(gs[0, 0])\nax = fig.add_subplot(gs[1, 0])\ncax = fig.add_subplot(gs[1, 1])\n\n# Top sample condition strip\ngroup_cols = [PALETTE[2]] * 4 + [PALETTE[0]] * 4 + [PALETTE[1]] * 4\nfor idx, col in enumerate(group_cols):\n    ax_bar.add_patch(plt.Rectangle((idx - 0.5, 0), 1, 1, color=col, ec='white', lw=0.8))\nax_bar.set_xlim(-0.5, 11.5)\nax_bar.axis('off')\n\nim = ax.imshow(Z, aspect='auto', cmap=CMAP_DIV, vmin=-2.2, vmax=2.2)\nax.set_xticks(np.arange(12), samples, fontsize=8)\nax.set_yticks(np.arange(len(genes)), genes, fontstyle='italic', fontsize=8.5)\nax.yaxis.tick_right()\nfig.colorbar(im, cax=cax, label='Row Z-score')"},
  'matrix-contour-field': {"category": 'heatmap', "title": '二维连续响应面填充 + 内嵌数值等高线图', "en_title": '2D Response Surface Contourf with clabel', "venue": '化工催化 / 气象流体 / 超参数曲面', "rc_preset": 'ieee-serif', "code": "T = np.linspace(150, 350, 120)\nP = np.linspace(1.0, 5.0, 120)\nTg, Pg = np.meshgrid(T, P)\nu, v = (Tg - 275) / 58.0, (Pg - 3.45) / 1.15\nZ = 0.94 * np.exp(-0.5 * (u**2 + v**2 - 0.5 * u * v)) + 0.34 * np.exp(-0.5 * (((Tg - 195)/48)**2 + ((Pg - 2.1)/1.1)**2))\n\nfig, ax = plt.subplots(figsize=(5.6, 4.4), dpi=300)\ncf = ax.contourf(Tg, Pg, Z, levels=np.linspace(0, 1.0, 11), cmap=CMAP_SEQ)\ncs = ax.contour(Tg, Pg, Z, levels=[0.2, 0.4, 0.6, 0.8], colors='#1E242B', linewidths=0.9)\nax.clabel(cs, inline=True, fmt='%.2f', fontsize=8)\n\nax.scatter([275], [3.45], marker='D', s=48, c=PALETTE[0], edgecolors='white', lw=1.2, zorder=5)\nax.text(281, 3.45, 'Optimum (94%)', color='white', fontsize=8.5, fontweight='bold', va='center')\n\ncbar = fig.colorbar(cf, ax=ax, pad=0.03)\ncbar.set_label('Target Selectivity')\nax.set_xlabel('Reaction Temperature $T$ (°C)')\nax.set_ylabel('Reactor Pressure $P$ (MPa)')\nax.minorticks_on()"},
  'comp-forest-plot': {"category": 'composite', "title": '亚组效应量/消融实验森林图 (Forest Plot)', "en_title": 'Subgroup Effect & 95% CI Forest Plot', "venue": 'Lancet / BMJ 荟萃与消融分析', "rc_preset": 'nature-sans', "code": "subgroups = [\n    ('Age < 65 yr', 0.68, 0.52, 0.89),\n    ('Age >= 65 yr', 0.74, 0.58, 0.94),\n    ('Female Cohort', 0.64, 0.47, 0.86),\n    ('Male Cohort', 0.77, 0.61, 0.98),\n    ('Stage II Disease', 0.59, 0.41, 0.84),\n    ('Stage III Disease', 0.72, 0.56, 0.92),\n    ('Biomarker High', 0.51, 0.36, 0.71),\n    ('Biomarker Low', 0.94, 0.71, 1.24),\n]\n\nfig, ax = plt.subplots(figsize=(6.0, 5.8), dpi=300)\nn = len(subgroups)\nfor idx, (name, hr, lo, hi) in enumerate(subgroups):\n    yi = n - idx\n    if idx % 2 == 0:\n        ax.axhspan(yi - 0.45, yi + 0.45, color='#F8FAFC', zorder=0)\n    col = PALETTE[0] if hi < 1.0 else PALETTE[3 % len(PALETTE)]\n    ax.errorbar(hr, yi, xerr=[[hr - lo], [hi - hr]], fmt='s', ms=6,\n                color=col, ecolor=col, elinewidth=1.5, capsize=3, zorder=3)\n    ax.text(-0.55, yi, name, va='center', ha='left', fontsize=9)\n    ax.text(0.02, yi, f'{hr:.2f} ({lo:.2f}-{hi:.2f})', va='center', ha='left', fontsize=8.5, family='monospace')\n\n# Pooled summary diamond at y = 0\nax.fill([0.61, 0.69, 0.78, 0.69], [0, 0.28, 0, -0.28], color=PALETTE[1], edgecolor='#111827', lw=1.0, zorder=4)\nax.text(-0.55, 0, 'Overall Pooled', va='center', fontweight='bold', fontsize=9.2)\nax.text(0.02, 0, '0.69 (0.61-0.78)', va='center', fontweight='bold', fontsize=8.5, family='monospace')\nax.axvline(1.0, color='#1E242B', linestyle='--', lw=1.05)\n\nax.set_xlim(-0.6, 1.55)\nax.set_xticks([0.4, 0.7, 1.0, 1.3])\nax.set_yticks([])\nax.set_xlabel('Hazard Ratio (95% CI)')\nax.spines[['top', 'right', 'left']].set_visible(False)"},
  'comp-panel-ab': {"category": 'composite', "title": '双子图复合排版：主拟合曲线 (a) + 残差棒图 (b)', "en_title": 'Shared-X Composite: Model Fit (a) & Residuals (b)', "venue": 'Nature Energy / 物理模型验证规范', "rc_preset": 'ieee-serif', "code": "from matplotlib.gridspec import GridSpec\n\nrng = np.random.default_rng(991)\nx_fine = np.linspace(0, 10, 200)\nmodel_fn = lambda x: 98 * np.exp(-0.048 * x) + 4.5 * np.exp(-0.65 * x)\n\nx_obs = np.linspace(0, 10, 19)\nres = rng.normal(0, 1.85, size=x_obs.size)\ny_obs = model_fn(x_obs) + res\n\nfig = plt.figure(figsize=(5.4, 5.8), dpi=300)\ngs = GridSpec(2, 1, height_ratios=[3.0, 1.15], hspace=0.08)\nax_a = fig.add_subplot(gs[0])\nax_b = fig.add_subplot(gs[1], sharex=ax_a)\n\nax_a.plot(x_fine, model_fn(x_fine), color=PALETTE[0], lw=2.0, label='Kinetic Decay Model')\nax_a.plot(x_fine, 101 - 5.1 * x_fine, color=PALETTE[1], lw=1.5, ls='--', label='Linear Drift Fit')\n_, caps_a, _ = ax_a.errorbar(x_obs, y_obs, yerr=[np.zeros_like(y_obs), np.full_like(y_obs, 2.6)],\n                             fmt='o', ms=5, mfc='white', mec=PALETTE[0], mew=1.4,\n                             ecolor='#1E242B', elinewidth=1.0, capsize=2.5, label='Exp. Data (+1 SD)')\ncaps_a[0].set_visible(False)\nax_a.set_ylabel('Specific Capacity (mAh $g^{-1}$)')\nax_a.tick_params(labelbottom=False)\nax_a.yaxis.grid(True, linestyle='--', alpha=0.35)\nax_a.legend(loc='upper right', frameon=True, fontsize=8.5)\n\nax_b.axhspan(-2.4, 2.4, color=PALETTE[0], alpha=0.11)\nax_b.axhline(0, color='#1E242B', linestyle='--', lw=0.95)\nr_cols = [PALETTE[1] if abs(r) > 2.4 else PALETTE[0] for r in res]\nax_b.vlines(x_obs, 0, res, color=r_cols, lw=1.9)\nax_b.scatter(x_obs, res, c=r_cols, s=22, zorder=3)\nax_b.set_ylim(-6.5, 6.5)\nax_b.set_ylabel('Residual $\\Delta$')\nax_b.set_xlabel('Cycle Number ($\\times 10^2$)')\n\nax_a.text(-0.12, 1.03, 'a', transform=ax_a.transAxes, fontsize=13, fontweight='bold')\nax_b.text(-0.12, 1.06, 'b', transform=ax_b.transAxes, fontsize=13, fontweight='bold')"},
}

def apply_rc(rc_preset, palette_colors):
    import matplotlib.pyplot as plt
    from cycler import cycler
    plt.rcdefaults()
    common = {
        'font.size': 10, 'axes.labelsize': 10.5,
        'axes.prop_cycle': cycler(color=palette_colors),
        'figure.facecolor': 'white', 'axes.facecolor': 'white',
        'savefig.bbox': 'tight', 'pdf.fonttype': 42,
    }
    if rc_preset == 'ieee-serif':
        common.update({'font.family': 'serif', 'font.serif': ['Times New Roman', 'STIXGeneral', 'DejaVu Serif'],
                       'mathtext.fontset': 'stix', 'axes.linewidth': 0.95,
                       'xtick.direction': 'in', 'ytick.direction': 'in', 'xtick.top': True, 'ytick.right': True})
    else:
        common.update({'font.family': 'sans-serif', 'font.sans-serif': ['Arial', 'Helvetica', 'DejaVu Sans'],
                       'axes.linewidth': 1.0, 'xtick.direction': 'out', 'ytick.direction': 'out'})
    plt.rcParams.update(common)

def render_one(style_id, palette_id, outdir, fmt):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import numpy as np
    st = STYLES[style_id]; pal = PALETTES[palette_id]
    apply_rc(st['rc_preset'], pal['colors'])
    exec(st['code'], {'plt': plt, 'np': np, 'PALETTE': pal['colors'], 'CMAP_SEQ': pal['seq'], 'CMAP_DIV': pal['div']})
    os.makedirs(outdir, exist_ok=True)
    out_path = os.path.join(outdir, f"{style_id}_{palette_id}.{fmt}")
    plt.savefig(out_path, dpi=300, bbox_inches='tight')
    plt.close('all')
    print(f"Saved: {out_path}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--list', action='store_true')
    parser.add_argument('--style', default='hybrid-dual-regime-bar')
    parser.add_argument('--palette', default='npg', choices=list(PALETTES.keys()))
    parser.add_argument('--outdir', default='./outputs')
    parser.add_argument('--format', default='png', choices=['png', 'pdf', 'svg'])
    args = parser.parse_args()
    if args.list:
        for sid, s in STYLES.items(): print(f"  {sid:26s} [{s['category']:12s}] {s['title']}")
        return
    for tid in (list(STYLES.keys()) if args.style == 'all' else [args.style]):
        render_one(tid, args.palette, args.outdir, args.format)

if __name__ == '__main__':
    main()
