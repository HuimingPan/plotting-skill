# SciPlot Pin — 科研数据图风格挑选画廊 (Matplotlib)

一个采用 **Pinterest 瀑布流排版** 的交互式科研数据图风格挑选工具，专注于**定量科研数据可视化（Data Plots，而非概念插图/示意图）**。所有图表风格均遵循顶刊排版规范（单上侧误差棒、纯星号显著性标注、空心穿线符号、去上右边框 / IEEE 四框内刻度等），并提供完整可运行的原生 **`matplotlib`** 复现代码与命令行批量导出脚本。

---

## 核心特性

1. **8 大科研数据图类别 · 25 种代表性风格**
   - 覆盖**个体+均值混合图**、**柱状与棒棒糖图**、**散点与回归图**、**雷达与极坐标图**、**折线与时序图**、**分布与统计图**、**热力与等值面图**、**森林与复合子图**。
2. **多维标签检索 + 在线自定义「打标签」**
   - 内置**期刊审美学派**（`#Nature/CNS风`、`#IEEE/物理风`、`#医学/Lancet风`、`#AI顶会风`）、**视觉特征**（`#个体+均值混合`、`#空心符号`、`#去上右边框`、`#四框内刻度`、`#黑白打印友好` 等）与**数据场景**三维标签。
   - 支持在任意卡片上直接**添加/移除自定义标签**（如 `⭐ 论文候选`、`📊 主实验图`），自动持久化保存在浏览器 `localStorage` 中并支持交集筛选。
3. **Pinterest 自适应瀑布流排版**
   - 最短列优先（Shortest-Column）瀑布流引擎，真实保留方图、4:3 单栏图、纵向长图与多子图复合排版的原始高宽比；支持切换 **3 列大图 / 4 列标准 / 5 列总览** 及卡片收藏夹（Pins）。
4. **13 套科研 Palette 实时切换 + 自定义调色盘**
   - 内置 `Nature (NPG)`、`Science (AAAS)`、`NEJM`、`Lancet`、`JAMA`、`Okabe-Ito 色盲安全`、`Paul Tol Muted`、`Academic Morandi`、`Sage & Espresso 鼠尾草棕`、`Viridis`、`AI Conference 冷调`、`IEEE 黑白印刷检视` 以及 **6 色自定义拾色器**。
   - 切换配色盘时，整墙全部 25 张图表与对应的 `matplotlib` 代码（`PALETTE` 与色阶）同步实时更新。
5. **专属图表 ID 一键复制 + 原生 Matplotlib 脚本导出**
   - 每张卡片均配有独立语义化 **ID**（点击 `ID: xxx ⧉` 一键复制，或顶部批量复制已收藏 ID），方便在 AI 绘图流（Skill / Prompt）或命令行脚本中精确指定风格。
   - 详情弹窗提供 **完整 `.py` 脚本**、**`rcParams` 样式头**、**`.mplstyle` 样式文件**、高清 `.PNG` / 矢量 `.SVG` 下载，以及一键导出 `.md` 风格配置包。

---

## 快速开始

### 1. 启动网页挑选画廊

无需安装任何前端依赖，直接运行项目自带的无缓存本地服务：

```bash
python3 serve.py
```

然后在浏览器访问 <http://127.0.0.1:8765/>（也可直接双击打开 `index.html`，甚至支持部署至 GitHub Pages 静态托管）。

### 2. 使用 Python `matplotlib` 命令行直接出图

在装有 `matplotlib` 和 `numpy` 的 Python 环境中，可通过 `export_matplotlib.py` 按图表 ID 与色盘直接生成 300 DPI 的 `.pdf` / `.png` / `.svg` 科研图：

```bash
# 查看所有支持的 25 种图表风格 ID 与 13 套色盘 ID
python3 export_matplotlib.py --list

# 指定风格 ID 与配色盘生成矢量 PDF
python3 export_matplotlib.py --style hybrid-dual-regime-bar --palette sage_espresso --format pdf

# 批量导出全部 25 张示例图
python3 export_matplotlib.py --style all --palette npg --outdir ./outputs --format png
```

---

## 全部 25 种图表风格 ID 速查表

| 类别 | 图表 ID (`style`) | 风格名称 | 典型适用场景 |
| :--- | :--- | :--- | :--- |
| **个体+均值混合图** | `hybrid-dual-regime-bar` | 双工况跨被试实虚轨迹 + 右侧分层双簇均值柱图 | 稳态 vs 疲劳等双工况逐被试轨迹与右侧双簇均值检验 |
| **柱状与棒棒糖图** | `bar-nature-jitter` | 均值柱状 + 原始样本抖动误差图 | 小样本（`n < 20`）生物/实验统计，单上侧 SEM + 星号 |
| **柱状与棒棒糖图** | `bar-ieee-hatch` | IEEE 四框内刻度纹理分组柱状图 | 工科/物理双栏论文，带斜纹点阵纹理，黑白打印零损失 |
| **柱状与棒棒糖图** | `bar-stacked-flow` | 100% 构成堆积柱状 + 组间迁移丝带图 | 多时间点/分组间组分或菌群丰度演变 |
| **柱状与棒棒糖图** | `bar-diverging-lollipop` | 双向正负偏差水平棒棒糖图 | 多特征正负效应变化率排名，高数据墨水比 |
| **散点与回归图** | `scatter-joint-marginal` | 联合分布线性回归 + 边缘直方核密度图 | 双变量 OLS 拟合置信带 + 单变量边缘分布 |
| **散点与回归图** | `scatter-volcano-quadrant` | 多维阈值象限火山气泡散点图 | 差异显著性筛选、第三维权重映射与引线标注 |
| **散点与回归图** | `scatter-paired-slope` | 配对前后个体响应斜率连线图 | 干预前后同源样本追踪 + 群体均值单上侧误差 |
| **散点与回归图** | `scatter-kde-contour` | 大样本二维核密度等高线散点场图 | `N > 1000` 大样本双模态核心密度与外围离群点 |
| **雷达与极坐标图** | `radar-polygon-benchmark` | 多模型六维多边形层叠雷达图 | AI / 算法多指标综合能力包络对比 |
| **雷达与极坐标图** | `radar-nightingale-rose` | 极坐标南丁格尔玫瑰扇区柱图 | 方位角（0°–360°）或周期强度分层统计 |
| **雷达与极坐标图** | `radar-spider-minimal` | 无底色实虚线高对比学术蜘蛛图 | 去填充防混色、黑白打印友好的多维指标对比 |
| **折线与时序图** | `line-ci-band` | 多序列均值折线 + 标准差置信阴影带 | 多随机种子训练收敛曲线或动力学重复实验 |
| **折线与时序图** | `line-inset-zoom` | 四框内刻度光谱曲线 + 局部放大子图 | 全局宽量程趋势 + 局部峰位分裂/拐点原位放大 |
| **折线与时序图** | `line-small-multiples` | 分面小多图 + 全局灰色背景参照曲线 | 多组交叉曲线拆面展示，保留全局浅灰参照系 |
| **折线与时序图** | `line-dual-phase` | 实验阶段阴影分区 + 误差采样时序图 | 基线—扰动—恢复多阶段干预时序过程 |
| **分布与统计图** | `dist-raincloud` | 云雨图：半小提琴核密度 + 窄箱线 + 散点 | 现代统计强烈推荐，同时展示密度形态、四分位与样本点 |
| **分布与统计图** | `dist-box-signif` | 显著性阶梯括号科研分组箱线图 | 多组分布四分位对比与两两显著性星号检验 |
| **分布与统计图** | `dist-ridgeline` | 山脊核密度层叠演化分布图 | 随温度/深度/时间连续漂移的多组分布演化 |
| **分布与统计图** | `dist-ecdf-step` | 经验累积分布阶梯图 (ECDF) + KS 检验 | 无分箱偏差的分位数（P50/P95）与最大统计距离对比 |
| **热力与等值面图** | `matrix-corr-tri` | 下三角显著性星号相关性热力矩阵 | 多变量耦合分析，裁除冗余上三角并自适应文字对比度 |
| **热力与等值面图** | `matrix-clustered-zscore` | 带样本分组色条的标准化表达热力图 | 组学/消融特征矩阵行标准化 Z-score 与分组条带 |
| **热力与等值面图** | `matrix-contour-field` | 二维连续响应面填充 + 内嵌数值等高线图 | 双参数响应曲面、`clabel` 等值线标注与最优点定位 |
| **森林与复合子图** | `comp-forest-plot` | 亚组效应量/消融实验森林图 (Forest Plot) | 左侧数值对齐表 + 右侧效应点估计、置信区间与汇总菱形 |
| **森林与复合子图** | `comp-panel-ab` | 双子图复合排版：主拟合曲线 `(a)` + 残差棒图 `(b)` | 理论模型拟合优度与零线附近残差随机性联合验证 |

---

## 内置配色盘 ID (`--palette`)

| 色盘 ID | 名称 | 定位说明 |
| :--- | :--- | :--- |
| `npg` | Nature (NPG) | Nature 出版集团高辨识度经典科研色盘 |
| `aaas` | Science (AAAS) | Science 稳重深蓝与红绿高对比配色 |
| `nejm` | NEJM 医学经典 | 新英格兰医学杂志温润砖红与钴蓝配色 |
| `lancet` | Lancet 柳叶刀 | 强对比皇家蓝与鲜红，适合临床与森林图 |
| `jama` | JAMA 沉稳石板 | 深灰蓝主调搭配暖琥珀色 |
| `okabe_ito` | Okabe-Ito 色盲安全 | Nature Methods 推荐色觉无障碍标准 |
| `tol_muted` | Paul Tol Muted | 物理与地学界常用低视觉疲劳柔和色盘 |
| `morandi` | Academic Morandi | 低饱和度灰调科研配色，适合多组堆积与综述 |
| `sage_espresso` | Sage & Espresso 鼠尾草棕 | 生物力学/神经工程经典大地深棕与鼠尾草绿对比 |
| `viridis` | Viridis 感知均匀 | 亮度单调递增科学连续色盘 |
| `nordic` | AI Conference 冷调 | 机器学习顶会常见深海蓝与珊瑚橙配色 |
| `grayscale` | IEEE 黑白印刷检视 | 模拟黑白纸刊打印效果，检验线型/纹理辨识度 |
| `custom` | 自定义调色盘 | 支持网页端自由拾取或输入 6 组专属 HEX 色值 |

---

## 目录结构

```text
plotting-skill/
├── index.html             # Pinterest 风格交互画廊主入口（可直接部署至 GitHub Pages）
├── css/
│   └── styles.css         # 瀑布流卡片、标签筛选、色盘栏与详情弹窗样式
├── js/
│   ├── palettes.js        # 13 套科研配色盘与连续/发散色阶插值工具
│   ├── mpl-svg-engine.js  # 遵循 Matplotlib 语义的 25 种定量数据图矢量渲染引擎
│   ├── catalog.js         # 分类、标签体系与全部 25 套 Matplotlib Python 代码模板
│   └── app.js             # 瀑布流布局、打标签持久化、实时换色与代码/图片导出控制
├── export_matplotlib.py   # 原生 Matplotlib 命令行批量/单图导出脚本
├── serve.py               # 本地无缓存预览服务器（端口 8765）
└── README.md              # 项目说明与图表 ID 速查手册
```
