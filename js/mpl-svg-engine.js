// Precision Matplotlib-Faithful Scientific SVG Figure Engine
// Renders 24 quantitative scientific data plotting styles with real mathematical data,
// Matplotlib axis/spine/tick/hatch semantics, and live palette reactivity.
(function () {
  'use strict';

  const { lerpColor, contrastText, seqColor, divColor } = window.SciPlot.Palettes;

  const FONTS = {
    sans: "'Helvetica Neue', Arial, 'DejaVu Sans', -apple-system, sans-serif",
    serif: "'Times New Roman', 'STIX Two Text', Georgia, serif",
    mono: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace"
  };

  let uidCounter = 0;
  function nextUid(prefix) {
    uidCounter += 1;
    return `${prefix}_${uidCounter}`;
  }

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Deterministic PRNG (Mulberry32)
  function createRng(seed) {
    let a = seed >>> 0;
    const rand = function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    rand.normal = function (mean = 0, sd = 1) {
      let u = 0, v = 0;
      while (u === 0) u = rand();
      while (v === 0) v = rand();
      return mean + sd * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    };
    return rand;
  }

  function mean(arr) {
    return arr.reduce((s, v) => s + v, 0) / arr.length;
  }

  function std(arr) {
    const m = mean(arr);
    return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / Math.max(1, arr.length - 1));
  }

  function quantile(sorted, q) {
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    }
    return sorted[base];
  }

  function kde1d(samples, xs, bandwidth) {
    const n = samples.length;
    const inv = 1 / (n * bandwidth * Math.sqrt(2 * Math.PI));
    return xs.map(x => {
      let sum = 0;
      for (let i = 0; i < n; i++) {
        const z = (x - samples[i]) / bandwidth;
        sum += Math.exp(-0.5 * z * z);
      }
      return sum * inv;
    });
  }

  function olsFit(xs, ys) {
    const mx = mean(xs);
    const my = mean(ys);
    let sxx = 0, sxy = 0, syy = 0;
    for (let i = 0; i < xs.length; i++) {
      const dx = xs[i] - mx;
      const dy = ys[i] - my;
      sxx += dx * dx;
      sxy += dx * dy;
      syy += dy * dy;
    }
    const slope = sxy / sxx;
    const intercept = my - slope * mx;
    let sse = 0;
    for (let i = 0; i < xs.length; i++) {
      const err = ys[i] - (intercept + slope * xs[i]);
      sse += err * err;
    }
    const se = Math.sqrt(sse / Math.max(1, xs.length - 2));
    const r = sxy / Math.sqrt(Math.max(1e-9, sxx * syy));
    return { slope, intercept, mx, sxx, se, r, n: xs.length };
  }

  // Create SVG hatch patterns matching Matplotlib ('///', '\\\\\\', 'xxx', '...')
  function buildHatchDefs(uid, colors) {
    const types = ['slash', 'back', 'cross', 'dots'];
    let out = '';
    colors.forEach((col, ci) => {
      const strokeCol = '#182026';
      types.forEach(tp => {
        const pid = `${uid}_h_${tp}_${ci}`;
        if (tp === 'slash') {
          out += `<pattern id="${pid}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(42)">
            <rect width="6" height="6" fill="${col}" fill-opacity="0.82"/>
            <line x1="0" y1="0" x2="0" y2="6" stroke="${strokeCol}" stroke-width="1.35" stroke-opacity="0.65"/>
          </pattern>`;
        } else if (tp === 'back') {
          out += `<pattern id="${pid}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-42)">
            <rect width="6" height="6" fill="${col}" fill-opacity="0.82"/>
            <line x1="0" y1="0" x2="0" y2="6" stroke="${strokeCol}" stroke-width="1.35" stroke-opacity="0.65"/>
          </pattern>`;
        } else if (tp === 'cross') {
          out += `<pattern id="${pid}" width="7" height="7" patternUnits="userSpaceOnUse">
            <rect width="7" height="7" fill="${col}" fill-opacity="0.8"/>
            <path d="M0,0 L7,7 M7,0 L0,7" stroke="${strokeCol}" stroke-width="0.95" stroke-opacity="0.6"/>
          </pattern>`;
        } else if (tp === 'dots') {
          out += `<pattern id="${pid}" width="5.5" height="5.5" patternUnits="userSpaceOnUse">
            <rect width="5.5" height="5.5" fill="${col}" fill-opacity="0.82"/>
            <circle cx="2.5" cy="2.5" r="0.95" fill="${strokeCol}" fill-opacity="0.7"/>
          </pattern>`;
        }
      });
    });
    return out;
  }

  // Matplotlib 2D Cartesian Axes Helper
  function createAxes(cfg) {
    const {
      x0, y0, w, h,
      xmin, xmax, ymin, ymax,
      font = FONTS.sans
    } = cfg;
    const x1 = x0 + w;
    const y1 = y0 + h;
    return {
      x0, y0, x1, y1, w, h, xmin, xmax, ymin, ymax, font,
      x(v) {
        return x0 + ((v - xmin) / (xmax - xmin)) * w;
      },
      y(v) {
        return y1 - ((v - ymin) / (ymax - ymin)) * h;
      },
      drawFrame(opts = {}) {
        const {
          style = 'despine', // 'despine' | 'box-in' | 'box-out' | 'minimal'
          xticks = [],
          xticklabels = null,
          yticks = [],
          yticklabels = null,
          xMinor = 0,
          yMinor = 0,
          gridX = false,
          gridY = false,
          gridDash = '3,3',
          xlabel = '',
          ylabel = '',
          title = '',
          titleAlign = 'left',
          tickSize = 10,
          labelSize = 11,
          showXLabels = true,
          showYLabels = true,
          xLabelOffset = 32,
          yLabelOffset = 40,
          xtickRotate = 0
        } = opts;

        let s = '';
        const spineColor = '#1E242B';
        const gridColor = '#E2E8F0';
        const tickIn = style === 'box-in';
        const closedBox = style === 'box-in' || style === 'box-out';
        const tl = 4.5;
        const mtl = 2.5;

        // Gridlines (behind data)
        if (gridY) {
          yticks.forEach(tv => {
            const py = this.y(tv);
            if (py >= y0 - 0.5 && py <= y1 + 0.5) {
              s += `<line x1="${x0}" y1="${py.toFixed(1)}" x2="${x1}" y2="${py.toFixed(1)}" stroke="${gridColor}" stroke-width="0.85" ${gridDash ? `stroke-dasharray="${gridDash}"` : ''}/>`;
            }
          });
        }
        if (gridX) {
          xticks.forEach(tv => {
            const px = this.x(tv);
            if (px >= x0 - 0.5 && px <= x1 + 0.5) {
              s += `<line x1="${px.toFixed(1)}" y1="${y0}" x2="${px.toFixed(1)}" y2="${y1}" stroke="${gridColor}" stroke-width="0.85" ${gridDash ? `stroke-dasharray="${gridDash}"` : ''}/>`;
            }
          });
        }

        // Title
        if (title) {
          const tx = titleAlign === 'center' ? (x0 + x1) / 2 : x0;
          const anchor = titleAlign === 'center' ? 'middle' : 'start';
          s += `<text x="${tx.toFixed(1)}" y="${(y0 - 10).toFixed(1)}" text-anchor="${anchor}" font-family="${font}" font-size="11.5" font-weight="600" fill="#111827">${esc(title)}</text>`;
        }

        // Helper for spines + ticks (can also be called on top of data via drawOverlayAxes)
        const axesLines = () => {
          let ax = '';
          if (closedBox) {
            ax += `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="none" stroke="${spineColor}" stroke-width="1.1"/>`;
          } else if (style === 'despine') {
            ax += `<line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1}" stroke="${spineColor}" stroke-width="1.15"/>`;
            ax += `<line x1="${x0}" y1="${y1}" x2="${x1}" y2="${y1}" stroke="${spineColor}" stroke-width="1.15"/>`;
          } else if (style === 'minimal') {
            ax += `<line x1="${x0}" y1="${y1}" x2="${x1}" y2="${y1}" stroke="${spineColor}" stroke-width="1.05"/>`;
          }

          // X Ticks
          xticks.forEach((tv, idx) => {
            const px = this.x(tv);
            if (px < x0 - 1 || px > x1 + 1) return;
            const dy = tickIn ? -tl : tl;
            ax += `<line x1="${px.toFixed(1)}" y1="${y1}" x2="${px.toFixed(1)}" y2="${(y1 + dy).toFixed(1)}" stroke="${spineColor}" stroke-width="1.0"/>`;
            if (tickIn) {
              ax += `<line x1="${px.toFixed(1)}" y1="${y0}" x2="${px.toFixed(1)}" y2="${(y0 + tl).toFixed(1)}" stroke="${spineColor}" stroke-width="1.0"/>`;
            }
            if (showXLabels) {
              const lbl = xticklabels ? xticklabels[idx] : Number(tv.toFixed(2));
              const ly = y1 + (tickIn ? 14 : 16);
              if (xtickRotate) {
                ax += `<text x="${px.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="end" transform="rotate(${xtickRotate} ${px.toFixed(1)} ${ly.toFixed(1)})" font-family="${font}" font-size="${tickSize}" fill="#262E38">${esc(lbl)}</text>`;
              } else {
                ax += `<text x="${px.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" font-family="${font}" font-size="${tickSize}" fill="#262E38">${esc(lbl)}</text>`;
              }
            }
          });

          // X Minor ticks
          if (xMinor > 1 && xticks.length >= 2) {
            const step = (xticks[1] - xticks[0]) / xMinor;
            for (let v = xmin; v <= xmax + 1e-6; v += step) {
              const px = this.x(v);
              if (px >= x0 && px <= x1) {
                const dy = tickIn ? -mtl : mtl;
                ax += `<line x1="${px.toFixed(1)}" y1="${y1}" x2="${px.toFixed(1)}" y2="${(y1 + dy).toFixed(1)}" stroke="${spineColor}" stroke-width="0.75"/>`;
                if (tickIn) {
                  ax += `<line x1="${px.toFixed(1)}" y1="${y0}" x2="${px.toFixed(1)}" y2="${(y0 + mtl).toFixed(1)}" stroke="${spineColor}" stroke-width="0.75"/>`;
                }
              }
            }
          }

          // Y Ticks
          if (style !== 'minimal') {
            yticks.forEach((tv, idx) => {
              const py = this.y(tv);
              if (py < y0 - 1 || py > y1 + 1) return;
              const dx = tickIn ? tl : -tl;
              ax += `<line x1="${x0}" y1="${py.toFixed(1)}" x2="${(x0 + dx).toFixed(1)}" y2="${py.toFixed(1)}" stroke="${spineColor}" stroke-width="1.0"/>`;
              if (tickIn) {
                ax += `<line x1="${x1}" y1="${py.toFixed(1)}" x2="${(x1 - tl).toFixed(1)}" y2="${py.toFixed(1)}" stroke="${spineColor}" stroke-width="1.0"/>`;
              }
              if (showYLabels) {
                const lbl = yticklabels ? yticklabels[idx] : Number(tv.toFixed(2));
                ax += `<text x="${(x0 - (tickIn ? 7 : 8)).toFixed(1)}" y="${(py + 3.5).toFixed(1)}" text-anchor="end" font-family="${font}" font-size="${tickSize}" fill="#262E38">${esc(lbl)}</text>`;
              }
            });
          } else if (showYLabels) {
            yticks.forEach((tv, idx) => {
              const py = this.y(tv);
              const lbl = yticklabels ? yticklabels[idx] : Number(tv.toFixed(2));
              ax += `<text x="${(x0 - 8).toFixed(1)}" y="${(py + 3.5).toFixed(1)}" text-anchor="end" font-family="${font}" font-size="${tickSize}" fill="#262E38">${esc(lbl)}</text>`;
            });
          }

          // Y Minor ticks
          if (yMinor > 1 && yticks.length >= 2) {
            const step = (yticks[1] - yticks[0]) / yMinor;
            for (let v = ymin; v <= ymax + 1e-6; v += step) {
              const py = this.y(v);
              if (py >= y0 && py <= y1) {
                const dx = tickIn ? mtl : -mtl;
                ax += `<line x1="${x0}" y1="${py.toFixed(1)}" x2="${(x0 + dx).toFixed(1)}" y2="${py.toFixed(1)}" stroke="${spineColor}" stroke-width="0.75"/>`;
                if (tickIn) {
                  ax += `<line x1="${x1}" y1="${py.toFixed(1)}" x2="${(x1 - mtl).toFixed(1)}" y2="${py.toFixed(1)}" stroke="${spineColor}" stroke-width="0.75"/>`;
                }
              }
            }
          }

          // Axis Labels
          if (xlabel) {
            ax += `<text x="${((x0 + x1) / 2).toFixed(1)}" y="${(y1 + xLabelOffset).toFixed(1)}" text-anchor="middle" font-family="${font}" font-size="${labelSize}" font-weight="500" fill="#182026">${esc(xlabel)}</text>`;
          }
          if (ylabel) {
            const cy = (y0 + y1) / 2;
            const cx = x0 - yLabelOffset;
            ax += `<text x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" text-anchor="middle" transform="rotate(-90 ${cx.toFixed(1)} ${cy.toFixed(1)})" font-family="${font}" font-size="${labelSize}" font-weight="500" fill="#182026">${esc(ylabel)}</text>`;
          }
          return ax;
        };

        return { bg: s, fg: axesLines() };
      }
    };
  }

  function drawMarker(type, cx, cy, size, fill, stroke = '#FFFFFF', sw = 0.8, opacity = 1) {
    const x = cx.toFixed(1);
    const y = cy.toFixed(1);
    if (type === 'square') {
      const h = size * 0.9;
      return `<rect x="${(cx - h).toFixed(1)}" y="${(cy - h).toFixed(1)}" width="${(h * 2).toFixed(1)}" height="${(h * 2).toFixed(1)}" fill="${fill}" fill-opacity="${opacity}" stroke="${stroke}" stroke-width="${sw}"/>`;
    }
    if (type === 'triangle') {
      const r = size * 1.15;
      const p1 = `${cx.toFixed(1)},${(cy - r).toFixed(1)}`;
      const p2 = `${(cx - r * 0.92).toFixed(1)},${(cy + r * 0.72).toFixed(1)}`;
      const p3 = `${(cx + r * 0.92).toFixed(1)},${(cy + r * 0.72).toFixed(1)}`;
      return `<polygon points="${p1} ${p2} ${p3}" fill="${fill}" fill-opacity="${opacity}" stroke="${stroke}" stroke-width="${sw}"/>`;
    }
    if (type === 'diamond') {
      const r = size * 1.2;
      return `<polygon points="${x},${(cy - r).toFixed(1)} ${(cx + r).toFixed(1)},${y} ${x},${(cy + r).toFixed(1)} ${(cx - r).toFixed(1)},${y}" fill="${fill}" fill-opacity="${opacity}" stroke="${stroke}" stroke-width="${sw}"/>`;
    }
    return `<circle cx="${x}" cy="${y}" r="${size.toFixed(1)}" fill="${fill}" fill-opacity="${opacity}" stroke="${stroke}" stroke-width="${sw}"/>`;
  }

  // Upper-only one-sided error bar: stem from yBase (mean) up to yTop (mean + err), single top cap
  function drawErrorBar(cx, yTop, yBase, cap = 3.5, color = '#1E242B', sw = 1.15) {
    if (cap <= 0 && yTop === yBase) return '';
    return `<line x1="${cx.toFixed(1)}" y1="${yBase.toFixed(1)}" x2="${cx.toFixed(1)}" y2="${yTop.toFixed(1)}" stroke="${color}" stroke-width="${sw}"/>` +
      (cap > 0
        ? `<line x1="${(cx - cap).toFixed(1)}" y1="${yTop.toFixed(1)}" x2="${(cx + cap).toFixed(1)}" y2="${yTop.toFixed(1)}" stroke="${color}" stroke-width="${sw}"/>`
        : '');
  }

  function drawSigBracket(x1, x2, y, label, font = FONTS.sans) {
    const h = 5;
    const isStar = /^\*+$/.test(label.trim());
    const fs = isStar ? '12.5' : '10.0';
    const ty = isStar ? (y - 1.0) : (y - 3.5);
    return `<path d="M${x1.toFixed(1)},${(y + h).toFixed(1)} L${x1.toFixed(1)},${y.toFixed(1)} L${x2.toFixed(1)},${y.toFixed(1)} L${x2.toFixed(1)},${(y + h).toFixed(1)}" fill="none" stroke="#1E242B" stroke-width="1.05"/>` +
      `<text x="${((x1 + x2) / 2).toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" font-family="${font}" font-size="${fs}" font-weight="700" fill="#1E242B">${esc(label)}</text>`;
  }

  function drawColorbar(x, y, w, h, colorFn, ticks, label, font = FONTS.sans) {
    let s = '';
    const steps = 36;
    const sh = h / steps;
    for (let i = 0; i < steps; i++) {
      const t = 1 - i / (steps - 1);
      const col = colorFn(t);
      s += `<rect x="${x.toFixed(1)}" y="${(y + i * sh).toFixed(2)}" width="${w}" height="${(sh + 0.6).toFixed(2)}" fill="${col}" stroke="none"/>`;
    }
    s += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w}" height="${h}" fill="none" stroke="#1E242B" stroke-width="0.9"/>`;
    ticks.forEach(({ t, text }) => {
      const py = y + (1 - t) * h;
      s += `<line x1="${(x + w).toFixed(1)}" y1="${py.toFixed(1)}" x2="${(x + w + 3.5).toFixed(1)}" y2="${py.toFixed(1)}" stroke="#1E242B" stroke-width="0.85"/>`;
      s += `<text x="${(x + w + 6).toFixed(1)}" y="${(py + 3.2).toFixed(1)}" font-family="${font}" font-size="9.2" fill="#262E38">${esc(text)}</text>`;
    });
    if (label) {
      s += `<text x="${(x + w / 2).toFixed(1)}" y="${(y - 7).toFixed(1)}" text-anchor="middle" font-family="${font}" font-size="9.5" font-weight="600" fill="#1E242B">${esc(label)}</text>`;
    }
    return s;
  }

  // Marching squares segment tracer for genuine isolines on a 2D scalar grid
  function traceIsolineSegments(grid, nx, ny, threshold, mapX, mapY) {
    let d = '';
    const interp = (v1, v2) => {
      if (Math.abs(v2 - v1) < 1e-9) return 0.5;
      return Math.max(0, Math.min(1, (threshold - v1) / (v2 - v1)));
    };
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const v00 = grid[j][i];
        const v10 = grid[j][i + 1];
        const v11 = grid[j + 1][i + 1];
        const v01 = grid[j + 1][i];
        const idx =
          (v00 >= threshold ? 1 : 0) |
          (v10 >= threshold ? 2 : 0) |
          (v11 >= threshold ? 4 : 0) |
          (v01 >= threshold ? 8 : 0);
        if (idx === 0 || idx === 15) continue;

        const bottom = [mapX(i + interp(v00, v10)), mapY(j)];
        const right = [mapX(i + 1), mapY(j + interp(v10, v11))];
        const top = [mapX(i + interp(v01, v11)), mapY(j + 1)];
        const left = [mapX(i), mapY(j + interp(v00, v01))];

        const seg = (a, b) => {
          d += `M${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}`;
        };
        switch (idx) {
          case 1: case 14: seg(left, bottom); break;
          case 2: case 13: seg(bottom, right); break;
          case 3: case 12: seg(left, right); break;
          case 4: case 11: seg(right, top); break;
          case 5: seg(left, top); seg(bottom, right); break;
          case 6: case 9: seg(bottom, top); break;
          case 7: case 8: seg(left, top); break;
          case 10: seg(left, bottom); seg(right, top); break;
        }
      }
    }
    return d;
  }

  function wrapSvg(w, h, inner, bg = '#FFFFFF', defs = '') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" style="display:block;height:auto;">` +
      (defs ? `<defs>${defs}</defs>` : '') +
      (bg !== 'transparent' ? `<rect width="${w}" height="${h}" fill="${bg}"/>` : '') +
      inner +
      `</svg>`;
  }

  // =========================================================================
  // 24 SCIENTIFIC DATA PLOT RENDERERS
  // =========================================================================
  const RENDERERS = {

    // 1. CNS Bar + Jitter + SEM Errorbar + Significance
    'bar-nature-jitter'(palette, opts = {}) {
      const c = palette.colors;
      const rng = createRng(101);
      const W = 420, H = 350;
      const ax = createAxes({ x0: 62, y0: 34, w: 334, h: 262, xmin: -0.6, xmax: 3.6, ymin: 0, ymax: 11.5 });
      const frame = ax.drawFrame({
        style: 'despine',
        xticks: [0, 1, 2, 3],
        xticklabels: ['Vehicle', 'Low Dose', 'High Dose', 'Combo'],
        yticks: [0, 2, 4, 6, 8, 10],
        gridY: true,
        gridDash: '2.5,3',
        ylabel: 'Relative mRNA Level (a.u.)',
        xlabel: 'Treatment Regimen',
        xLabelOffset: 36,
        yLabelOffset: 42
      });

      const means = [2.4, 4.7, 6.9, 8.6];
      const sds = [0.55, 0.78, 0.85, 0.72];
      let body = frame.bg;

      means.forEach((m, gi) => {
        const samples = Array.from({ length: 9 }, () => Math.max(0.5, rng.normal(m, sds[gi])));
        const sm = mean(samples);
        const sem = std(samples) / Math.sqrt(samples.length);
        const bx1 = ax.x(gi - 0.30);
        const bx2 = ax.x(gi + 0.30);
        const by = ax.y(sm);
        const b0 = ax.y(0);
        body += `<rect x="${bx1.toFixed(1)}" y="${by.toFixed(1)}" width="${(bx2 - bx1).toFixed(1)}" height="${(b0 - by).toFixed(1)}" fill="${c[gi % c.length]}" fill-opacity="0.74" stroke="${c[gi % c.length]}" stroke-width="1.35"/>`;
        body += drawErrorBar(ax.x(gi), ax.y(sm + sem * 1.45), by, 4.5, '#182026', 1.3);
        samples.forEach(sv => {
          const jx = gi + (rng() - 0.5) * 0.28;
          body += drawMarker('circle', ax.x(jx), ax.y(sv), 3.2, '#FFFFFF', c[gi % c.length], 1.45, 0.95);
        });
      });

      body += drawSigBracket(ax.x(0), ax.x(2), ax.y(9.1), '**');
      body += drawSigBracket(ax.x(0), ax.x(3), ax.y(10.35), '***');
      body += `<text x="${ax.x1}" y="${ax.y0 - 8}" text-anchor="end" font-family="${FONTS.sans}" font-size="9.5" fill="#64748B">Mean + SEM (n = 9)</text>`;
      body += frame.fg;
      return wrapSvg(W, H, body, opts.bg || '#FFFFFF');
    },

    // 2. IEEE 4-Spine Framed Bar + Hatching Patterns
    'bar-ieee-hatch'(palette, opts = {}) {
      const c = palette.colors;
      const uid = nextUid('ieee');
      const W = 420, H = 318;
      const ax = createAxes({ x0: 62, y0: 36, w: 338, h: 228, xmin: -0.55, xmax: 3.55, ymin: 0, ymax: 105, font: FONTS.serif });
      const frame = ax.drawFrame({
        style: 'box-in',
        xticks: [0, 1, 2, 3],
        xticklabels: ['Workload-A', 'Workload-B', 'Workload-C', 'Workload-D'],
        yticks: [0, 20, 40, 60, 80, 100],
        yMinor: 2,
        gridY: true,
        gridDash: '2,2.5',
        ylabel: 'Normalized Throughput (ops/s)',
        xlabel: 'Evaluation Benchmark Suite',
        xLabelOffset: 36,
        yLabelOffset: 42
      });

      const defs = buildHatchDefs(uid, c);
      const series = [
        { name: 'Baseline', hatch: 'slash', ci: 0, vals: [52, 48, 61, 55], err: [3.2, 2.8, 3.5, 3.0] },
        { name: 'Heuristic', hatch: 'dots', ci: 1, vals: [68, 64, 74, 71], err: [3.6, 3.1, 3.4, 3.3] },
        { name: 'Proposed', hatch: 'cross', ci: 2, vals: [86, 83, 92, 89], err: [2.9, 2.5, 2.7, 2.6] }
      ];

      let body = frame.bg;
      const bw = 0.23;
      series.forEach((s, si) => {
        const offset = (si - 1) * (bw + 0.02);
        s.vals.forEach((v, gi) => {
          const xL = ax.x(gi + offset - bw / 2);
          const xR = ax.x(gi + offset + bw / 2);
          const yT = ax.y(v);
          const yB = ax.y(0);
          const pid = `${uid}_h_${s.hatch}_${s.ci}`;
          body += `<rect x="${xL.toFixed(1)}" y="${yT.toFixed(1)}" width="${(xR - xL).toFixed(1)}" height="${(yB - yT).toFixed(1)}" fill="url(#${pid})" stroke="#111827" stroke-width="1.05"/>`;
          body += drawErrorBar((xL + xR) / 2, ax.y(v + s.err[gi]), yT, 3.0, '#111827', 1.05);
        });
      });

      // Framed IEEE Legend inside upper-left
      body += `<rect x="${ax.x0 + 10}" y="${ax.y0 + 8}" width="196" height="24" fill="#FFFFFF" fill-opacity="0.92" stroke="#111827" stroke-width="0.8"/>`;
      series.forEach((s, si) => {
        const lx = ax.x0 + 18 + si * 63;
        const pid = `${uid}_h_${s.hatch}_${s.ci}`;
        body += `<rect x="${lx}" y="${ax.y0 + 14}" width="13" height="11" fill="url(#${pid})" stroke="#111827" stroke-width="0.85"/>`;
        body += `<text x="${lx + 17}" y="${ax.y0 + 23}" font-family="${FONTS.serif}" font-size="9.6" fill="#111827">${esc(s.name)}</text>`;
      });

      body += frame.fg;
      return wrapSvg(W, H, body, opts.bg || '#FFFFFF', defs);
    },

    // 3. 100% Stacked Composition Bar + Alluvial Flow Connectors
    'bar-stacked-flow'(palette, opts = {}) {
      const c = palette.colors;
      const W = 420, H = 455;
      const ax = createAxes({ x0: 60, y0: 54, w: 336, h: 344, xmin: -0.55, xmax: 3.55, ymin: 0, ymax: 100 });
      const frame = ax.drawFrame({
        style: 'despine',
        xticks: [0, 1, 2, 3],
        xticklabels: ['Day 0', 'Day 3', 'Day 7', 'Day 14'],
        yticks: [0, 20, 40, 60, 80, 100],
        ylabel: 'Community Composition (%)',
        xlabel: 'Sampling Timepoint',
        xLabelOffset: 38,
        yLabelOffset: 40
      });

      const taxa = ['Bacteroidota', 'Firmicutes', 'Proteobacteria', 'Actinomycetota', 'Verrucomicrobia'];
      const data = [
        [38, 30, 14, 11, 7],
        [29, 35, 18, 10, 8],
        [21, 41, 15, 13, 10],
        [16, 46, 11, 14, 13]
      ];

      let body = frame.bg;
      const halfW = 0.25;
      // Compute cumulative stacks
      const cum = data.map(col => {
        let acc = 0;
        return col.map(v => {
          const r = [acc, acc + v];
          acc += v;
          return r;
        });
      });

      // Draw connecting flow ribbons between adjacent bars
      for (let g = 0; g < data.length - 1; g++) {
        const xA = ax.x(g + halfW);
        const xB = ax.x(g + 1 - halfW);
        const xm = (xA + xB) / 2;
        for (let k = 0; k < taxa.length; k++) {
          const [yA0, yA1] = cum[g][k].map(v => ax.y(v));
          const [yB0, yB1] = cum[g + 1][k].map(v => ax.y(v));
          body += `<path d="M${xA.toFixed(1)},${yA1.toFixed(1)} C${xm.toFixed(1)},${yA1.toFixed(1)} ${xm.toFixed(1)},${yB1.toFixed(1)} ${xB.toFixed(1)},${yB1.toFixed(1)} L${xB.toFixed(1)},${yB0.toFixed(1)} C${xm.toFixed(1)},${yB0.toFixed(1)} ${xm.toFixed(1)},${yA0.toFixed(1)} ${xA.toFixed(1)},${yA0.toFixed(1)} Z" fill="${c[k % c.length]}" fill-opacity="0.20" stroke="${c[k % c.length]}" stroke-opacity="0.35" stroke-width="0.6"/>`;
        }
      }

      // Draw stacked bars
      for (let g = 0; g < data.length; g++) {
        const xL = ax.x(g - halfW);
        const xR = ax.x(g + halfW);
        for (let k = 0; k < taxa.length; k++) {
          const y0 = ax.y(cum[g][k][0]);
          const y1 = ax.y(cum[g][k][1]);
          body += `<rect x="${xL.toFixed(1)}" y="${y1.toFixed(1)}" width="${(xR - xL).toFixed(1)}" height="${(y0 - y1).toFixed(1)}" fill="${c[k % c.length]}" stroke="#FFFFFF" stroke-width="1.1"/>`;
        }
      }

      // Top 2-row frameless legend
      taxa.forEach((name, k) => {
        const row = Math.floor(k / 3);
        const col = k % 3;
        const lx = 58 + col * 116;
        const ly = 14 + row * 17;
        body += `<rect x="${lx}" y="${ly}" width="10" height="10" rx="1.5" fill="${c[k % c.length]}"/>`;
        body += `<text x="${lx + 14}" y="${ly + 8.6}" font-family="${FONTS.sans}" font-size="9.4" font-style="italic" fill="#1E242B">${esc(name)}</text>`;
      });

      body += frame.fg;
      return wrapSvg(W, H, body, opts.bg || '#FFFFFF');
    },

    // 4. Diverging Horizontal Lollipop Effect Plot
    'bar-diverging-lollipop'(palette, opts = {}) {
      const c = palette.colors;
      const W = 420, H = 486;
      const items = [
        ['Oxidative Phos.', 38.4],
        ['Fatty Acid Beta-Ox.', 29.1],
        ['AMPK Signaling', 22.6],
        ['Autophagy Flux', 16.2],
        ['Mito. Biogenesis', 9.5],
        ['Pentose Phosphate', -7.8],
        ['mTORC1 Activity', -14.6],
        ['De Novo Lipogenesis', -21.3],
        ['HIF-1α Glycolysis', -28.9],
        ['NF-κB Inflammation', -35.7]
      ];
      const n = items.length;
      const ax = createAxes({ x0: 132, y0: 34, w: 264, h: 398, xmin: -50, xmax: 54, ymin: -0.6, ymax: n - 0.4 });
      const frame = ax.drawFrame({
        style: 'minimal',
        xticks: [-40, -20, 0, 20, 40],
        yticks: items.map((_, i) => n - 1 - i),
        yticklabels: items.map(d => d[0]),
        gridX: true,
        gridDash: '2.5,3',
        xlabel: 'Standardized Effect Size Δ (%) vs. Control',
        xLabelOffset: 36,
        tickSize: 9.8
      });

      let body = frame.bg;
      // Subtle horizontal guide lines
      items.forEach((item, idx) => {
        const yi = n - 1 - idx;
        const py = ax.y(yi);
        const val = item[1];
        const col = val >= 0 ? c[0] : (c[3] || c[1]);
        body += `<line x1="${ax.x0}" y1="${py.toFixed(1)}" x2="${ax.x1}" y2="${py.toFixed(1)}" stroke="#F1F5F9" stroke-width="1"/>`;
        body += `<line x1="${ax.x(0).toFixed(1)}" y1="${py.toFixed(1)}" x2="${ax.x(val).toFixed(1)}" y2="${py.toFixed(1)}" stroke="${col}" stroke-width="2.4" stroke-linecap="round"/>`;
        body += drawMarker('circle', ax.x(val), py, 5.2, col, '#FFFFFF', 1.3);
        const tx = val >= 0 ? ax.x(val) + 8 : ax.x(val) - 8;
        const anchor = val >= 0 ? 'start' : 'end';
        const txt = (val >= 0 ? '+' : '') + val.toFixed(1) + '%';
        body += `<text x="${tx.toFixed(1)}" y="${(py + 3.4).toFixed(1)}" text-anchor="${anchor}" font-family="${FONTS.sans}" font-size="9.3" font-weight="600" fill="${col}">${txt}</text>`;
      });

      // Zero reference baseline
      body += `<line x1="${ax.x(0).toFixed(1)}" y1="${ax.y0}" x2="${ax.x(0).toFixed(1)}" y2="${ax.y1}" stroke="#1E242B" stroke-width="1.15" stroke-dasharray="4,3"/>`;
      body += `<text x="${ax.x0}" y="${ax.y0 - 11}" font-family="${FONTS.sans}" font-size="10.2" font-weight="600" fill="#334155">Pathway Enrichment Shift (FDR &lt; 0.05)</text>`;
      body += frame.fg;
      return wrapSvg(W, H, body, opts.bg || '#FFFFFF');
    },

    // 5. Joint Scatter + Linear Regression CI + Marginal Hist/KDE
    'scatter-joint-marginal'(palette, opts = {}) {
      const c = palette.colors;
      const rng = createRng(205);
      const W = 420, H = 435;
      const ax = createAxes({ x0: 58, y0: 92, w: 280, h: 286, xmin: 0, xmax: 10, ymin: 0, ymax: 12 });
      const topAx = createAxes({ x0: 58, y0: 24, w: 280, h: 58, xmin: 0, xmax: 10, ymin: 0, ymax: 0.36 });
      const rightAx = createAxes({ x0: 348, y0: 92, w: 54, h: 286, xmin: 0, xmax: 0.32, ymin: 0, ymax: 12 });

      const frame = ax.drawFrame({
        style: 'box-in',
        xticks: [0, 2, 4, 6, 8, 10],
        yticks: [0, 3, 6, 9, 12],
        gridX: true,
        gridY: true,
        gridDash: '2.5,3',
        xlabel: 'Catalyst Loading x (wt%)',
        ylabel: 'Conversion Yield y (mmol/h)',
        xLabelOffset: 36,
        yLabelOffset: 38
      });

      const groups = [
        { name: 'WT-Catalyst', col: c[0], mx: 4.1, sx: 1.55, slope: 0.88, ic: 1.5, noise: 0.85 },
        { name: 'Doped-SingleAtom', col: c[1], mx: 6.3, sx: 1.45, slope: 1.02, ic: 2.4, noise: 0.78 }
      ];

      let body = frame.bg;

      groups.forEach((g, gi) => {
        const xs = [], ys = [];
        for (let i = 0; i < 36; i++) {
          const xv = Math.max(0.6, Math.min(9.5, rng.normal(g.mx, g.sx)));
          const yv = Math.max(0.5, Math.min(11.6, g.ic + g.slope * xv + rng.normal(0, g.noise)));
          xs.push(xv);
          ys.push(yv);
        }
        const fit = olsFit(xs, ys);
        const gridX = Array.from({ length: 30 }, (_, k) => 0.5 + (9.0 * k) / 29);
        const upper = [], lower = [], linePts = [];
        gridX.forEach(xv => {
          const yh = fit.intercept + fit.slope * xv;
          const ci = 1.98 * fit.se * Math.sqrt(1 / fit.n + ((xv - fit.mx) ** 2) / fit.sxx);
          linePts.push(`${ax.x(xv).toFixed(1)},${ax.y(yh).toFixed(1)}`);
          upper.push(`${ax.x(xv).toFixed(1)},${ax.y(yh + ci).toFixed(1)}`);
          lower.unshift(`${ax.x(xv).toFixed(1)},${ax.y(yh - ci).toFixed(1)}`);
        });
        body += `<polygon points="${upper.join(' ')} ${lower.join(' ')}" fill="${g.col}" fill-opacity="0.18" stroke="none"/>`;
        body += `<polyline points="${linePts.join(' ')}" fill="none" stroke="${g.col}" stroke-width="2.0"/>`;
        xs.forEach((xv, i) => {
          body += drawMarker(gi === 0 ? 'circle' : 'square', ax.x(xv), ax.y(ys[i]), 3.3, g.col, '#FFFFFF', 0.8, 0.86);
        });

        // Top marginal KDE + histogram bars
        const binsX = 14;
        for (let b = 0; b < binsX; b++) {
          const b0 = (b / binsX) * 10;
          const b1 = ((b + 1) / binsX) * 10;
          const cnt = xs.filter(v => v >= b0 && v < b1).length / (xs.length * (10 / binsX));
          const xL = topAx.x(b0), xR = topAx.x(b1);
          const yT = topAx.y(Math.min(0.35, cnt));
          body += `<rect x="${xL.toFixed(1)}" y="${yT.toFixed(1)}" width="${(xR - xL - 0.8).toFixed(1)}" height="${(topAx.y1 - yT).toFixed(1)}" fill="${g.col}" fill-opacity="0.30"/>`;
        }
        const kxs = Array.from({ length: 45 }, (_, k) => (10 * k) / 44);
        const kys = kde1d(xs, kxs, 0.65);
        const topPoly = [`${topAx.x(0).toFixed(1)},${topAx.y1}`]
          .concat(kxs.map((v, k) => `${topAx.x(v).toFixed(1)},${topAx.y(Math.min(0.35, kys[k])).toFixed(1)}`))
          .concat([`${topAx.x(10).toFixed(1)},${topAx.y1}`]);
        body += `<polygon points="${topPoly.join(' ')}" fill="${g.col}" fill-opacity="0.14" stroke="${g.col}" stroke-width="1.5"/>`;

        // Right marginal KDE
        const ryGrid = Array.from({ length: 45 }, (_, k) => (12 * k) / 44);
        const rxDens = kde1d(ys, ryGrid, 0.75);
        const rPoly = [`${rightAx.x0},${rightAx.y(0).toFixed(1)}`]
          .concat(ryGrid.map((v, k) => `${rightAx.x(Math.min(0.31, rxDens[k])).toFixed(1)},${rightAx.y(v).toFixed(1)}`))
          .concat([`${rightAx.x0},${rightAx.y(12).toFixed(1)}`]);
        body += `<polygon points="${rPoly.join(' ')}" fill="${g.col}" fill-opacity="0.22" stroke="${g.col}" stroke-width="1.5"/>`;
      });

      body += `<line x1="${topAx.x0}" y1="${topAx.y1}" x2="${topAx.x1}" y2="${topAx.y1}" stroke="#1E242B" stroke-width="0.95"/>`;
      body += `<line x1="${rightAx.x0}" y1="${rightAx.y0}" x2="${rightAx.x0}" y2="${rightAx.y1}" stroke="#1E242B" stroke-width="0.95"/>`;

      // Stats legend box inside main plot
      body += `<rect x="${ax.x0 + 10}" y="${ax.y0 + 10}" width="138" height="44" rx="2" fill="#FFFFFF" fill-opacity="0.9" stroke="#CBD5E1" stroke-width="0.8"/>`;
      groups.forEach((g, gi) => {
        const ly = ax.y0 + 24 + gi * 18;
        body += drawMarker(gi === 0 ? 'circle' : 'square', ax.x0 + 20, ly - 3, 3.5, g.col, '#FFFFFF', 0.8);
        body += `<text x="${ax.x0 + 29}" y="${ly}" font-family="${FONTS.sans}" font-size="9.4" fill="#1E242B">${esc(g.name)}</text>`;
      });
      body += `<text x="${ax.x1 - 10}" y="${ax.y1 - 12}" text-anchor="end" font-family="${FONTS.sans}" font-size="9.5" font-style="italic" fill="#334155">r = 0.86***</text>`;

      body += frame.fg;
      return wrapSvg(W, H, body, opts.bg || '#FFFFFF');
    },

    // 6. Volcano / Quadrant Threshold Bubble Scatter + Leader Annotations
    'scatter-volcano-quadrant'(palette, opts = {}) {
      const c = palette.colors;
      const rng = createRng(309);
      const W = 420, H = 445;
      const ax = createAxes({ x0: 58, y0: 44, w: 340, h: 344, xmin: -4.5, xmax: 4.5, ymin: 0, ymax: 7.5 });
      const frame = ax.drawFrame({
        style: 'box-in',
        xticks: [-4, -2, 0, 2, 4],
        yticks: [0, 1.5, 3, 4.5, 6, 7.5],
        ylabel: '-log10(Adjusted P-value)',
        xlabel: 'log2(Fold Change)',
        xLabelOffset: 36,
        yLabelOffset: 38
      });

      let body = frame.bg;
      // Subtle quadrant shading for significant regions
      const upX = ax.x(1.0), dnX = ax.x(-1.0), sigY = ax.y(1.3);
      body += `<rect x="${upX.toFixed(1)}" y="${ax.y0}" width="${(ax.x1 - upX).toFixed(1)}" height="${(sigY - ax.y0).toFixed(1)}" fill="${c[0]}" fill-opacity="0.045"/>`;
      body += `<rect x="${ax.x0}" y="${ax.y0}" width="${(dnX - ax.x0).toFixed(1)}" height="${(sigY - ax.y0).toFixed(1)}" fill="${c[1]}" fill-opacity="0.045"/>`;

      // Threshold dashed lines
      body += `<line x1="${upX.toFixed(1)}" y1="${ax.y0}" x2="${upX.toFixed(1)}" y2="${ax.y1}" stroke="#64748B" stroke-width="1" stroke-dasharray="4,3"/>`;
      body += `<line x1="${dnX.toFixed(1)}" y1="${ax.y0}" x2="${dnX.toFixed(1)}" y2="${ax.y1}" stroke="#64748B" stroke-width="1" stroke-dasharray="4,3"/>`;
      body += `<line x1="${ax.x0}" y1="${sigY.toFixed(1)}" x2="${ax.x1}" y2="${sigY.toFixed(1)}" stroke="#64748B" stroke-width="1" stroke-dasharray="4,3"/>`;

      const points = [];
      for (let i = 0; i < 135; i++) {
        const fc = rng.normal(0, 1.55);
        const baseP = Math.abs(fc) * 0.95 + Math.abs(rng.normal(0.5, 1.15));
        const nlp = Math.max(0.08, Math.min(6.9, baseP));
        const sz = 2.4 + rng() * 3.8;
        points.push({ fc, nlp, sz });
      }

      // Highlighted labeled hits
      const hits = [
        { label: 'SPP1', fc: 3.15, nlp: 6.35, sz: 6.2, dx: 24, dy: -12 },
        { label: 'CXCL9', fc: 2.45, nlp: 5.15, sz: 5.4, dx: 28, dy: 4 },
        { label: 'MMP12', fc: 1.85, nlp: 4.10, sz: 4.8, dx: 28, dy: 10 },
        { label: 'APOE', fc: -2.95, nlp: 5.85, sz: 6.0, dx: -26, dy: -12 },
        { label: 'TREM2', fc: -2.15, nlp: 4.45, sz: 5.1, dx: -26, dy: 10 }
      ];

      points.forEach(p => {
        const isUp = p.fc >= 1.0 && p.nlp >= 1.3;
        const isDn = p.fc <= -1.0 && p.nlp >= 1.3;
        const col = isUp ? c[0] : (isDn ? c[1] : '#CBD5E1');
        const op = (isUp || isDn) ? 0.78 : 0.55;
        body += `<circle cx="${ax.x(p.fc).toFixed(1)}" cy="${ax.y(p.nlp).toFixed(1)}" r="${p.sz.toFixed(1)}" fill="${col}" fill-opacity="${op}" stroke="#FFFFFF" stroke-width="0.6"/>`;
      });

      hits.forEach(h => {
        const col = h.fc > 0 ? c[0] : c[1];
        const px = ax.x(h.fc), py = ax.y(h.nlp);
        const lx = px + h.dx, ly = py + h.dy;
        body += `<line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="${lx.toFixed(1)}" y2="${ly.toFixed(1)}" stroke="#1E242B" stroke-width="0.9"/>`;
        body += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${h.sz.toFixed(1)}" fill="${col}" stroke="#1E242B" stroke-width="1.2"/>`;
        const anchor = h.dx >= 0 ? 'start' : 'end';
        body += `<text x="${(lx + (h.dx >= 0 ? 3 : -3)).toFixed(1)}" y="${(ly + 3.2).toFixed(1)}" text-anchor="${anchor}" font-family="${FONTS.sans}" font-size="9.5" font-weight="600" fill="#111827">${esc(h.label)}</text>`;
      });

      // Top counts banner
      body += `<text x="${ax.x0}" y="${ax.y0 - 11}" font-family="${FONTS.sans}" font-size="9.8" font-weight="600" fill="${c[1]}">● Down: 28</text>`;
      body += `<text x="${(ax.x0 + ax.x1) / 2}" y="${ax.y0 - 11}" text-anchor="middle" font-family="${FONTS.sans}" font-size="9.5" fill="#64748B">Bubble size ∝ BaseMean</text>`;
      body += `<text x="${ax.x1}" y="${ax.y0 - 11}" text-anchor="end" font-family="${FONTS.sans}" font-size="9.8" font-weight="600" fill="${c[0]}">● Up: 34</text>`;

      body += frame.fg;
      return wrapSvg(W, H, body, opts.bg || '#FFFFFF');
    },

    // 7. Paired Pre-Post Slopegraph + Cohort Mean Errorbars
    'scatter-paired-slope'(palette, opts = {}) {
      const c = palette.colors;
      const rng = createRng(412);
      const W = 420, H = 480;
      const ax = createAxes({ x0: 62, y0: 44, w: 334, h: 380, xmin: -0.45, xmax: 3.45, ymin: 15, ymax: 95 });
      const frame = ax.drawFrame({
        style: 'despine',
        xticks: [0.35, 1.15, 2.05, 2.85],
        xticklabels: ['Baseline', 'Week 12', 'Baseline', 'Week 12'],
        yticks: [20, 35, 50, 65, 80, 95],
        gridY: true,
        gridDash: '2.5,3',
        ylabel: 'Functional Recovery Score',
        xlabel: '',
        yLabelOffset: 40
      });

      let body = frame.bg;
      const cohorts = [
        { name: 'Placebo Arm (n=14)', xPre: 0.35, xPost: 1.15, col: c[3] || c[1], mPre: 44, mDelta: 3.5, sd: 8.5, pText: 'ns' },
        { name: 'Intervention Arm (n=14)', xPre: 2.05, xPost: 2.85, col: c[0], mPre: 43, mDelta: 26.5, sd: 9.0, pText: '***' }
      ];

      // Divider between cohorts
      body += `<line x1="${ax.x(1.6).toFixed(1)}" y1="${ax.y0}" x2="${ax.x(1.6).toFixed(1)}" y2="${ax.y1}" stroke="#E2E8F0" stroke-width="1.1" stroke-dasharray="4,4"/>`;

      cohorts.forEach(ch => {
        const pres = [], posts = [];
        for (let i = 0; i < 14; i++) {
          const pre = rng.normal(ch.mPre, ch.sd);
          const post = Math.min(91, Math.max(20, pre + rng.normal(ch.mDelta, 5.8)));
          pres.push(pre);
          posts.push(post);
          const j1 = (rng() - 0.5) * 0.07;
          const j2 = (rng() - 0.5) * 0.07;
          body += `<line x1="${ax.x(ch.xPre + j1).toFixed(1)}" y1="${ax.y(pre).toFixed(1)}" x2="${ax.x(ch.xPost + j2).toFixed(1)}" y2="${ax.y(post).toFixed(1)}" stroke="${ch.col}" stroke-opacity="0.32" stroke-width="1.2"/>`;
          body += drawMarker('circle', ax.x(ch.xPre + j1), ax.y(pre), 3.1, '#FFFFFF', ch.col, 1.35, 0.9);
          body += drawMarker('circle', ax.x(ch.xPost + j2), ax.y(post), 3.1, ch.col, '#FFFFFF', 0.85, 0.9);
        }

        // Bold group mean trajectory + SEM bars
        const mp1 = mean(pres), mp2 = mean(posts);
        const se1 = std(pres) / Math.sqrt(14) * 1.96;
        const se2 = std(posts) / Math.sqrt(14) * 1.96;
        const mx1 = ax.x(ch.xPre - 0.16), mx2 = ax.x(ch.xPost + 0.16);
        body += `<line x1="${ax.x(ch.xPre).toFixed(1)}" y1="${ax.y(mp1).toFixed(1)}" x2="${ax.x(ch.xPost).toFixed(1)}" y2="${ax.y(mp2).toFixed(1)}" stroke="#111827" stroke-width="2.2"/>`;
        body += drawErrorBar(mx1, ax.y(mp1 + se1), ax.y(mp1), 3.5, '#111827', 1.5);
        body += drawMarker('diamond', mx1, ax.y(mp1), 4.2, ch.col, '#111827', 1.1);
        body += drawErrorBar(mx2, ax.y(mp2 + se2), ax.y(mp2), 3.5, '#111827', 1.5);
        body += drawMarker('diamond', mx2, ax.y(mp2), 4.2, ch.col, '#111827', 1.1);

        body += drawSigBracket(ax.x(ch.xPre), ax.x(ch.xPost), ax.y(88), ch.pText);
        body += `<text x="${ax.x((ch.xPre + ch.xPost) / 2).toFixed(1)}" y="${(ax.y1 + 38).toFixed(1)}" text-anchor="middle" font-family="${FONTS.sans}" font-size="10.2" font-weight="600" fill="${ch.col}">${esc(ch.name)}</text>`;
      });

      body += frame.fg;
      return wrapSvg(W, H, body, opts.bg || '#FFFFFF');
    },

    // 8. 2D KDE Density Contours + Outlier Scatter
    'scatter-kde-contour'(palette, opts = {}) {
      const rng = createRng(523);
      const W = 420, H = 400;
      const ax = createAxes({ x0: 58, y0: 36, w: 292, h: 306, xmin: -3, xmax: 3, ymin: -3, ymax: 3, font: FONTS.serif });
      const frame = ax.drawFrame({
        style: 'box-in',
        xticks: [-3, -1.5, 0, 1.5, 3],
        yticks: [-3, -1.5, 0, 1.5, 3],
        xMinor: 3,
        yMinor: 3,
        xlabel: 'Latent Principal Mode z₁',
        ylabel: 'Latent Principal Mode z₂',
        xLabelOffset: 36,
        yLabelOffset: 40
      });

      // Analytical bimodal 2D density grid (44 x 44)
      const nx = 44, ny = 44;
      const grid = [];
      const densityAt = (x, y) => {
        const g1 = 0.72 * Math.exp(-0.5 * (((x + 0.75) / 0.88) ** 2 + ((y + 0.55) / 0.82) ** 2 - 0.45 * (x + 0.75) * (y + 0.55)));
        const g2 = 0.92 * Math.exp(-0.5 * (((x - 0.95) / 0.75) ** 2 + ((y - 0.85) / 0.78) ** 2));
        return g1 + g2;
      };
      for (let j = 0; j < ny; j++) {
        const row = [];
        const yv = -3 + (6 * j) / (ny - 1);
        for (let i = 0; i < nx; i++) {
          const xv = -3 + (6 * i) / (nx - 1);
          row.push(densityAt(xv, yv));
        }
        grid.push(row);
      }

      let body = frame.bg;
      // Smooth discretized pixel tiles for density background + crisp marching-squares isolines
      const cw = ax.w / (nx - 1);
      const ch = ax.h / (ny - 1);
      const levels = [0.10, 0.24, 0.40, 0.58, 0.76];
      for (let j = 0; j < ny - 1; j++) {
        for (let i = 0; i < nx - 1; i++) {
          const val = 0.25 * (grid[j][i] + grid[j][i + 1] + grid[j + 1][i] + grid[j + 1][i + 1]);
          if (val < levels[0]) continue;
          let band = 0;
          levels.forEach((lv, li) => { if (val >= lv) band = li + 1; });
          const col = seqColor(palette, 0.16 + (band / levels.length) * 0.78);
          const px = ax.x0 + i * cw;
          const py = ax.y1 - (j + 1) * ch;
          body += `<rect x="${px.toFixed(1)}" y="${py.toFixed(1)}" width="${(cw + 0.7).toFixed(1)}" height="${(ch + 0.7).toFixed(1)}" fill="${col}" fill-opacity="0.86"/>`;
        }
      }

      const mapX = idx => ax.x(-3 + (6 * idx) / (nx - 1));
      const mapY = idx => ax.y(-3 + (6 * idx) / (ny - 1));
      levels.forEach((lv, li) => {
        const pathD = traceIsolineSegments(grid, nx, ny, lv, mapX, mapY);
        const strokeCol = seqColor(palette, 0.35 + (li / levels.length) * 0.65);
        body += `<path d="${pathD}" fill="none" stroke="${strokeCol}" stroke-width="1.15"/>`;
      });

      // Sparse outer tail & sample points
      for (let k = 0; k < 95; k++) {
        const mode = rng() < 0.46 ? 0 : 1;
        const xv = mode === 0 ? rng.normal(-0.75, 0.92) : rng.normal(0.95, 0.78);
        const yv = mode === 0 ? rng.normal(-0.55, 0.88) : rng.normal(0.85, 0.80);
        if (xv > -2.85 && xv < 2.85 && yv > -2.85 && yv < 2.85) {
          const d = densityAt(xv, yv);
          const col = d < 0.16 ? '#334155' : '#0F172A';
          const op = d < 0.16 ? 0.68 : 0.32;
          body += `<circle cx="${ax.x(xv).toFixed(1)}" cy="${ax.y(yv).toFixed(1)}" r="1.8" fill="${col}" fill-opacity="${op}"/>`;
        }
      }

      body += `<text x="${ax.x0 + 10}" y="${ax.y0 + 18}" font-family="${FONTS.serif}" font-size="10" fill="#1E242B">N = 2,400 events</text>`;
      body += drawColorbar(362, 36, 13, 306, t => seqColor(palette, t * 0.94), [
        { t: 0, text: '0.0' },
        { t: 0.5, text: '0.5' },
        { t: 1.0, text: '1.0' }
      ], 'Density', FONTS.serif);

      body += frame.fg;
      return wrapSvg(W, H, body, opts.bg || '#FFFFFF');
    },

    // 9. Multi-Model Hexagonal Benchmark Radar Chart
    'radar-polygon-benchmark'(palette, opts = {}) {
      const c = palette.colors;
      const W = 420, H = 418;
      const cx = 210, cy = 222, R = 128;
      const dims = ['Accuracy', 'Robustness', 'Throughput', 'Calibration', 'Data Eff.', 'Generalization'];
      const K = dims.length;
      const angleOf = i => -Math.PI / 2 + (i * 2 * Math.PI) / K;
      const pt = (i, val) => {
        const a = angleOf(i);
        const r = (val / 100) * R;
        return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
      };

      let body = '';
      // Hexagonal concentric grid rings
      [20, 40, 60, 80, 100].forEach(lv => {
        const ringPts = dims.map((_, i) => pt(i, lv).map(v => v.toFixed(1)).join(',')).join(' ');
        body += `<polygon points="${ringPts}" fill="${lv === 100 ? '#F8FAFC' : 'none'}" fill-opacity="0.5" stroke="${lv === 100 ? '#94A3B8' : '#CBD5E1'}" stroke-width="${lv === 100 ? 1.1 : 0.85}" ${lv < 100 ? 'stroke-dasharray="2.5,2.5"' : ''}/>`;
        const [tx, ty] = pt(0, lv);
        body += `<text x="${(tx + 5).toFixed(1)}" y="${(ty + 10).toFixed(1)}" font-family="${FONTS.sans}" font-size="8.6" fill="#64748B">${lv}</text>`;
      });

      // Radial spokes + outer dimension labels
      dims.forEach((lbl, i) => {
        const [xE, yE] = pt(i, 100);
        body += `<line x1="${cx}" y1="${cy}" x2="${xE.toFixed(1)}" y2="${yE.toFixed(1)}" stroke="#CBD5E1" stroke-width="0.9"/>`;
        const [xL, yL] = pt(i, 117);
        const cosA = Math.cos(angleOf(i));
        const anchor = Math.abs(cosA) < 0.2 ? 'middle' : (cosA > 0 ? 'start' : 'end');
        body += `<text x="${xL.toFixed(1)}" y="${(yL + 3.5).toFixed(1)}" text-anchor="${anchor}" font-family="${FONTS.sans}" font-size="10.4" font-weight="500" fill="#1E242B">${esc(lbl)}</text>`;
      });

      const models = [
        { name: 'Proposed (Ours)', col: c[0], vals: [93, 88, 84, 90, 86, 91] },
        { name: 'ViT-Large', col: c[1], vals: [85, 72, 64, 79, 71, 78] },
        { name: 'ConvNeXt-B', col: c[2], vals: [79, 76, 89, 74, 68, 72] }
      ];

      models.slice().reverse().forEach((m, revIdx) => {
        const pts = m.vals.map((v, i) => pt(i, v).map(n => n.toFixed(1)).join(',')).join(' ');
        body += `<polygon points="${pts}" fill="${m.col}" fill-opacity="0.17" stroke="${m.col}" stroke-width="2.1" stroke-linejoin="round"/>`;
        m.vals.forEach((v, i) => {
          const [px, py] = pt(i, v);
          body += drawMarker(revIdx === 2 ? 'circle' : (revIdx === 1 ? 'square' : 'triangle'), px, py, 3.4, m.col, '#FFFFFF', 1.0);
        });
      });

      // Top horizontal legend
      models.forEach((m, mi) => {
        const lx = 44 + mi * 118;
        body += `<line x1="${lx}" y1="26" x2="${lx + 18}" y2="26" stroke="${m.col}" stroke-width="2.3"/>`;
        body += drawMarker(mi === 0 ? 'circle' : (mi === 1 ? 'square' : 'triangle'), lx + 9, 26, 3.3, m.col, '#FFFFFF', 0.9);
        body += `<text x="${lx + 24}" y="29.5" font-family="${FONTS.sans}" font-size="9.8" font-weight="500" fill="#1E242B">${esc(m.name)}</text>`;
      });

      return wrapSvg(W, H, body, opts.bg || '#FFFFFF');
    },

    // 10. Polar Nightingale Rose / Directional Bar Chart
    'radar-nightingale-rose'(palette, opts = {}) {
      const c = palette.colors;
      const W = 420, H = 420;
      const cx = 210, cy = 220, R = 136;
      const sectors = [
        ['N', 78], ['NNE', 92], ['ENE', 84], ['E', 63],
        ['ESE', 48], ['SSE', 42], ['S', 55], ['SSW', 68],
        ['WSW', 88], ['W', 96], ['WNW', 74], ['NNW', 62]
      ];
      const N = sectors.length;
      let body = '';

      // Circular reference rings
      [25, 50, 75, 100].forEach(lv => {
        const r = (lv / 100) * R;
        body += `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="none" stroke="${lv === 100 ? '#94A3B8' : '#CBD5E1'}" stroke-width="${lv === 100 ? 1.05 : 0.8}" ${lv < 100 ? 'stroke-dasharray="3,3"' : ''}/>`;
      });

      // Spokes
      sectors.forEach((sec, i) => {
        const ang = -Math.PI / 2 + (i * 2 * Math.PI) / N;
        const xE = cx + R * Math.cos(ang);
        const yE = cy + R * Math.sin(ang);
        body += `<line x1="${cx}" y1="${cy}" x2="${xE.toFixed(1)}" y2="${yE.toFixed(1)}" stroke="#E2E8F0" stroke-width="0.8"/>`;
        const xL = cx + (R + 18) * Math.cos(ang);
        const yL = cy + (R + 18) * Math.sin(ang);
        body += `<text x="${xL.toFixed(1)}" y="${(yL + 3.5).toFixed(1)}" text-anchor="middle" font-family="${FONTS.sans}" font-size="9.8" font-weight="600" fill="#334155">${sec[0]}</text>`;
      });

      // Polar wedges (2 stacked radial tiers: Low-speed & High-speed)
      const dTheta = (2 * Math.PI) / N * 0.84;
      sectors.forEach((sec, i) => {
        const ang = -Math.PI / 2 + (i * 2 * Math.PI) / N;
        const a0 = ang - dTheta / 2;
        const a1 = ang + dTheta / 2;
        const totalR = (sec[1] / 100) * R;
        const innerR = totalR * 0.56;
        const colOuter = seqColor(palette, 0.35 + (sec[1] / 100) * 0.62);
        const colInner = c[1] || seqColor(palette, 0.28);

        const wedge = (r0, r1, fill) => {
          const x00 = cx + r0 * Math.cos(a0), y00 = cy + r0 * Math.sin(a0);
          const x01 = cx + r0 * Math.cos(a1), y01 = cy + r0 * Math.sin(a1);
          const x11 = cx + r1 * Math.cos(a1), y11 = cy + r1 * Math.sin(a1);
          const x10 = cx + r1 * Math.cos(a0), y10 = cy + r1 * Math.sin(a0);
          return `<path d="M${x00.toFixed(1)},${y00.toFixed(1)} A${r0.toFixed(1)},${r0.toFixed(1)} 0 0,1 ${x01.toFixed(1)},${y01.toFixed(1)} L${x11.toFixed(1)},${y11.toFixed(1)} A${r1.toFixed(1)},${r1.toFixed(1)} 0 0,0 ${x10.toFixed(1)},${y10.toFixed(1)} Z" fill="${fill}" fill-opacity="0.88" stroke="#FFFFFF" stroke-width="1.2"/>`;
        };
        body += wedge(8, innerR, colInner);
        body += wedge(innerR, totalR, colOuter);
      });

      // Radial tick labels along NNE axis
      [25, 50, 75, 100].forEach(lv => {
        const r = (lv / 100) * R;
        body += `<text x="${cx + 4}" y="${(cy - r + 10).toFixed(1)}" font-family="${FONTS.sans}" font-size="8.5" fill="#475569">${lv}%</text>`;
      });

      body += `<text x="210" y="26" text-anchor="middle" font-family="${FONTS.sans}" font-size="11" font-weight="600" fill="#1E242B">Directional Flux Rose Diagram (Polar Axes)</text>`;
      body += `<rect x="118" y="388" width="10" height="10" rx="2" fill="${c[1]}"/>`;
      body += `<text x="133" y="397" font-family="${FONTS.sans}" font-size="9.4" fill="#334155">Base Regime (&lt;5 m/s)</text>`;
      body += `<rect x="236" y="388" width="10" height="10" rx="2" fill="${seqColor(palette, 0.85)}"/>`;
      body += `<text x="251" y="397" font-family="${FONTS.sans}" font-size="9.4" fill="#334155">Peak Gust (&ge;5 m/s)</text>`;

      return wrapSvg(W, H, body, opts.bg || '#FFFFFF');
    },

    // 11. Unfilled Stroke-Contrast Spider Plot (Print Safe)
    'radar-spider-minimal'(palette, opts = {}) {
      const c = palette.colors;
      const W = 420, H = 425;
      const cx = 210, cy = 224, R = 128;
      const axes = ['Precision', 'Recall', 'F1-Macro', 'AUROC', 'Spec.', 'NPV', 'Latency⁻¹'];
      const K = axes.length;
      const ang = i => -Math.PI / 2 + (i * 2 * Math.PI) / K;
      const pt = (i, v) => [cx + (v / 100) * R * Math.cos(ang(i)), cy + (v / 100) * R * Math.sin(ang(i))];

      let body = '';
      [25, 50, 75, 100].forEach(lv => {
        const r = (lv / 100) * R;
        body += `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="none" stroke="${lv === 100 ? '#475569' : '#E2E8F0'}" stroke-width="${lv === 100 ? 1.15 : 0.85}"/>`;
      });

      axes.forEach((name, i) => {
        const [xE, yE] = pt(i, 100);
        body += `<line x1="${cx}" y1="${cy}" x2="${xE.toFixed(1)}" y2="${yE.toFixed(1)}" stroke="#CBD5E1" stroke-width="0.9"/>`;
        const [xL, yL] = pt(i, 117);
        const ca = Math.cos(ang(i));
        const anchor = Math.abs(ca) < 0.2 ? 'middle' : (ca > 0 ? 'start' : 'end');
        body += `<text x="${xL.toFixed(1)}" y="${(yL + 3.5).toFixed(1)}" text-anchor="${anchor}" font-family="${FONTS.serif}" font-size="10.5" fill="#111827">${esc(name)}</text>`;
      });

      const series = [
        { name: 'Ensemble-Net', col: c[0], dash: '', marker: 'circle', vals: [94, 89, 91, 96, 92, 88, 83], labelVals: true },
        { name: 'ResNet-50', col: c[1], dash: '6,3', marker: 'square', vals: [82, 78, 80, 86, 84, 79, 91], labelVals: false },
        { name: 'Linear-SVM', col: c[3] || c[2], dash: '2.5,2.5', marker: 'diamond', vals: [71, 66, 68, 74, 77, 70, 95], labelVals: false }
      ];

      series.slice().reverse().forEach(s => {
        const pts = s.vals.map((v, i) => pt(i, v).map(n => n.toFixed(1)).join(',')).join(' ');
        body += `<polygon points="${pts}" fill="none" stroke="${s.col}" stroke-width="2.0" ${s.dash ? `stroke-dasharray="${s.dash}"` : ''}/>`;
        s.vals.forEach((v, i) => {
          const [px, py] = pt(i, v);
          body += drawMarker(s.marker, px, py, 3.6, '#FFFFFF', s.col, 1.8);
          if (s.labelVals && (i === 0 || i === 3 || i === 4)) {
            body += `<text x="${(px + 6).toFixed(1)}" y="${(py - 5).toFixed(1)}" font-family="${FONTS.serif}" font-size="9.2" font-weight="600" fill="${s.col}">${v}%</text>`;
          }
        });
      });

      series.forEach((s, si) => {
        const lx = 40 + si * 120;
        body += `<line x1="${lx}" y1="26" x2="${lx + 22}" y2="26" stroke="${s.col}" stroke-width="2.0" ${s.dash ? `stroke-dasharray="${s.dash}"` : ''}/>`;
        body += drawMarker(s.marker, lx + 11, 26, 3.3, '#FFFFFF', s.col, 1.6);
        body += `<text x="${lx + 27}" y="29.5" font-family="${FONTS.serif}" font-size="9.8" fill="#111827">${esc(s.name)}</text>`;
      });

      return wrapSvg(W, H, body, opts.bg || '#FFFFFF');
    },

    // 12. Multi-Series Mean Trajectory + Shaded Confidence Ribbon (fill_between)
    'line-ci-band'(palette, opts = {}) {
      const c = palette.colors;
      const W = 420, H = 312;
      const ax = createAxes({ x0: 56, y0: 42, w: 344, h: 220, xmin: 0, xmax: 100, ymin: 40, ymax: 98 });
      const frame = ax.drawFrame({
        style: 'despine',
        xticks: [0, 20, 40, 60, 80, 100],
        yticks: [40, 55, 70, 85, 95],
        gridY: true,
        gridX: true,
        gridDash: '2.5,3',
        xlabel: 'Training Epochs',
        ylabel: 'Test Accuracy (%)',
        xLabelOffset: 34,
        yLabelOffset: 38
      });

      const xs = Array.from({ length: 41 }, (_, i) => i * 2.5);
      const curves = [
        { name: 'Ours (Adaptive)', col: c[0], dash: '', fn: x => 93.5 - 48 * Math.exp(-x / 18), sd: x => 1.4 + 2.8 * Math.exp(-x / 30) },
        { name: 'Cosine-Warmup', col: c[1], dash: '', fn: x => 87.2 - 44 * Math.exp(-x / 23), sd: x => 1.8 + 2.5 * Math.exp(-x / 35) },
        { name: 'Step-Decay', col: c[2], dash: '5,3', fn: x => 81.5 - 39 * Math.exp(-x / 27) + (x > 50 ? 2.4 : 0), sd: x => 2.1 + 2.0 * Math.exp(-x / 40) },
        { name: 'SGD-Const', col: c[3] || '#64748B', dash: '2.5,2.5', fn: x => 74.0 - 31 * Math.exp(-x / 24), sd: x => 2.4 }
      ];

      let body = frame.bg;
      curves.slice().reverse().forEach(cv => {
        const up = [], dn = [], mid = [];
        xs.forEach((x, idx) => {
          const wave = Math.sin(idx * 0.9) * 0.45;
          const m = cv.fn(x) + wave;
          const s = cv.sd(x);
          mid.push(`${ax.x(x).toFixed(1)},${ax.y(m).toFixed(1)}`);
          up.push(`${ax.x(x).toFixed(1)},${ax.y(m + s).toFixed(1)}`);
          dn.unshift(`${ax.x(x).toFixed(1)},${ax.y(m - s).toFixed(1)}`);
        });
        body += `<polygon points="${up.join(' ')} ${dn.join(' ')}" fill="${cv.col}" fill-opacity="0.17"/>`;
        body += `<polyline points="${mid.join(' ')}" fill="none" stroke="${cv.col}" stroke-width="2.1" ${cv.dash ? `stroke-dasharray="${cv.dash}"` : ''}/>`;
      });

      curves.forEach((cv, ci) => {
        const lx = 44 + ci * 92;
        body += `<rect x="${lx}" y="13" width="16" height="9" fill="${cv.col}" fill-opacity="0.22"/>`;
        body += `<line x1="${lx}" y1="17.5" x2="${lx + 16}" y2="17.5" stroke="${cv.col}" stroke-width="2.0" ${cv.dash ? `stroke-dasharray="${cv.dash}"` : ''}/>`;
        body += `<text x="${lx + 20}" y="21" font-family="${FONTS.sans}" font-size="8.9" fill="#1E242B">${esc(cv.name)}</text>`;
      });

      body += frame.fg;
      return wrapSvg(W, H, body, opts.bg || '#FFFFFF');
    },

    // 13. Spectroscopy / Kinetics Line + Inset Zoom Axes (indicate_inset_zoom)
    'line-inset-zoom'(palette, opts = {}) {
      const c = palette.colors;
      const W = 420, H = 355;
      const ax = createAxes({ x0: 58, y0: 30, w: 342, h: 274, xmin: 300, xmax: 800, ymin: 0, ymax: 1.15, font: FONTS.serif });
      const frame = ax.drawFrame({
        style: 'box-in',
        xticks: [300, 400, 500, 600, 700, 800],
        yticks: [0.0, 0.2, 0.4, 0.6, 0.8, 1.0],
        xMinor: 2,
        yMinor: 2,
        xlabel: 'Wavelength λ (nm)',
        ylabel: 'Normalized Absorbance (a.u.)',
        xLabelOffset: 36,
        yLabelOffset: 40
      });

      const specFn = (x, shift, split, amp) => {
        const p1 = amp * Math.exp(-(((x - (478 + shift)) / 14) ** 2));
        const p2 = amp * 0.82 * Math.exp(-(((x - (502 + shift + split)) / 12) ** 2));
        const shoulder = 0.24 * Math.exp(-(((x - 610) / 48) ** 2));
        const base = 0.04 + 0.08 * Math.exp(-(x - 300) / 140);
        return base + p1 + p2 + shoulder;
      };

      const samples = [
        { name: '300 K (Pristine)', col: c[0], fn: x => specFn(x, 0, 0, 0.96) },
        { name: '200 K (Annealed)', col: c[1], fn: x => specFn(x, -3, 4, 0.78) },
        { name: '80 K (Cryo)', col: c[2], fn: x => specFn(x, -6, 8, 0.62) }
      ];

      let body = frame.bg;
      const xs = Array.from({ length: 140 }, (_, i) => 300 + (500 * i) / 139);
      samples.forEach(s => {
        const pts = xs.map(x => `${ax.x(x).toFixed(1)},${ax.y(s.fn(x)).toFixed(1)}`).join(' ');
        body += `<polyline points="${pts}" fill="none" stroke="${s.col}" stroke-width="1.8"/>`;
      });

      // Zoomed region box [455..530 nm, 0.42..1.06]
      const zx0 = ax.x(455), zx1 = ax.x(530), zy0 = ax.y(1.06), zy1 = ax.y(0.42);
      body += `<rect x="${zx0.toFixed(1)}" y="${zy0.toFixed(1)}" width="${(zx1 - zx0).toFixed(1)}" height="${(zy1 - zy0).toFixed(1)}" fill="none" stroke="#475569" stroke-width="1.0" stroke-dasharray="3,2.5"/>`;

      // Inset axes in upper-right
      const inAx = createAxes({ x0: 242, y0: 48, w: 142, h: 112, xmin: 455, xmax: 530, ymin: 0.42, ymax: 1.06, font: FONTS.serif });
      body += `<line x1="${zx1.toFixed(1)}" y1="${zy0.toFixed(1)}" x2="${inAx.x0}" y2="${inAx.y0}" stroke="#64748B" stroke-width="0.85" stroke-dasharray="2.5,2.5"/>`;
      body += `<line x1="${zx1.toFixed(1)}" y1="${zy1.toFixed(1)}" x2="${inAx.x0}" y2="${inAx.y1}" stroke="#64748B" stroke-width="0.85" stroke-dasharray="2.5,2.5"/>`;
      body += `<rect x="${inAx.x0}" y="${inAx.y0}" width="${inAx.w}" height="${inAx.h}" fill="#FFFFFF" stroke="#1E242B" stroke-width="0.95"/>`;

      const inFrame = inAx.drawFrame({
        style: 'box-in',
        xticks: [465, 495, 525],
        yticks: [0.5, 0.75, 1.0],
        tickSize: 8.2
      });
      const zxs = Array.from({ length: 65 }, (_, i) => 455 + (75 * i) / 64);
      samples.forEach(s => {
        const pts = zxs.map(x => `${inAx.x(x).toFixed(1)},${inAx.y(s.fn(x)).toFixed(1)}`).join(' ');
        body += `<polyline points="${pts}" fill="none" stroke="${s.col}" stroke-width="1.65"/>`;
      });
      body += inFrame.fg;

      // Legend bottom-right
      samples.forEach((s, si) => {
        const ly = 236 + si * 17;
        body += `<line x1="252" y1="${ly}" x2="270" y2="${ly}" stroke="${s.col}" stroke-width="1.9"/>`;
        body += `<text x="276" y="${ly + 3.3}" font-family="${FONTS.serif}" font-size="9.5" fill="#111827">${esc(s.name)}</text>`;
      });

      body += frame.fg;
      return wrapSvg(W, H, body, opts.bg || '#FFFFFF');
    },

    // 14. 2x2 Small Multiples with Background Context Ghost Curves
    'line-small-multiples'(palette, opts = {}) {
      const c = palette.colors;
      const W = 420, H = 430;
      const xs = Array.from({ length: 32 }, (_, i) => i * (24 / 31));
      const panels = [
        { title: 'a  Catalyst Ni-CeO₂', col: c[0], fn: t => 18 + 72 * (1 - Math.exp(-t / 4.5)) - 0.3 * t },
        { title: 'b  Catalyst Co-ZrO₂', col: c[1], fn: t => 15 + 62 * (1 - Math.exp(-t / 6.8)) },
        { title: 'c  Catalyst Cu-ZnO', col: c[2], fn: t => 16 + 68 * (1 - Math.exp(-t / 3.8)) - 1.35 * Math.max(0, t - 8) },
        { title: 'd  Catalyst Ru-Al₂O₃', col: c[3] || c[0], fn: t => 12 + 79 * (1 / (1 + Math.exp(-(t - 8.5) / 2.4))) }
      ];

      let body = '';
      panels.forEach((p, idx) => {
        const row = Math.floor(idx / 2);
        const col = idx % 2;
        const ax = createAxes({
          x0: 54 + col * 178,
          y0: 36 + row * 182,
          w: 150,
          h: 132,
          xmin: 0,
          xmax: 24,
          ymin: 0,
          ymax: 100
        });
        const frame = ax.drawFrame({
          style: 'despine',
          xticks: [0, 8, 16, 24],
          yticks: [0, 50, 100],
          gridY: true,
          gridDash: '2,2.5',
          showXLabels: row === 1,
          showYLabels: col === 0,
          title: p.title,
          tickSize: 9.2
        });
        body += frame.bg;

        // Ghost context trajectories of all other panels
        panels.forEach((other, oi) => {
          if (oi === idx) return;
          const gPts = xs.map(t => `${ax.x(t).toFixed(1)},${ax.y(other.fn(t)).toFixed(1)}`).join(' ');
          body += `<polyline points="${gPts}" fill="none" stroke="#CBD5E1" stroke-width="1.25"/>`;
        });

        // Highlighted panel curve + subtle area fill + endpoint annotation
        const hPts = xs.map(t => `${ax.x(t).toFixed(1)},${ax.y(p.fn(t)).toFixed(1)}`);
        body += `<polygon points="${ax.x(0).toFixed(1)},${ax.y1} ${hPts.join(' ')} ${ax.x(24).toFixed(1)},${ax.y1}" fill="${p.col}" fill-opacity="0.11"/>`;
        body += `<polyline points="${hPts.join(' ')}" fill="none" stroke="${p.col}" stroke-width="2.3"/>`;
        const endY = p.fn(24);
        body += drawMarker('circle', ax.x(24), ax.y(endY), 3.5, p.col, '#FFFFFF', 1.1);
        body += `<text x="${(ax.x(24) - 5).toFixed(1)}" y="${(ax.y(endY) - 7).toFixed(1)}" text-anchor="end" font-family="${FONTS.sans}" font-size="9.2" font-weight="600" fill="${p.col}">${endY.toFixed(0)}%</text>`;

        body += frame.fg;
      });

      body += `<text x="218" y="410" text-anchor="middle" font-family="${FONTS.sans}" font-size="10.8" font-weight="500" fill="#182026">Time-on-Stream Duration (hours)</text>`;
      body += `<text x="16" y="210" text-anchor="middle" transform="rotate(-90 16 210)" font-family="${FONTS.sans}" font-size="10.8" font-weight="500" fill="#182026">CH₄ Conversion (%)</text>`;
      return wrapSvg(W, H, body, opts.bg || '#FFFFFF');
    },

    // 15. Regime-Shaded Phase Time Series with Sampled Errorbars
    'line-dual-phase'(palette, opts = {}) {
      const c = palette.colors;
      const W = 420, H = 308;
      const ax = createAxes({ x0: 56, y0: 40, w: 344, h: 218, xmin: 0, xmax: 60, ymin: 0.4, ymax: 2.6 });
      const frame = ax.drawFrame({
        style: 'box-in',
        xticks: [0, 15, 30, 45, 60],
        yticks: [0.5, 1.0, 1.5, 2.0, 2.5],
        gridY: true,
        gridDash: '2.5,3',
        xlabel: 'Elapsed Time (min)',
        ylabel: 'Normalized Flux J / J₀',
        xLabelOffset: 35,
        yLabelOffset: 38
      });

      let body = frame.bg;
      // Vertical experimental phase axvspan regions
      const xP1 = ax.x(18), xP2 = ax.x(38);
      body += `<rect x="${xP1.toFixed(1)}" y="${ax.y0}" width="${(xP2 - xP1).toFixed(1)}" height="${ax.h}" fill="${c[0]}" fill-opacity="0.08"/>`;
      body += `<line x1="${xP1.toFixed(1)}" y1="${ax.y0}" x2="${xP1.toFixed(1)}" y2="${ax.y1}" stroke="#475569" stroke-width="1" stroke-dasharray="4,3"/>`;
      body += `<line x1="${xP2.toFixed(1)}" y1="${ax.y0}" x2="${xP2.toFixed(1)}" y2="${ax.y1}" stroke="#475569" stroke-width="1" stroke-dasharray="4,3"/>`;

      body += `<text x="${((ax.x0 + xP1) / 2).toFixed(1)}" y="${ax.y0 - 9}" text-anchor="middle" font-family="${FONTS.sans}" font-size="9.4" fill="#475569">I. Baseline</text>`;
      body += `<text x="${((xP1 + xP2) / 2).toFixed(1)}" y="${ax.y0 - 9}" text-anchor="middle" font-family="${FONTS.sans}" font-size="9.4" font-weight="600" fill="${c[0]}">II. Hypoxic Stress</text>`;
      body += `<text x="${((xP2 + ax.x1) / 2).toFixed(1)}" y="${ax.y0 - 9}" text-anchor="middle" font-family="${FONTS.sans}" font-size="9.4" fill="#475569">III. Reperfusion</text>`;

      const ts = [3, 9, 15, 21, 27, 33, 39, 45, 51, 57];
      const s1 = [1.00, 1.02, 0.99, 1.62, 2.15, 2.28, 1.54, 1.22, 1.08, 1.04];
      const s2 = [1.00, 0.98, 1.01, 1.18, 1.32, 1.29, 1.12, 1.04, 1.01, 0.99];

      [
        { name: 'Wild-Type', col: c[0], marker: 'circle', ys: s1, err: 0.11 },
        { name: 'Knockout (KO)', col: c[1], marker: 'square', ys: s2, err: 0.08 }
      ].forEach(sr => {
        const pts = ts.map((t, i) => `${ax.x(t).toFixed(1)},${ax.y(sr.ys[i]).toFixed(1)}`).join(' ');
        body += `<polyline points="${pts}" fill="none" stroke="${sr.col}" stroke-width="2.0"/>`;
        ts.forEach((t, i) => {
          const px = ax.x(t), py = ax.y(sr.ys[i]);
          body += drawErrorBar(px, ax.y(sr.ys[i] + sr.err), py, 2.8, sr.col, 1.1);
          body += drawMarker(sr.marker, px, py, 3.3, sr.col, '#FFFFFF', 0.95);
        });
      });

      // Compact legend inside Phase III
      body += `<rect x="282" y="54" width="108" height="38" fill="#FFFFFF" fill-opacity="0.9" stroke="#CBD5E1" stroke-width="0.8"/>`;
      body += drawMarker('circle', 293, 65, 3.2, c[0], '#FFFFFF', 0.9);
      body += `<text x="302" y="68.5" font-family="${FONTS.sans}" font-size="9.2" fill="#1E242B">Wild-Type</text>`;
      body += drawMarker('square', 293, 81, 3.2, c[1], '#FFFFFF', 0.9);
      body += `<text x="302" y="84.5" font-family="${FONTS.sans}" font-size="9.2" fill="#1E242B">Knockout (KO)</text>`;

      body += frame.fg;
      return wrapSvg(W, H, body, opts.bg || '#FFFFFF');
    },

    // 16. Raincloud Plot (Half-Violin KDE + Slim Boxplot + Jittered Dots)
    'dist-raincloud'(palette, opts = {}) {
      const c = palette.colors;
      const rng = createRng(618);
      const W = 420, H = 380;
      const groups = [
        { name: 'Control', m: 4.2, sd: 0.85, skew: 0 },
        { name: 'Peptide-A', m: 5.8, sd: 1.05, skew: 0.4 },
        { name: 'Peptide-B', m: 7.3, sd: 0.78, skew: -0.2 },
        { name: 'Synergy', m: 8.6, sd: 0.92, skew: 0.2 }
      ];
      const ax = createAxes({ x0: 78, y0: 28, w: 320, h: 298, xmin: 1.5, xmax: 12.0, ymin: -0.55, ymax: 3.65 });
      const frame = ax.drawFrame({
        style: 'despine',
        xticks: [2, 4, 6, 8, 10, 12],
        yticks: [0, 1, 2, 3],
        yticklabels: groups.map(g => g.name),
        gridX: true,
        gridDash: '2.5,3',
        xlabel: 'Binding Affinity Score (-log Kd)',
        xLabelOffset: 36
      });

      let body = frame.bg;
      const xs = Array.from({ length: 55 }, (_, i) => 1.5 + (10.5 * i) / 54);

      groups.forEach((g, gi) => {
        const col = c[gi % c.length];
        const samples = Array.from({ length: 28 }, () => {
          const z = rng.normal(0, 1);
          return Math.max(2.0, Math.min(11.4, g.m + g.sd * z + g.skew * (z * z - 1) * 0.35));
        }).sort((a, b) => a - b);

        // Upper half-violin
        const dens = kde1d(samples, xs, 0.55);
        const maxD = Math.max(...dens);
        const baseY = ax.y(gi + 0.06);
        const vPoly = [`${ax.x(xs[0]).toFixed(1)},${baseY.toFixed(1)}`]
          .concat(xs.map((xv, k) => `${ax.x(xv).toFixed(1)},${ax.y(gi + 0.06 + (dens[k] / maxD) * 0.48).toFixed(1)}`))
          .concat([`${ax.x(xs[xs.length - 1]).toFixed(1)},${baseY.toFixed(1)}`]);
        body += `<polygon points="${vPoly.join(' ')}" fill="${col}" fill-opacity="0.58" stroke="${col}" stroke-width="1.35"/>`;

        // Slim horizontal boxplot right on gi
        const q1 = quantile(samples, 0.25);
        const med = quantile(samples, 0.50);
        const q3 = quantile(samples, 0.75);
        const wLo = samples[0], wHi = samples[samples.length - 1];
        const byMid = ax.y(gi - 0.02);
        body += `<line x1="${ax.x(wLo).toFixed(1)}" y1="${byMid.toFixed(1)}" x2="${ax.x(wHi).toFixed(1)}" y2="${byMid.toFixed(1)}" stroke="#1E242B" stroke-width="1.15"/>`;
        body += `<rect x="${ax.x(q1).toFixed(1)}" y="${(byMid - 4.5).toFixed(1)}" width="${(ax.x(q3) - ax.x(q1)).toFixed(1)}" height="9" rx="1.5" fill="#FFFFFF" stroke="#1E242B" stroke-width="1.2"/>`;
        body += `<line x1="${ax.x(med).toFixed(1)}" y1="${(byMid - 4.5).toFixed(1)}" x2="${ax.x(med).toFixed(1)}" y2="${(byMid + 4.5).toFixed(1)}" stroke="${col}" stroke-width="2.2"/>`;

        // Rain jittered points below boxplot
        samples.forEach(sv => {
          const jy = gi - 0.16 - rng() * 0.22;
          body += `<circle cx="${ax.x(sv).toFixed(1)}" cy="${ax.y(jy).toFixed(1)}" r="2.5" fill="${col}" fill-opacity="0.78" stroke="#FFFFFF" stroke-width="0.5"/>`;
        });
      });

      body += frame.fg;
      return wrapSvg(W, H, body, opts.bg || '#FFFFFF');
    },

    // 17. Statistical Boxplot with Multi-Tier P-Value Brackets
    'dist-box-signif'(palette, opts = {}) {
      const c = palette.colors;
      const rng = createRng(704);
      const W = 420, H = 435;
      const ax = createAxes({ x0: 60, y0: 34, w: 336, h: 342, xmin: -0.6, xmax: 4.6, ymin: 10, ymax: 112 });
      const frame = ax.drawFrame({
        style: 'box-in',
        xticks: [0, 1, 2, 3, 4],
        xticklabels: ['Mock', 'siRNA-1', 'siRNA-2', 'CRISPRi', 'Rescue'],
        yticks: [20, 40, 60, 80, 100],
        gridY: true,
        gridDash: '2.5,3',
        ylabel: 'Elastic Modulus E (kPa)',
        xlabel: 'Genetic Perturbation',
        xLabelOffset: 38,
        yLabelOffset: 40
      });

      const specs = [
        { m: 76, sd: 8.2 },
        { m: 54, sd: 9.1 },
        { m: 46, sd: 7.5 },
        { m: 31, sd: 6.4 },
        { m: 73, sd: 8.6 }
      ];

      let body = frame.bg;
      specs.forEach((sp, gi) => {
        const col = c[gi % c.length];
        const vals = Array.from({ length: 22 }, () => rng.normal(sp.m, sp.sd)).sort((a, b) => a - b);
        const q1 = quantile(vals, 0.25);
        const med = quantile(vals, 0.50);
        const q3 = quantile(vals, 0.75);
        const iqr = q3 - q1;
        const lo = Math.max(vals[0], q1 - 1.5 * iqr);
        const hi = Math.min(vals[vals.length - 1], q3 + 1.5 * iqr);

        const cx = ax.x(gi);
        const bxL = ax.x(gi - 0.26), bxR = ax.x(gi + 0.26);
        // Whiskers
        body += `<line x1="${cx.toFixed(1)}" y1="${ax.y(q3).toFixed(1)}" x2="${cx.toFixed(1)}" y2="${ax.y(hi).toFixed(1)}" stroke="#1E242B" stroke-width="1.15" stroke-dasharray="3,2"/>`;
        body += `<line x1="${cx.toFixed(1)}" y1="${ax.y(q1).toFixed(1)}" x2="${cx.toFixed(1)}" y2="${ax.y(lo).toFixed(1)}" stroke="#1E242B" stroke-width="1.15" stroke-dasharray="3,2"/>`;
        body += `<line x1="${(cx - 8).toFixed(1)}" y1="${ax.y(hi).toFixed(1)}" x2="${(cx + 8).toFixed(1)}" y2="${ax.y(hi).toFixed(1)}" stroke="#1E242B" stroke-width="1.15"/>`;
        body += `<line x1="${(cx - 8).toFixed(1)}" y1="${ax.y(lo).toFixed(1)}" x2="${(cx + 8).toFixed(1)}" y2="${ax.y(lo).toFixed(1)}" stroke="#1E242B" stroke-width="1.15"/>`;

        // Box + Median
        body += `<rect x="${bxL.toFixed(1)}" y="${ax.y(q3).toFixed(1)}" width="${(bxR - bxL).toFixed(1)}" height="${(ax.y(q1) - ax.y(q3)).toFixed(1)}" fill="${col}" fill-opacity="0.34" stroke="${col}" stroke-width="1.6"/>`;
        body += `<line x1="${bxL.toFixed(1)}" y1="${ax.y(med).toFixed(1)}" x2="${bxR.toFixed(1)}" y2="${ax.y(med).toFixed(1)}" stroke="#111827" stroke-width="2.1"/>`;

        // Individual jittered points
        vals.forEach(v => {
          const jx = gi + (rng() - 0.5) * 0.22;
          body += `<circle cx="${ax.x(jx).toFixed(1)}" cy="${ax.y(v).toFixed(1)}" r="2.3" fill="${col}" fill-opacity="0.72"/>`;
        });
      });

      body += drawSigBracket(ax.x(0), ax.x(1), ax.y(91), '**');
      body += drawSigBracket(ax.x(0), ax.x(3), ax.y(98.5), '***');
      body += drawSigBracket(ax.x(0), ax.x(4), ax.y(106), 'ns');
      body += frame.fg;
      return wrapSvg(W, H, body, opts.bg || '#FFFFFF');
    },

    // 18. Ridgeline / Joyplot Stacked KDE Evolution
    'dist-ridgeline'(palette, opts = {}) {
      const W = 420, H = 492;
      const temps = ['300 K', '350 K', '400 K', '450 K', '500 K', '550 K'];
      const ax = createAxes({ x0: 66, y0: 42, w: 330, h: 396, xmin: -2, xmax: 10, ymin: 0, ymax: 6.4 });
      const frame = ax.drawFrame({
        style: 'minimal',
        xticks: [-2, 0, 2, 4, 6, 8, 10],
        yticks: [0.35, 1.35, 2.35, 3.35, 4.35, 5.35],
        yticklabels: temps.slice().reverse(),
        gridX: true,
        gridDash: '2.5,3',
        xlabel: 'Activation Energy Barrier ΔE (eV)',
        xLabelOffset: 36
      });

      let body = frame.bg;
      const xs = Array.from({ length: 90 }, (_, i) => -2 + (12 * i) / 89);

      // Draw from top ridge to bottom ridge so lower ridges naturally occlude upper bases
      temps.forEach((tName, idx) => {
        const row = temps.length - 1 - idx; // top=5 down to bottom=0
        const baseVal = 0.2 + row * 1.0;
        const col = seqColor(palette, 0.18 + (idx / (temps.length - 1)) * 0.78);
        const mu1 = 1.1 + idx * 1.05;
        const mu2 = 3.2 + idx * 0.85;
        const w2 = 0.22 + idx * 0.09;

        const ys = xs.map(x => {
          const g1 = (1 - w2) * Math.exp(-0.5 * (((x - mu1) / 0.82) ** 2));
          const g2 = w2 * Math.exp(-0.5 * (((x - mu2) / 0.68) ** 2));
          return (g1 + g2) * 1.38;
        });

        const basePy = ax.y(baseVal);
        const curvePts = xs.map((x, k) => `${ax.x(x).toFixed(1)},${ax.y(baseVal + ys[k]).toFixed(1)}`);
        const poly = [`${ax.x(-2).toFixed(1)},${basePy.toFixed(1)}`]
          .concat(curvePts)
          .concat([`${ax.x(10).toFixed(1)},${basePy.toFixed(1)}`]);

        body += `<line x1="${ax.x0}" y1="${basePy.toFixed(1)}" x2="${ax.x1}" y2="${basePy.toFixed(1)}" stroke="#CBD5E1" stroke-width="0.85"/>`;
        body += `<polygon points="${poly.join(' ')}" fill="${col}" fill-opacity="0.82"/>`;
        // Crisp white halo + dark ridge outline
        body += `<polyline points="${curvePts.join(' ')}" fill="none" stroke="#FFFFFF" stroke-width="2.4"/>`;
        body += `<polyline points="${curvePts.join(' ')}" fill="none" stroke="#182026" stroke-width="1.2"/>`;

        // Mean dashed vertical tick inside ridge
        const meanX = (1 - w2) * mu1 + w2 * mu2;
        const meanIdx = Math.round(((meanX + 2) / 12) * 89);
        const meanH = ys[Math.max(0, Math.min(89, meanIdx))];
        body += `<line x1="${ax.x(meanX).toFixed(1)}" y1="${basePy.toFixed(1)}" x2="${ax.x(meanX).toFixed(1)}" y2="${ax.y(baseVal + meanH).toFixed(1)}" stroke="#FFFFFF" stroke-width="1.25" stroke-dasharray="2.5,2"/>`;
      });

      body += `<text x="${ax.x0}" y="26" font-family="${FONTS.sans}" font-size="10.5" font-weight="600" fill="#1E242B">Thermal Barrier Shift Across Annealing Temperatures</text>`;
      body += frame.fg;
      return wrapSvg(W, H, body, opts.bg || '#FFFFFF');
    },

    // 19. Empirical Cumulative Distribution Step Plot (ECDF) + KS Test
    'dist-ecdf-step'(palette, opts = {}) {
      const c = palette.colors;
      const rng = createRng(815);
      const W = 420, H = 345;
      const ax = createAxes({ x0: 58, y0: 34, w: 340, h: 256, xmin: 0, xmax: 120, ymin: 0, ymax: 1.04 });
      const frame = ax.drawFrame({
        style: 'box-in',
        xticks: [0, 20, 40, 60, 80, 100, 120],
        yticks: [0.0, 0.25, 0.50, 0.75, 1.00],
        gridX: true,
        gridY: true,
        gridDash: '2.5,3',
        xlabel: 'Tail Response Latency (ms)',
        ylabel: 'Empirical CDF  F(x)',
        xLabelOffset: 36,
        yLabelOffset: 40
      });

      let body = frame.bg;
      // P50 and P95 reference lines
      body += `<line x1="${ax.x0}" y1="${ax.y(0.5).toFixed(1)}" x2="${ax.x1}" y2="${ax.y(0.5).toFixed(1)}" stroke="#94A3B8" stroke-width="0.9" stroke-dasharray="4,3"/>`;
      body += `<line x1="${ax.x0}" y1="${ax.y(0.95).toFixed(1)}" x2="${ax.x1}" y2="${ax.y(0.95).toFixed(1)}" stroke="#94A3B8" stroke-width="0.9" stroke-dasharray="4,3"/>`;
      body += `<text x="${ax.x1 - 4}" y="${(ax.y(0.95) - 4).toFixed(1)}" text-anchor="end" font-family="${FONTS.sans}" font-size="8.6" fill="#64748B">P95</text>`;

      const dists = [
        { name: 'Zero-Copy Kernel', col: c[0], dash: '', mu: 28, sd: 9.5 },
        { name: 'Async-Batch', col: c[1], dash: '6,3', mu: 49, sd: 14.5 },
        { name: 'TCP-Baseline', col: c[2], dash: '2.5,2.5', mu: 68, sd: 18.0 }
      ];

      const ecdfSamples = [];
      dists.forEach(d => {
        const arr = Array.from({ length: 42 }, () => Math.max(3, Math.min(116, rng.normal(d.mu, d.sd)))).sort((a, b) => a - b);
        ecdfSamples.push(arr);
        let path = `M${ax.x(0).toFixed(1)},${ax.y(0).toFixed(1)}`;
        arr.forEach((v, i) => {
          const pPrev = i / arr.length;
          const pNext = (i + 1) / arr.length;
          path += ` L${ax.x(v).toFixed(1)},${ax.y(pPrev).toFixed(1)} L${ax.x(v).toFixed(1)},${ax.y(pNext).toFixed(1)}`;
        });
        path += ` L${ax.x(120).toFixed(1)},${ax.y(1).toFixed(1)}`;
        body += `<path d="${path}" fill="none" stroke="${d.col}" stroke-width="2.0" ${d.dash ? `stroke-dasharray="${d.dash}"` : ''}/>`;
      });

      // KS statistic annotation at x = 38
      const ksX = 38;
      const f0 = ecdfSamples[0].filter(v => v <= ksX).length / ecdfSamples[0].length;
      const f1 = ecdfSamples[1].filter(v => v <= ksX).length / ecdfSamples[1].length;
      const px = ax.x(ksX), py0 = ax.y(f0), py1 = ax.y(f1);
      body += `<line x1="${px.toFixed(1)}" y1="${py0.toFixed(1)}" x2="${px.toFixed(1)}" y2="${py1.toFixed(1)}" stroke="#111827" stroke-width="1.35"/>`;
      body += drawMarker('circle', px, py0, 2.8, '#111827', '#FFFFFF', 0.8);
      body += drawMarker('circle', px, py1, 2.8, '#111827', '#FFFFFF', 0.8);
      body += `<text x="${(px + 6).toFixed(1)}" y="${((py0 + py1) / 2 + 3).toFixed(1)}" font-family="${FONTS.sans}" font-size="9.2" font-weight="600" fill="#111827">D_KS = ${(f0 - f1).toFixed(2)}***</text>`;

      // Bottom-right legend
      body += `<rect x="242" y="198" width="144" height="62" fill="#FFFFFF" fill-opacity="0.92" stroke="#CBD5E1" stroke-width="0.8"/>`;
      dists.forEach((d, di) => {
        const ly = 214 + di * 18;
        body += `<line x1="250" y1="${ly - 3}" x2="270" y2="${ly - 3}" stroke="${d.col}" stroke-width="2.0" ${d.dash ? `stroke-dasharray="${d.dash}"` : ''}/>`;
        body += `<text x="276" y="${ly}" font-family="${FONTS.sans}" font-size="9.2" fill="#1E242B">${esc(d.name)}</text>`;
      });

      body += frame.fg;
      return wrapSvg(W, H, body, opts.bg || '#FFFFFF');
    },

    // 20. Lower-Triangle Annotated Correlation Matrix Heatmap
    'matrix-corr-tri'(palette, opts = {}) {
      const W = 420, H = 412;
      const vars = ['TOC', 'TN', 'pH', 'Moisture', 'Enzyme-A', 'Microb-C', 'CO₂-Flux'];
      const K = vars.length;
      const corr = [
        [ 1.00,  0.84, -0.46,  0.62,  0.76,  0.81,  0.72],
        [ 0.84,  1.00, -0.38,  0.55,  0.71,  0.78,  0.66],
        [-0.46, -0.38,  1.00, -0.29, -0.58, -0.52, -0.64],
        [ 0.62,  0.55, -0.29,  1.00,  0.49,  0.57,  0.61],
        [ 0.76,  0.71, -0.58,  0.49,  1.00,  0.83,  0.79],
        [ 0.81,  0.78, -0.52,  0.57,  0.83,  1.00,  0.88],
        [ 0.72,  0.66, -0.64,  0.61,  0.79,  0.88,  1.00]
      ];

      const x0 = 68, y0 = 36, size = 278;
      const cell = size / K;
      let body = '';

      for (let r = 0; r < K; r++) {
        for (let cIdx = 0; cIdx <= r; cIdx++) {
          const v = corr[r][cIdx];
          const bg = divColor(palette, v);
          const fg = contrastText(bg);
          const px = x0 + cIdx * cell;
          const py = y0 + r * cell;
          body += `<rect x="${px.toFixed(1)}" y="${py.toFixed(1)}" width="${cell.toFixed(1)}" height="${cell.toFixed(1)}" rx="2" fill="${bg}" stroke="#FFFFFF" stroke-width="2.2"/>`;
          const stars = r === cIdx ? '' : (Math.abs(v) >= 0.75 ? '**' : (Math.abs(v) >= 0.50 ? '*' : ''));
          const txt = v.toFixed(2) + stars;
          body += `<text x="${(px + cell / 2).toFixed(1)}" y="${(py + cell / 2 + 3.3).toFixed(1)}" text-anchor="middle" font-family="${FONTS.sans}" font-size="8.6" font-weight="${r === cIdx ? '600' : '500'}" fill="${fg}">${txt}</text>`;
        }
      }

      // Row & Column labels
      vars.forEach((name, i) => {
        const py = y0 + (i + 0.5) * cell;
        body += `<text x="${(x0 - 7).toFixed(1)}" y="${(py + 3.4).toFixed(1)}" text-anchor="end" font-family="${FONTS.sans}" font-size="9.6" font-weight="500" fill="#1E242B">${esc(name)}</text>`;
        const px = x0 + (i + 0.5) * cell;
        const ly = y0 + size + 12;
        body += `<text x="${px.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="end" transform="rotate(-38 ${px.toFixed(1)} ${ly.toFixed(1)})" font-family="${FONTS.sans}" font-size="9.6" font-weight="500" fill="#1E242B">${esc(name)}</text>`;
      });

      body += `<text x="${x0}" y="22" font-family="${FONTS.sans}" font-size="10.4" font-weight="600" fill="#1E242B">Pearson Correlation Matrix (* / **)</text>`;
      body += drawColorbar(360, 48, 13, 254, t => divColor(palette, t * 2 - 1), [
        { t: 0.0, text: '-1.0' },
        { t: 0.25, text: '-0.5' },
        { t: 0.5, text: '0.0' },
        { t: 0.75, text: '+0.5' },
        { t: 1.0, text: '+1.0' }
      ], 'r', FONTS.sans);

      return wrapSvg(W, H, body, opts.bg || '#FFFFFF');
    },

    // 21. Clustered Z-Score Expression Heatmap + Sample Group Annotation Bar
    'matrix-clustered-zscore'(palette, opts = {}) {
      const c = palette.colors;
      const rng = createRng(908);
      const W = 420, H = 492;
      const genes = ['STAT1', 'IRF7', 'ISG15', 'CXCL10', 'IFIT3', 'MX1', 'OAS2', 'MKI67', 'TOP2A', 'CDK1', 'PCNA', 'COL1A1', 'FN1', 'ACTA2'];
      const nR = genes.length, nC = 12;
      const gx0 = 56, gy0 = 64, gw = 246, gh = 368;
      const cw = gw / nC, ch = gh / nR;

      let body = '';
      // Left hierarchical dendrogram stylized brackets
      const dx = 22;
      body += `<path d="M${gx0 - 5},${gy0 + ch * 1.5} H${dx + 14} V${gy0 + ch * 5.5} H${gx0 - 5} M${dx + 14},${gy0 + ch * 3.5} H${dx} V${gy0 + ch * 9.5} H${dx + 14} M${gx0 - 5},${gy0 + ch * 7.8} H${dx + 14} V${gy0 + ch * 10.5} H${gx0 - 5} M${gx0 - 5},${gy0 + ch * 11.5} H${dx + 10} V${gy0 + ch * 13.2} H${gx0 - 5}" fill="none" stroke="#475569" stroke-width="1.0"/>`;

      // Top sample group color bar (4 Control, 4 Acute, 4 Chronic)
      const groups = [
        { name: 'Control', col: c[2] || '#64748B', start: 0, len: 4 },
        { name: 'Acute', col: c[0], start: 4, len: 4 },
        { name: 'Chronic', col: c[1], start: 8, len: 4 }
      ];
      groups.forEach(g => {
        for (let k = 0; k < g.len; k++) {
          const px = gx0 + (g.start + k) * cw;
          body += `<rect x="${px.toFixed(1)}" y="${(gy0 - 15).toFixed(1)}" width="${(cw - 1).toFixed(1)}" height="10" fill="${g.col}"/>`;
        }
      });

      // Top group legend
      groups.forEach((g, gi) => {
        const lx = gx0 + gi * 84;
        body += `<rect x="${lx}" y="22" width="10" height="10" rx="1.5" fill="${g.col}"/>`;
        body += `<text x="${lx + 14}" y="30.5" font-family="${FONTS.sans}" font-size="9.4" font-weight="500" fill="#1E242B">${esc(g.name)}</text>`;
      });

      // Heatmap Z-score cells (3 structured gene modules)
      for (let r = 0; r < nR; r++) {
        for (let colIdx = 0; colIdx < nC; colIdx++) {
          let base = 0;
          if (r < 7) base = colIdx < 4 ? -0.75 : (colIdx < 8 ? 0.85 : 0.15);
          else if (r < 11) base = colIdx < 4 ? -0.45 : (colIdx < 8 ? 0.35 : 0.78);
          else base = colIdx < 4 ? 0.72 : (colIdx < 8 ? -0.62 : -0.35);
          const z = Math.max(-1, Math.min(1, base + rng.normal(0, 0.22)));
          const fill = divColor(palette, z);
          const px = gx0 + colIdx * cw;
          const py = gy0 + r * ch;
          body += `<rect x="${px.toFixed(1)}" y="${py.toFixed(1)}" width="${cw.toFixed(1)}" height="${ch.toFixed(1)}" fill="${fill}" stroke="#FFFFFF" stroke-width="0.65"/>`;
        }
        const py = gy0 + (r + 0.5) * ch;
        body += `<text x="${(gx0 + gw + 6).toFixed(1)}" y="${(py + 3.3).toFixed(1)}" font-family="${FONTS.sans}" font-size="9.1" font-style="italic" fill="#1E242B">${genes[r]}</text>`;
      }

      body += `<rect x="${gx0}" y="${gy0}" width="${gw}" height="${gh}" fill="none" stroke="#1E242B" stroke-width="0.9"/>`;
      for (let colIdx = 0; colIdx < nC; colIdx++) {
        const px = gx0 + (colIdx + 0.5) * cw;
        body += `<text x="${px.toFixed(1)}" y="${(gy0 + gh + 14).toFixed(1)}" text-anchor="middle" font-family="${FONTS.sans}" font-size="8.4" fill="#475569">S${colIdx + 1}</text>`;
      }

      body += drawColorbar(368, 92, 12, 260, t => divColor(palette, t * 2 - 1), [
        { t: 0.0, text: '-2' },
        { t: 0.5, text: '0' },
        { t: 1.0, text: '+2' }
      ], 'Z-score', FONTS.sans);

      return wrapSvg(W, H, body, opts.bg || '#FFFFFF');
    },

    // 22. 2D Response Surface Filled Contours + Inline clabel Isolines
    'matrix-contour-field'(palette, opts = {}) {
      const c = palette.colors;
      const W = 420, H = 366;
      const ax = createAxes({ x0: 58, y0: 34, w: 292, h: 274, xmin: 150, xmax: 350, ymin: 1.0, ymax: 5.0, font: FONTS.serif });
      const frame = ax.drawFrame({
        style: 'box-in',
        xticks: [150, 200, 250, 300, 350],
        yticks: [1, 2, 3, 4, 5],
        xMinor: 2,
        yMinor: 2,
        xlabel: 'Reaction Temperature T (°C)',
        ylabel: 'Reactor Pressure P (MPa)',
        xLabelOffset: 36,
        yLabelOffset: 38
      });

      const nx = 48, ny = 48;
      const fieldFn = (T, P) => {
        const u = (T - 275) / 58;
        const v = (P - 3.45) / 1.15;
        const peak1 = 0.94 * Math.exp(-0.5 * (u * u + v * v - 0.5 * u * v));
        const ridge = 0.34 * Math.exp(-0.5 * (((T - 195) / 48) ** 2 + ((P - 2.1) / 1.1) ** 2));
        return Math.min(0.99, peak1 + ridge);
      };

      const grid = [];
      for (let j = 0; j < ny; j++) {
        const P = 1 + (4 * j) / (ny - 1);
        const row = [];
        for (let i = 0; i < nx; i++) {
          const T = 150 + (200 * i) / (nx - 1);
          row.push(fieldFn(T, P));
        }
        grid.push(row);
      }

      let body = frame.bg;
      const cw = ax.w / (nx - 1), ch = ax.h / (ny - 1);
      const bands = 9;
      for (let j = 0; j < ny - 1; j++) {
        for (let i = 0; i < nx - 1; i++) {
          const val = 0.25 * (grid[j][i] + grid[j][i + 1] + grid[j + 1][i] + grid[j + 1][i + 1]);
          const q = Math.floor(val * bands) / (bands - 1);
          const col = seqColor(palette, Math.min(1, Math.max(0.05, q)));
          const px = ax.x0 + i * cw;
          const py = ax.y1 - (j + 1) * ch;
          body += `<rect x="${px.toFixed(1)}" y="${py.toFixed(1)}" width="${(cw + 0.7).toFixed(1)}" height="${(ch + 0.7).toFixed(1)}" fill="${col}"/>`;
        }
      }

      const mapX = idx => ax.x(150 + (200 * idx) / (nx - 1));
      const mapY = idx => ax.y(1 + (4 * idx) / (ny - 1));
      [0.20, 0.40, 0.60, 0.80].forEach(lv => {
        const d = traceIsolineSegments(grid, nx, ny, lv, mapX, mapY);
        body += `<path d="${d}" fill="none" stroke="#1E242B" stroke-opacity="0.72" stroke-width="0.95"/>`;
      });

      // Inline contour value labels (clabel style) + optimal point star
      const clabels = [
        { T: 196, P: 3.1, txt: '0.20' },
        { T: 224, P: 2.7, txt: '0.40' },
        { T: 242, P: 3.05, txt: '0.60' },
        { T: 256, P: 3.25, txt: '0.80' }
      ];
      clabels.forEach(cl => {
        const px = ax.x(cl.T), py = ax.y(cl.P);
        body += `<rect x="${(px - 12).toFixed(1)}" y="${(py - 6).toFixed(1)}" width="24" height="11" rx="2" fill="#FFFFFF" fill-opacity="0.82"/>`;
        body += `<text x="${px.toFixed(1)}" y="${(py + 2.8).toFixed(1)}" text-anchor="middle" font-family="${FONTS.serif}" font-size="8.4" font-weight="600" fill="#111827">${cl.txt}</text>`;
      });

      // Optimum marker
      const ox = ax.x(275), oy = ax.y(3.45);
      body += drawMarker('diamond', ox, oy, 4.8, c[0], '#FFFFFF', 1.3);
      body += `<text x="${(ox + 8).toFixed(1)}" y="${(oy + 3).toFixed(1)}" font-family="${FONTS.serif}" font-size="9.3" font-weight="600" fill="#FFFFFF">Optimum (94%)</text>`;

      body += drawColorbar(362, 34, 13, 274, t => seqColor(palette, t), [
        { t: 0.0, text: '0.0' },
        { t: 0.5, text: '0.5' },
        { t: 1.0, text: '1.0' }
      ], 'Selectivity', FONTS.serif);

      body += frame.fg;
      return wrapSvg(W, H, body, opts.bg || '#FFFFFF');
    },

    // 23. Meta-Analysis / Ablation Forest Plot (OR / HR + 95% CI + Table)
    'comp-forest-plot'(palette, opts = {}) {
      const c = palette.colors;
      const W = 420, H = 496;
      const rows = [
        { name: 'Age < 65 yr', hr: 0.68, lo: 0.52, hi: 0.89, wt: 4.8 },
        { name: 'Age ≥ 65 yr', hr: 0.74, lo: 0.58, hi: 0.94, wt: 4.5 },
        { name: 'Female Cohort', hr: 0.64, lo: 0.47, hi: 0.86, wt: 4.2 },
        { name: 'Male Cohort', hr: 0.77, lo: 0.61, hi: 0.98, wt: 4.6 },
        { name: 'Stage II Disease', hr: 0.59, lo: 0.41, hi: 0.84, wt: 3.8 },
        { name: 'Stage III Disease', hr: 0.72, lo: 0.56, hi: 0.92, wt: 4.7 },
        { name: 'Biomarker High', hr: 0.51, lo: 0.36, hi: 0.71, wt: 4.3 },
        { name: 'Biomarker Low', hr: 0.94, lo: 0.71, hi: 1.24, wt: 3.9 }
      ];

      const ax = createAxes({ x0: 224, y0: 56, w: 176, h: 368, xmin: 0.25, xmax: 1.55, ymin: -1.2, ymax: rows.length - 0.2 });
      let body = '';

      // Header bar
      body += `<line x1="16" y1="30" x2="404" y2="30" stroke="#1E242B" stroke-width="1.3"/>`;
      body += `<line x1="16" y1="52" x2="404" y2="52" stroke="#1E242B" stroke-width="0.9"/>`;
      body += `<text x="20" y="45" font-family="${FONTS.sans}" font-size="9.6" font-weight="600" fill="#111827">Subgroup</text>`;
      body += `<text x="132" y="45" font-family="${FONTS.sans}" font-size="9.6" font-weight="600" fill="#111827">HR (95% CI)</text>`;
      body += `<text x="312" y="45" text-anchor="middle" font-family="${FONTS.sans}" font-size="9.6" font-weight="600" fill="#111827">Hazard Ratio</text>`;

      rows.forEach((r, idx) => {
        const yi = rows.length - 1 - idx;
        const py = ax.y(yi);
        if (idx % 2 === 0) {
          body += `<rect x="16" y="${(py - 16).toFixed(1)}" width="388" height="32" fill="#F8FAFC"/>`;
        }
        const fav = r.hi < 1.0 ? c[0] : (c[3] || '#64748B');
        body += `<text x="20" y="${(py + 3.5).toFixed(1)}" font-family="${FONTS.sans}" font-size="9.5" fill="#1E242B">${esc(r.name)}</text>`;
        body += `<text x="132" y="${(py + 3.5).toFixed(1)}" font-family="${FONTS.mono}" font-size="8.8" fill="#334155">${r.hr.toFixed(2)} (${r.lo.toFixed(2)}–${r.hi.toFixed(2)})</text>`;

        body += `<line x1="${ax.x(r.lo).toFixed(1)}" y1="${py.toFixed(1)}" x2="${ax.x(r.hi).toFixed(1)}" y2="${py.toFixed(1)}" stroke="${fav}" stroke-width="1.6"/>`;
        body += `<line x1="${ax.x(r.lo).toFixed(1)}" y1="${(py - 3.5).toFixed(1)}" x2="${ax.x(r.lo).toFixed(1)}" y2="${(py + 3.5).toFixed(1)}" stroke="${fav}" stroke-width="1.3"/>`;
        body += `<line x1="${ax.x(r.hi).toFixed(1)}" y1="${(py - 3.5).toFixed(1)}" x2="${ax.x(r.hi).toFixed(1)}" y2="${(py + 3.5).toFixed(1)}" stroke="${fav}" stroke-width="1.3"/>`;
        body += drawMarker('square', ax.x(r.hr), py, r.wt, fav, '#FFFFFF', 0.8);
      });

      // Null effect line HR = 1.0
      body += `<line x1="${ax.x(1.0).toFixed(1)}" y1="54" x2="${ax.x(1.0).toFixed(1)}" y2="${ax.y1}" stroke="#1E242B" stroke-width="1.1" stroke-dasharray="4,3"/>`;

      // Summary Diamond at bottom (yi = -0.65)
      const pySum = ax.y(-0.65);
      body += `<line x1="16" y1="${(pySum - 18).toFixed(1)}" x2="404" y2="${(pySum - 18).toFixed(1)}" stroke="#CBD5E1" stroke-width="0.9"/>`;
      body += `<text x="20" y="${(pySum + 3.5).toFixed(1)}" font-family="${FONTS.sans}" font-size="9.8" font-weight="700" fill="#111827">Overall Pooled</text>`;
      body += `<text x="132" y="${(pySum + 3.5).toFixed(1)}" font-family="${FONTS.mono}" font-size="8.9" font-weight="700" fill="#111827">0.69 (0.61–0.78)</text>`;
      const dPts = `${ax.x(0.61).toFixed(1)},${pySum.toFixed(1)} ${ax.x(0.69).toFixed(1)},${(pySum - 6.5).toFixed(1)} ${ax.x(0.78).toFixed(1)},${pySum.toFixed(1)} ${ax.x(0.69).toFixed(1)},${(pySum + 6.5).toFixed(1)}`;
      body += `<polygon points="${dPts}" fill="${c[1]}" stroke="#111827" stroke-width="1.0"/>`;

      const frame = ax.drawFrame({
        style: 'minimal',
        xticks: [0.4, 0.7, 1.0, 1.3],
        yticks: [],
        showYLabels: false,
        xlabel: '← Favors Treatment      Favors Control →',
        xLabelOffset: 34,
        tickSize: 9.2,
        labelSize: 9.6
      });
      body += frame.fg;
      return wrapSvg(W, H, body, opts.bg || '#FFFFFF');
    },

    // 24. Two-Panel Shared-X Composite Figure: (a) Model Fit + (b) Residuals (GridSpec)
    'comp-panel-ab'(palette, opts = {}) {
      const c = palette.colors;
      const rng = createRng(991);
      const W = 420, H = 485;
      const axA = createAxes({ x0: 62, y0: 36, w: 336, h: 266, xmin: 0, xmax: 10, ymin: 0, ymax: 110, font: FONTS.serif });
      const axB = createAxes({ x0: 62, y0: 318, w: 336, h: 112, xmin: 0, xmax: 10, ymin: -6.5, ymax: 6.5, font: FONTS.serif });

      const frameA = axA.drawFrame({
        style: 'box-in',
        xticks: [0, 2, 4, 6, 8, 10],
        yticks: [0, 25, 50, 75, 100],
        xMinor: 2,
        yMinor: 2,
        gridY: true,
        gridDash: '2.5,3',
        showXLabels: false,
        ylabel: 'Specific Capacity (mAh g⁻¹)',
        yLabelOffset: 42
      });

      const frameB = axB.drawFrame({
        style: 'box-in',
        xticks: [0, 2, 4, 6, 8, 10],
        yticks: [-5, 0, 5],
        xMinor: 2,
        xlabel: 'Cycle Number (×10²)',
        ylabel: 'Residual Δ',
        xLabelOffset: 36,
        yLabelOffset: 42
      });

      const modelFn = x => 98 * Math.exp(-0.048 * x) + 4.5 * Math.exp(-0.65 * x);
      const naiveFn = x => 101 - 5.1 * x;

      let body = frameA.bg + frameB.bg;
      // Curves in panel (a)
      const xsFine = Array.from({ length: 60 }, (_, i) => (10 * i) / 59);
      body += `<polyline points="${xsFine.map(x => `${axA.x(x).toFixed(1)},${axA.y(naiveFn(x)).toFixed(1)}`).join(' ')}" fill="none" stroke="${c[1]}" stroke-width="1.65" stroke-dasharray="5,3"/>`;
      body += `<polyline points="${xsFine.map(x => `${axA.x(x).toFixed(1)},${axA.y(modelFn(x)).toFixed(1)}`).join(' ')}" fill="none" stroke="${c[0]}" stroke-width="2.1"/>`;

      // ±2σ confidence band in residual panel (b)
      body += `<rect x="${axB.x0}" y="${axB.y(2.4).toFixed(1)}" width="${axB.w}" height="${(axB.y(-2.4) - axB.y(2.4)).toFixed(1)}" fill="${c[0]}" fill-opacity="0.11"/>`;
      body += `<line x1="${axB.x0}" y1="${axB.y(0).toFixed(1)}" x2="${axB.x1}" y2="${axB.y(0).toFixed(1)}" stroke="#1E242B" stroke-width="1.0" stroke-dasharray="3,2.5"/>`;

      // Experimental observations + residuals
      for (let i = 0; i <= 18; i++) {
        const xv = (10 * i) / 18;
        const yTrue = modelFn(xv);
        const res = rng.normal(0, 1.85);
        const yObs = yTrue + res;
        body += drawErrorBar(axA.x(xv), axA.y(yObs + 2.6), axA.y(yObs), 2.6, '#1E242B', 1.0);
        body += drawMarker('circle', axA.x(xv), axA.y(yObs), 3.3, '#FFFFFF', c[0], 1.6);

        // Residual lollipop/bar in panel (b)
        const bx = axB.x(xv);
        const by0 = axB.y(0), by1 = axB.y(Math.max(-5.8, Math.min(5.8, res)));
        const rCol = Math.abs(res) > 2.4 ? c[1] : c[0];
        body += `<line x1="${bx.toFixed(1)}" y1="${by0.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by1.toFixed(1)}" stroke="${rCol}" stroke-width="2.0"/>`;
        body += drawMarker('circle', bx, by1, 2.7, rCol, '#FFFFFF', 0.7);
      }

      // Legend in Panel (a)
      body += `<rect x="228" y="48" width="158" height="56" fill="#FFFFFF" fill-opacity="0.92" stroke="#CBD5E1" stroke-width="0.8"/>`;
      body += drawMarker('circle', 240, 61, 3.2, '#FFFFFF', c[0], 1.5);
      body += `<text x="250" y="64.5" font-family="${FONTS.serif}" font-size="9.4" fill="#111827">Exp. Data (+1σ)</text>`;
      body += `<line x1="233" y1="77" x2="247" y2="77" stroke="${c[0]}" stroke-width="2.0"/>`;
      body += `<text x="250" y="80.5" font-family="${FONTS.serif}" font-size="9.4" fill="#111827">Kinetic Decay Model</text>`;
      body += `<line x1="233" y1="93" x2="247" y2="93" stroke="${c[1]}" stroke-width="1.6" stroke-dasharray="4,2.5"/>`;
      body += `<text x="250" y="96.5" font-family="${FONTS.serif}" font-size="9.4" fill="#111827">Linear Drift Fit</text>`;

      // Journal bold panel labels a, b
      body += `<text x="20" y="34" font-family="${FONTS.sans}" font-size="14" font-weight="800" fill="#111827">a</text>`;
      body += `<text x="20" y="322" font-family="${FONTS.sans}" font-size="14" font-weight="800" fill="#111827">b</text>`;

      body += frameA.fg + frameB.fg;
      return wrapSvg(W, H, body, opts.bg || '#FFFFFF');
    },

    // 25. Dual-Regime Subject Trajectories + Stratified Two-Cluster Mean Summary Bars
    'hybrid-dual-regime-bar'(palette, opts = {}) {
      const c = palette.colors;
      const W = 420, H = 355;
      const subjects = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];
      const ax = createAxes({ x0: 56, y0: 48, w: 348, h: 252, xmin: -0.45, xmax: 11.9, ymin: 0, ymax: 0.46 });
      const frame = ax.drawFrame({
        style: 'despine',
        xticks: [0, 1, 2, 3, 4, 5, 6, 7, 8.95, 10.75],
        xticklabels: [...subjects, 'Mean-NF', 'Mean-FT'],
        yticks: [0.0, 0.1, 0.2, 0.3, 0.4],
        gridY: true,
        gridDash: '2.5,3',
        xlabel: 'Individual Subjects (S1–S8) & Stratified Regime Means',
        ylabel: 'Force Estimation Error (N·m)',
        xLabelOffset: 36,
        yLabelOffset: 39,
        tickSize: 9.0
      });

      // 3 decoders evaluated in Non-Fatigue (solid, S1-S8 shown) & Fatigue (summary compared on right + envelope)
      const methods = [
        {
          name: 'Adaptive-Synergy', col: c[0], marker: 'circle',
          nf: [0.055, 0.062, 0.078, 0.051, 0.064, 0.048, 0.059, 0.044],
          ft: [0.098, 0.112, 0.125, 0.094, 0.106, 0.089, 0.104, 0.118]
        },
        {
          name: 'Spectral-CNN', col: c[2] || c[1], marker: 'triangle',
          nf: [0.115, 0.128, 0.144, 0.109, 0.121, 0.102, 0.118, 0.132],
          ft: [0.212, 0.236, 0.224, 0.188, 0.195, 0.218, 0.206, 0.248]
        },
        {
          name: 'Static-MVC', col: c[1], marker: 'square',
          nf: [0.168, 0.182, 0.195, 0.154, 0.148, 0.172, 0.164, 0.189],
          ft: [0.315, 0.298, 0.334, 0.256, 0.242, 0.288, 0.274, 0.358]
        }
      ];

      let body = frame.bg;
      // Shaded summary zone on the right
      body += `<rect x="${ax.x(7.85).toFixed(1)}" y="${ax.y0}" width="${(ax.x1 - ax.x(7.85)).toFixed(1)}" height="${ax.h}" fill="#F8FAFC"/>`;
      body += `<line x1="${ax.x(7.85).toFixed(1)}" y1="${ax.y0}" x2="${ax.x(7.85).toFixed(1)}" y2="${ax.y1}" stroke="#94A3B8" stroke-width="1.0" stroke-dasharray="3.5,3"/>`;

      // Clinical target reference line across subject zone
      body += `<line x1="${ax.x0}" y1="${ax.y(0.080).toFixed(1)}" x2="${ax.x(7.6).toFixed(1)}" y2="${ax.y(0.080).toFixed(1)}" stroke="#64748B" stroke-width="0.95" stroke-dasharray="4,2.5"/>`;
      body += `<rect x="${(ax.x(7.6) - 62).toFixed(1)}" y="${(ax.y(0.080) + 2).toFixed(1)}" width="62" height="11" rx="2" fill="#FFFFFF" fill-opacity="0.88"/>`;
      body += `<text x="${ax.x(7.55).toFixed(1)}" y="${(ax.y(0.080) + 10.2).toFixed(1)}" text-anchor="end" font-family="${FONTS.sans}" font-size="8.0" fill="#475569">Target ≤ 0.08</text>`;

      // Plot both Fatigue (dashed lighter) & Non-Fatigue (solid) trajectories for Proposed & Static, or all 3 NF solid + FT dashed
      methods.forEach((m, mi) => {
        // Fatigue trajectory (dashed, slightly lighter stroke)
        if (mi !== 1) {
          const ftPts = m.ft.map((v, i) => `${ax.x(i).toFixed(1)},${ax.y(v).toFixed(1)}`).join(' ');
          body += `<polyline points="${ftPts}" fill="none" stroke="${m.col}" stroke-opacity="0.62" stroke-width="1.5" stroke-dasharray="4,2.5"/>`;
          m.ft.forEach((v, i) => {
            body += drawMarker(m.marker, ax.x(i), ax.y(v), 3.2, 'none', m.col, 1.25);
          });
        }
        // Non-Fatigue primary trajectory (solid)
        const nfPts = m.nf.map((v, i) => `${ax.x(i).toFixed(1)},${ax.y(v).toFixed(1)}`).join(' ');
        body += `<polyline points="${nfPts}" fill="none" stroke="${m.col}" stroke-width="2.0"/>`;
        m.nf.forEach((v, i) => {
          body += drawMarker(m.marker, ax.x(i), ax.y(v), 3.7, 'none', m.col, 1.6);
        });
      });

      // Right-hand TWO Stratified Mean Bar Clusters: Mean-NF (8.95) and Mean-FT (10.75)
      const bw = 0.42;
      [
        { center: 8.95, key: 'nf', alpha: 0.78 },
        { center: 10.75, key: 'ft', alpha: 0.94 }
      ].forEach(cluster => {
        methods.forEach((m, mi) => {
          const arr = m[cluster.key];
          const avg = mean(arr);
          const sd = std(arr);
          const cx = cluster.center + (mi - 1) * (bw + 0.05);
          const xL = ax.x(cx - bw / 2), xR = ax.x(cx + bw / 2);
          const yT = ax.y(avg), yB = ax.y(0);
          body += `<rect x="${xL.toFixed(1)}" y="${yT.toFixed(1)}" width="${(xR - xL).toFixed(1)}" height="${(yB - yT).toFixed(1)}" fill="${m.col}" fill-opacity="${cluster.alpha}"/>`;
          body += drawErrorBar(ax.x(cx), ax.y(avg + sd), yT, 3.0, '#111827', 1.2);
          body += drawMarker(m.marker, ax.x(cx), ax.y(0.022), 2.7, 'none', '#FFFFFF', 1.3);
        });
      });

      // Asterisk brackets within & across clusters
      body += drawSigBracket(ax.x(8.95 - 0.47), ax.x(8.95 + 0.47), ax.y(0.225), '**');
      body += drawSigBracket(ax.x(10.75 - 0.47), ax.x(10.75 + 0.47), ax.y(0.365), '***');
      body += drawSigBracket(ax.x(8.95 - 0.47), ax.x(10.75 - 0.47), ax.y(0.420), '*');

      // Top Legend
      methods.forEach((m, mi) => {
        const lx = 50 + mi * 112;
        body += `<line x1="${lx}" y1="18" x2="${lx + 20}" y2="18" stroke="${m.col}" stroke-width="2.0"/>`;
        body += drawMarker(m.marker, lx + 10, 18, 3.4, 'none', m.col, 1.5);
        body += `<text x="${lx + 25}" y="21.5" font-family="${FONTS.sans}" font-size="9.0" font-weight="500" fill="#182026">${esc(m.name)}</text>`;
      });
      body += `<text x="402" y="39" text-anchor="end" font-family="${FONTS.sans}" font-size="8.4" fill="#64748B">Solid: NF  |  Dashed: FT</text>`;

      body += frame.fg;
      return wrapSvg(W, H, body, opts.bg || '#FFFFFF');
    }
  };

  window.SciPlot = window.SciPlot || {};
  window.SciPlot.Engine = {
    render(styleId, palette, opts = {}) {
      const fn = RENDERERS[styleId];
      if (!fn) {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><text x="20" y="40">Unknown style: ${esc(styleId)}</text></svg>`;
      }
      return fn(palette, opts);
    }
  };
})();
