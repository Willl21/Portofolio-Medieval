// The living painting, layer by layer. Every layer is the same 16:9 frame (authored at 2560×1440)
// so they line up when stacked. Style: Gothic panel painting / illuminated manuscript — organic
// contours, egg-tempera washes, lead-white highlights, restrained gold. Light comes from the sun,
// upper right: lit faces right, shade left.
// Also writes src/components/medieval/anchors.json (flag poles, chimneys, fires, places…) so the
// runtime animates things exactly where the art put them. Run: npm run art [preview.png]
import sharp from 'sharp'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { TAU, circle, f, pick, rand, rng, saveFramed, save, svg, OUT, ROOT } from './lib.mjs'
import { P, brush, crown, dab, figure, foliage, fractalLine, id, ivy, masonry, mix, paintDefs, painted, pathOf, slateRoof, tileRoof, wallDefs } from './paint.mjs'

const W = 2560
const H = 1440
const R = Math.round

const anchors = { sun: null, places: {}, flags: [], smoke: [], fire: [], knight: null, raven: null }

// ONLY=castle,village npm run art → re-render just those (a full render takes minutes).
const ONLY = process.env.ONLY?.split(',')
const wanted = (rel) => !ONLY || ONLY.some((k) => rel.includes(k))

/** A full-frame painted layer. */
const layer = (rel, body, { seed = 1, defs = '', scale = 0.8, wobble = 6, grain = 0.4, mottle = 0.12 } = {}) =>
  wanted(rel) ? saveFramed(rel, W, H, painted(body), { defs: paintDefs(seed, { wobble, grain, mottle }) + wallDefs + defs, scale }) : resolve(OUT, rel)

// ─── sky ────────────────────────────────────────────────────────────────────
const SUN = [2050, 250]

function sky() {
  const r = rng(3)
  const defs = `<linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${P.azureDeep}"/><stop offset=".28" stop-color="#55739f"/><stop offset=".52" stop-color="#9cb0c2"/>
      <stop offset=".72" stop-color="#d8d5c2"/><stop offset="1" stop-color="#ecdfc2"/></linearGradient>
    <radialGradient id="sunGlow" gradientUnits="userSpaceOnUse" cx="${SUN[0]}" cy="${SUN[1]}" r="780"><stop offset="0" stop-color="#f3e2b2" stop-opacity=".6"/><stop offset="1" stop-color="#f3e2b2" stop-opacity="0"/></radialGradient>`
  let s = `<rect x="-80" y="-80" width="${W + 160}" height="${H + 160}" fill="url(#skyG)"/><rect x="-80" y="-80" width="${W + 160}" height="${H + 160}" fill="url(#sunGlow)"/>`
  // horizontal brushwork, the way a painter lays in a tempera sky
  for (let i = 0; i < 190; i++) {
    const y = rand(r, -20, 1080)
    const x0 = rand(r, -300, W)
    const len = rand(r, 260, 950)
    const t = y / 1080
    const c = t < 0.55 ? mix(P.azureDeep, '#8fa6c2', t * 1.7) : mix('#a9bcc6', '#efe3c6', (t - 0.55) * 2.2)
    const tone = r() < 0.5 ? mix(c, '#ffffff', 0.18) : mix(c, '#1d2f55', 0.12)
    s += brush([[[x0, y], [x0 + len * 0.5, y + rand(r, -14, 14)], [x0 + len, y + rand(r, -8, 8)]]], tone, rand(r, 6, 24), rand(r, 0.06, 0.16))
  }
  anchors.sun = { layer: 'sky', x: SUN[0], y: SUN[1], size: 190 }
  return layer('background/sky/sky.webp', s, { seed: 3, defs, scale: 0.6, wobble: 3, grain: 0.3, mottle: 0.08 })
}

/** Illuminated sun: gold-leaf disc with punched tooling, gilt and vermilion flame rays. */
function sunArt() {
  const r = rng(17)
  const c = 300
  let rays = ''
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * TAU + rand(r, -0.025, 0.025)
    if (i % 2 === 0) {
      const L = rand(r, 250, 282)
      const w = rand(r, 0.045, 0.06)
      const p = (ang, rad) => `${f(c + Math.cos(ang) * rad)},${f(c + Math.sin(ang) * rad)}`
      rays += `<path d="M${p(a - w, 126)} Q${p(a - w * 0.3, (126 + L) / 2)} ${p(a, L)} Q${p(a + w * 0.3, (126 + L) / 2)} ${p(a + w, 126)}Z" fill="url(#goldLeaf)" stroke="${P.goldDark}" stroke-width="2"/>`
    } else {
      let d = ''
      for (let k = 0; k <= 15; k++) {
        const rad = 126 + k * 7.6
        const off = Math.sin(k * 0.95 + i) * 0.04 * (1 - k / 17)
        d += `${k ? 'L' : 'M'}${f(c + Math.cos(a + off) * rad)},${f(c + Math.sin(a + off) * rad)} `
      }
      rays += `<path d="${d}" fill="none" stroke="${P.ochre}" stroke-width="10" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${P.vermilion}" stroke-width="3.6" stroke-linecap="round" opacity=".85"/>`
    }
  }
  let tool = ''
  for (let i = 0; i < 54; i++) tool += circle(c + Math.cos((i / 54) * TAU) * 108, c + Math.sin((i / 54) * TAU) * 108, 3.3, P.goldDark, 0, 'opacity=".75"')
  for (let i = 0; i < 36; i++) tool += circle(c + Math.cos((i / 36) * TAU) * 88, c + Math.sin((i / 36) * TAU) * 88, 2.4, P.goldDark, 0, 'opacity=".55"')
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU
    const ex = c + Math.cos(a) * 34
    const ey = c + Math.sin(a) * 34
    tool += `<ellipse cx="${f(ex)}" cy="${f(ey)}" rx="30" ry="12" transform="rotate(${f((a * 180) / Math.PI)} ${f(ex)} ${f(ey)})" fill="none" stroke="${P.goldDark}" stroke-width="2.4" opacity=".7"/>`
  }
  const body =
    rays +
    `<circle cx="${c}" cy="${c}" r="131" fill="${P.vermilion}" opacity=".9"/><circle cx="${c}" cy="${c}" r="122" fill="url(#goldLeaf)"/>` +
    tool +
    circle(c, c, 12, P.vermilion, 0, 'opacity=".8"') +
    `<ellipse cx="${c - 42}" cy="${c - 52}" rx="62" ry="34" fill="#fff6d8" opacity=".35" filter="url(#soft6)"/>` +
    `<circle cx="${c}" cy="${c}" r="131" fill="none" stroke="${P.ink}" stroke-width="2.2" opacity=".7"/>`
  return saveFramed('background/sun/sun.webp', 600, 600, painted(body), { defs: paintDefs(17, { wobble: 4, grain: 0.3, mottle: 0.06 }), scale: 0.6, pad: 20 })
}

// ─── mountains: stacked crags, the Gothic way ───────────────────────────────
function crag(r, x, base, w, h, c, { snow = false } = {}) {
  const peakX = x + w * rand(r, 0.32, 0.62)
  const top = base - h
  const keys = [
    [x - 6, base + 60],
    [x + w * rand(r, 0.04, 0.12), base - h * rand(r, 0.3, 0.55)],
    [x + w * rand(r, 0.18, 0.28), base - h * rand(r, 0.58, 0.82)],
    [peakX, top],
    [x + w * rand(r, 0.66, 0.78), base - h * rand(r, 0.62, 0.9)],
    [x + w * rand(r, 0.86, 0.94), base - h * rand(r, 0.25, 0.5)],
    [x + w + 6, base + 60],
  ]
  const edge = fractalLine(r, keys, 4, 0.34)
  const d = pathOf(edge)
  const cid = id('cr')
  let s = `<clipPath id="${cid}"><path d="${d}"/></clipPath><g${c.rim === false ? '' : ' filter="url(#rim)"'}><path d="${d}" fill="${c.base}"/><g clip-path="url(#${cid})">`
  const flank = fractalLine(r, [[peakX, top], [peakX - w * 0.07, top + h * 0.45], [x + w * 0.22, base + 60]], 3, 0.45)
  s += `<path d="${pathOf([...flank, [x - 200, base + 200], [x - 200, top - 200]])}" fill="${c.dark}" opacity=".45" filter="url(#soft6)"/>`
  s += `<ellipse cx="${f(peakX + w * 0.16)}" cy="${f(top + h * 0.3)}" rx="${f(w * 0.2)}" ry="${f(h * 0.24)}" fill="${c.light}" opacity=".5" filter="url(#soft)"/>`
  const ledges = Math.max(2, Math.round(h / 75))
  for (let k = 0; k < ledges; k++) {
    const ly = top + h * ((k + 0.8) / (ledges + 0.6)) + rand(r, -10, 10)
    const lx = x + w * rand(r, 0.08, 0.6)
    const lw = w * rand(r, 0.12, 0.3)
    const sag = rand(r, -7, 9)
    s += brush([[[lx, ly], [lx + lw * 0.5, ly + sag], [lx + lw, ly + rand(r, -4, 6)]]], c.dark, rand(r, 2.5, 4.5), c.ledge ?? 0.45)
    s += brush([[[lx + 5, ly - 4], [lx + lw * 0.45, ly + sag - 5]]], c.light, rand(r, 1.8, 3), c.ledge ?? 0.45)
  }
  const lines = []
  for (let k = 0; k < 14; k++) {
    const t = rand(r, 0.05, 0.6)
    const px = peakX + (x + w * 0.88 - peakX) * t + rand(r, -10, 10)
    const py = top + h * t * 0.55 + rand(r, 8, 30)
    lines.push([[px, py], [px + rand(r, 5, 12), py + rand(r, 12, 26)]])
  }
  s += brush(lines, '#f4efe0', 1.5, 0.6)
  if (snow) {
    const cap = edge.filter(([ex, ey]) => ey < top + h * 0.12 && Math.abs(ex - peakX) < w * 0.22)
    if (cap.length > 2) {
      const under = fractalLine(r, [[cap.at(-1)[0], cap.at(-1)[1] + 4], [peakX + w * 0.05, top + h * rand(r, 0.1, 0.16)], [peakX - w * 0.06, top + h * rand(r, 0.12, 0.18)], [cap[0][0], cap[0][1] + 4]], 3, 0.6)
      s += `<path d="${pathOf([...cap, ...under])}" fill="${c.snow ?? '#f1f0ea'}"/>`
      s += brush([[[peakX - 4, top + 10], [peakX - w * 0.08, top + h * 0.17]], [[peakX - 14, top + 18], [peakX - w * 0.12, top + h * 0.15]]], '#a3b2c2', 5, 0.55)
    }
  }
  s += '</g></g>'
  return s + `<path d="${pathOf(edge.slice(1, -1), false)}" fill="none" stroke="${P.inkSoft}" stroke-width="2" stroke-linejoin="round" opacity="${c.ink ?? 0.6}"/>`
}

function mountainBand(r, specs, c, base) {
  // specs: [peakX, top, width, snow?]; tallest drawn first so lower crags overlap them
  return [...specs].sort((a, b) => a[1] - b[1]).map(([px, top, w, snow]) => crag(r, px - w / 2, base + rand(r, -20, 30), w, base - top, c, { snow })).join('')
}

function mountains() {
  const r = rng(11)
  const FAR = { base: '#95a7bb', light: '#bac7d4', dark: '#74869d', ink: 0.16, ledge: 0.2, rim: false, snow: '#e1e7ec' }
  const NEAR = { base: '#a2a58e', light: '#cfcbad', dark: '#696b58', ink: 0.6, ledge: 0.45 }
  // silhouette envelope: high at the sides, a saddle behind the castle so its spires read against sky
  const band = (minTop, saddle, base, c, snowLine, seedShift) => {
    const specs = []
    for (let x = -140 + seedShift; x < W + 160; x += rand(r, 95, 175)) {
      const t = Math.abs(x - 1280) / 1280
      const top = minTop + saddle * (1 - Math.min(1, t * 1.6)) ** 2 + rand(r, -55, 55)
      specs.push([x, top, rand(r, 210, 430), top < snowLine])
    }
    return mountainBand(r, specs, c, base)
  }
  const haze = `<linearGradient id="haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6d4c3" stop-opacity="0"/><stop offset=".55" stop-color="#d6d4c3" stop-opacity=".5"/><stop offset="1" stop-color="#d6d4c3" stop-opacity=".8"/></linearGradient>`
  const s =
    band(545, 150, 1000, FAR, 535, 0) +
    `<rect x="-200" y="740" width="${W + 400}" height="380" fill="url(#haze)"/>` +
    band(705, 130, 1110, NEAR, 0, 40) +
    `<rect x="-200" y="900" width="${W + 400}" height="300" fill="url(#haze)"/>`
  return layer('background/mountains/mountains.webp', s, { seed: 11, defs: haze })
}

// ─── hills: patchwork fields with hedgerows of dabbed trees ─────────────────
function smoothPath(pts) {
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const [p1, p2] = [pts[i], pts[i + 1]]
    const p3 = pts[i + 2] || p2
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`
  }
  return d
}

function hillBand(r, ridge, fill, colors, hedge) {
  const d = `${smoothPath(ridge)} L${W + 150},${H + 60} L-150,${H + 60}Z`
  const cid = id('h')
  let s = `<clipPath id="${cid}"><path d="${d}"/></clipPath><g filter="url(#rim)"><path d="${d}" fill="${fill}"/><g clip-path="url(#${cid})">`
  const top = Math.min(...ridge.map((p) => p[1]))
  let y0 = top - 10
  let h = 44
  while (y0 < H + 40) {
    let x0 = -150
    const y1 = y0 + h
    while (x0 < W + 150) {
      const x1 = x0 + rand(r, 150, 340)
      const q = [[x0, y0 + rand(r, -8, 8)], [x1, y0 + rand(r, -8, 8)], [x1, y1 + rand(r, -8, 8)], [x0, y1 + rand(r, -8, 8)]]
      s += `<path d="${pathOf(q)}" fill="${pick(r, colors)}" opacity="${f(rand(r, 0.5, 0.85))}"/>`
      if (r() < 0.55) {
        const lines = []
        for (let t = 0.15; t < 0.95; t += 0.14) {
          const a = [q[0][0] + 6, q[0][1] + (q[3][1] - q[0][1]) * t]
          const b = [q[1][0] - 6, q[1][1] + (q[2][1] - q[1][1]) * t + rand(r, -3, 3)]
          lines.push([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + rand(r, -3, 3)], b])
        }
        s += brush(lines, '#5c6634', 2.2, 0.35)
      }
      // hedgerow down the field boundary: a dotted line of tiny painted shrubs
      for (let t = 0; t < 1; t += rand(r, 0.08, 0.14)) {
        const hx = q[1][0] + (q[2][0] - q[1][0]) * t
        const hy = q[1][1] + (q[2][1] - q[1][1]) * t
        s += dab(hx, hy - 2, rand(r, 4, 7) * hedge, rand(r, 3, 5) * hedge, rand(r, -20, 20), pick(r, [P.greenDark, P.green]), 0.9)
      }
      x0 = x1
    }
    for (let x = -150; x < W + 150; x += rand(r, 14, 26)) s += dab(x, y1 + rand(r, -3, 3), rand(r, 4, 7) * hedge, rand(r, 3, 5) * hedge, 0, pick(r, [P.greenDark, P.green, '#4a5f37']), 0.85)
    y0 = y1
    h *= 1.32
  }
  s += '</g></g>'
  return s + `<path d="${smoothPath(ridge)}" fill="none" stroke="${P.inkSoft}" stroke-width="2.2" opacity=".6"/>`
}

function hills() {
  const r = rng(23)
  const back = [[-150, 860], [300, 820], [700, 880], [1000, 845], [1280, 810], [1560, 850], [1900, 815], [2250, 870], [2710, 830]]
  const front = [[-150, 940], [380, 905], [820, 960], [1280, 990], [1720, 950], [2150, 905], [2710, 945]]
  let trees = ''
  for (const x of [140, 470, 1020, 1560, 1790, 2400]) {
    const tx = x + rand(r, -30, 30)
    const ty = 828 + rand(r, 0, 26)
    const s = rand(r, 13, 18)
    trees += brush([[[tx, ty], [tx, ty + s * 1.7]]], P.umberDark, 3, 0.9) + crown(r, tx, ty, s, s * 1.15, [P.greenDark, P.green, P.sap], { count: 14, size: 0.6, ink: 1.2 })
  }
  const s =
    hillBand(r, back, '#a7a56c', ['#bdae6e', '#9fa262', '#8e9a5c', '#c7b77c', '#a9a36a'], 0.8) +
    trees +
    hillBand(r, front, '#8a9452', ['#808c4e', '#9b9c5c', '#71824a', '#ac a468'.replace(' ', ''), '#8f9a58'], 1)
  return layer('environment/hills/hills.webp', s, { seed: 23 })
}

// ─── architecture ───────────────────────────────────────────────────────────
const CASTLE_DY = 90 // the castle sits low enough that the title has clean sky above it

const arch = (x, y, w, h) => `M${x},${y + h} V${y + w / 2} A${w / 2},${w / 2} 0 0 1 ${x + w},${y + w / 2} V${y + h}Z`
const rectD = (x0, y0, x1, y1) => `M${x0},${y0} H${x1} V${y1} H${x0}Z`

function slit(x, y, w = 7, h = 24) {
  return `<path d="${arch(x - w / 2, y, w, h)}" fill="${P.umberDark}" opacity=".95"/>`
}

function merlons(r, x0, x1, y, h = 13, w = 15, gap = 11) {
  let s = ''
  for (let x = x0; x + w <= x1 + 0.1; x += w + gap) {
    const d = rectD(x, y - h - rand(r, -1, 1.5), x + w, y + 2)
    s += `<g filter="url(#rim)"><path d="${d}" fill="${pick(r, [P.stone, '#e2d8bf'])}"/></g><path d="${d}" fill="none" stroke="${P.ink}" stroke-width="1.5" opacity=".7"/>`
  }
  return s
}

/** A masonry wall block with rim + contour. */
function wall(r, x0, y0, x1, y1, opts = { stones: ['#d8ccae', '#cdbf9c', '#ddd3b8', '#c6b793'], mortar: '#a39373' }) {
  const d = rectD(x0, y0, x1, y1)
  const cid = id('wx')
  let weather = `<clipPath id="${cid}"><path d="${d}"/></clipPath><g clip-path="url(#${cid})">`
  // eave shadow, rain streaks, damp and moss at the foot
  weather += `<rect x="${x0 - 4}" y="${y0 - 4}" width="${x1 - x0 + 8}" height="12" fill="${P.umberDark}" opacity=".3" filter="url(#soft2)"/>`
  for (let i = 0; i < Math.max(1, Math.round((x1 - x0) / 40)); i++) {
    const sx = x0 + rand(r, 0.1, 0.9) * (x1 - x0)
    weather += brush([[[sx, y0 + rand(r, 8, 30)], [sx + rand(r, -2, 2), y0 + rand(r, 40, 90)]]], P.umberDark, rand(r, 3, 6), 0.12)
  }
  weather += `<rect x="${x0 - 4}" y="${y1 - 14}" width="${x1 - x0 + 8}" height="18" fill="#6c7448" opacity=".35" filter="url(#soft6)"/></g>`
  return `<g filter="url(#rim)">${masonry(r, d, [x0, y0, x1, y1], opts)}${weather}</g><path d="${d}" fill="none" stroke="${P.ink}" stroke-width="1.8" opacity=".75"/>`
}

function pole(layerId, x, y, h = 30, tex = 'red', dy = 0) {
  anchors.flags.push({ layer: layerId, x: R(x), y: R(y - h + dy), tex })
  return `<path d="M${f(x)},${f(y)} V${f(y - h)}" stroke="${P.umberDark}" stroke-width="2.6" stroke-linecap="round"/><circle cx="${f(x)}" cy="${f(y - h)}" r="4" fill="url(#goldLeaf)" stroke="${P.goldDark}" stroke-width="1"/>`
}

function tower(r, L, x0, x1, top, bottom, apex, flag, dy = 0) {
  const mid = (x0 + x1) / 2
  const roof = slateRoof(r, x0, x1, top, apex)
  return wall(r, x0, top, x1, bottom) + slit(mid, top + 20) + slit(mid + 2, top + 66, 6, 18) + roof.svg + (flag ? pole(L, roof.top[0], roof.top[1], 28, flag, dy) : '')
}

/** Heraldic banner hung on a wall: burgundy field, gold chevron and mullet, gilt fringe. */
function heraldicBanner(r, x, y, w, h) {
  const d = `M${x},${y} H${x + w} V${y + h * 0.82} L${x + w / 2},${y + h} L${x},${y + h * 0.82}Z`
  const cid = id('hb')
  let s = `<clipPath id="${cid}"><path d="${d}"/></clipPath><g filter="url(#rim)"><path d="${d}" fill="${P.red}"/><g clip-path="url(#${cid})">`
  s += `<path d="M${x - 4},${y + h * 0.62} L${x + w / 2},${y + h * 0.34} L${x + w + 4},${y + h * 0.62} L${x + w + 4},${y + h * 0.5} L${x + w / 2},${y + h * 0.22} L${x - 4},${y + h * 0.5}Z" fill="url(#goldLeaf)"/>`
  s += brush([[[x + w * 0.3, y], [x + w * 0.32, y + h]], [[x + w * 0.7, y], [x + w * 0.68, y + h]]], '#5e1f17', 3, 0.35)
  s += '</g></g>'
  s += `<path d="${d}" fill="none" stroke="${P.ink}" stroke-width="1.4" opacity=".75"/>`
  s += `<path d="M${x - 3},${y} H${x + w + 3}" stroke="${P.umberDark}" stroke-width="3"/>`
  return s
}

function castle() {
  const r = rng(31)
  const L = 'castle'
  // rocky mound, painted like the mountains but warmer
  const moundEdge = fractalLine(r, [[880, 1090], [930, 990], [985, 945], [1100, 935], [1280, 922], [1430, 936], [1545, 926], [1620, 960], [1690, 1090]], 4, 0.3)
  const moundD = pathOf(moundEdge)
  const mc = id('mo')
  let s = `<clipPath id="${mc}"><path d="${moundD}"/></clipPath><g filter="url(#rim)"><path d="${moundD}" fill="#b6a684"/><g clip-path="url(#${mc})">`
  s += `<path d="M860,940 L1090,935 L1060,1100 L860,1100Z" fill="#7e6f55" opacity=".4" filter="url(#soft6)"/>`
  for (let k = 0; k < 14; k++) {
    const lx = rand(r, 920, 1600)
    const ly = rand(r, 955, 1070)
    s += brush([[[lx, ly], [lx + rand(r, 18, 46), ly + rand(r, -5, 6)]]], '#7e6f55', 3, 0.55) + brush([[[lx + 3, ly - 4], [lx + rand(r, 14, 30), ly - 6]]], '#ddd0b0', 2, 0.6)
  }
  s += '</g></g>' + `<path d="${pathOf(moundEdge.slice(1, -1), false)}" fill="none" stroke="${P.inkSoft}" stroke-width="2" opacity=".6"/>`
  for (let k = 0; k < 40; k++) s += dab(rand(r, 900, 1660), rand(r, 925, 960) + rand(r, 0, 20), rand(r, 3, 6), rand(r, 2, 4), rand(r, -30, 30), pick(r, [P.green, P.sap, P.greenDark]), 0.9)

  // back towers, keep, central tower
  s += tower(r, L, 1105, 1160, 800, 882, 718, 'red', CASTLE_DY)
  s += tower(r, L, 1400, 1455, 812, 882, 735, 'blue', CASTLE_DY)
  s += merlons(r, 1187, 1373, 790)
  s += wall(r, 1185, 790, 1375, 882)
  s += slit(1222, 812) + slit(1338, 812)
  s += heraldicBanner(r, 1236, 800, 26, 58)
  s += tower(r, L, 1245, 1315, 700, 792, 600, 'red', CASTLE_DY)
  // keep chimney + its smoke
  s += wall(r, 1352, 768, 1366, 792)
  anchors.smoke.push({ layer: L, x: 1359, y: 764 + CASTLE_DY })

  // curtain wall with guards walking the battlement
  const guards = [[1068, 'azure'], [1190, 'vermilion'], [1478, 'azure']]
  for (const [gx, t] of guards) s += figure(r, gx, 882, 21, { tunic: P[t], spear: true, hood: '#9aa0a6' })
  s += merlons(r, 1032, 1528, 882)
  s += wall(r, 1030, 880, 1530, 962)
  // gate: dark arch, gilt portcullis, torches either side
  s += `<g filter="url(#rim)"><path d="${arch(1254, 905, 52, 57)}" fill="#2f2117"/></g>`
  s += brush([[[1264, 912], [1264, 962]], [[1280, 906], [1280, 962]], [[1296, 912], [1296, 962]], [[1256, 928], [1304, 928]], [[1256, 946], [1304, 946]]], P.gold, 2, 0.85)
  s += `<path d="${arch(1254, 905, 52, 57)}" fill="none" stroke="${P.ink}" stroke-width="1.8"/>`
  for (const tx of [1240, 1320]) {
    s += `<path d="M${tx},${938} l0,-12 M${tx - 4},${926} h8" stroke="${P.umberDark}" stroke-width="2.4" stroke-linecap="round"/>`
    anchors.fire.push({ layer: L, x: tx, y: 924 + CASTLE_DY, kind: 'torch' })
  }
  // ivy creeping up the left of the walls
  s += ivy(r, 1040, 958, 70, 26) + ivy(r, 1110, 955, 46, 18)

  // front corner towers
  s += tower(r, L, 985, 1060, 840, 966, 765, 'red', CASTLE_DY)
  s += ivy(r, 994, 964, 95, 22)
  s += tower(r, L, 1500, 1575, 840, 966, 765, 'red', CASTLE_DY)
  // villagers at the gate
  s += figure(r, 1222, 978, 20, { tunic: P.ochre, hood: P.umber }) + figure(r, 1340, 982, 19, { tunic: P.green, hood: P.red })

  anchors.places.about = { layer: L, x: 1280, y: 830 + CASTLE_DY }
  return layer('environment/castle/castle.webp', `<g transform="translate(0,${CASTLE_DY})">${s}</g>`, { seed: 31, scale: 1, wobble: 4.5 })
}

// ─── village ────────────────────────────────────────────────────────────────
/** Lime-plastered, half-timbered wall. */
function plaster(r, x0, y0, x1, y1) {
  const d = rectD(x0, y0, x1, y1)
  const cid = id('pl')
  let s = `<clipPath id="${cid}"><path d="${d}"/></clipPath><g filter="url(#rim)"><path d="${d}" fill="#ece2c9"/><g clip-path="url(#${cid})">`
  s += `<ellipse cx="${(x0 + x1) / 2}" cy="${y1}" rx="${x1 - x0}" ry="${(y1 - y0) * 0.5}" fill="${P.ochrePale}" opacity=".45" filter="url(#soft6)"/>`
  s += `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="url(#wallLight)"/>`
  const w = x1 - x0
  const h = y1 - y0
  const mid = y0 + h * 0.45
  const beams = [
    [[x0 + 3, mid], [x1 - 3, mid + rand(r, -1.5, 1.5)]],
    [[x0 + w / 2, y0], [x0 + w / 2 + rand(r, -1.5, 1.5), y1]],
    [[x0 + 4, y0 + 4], [x0 + w / 2, mid]],
    [[x1 - 4, y0 + 4], [x0 + w / 2, mid]],
  ]
  s += brush(beams, P.umber, rand(r, 3.2, 4.2), 0.95)
  s += '</g></g>'
  return s + `<path d="${d}" fill="none" stroke="${P.ink}" stroke-width="1.7" opacity=".75"/>`
}

const opening = (d, fill = '#3a2a1e') => `<g filter="url(#rim)"><path d="${d}" fill="${fill}"/></g><path d="${d}" fill="none" stroke="${P.ink}" stroke-width="1.4" opacity=".8"/>`

function house(r, x, base, w, h, roofColor = P.red) {
  const top = base - h
  const rh = h * 0.72
  const cx = x + w * (r() < 0.5 ? 0.28 : 0.72)
  anchors.smoke.push({ layer: 'village', x: R(cx), y: R(top - rh - 6), small: true })
  let s = wall(r, cx - 7, top - rh - 4, cx + 7, top - rh * 0.3)
  s += plaster(r, x, top, x + w, base)
  s += opening(`M${f(x + w * 0.62)},${base} v${f(-h * 0.38)} h${f(w * 0.2)} v${f(h * 0.38)}Z`, P.umber)
  s += opening(`M${f(x + w * 0.14)},${f(top + h * 0.58)} h${f(w * 0.18)} v${f(h * 0.2)} h${f(-w * 0.18)}Z`)
  s += tileRoof(r, x, x + w, top, rh, roofColor)
  return s
}

function armory(r, x, base) {
  const w = 170
  const h = 92
  const top = base - h
  const L = 'village'
  let s = wall(r, x + 14, top - 70, x + 46, top + 10) + wall(r, x + 10, top - 80, x + 50, top - 70)
  anchors.smoke.push({ layer: L, x: x + 30, y: top - 86 })
  s += wall(r, x, top, x + w, base, { stones: ['#cdbf9f', '#bfae8c', '#d6c9aa', '#b8a684'], mortar: '#998a6c' })
  s += tileRoof(r, x, x + w, top, 46, '#8a3a2a')
  // open forge
  s += opening(arch(x + 62, base - 62, 70, 62), '#241812')
  s += `<path d="M${x + 72},${base} q25,-26 50,0Z" fill="${P.vermilion}"/><path d="M${x + 84},${base} q13,-14 26,0Z" fill="${P.goldPale}"/>`
  anchors.fire.push({ layer: L, x: x + 97, y: base - 14, kind: 'glow' })
  // weapon rack + shields
  const spears = []
  for (let i = 0; i < 4; i++) spears.push([[x + w + 16 + i * 10, base], [x + w + 16 + i * 10 + rand(r, -1, 1), base - 86 + i * 4]])
  s += brush(spears, P.umber, 3.6, 1)
  for (let i = 0; i < 4; i++) s += `<path d="M${x + w + 12 + i * 10},${base - 84 + i * 4} l4,-14 l4,14Z" fill="#c9ccd0" stroke="${P.ink}" stroke-width="1"/>`
  for (const [sx, col, rad] of [[x + w + 22, P.vermilion, 20], [x + w + 50, P.azure, 18]]) {
    s += `<g filter="url(#rim)"><circle cx="${sx}" cy="${base - rad - 2}" r="${rad}" fill="${col}"/></g><circle cx="${sx}" cy="${base - rad - 2}" r="${rad}" fill="none" stroke="${P.ink}" stroke-width="1.6"/>`
    s += `<circle cx="${sx}" cy="${base - rad - 2}" r="${rad * 0.3}" fill="url(#goldLeaf)" stroke="${P.goldDark}" stroke-width="1"/>`
  }
  // hanging sign with crossed swords
  s += brush([[[x + w - 6, top + 12], [x + w + 24, top + 12]]], P.umberDark, 3, 1)
  s += `<g filter="url(#rim)"><path d="M${x + w + 6},${top + 14} h22 v26 l-11,8 l-11,-8Z" fill="${P.red}"/></g>`
  s += brush([[[x + w + 10, top + 20], [x + w + 24, top + 36]], [[x + w + 24, top + 20], [x + w + 10, top + 36]]], P.gold, 2.4, 1)
  s += figure(r, x - 14, base + 2, 22, { tunic: P.umber, hood: P.umberDark })
  anchors.knight = { layer: L, x: x + w + 92, y: base, height: 74 }
  anchors.places.skills = { layer: L, x: x + w / 2 + 20, y: base - 50 }
  return s
}

function gallery(r, x, base) {
  const w = 280
  const h = 100
  const top = base - h
  const L = 'village'
  let s = wall(r, x, top, x + w, base)
  for (const wx of [x + 22, x + 66, x + 186, x + 230]) {
    s += `<g filter="url(#rim)"><path d="${arch(wx, top + 22, 28, 54)}" fill="${P.azure}"/></g>`
    s += `<path d="M${wx + 3},${top + 50} h10 v24 h-10Z M${wx + 15},${top + 34} h10 v14 h-10Z" fill="${P.vermilion}" opacity=".8"/>`
    s += `<path d="M${wx + 3},${top + 34} h10 v14 h-10Z M${wx + 15},${top + 50} h10 v24 h-10Z" fill="${P.goldPale}" opacity=".85"/>`
    s += `<path d="M${wx + 14},${top + 26} V${top + 76} M${wx + 2},${top + 49} H${wx + 26}" stroke="${P.ink}" stroke-width="1.8"/>`
    s += `<path d="${arch(wx, top + 22, 28, 54)}" fill="none" stroke="${P.ink}" stroke-width="1.8"/>`
  }
  // long slate roof
  const rd = `M${x - 12},${top} L${x + 40},${top - 62} L${x + w - 40},${top - 62} L${x + w + 12},${top} Q${x + w / 2},${top + 4} ${x - 12},${top}Z`
  const rc = id('gr')
  s += `<clipPath id="${rc}"><path d="${rd}"/></clipPath><g filter="url(#rim)"><path d="${rd}" fill="${P.azure}"/><g clip-path="url(#${rc})">`
  s += `<rect x="${x + w / 2}" y="${top - 64}" width="${w / 2 + 20}" height="70" fill="#7f9cc4" opacity=".5"/>`
  let scales = ''
  for (let k = 1; k <= 6; k++) {
    const yy = top - 62 + k * 10.3
    for (let xx = x - 12; xx < x + w + 12; xx += 10) scales += `M${xx},${f(yy)} q5,5 10,0 `
  }
  s += `<path d="${scales}" fill="none" stroke="${P.azureDeep}" stroke-width="1.5" opacity=".55"/></g></g><path d="${rd}" fill="none" stroke="${P.ink}" stroke-width="1.8" opacity=".8"/>`
  // gilt flèche on the ridge
  s += `<g filter="url(#rim)"><path d="M${x + w / 2 - 14},${top - 62} L${x + w / 2},${top - 132} L${x + w / 2 + 14},${top - 62}Z" fill="url(#goldLeaf)"/></g><path d="M${x + w / 2 - 14},${top - 62} L${x + w / 2},${top - 132} L${x + w / 2 + 14},${top - 62}" fill="none" stroke="${P.goldDark}" stroke-width="1.6"/>`
  s += pole(L, x + w / 2, top - 132, 26, 'gold')
  // porch
  s += wall(r, x + w / 2 - 34, top + 30, x + w / 2 + 34, base)
  s += opening(arch(x + w / 2 - 18, base - 52, 36, 52), P.umberDark)
  s += `<g filter="url(#rim)"><path d="M${x + w / 2 - 44},${top + 32} L${x + w / 2},${top - 8} L${x + w / 2 + 44},${top + 32}Z" fill="${P.azure}"/></g><path d="M${x + w / 2 - 44},${top + 32} L${x + w / 2},${top - 8} L${x + w / 2 + 44},${top + 32}Z" fill="none" stroke="${P.ink}" stroke-width="1.6"/>`
  s += figure(r, x + w / 2 - 50, base + 2, 21, { tunic: P.azure, hood: P.ochre }) + figure(r, x + w / 2 + 52, base + 3, 20, { tunic: P.vermilion })
  anchors.places.projects = { layer: L, x: x + w / 2, y: base - 60 }
  return s
}

function archive(r, x, base) {
  const w = 230
  const h = 96
  const top = base - h
  const L = 'village'
  const stones = { stones: ['#cbbd9c', '#d6caa9', '#bfb08f', '#c4b694'], mortar: '#9a8b6d' }
  const tx0 = x + 6
  const tx1 = x + 70
  const ttop = base - 220
  let s = wall(r, tx0, ttop, tx1, base, stones)
  s += opening(arch(tx0 + 16, ttop + 18, 32, 46), '#2a1e15')
  s += `<path d="M${tx0 + 24},${ttop + 52} q8,-28 16,0Z" fill="url(#goldLeaf)" stroke="${P.goldDark}" stroke-width="1.2"/>`
  s += tileRoof(r, tx0, tx1, ttop, 70, P.red)
  s += pole(L, (tx0 + tx1) / 2, ttop - 70, 26, 'blue')
  s += wall(r, x + 50, top, x + w, base, stones)
  for (const wx of [x + 96, x + 120, x + 168, x + 192]) s += opening(arch(wx, top + 24, 18, 36), '#2a1e15')
  s += opening(arch(x + 140, base - 50, 26, 50), P.umber)
  s += tileRoof(r, x + 50, x + w, top, 52, P.red)
  s += figure(r, x + 118, base + 2, 21, { tunic: '#e9e1cc', hood: '#5b4a3a' })
  anchors.places.experience = { layer: L, x: x + w / 2 + 10, y: base - 70 }
  return s
}

function ravenTower(r, cx, base) {
  const L = 'village'
  const top = base - 400
  const cragTop = base - 140
  let s = crag(r, cx - 165, base + 30, 335, 175, { base: '#b0a284', light: '#ddd1b1', dark: '#776a52' })
  s += wall(r, cx - 36, top + 18, cx + 36, cragTop + 20)
  s += slit(cx, top + 60) + slit(cx, top + 140) + slit(cx + 4, top + 210, 6, 20)
  s += wall(r, cx - 46, top + 4, cx + 46, top + 20)
  s += merlons(r, cx - 46, cx + 46, top + 4, 14, 14, 12)
  s += `<g filter="url(#rim)"><path d="M${cx - 16},${top - 10} H${cx + 16} L${cx + 10},${top + 4} H${cx - 10}Z" fill="#3a3330"/></g>`
  anchors.fire.push({ layer: L, x: cx, y: top - 12, kind: 'flame' })
  s += pole(L, cx + 38, top - 10, 40, 'red')
  s += ivy(r, cx - 30, cragTop + 18, 120, 20)
  anchors.raven = { layer: L, x: cx - 34, y: top - 10, height: 34 }
  anchors.places.contact = { layer: L, x: cx, y: top + 120 }
  return s
}

function village() {
  const r = rng(97)
  const ground = (pts, bottom) => {
    const d = `${smoothPath(pts)} L${pts.at(-1)[0]},${bottom} L${pts[0][0]},${bottom}Z`
    let g = `<g filter="url(#rim)"><path d="${d}" fill="#8f9856"/>`
    const cid = id('vg')
    g += `<clipPath id="${cid}"><path d="${d}"/></clipPath><g clip-path="url(#${cid})">`
    const blades = []
    for (let i = 0; i < 260; i++) {
      const x = rand(r, pts[0][0], pts.at(-1)[0])
      const y = rand(r, 950, bottom)
      blades.push([[x, y], [x + rand(r, -3, 3), y - rand(r, 6, 12)]])
    }
    g += brush(blades, '#5f6d38', 1.8, 0.5) + '</g></g>'
    return g + `<path d="${smoothPath(pts)}" fill="none" stroke="${P.inkSoft}" stroke-width="2" opacity=".6"/>`
  }
  let s = ground([[150, 1110], [210, 985], [420, 958], [700, 948], [930, 960], [1010, 1110]], 1110)
  s += ground([[1590, 1110], [1650, 975], [1880, 952], [2120, 958], [2330, 990], [2440, 1110]], 1110)
  s += house(r, 470, 962, 70, 62) + house(r, 900, 966, 64, 56, '#a3503a')
  s += armory(r, 245, 968)
  s += gallery(r, 590, 955)
  s += house(r, 548, 975, 56, 50, '#a3503a')
  s += archive(r, 1690, 962)
  s += house(r, 1940, 966, 66, 58) + house(r, 2010, 978, 58, 50, '#a3503a')
  s += ravenTower(r, 2250, 1000)
  s += figure(r, 1985, 1000, 20, { tunic: P.vermilion, hood: P.white }) + figure(r, 870, 990, 19, { tunic: P.ochre })
  return layer('environment/village/village.webp', s, { seed: 97, scale: 1, wobble: 4.5 })
}

// ─── forest: mixed species, muted and smaller toward the back ───────────────
const HAZE = '#c9c8b2'

function broadleaf(r, x, groundY, size, tones, trunk = true) {
  const rx = size * rand(r, 0.85, 1.15)
  const ry = size * rand(r, 0.9, 1.2)
  const cy = groundY - size * 1.55
  let s = ''
  if (trunk) {
    const tw = size * 0.11
    s += `<g filter="url(#rim)"><path d="M${f(x - tw)},${f(groundY)} Q${f(x - tw * 0.5)},${f(cy + ry * 0.3)} ${f(x - tw * 0.4)},${f(cy)} L${f(x + tw * 0.4)},${f(cy)} Q${f(x + tw * 0.6)},${f(cy + ry * 0.3)} ${f(x + tw)},${f(groundY)}Z" fill="${P.umber}"/></g>`
  }
  return s + crown(r, x, cy, rx, ry, tones)
}

function poplar(r, x, groundY, size, tones) {
  const h = size * rand(r, 2.6, 3.2)
  const cy = groundY - h * 0.55
  return brush([[[x, groundY], [x, cy]]], P.umberDark, size * 0.12, 1) + crown(r, x, cy, size * 0.42, h * 0.48, tones, { count: Math.round(size * 1.3) })
}

function conifer(r, x, groundY, size, tones) {
  const h = size * rand(r, 2.5, 3)
  const [dark, mid, light] = tones
  let d = `M${f(x)},${f(groundY - h)}`
  const tiers = 5
  for (let i = 1; i <= tiers; i++) {
    const y = groundY - h + (h * 0.88 * i) / tiers
    const half = size * 0.55 * (0.35 + (0.65 * i) / tiers)
    d += ` Q${f(x + half * 0.6)},${f(y - h * 0.06)} ${f(x + half)},${f(y)} L${f(x + half * 0.5)},${f(y - 3)}`
  }
  d += ` L${f(x - size * 0.2)},${f(groundY - h * 0.1)}`
  for (let i = tiers; i >= 1; i--) {
    const y = groundY - h + (h * 0.88 * i) / tiers
    const half = size * 0.55 * (0.35 + (0.65 * i) / tiers)
    d += ` L${f(x - half * 0.5)},${f(y - 3)} L${f(x - half)},${f(y)} Q${f(x - half * 0.6)},${f(y - h * 0.06)} `
  }
  d += `${f(x)},${f(groundY - h)}Z`
  let s = brush([[[x, groundY], [x, groundY - h * 0.2]]], P.umberDark, size * 0.1, 1)
  s += `<g filter="url(#rim)"><path d="${d}" fill="${dark}"/>`
  for (let i = 0; i < size * 1.2; i++) {
    const t = rand(r, 0.08, 0.95)
    const yy = groundY - h + h * 0.88 * t
    const half = size * 0.5 * t
    const xx = x + rand(r, -half, half)
    const tone = xx > x ? (r() < 0.6 ? light : mid) : r() < 0.6 ? dark : mid
    s += dab(xx, yy, rand(r, 4, 7), rand(r, 2, 3.5), rand(r, -25, 25), tone, 0.85)
  }
  return s + `</g><path d="${d}" fill="none" stroke="${P.ink}" stroke-width="1.5" opacity=".5"/>`
}

function forest() {
  const r = rng(41)
  const topAt = (x) => {
    const d = Math.abs(x - 1280) / 1280
    return 1050 - d * d * 100
  }
  const rows = [
    { off: -6, sMin: 30, sMax: 46, haze: 0.38 },
    { off: 40, sMin: 40, sMax: 58, haze: 0.18 },
    { off: 92, sMin: 52, sMax: 74, haze: 0 },
  ]
  let s = `<rect x="-100" y="1110" width="${W + 200}" height="${H}" fill="#34472b"/>`
  for (const row of rows) {
    const tones = [P.greenDeep, P.greenDark, P.green, P.sap, '#8a9a52'].map((c) => mix(c, HAZE, row.haze))
    const items = []
    for (let x = -100; x < W + 100; x += rand(r, 45, 90)) {
      const size = rand(r, row.sMin, row.sMax)
      const groundY = topAt(x) + size * 1.7 + row.off + rand(r, -10, 16)
      items.push({ x, groundY, size, kind: r() < 0.16 ? 'poplar' : r() < 0.26 ? 'conifer' : 'broad' })
    }
    items.sort((a, b) => a.groundY - b.groundY)
    for (const t of items) {
      const k = Math.floor(r() * 2)
      const tt = [tones[k], tones[k + 1], tones[k + 2 + (r() < 0.5 ? 1 : 0)] ?? tones[3]]
      s += t.kind === 'poplar' ? poplar(r, t.x, t.groundY, t.size, tt) : t.kind === 'conifer' ? conifer(r, t.x, t.groundY, t.size, tt) : broadleaf(r, t.x, t.groundY, t.size, tt, row.haze === 0)
    }
  }
  return layer('environment/forest/forest.webp', s, { seed: 41, wobble: 5 })
}

// ─── meadow: painted grass, millefleur, the road to the castle ──────────────
function flower(r, x, y, s) {
  const color = pick(r, [P.white, P.vermilion, '#7f95b2', P.goldPale, P.white, '#c98ab0'])
  let p = ''
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + r()
    p += dab(x + Math.cos(a) * s, y + Math.sin(a) * s, s * 0.8, s * 0.55, (a * 180) / Math.PI, color, 0.95)
  }
  return p + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s * 0.45)}" fill="${P.gold}"/>`
}

function ground() {
  const r = rng(53)
  const edge = [[-150, 1185], [400, 1205], [900, 1192], [1280, 1210], [1700, 1196], [2200, 1208], [2710, 1185]]
  const d = `${smoothPath(edge)} L${W + 150},${H + 60} L-150,${H + 60}Z`
  const cid = id('gd')
  let s = `<clipPath id="${cid}"><path d="${d}"/></clipPath><g filter="url(#rim)"><path d="${d}" fill="#788748"/><g clip-path="url(#${cid})">`
  s += `<rect x="-150" y="1180" width="${W + 300}" height="60" fill="${P.greenDeep}" opacity=".45" filter="url(#soft6)"/>`
  for (let i = 0; i < 26; i++) s += `<ellipse cx="${f(rand(r, 0, W))}" cy="${f(rand(r, 1230, H))}" rx="${f(rand(r, 120, 320))}" ry="${f(rand(r, 20, 50))}" fill="${pick(r, ['#8c9a50', '#687a3f', '#99a35a'])}" opacity=".5" filter="url(#soft)"/>`
  // road: ochre earth with ruts and stones
  const roadL = [[1268, 1206], [1250, 1270], [1198, 1350], [1110, 1460]]
  const roadR = [[1300, 1206], [1324, 1270], [1392, 1350], [1480, 1460]]
  const roadD = `${smoothPath(roadL)} L${smoothPath([...roadR].reverse()).slice(1)}Z`
  s += `<g filter="url(#rim)"><path d="${roadD}" fill="#d6c394"/></g>`
  s += brush([[[1280, 1222], [1262, 1320], [1228, 1450]], [[1291, 1222], [1316, 1320], [1352, 1450]]], '#a99268', 3, 0.7)
  for (let i = 0; i < 40; i++) {
    const t = rand(r, 0.05, 1)
    const y = 1206 + t * 240
    const x = 1284 + rand(r, -1, 1) * (20 + t * 150) * 0.8
    s += dab(x, y, rand(r, 1.5, 3) * (0.5 + t), rand(r, 1, 2) * (0.5 + t), 0, pick(r, ['#9c8a66', '#efe4c6']), 0.8)
  }
  const onRoad = (x, y) => {
    const t = (y - 1206) / 254
    return x > 1252 - t * 145 && x < 1312 + t * 170
  }
  const blades = [[], [], [], []]
  let blooms = ''
  for (let i = 0; i < 2600; i++) {
    const x = rand(r, -20, W + 20)
    const y = rand(r, 1215, H + 10)
    if (onRoad(x, y)) continue
    const k = 0.45 + (y - 1210) / 230
    if (r() < 0.12) blooms += flower(r, x, y, 3.2 * k)
    else blades[Math.floor(r() * 4)].push([[x, y], [x + rand(r, -4, 4) * k, y - rand(r, 7, 16) * k]])
  }
  s += ['#4f6033', '#6a7c3d', '#879a4c', '#a5ad62'].map((c, i) => brush(blades[i], c, 1.6 + i * 0.1, 0.75)).join('') + blooms
  s += '</g></g>'
  return layer('environment/ground/ground.webp', s + `<path d="${smoothPath(edge)}" fill="none" stroke="${P.inkSoft}" stroke-width="2.2" opacity=".55"/>`, { seed: 53, wobble: 5 })
}

// ─── foreground ─────────────────────────────────────────────────────────────
function rocks() {
  const r = rng(61)
  const c = { base: '#a99a7c', light: '#d8ccac', dark: '#6d6049' }
  const s = crag(r, -80, 1500, 330, 250, c) + crag(r, 160, 1490, 230, 160, c) + crag(r, 2250, 1500, 380, 270, c) + crag(r, 2120, 1495, 210, 140, c)
  return layer('foreground/rocks/rocks.webp', s, { seed: 61, wobble: 6 })
}

function bush(r, x, y, rad) {
  let s = crown(r, x, y, rad, rad * 0.72, [P.greenDeep, P.greenDark, P.green], { count: Math.round(rad * 1.6), size: 1.3, ink: 2 })
  for (let i = 0; i < 9; i++) s += `<circle cx="${f(x + rand(r, -0.6, 0.6) * rad)}" cy="${f(y + rand(r, -0.45, 0.3) * rad)}" r="${f(rand(r, 3.5, 5.5))}" fill="${i % 3 ? P.vermilion : P.white}" stroke="${P.ink}" stroke-width=".8"/>`
  return s
}

function bushes() {
  const r = rng(71)
  let s = [[60, 1400, 135], [270, 1432, 104], [430, 1448, 78], [2500, 1392, 145], [2310, 1428, 108], [2150, 1452, 82]].map(([x, y, rad]) => bush(r, x, y, rad)).join('')
  // tall grass and flowers along the foot of the frame
  const blades = []
  let blooms = ''
  for (let i = 0; i < 260; i++) {
    const x = r() < 0.5 ? rand(r, -20, 620) : rand(r, 1940, W + 20)
    const y = rand(r, 1380, H + 20)
    blades.push([[x, y], [x + rand(r, -10, 10), y - rand(r, 26, 60)]])
    if (r() < 0.12) blooms += flower(r, x + rand(r, -6, 6), y - rand(r, 20, 50), 5)
  }
  s += brush(blades, P.greenDark, 2.6, 0.85) + blooms
  return layer('foreground/bushes/bushes.webp', s, { seed: 71, wobble: 6 })
}

function bigTree(r, baseX, lean, blobs, girth = 1) {
  const g = (v) => v * girth
  const Lp = [[baseX - g(84), H + 40], [baseX - g(44) + lean * 0.3, 1150], [baseX - g(30) + lean * 0.7, 800], [baseX - g(22) + lean, 460]]
  const Rp = Lp.map(([x, y], i) => [2 * (baseX + lean * [0, 0.3, 0.7, 1][i]) - x, y]).reverse()
  const dir = Math.sign(W / 2 - baseX)
  let s = ''
  for (const [y, dx, dy] of [[760, 190, -170], [600, -120, -150], [520, 150, -120]]) {
    const d = `M${f(baseX + lean * 0.8)},${y} q${f(dir * dx * 0.4 * girth)},${f(dy * 0.7)} ${f(dir * dx * girth)},${f(dy)}`
    s += `<path d="${d}" fill="none" stroke="${P.ink}" stroke-width="${g(30)}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${P.umber}" stroke-width="${g(24)}" stroke-linecap="round"/>`
  }
  const trunkD = `${smoothPath(Lp)} L${smoothPath(Rp).slice(1)}Z`
  const tc = id('tk')
  s += `<clipPath id="${tc}"><path d="${trunkD}"/></clipPath><g filter="url(#rim)"><path d="${trunkD}" fill="${P.umber}"/><g clip-path="url(#${tc})">`
  s += `<rect x="${baseX - g(100) + lean * 0.4}" y="400" width="${g(60)}" height="${H}" fill="${P.umberDark}" opacity=".55" filter="url(#soft6)"/>`
  s += `<rect x="${baseX + g(14) + lean * 0.6}" y="400" width="${g(20)}" height="${H}" fill="#a07a52" opacity=".55" filter="url(#soft6)"/>`
  const bark = []
  for (let i = 0; i < 40; i++) {
    const y = rand(r, 470, H + 20)
    const x = baseX + lean * (1 - (y - 460) / (H - 460)) + rand(r, -g(40), g(40))
    bark.push([[x, y], [x + rand(r, -3, 3), y - rand(r, 30, 90)]])
  }
  s += brush(bark, P.umberDark, 2.4, 0.6) + '</g></g>'
  s += `<path d="${trunkD}" fill="none" stroke="${P.ink}" stroke-width="2.6" opacity=".8"/>`
  for (const [x, y, rad] of blobs) s += crown(r, x, y, rad, rad * 0.92, [P.greenDeep, '#2f4426', P.greenDark], { size: 1.6, ink: 2.4, count: Math.round(rad * 1.5) })
  // sunlit leaves on the right of each crown
  for (const [x, y, rad] of blobs) s += foliage(r, x + rad * 0.3, y - rad * 0.3, rad * 0.45, rad * 0.4, { dark: P.greenDark, mid: P.green, light: '#7f8d4d', count: Math.round(rad * 0.25), size: 1.4 })
  return s
}

function trees() {
  const r = rng(83)
  const left = [[-40, 520, 180], [120, 300, 210], [330, 150, 170], [-60, 160, 190], [300, 420, 130]]
  const right = [[2520, 130, 150], [2450, 330, 135], [2600, 260, 160], [2520, 470, 105]]
  return layer('foreground/trees/trees.webp', bigTree(r, 120, 40, left) + bigTree(r, 2490, -20, right, 0.7), { seed: 83, scale: 1, wobble: 7 })
}

// ─── ambient sprites ────────────────────────────────────────────────────────
function cloudArt(rel, seed, w) {
  const r = rng(seed)
  const x = 30
  const y = 110
  const parts = [[x + w / 2, y, w * 0.5, 15]]
  const n = 5 + Math.floor(r() * 3)
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n
    const rx = w * rand(r, 0.13, 0.24) * (1 - Math.abs(t - 0.5) * 0.8)
    const ry = rx * rand(r, 0.42, 0.62)
    parts.push([x + w * t + rand(r, -12, 12), y - ry * rand(r, 0.35, 0.8), rx, ry])
  }
  const union = parts.map(([cx, cy, rx, ry]) => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}"/>`).join('')
  const cid = id('cl')
  let s = `<clipPath id="${cid}">${union}</clipPath><g filter="url(#rim)"><g fill="${P.white}">${union}</g><g clip-path="url(#${cid})">`
  s += `<rect x="${x - 40}" y="${y - 12}" width="${w + 80}" height="50" fill="#93a6bb" opacity=".8" filter="url(#soft6)"/>`
  for (const [cx, cy, rx, ry] of parts.slice(1)) s += `<ellipse cx="${f(cx + rx * 0.2)}" cy="${f(cy - ry * 0.45)}" rx="${f(rx * 0.6)}" ry="${f(ry * 0.4)}" fill="#ffffff" opacity=".75" filter="url(#soft2)"/>`
  s += '</g></g>'
  for (let i = 0; i < Math.max(1, Math.floor(w / 140)); i++) {
    const qx = x + rand(r, 0.15, 0.8) * w
    s += `<path d="M${f(qx)},${f(y + 4)} q16,-14 30,-1 q-9,-7 -15,3" fill="none" stroke="#6f839c" stroke-width="2" opacity=".6"/>`
  }
  return saveFramed(rel, w + 60, 160, painted(s), { defs: paintDefs(seed, { wobble: 5, grain: 0.3, mottle: 0.05 }), pad: 24 })
}

const fogArt = () =>
  save(
    'effects/fog.webp',
    svg(1600, 320, `<filter id="b" x="-20%" y="-50%" width="140%" height="200%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="34"/></filter><g filter="url(#b)" fill="#f2ecdc"><ellipse cx="420" cy="170" rx="330" ry="60" opacity=".8"/><ellipse cx="860" cy="150" rx="380" ry="70" opacity=".9"/><ellipse cx="1260" cy="175" rx="280" ry="55" opacity=".75"/></g>`, { scale: 0.5 }),
  )

const smokeArt = () => {
  const r = rng(5)
  const pts = []
  for (let i = 0; i < 9; i++) pts.push([64 + Math.cos((i / 9) * TAU) * rand(r, 26, 40), 64 + Math.sin((i / 9) * TAU) * rand(r, 22, 34)])
  return save('effects/smoke.webp', svg(128, 128, `<filter id="b" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="7"/></filter><path filter="url(#b)" d="${smoothPath([...pts, pts[0]])}Z" fill="#e6e0d2"/>`))
}

const glowArt = () =>
  save('effects/glow.webp', svg(256, 256, `<radialGradient id="g"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".9"/><stop offset=".35" stop-color="#f0a040" stop-opacity=".45"/><stop offset="1" stop-color="#e07a2a" stop-opacity="0"/></radialGradient><circle cx="128" cy="128" r="128" fill="url(#g)"/>`))

/** Flame in the manner of a manuscript: vermilion tongues, ochre body, a pale gold heart. */
const flameArt = () =>
  saveFramed(
    'effects/flame.webp',
    96,
    160,
    painted(
      `<path d="M48,156 C14,150 6,112 22,84 C30,96 34,100 38,96 C30,70 40,40 50,6 C58,40 80,58 74,92 C80,88 84,80 86,72 C96,104 86,150 48,156Z" fill="${P.vermilion}" stroke="${P.ink}" stroke-width="2.4"/>` +
        `<path d="M48,150 C28,146 24,120 34,104 C40,112 44,112 46,108 C42,92 48,74 54,58 C60,82 74,98 66,122 C70,120 72,116 74,112 C78,132 68,148 48,150Z" fill="${P.ochre}"/>` +
        `<path d="M48,146 C38,142 36,128 42,118 C46,124 50,122 50,116 C52,124 60,130 56,140 C54,144 52,146 48,146Z" fill="${P.goldPale}"/>`,
    ),
    { defs: paintDefs(9, { wobble: 3, grain: 0.25, mottle: 0.05 }), pad: 12 },
  )

const birdArt = () =>
  saveFramed('background/birds/bird.webp', 80, 40, painted(`<path d="M4,27 Q12,12 22,14 Q32,16 40,25 Q48,12 60,12 Q70,13 76,26" fill="none" stroke="#2f2219" stroke-width="5" stroke-linecap="round"/><path d="M36,24 q4,4 8,0" fill="#2f2219"/>`), { defs: paintDefs(4, { wobble: 1.5, grain: 0.2, mottle: 0 }), pad: 8 })

function pennantArt(rel, fill, edge, seed) {
  const r = rng(seed)
  const d = 'M4,6 Q70,2 132,6 L104,32 L132,58 Q70,62 4,58Z'
  const s = `<g filter="url(#rim)"><path d="${d}" fill="${fill}"/>${brush([[[8, 15], [112, 14]], [[8, 49], [112, 50]]], edge, 3.4, 0.95)}${brush([[[40, 8], [44, 56]], [[86, 8], [84, 56]]], '#000000', 6, 0.1)}</g><path d="${d}" fill="none" stroke="${P.ink}" stroke-width="2.2" opacity=".85"/><path d="M4,4 V60" stroke="${P.umberDark}" stroke-width="4"/>`
  void r
  return saveFramed(rel, 140, 64, painted(s), { defs: paintDefs(seed, { wobble: 2.5, grain: 0.3, mottle: 0.05 }), pad: 10 })
}

function ravenPerchedArt() {
  const black = '#262120'
  const s =
    `<g filter="url(#rim)"><path d="M70,150 L28,206 L52,204 L44,214 L84,170Z" fill="${black}"/>` +
    `<path d="M60,150 C56,100 92,70 132,74 C170,78 178,120 160,150 C146,172 92,178 60,150Z" fill="${black}"/>` +
    `<circle cx="146" cy="62" r="30" fill="${black}"/></g>` +
    brush([[[84, 112], [104, 128], [150, 134]], [[80, 128], [100, 146], [146, 148]]], '#56607a', 2.5, 0.8) +
    `<path d="M166,52 C186,54 204,62 216,72 C200,76 184,76 170,74Z" fill="#4a4544" stroke="${P.ink}" stroke-width="2"/>` +
    circle(152, 54, 5.5, P.white, 1.2) +
    circle(153.5, 54, 2.8, '#120f0e', 0) +
    brush([[[108, 172], [104, 196]], [[126, 172], [128, 196]], [[96, 198], [140, 198]]], '#4a4544', 4, 1)
  return saveFramed('characters/raven/raven-perched.webp', 220, 220, painted(s), { defs: paintDefs(21, { wobble: 3, grain: 0.3, mottle: 0.05 }), scale: 0.8, pad: 12 })
}

/** A pilgrim with a staff and satchel, walking the road to the castle (two strides in one strip). */
function pilgrimArt() {
  const frame = (legA, legB, dx) =>
    `<g transform="translate(${dx},0)">` +
    brush([[[38, 108], [38 + legA, 150]], [[44, 108], [44 + legB, 150]]], P.umberDark, 6, 1) +
    `<g filter="url(#rim)"><path d="M26,58 Q24,96 22,114 L60,114 Q58,92 56,58 Q41,46 26,58Z" fill="#7a5b3c"/></g>` +
    `<path d="M26,58 Q24,96 22,114 L60,114 Q58,92 56,58 Q41,46 26,58Z" fill="none" stroke="${P.ink}" stroke-width="2"/>` +
    `<path d="M30,62 L56,96" stroke="${P.umberDark}" stroke-width="3"/><g filter="url(#rim)"><rect x="50" y="88" width="16" height="18" rx="4" fill="${P.ochre}"/></g>` +
    `<circle cx="42" cy="40" r="11" fill="#e3c39d" stroke="${P.ink}" stroke-width="1.6"/>` +
    `<path d="M30,44 Q30,22 44,24 Q58,26 56,46 Q50,34 42,34 Q34,36 30,44Z" fill="#5d4630" stroke="${P.ink}" stroke-width="1.6"/>` +
    brush([[[68, 34], [62, 152]]], P.umber, 4, 1) +
    `</g>`
  return saveFramed('characters/pilgrim/pilgrim.webp', 180, 160, painted(frame(-8, 10, 0) + frame(8, -6, 90)), { defs: paintDefs(33, { wobble: 2, grain: 0.3, mottle: 0.05 }), pad: 10 })
}

// ─── paper grain (whole-page overlay, very light) ───────────────────────────
const paper = () =>
  save(
    'textures/paper.webp',
    svg(
      256,
      256,
      `<filter id="n" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".6 .22" numOctaves="3" stitchTiles="stitch" seed="3"/>
      <feColorMatrix values="0 0 0 0 .36  0 0 0 0 .25  0 0 0 0 .15  0.55 0 0 0 -.22"/>
    </filter><rect width="256" height="256" filter="url(#n)"/>`,
    ),
  )

const layers = [sky, mountains, hills, castle, village, forest, ground, rocks, bushes, trees]
const files = []
for (const draw of layers) files.push(await draw())
if (wanted('sprites')) {
await sunArt()
await cloudArt('background/clouds/cloud-a.webp', 7, 420)
await cloudArt('background/clouds/cloud-b.webp', 8, 330)
await cloudArt('background/clouds/cloud-c.webp', 9, 250)
await birdArt()
await fogArt()
await smokeArt()
await glowArt()
await flameArt()
await pennantArt('environment/banners/pennant-red.webp', P.vermilion, P.goldPale, 41)
await pennantArt('environment/banners/pennant-blue.webp', P.azure, P.white, 42)
await pennantArt('environment/banners/pennant-gold.webp', P.gold, P.red, 43)
await ravenPerchedArt()
await pilgrimArt()
await paper()
}
await writeFile(resolve(ROOT, 'src/components/medieval/anchors.json'), JSON.stringify(anchors, null, 2) + '\n')
console.log('✓ anchors.json')

const preview = process.argv[2]
if (preview) {
  const size = { width: 1600, height: 900 }
  const bufs = await Promise.all(files.map((file) => sharp(file).resize(size).toBuffer()))
  const sunBuf = await sharp(resolve(OUT, 'background/sun/sun.webp')).resize(118).toBuffer()
  await sharp({ create: { ...size, channels: 4, background: '#efe3c8' } })
    .composite([{ input: bufs[0] }, { input: sunBuf, left: R((SUN[0] / W) * 1600 - 59), top: R((SUN[1] / H) * 900 - 59) }, ...bufs.slice(1).map((input) => ({ input }))])
    .png()
    .toFile(preview)
  console.log('preview →', preview)
}
