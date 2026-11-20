// Scientific Data Plotting Style Catalog (24 Styles across 7 Categories) + Matplotlib Code Templates
(function () {
  'use strict';

  const CATEGORIES = [
    { id: 'all', name: '全部数据图', en: 'All Plots', icon: '◈' },
    { id: 'hybrid', name: '个体+均值混合图', en: 'Hybrid Line+Bar', icon: '◧' },
    { id: 'bar', name: '柱状与棒棒糖图', en: 'Bar & Lollipop', icon: '▊' },
    { id: 'scatter', name: '散点与回归图', en: 'Scatter & Joint', icon: '⁘' },
    { id: 'radar', name: '雷达与极坐标图', en: 'Radar & Polar', icon: '◎' },
    { id: 'line', name: '折线与时序图', en: 'Line & Series', icon: '📈' },
    { id: 'distribution', name: '分布与统计图', en: 'Distribution', icon: '◫' },
    { id: 'heatmap', name: '热力与等值面图', en: 'Heatmap & Field', icon: '▦' },
    { id: 'composite', name: '森林与复合子图', en: 'Forest & Multi-Panel', icon: '⊞' }
  ];

  const PRESET_USER_TAGS = [
    '⭐ 论文候选',
    '📊 主实验图',
    '🔬 消融对比',
    '📝 组会汇报',
    '🖨️ 双栏单图',
    '🎯 补充材料'
  ];

  const TAG_GROUPS = [
    {
      label: '期刊审美学派',
      tags: ['Nature/CNS风', 'IEEE/物理风', '医学/Lancet风', 'AI顶会风', '极简高墨水比']
    },
    {
      label: '坐标轴与视觉特征',
      tags: ['个体+均值混合', '空心符号', '去上右边框', '四框内刻度', '黑白打印友好', '误差棒', '原始样本点', '置信阴影带', '显著性标注', '局部放大', '分面小多图']
    },
    {
      label: '数据关系场景',
      tags: ['多组对比', '相关性拟合', '多维指标', '分布形态', '配对追踪', '构成比例', '消融与效应量']
    }
  ];

  const STYLES = [
    // ================= HYBRID (SUBJECT LINE + RIGHT MEAN SUMMARY BAR) =================
    {
      id: 'hybrid-dual-regime-bar',
      category: 'hybrid',
      title: '双工况跨被试实虚轨迹 + 右侧分层双簇均值柱图',
      enTitle: 'Dual-Regime Subject Curves with Stratified Mean Clusters',
      venueBadge: '多工况对照 / 疲劳与稳态交叉设计',
      rcPreset: 'nature-sans',
      summary: '在单一混合坐标系内同时容纳两套实验工况（实线稳态 NF vs 虚线疲劳 FT）与达标阈值线，右侧并列两组三柱汇总（Mean-NF 与 Mean-FT），兼具组内与跨工况星号检验。',
      tags: ['IEEE/物理风', '个体+均值混合', '空心符号', '去上右边框', '误差棒', '显著性标注', '配对追踪'],
      mplApis: ['dual-linestyle trajectories', 'stratified Mean clusters', 'ax.axvspan'],
      codeBody: `subjects = [f'S{i}' for i in range(1, 9)]
x_sub = np.arange(len(subjects))

methods = [
    ('Adaptive-Synergy', 'o',
     [0.055, 0.062, 0.078, 0.051, 0.064, 0.048, 0.059, 0.044],
     [0.098, 0.112, 0.125, 0.094, 0.106, 0.089, 0.104, 0.118]),
    ('Spectral-CNN', '^',
     [0.115, 0.128, 0.144, 0.109, 0.121, 0.102, 0.118, 0.132],
     [0.212, 0.236, 0.224, 0.188, 0.195, 0.218, 0.206, 0.248]),
    ('Static-MVC', 's',
     [0.168, 0.182, 0.195, 0.154, 0.148, 0.172, 0.164, 0.189],
     [0.315, 0.298, 0.334, 0.256, 0.242, 0.288, 0.274, 0.358]),
]

fig, ax = plt.subplots(figsize=(6.4, 4.3), dpi=300)
ax.axvspan(7.85, 11.9, color='#F8FAFC', zorder=0)
ax.axvline(7.85, color='#94A3B8', linestyle='--', lw=1.0)
ax.hlines(0.080, -0.4, 7.6, colors='#64748B', linestyles='--', lw=0.95)

bw = 0.42
for i, (name, mk, nf, ft) in enumerate(methods):
    col = PALETTE[i % len(PALETTE)]
    nf_arr, ft_arr = np.array(nf), np.array(ft)
    ax.plot(x_sub, nf_arr, '-', lw=2.0, color=col, marker=mk, ms=6, mfc='none', mec=col, mew=1.6, label=name)
    if i != 1:
        ax.plot(x_sub, ft_arr, '--', lw=1.45, color=col, alpha=0.65, marker=mk, ms=5, mfc='none', mec=col, mew=1.2)

    for center, arr, alpha in [(8.95, nf_arr, 0.78), (10.75, ft_arr, 0.94)]:
        cx = center + (i - 1) * (bw + 0.05)
        m, sd = arr.mean(), arr.std(ddof=1)
        ax.bar(cx, m, width=bw, color=col, alpha=alpha, zorder=3)
        _, caps, _ = ax.errorbar(cx, m, yerr=[[0], [sd]], fmt='none',
                                 ecolor='#111827', elinewidth=1.15, capsize=3, zorder=4)
        caps[0].set_visible(False)
        ax.plot(cx, 0.022, marker=mk, ms=4.5, mfc='none', mec='white', mew=1.25, zorder=5)

def bracket(x1, x2, y, stars, h=0.012):
    ax.plot([x1, x1, x2, x2], [y - h, y, y, y - h], color='#111827', lw=1.05)
    ax.text((x1 + x2) / 2, y + 0.004, stars, ha='center', va='bottom', fontsize=10.5, fontweight='bold')

bracket(8.95 - 0.47, 8.95 + 0.47, 0.225, '**')
bracket(10.75 - 0.47, 10.75 + 0.47, 0.365, '***')
bracket(8.95 - 0.47, 10.75 - 0.47, 0.420, '*')

ax.set_xticks(list(x_sub) + [8.95, 10.75], subjects + ['Mean-NF', 'Mean-FT'])
ax.set_xlim(-0.45, 11.9)
ax.set_ylim(0, 0.46)
ax.set_xlabel('Individual Subjects (S1-S8) & Stratified Regime Means')
ax.set_ylabel('Force Estimation Error (N*m)')
ax.yaxis.grid(True, linestyle='--', alpha=0.35)
ax.spines[['top', 'right']].set_visible(False)
ax.legend(ncol=3, loc='lower center', bbox_to_anchor=(0.45, 1.02), frameon=False, fontsize=8.8)`
    },

    // ================= BAR =================
    {
      id: 'bar-nature-jitter',
      category: 'bar',
      title: '均值柱状 + 原始样本抖动误差图',
      enTitle: 'Mean Bar with Jittered Samples & SEM',
      venueBadge: 'Nature / Cell 生物统计标配',
      rcPreset: 'nature-sans',
      summary: '小样本实验（n < 20）首选：去上右轴线，半透明均值柱叠加个体空心/描边散点与 SEM 误差棒，兼顾统计汇总与数据透明度。',
      tags: ['Nature/CNS风', '去上右边框', '误差棒', '原始样本点', '显著性标注', '多组对比'],
      mplApis: ['ax.bar', 'ax.errorbar', 'ax.scatter', 'ax.spines'],
      codeBody: `rng = np.random.default_rng(42)
labels = ['Vehicle', 'Low Dose', 'High Dose', 'Combo']
means_true = [2.4, 4.7, 6.9, 8.6]
sds_true = [0.55, 0.78, 0.85, 0.72]
data = [rng.normal(m, s, size=9) for m, s in zip(means_true, sds_true)]

fig, ax = plt.subplots(figsize=(5.2, 4.2), dpi=300)
x = np.arange(len(labels))

for i, samples in enumerate(data):
    m = np.mean(samples)
    sem = np.std(samples, ddof=1) / np.sqrt(len(samples))
    col = PALETTE[i % len(PALETTE)]
    ax.bar(x[i], m, width=0.58, color=col, alpha=0.74, edgecolor=col, linewidth=1.2, zorder=2)
    _, caps, _ = ax.errorbar(x[i], m, yerr=[[0], [sem]], fmt='none', ecolor='#182026',
                             capsize=4, capthick=1.2, elinewidth=1.2, zorder=4)
    caps[0].set_visible(False)  # 仅保留单上侧误差线与上帽
    jitter = rng.uniform(-0.14, 0.14, size=len(samples))
    ax.scatter(x[i] + jitter, samples, s=28, facecolor='white', edgecolor=col, linewidth=1.35, zorder=5)

# Significance bracket helper (asterisks only)
def add_bracket(ax, x1, x2, y, text, h=0.25):
    ax.plot([x1, x1, x2, x2], [y - h, y, y, y - h], lw=1.05, c='#182026')
    ax.text((x1 + x2) / 2, y + 0.08, text, ha='center', va='bottom', fontsize=10.5, fontweight='bold')

add_bracket(ax, 0, 2, 9.2, '**')
add_bracket(ax, 0, 3, 10.4, '***')

ax.set_xticks(x, labels)
ax.set_ylim(0, 11.5)
ax.set_ylabel('Relative mRNA Level (a.u.)')
ax.set_xlabel('Treatment Regimen')
ax.yaxis.grid(True, linestyle='--', alpha=0.35, zorder=0)
ax.spines[['top', 'right']].set_visible(False)`
    },

    {
      id: 'bar-ieee-hatch',
      category: 'bar',
      title: 'IEEE 四框内刻度纹理分组柱状图',
      enTitle: 'Framed Grouped Bar with Print-Safe Hatches',
      venueBadge: 'IEEE / 物理工科双栏规范',
      rcPreset: 'ieee-serif',
      summary: '四周闭合实线框 + 四向内刻度 + 衬线字体 + 斜纹/点阵/网格纹理填充，即使论文被黑白双栏打印也零信息损失。',
      tags: ['IEEE/物理风', '四框内刻度', '黑白打印友好', '误差棒', '多组对比'],
      mplApis: ['ax.bar(hatch=...)', 'tick_params(direction="in")', 'Times Serif'],
      codeBody: `suites = ['Workload-A', 'Workload-B', 'Workload-C', 'Workload-D']
methods = [
    ('Baseline', '//', [52, 48, 61, 55], [3.2, 2.8, 3.5, 3.0]),
    ('Heuristic', '..', [68, 64, 74, 71], [3.6, 3.1, 3.4, 3.3]),
    ('Proposed', 'xx', [86, 83, 92, 89], [2.9, 2.5, 2.7, 2.6]),
]

fig, ax = plt.subplots(figsize=(5.6, 4.0), dpi=300)
x = np.arange(len(suites))
width = 0.24

for i, (name, hatch, vals, errs) in enumerate(methods):
    pos = x + (i - 1) * (width + 0.02)
    ax.bar(
        pos, vals, width=width, label=name,
        color=PALETTE[i % len(PALETTE)], alpha=0.84,
        edgecolor='#111827', linewidth=0.95, hatch=hatch, zorder=3
    )
    _, caps, _ = ax.errorbar(pos, vals, yerr=[np.zeros_like(errs), errs], fmt='none',
                             ecolor='#111827', elinewidth=1.0, capsize=3, zorder=4)
    caps[0].set_visible(False)  # 单上侧误差线

ax.set_xticks(x, suites)
ax.set_ylim(0, 108)
ax.set_ylabel('Normalized Throughput (ops/s)')
ax.set_xlabel('Evaluation Benchmark Suite')
ax.yaxis.grid(True, linestyle=':', alpha=0.45, zorder=0)
ax.minorticks_on()
ax.tick_params(axis='x', which='minor', bottom=False, top=False)
ax.legend(ncol=3, loc='upper left', frameon=True, edgecolor='#111827', fancybox=False, fontsize=8.5)`
    },

    {
      id: 'bar-stacked-flow',
      category: 'bar',
      title: '100% 构成堆积柱状 + 组间迁移丝带图',
      enTitle: 'Stacked Composition Bar with Flow Ribbons',
      venueBadge: 'Microbiome / 生态组学经典',
      rcPreset: 'nature-sans',
      summary: '展示多个时间点或分组间物种/组分相对丰度之和为 100% 的结构演变，半透明三次贝塞尔丝带直观呈现比例消长。',
      tags: ['Nature/CNS风', '去上右边框', '构成比例', '多组对比'],
      mplApis: ['ax.bar(bottom=...)', 'matplotlib.path.Path', 'PathPatch'],
      codeBody: `from matplotlib.path import Path
import matplotlib.patches as patches

stages = ['Day 0', 'Day 3', 'Day 7', 'Day 14']
taxa = ['Bacteroidota', 'Firmicutes', 'Proteobacteria', 'Actinomycetota', 'Verrucomicrobia']
comp = np.array([
    [38, 30, 14, 11, 7],
    [29, 35, 18, 10, 8],
    [21, 41, 15, 13, 10],
    [16, 46, 11, 14, 13],
], dtype=float)

fig, ax = plt.subplots(figsize=(5.2, 5.6), dpi=300)
x = np.arange(len(stages))
bar_w = 0.48
bottoms = np.zeros(len(stages))

for k, taxon in enumerate(taxa):
    vals = comp[:, k]
    col = PALETTE[k % len(PALETTE)]
    ax.bar(x, vals, width=bar_w, bottom=bottoms, color=col, edgecolor='white', linewidth=1.0, label=taxon, zorder=3)
    # Smooth cubic Bezier ribbon between adjacent bars
    for g in range(len(stages) - 1):
        x0, x1 = x[g] + bar_w / 2, x[g + 1] - bar_w / 2
        xm = 0.5 * (x0 + x1)
        y0_lo, y0_hi = bottoms[g], bottoms[g] + vals[g]
        y1_lo, y1_hi = bottoms[g + 1], bottoms[g + 1] + vals[g + 1]
        verts = [
            (x0, y0_hi), (xm, y0_hi), (xm, y1_hi), (x1, y1_hi),
            (x1, y1_lo), (xm, y1_lo), (xm, y0_lo), (x0, y0_lo), (x0, y0_hi)
        ]
        codes = [
            Path.MOVETO, Path.CURVE4, Path.CURVE4, Path.CURVE4,
            Path.LINETO, Path.CURVE4, Path.CURVE4, Path.CURVE4, Path.CLOSEPOLY
        ]
        ax.add_patch(patches.PathPatch(Path(verts, codes), facecolor=col, alpha=0.20, edgecolor='none', zorder=2))
    bottoms += vals

ax.set_xticks(x, stages)
ax.set_ylim(0, 100)
ax.set_ylabel('Community Composition (%)')
ax.set_xlabel('Sampling Timepoint')
ax.spines[['top', 'right']].set_visible(False)
ax.legend(ncol=2, loc='lower center', bbox_to_anchor=(0.5, 1.02), frameon=False, fontsize=8.5)`
    },

    {
      id: 'bar-diverging-lollipop',
      category: 'bar',
      title: '双向正负偏差水平棒棒糖图',
      enTitle: 'Diverging Horizontal Lollipop Chart',
      venueBadge: '极简高数据墨水比',
      rcPreset: 'nature-sans',
      summary: '当条目较多（8–20 项）且包含正负双向变化率时，用细线杆 + 圆点 + 端点直接数值标注替代厚重水平条形图，版面清爽利落。',
      tags: ['极简高墨水比', '去上右边框', '消融与效应量', '多组对比'],
      mplApis: ['ax.hlines', 'ax.scatter', 'ax.axvline(0)', 'ax.text'],
      codeBody: `items = [
    ('NF-kB Inflammation', -35.7), ('HIF-1a Glycolysis', -28.9),
    ('De Novo Lipogenesis', -21.3), ('mTORC1 Activity', -14.6),
    ('Pentose Phosphate', -7.8), ('Mito. Biogenesis', 9.5),
    ('Autophagy Flux', 16.2), ('AMPK Signaling', 22.6),
    ('Fatty Acid Beta-Ox.', 29.1), ('Oxidative Phos.', 38.4),
]
names = [d[0] for d in items]
vals = np.array([d[1] for d in items])
y = np.arange(len(items))
colors = [PALETTE[0] if v >= 0 else PALETTE[3 % len(PALETTE)] for v in vals]

fig, ax = plt.subplots(figsize=(5.4, 6.0), dpi=300)
ax.axvline(0, color='#1E242B', linestyle='--', linewidth=1.1, zorder=2)
ax.hlines(y, 0, vals, color=colors, linewidth=2.3, zorder=3)
ax.scatter(vals, y, color=colors, s=55, edgecolor='white', linewidth=1.2, zorder=4)

for yi, v, col in zip(y, vals, colors):
    offset = 2.0 if v >= 0 else -2.0
    ha = 'left' if v >= 0 else 'right'
    ax.text(v + offset, yi, f'{v:+.1f}%', va='center', ha=ha, fontsize=8.5, fontweight='bold', color=col)

ax.set_yticks(y, names)
ax.set_xlim(-50, 54)
ax.set_xlabel('Standardized Effect Size Delta (%) vs. Control')
ax.xaxis.grid(True, linestyle='--', alpha=0.35, zorder=0)
ax.spines[['top', 'right', 'left']].set_visible(False)
ax.tick_params(axis='y', length=0)`
    },

    // ================= SCATTER =================
    {
      id: 'scatter-joint-marginal',
      category: 'scatter',
      title: '联合分布线性回归 + 边缘直方核密度图',
      enTitle: 'Joint OLS Fit with Marginal Histograms & KDE',
      venueBadge: '高信息密度相关性标配',
      rcPreset: 'ieee-serif',
      summary: '利用 GridSpec 将主散点回归置信带（95% CI）与顶/右侧单变量边缘分布无缝组合，一张图交代双变量关系与边缘偏态。',
      tags: ['Nature/CNS风', '四框内刻度', '置信阴影带', '相关性拟合', '分布形态'],
      mplApis: ['GridSpec', 'ax.scatter', 'ax.fill_between', 'ax.hist'],
      codeBody: `from matplotlib.gridspec import GridSpec

rng = np.random.default_rng(205)
fig = plt.figure(figsize=(5.6, 5.6), dpi=300)
gs = GridSpec(4, 4, figure=fig, hspace=0.12, wspace=0.12)
ax = fig.add_subplot(gs[1:, :3])
ax_top = fig.add_subplot(gs[0, :3], sharex=ax)
ax_right = fig.add_subplot(gs[1:, 3], sharey=ax)

specs = [
    ('WT-Catalyst', PALETTE[0], 'o', 4.1, 1.5, 0.88, 1.5),
    ('Doped-SingleAtom', PALETTE[1], 's', 6.3, 1.4, 1.02, 2.4),
]

x_grid = np.linspace(0.5, 9.5, 100)
for name, col, marker, mx, sx, slope, ic in specs:
    xs = np.clip(rng.normal(mx, sx, 38), 0.6, 9.4)
    ys = ic + slope * xs + rng.normal(0, 0.82, size=xs.size)
    ax.scatter(xs, ys, s=30, c=col, marker=marker, edgecolors='white', linewidths=0.6, alpha=0.88, label=name)

    # Analytical OLS & 95% confidence band
    b1, b0 = np.polyfit(xs, ys, 1)
    y_hat = b0 + b1 * x_grid
    se = np.sqrt(np.sum((ys - (b0 + b1 * xs)) ** 2) / (xs.size - 2))
    ci = 2.02 * se * np.sqrt(1 / xs.size + (x_grid - xs.mean()) ** 2 / np.sum((xs - xs.mean()) ** 2))
    ax.plot(x_grid, y_hat, color=col, lw=1.9)
    ax.fill_between(x_grid, y_hat - ci, y_hat + ci, color=col, alpha=0.18)

    ax_top.hist(xs, bins=12, density=True, color=col, alpha=0.35, edgecolor=col, lw=0.9)
    ax_right.hist(ys, bins=12, density=True, orientation='horizontal', color=col, alpha=0.35, edgecolor=col, lw=0.9)

ax_top.spines[['top', 'right', 'left']].set_visible(False)
ax_right.spines[['top', 'right', 'bottom']].set_visible(False)
ax_top.tick_params(labelbottom=False, left=False, labelleft=False)
ax_right.tick_params(labelleft=False, bottom=False, labelbottom=False)

ax.set_xlabel('Catalyst Loading x (wt%)')
ax.set_ylabel('Conversion Yield y (mmol/h)')
ax.grid(True, linestyle='--', alpha=0.3)
ax.legend(loc='upper left', frameon=True, fontsize=8.5)`
    },

    {
      id: 'scatter-volcano-quadrant',
      category: 'scatter',
      title: '多维阈值象限火山气泡散点图',
      enTitle: 'Quadrant Threshold Volcano Bubble Plot',
      venueBadge: '组学筛选 / 效应显著性分析',
      rcPreset: 'nature-sans',
      summary: '结合双向阈值虚线、背景淡色显著区、气泡大小映射第三维丰度，并用引线标注（ax.annotate）精准点名关键离群/显著特征。',
      tags: ['Nature/CNS风', '四框内刻度', '显著性标注', '多维指标', '相关性拟合'],
      mplApis: ['ax.scatter(s=...)', 'ax.axvline', 'ax.axhline', 'ax.annotate'],
      codeBody: `rng = np.random.default_rng(309)
fc = rng.normal(0, 1.55, 160)
neg_log_p = np.abs(fc) * 0.95 + np.abs(rng.normal(0.5, 1.15, 160))
sizes = rng.uniform(18, 95, 160)

up = (fc >= 1.0) & (neg_log_p >= 1.3)
down = (fc <= -1.0) & (neg_log_p >= 1.3)
ns = ~(up | down)

fig, ax = plt.subplots(figsize=(5.2, 5.2), dpi=300)
ax.scatter(fc[ns], neg_log_p[ns], s=sizes[ns], c='#CBD5E1', alpha=0.55, edgecolors='none', label='NS')
ax.scatter(fc[down], neg_log_p[down], s=sizes[down], c=PALETTE[1], alpha=0.82, edgecolors='white', lw=0.5, label='Down-regulated')
ax.scatter(fc[up], neg_log_p[up], s=sizes[up], c=PALETTE[0], alpha=0.82, edgecolors='white', lw=0.5, label='Up-regulated')

for xv in (-1.0, 1.0):
    ax.axvline(xv, color='#64748B', linestyle='--', lw=1.0)
ax.axhline(1.3, color='#64748B', linestyle='--', lw=1.0)

hits = [('SPP1', 3.15, 6.35), ('CXCL9', 2.45, 5.15), ('APOE', -2.95, 5.85), ('TREM2', -2.15, 4.45)]
for name, hx, hy in hits:
    col = PALETTE[0] if hx > 0 else PALETTE[1]
    ax.scatter([hx], [hy], s=85, c=col, edgecolors='#111827', lw=1.1, zorder=5)
    dx = 0.55 if hx > 0 else -0.55
    ax.annotate(name, xy=(hx, hy), xytext=(hx + dx, hy + 0.35),
                ha='left' if hx > 0 else 'right', fontsize=8.8, fontweight='bold',
                arrowprops=dict(arrowstyle='-', color='#1E242B', lw=0.85))

ax.set_xlim(-4.5, 4.5)
ax.set_ylim(0, 7.5)
ax.set_xlabel('log2(Fold Change)')
ax.set_ylabel('-log10(Adjusted P-value)')
ax.legend(loc='upper center', bbox_to_anchor=(0.5, 1.08), ncol=3, frameon=False, fontsize=8.5)`
    },

    {
      id: 'scatter-paired-slope',
      category: 'scatter',
      title: '配对前后个体响应斜率连线图',
      enTitle: 'Paired Pre-Post Slopegraph with Group SEM',
      venueBadge: 'NEJM / Lancet 临床与配对实验',
      rcPreset: 'nature-sans',
      summary: '针对同一批受试者/样本干预前后的配对观测，用细斜线保留个体异质性方向，并在外侧叠加菱形群体均值±95% CI 误差棒。',
      tags: ['医学/Lancet风', '去上右边框', '配对追踪', '原始样本点', '误差棒', '显著性标注'],
      mplApis: ['ax.plot (paired)', 'ax.errorbar', 'paired stats'],
      codeBody: `rng = np.random.default_rng(412)
n = 14
cohorts = [
    ('Placebo Arm', 0.35, 1.15, PALETTE[3 % len(PALETTE)], 44.0, 3.5, 'ns'),
    ('Intervention Arm', 2.05, 2.85, PALETTE[0], 43.0, 26.5, '***'),
]

fig, ax = plt.subplots(figsize=(5.0, 5.8), dpi=300)
ax.axvline(1.6, color='#E2E8F0', linestyle='--', lw=1.1)

for title, x1, x2, col, m0, delta, p_str in cohorts:
    pre = rng.normal(m0, 8.2, size=n)
    post = pre + rng.normal(delta, 5.6, size=n)
    j1 = rng.uniform(-0.03, 0.03, size=n)
    j2 = rng.uniform(-0.03, 0.03, size=n)
    for a, b, ja, jb in zip(pre, post, j1, j2):
        ax.plot([x1 + ja, x2 + jb], [a, b], color=col, alpha=0.32, lw=1.15)
    ax.scatter(x1 + j1, pre, s=28, facecolor='white', edgecolor=col, lw=1.3, zorder=3)
    ax.scatter(x2 + j2, post, s=28, facecolor=col, edgecolor='white', lw=0.8, zorder=3)

    # Group means + upper-only 95% CI
    ax.plot([x1, x2], [pre.mean(), post.mean()], color='#111827', lw=2.2, zorder=4)
    for xp, arr, shift in [(x1, pre, -0.15), (x2, post, 0.15)]:
        ci = 1.96 * arr.std(ddof=1) / np.sqrt(n)
        _, caps, _ = ax.errorbar(xp + shift, arr.mean(), yerr=[[0], [ci]], fmt='D', ms=5.5,
                                 mfc=col, mec='#111827', ecolor='#111827', elinewidth=1.4, capsize=3.5, zorder=5)
        caps[0].set_visible(False)
    ax.plot([x1, x1, x2, x2], [86.5, 88.0, 88.0, 86.5], color='#111827', lw=1.0)
    ax.text((x1 + x2) / 2, 88.8, p_str, ha='center', fontsize=9.8, fontweight='bold')

ax.set_xticks([0.35, 1.15, 2.05, 2.85], ['Baseline', 'Week 12', 'Baseline', 'Week 12'])
ax.set_ylim(15, 95)
ax.set_ylabel('Functional Recovery Score')
ax.yaxis.grid(True, linestyle='--', alpha=0.35)
ax.spines[['top', 'right']].set_visible(False)`
    },

    {
      id: 'scatter-kde-contour',
      category: 'scatter',
      title: '大样本二维核密度等高线散点场图',
      enTitle: '2D Density Contourf with Tail Scatter',
      venueBadge: '物理 / 天文 / 单细胞大样本风',
      rcPreset: 'ieee-serif',
      summary: '当样本量 N > 1000 时直接画散点会严重重叠糊成一团；底层采用二维等密度填充与等高线展示核心模态，外围保留稀疏离群点。',
      tags: ['IEEE/物理风', '四框内刻度', '分布形态', '相关性拟合'],
      mplApis: ['ax.contourf', 'ax.contour', 'plt.colorbar', 'ax.scatter'],
      codeBody: `rng = np.random.default_rng(523)
x1, y1 = rng.multivariate_normal([-0.75, -0.55], [[0.75, 0.25], [0.25, 0.70]], 1100).T
x2, y2 = rng.multivariate_normal([0.95, 0.85], [[0.56, 0.05], [0.05, 0.60]], 1300).T
xs, ys = np.concatenate([x1, x2]), np.concatenate([y1, y2])

# Smooth 2D histogram / Gaussian kernel evaluation on grid
Xg, Yg = np.meshgrid(np.linspace(-3, 3, 80), np.linspace(-3, 3, 80))
dx = Xg[..., None] - xs[None, None, :]
dy = Yg[..., None] - ys[None, None, :]
Z = np.exp(-0.5 * (dx ** 2 + dy ** 2) / (0.38 ** 2)).mean(axis=-1)
Z /= Z.max()

fig, ax = plt.subplots(figsize=(5.2, 4.6), dpi=300)
levels = [0.12, 0.26, 0.42, 0.60, 0.78, 1.0]
cf = ax.contourf(Xg, Yg, Z, levels=levels, cmap=CMAP_SEQ, alpha=0.88)
ax.contour(Xg, Yg, Z, levels=levels[:-1], colors='#1E242B', linewidths=0.85, alpha=0.65)
ax.scatter(xs[::12], ys[::12], s=6, c='#0F172A', alpha=0.32, linewidths=0)

cbar = fig.colorbar(cf, ax=ax, pad=0.03, fraction=0.046)
cbar.set_label('Normalized Density')
ax.set_xlim(-3, 3)
ax.set_ylim(-3, 3)
ax.set_xlabel('Latent Principal Mode $z_1$')
ax.set_ylabel('Latent Principal Mode $z_2$')
ax.minorticks_on()`
    },

    // ================= RADAR =================
    {
      id: 'radar-polygon-benchmark',
      category: 'radar',
      title: '多模型六维多边形层叠雷达图',
      enTitle: 'Multi-Model Polygon Benchmark Radar',
      venueBadge: 'AI 顶会综合指标对比',
      rcPreset: 'nature-sans',
      summary: '在 5–8 个归一化能力维度上直观对比主流基线与本文方法的综合包络面积，采用低透明度面填充 + 实心差异化顶点标记。',
      tags: ['AI顶会风', '多维指标', '多组对比'],
      mplApis: ['subplot_kw=dict(polar=True)', 'ax.plot', 'ax.fill'],
      codeBody: `metrics = ['Accuracy', 'Robustness', 'Throughput', 'Calibration', 'Data Eff.', 'Generalization']
models = [
    ('Proposed (Ours)', [93, 88, 84, 90, 86, 91], 'o'),
    ('ViT-Large', [85, 72, 64, 79, 71, 78], 's'),
    ('ConvNeXt-B', [79, 76, 89, 74, 68, 72], '^'),
]

angles = np.linspace(0, 2 * np.pi, len(metrics), endpoint=False).tolist()
angles += angles[:1]

fig, ax = plt.subplots(figsize=(5.2, 5.2), subplot_kw=dict(polar=True), dpi=300)
ax.set_theta_offset(np.pi / 2)
ax.set_theta_direction(-1)

for i, (name, vals, marker) in enumerate(models):
    closed = vals + vals[:1]
    col = PALETTE[i % len(PALETTE)]
    ax.plot(angles, closed, color=col, lw=2.0, marker=marker, ms=5, mec='white', mew=0.8, label=name)
    ax.fill(angles, closed, color=col, alpha=0.17)

ax.set_xticks(angles[:-1], metrics)
ax.set_ylim(0, 100)
ax.set_yticks([20, 40, 60, 80, 100])
ax.yaxis.grid(True, linestyle='--', color='#CBD5E1')
ax.xaxis.grid(True, color='#CBD5E1')
ax.spines['polar'].set_color('#94A3B8')
ax.legend(loc='upper center', bbox_to_anchor=(0.5, 1.14), ncol=3, frameon=False, fontsize=8.8)`
    },

    {
      id: 'radar-nightingale-rose',
      category: 'radar',
      title: '极坐标南丁格尔玫瑰扇区柱图',
      enTitle: 'Polar Nightingale Rose Bar Diagram',
      venueBadge: '环境科学 / 周期方位频谱',
      rcPreset: 'nature-sans',
      summary: '适合方位角（0°–360° 风向/晶体取向）或月度周期数据，等角度扇区半径与分层色阶直观传达主导方向与强度结构。',
      tags: ['Nature/CNS风', '构成比例', '多维指标'],
      mplApis: ['polar=True', 'ax.bar (polar)', 'theta_offset'],
      codeBody: `dirs = ['N', 'NNE', 'ENE', 'E', 'ESE', 'SSE', 'S', 'SSW', 'WSW', 'W', 'WNW', 'NNW']
total = np.array([78, 92, 84, 63, 48, 42, 55, 68, 88, 96, 74, 62], dtype=float)
base_tier = total * 0.56
peak_tier = total - base_tier

theta = np.linspace(0, 2 * np.pi, len(dirs), endpoint=False)
width = (2 * np.pi / len(dirs)) * 0.84

fig, ax = plt.subplots(figsize=(5.2, 5.2), subplot_kw=dict(polar=True), dpi=300)
ax.set_theta_offset(np.pi / 2)
ax.set_theta_direction(-1)

ax.bar(theta, base_tier, width=width, color=PALETTE[1], edgecolor='white', lw=1.1, label='Base Regime (<5 m/s)')
ax.bar(theta, peak_tier, width=width, bottom=base_tier, color=PALETTE[0], edgecolor='white', lw=1.1, label='Peak Gust (>=5 m/s)')

ax.set_xticks(theta, dirs)
ax.set_ylim(0, 105)
ax.set_yticks([25, 50, 75, 100])
ax.yaxis.grid(True, linestyle='--', alpha=0.55)
ax.spines['polar'].set_color('#94A3B8')
ax.legend(loc='lower center', bbox_to_anchor=(0.5, -0.13), ncol=2, frameon=False, fontsize=8.8)`
    },

    {
      id: 'radar-spider-minimal',
      category: 'radar',
      title: '无底色实虚线高对比学术蜘蛛图',
      enTitle: 'Unfilled Print-Safe Stroke Spider Plot',
      venueBadge: '黑白打印安全 / 严谨对比',
      rcPreset: 'ieee-serif',
      summary: '彻底取消半透明色块填充，避免多条模型曲线层叠后混色发脏；依靠实线/虚线/点划线 + 空心描边符号 + 关键顶点数值直标。',
      tags: ['IEEE/物理风', '黑白打印友好', '极简高墨水比', '多维指标', '多组对比'],
      mplApis: ['polar=True', 'linestyle', 'markerfacecolor="white"'],
      codeBody: `axes_names = ['Precision', 'Recall', 'F1-Macro', 'AUROC', 'Spec.', 'NPV', 'Latency^-1']
series = [
    ('Ensemble-Net', '-', 'o', [94, 89, 91, 96, 92, 88, 83]),
    ('ResNet-50', '--', 's', [82, 78, 80, 86, 84, 79, 91]),
    ('Linear-SVM', ':', 'D', [71, 66, 68, 74, 77, 70, 95]),
]

angles = np.linspace(0, 2 * np.pi, len(axes_names), endpoint=False).tolist()
angles += angles[:1]

fig, ax = plt.subplots(figsize=(5.2, 5.2), subplot_kw=dict(polar=True), dpi=300)
ax.set_theta_offset(np.pi / 2)
ax.set_theta_direction(-1)

for i, (name, ls, mk, vals) in enumerate(series):
    closed = vals + vals[:1]
    col = PALETTE[i % len(PALETTE)]
    ax.plot(angles, closed, linestyle=ls, lw=1.9, color=col,
            marker=mk, ms=5.5, mfc='white', mec=col, mew=1.6, label=name)

ax.set_xticks(angles[:-1], axes_names)
ax.set_ylim(0, 100)
ax.set_yticks([25, 50, 75, 100])
ax.spines['polar'].set_color('#475569')
ax.legend(loc='upper center', bbox_to_anchor=(0.5, 1.14), ncol=3, frameon=False, fontsize=8.8)`
    },

    // ================= LINE =================
    {
      id: 'line-ci-band',
      category: 'line',
      title: '多序列均值折线 + 标准差置信阴影带',
      enTitle: 'Multi-Curve Trajectory with Shaded SD Ribbon',
      venueBadge: 'NeurIPS / ICML / 动力学标配',
      rcPreset: 'nature-sans',
      summary: '展示多次随机种子或重复实验下的收敛/动力学均值曲线及 ±1 SD 半透明误差带（fill_between），比密集竖向误差棒更清爽。',
      tags: ['AI顶会风', '去上右边框', '置信阴影带', '多组对比'],
      mplApis: ['ax.plot', 'ax.fill_between(alpha=0.18)'],
      codeBody: `epochs = np.linspace(0, 100, 60)
configs = [
    ('Ours (Adaptive)', '-', lambda x: 93.5 - 48 * np.exp(-x / 18), 1.8),
    ('Cosine-Warmup', '-', lambda x: 87.2 - 44 * np.exp(-x / 23), 2.1),
    ('Step-Decay', '--', lambda x: 81.5 - 39 * np.exp(-x / 27) + np.where(x > 50, 2.4, 0), 2.3),
    ('SGD-Const', ':', lambda x: 74.0 - 31 * np.exp(-x / 24), 2.5),
]

fig, ax = plt.subplots(figsize=(5.6, 3.9), dpi=300)
for i, (name, ls, fn, sd) in enumerate(configs):
    col = PALETTE[i % len(PALETTE)]
    y = fn(epochs) + 0.4 * np.sin(epochs * 0.35)
    err = sd * (0.65 + 0.6 * np.exp(-epochs / 35))
    ax.plot(epochs, y, linestyle=ls, lw=2.0, color=col, label=name)
    ax.fill_between(epochs, y - err, y + err, color=col, alpha=0.17, linewidth=0)

ax.set_xlim(0, 100)
ax.set_ylim(40, 98)
ax.set_xlabel('Training Epochs')
ax.set_ylabel('Test Accuracy (%)')
ax.grid(True, linestyle='--', alpha=0.32)
ax.spines[['top', 'right']].set_visible(False)
ax.legend(ncol=4, loc='lower center', bbox_to_anchor=(0.5, 1.02), frameon=False, fontsize=8.2)`
    },

    {
      id: 'line-inset-zoom',
      category: 'line',
      title: '四框内刻度光谱曲线 + 局部放大子图',
      enTitle: 'Framed Spectroscopy Line with Inset Zoom',
      venueBadge: 'Physical Review / 化学光谱风',
      rcPreset: 'ieee-serif',
      summary: '兼顾全局宽量程演化与局部精细峰位分裂/拐点对比，利用 inset_axes 与 indicate_inset_zoom 在图内原位放大关键细节。',
      tags: ['IEEE/物理风', '四框内刻度', '局部放大', '多组对比'],
      mplApis: ['ax.inset_axes', 'ax.indicate_inset_zoom', 'minorticks_on'],
      codeBody: `wl = np.linspace(300, 800, 500)
def spectrum(x, shift, split, amp):
    p1 = amp * np.exp(-((x - (478 + shift)) / 14) ** 2)
    p2 = amp * 0.82 * np.exp(-((x - (502 + shift + split)) / 12) ** 2)
    return 0.04 + 0.08 * np.exp(-(x - 300) / 140) + p1 + p2 + 0.24 * np.exp(-((x - 610) / 48) ** 2)

curves = [
    ('300 K (Pristine)', spectrum(wl, 0, 0, 0.96)),
    ('200 K (Annealed)', spectrum(wl, -3, 4, 0.78)),
    ('80 K (Cryo)', spectrum(wl, -6, 8, 0.62)),
]

fig, ax = plt.subplots(figsize=(5.6, 4.4), dpi=300)
axins = ax.inset_axes([0.53, 0.50, 0.43, 0.43])

for i, (label, y) in enumerate(curves):
    col = PALETTE[i % len(PALETTE)]
    ax.plot(wl, y, lw=1.7, color=col, label=label)
    axins.plot(wl, y, lw=1.6, color=col)

axins.set_xlim(455, 530)
axins.set_ylim(0.42, 1.06)
axins.tick_params(direction='in', top=True, right=True, labelsize=7.5)
ax.indicate_inset_zoom(axins, edgecolor='#475569', linestyle='--')

ax.set_xlim(300, 800)
ax.set_ylim(0, 1.15)
ax.set_xlabel('Wavelength $\\lambda$ (nm)')
ax.set_ylabel('Normalized Absorbance (a.u.)')
ax.minorticks_on()
ax.legend(loc='lower right', frameon=False, fontsize=8.8)`
    },

    {
      id: 'line-small-multiples',
      category: 'line',
      title: '分面小多图 + 全局灰色背景参照曲线',
      enTitle: 'Small Multiples with Context Ghost Lines',
      venueBadge: 'Nature Climate / 多实验面板风',
      rcPreset: 'nature-sans',
      summary: '当 4–9 条实验曲线在同一张图交叉缠绕时，拆分为共享坐标小多图；每格用浅灰保留全部曲线做参照，单色高亮当前子图主角。',
      tags: ['Nature/CNS风', '去上右边框', '极简高墨水比', '分面小多图', '多组对比'],
      mplApis: ['plt.subplots(2, 2, sharex=True, sharey=True)', 'context lines'],
      codeBody: `t = np.linspace(0, 24, 60)
series = [
    ('a  Catalyst Ni-CeO2', 18 + 72 * (1 - np.exp(-t / 4.5)) - 0.3 * t),
    ('b  Catalyst Co-ZrO2', 15 + 62 * (1 - np.exp(-t / 6.8))),
    ('c  Catalyst Cu-ZnO', 16 + 68 * (1 - np.exp(-t / 3.8)) - 1.35 * np.maximum(0, t - 8)),
    ('d  Catalyst Ru-Al2O3', 12 + 79 / (1 + np.exp(-(t - 8.5) / 2.4))),
]

fig, axes = plt.subplots(2, 2, figsize=(5.6, 5.4), sharex=True, sharey=True, dpi=300)
for idx, (ax, (title, y_cur)) in enumerate(zip(axes.flat, series)):
    for j, (_, y_bg) in enumerate(series):
        if j != idx:
            ax.plot(t, y_bg, color='#CBD5E1', lw=1.2, zorder=1)
    col = PALETTE[idx % len(PALETTE)]
    ax.plot(t, y_cur, color=col, lw=2.3, zorder=3)
    ax.fill_between(t, 0, y_cur, color=col, alpha=0.10, zorder=2)
    ax.scatter([t[-1]], [y_cur[-1]], color=col, s=30, zorder=4)
    ax.set_title(title, loc='left', fontsize=9.8, fontweight='bold')
    ax.set_ylim(0, 100)
    ax.set_xlim(0, 24)
    ax.yaxis.grid(True, linestyle='--', alpha=0.35)
    ax.spines[['top', 'right']].set_visible(False)

fig.supxlabel('Time-on-Stream Duration (hours)', fontsize=10)
fig.supylabel('CH4 Conversion (%)', fontsize=10)
fig.tight_layout()`
    },

    {
      id: 'line-dual-phase',
      category: 'line',
      title: '实验阶段阴影分区 + 误差采样时序图',
      enTitle: 'Regime-Annotated Time Series with Errorbars',
      venueBadge: '生理监测 / 地球化学干预过程',
      rcPreset: 'ieee-serif',
      summary: '利用 axvspan 垂直背景色块清晰划分“基线—扰动—恢复”实验阶段，搭配采样时刻离散误差棒展示干预动力学响应。',
      tags: ['医学/Lancet风', '四框内刻度', '误差棒', '配对追踪'],
      mplApis: ['ax.axvspan', 'ax.axvline', 'ax.errorbar'],
      codeBody: `ts = np.array([3, 9, 15, 21, 27, 33, 39, 45, 51, 57])
wt = np.array([1.00, 1.02, 0.99, 1.62, 2.15, 2.28, 1.54, 1.22, 1.08, 1.04])
ko = np.array([1.00, 0.98, 1.01, 1.18, 1.32, 1.29, 1.12, 1.04, 1.01, 0.99])

fig, ax = plt.subplots(figsize=(5.8, 3.9), dpi=300)
ax.axvspan(18, 38, color=PALETTE[0], alpha=0.08, zorder=0)
for xv in (18, 38):
    ax.axvline(xv, color='#475569', linestyle='--', lw=1.0)

_, caps_wt, _ = ax.errorbar(ts, wt, yerr=[np.zeros_like(wt), np.full_like(wt, 0.11)], fmt='-o',
                            lw=1.9, ms=5, color=PALETTE[0], mec='white', mew=0.8, capsize=3, label='Wild-Type')
caps_wt[0].set_visible(False)
_, caps_ko, _ = ax.errorbar(ts, ko, yerr=[np.zeros_like(ko), np.full_like(ko, 0.08)], fmt='-s',
                            lw=1.9, ms=5, color=PALETTE[1], mec='white', mew=0.8, capsize=3, label='Knockout (KO)')
caps_ko[0].set_visible(False)

for xm, label in [(9, 'I. Baseline'), (28, 'II. Hypoxic Stress'), (49, 'III. Reperfusion')]:
    ax.text(xm, 2.66, label, ha='center', va='bottom', fontsize=9, fontweight='bold')

ax.set_xlim(0, 60)
ax.set_ylim(0.4, 2.6)
ax.set_xlabel('Elapsed Time (min)')
ax.set_ylabel('Normalized Flux $J / J_0$')
ax.yaxis.grid(True, linestyle='--', alpha=0.35)
ax.legend(loc='upper right', frameon=True, fontsize=8.8)`
    },

    // ================= DISTRIBUTION =================
    {
      id: 'dist-raincloud',
      category: 'distribution',
      title: '云雨图：半小提琴核密度 + 窄箱线 + 散点',
      enTitle: 'Raincloud Plot (Half-Violin + Box + Jitter)',
      venueBadge: 'Nature Methods 现代统计强烈推荐',
      rcPreset: 'nature-sans',
      summary: '三位一体同时呈现概率密度双峰/偏态（云）、四分位中位数（箱）与真实样本散点（雨），彻底杜绝传统箱线图隐藏双峰分布的缺陷。',
      tags: ['Nature/CNS风', '去上右边框', '原始样本点', '分布形态', '多组对比'],
      mplApis: ['ax.violinplot (half-clipped)', 'ax.boxplot', 'ax.scatter'],
      codeBody: `rng = np.random.default_rng(618)
groups = ['Control', 'Peptide-A', 'Peptide-B', 'Synergy']
samples = [
    rng.normal(4.2, 0.85, 32),
    rng.normal(5.8, 1.05, 32),
    rng.normal(7.3, 0.78, 32),
    rng.normal(8.6, 0.92, 32),
]

fig, ax = plt.subplots(figsize=(5.6, 4.6), dpi=300)
y_pos = np.arange(len(groups))

parts = ax.violinplot(samples, positions=y_pos + 0.08, vert=False, widths=0.72,
                      showmeans=False, showextrema=False)
for i, body in enumerate(parts['bodies']):
    # Clip lower half of horizontal violin to keep upper "cloud"
    m = np.mean(body.get_paths()[0].vertices[:, 1])
    body.get_paths()[0].vertices[:, 1] = np.clip(body.get_paths()[0].vertices[:, 1], y_pos[i] + 0.08, np.inf)
    col = PALETTE[i % len(PALETTE)]
    body.set_facecolor(col)
    body.set_edgecolor(col)
    body.set_alpha(0.62)

ax.boxplot(samples, positions=y_pos - 0.02, vert=False, widths=0.13, showfliers=False,
           patch_artist=True, boxprops=dict(facecolor='white', edgecolor='#1E242B', lw=1.1),
           medianprops=dict(color='#111827', lw=2.0), whiskerprops=dict(color='#1E242B', lw=1.1))

for i, arr in enumerate(samples):
    jitter = rng.uniform(-0.28, -0.13, size=arr.size)
    ax.scatter(arr, y_pos[i] + jitter, s=18, color=PALETTE[i % len(PALETTE)], alpha=0.78, edgecolors='white', lw=0.4)

ax.set_yticks(y_pos, groups)
ax.set_xlabel('Binding Affinity Score (-log Kd)')
ax.xaxis.grid(True, linestyle='--', alpha=0.35)
ax.spines[['top', 'right']].set_visible(False)`
    },

    {
      id: 'dist-box-signif',
      category: 'distribution',
      title: '显著性阶梯括号科研分组箱线图',
      enTitle: 'Framed Statistical Boxplot with P-Brackets',
      venueBadge: '生物医药 / 材料力学经典',
      rcPreset: 'ieee-serif',
      summary: '浅色填充深色描边箱体搭配原始抖动观测点，顶部通过阶梯式显著性横括号（**, ***, ns）清晰呈现多组两两假设检验结论。',
      tags: ['Nature/CNS风', '四框内刻度', '显著性标注', '原始样本点', '分布形态', '多组对比'],
      mplApis: ['ax.boxplot(patch_artist=True)', 'ax.scatter', 'significance brackets'],
      codeBody: `rng = np.random.default_rng(704)
labels = ['Mock', 'siRNA-1', 'siRNA-2', 'CRISPRi', 'Rescue']
means = [76, 54, 46, 31, 73]
data = [rng.normal(m, 8.2, size=24) for m in means]

fig, ax = plt.subplots(figsize=(5.2, 5.2), dpi=300)
bp = ax.boxplot(data, widths=0.52, patch_artist=True, showfliers=False,
                medianprops=dict(color='#111827', lw=2.0),
                whiskerprops=dict(linestyle='--', lw=1.1, color='#1E242B'))

for i, (patch, arr) in enumerate(zip(bp['boxes'], data)):
    col = PALETTE[i % len(PALETTE)]
    patch.set_facecolor(col)
    patch.set_alpha(0.35)
    patch.set_edgecolor(col)
    patch.set_linewidth(1.5)
    jx = (i + 1) + rng.uniform(-0.12, 0.12, size=arr.size)
    ax.scatter(jx, arr, s=18, color=col, alpha=0.75, zorder=3)

def bracket(x1, x2, y, label):
    ax.plot([x1, x1, x2, x2], [y - 1.5, y, y, y - 1.5], color='#1E242B', lw=1.05)
    ax.text((x1 + x2) / 2, y + 0.8, label, ha='center', fontsize=8.8, fontweight='bold')

bracket(1, 2, 92, '**')
bracket(1, 4, 99, '***')
bracket(1, 5, 106, 'ns')

ax.set_xticklabels(labels)
ax.set_ylim(10, 113)
ax.set_ylabel('Elastic Modulus E (kPa)')
ax.set_xlabel('Genetic Perturbation')
ax.yaxis.grid(True, linestyle='--', alpha=0.35)`
    },

    {
      id: 'dist-ridgeline',
      category: 'distribution',
      title: '山脊核密度层叠演化分布图',
      enTitle: 'Stacked Ridgeline KDE Evolution Plot',
      venueBadge: 'Science / 连续参数分布演化',
      rcPreset: 'nature-sans',
      summary: '沿温度、深度或演化代数纵向错位层叠连续核密度曲线，利用白色轮廓光晕制造空间前后遮挡感，一眼看清峰值漂移与分叉。',
      tags: ['Nature/CNS风', '极简高墨水比', '分布形态', '多组对比'],
      mplApis: ['ax.fill_between (zorder)', 'white halo stroke', 'cmap gradient'],
      codeBody: `temps = ['300 K', '350 K', '400 K', '450 K', '500 K', '550 K']
x = np.linspace(-2, 10, 300)
cmap = plt.get_cmap(CMAP_SEQ)

fig, ax = plt.subplots(figsize=(5.0, 5.8), dpi=300)
for idx, label in enumerate(temps):
    row = len(temps) - 1 - idx
    base = row * 1.0
    mu1, mu2 = 1.1 + idx * 1.05, 3.2 + idx * 0.85
    w2 = 0.22 + idx * 0.09
    dens = ((1 - w2) * np.exp(-0.5 * ((x - mu1) / 0.82) ** 2) +
            w2 * np.exp(-0.5 * ((x - mu2) / 0.68) ** 2)) * 1.38

    col = cmap(0.25 + 0.68 * idx / (len(temps) - 1))
    z = idx * 3 + 2
    ax.axhline(base, color='#CBD5E1', lw=0.8, zorder=1)
    ax.fill_between(x, base, base + dens, color=col, alpha=0.85, zorder=z)
    ax.plot(x, base + dens, color='white', lw=2.4, zorder=z + 1)
    ax.plot(x, base + dens, color='#182026', lw=1.1, zorder=z + 2)

ax.set_yticks(np.arange(len(temps)), temps[::-1])
ax.set_xlim(-2, 10)
ax.set_xlabel('Activation Energy Barrier $\\Delta E$ (eV)')
ax.spines[['top', 'right', 'left']].set_visible(False)
ax.tick_params(axis='y', length=0)
ax.xaxis.grid(True, linestyle='--', alpha=0.35)`
    },

    {
      id: 'dist-ecdf-step',
      category: 'distribution',
      title: '经验累积分布阶梯图 (ECDF) + KS 检验',
      enTitle: 'Empirical CDF Step Plot with KS Distance',
      venueBadge: '系统工程 / 基因组距离无参对比',
      rcPreset: 'ieee-serif',
      summary: '无需人为设定直方图分箱宽度或 KDE 带宽，100% 忠实呈现全部分位点（P50/P95/长尾）及两组间最大 Kolmogorov-Smirnov 统计距离。',
      tags: ['IEEE/物理风', '四框内刻度', '黑白打印友好', '显著性标注', '分布形态'],
      mplApis: ['ax.step(where="post")', 'P50 / P95 reference', 'KS arrow'],
      codeBody: `rng = np.random.default_rng(815)
systems = [
    ('Zero-Copy Kernel', '-', 28, 9.5),
    ('Async-Batch', '--', 49, 14.5),
    ('TCP-Baseline', ':', 68, 18.0),
]

fig, ax = plt.subplots(figsize=(5.4, 4.2), dpi=300)
for i, (name, ls, mu, sd) in enumerate(systems):
    arr = np.sort(np.clip(rng.normal(mu, sd, 60), 2, 118))
    y = np.arange(1, arr.size + 1) / arr.size
    ax.step(np.r_[0, arr, 120], np.r_[0, y, 1.0], where='post',
            linestyle=ls, lw=2.0, color=PALETTE[i % len(PALETTE)], label=name)

for q in (0.50, 0.95):
    ax.axhline(q, color='#94A3B8', linestyle='--', lw=0.9)

ax.set_xlim(0, 120)
ax.set_ylim(0, 1.04)
ax.set_xlabel('Tail Response Latency (ms)')
ax.set_ylabel('Empirical CDF $F(x)$')
ax.grid(True, linestyle='--', alpha=0.32)
ax.legend(loc='lower right', frameon=True, fontsize=8.8)`
    },

    // ================= HEATMAP =================
    {
      id: 'matrix-corr-tri',
      category: 'heatmap',
      title: '下三角显著性星号相关性热力矩阵',
      enTitle: 'Lower-Triangle Annotated Correlation Matrix',
      venueBadge: '多变量耦合分析清爽标配',
      rcPreset: 'nature-sans',
      summary: '利用布尔遮罩裁除冗余的上三角镜像单元格，粗白边切分色块，根据背景明度自适应黑白字体标注相关系数 r 与显著性星号。',
      tags: ['Nature/CNS风', '极简高墨水比', '显著性标注', '相关性拟合', '多维指标'],
      mplApis: ['np.triu mask', 'ax.imshow / pcolormesh', 'adaptive text'],
      codeBody: `vars_name = ['TOC', 'TN', 'pH', 'Moisture', 'Enzyme-A', 'Microb-C', 'CO2-Flux']
corr = np.array([
    [ 1.00,  0.84, -0.46,  0.62,  0.76,  0.81,  0.72],
    [ 0.84,  1.00, -0.38,  0.55,  0.71,  0.78,  0.66],
    [-0.46, -0.38,  1.00, -0.29, -0.58, -0.52, -0.64],
    [ 0.62,  0.55, -0.29,  1.00,  0.49,  0.57,  0.61],
    [ 0.76,  0.71, -0.58,  0.49,  1.00,  0.83,  0.79],
    [ 0.81,  0.78, -0.52,  0.57,  0.83,  1.00,  0.88],
    [ 0.72,  0.66, -0.64,  0.61,  0.79,  0.88,  1.00],
])
mask = np.triu(np.ones_like(corr, dtype=bool), k=1)
masked = np.ma.masked_where(mask, corr)

fig, ax = plt.subplots(figsize=(5.4, 5.0), dpi=300)
im = ax.imshow(masked, cmap=CMAP_DIV, vmin=-1, vmax=1)

n = len(vars_name)
ax.set_xticks(np.arange(n), vars_name, rotation=35, ha='right')
ax.set_yticks(np.arange(n), vars_name)
ax.set_xticks(np.arange(-0.5, n, 1), minor=True)
ax.set_yticks(np.arange(-0.5, n, 1), minor=True)
ax.grid(which='minor', color='white', linestyle='-', linewidth=2.2)
ax.tick_params(which='minor', bottom=False, left=False)
ax.spines[:].set_visible(False)

for r in range(n):
    for c in range(r + 1):
        val = corr[r, c]
        stars = '' if r == c else ('**' if abs(val) >= 0.75 else ('*' if abs(val) >= 0.5 else ''))
        txt_col = 'white' if abs(val) > 0.58 else '#182026'
        ax.text(c, r, f'{val:.2f}{stars}', ha='center', va='center', fontsize=8, color=txt_col)

cbar = fig.colorbar(im, ax=ax, shrink=0.78, pad=0.03)
cbar.set_label('Pearson r')`
    },

    {
      id: 'matrix-clustered-zscore',
      category: 'heatmap',
      title: '带样本分组色条的标准化表达热力图',
      enTitle: 'Z-Score Expression Heatmap with Group Strip',
      venueBadge: 'Cell / 生信转录组与特征矩阵',
      rcPreset: 'nature-sans',
      summary: '顶部嵌入样本分组注释色带（Control / Acute / Chronic），主体以零中心发散色阶展示行标准化 Z-score 模块化高表达/抑制模式。',
      tags: ['Nature/CNS风', '多维指标', '多组对比', '构成比例'],
      mplApis: ['GridSpec (strip + heatmap)', 'ax.imshow(vmin=-2, vmax=2)'],
      codeBody: `from matplotlib.gridspec import GridSpec

rng = np.random.default_rng(908)
genes = ['STAT1', 'IRF7', 'ISG15', 'CXCL10', 'IFIT3', 'MX1', 'OAS2',
         'MKI67', 'TOP2A', 'CDK1', 'PCNA', 'COL1A1', 'FN1', 'ACTA2']
samples = [f'S{i+1}' for i in range(12)]
Z = rng.normal(0, 0.35, size=(len(genes), 12))
Z[:7, 4:8] += 1.45; Z[:7, :4] -= 1.15
Z[7:11, 8:] += 1.35; Z[7:11, :4] -= 0.85
Z[11:, :4] += 1.25; Z[11:, 4:] -= 0.95

fig = plt.figure(figsize=(5.2, 6.2), dpi=300)
gs = GridSpec(2, 2, height_ratios=[0.35, 12], width_ratios=[12, 0.55], hspace=0.05, wspace=0.18)
ax_bar = fig.add_subplot(gs[0, 0])
ax = fig.add_subplot(gs[1, 0])
cax = fig.add_subplot(gs[1, 1])

# Top sample condition strip
group_cols = [PALETTE[2]] * 4 + [PALETTE[0]] * 4 + [PALETTE[1]] * 4
for idx, col in enumerate(group_cols):
    ax_bar.add_patch(plt.Rectangle((idx - 0.5, 0), 1, 1, color=col, ec='white', lw=0.8))
ax_bar.set_xlim(-0.5, 11.5)
ax_bar.axis('off')

im = ax.imshow(Z, aspect='auto', cmap=CMAP_DIV, vmin=-2.2, vmax=2.2)
ax.set_xticks(np.arange(12), samples, fontsize=8)
ax.set_yticks(np.arange(len(genes)), genes, fontstyle='italic', fontsize=8.5)
ax.yaxis.tick_right()
fig.colorbar(im, cax=cax, label='Row Z-score')`
    },

    {
      id: 'matrix-contour-field',
      category: 'heatmap',
      title: '二维连续响应面填充 + 内嵌数值等高线图',
      enTitle: '2D Response Surface Contourf with clabel',
      venueBadge: '化工催化 / 气象流体 / 超参数曲面',
      rcPreset: 'ieee-serif',
      summary: '结合离散色阶 contourf 与带嵌入式数值标签（ax.clabel）的细等值线，既具连续场直观色彩，又能精确读取任意点的等值线阈值与最优点。',
      tags: ['IEEE/物理风', '四框内刻度', '多维指标', '相关性拟合'],
      mplApis: ['ax.contourf', 'ax.contour', 'ax.clabel', 'optimum marker'],
      codeBody: `T = np.linspace(150, 350, 120)
P = np.linspace(1.0, 5.0, 120)
Tg, Pg = np.meshgrid(T, P)
u, v = (Tg - 275) / 58.0, (Pg - 3.45) / 1.15
Z = 0.94 * np.exp(-0.5 * (u**2 + v**2 - 0.5 * u * v)) + 0.34 * np.exp(-0.5 * (((Tg - 195)/48)**2 + ((Pg - 2.1)/1.1)**2))

fig, ax = plt.subplots(figsize=(5.6, 4.4), dpi=300)
cf = ax.contourf(Tg, Pg, Z, levels=np.linspace(0, 1.0, 11), cmap=CMAP_SEQ)
cs = ax.contour(Tg, Pg, Z, levels=[0.2, 0.4, 0.6, 0.8], colors='#1E242B', linewidths=0.9)
ax.clabel(cs, inline=True, fmt='%.2f', fontsize=8)

ax.scatter([275], [3.45], marker='D', s=48, c=PALETTE[0], edgecolors='white', lw=1.2, zorder=5)
ax.text(281, 3.45, 'Optimum (94%)', color='white', fontsize=8.5, fontweight='bold', va='center')

cbar = fig.colorbar(cf, ax=ax, pad=0.03)
cbar.set_label('Target Selectivity')
ax.set_xlabel('Reaction Temperature $T$ (°C)')
ax.set_ylabel('Reactor Pressure $P$ (MPa)')
ax.minorticks_on()`
    },

    // ================= COMPOSITE =================
    {
      id: 'comp-forest-plot',
      category: 'composite',
      title: '亚组效应量/消融实验森林图 (Forest Plot)',
      enTitle: 'Subgroup Effect & 95% CI Forest Plot',
      venueBadge: 'Lancet / BMJ 荟萃与消融分析',
      rcPreset: 'nature-sans',
      summary: '左侧精确对齐亚组名称与 HR (95% CI) 数值文本列，右侧绘制无效应基准虚线、权重方块、置信区间横须与底部汇总菱形。',
      tags: ['医学/Lancet风', '极简高墨水比', '误差棒', '消融与效应量', '多组对比'],
      mplApis: ['ax.errorbar', 'ax.fill (summary diamond)', 'table-aligned text'],
      codeBody: `subgroups = [
    ('Age < 65 yr', 0.68, 0.52, 0.89),
    ('Age >= 65 yr', 0.74, 0.58, 0.94),
    ('Female Cohort', 0.64, 0.47, 0.86),
    ('Male Cohort', 0.77, 0.61, 0.98),
    ('Stage II Disease', 0.59, 0.41, 0.84),
    ('Stage III Disease', 0.72, 0.56, 0.92),
    ('Biomarker High', 0.51, 0.36, 0.71),
    ('Biomarker Low', 0.94, 0.71, 1.24),
]

fig, ax = plt.subplots(figsize=(6.0, 5.8), dpi=300)
n = len(subgroups)
for idx, (name, hr, lo, hi) in enumerate(subgroups):
    yi = n - idx
    if idx % 2 == 0:
        ax.axhspan(yi - 0.45, yi + 0.45, color='#F8FAFC', zorder=0)
    col = PALETTE[0] if hi < 1.0 else PALETTE[3 % len(PALETTE)]
    ax.errorbar(hr, yi, xerr=[[hr - lo], [hi - hr]], fmt='s', ms=6,
                color=col, ecolor=col, elinewidth=1.5, capsize=3, zorder=3)
    ax.text(-0.55, yi, name, va='center', ha='left', fontsize=9)
    ax.text(0.02, yi, f'{hr:.2f} ({lo:.2f}-{hi:.2f})', va='center', ha='left', fontsize=8.5, family='monospace')

# Pooled summary diamond at y = 0
ax.fill([0.61, 0.69, 0.78, 0.69], [0, 0.28, 0, -0.28], color=PALETTE[1], edgecolor='#111827', lw=1.0, zorder=4)
ax.text(-0.55, 0, 'Overall Pooled', va='center', fontweight='bold', fontsize=9.2)
ax.text(0.02, 0, '0.69 (0.61-0.78)', va='center', fontweight='bold', fontsize=8.5, family='monospace')
ax.axvline(1.0, color='#1E242B', linestyle='--', lw=1.05)

ax.set_xlim(-0.6, 1.55)
ax.set_xticks([0.4, 0.7, 1.0, 1.3])
ax.set_yticks([])
ax.set_xlabel('Hazard Ratio (95% CI)')
ax.spines[['top', 'right', 'left']].set_visible(False)`
    },

    {
      id: 'comp-panel-ab',
      category: 'composite',
      title: '双子图复合排版：主拟合曲线 (a) + 残差棒图 (b)',
      enTitle: 'Shared-X Composite: Model Fit (a) & Residuals (b)',
      venueBadge: 'Nature Energy / 物理模型验证规范',
      rcPreset: 'ieee-serif',
      summary: '使用不等高 GridSpec(height_ratios=[3, 1.1]) 共享横坐标：上图展示理论模型与实验点吻合度，下图放大零基准线附近的拟合残差随机性。',
      tags: ['IEEE/物理风', '四框内刻度', '误差棒', '相关性拟合', '分面小多图'],
      mplApis: ['GridSpec(height_ratios=[3, 1.1])', 'sharex', 'panel labels a, b'],
      codeBody: `from matplotlib.gridspec import GridSpec

rng = np.random.default_rng(991)
x_fine = np.linspace(0, 10, 200)
model_fn = lambda x: 98 * np.exp(-0.048 * x) + 4.5 * np.exp(-0.65 * x)

x_obs = np.linspace(0, 10, 19)
res = rng.normal(0, 1.85, size=x_obs.size)
y_obs = model_fn(x_obs) + res

fig = plt.figure(figsize=(5.4, 5.8), dpi=300)
gs = GridSpec(2, 1, height_ratios=[3.0, 1.15], hspace=0.08)
ax_a = fig.add_subplot(gs[0])
ax_b = fig.add_subplot(gs[1], sharex=ax_a)

ax_a.plot(x_fine, model_fn(x_fine), color=PALETTE[0], lw=2.0, label='Kinetic Decay Model')
ax_a.plot(x_fine, 101 - 5.1 * x_fine, color=PALETTE[1], lw=1.5, ls='--', label='Linear Drift Fit')
_, caps_a, _ = ax_a.errorbar(x_obs, y_obs, yerr=[np.zeros_like(y_obs), np.full_like(y_obs, 2.6)],
                             fmt='o', ms=5, mfc='white', mec=PALETTE[0], mew=1.4,
                             ecolor='#1E242B', elinewidth=1.0, capsize=2.5, label='Exp. Data (+1 SD)')
caps_a[0].set_visible(False)
ax_a.set_ylabel('Specific Capacity (mAh $g^{-1}$)')
ax_a.tick_params(labelbottom=False)
ax_a.yaxis.grid(True, linestyle='--', alpha=0.35)
ax_a.legend(loc='upper right', frameon=True, fontsize=8.5)

ax_b.axhspan(-2.4, 2.4, color=PALETTE[0], alpha=0.11)
ax_b.axhline(0, color='#1E242B', linestyle='--', lw=0.95)
r_cols = [PALETTE[1] if abs(r) > 2.4 else PALETTE[0] for r in res]
ax_b.vlines(x_obs, 0, res, color=r_cols, lw=1.9)
ax_b.scatter(x_obs, res, c=r_cols, s=22, zorder=3)
ax_b.set_ylim(-6.5, 6.5)
ax_b.set_ylabel('Residual $\\Delta$')
ax_b.set_xlabel('Cycle Number ($\\times 10^2$)')

ax_a.text(-0.12, 1.03, 'a', transform=ax_a.transAxes, fontsize=13, fontweight='bold')
ax_b.text(-0.12, 1.06, 'b', transform=ax_b.transAxes, fontsize=13, fontweight='bold')`
    }
  ];

  function buildRcParamsBlock(item, palette) {
    const hexList = palette.colors.map(c => `'${c}'`).join(', ');
    if (item.rcPreset === 'ieee-serif') {
      return `# Style ID: ${item.id} | ${item.venueBadge} · ${palette.name}
import matplotlib.pyplot as plt
import numpy as np
from cycler import cycler

PALETTE = [${hexList}]
CMAP_SEQ = '${palette.mplCmapSeq || 'YlGnBu'}'
CMAP_DIV = '${palette.mplCmapDiv || 'RdBu_r'}'

plt.rcParams.update({
    'font.family': 'serif',
    'font.serif': ['Times New Roman', 'STIXGeneral', 'DejaVu Serif'],
    'mathtext.fontset': 'stix',
    'font.size': 10,
    'axes.labelsize': 10.5,
    'axes.linewidth': 0.95,
    'axes.prop_cycle': cycler(color=PALETTE),
    'xtick.direction': 'in',
    'ytick.direction': 'in',
    'xtick.top': True,
    'ytick.right': True,
    'xtick.major.size': 4.2,
    'ytick.major.size': 4.2,
    'xtick.minor.size': 2.4,
    'ytick.minor.size': 2.4,
    'figure.facecolor': 'white',
    'axes.facecolor': 'white',
    'savefig.bbox': 'tight',
    'pdf.fonttype': 42,  # 确保导出 PDF 在 Illustrator 中文字可编辑
})`;
    }

    return `# Style ID: ${item.id} | ${item.venueBadge} · ${palette.name}
import matplotlib.pyplot as plt
import numpy as np
from cycler import cycler

PALETTE = [${hexList}]
CMAP_SEQ = '${palette.mplCmapSeq || 'YlGnBu'}'
CMAP_DIV = '${palette.mplCmapDiv || 'RdBu_r'}'

plt.rcParams.update({
    'font.family': 'sans-serif',
    'font.sans-serif': ['Arial', 'Helvetica', 'DejaVu Sans'],
    'font.size': 10,
    'axes.labelsize': 10.5,
    'axes.linewidth': 1.0,
    'axes.edgecolor': '#1E242B',
    'axes.prop_cycle': cycler(color=PALETTE),
    'xtick.direction': 'out',
    'ytick.direction': 'out',
    'xtick.major.size': 4.0,
    'ytick.major.size': 4.0,
    'figure.facecolor': 'white',
    'axes.facecolor': 'white',
    'savefig.bbox': 'tight',
    'pdf.fonttype': 42,  # 确保导出 PDF 在 Illustrator 中文字可编辑
})`;
  }

  function buildFullMplScript(item, palette) {
    return `${buildRcParamsBlock(item, palette)}\n\n# --- ${item.title} (${item.enTitle}) ---\n${item.codeBody}\n\nplt.tight_layout()\nplt.savefig('${item.id}_${palette.id}.pdf', dpi=300)\nplt.savefig('${item.id}_${palette.id}.png', dpi=300)\nplt.show()\n`;
  }

  function buildMplStyleFile(item, palette) {
    const bareHex = palette.colors.map(c => c.replace('#', '')).join("', '");
    if (item.rcPreset === 'ieee-serif') {
      return `# ${item.id}.mplstyle — Palette: ${palette.name}
font.family : serif
font.serif : Times New Roman, STIXGeneral, DejaVu Serif
mathtext.fontset : stix
font.size : 10
axes.labelsize : 10.5
axes.linewidth : 0.95
axes.prop_cycle : cycler('color', ['${bareHex}'])
xtick.direction : in
ytick.direction : in
xtick.top : True
ytick.right : True
figure.dpi : 300
savefig.bbox : tight
pdf.fonttype : 42
`;
    }
    return `# ${item.id}.mplstyle — Palette: ${palette.name}
font.family : sans-serif
font.sans-serif : Arial, Helvetica, DejaVu Sans
font.size : 10
axes.labelsize : 10.5
axes.linewidth : 1.0
axes.spines.top : False
axes.spines.right : False
axes.prop_cycle : cycler('color', ['${bareHex}'])
xtick.direction : out
ytick.direction : out
figure.dpi : 300
savefig.bbox : tight
pdf.fonttype : 42
`;
  }

  window.SciPlot = window.SciPlot || {};
  window.SciPlot.Catalog = {
    CATEGORIES,
    PRESET_USER_TAGS,
    TAG_GROUPS,
    STYLES,
    buildRcParamsBlock,
    buildFullMplScript,
    buildMplStyleFile,
    getById(id) {
      return STYLES.find(s => s.id === id);
    }
  };
})();
