// Parallax scene layers. Every layer is the same 16:9 frame (authored at 2560×1440)
// so they line up when stacked. Run: npm run art
import sharp from 'sharp'
import { resolve } from 'node:path'
import { C, TAU, circle, f, line, lobed, path, pick, poly, rand, rng, save, smooth, svg, OUT } from './lib.mjs'

const W = 2560
const H = 1440
const LAYER_SCALE = 0.8 // → 2048×1152, enough for a 1.25× overscanned 1080p-ish view
const frame = (body, defs = '', scale = LAYER_SCALE) => svg(W, H, body, { defs, scale })

// ─── sky ────────────────────────────────────────────────────────────────────
function sky() {
  const defs = `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#7d93ad"/><stop offset=".42" stop-color="#a9b8c0"/>
    <stop offset=".66" stop-color="#ddd6c0"/><stop offset="1" stop-color="#efe3c8"/></linearGradient>`
  return frame(`<rect width="${W}" height="${H}" fill="url(#g)"/>${sun(1990, 300, 58)}`, defs, 0.5)
}

function sun(cx, cy, R) {
  let rays = ''
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU
    const w = TAU / 70
    const L = R * (i % 2 ? 1.5 : 1.85)
    const pt = (ang, rad) => `${f(cx + Math.cos(ang) * rad)},${f(cy + Math.sin(ang) * rad)}`
    rays += `M${pt(a - w, R * 0.92)} L${pt(a, L)} L${pt(a + w, R * 0.92)}Z `
  }
  return path(rays, C.gold, 3) + circle(cx, cy, R, C.gold, 3) + `<circle cx="${cx}" cy="${cy}" r="${f(R * 0.7)}" fill="none" stroke="${C.goldDark}" stroke-width="2"/>`
}

// ─── clouds ─────────────────────────────────────────────────────────────────
function cloud(r, x, y, w) {
  // scalloped top going right, smaller scallops back along the bottom
  let d = `M${f(x)},${f(y)}`
  let cx = x
  const inner = []
  while (cx < x + w) {
    const bw = Math.min(rand(r, 50, 110), x + w - cx)
    const br = Math.max(bw / 2, bw * rand(r, 0.55, 0.75))
    d += ` A${f(br)},${f(br)} 0 0 1 ${f(cx + bw)},${f(y)}`
    if (bw > 60) inner.push(`M${f(cx + bw * 0.25)},${f(y + 10)} A${f(br * 0.6)},${f(br * 0.6)} 0 0 1 ${f(cx + bw * 0.75)},${f(y + 10)}`)
    cx += bw
  }
  const th = rand(r, 26, 40)
  d += ` A${f(th / 2)},${f(th / 2)} 0 0 1 ${f(cx)},${f(y + th)}`
  while (cx > x) {
    const bw = Math.min(rand(r, 30, 60), cx - x)
    d += ` A${f(bw * 0.6)},${f(bw * 0.6)} 0 0 1 ${f(cx - bw)},${f(y + th)}`
    cx -= bw
  }
  d += ` A${f(th / 2)},${f(th / 2)} 0 0 1 ${f(x)},${f(y)}Z`
  return (
    path(d, '#f2ecdc', 3) +
    line(`M${f(x + 20)},${f(y + th - 8)} H${f(x + w - 20)}`, '#c9d2d4', 5, 'opacity=".55"') +
    inner.map((l) => line(l, '#c3cdd0', 2)).join('')
  )
}

function clouds() {
  const r = rng(7)
  const spots = [
    [140, 560, 420],
    [560, 280, 330],
    [1720, 440, 380],
    [2180, 650, 360],
    [2280, 200, 260],
  ]
  return frame(spots.map(([x, y, w]) => cloud(r, x, y, w)).join(''))
}

// ─── mountains ──────────────────────────────────────────────────────────────
function crag(r, a, b, steps = 4, jit = 14) {
  const out = []
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    out.push(i === steps ? b : [a[0] + (b[0] - a[0]) * t + rand(r, -jit, jit), a[1] + (b[1] - a[1]) * t + rand(r, -jit, jit)])
  }
  return out
}

function mountainRange(r, id, peaks, base, fill, shade, snow) {
  const ridge = [[peaks[0][0] - 260, base]]
  const faces = []
  peaks.forEach((p, i) => {
    ridge.push(...crag(r, ridge.at(-1), p))
    const next = peaks[i + 1]
    if (!next) return
    const v = [(p[0] + next[0]) / 2 + rand(r, -30, 30), Math.max(p[1], next[1]) + rand(r, 90, 160)]
    const down = crag(r, p, v)
    faces.push({ p, down })
    ridge.push(...down)
  })
  ridge.push(...crag(r, ridge.at(-1), [peaks.at(-1)[0] + 260, base]))
  const body = `${poly(ridge)} L${W + 300},${H} L-300,${H}Z`

  let out = `<clipPath id="${id}"><path d="${body}"/></clipPath>`
  out += path(body, fill, 0)
  out += `<g clip-path="url(#${id})">`
  for (const { p, down } of faces) {
    out += path(`${poly([p, ...down])} L${f(p[0] + 60)},${base}Z`, shade, 0)
    // ledges on the lit face, like painted rock strata
    for (let k = 0; k < 6; k++) {
      const y = p[1] + 40 + k * 42
      const x = p[0] - 18 - k * 22
      out += line(`M${f(x - rand(r, 25, 60))},${f(y + 12)} Q${f(x - 10)},${f(y - 6)} ${f(x + 14)},${f(y)}`, shade, 3, 'opacity=".75"')
    }
  }
  out += '</g>'
  if (snow)
    for (const p of peaks) {
      const [x, y] = p
      out += path(poly([[x, y], [x - 30, y + 46], [x - 14, y + 38], [x - 2, y + 56], [x + 14, y + 40], [x + 32, y + 50]]) + 'Z', '#f3eedf', 2)
    }
  out += line(poly(ridge), C.ink, 4)
  return out
}

function mountains() {
  const r = rng(11)
  const far = [[-40, 600], [300, 520], [620, 640], [900, 610], [1180, 700], [1420, 690], [1720, 610], [2020, 650], [2300, 540], [2600, 620]]
  const near = [[-40, 720], [220, 660], [520, 760], [820, 720], [1100, 800], [1500, 810], [1820, 730], [2120, 770], [2420, 680], [2620, 740]]
  return frame(
    mountainRange(r, 'far', far, 1000, '#bcc4c4', '#a2adb3', true) + mountainRange(r, 'near', near, 1060, '#95a3ab', '#7c8c97', false),
  )
}

// ─── hills with patchwork fields ────────────────────────────────────────────
function lollipop(r, x, y, s) {
  return path(`M${f(x)},${f(y)} V${f(y + s * 1.6)}`, 'none', 3) + path(lobed(r, x, y, s, s * 1.1, 6), pick(r, ['#5b7044', '#4c6139', '#6a7d4c']), 2.5)
}

function fieldPatches(r, top, colors) {
  let out = ''
  let y0 = top
  let h = 46
  while (y0 < H) {
    let x0 = -60
    const y1 = y0 + h
    while (x0 < W + 60) {
      const x1 = x0 + rand(r, 140, 320)
      const q = [[x0, y0 + rand(r, -8, 8)], [x1, y0 + rand(r, -8, 8)], [x1, y1 + rand(r, -8, 8)], [x0, y1 + rand(r, -8, 8)]]
      out += path(poly(q) + 'Z', pick(r, colors), 0, `opacity="${f(rand(r, 0.45, 0.8))}"`)
      if (r() < 0.45)
        for (let t = 0.25; t < 0.9; t += 0.18) {
          const a = [q[0][0], q[0][1] + (q[3][1] - q[0][1]) * t]
          const b = [q[1][0], q[1][1] + (q[2][1] - q[1][1]) * t]
          out += line(poly([a, b]), '#5f6838', 2, 'opacity=".35"')
        }
      out += line(poly([q[1], q[2]]), '#55602f', 3, 'opacity=".55"')
      x0 = x1
    }
    out += line(`M-60,${f(y1)} H${W + 60}`, '#55602f', 3, 'opacity=".5"')
    y0 = y1
    h *= 1.35
  }
  return out
}

function hillBand(r, id, ridgePts, fill, colors) {
  const body = `${smooth(ridgePts)} L${W + 120},${H} L-120,${H}Z`
  const top = Math.min(...ridgePts.map((p) => p[1]))
  return (
    `<clipPath id="${id}"><path d="${body}"/></clipPath>` +
    path(body, fill, 0) +
    `<g clip-path="url(#${id})">${fieldPatches(r, top, colors)}</g>` +
    line(smooth(ridgePts), C.ink, 4)
  )
}

function hills() {
  const r = rng(23)
  const back = [[-120, 860], [300, 820], [700, 880], [1000, 845], [1280, 800], [1560, 850], [1900, 815], [2250, 870], [2680, 830]]
  const front = [[-120, 960], [380, 905], [820, 975], [1280, 990], [1720, 960], [2150, 900], [2680, 955]]
  let trees = ''
  for (const x of [180, 330, 520, 760, 1820, 2020, 2230, 2420]) trees += lollipop(r, x + rand(r, -30, 30), 820 + rand(r, 0, 40), rand(r, 14, 20))
  return frame(
    hillBand(r, 'hb', back, '#a4a46c', ['#b9ad6c', '#9aa060', '#8a9658', '#c2b47a']) +
      trees +
      hillBand(r, 'hf', front, '#86904f', ['#7e8a4c', '#97985a', '#6e7f48', '#a9a065']),
  )
}

// ─── castle ─────────────────────────────────────────────────────────────────
const courses = (x0, x1, y0, y1, step = 14) => {
  let d = ''
  for (let y = y0 + step; y < y1; y += step) d += `M${x0 + 4},${y} H${x1 - 4} `
  return line(d, C.creamShade, 2, 'opacity=".6"')
}

function merlons(x0, x1, y, h = 14, w = 16, gap = 12) {
  let d = ''
  for (let x = x0; x + w <= x1 + 0.1; x += w + gap) d += `M${x},${y} v${-h} h${w} v${h}Z `
  return path(d, C.cream, 3)
}

function slit(x, y, w = 8, h = 26) {
  return path(`M${x - w / 2},${y + h} V${y + w / 2} A${w / 2},${w / 2} 0 0 1 ${x + w / 2},${y + w / 2} V${y + h}Z`, '#2f2219', 0)
}

function roof(x0, x1, y, apex, banner = true) {
  const mid = (x0 + x1) / 2
  let out = path(poly([[x0 - 8, y], [mid, apex], [x1 + 8, y]]) + 'Z', C.blue, 0)
  out += path(poly([[x0 - 8, y], [mid, apex], [mid, y]]) + 'Z', C.blueLight, 0)
  let slate = ''
  for (let i = 1; i < 6; i++) {
    const x = x0 - 8 + ((x1 - x0 + 16) * i) / 6
    slate += `M${f(mid)},${f(apex + 8)} L${f(x)},${y} `
  }
  out += line(slate, '#4a5f80', 2, 'opacity=".7"')
  out += path(poly([[x0 - 8, y], [mid, apex], [x1 + 8, y]]) + 'Z', 'none', 3)
  out += line(`M${mid},${apex} V${apex - 30}`, C.ink, 3) + circle(mid, apex - 4, 6, C.gold, 2)
  if (banner) out += path(`M${mid},${apex - 30} L${mid + 34},${apex - 24} L${mid + 22},${apex - 19} L${mid + 34},${apex - 14} L${mid},${apex - 14}Z`, C.red, 2)
  return out
}

function tower(x0, x1, top, bottom, apex, banner) {
  const defsId = `t${x0}`
  return (
    `<linearGradient id="${defsId}" x1="0" x2="1"><stop offset="0" stop-color="${C.cream}"/><stop offset=".6" stop-color="${C.cream}"/><stop offset="1" stop-color="${C.creamShade}"/></linearGradient>` +
    path(`M${x0},${top} H${x1} V${bottom} H${x0}Z`, `url(#${defsId})`, 3) +
    courses(x0, x1, top, bottom) +
    slit((x0 + x1) / 2, top + 22) +
    slit((x0 + x1) / 2, top + 72, 7, 20) +
    roof(x0, x1, top, apex, banner)
  )
}

function castle() {
  const r = rng(31)
  // rocky mound the castle sits on
  const mound = poly([[900, 1010], [960, 950], [1040, 930], [1150, 940], [1280, 925], [1420, 938], [1530, 928], [1610, 955], [1670, 1010]]) + 'Z'
  let rocks = ''
  for (let i = 0; i < 14; i++) {
    const x = rand(r, 950, 1610)
    const y = rand(r, 950, 1000)
    rocks += `M${f(x)},${f(y)} l${f(rand(r, 18, 40))},${f(rand(r, -6, 4))} `
  }
  let out = path(mound, C.stone, 4) + line(rocks, C.stoneShade, 3)

  // curtain wall + gate
  out += merlons(1032, 1528, 880)
  out += path('M1030,880 H1530 V960 H1030Z', C.cream, 3) + courses(1030, 1530, 880, 960)
  out += path('M1255,960 V915 A25,25 0 0 1 1305,915 V960Z', '#2f2219', 3)
  out += line('M1265,903 V960 M1280,890 V960 M1295,903 V960 M1258,925 H1302 M1256,945 H1304', C.goldDark, 2)

  // back towers first, then keep, then front corner towers
  out += tower(1105, 1160, 800, 880, 718, true)
  out += tower(1400, 1455, 812, 880, 735, false)
  out += merlons(1187, 1373, 790)
  out += path('M1185,790 H1375 V880 H1185Z', C.cream, 3) + courses(1185, 1375, 790, 880)
  out += slit(1222, 815) + slit(1338, 815)
  out += tower(1245, 1315, 700, 790, 600, true)
  out += tower(985, 1060, 840, 965, 765, true)
  out += tower(1500, 1575, 840, 965, 765, true)
  return frame(out)
}

// ─── forest ─────────────────────────────────────────────────────────────────
function tree(r, cx, cy, rad, palette, sw = 4, trunk = true) {
  const [dark, light, mark] = palette
  let out = ''
  if (trunk) out += path(`M${f(cx - rad * 0.08)},${f(cy)} L${f(cx - rad * 0.12)},${f(cy + rad * 2.2)} L${f(cx + rad * 0.12)},${f(cy + rad * 2.2)} L${f(cx + rad * 0.08)},${f(cy)}Z`, C.brown, sw * 0.75)
  out += path(lobed(r, cx, cy, rad * 0.95, rad, 7 + Math.floor(r() * 3)), dark, sw)
  out += path(lobed(r, cx - rad * 0.22, cy - rad * 0.28, rad * 0.55, rad * 0.45, 6), light, 0)
  let marks = ''
  for (let i = 0; i < 6; i++) {
    const x = cx + rand(r, -0.6, 0.5) * rad
    const y = cy + rand(r, -0.6, 0.5) * rad
    const s = rad * 0.12
    marks += `M${f(x)},${f(y)} a${f(s)},${f(s)} 0 0 1 ${f(s * 1.8)},0 `
  }
  return out + line(marks, mark, 2.5)
}

function forest() {
  const r = rng(41)
  const topAt = (x) => {
    const d = Math.abs(x - 1280) / 1280
    return 975 - d * d * 95
  }
  const greens = [
    [C.green, C.greenLight, '#2c3a25'],
    ['#47593a', '#62774a', '#2c3a25'],
    ['#3a4c31', '#55693f', '#26331f'],
  ]
  let out = `<rect x="0" y="1060" width="${W}" height="${H - 1060}" fill="#34452c"/>`
  for (const [rowOffset, rMin, rMax] of [[0, 55, 80], [70, 75, 105]]) {
    const trees = []
    for (let x = -80; x < W + 80; x += rand(r, 70, 110)) {
      const rad = rand(r, rMin, rMax)
      trees.push([x, topAt(x) + rad + rowOffset + rand(r, -10, 15), rad])
    }
    trees.sort((a, b) => a[1] - b[1])
    for (const [x, y, rad] of trees) out += tree(r, x, y, rad, pick(r, greens))
  }
  return frame(out)
}

// ─── meadow (millefleur) + road ─────────────────────────────────────────────
function flower(r, x, y, s) {
  const color = pick(r, ['#f2ecdc', C.red, '#7f95b2', C.gold, '#f2ecdc'])
  let petals = ''
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + r()
    petals += circle(x + Math.cos(a) * s, y + Math.sin(a) * s, s * 0.75, color, 1.2)
  }
  return petals + circle(x, y, s * 0.5, C.gold, 1)
}

function ground() {
  const r = rng(53)
  const edge = [[-100, 1150], [400, 1175], [900, 1160], [1280, 1180], [1700, 1165], [2200, 1180], [2660, 1150]]
  let out = path(`${smooth(edge)} L${W + 100},${H} L-100,${H}Z`, '#74834a', 4)
  const roadL = [[1268, 1178], [1250, 1250], [1215, 1330], [1150, 1440]]
  const roadR = [[1300, 1178], [1322, 1250], [1375, 1330], [1440, 1440]]
  out += path(`${smooth(roadL)} L${smooth(roadR.slice().reverse()).slice(1)}Z`, '#d8c79c', 3)
  out += line(smooth([[1278, 1200], [1262, 1300], [1240, 1440]]) + ' ' + smooth([[1290, 1200], [1312, 1300], [1340, 1440]]), '#b8a476', 3)

  const onRoad = (x, y) => {
    const t = (y - 1178) / 262
    return x > 1255 - t * 110 && x < 1310 + t * 135
  }
  let grass = ''
  let blooms = ''
  for (let i = 0; i < 520; i++) {
    const x = rand(r, 0, W)
    const y = rand(r, 1195, H)
    if (onRoad(x, y)) continue
    const s = 0.5 + (y - 1180) / 260
    if (i % 3) grass += `M${f(x)},${f(y)} l${f(-4 * s)},${f(-12 * s)} M${f(x)},${f(y)} l${f(4 * s)},${f(-12 * s)} `
    else blooms += flower(r, x, y, 5 * s)
  }
  return frame(out + line(grass, '#4f5f33', 2) + blooms)
}

// ─── foreground: rocks, bushes, framing trees ───────────────────────────────
function rock(r, x, base, w, h) {
  const top = [[x, base], [x + w * 0.04, base - h * 0.62], [x + w * 0.28, base - h], [x + w * 0.66, base - h * rand(r, 0.85, 1)], [x + w * 0.96, base - h * 0.5], [x + w, base]]
  let out = path(poly(top) + 'Z', C.stone, 5)
  out += path(poly([top[3], top[4], top[5], [x + w * 0.6, base]]) + 'Z', C.stoneShade, 0)
  out += path(poly([top[1], top[2], top[3], [x + w * 0.5, base - h * 0.62]]) + 'Z', C.stoneLight, 0)
  let strata = ''
  for (let k = 1; k < 4; k++) strata += `M${f(x + w * 0.12)},${f(base - h * 0.15 * k)} l${f(w * rand(r, 0.25, 0.4))},${f(rand(r, -8, 6))} `
  return out + line(strata, C.stoneShade, 3) + path(poly(top) + 'Z', 'none', 5)
}

function rocks() {
  const r = rng(61)
  return frame(
    rock(r, -60, 1470, 300, 230) + rock(r, 180, 1460, 220, 150) + rock(r, 2260, 1470, 360, 250) + rock(r, 2130, 1470, 200, 130),
  )
}

function bush(r, x, y, rad) {
  let out = path(lobed(r, x, y, rad, rad * 0.75, 9), '#3e5233', 5)
  out += path(lobed(r, x - rad * 0.2, y - rad * 0.25, rad * 0.55, rad * 0.35, 6), '#57703f', 0)
  for (let i = 0; i < 7; i++) out += circle(x + rand(r, -0.6, 0.6) * rad, y + rand(r, -0.4, 0.3) * rad, 6, i % 3 ? C.red : '#f2ecdc', 2)
  return out
}

function bushes() {
  const r = rng(71)
  const spots = [[60, 1400, 130], [270, 1430, 100], [430, 1445, 75], [2500, 1390, 140], [2310, 1425, 105], [2150, 1450, 80]]
  return frame(spots.map(([x, y, s]) => bush(r, x, y, s)).join(''))
}

function bigTree(r, baseX, lean, blobs) {
  const L = [[baseX - 80, H + 20], [baseX - 42 + lean * 0.3, 1150], [baseX - 30 + lean * 0.7, 800], [baseX - 22 + lean, 460]]
  const right = L.map(([x, y], i) => [2 * (baseX + lean * [0, 0.3, 0.7, 1][i]) - x, y]).reverse()
  let out = ''
  const dir = Math.sign(W / 2 - baseX)
  for (const [y, dx, dy] of [[760, 190, -170], [600, -120, -150]]) {
    const x0 = baseX + lean * 0.8
    const d = `M${f(x0)},${y} q${f(dir * dx * 0.4)},${f(dy * 0.7)} ${f(dir * dx)},${f(dy)}`
    out += line(d, C.ink, 30) + line(d, '#4a3826', 20)
  }
  out += path(`${smooth(L)} L${smooth(right).slice(1)}Z`, '#4a3826', 6)
  out += line(`M${baseX + lean * 0.5},1330 q-8,-140 4,-280 M${baseX - 14 + lean * 0.6},980 q10,-150 -2,-280 M${baseX + 22 + lean * 0.4},1200 q6,-90 -4,-170`, '#2f2219', 3)
  for (const [x, y, rad] of blobs) out += tree(r, x, y, rad, [C.greenDark, '#46603a', '#1f2b1a'], 6, false)
  return out
}

function trees() {
  const r = rng(83)
  const left = [[-40, 520, 180], [120, 300, 210], [330, 150, 170], [-60, 160, 190], [300, 420, 130]]
  const right = left.map(([x, y, s]) => [W - x + rand(r, -30, 30), y + rand(r, -40, 20), s * rand(r, 0.9, 1.05)])
  return frame(bigTree(r, 120, 40, left) + bigTree(r, W - 120, -40, right))
}

// ─── paper grain (tiling overlay, not a layer) ──────────────────────────────
function paper() {
  const n = 256
  return svg(
    n,
    n,
    `<filter id="n" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".38" numOctaves="3" stitchTiles="stitch" seed="3"/>
      <feColorMatrix values="0 0 0 0 .36  0 0 0 0 .25  0 0 0 0 .15  0.7 0 0 0 -.26"/>
    </filter><rect width="${n}" height="${n}" filter="url(#n)"/>`,
  )
}

const layers = [
  ['background/sky/sky.webp', sky],
  ['background/clouds/clouds.webp', clouds],
  ['background/mountains/mountains.webp', mountains],
  ['environment/hills/hills.webp', hills],
  ['environment/castle/castle.webp', castle],
  ['environment/forest/forest.webp', forest],
  ['environment/ground/ground.webp', ground],
  ['foreground/rocks/rocks.webp', rocks],
  ['foreground/bushes/bushes.webp', bushes],
  ['foreground/trees/trees.webp', trees],
]

const files = []
for (const [rel, draw] of layers) files.push(await save(rel, draw()))
await save('textures/paper.webp', paper())

// Flattened preview of the whole stack, handy to eyeball composition.
const preview = process.argv[2]
if (preview) {
  const size = { width: 1600, height: 900 }
  const bufs = await Promise.all(files.map((file) => sharp(file).resize(size).toBuffer()))
  await sharp({ create: { ...size, channels: 4, background: '#efe3c8' } })
    .composite([...bufs.map((input) => ({ input })), { input: resolve(OUT, 'textures/paper.webp'), tile: true }])
    .png()
    .toFile(preview)
  console.log('preview →', preview)
}
