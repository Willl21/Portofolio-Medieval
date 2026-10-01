// UI ornaments, characters and project paintings, painted with the same system as the scene.
// Everything is rasterised to WebP. Run: npm run art   (ONLY=banderole,sign … to redo a few)
import sharp from 'sharp'
import { TAU, circle, f, mullet, pick, poly, rand, rng, saveFramed, smooth } from './lib.mjs'
import { P, brush, dab, id, paintDefs, painted, wallDefs } from './paint.mjs'

const ONLY = process.env.ONLY?.split(',')
const wanted = (rel) => !ONLY || ONLY.some((k) => rel.includes(k))

/** Render a painted sprite. `wobble` stays small on UI pieces so edges stay tidy. */
const sprite = (rel, w, h, body, { scale = 2, wobble = 2.5, grain = 0.32, mottle = 0.06, seed = 5, defs = '', pad = 16 } = {}) =>
  wanted(rel) ? saveFramed(rel, w, h, painted(body), { defs: paintDefs(seed, { wobble, grain, mottle }) + wallDefs + defs, scale, pad }) : null

const ink = (d, w = 2, o = 0.85) => `<path d="${d}" fill="none" stroke="${P.ink}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" opacity="${o}"/>`
const fill = (d, color, rim = true) => (rim ? `<g filter="url(#rim)"><path d="${d}" fill="${color}"/></g>` : `<path d="${d}" fill="${color}"/>`)
const shape = (d, color, w = 2) => fill(d, color) + ink(d, w)

/** Parchment wash inside a path: warm pools, darker rim. */
function parchmentIn(r, d, [x, y, w, h], base = P.parchment) {
  const cid = id('pa')
  let s = `<clipPath id="${cid}"><path d="${d}"/></clipPath><g filter="url(#rim)"><path d="${d}" fill="${base}"/><g clip-path="url(#${cid})">`
  for (let i = 0; i < 6; i++)
    s += `<ellipse cx="${f(x + rand(r, 0, w))}" cy="${f(y + rand(r, 0, h))}" rx="${f(w * rand(r, 0.1, 0.3))}" ry="${f(h * rand(r, 0.15, 0.4))}" fill="${pick(r, [P.ochrePale, '#f5ead0', '#d9c495'])}" opacity="${f(rand(r, 0.3, 0.6))}" filter="url(#soft)"/>`
  return s + '</g></g>'
}

// ─── banderole: the scroll the title is written on ──────────────────────────
function banderole() {
  const r = rng(61)
  const tail = (dir) => {
    const X = (v) => (dir < 0 ? v : 1600 - v)
    const t = `M${X(250)},118 L${X(40)},150 L${X(118)},212 L${X(40)},282 L${X(250)},300Z`
    return shape(t, '#d2bd8f') + fill(`M${X(250)},118 L${X(205)},92 L${X(205)},118Z M${X(250)},300 L${X(205)},272 L${X(205)},300Z`, '#a38d63', false) + brush([[[X(230), 160], [X(70), 175]], [[X(230), 255], [X(70), 262]]], '#b49f74', 3, 0.6)
  }
  const band = 'M200,92 Q520,58 800,70 Q1080,82 1400,92 L1400,272 Q1080,262 800,276 Q520,290 200,272Z'
  let s = tail(-1) + tail(1)
  s += parchmentIn(r, band, [200, 60, 1200, 230])
  s += brush([[[230, 108], [800, 90], [1370, 108]], [[230, 256], [800, 262], [1370, 256]]], P.vermilion, 2, 0.45)
  s += ink(band, 2.6)
  return sprite('ornaments/banderole/banderole.webp', 1600, 360, s, { scale: 1, seed: 61, wobble: 4 })
}

// ─── illuminated border (9-slice; slice at 37/264 of the tile) ──────────────
function illuminatedBorder() {
  const S = 264
  const b = 30 // band thickness
  const o = 7 // outer gold rule inset
  let s = ''
  for (const d of [
    `M${o + b},${o} H${S - o - b} V${o + b} H${o + b}Z`,
    `M${o + b},${S - o - b} H${S - o - b} V${S - o} H${o + b}Z`,
    `M${o},${o + b} H${o + b} V${S - o - b} H${o}Z`,
    `M${S - o - b},${o + b} H${S - o} V${S - o - b} H${S - o - b}Z`,
  ])
    s += fill(d, P.azure)
  // white penwork vine along every run, gilt bezants in the troughs
  const vine = (horizontal, fixed, from, to) => {
    let d = ''
    let dots = ''
    for (let t = from; t < to; t += 36) {
      if (horizontal) {
        d += `M${t},${fixed} q9,-8 18,0 t18,0 `
        dots += circle(t + 9, fixed + 6, 2.6, P.gold, 0)
      } else {
        d += `M${fixed},${t} q-8,9 0,18 t0,18 `
        dots += circle(fixed + 6, t + 9, 2.6, P.gold, 0)
      }
    }
    return `<path d="${d}" fill="none" stroke="${P.white}" stroke-width="1.8" opacity=".9"/>` + dots
  }
  s += vine(true, o + b / 2, o + b, S - o - b) + vine(true, S - o - b / 2, o + b, S - o - b) + vine(false, o + b / 2, o + b, S - o - b) + vine(false, S - o - b / 2, o + b, S - o - b)
  for (const [cx, cy] of [[o, o], [S - o - b, o], [o, S - o - b], [S - o - b, S - o - b]]) {
    s += fill(`M${cx},${cy} h${b} v${b} h${-b}Z`, P.vermilion)
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU
      s += `<circle cx="${f(cx + b / 2 + Math.cos(a) * 6)}" cy="${f(cy + b / 2 + Math.sin(a) * 6)}" r="5.2" fill="url(#goldLeaf)" stroke="${P.goldDark}" stroke-width=".9"/>`
    }
    s += circle(cx + b / 2, cy + b / 2, 2.5, P.vermilion, 0)
  }
  s += `<rect x="2.5" y="2.5" width="${S - 5}" height="${S - 5}" fill="none" stroke="url(#goldLeaf)" stroke-width="4"/>`
  s += `<rect x="${o}" y="${o}" width="${S - o * 2}" height="${S - o * 2}" fill="none" stroke="${P.ink}" stroke-width="1.6" opacity=".85"/>`
  s += `<rect x="${o + b}" y="${o + b}" width="${S - (o + b) * 2}" height="${S - (o + b) * 2}" fill="none" stroke="${P.ink}" stroke-width="1.6" opacity=".85"/>`
  return sprite('ornaments/borders/illuminated.webp', S, S, s, { scale: 2, seed: 63, wobble: 1, pad: 6 })
}

// ─── parchment for panels ───────────────────────────────────────────────────
function parchmentTexture() {
  if (!wanted('textures/parchment')) return null
  const r = rng(65)
  let s = `<rect x="-20" y="-20" width="1064" height="1064" fill="${P.parchment}"/>`
  for (let i = 0; i < 22; i++)
    s += `<ellipse cx="${f(rand(r, 0, 1024))}" cy="${f(rand(r, 0, 1024))}" rx="${f(rand(r, 60, 260))}" ry="${f(rand(r, 40, 200))}" fill="${pick(r, [P.ochrePale, '#f6ecd4', '#d8c293', '#e2cfa4'])}" opacity="${f(rand(r, 0.25, 0.55))}" filter="url(#soft)"/>`
  const fibres = []
  for (let i = 0; i < 380; i++) {
    const x = rand(r, 0, 1024)
    const y = rand(r, 0, 1024)
    const a = rand(r, -0.4, 0.4)
    const l = rand(r, 6, 26)
    fibres.push([[x, y], [x + Math.cos(a) * l, y + Math.sin(a) * l]])
  }
  s += brush(fibres, '#b9a274', 0.9, 0.35)
  return saveFramed('textures/parchment.webp', 1024, 1024, painted(s), { defs: paintDefs(65, { wobble: 0, grain: 0.42, mottle: 0.16 }), scale: 1, pad: 0, quality: 80 })
}

// ─── the fingerpost at the crossroads: a post and a pointing arm (lettered at runtime) ─
// Keep in sync with ARM / POST in src/components/medieval/Fingerpost.tsx.
const ARM = { w: 340, h: 92, text: [26, 16, 272, 76] }
function fingerpost() {
  const r = rng(67)
  // the post: weathered oak, a small gilt cap, grass round its foot
  let post = shape('M30,470 L34,40 Q45,20 56,40 L60,470Z', P.umber, 2.2)
  post += brush([[[50, 50], [52, 460]], [[40, 80], [41, 440]]], '#9b7650', 2.6, 0.55)
  post += brush([[[36, 120], [56, 118]], [[36, 260], [56, 262]]], P.umberDark, 2, 0.6)
  post += `<circle cx="45" cy="30" r="10" fill="url(#goldLeaf)" stroke="${P.goldDark}" stroke-width="1.6"/>`
  const blades = []
  for (let i = 0; i < 30; i++) {
    const x = rand(r, 6, 84)
    blades.push([[x, 474], [x + rand(r, -8, 8), 474 - rand(r, 14, 34)]])
  }
  post += brush(blades, P.greenDark, 2.2, 0.9)
  const a = sprite('ornaments/signs/post.webp', 90, 480, post, { scale: 1, seed: 66, wobble: 2, pad: 12 })

  // one arm, pointing right: a plank with a pointed end and a parchment label nailed on
  const plank = 'M2,12 Q150,4 296,8 L338,46 L296,86 Q150,90 2,82Z'
  const pc = id('pk')
  let arm = `<clipPath id="${pc}"><path d="${plank}"/></clipPath><g filter="url(#rim)"><path d="${plank}" fill="#a07b4c"/><g clip-path="url(#${pc})">`
  const grain = []
  for (let i = 0; i < 9; i++) {
    const y = rand(r, 10, 86)
    grain.push([[0, y], [120, y + rand(r, -2, 2)], [240, y + rand(r, -2, 2)], [340, y + rand(r, -2, 2)]])
  }
  arm += brush(grain, '#6f5232', 1.5, 0.45) + '</g></g>' + ink(plank, 2.2)
  const [x0, y0, x1, y1] = ARM.text
  const panel = `M${x0 - 4},${y0 - 4} H${x1 + 4} V${y1 + 4} H${x0 - 4}Z`
  arm += parchmentIn(r, panel, [x0, y0, x1 - x0, y1 - y0]) + ink(panel, 1.6, 0.8)
  arm += `<rect x="${x0 + 2}" y="${y0 + 2}" width="${x1 - x0 - 4}" height="${y1 - y0 - 4}" fill="none" stroke="${P.vermilion}" stroke-width="1.4" opacity=".55"/>`
  for (const [x, y] of [[x0 + 1, y0 + 1], [x1 - 1, y0 + 1], [x0 + 1, y1 - 1], [x1 - 1, y1 - 1]]) arm += circle(x, y, 2.6, P.goldDark, 0.6)
  arm += circle(312, 46, 3.2, P.umberDark, 0)
  const b = sprite('ornaments/signs/arm.webp', ARM.w, ARM.h, arm, { scale: 1, seed: 68, wobble: 1.5, pad: 10 })
  return Promise.all([a, b]).then((files) => files.filter(Boolean)[0] ?? null)
}

// ─── divider: penwork flourish around a gilt lozenge ────────────────────────
function divider() {
  const scroll = (dir) =>
    `<path d="M${400 + dir * 22},40 C${400 + dir * 50},14 ${400 + dir * 84},18 ${400 + dir * 82},36 C${400 + dir * 80},50 ${400 + dir * 60},50 ${400 + dir * 60},38" fill="none" stroke="${P.vermilion}" stroke-width="3"/>` +
    `<path d="M${400 + dir * 30},40 C${400 + dir * 60},66 ${400 + dir * 110},60 ${400 + dir * 120},42" fill="none" stroke="${P.azure}" stroke-width="2.6"/>` +
    `<path d="M${400 + dir * 124},40 L${400 + dir * 372},40" stroke="${P.umber}" stroke-width="2.4" stroke-linecap="round"/>` +
    circle(400 + dir * 124, 40, 4, P.vermilion, 0) +
    circle(400 + dir * 150, 34, 2.4, P.azure, 0) +
    circle(400 + dir * 150, 46, 2.4, P.azure, 0)
  const s = scroll(-1) + scroll(1) + `<path d="M400,14 L418,40 L400,66 L382,40Z" fill="url(#goldLeaf)" stroke="${P.goldDark}" stroke-width="2"/>` + circle(400, 40, 4.5, P.vermilion, 0)
  return sprite('ornaments/dividers/divider.webp', 800, 80, s, { scale: 1, seed: 69, wobble: 1.5, pad: 8 })
}

// ─── royal emblem: crowned shield ───────────────────────────────────────────
function emblem() {
  const shieldD = 'M60,110 H340 V260 C340,370 262,430 200,458 C138,430 60,370 60,260Z'
  let s = `<clipPath id="es"><path d="${shieldD}"/></clipPath>` + fill(shieldD, P.red)
  s += `<g clip-path="url(#es)"><path d="M40,340 L200,200 L360,340 L360,282 L200,142 L40,282Z" fill="url(#goldLeaf)"/>${brush([[[120, 120], [110, 440]], [[290, 120], [300, 440]]], '#5e1f17', 10, 0.18)}</g>`
  for (const [x, y, rr] of [[126, 168, 26], [274, 168, 26], [200, 368, 30]]) s += `<path d="${mullet(x, y, rr)}Z" fill="url(#goldLeaf)" stroke="${P.goldDark}" stroke-width="2"/>`
  s += ink(shieldD, 5)
  s += `<path d="M110,96 L96,30 L150,62 L200,14 L250,62 L304,30 L290,96Z" fill="url(#goldLeaf)" stroke="${P.goldDark}" stroke-width="3"/>`
  s += shape('M104,84 H296 V108 H104Z', P.goldPale, 2.4)
  for (const [x, y] of [[96, 30], [200, 14], [304, 30]]) s += circle(x, y, 9, P.white, 2)
  for (const x of [140, 200, 260]) s += circle(x, 96, 6, x === 200 ? P.azure : P.vermilion, 1.5)
  return sprite('ornaments/royal-emblems/emblem.webp', 400, 470, s, { scale: 0.5, seed: 71, wobble: 3 })
}

function waxSeal() {
  const r = rng(13)
  const pts = []
  for (let i = 0; i < 17; i++) {
    const a = (i / 17) * TAU
    pts.push([100 + Math.cos(a) * rand(r, 80, 92), 100 + Math.sin(a) * rand(r, 80, 92)])
  }
  const blob = smooth([...pts, pts[0], pts[1]]) + 'Z'
  const s =
    fill(blob, '#8c2a26') +
    ink(blob, 2.4, 0.7) +
    `<circle cx="100" cy="100" r="62" fill="#7a2320" stroke="#5a1816" stroke-width="3"/>` +
    `<path d="M58,128 L100,88 L142,128 L142,112 L100,72 L58,112Z" fill="#a5403a"/>` +
    `<path d="${mullet(100, 134, 14)}Z" fill="#a5403a"/>` +
    `<path d="M48,70 A62,62 0 0 1 96,40" fill="none" stroke="#c76a5e" stroke-width="6" opacity=".7" stroke-linecap="round"/>`
  return sprite('ornaments/seals/wax-seal.webp', 200, 200, s, { scale: 1, seed: 73, wobble: 3 })
}

function quill() {
  const barbs = []
  for (let i = 1; i < 16; i++) {
    const t = i / 16
    const x = 214 - t * 116
    const y = 14 + t * 206
    barbs.push([[x, y], [x - 18 + t * 8, y + 8]], [[x, y], [x + 16 - t * 6, y - 8]])
  }
  const s =
    fill('M214,14 C250,40 190,150 96,226 C150,150 168,70 214,14Z', P.white) +
    fill('M214,14 C170,48 130,140 96,226 C120,170 140,110 214,14Z', '#ddd3b8', false) +
    brush(barbs, '#b9ad8f', 1.4, 0.7) +
    ink('M214,14 C160,90 120,170 92,236', 2.4) +
    ink('M214,14 C250,40 190,150 96,226', 1.8, 0.6) +
    shape('M98,222 L80,262 L90,232Z', P.umberDark, 1.6) +
    shape('M126,236 H214 L206,288 H134Z', P.azureDeep) +
    shape('M118,226 H222 V240 H118Z', P.azure) +
    brush([[[146, 250], [146, 280]]], '#8ea4c8', 3, 0.6)
  return sprite('ornaments/quill/quill.webp', 300, 300, s, { scale: 0.8, seed: 75, wobble: 2.5 })
}

function compass() {
  const ticks = []
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * TAU
    const r0 = i % 4 ? 84 : 78
    ticks.push([[100 + Math.cos(a) * r0, 100 + Math.sin(a) * r0], [100 + Math.cos(a) * 90, 100 + Math.sin(a) * 90]])
  }
  const point = (a, len, w, l, rr) => {
    const tip = [100 + Math.cos(a) * len, 100 + Math.sin(a) * len]
    const pl = [100 + Math.cos(a - Math.PI / 2) * w, 100 + Math.sin(a - Math.PI / 2) * w]
    const pr = [100 + Math.cos(a + Math.PI / 2) * w, 100 + Math.sin(a + Math.PI / 2) * w]
    return shape(poly([[100, 100], pl, tip]) + 'Z', l, 1.6) + shape(poly([[100, 100], tip, pr]) + 'Z', rr, 1.6)
  }
  const disc = 'M8,100 A92,92 0 1 1 192,100 A92,92 0 1 1 8,100Z'
  let s = fill(disc, P.white) + ink(disc, 2.4) + `<circle cx="100" cy="100" r="76" fill="none" stroke="${P.ink}" stroke-width="1.6" opacity=".7"/>` + brush(ticks, P.ink, 1.6, 0.8)
  for (let i = 0; i < 4; i++) s += point((i / 4) * TAU + Math.PI / 4, 52, 12, P.azure, '#8ea4c8')
  for (let i = 0; i < 4; i++) s += point((i / 4) * TAU - Math.PI / 2, 80, 16, P.red, P.gold)
  s += `<circle cx="100" cy="100" r="9" fill="url(#goldLeaf)" stroke="${P.goldDark}" stroke-width="2"/>` + shape('M100,2 L108,16 H92Z', P.vermilion, 1.4)
  return sprite('ornaments/map/compass.webp', 200, 200, s, { scale: 0.6, seed: 77, wobble: 1.5 })
}

/** Gilded frame for the gallery, 9-slice friendly (border-image-slice ≈ 56). */
function gildedFrame() {
  const W = 600
  const H = 450
  const b = 56
  const ring = `M0,0 H${W} V${H} H0Z M${b},${b} V${H - b} H${W - b} V${b}Z`
  let s = `<g filter="url(#rim)"><path d="${ring}" fill="url(#goldLeaf)" fill-rule="evenodd"/></g>`
  s += `<rect x="9" y="9" width="${W - 18}" height="${H - 18}" fill="none" stroke="${P.goldPale}" stroke-width="5" opacity=".9"/>`
  s += `<rect x="${b - 11}" y="${b - 11}" width="${W - 2 * (b - 11)}" height="${H - 2 * (b - 11)}" fill="none" stroke="${P.goldDark}" stroke-width="7"/>`
  for (let x = b + 24; x < W - b - 12; x += 22) s += circle(x, b / 2, 3.6, P.goldPale, 1) + circle(x, H - b / 2, 3.6, P.goldPale, 1)
  for (let y = b + 24; y < H - b - 12; y += 22) s += circle(b / 2, y, 3.6, P.goldPale, 1) + circle(W - b / 2, y, 3.6, P.goldPale, 1)
  for (const [cx, cy] of [[b / 2, b / 2], [W - b / 2, b / 2], [b / 2, H - b / 2], [W - b / 2, H - b / 2]]) {
    s += `<circle cx="${cx}" cy="${cy}" r="24" fill="url(#goldLeaf)" stroke="${P.ink}" stroke-width="2.4"/>`
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + Math.PI / 4
      s += circle(cx + Math.cos(a) * 10, cy + Math.sin(a) * 10, 9, P.vermilion, 1.6)
    }
    s += circle(cx, cy, 5.5, P.goldPale, 1.4)
  }
  s += `<path d="M1.5,1.5 H${W - 1.5} V${H - 1.5} H1.5Z" fill="none" stroke="${P.ink}" stroke-width="3"/><path d="M${b},${b} H${W - b} V${H - b} H${b}Z" fill="none" stroke="${P.ink}" stroke-width="3"/>`
  return sprite('ornaments/frames/gilded-frame.webp', W, H, s, { scale: 1, seed: 79, wobble: 1, pad: 6 })
}

// ─── characters ─────────────────────────────────────────────────────────────
const BLACK = '#262120'
const SHEEN = '#56607a'

function raven() {
  const s =
    fill('M330,170 C350,110 380,60 430,24 L420,58 L452,50 L428,80 L462,82 L420,106 L446,118 L404,128 L418,150 L380,158Z', '#1c1817') +
    fill('M140,180 L40,150 L58,176 L30,190 L62,200 L44,224 L150,214Z', BLACK) +
    brush([[[300, 226], [318, 252], [332, 250]], [[318, 252], [322, 266]]], '#4a4544', 4, 1) +
    fill('M130,200 C170,160 260,150 340,158 C400,162 440,150 462,140 C470,180 440,210 400,218 C320,236 220,236 130,214Z', BLACK) +
    fill('M300,172 C270,120 220,70 166,30 L190,62 L146,56 L184,84 L136,86 L182,108 L138,120 L192,132 L160,152 L214,156 L204,178Z', BLACK) +
    brush([[[290, 160], [260, 120], [190, 62]], [[276, 166], [246, 136], [184, 84]], [[262, 170], [236, 148], [182, 108]]], SHEEN, 2.5, 0.8) +
    `<circle cx="470" cy="150" r="36" fill="${BLACK}"/>` +
    shape('M494,134 C530,138 560,150 584,164 C556,168 526,170 496,170Z', '#4a4544', 2) +
    circle(474, 140, 7, P.white, 1.4) +
    circle(476, 140, 3.5, '#120f0e', 0)
  return sprite('characters/raven/raven.webp', 600, 290, s, { scale: 1, seed: 81, wobble: 3 })
}

function knight() {
  const mail = '#8d9196'
  const steel = '#aeb2b6'
  const shieldD = 'M60,370 H220 V450 C220,520 176,556 140,574 C104,556 60,520 60,450Z'
  const sc = 'M176,296 H324 L356,604 H144Z'
  const legLines = []
  for (const x0 of [196, 268]) for (let y = 620; y < 820; y += 40) legLines.push([[x0, y], [x0 + 36, y]])
  const s = [
    shape('M192,590 H236 V830 H192Z M264,590 H308 V830 H264Z', mail),
    brush(legLines, '#6f7378', 2, 0.8),
    shape('M180,826 C180,808 240,808 244,830 L244,846 H176Z M256,830 C260,808 320,808 320,826 L324,846 H256Z', steel),
    shape('M326,312 C352,330 364,380 366,430 L340,434 C338,392 330,356 314,336Z', mail),
    shape('M360,452 H372 V770 L366,800 L360,770Z', '#d6d9dc', 1.6),
    shape('M326,440 H406 V454 H326Z', P.gold, 1.6),
    shape('M358,400 H374 V442 H358Z', P.umber, 1.6),
    `<circle cx="366" cy="394" r="10" fill="url(#goldLeaf)" stroke="${P.ink}" stroke-width="2"/>`,
    `<circle cx="352" cy="436" r="16" fill="${mail}" stroke="${P.ink}" stroke-width="2"/>`,
    shape(sc, P.red),
    `<clipPath id="ksc"><path d="${sc}"/></clipPath><g clip-path="url(#ksc)"><path d="M120,520 L250,400 L380,520 L380,480 L250,360 L120,480Z" fill="url(#goldLeaf)"/></g>`,
    shape('M164,454 H336 V474 H164Z', P.umber, 1.6),
    `<path d="M238,450 H262 V478 H238Z" fill="url(#goldLeaf)" stroke="${P.ink}" stroke-width="1.6"/>`,
    shape('M176,296 C190,270 310,270 324,296 C300,312 200,312 176,296Z', mail),
    shape('M202,286 V196 C202,160 298,160 298,196 V286Z', steel),
    `<path d="M206,222 H294 V234 H206Z" fill="#1e1a18"/>`,
    `<path d="M244,182 H256 V286 H244Z" fill="url(#goldLeaf)" stroke="${P.ink}" stroke-width="1.4"/>`,
    shape('M250,166 C230,120 270,100 300,120 C280,122 266,136 262,166Z', P.vermilion),
    shape('M176,312 C150,330 140,370 138,410 L164,412 C166,380 172,354 186,336Z', mail),
    shape(shieldD, P.red, 2.6),
    `<clipPath id="ksh"><path d="${shieldD}"/></clipPath><g clip-path="url(#ksh)"><path d="M50,500 L140,420 L230,500 L230,468 L140,388 L50,468Z" fill="url(#goldLeaf)"/></g>`,
    ...[[104, 400, 13], [176, 400, 13], [140, 520, 15]].map(([x, y, rr]) => `<path d="${mullet(x, y, rr)}Z" fill="url(#goldLeaf)" stroke="${P.goldDark}" stroke-width="1.2"/>`),
    ink(shieldD, 2.6),
  ].join('')
  return sprite('characters/knight/knight.webp', 460, 860, s, { scale: 0.6, seed: 83, wobble: 3 })
}

function scribe() {
  const habit = '#6e4d33'
  const shade = '#56392a'
  const skin = '#e3c39d'
  const s = [
    shape('M150,560 H330 V586 H150Z', P.umber),
    shape('M166,586 H184 V740 H166Z M296,586 H314 V740 H296Z', P.umber),
    shape('M176,742 C188,640 192,560 206,470 C214,400 236,340 280,318 C320,300 362,312 380,346 L404,512 C446,556 456,690 440,742Z', habit),
    brush([[[250, 380], [246, 470], [252, 600], [246, 736]], [[330, 520], [350, 600], [360, 680], [360, 738]]], shade, 4, 0.8),
    shape('M548,744 H640 V760 H548Z', P.umber),
    shape('M586,460 H604 V744 H586Z', P.umber),
    shape('M452,470 L668,404 L676,428 L460,494Z', '#7a5636'),
    shape('M478,462 L562,436 L572,446 L568,452 L486,476Z', P.white, 1.6),
    shape('M562,436 L648,410 L654,418 L572,446Z', P.white, 1.6),
    brush([[[492, 466], [556, 446]], [[494, 472], [560, 452]], [[576, 438], [640, 418]], [[580, 444], [644, 424]]], '#7a5636', 1.4, 0.8),
    brush([[[492, 466], [504, 462]]], P.vermilion, 3, 1) + brush([[[576, 438], [588, 434]]], P.azure, 3, 1),
    shape('M636,378 H654 V412 H636Z', P.white, 1.6),
    shape('M645,378 C632,362 642,346 645,336 C650,348 660,362 645,378Z', P.ochre, 1.4),
    shape('M432,452 H456 V474 H432Z', '#2f2219', 1.6),
    shape('M330,356 C380,370 440,410 500,446 L488,470 C430,446 372,424 320,404Z', habit),
    `<circle cx="502" cy="456" r="15" fill="${skin}" stroke="${P.ink}" stroke-width="2"/>`,
    shape('M498,452 L560,330 C578,340 572,380 512,454Z', P.white, 1.6),
    shape('M262,330 C276,300 350,296 372,330 C350,352 286,354 262,330Z', shade),
    shape('M296,284 C296,230 340,214 372,226 C394,236 404,262 400,284 L412,296 L400,300 C398,318 382,330 360,330 C326,330 296,314 296,284Z', skin),
    shape('M298,270 C300,236 330,216 362,222 C342,228 326,240 318,262 C312,276 304,280 298,270Z', P.umber, 1.6),
    circle(378, 262, 3.5, '#2f2219', 0),
    brush([[[386, 306], [376, 309], [366, 306]]], '#8a5a40', 2.4, 1),
  ].join('')
  return sprite('characters/scribe/scribe.webp', 720, 780, s, { scale: 0.6, seed: 85, wobble: 3 })
}

// ─── project paintings ──────────────────────────────────────────────────────
const paintingSky = (w, horizon) =>
  `<linearGradient id="ps" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.azureDeep}"/><stop offset=".6" stop-color="#8fa6c2"/><stop offset="1" stop-color="#e3dac2"/></linearGradient><rect x="-20" y="-20" width="${w + 40}" height="${horizon + 20}" fill="url(#ps)"/>`

function festaFestum() {
  const r = rng(201)
  const W = 960
  const H = 720
  let out = paintingSky(W, 450)
  out += shape(`${smooth([[-20, 420], [200, 380], [480, 410], [760, 370], [980, 400]])} L980,${H + 20} L-20,${H + 20}Z`, '#a7a56c')
  out += shape(`${smooth([[-20, 520], [300, 480], [660, 510], [980, 470]])} L980,${H + 20} L-20,${H + 20}Z`, '#8a9452')
  const poles = [[90, 330], [480, 250], [870, 330]]
  for (const [x, y] of poles) out += shape(`M${x - 4},${y} h8 V600 h-8Z`, P.umber, 1.6) + `<circle cx="${x}" cy="${y}" r="9" fill="url(#goldLeaf)" stroke="${P.goldDark}" stroke-width="2"/>`
  for (let i = 0; i < 2; i++) {
    const [a, b] = [poles[i], poles[i + 1]]
    const c = [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 100]
    out += ink(`M${a[0]},${a[1] + 6} Q${c[0]},${c[1]} ${b[0]},${b[1] + 6}`, 2.2)
    for (let t = 0.08; t < 0.95; t += 0.09) {
      const x = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0]
      const y = (1 - t) * (1 - t) * (a[1] + 6) + 2 * (1 - t) * t * c[1] + t * t * (b[1] + 6)
      out += shape(`M${f(x - 12)},${f(y)} L${f(x + 12)},${f(y)} L${f(x)},${f(y + 28)}Z`, pick(r, [P.vermilion, P.gold, P.azure, P.white]), 1.6)
    }
  }
  for (const [dx, c] of [[-120, P.vermilion], [-60, P.gold], [60, P.azure], [120, P.vermilion]]) out += `<path d="M480,262 Q${480 + dx * 0.4},420 ${480 + dx},580" fill="none" stroke="${c}" stroke-width="5"/>`
  const tent = (cx, base, w, h, stripe) => {
    const outline = `M${cx - w / 2},${base} L${cx - w / 2},${base - h * 0.45} L${cx},${base - h} L${cx + w / 2},${base - h * 0.45} L${cx + w / 2},${base}Z`
    let t = fill(outline, P.white)
    for (let i = -4; i < 4; i += 2) t += `<path d="M${cx},${base - h} L${cx + (i * w) / 8},${base - h * 0.45} L${cx + ((i + 1) * w) / 8},${base - h * 0.45}Z M${cx + (i * w) / 8},${base - h * 0.45} h${w / 8} V${base} h${-w / 8}Z" fill="${stripe}"/>`
    t += `<path d="M${cx - w / 2},${base - h * 0.45} H${cx} V${base} H${cx - w / 2}Z" fill="${P.umberDark}" opacity=".15"/>`
    t += ink(outline, 2.6)
    t += shape(`M${cx - 26},${base} L${cx},${base - h * 0.35} L${cx + 26},${base}Z`, P.umberDark, 2)
    t += ink(`M${cx},${base - h} V${base - h - 34}`, 2.4) + shape(`M${cx},${base - h - 34} l40,8 l-40,8Z`, stripe, 1.6)
    return t
  }
  out += tent(200, 600, 230, 230, P.vermilion) + tent(760, 610, 250, 250, P.azure) + tent(480, 670, 200, 190, P.gold)
  for (let i = 0; i < 60; i++) out += dab(rand(r, 0, W), rand(r, 620, H), rand(r, 3, 5), rand(r, 2, 3.5), rand(r, 0, 180), pick(r, [P.vermilion, P.white, P.goldPale, '#8ea4c8']), 0.95)
  return sprite('projects/festa-festum.webp', W, H, out, { scale: 0.75, seed: 201, wobble: 4, grain: 0.4, mottle: 0.1 })
}

function dungeonMap() {
  const r = rng(303)
  const W = 960
  const H = 720
  const cell = 24
  const rooms = []
  for (let tries = 0; rooms.length < 9 && tries < 400; tries++) {
    const w = Math.floor(rand(r, 4, 9))
    const h = Math.floor(rand(r, 3, 7))
    const x = Math.floor(rand(r, 2, W / cell - w - 2))
    const y = Math.floor(rand(r, 2, H / cell - h - 3))
    if (rooms.every((o) => x + w + 2 < o.x || o.x + o.w + 2 < x || y + h + 2 < o.y || o.y + o.h + 2 < y)) rooms.push({ x, y, w, h })
  }
  rooms.sort((a, b) => a.x - b.x)
  const rect = ({ x, y, w, h }) => `M${x * cell},${y * cell} h${w * cell} v${h * cell} h${-w * cell}Z `
  let floor = rooms.map(rect).join('')
  const centers = rooms.map((o) => [Math.floor(o.x + o.w / 2), Math.floor(o.y + o.h / 2)])
  for (let i = 1; i < centers.length; i++) {
    const [ax, ay] = centers[i - 1]
    const [bx, by] = centers[i]
    floor += rect({ x: Math.min(ax, bx), y: ay, w: Math.abs(bx - ax) + 1, h: 1 }) + rect({ x: bx, y: Math.min(ay, by), w: 1, h: Math.abs(by - ay) + 1 })
  }
  const grid = []
  for (let x = 0; x <= W; x += cell) grid.push([[x, 0], [x, H]])
  for (let y = 0; y <= H; y += cell) grid.push([[0, y], [W, y]])
  const defs = `<pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0,0 V10" stroke="${P.ink}" stroke-width="2.4"/></pattern><clipPath id="floor"><path d="${floor}"/></clipPath>`
  let out = parchmentIn(r, `M-20,-20 H${W + 20} V${H + 20} H-20Z`, [0, 0, W, H])
  out += `<path d="${floor}" fill="none" stroke="url(#hatch)" stroke-width="40" stroke-linejoin="round"/>`
  out += `<path d="${floor}" fill="none" stroke="${P.ink}" stroke-width="10" stroke-linejoin="round"/>`
  out += `<path d="${floor}" fill="#f4ecd6"/>`
  out += `<g clip-path="url(#floor)">${brush(grid, '#c9b98f', 1.2, 1)}</g>`
  const [sx, sy] = centers[0]
  for (let i = 0; i < 5; i++) out += ink(`M${sx * cell - 8},${sy * cell - 8 + i * 8} h40`, 2.4)
  const [tx, ty] = centers.at(-1)
  out += `<path d="M${tx * cell - 6},${ty * cell} h36 v26 h-36Z" fill="url(#goldLeaf)" stroke="${P.ink}" stroke-width="2.4"/>` + ink(`M${tx * cell - 6},${ty * cell + 10} h36`, 2.4)
  const route = centers.map(([x, y], i) => (i ? `H${x * cell + 12} V${y * cell + 12}` : `M${x * cell + 12},${y * cell + 12}`)).join(' ')
  out += `<path d="${route}" fill="none" stroke="${P.vermilion}" stroke-width="4" stroke-dasharray="2 12" stroke-linecap="round"/>`
  out += `<g transform="translate(880,80) scale(.5)">${shape('M0,-90 L18,0 L0,90 L-18,0Z', P.red, 4)}<path d="M-90,0 L0,-18 L90,0 L0,18Z" fill="url(#goldLeaf)" stroke="${P.ink}" stroke-width="4"/>${circle(0, 0, 10, P.white, 3)}</g>`
  out += shape('M40,650 h220 v46 h-220Z', P.white) + brush([[[60, 666], [240, 666]], [[60, 682], [180, 682]]], P.umber, 3, 1)
  out += ink(`M8,8 H${W - 8} V${H - 8} H8Z`, 6)
  return sprite('projects/dungeon-map.webp', W, H, out, { scale: 0.75, seed: 303, wobble: 2.5, grain: 0.4, mottle: 0.12, defs })
}

const jobs = [banderole, illuminatedBorder, parchmentTexture, fingerpost, divider, emblem, waxSeal, quill, compass, gildedFrame, raven, knight, scribe, festaFestum, dungeonMap]
const out = []
for (const job of jobs) {
  const file = await job()
  if (file) out.push(file)
}

// Contact sheet of everything just rendered, on parchment.
const preview = process.argv[2]
if (preview) {
  const tiles = await Promise.all(out.map((p) => sharp(p).resize({ width: 380, height: 300, fit: 'inside' }).toBuffer()))
  await sharp({ create: { width: 1600, height: 1300, channels: 4, background: '#efe3c8' } })
    .composite(tiles.map((input, i) => ({ input, left: 10 + (i % 4) * 400, top: 10 + Math.floor(i / 4) * 320 })))
    .png()
    .toFile(preview)
  console.log('preview →', preview)
}
