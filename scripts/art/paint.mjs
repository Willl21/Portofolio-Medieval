// The painting system: medieval pigments + tempera-like rendering on top of plain SVG shapes.
// Shapes are drawn as washes (base colour, pigment pools, darker rim where paint gathers),
// strokes are drawn as brushwork, and every layer goes through `paint`: wobbly hand-drawn
// contours, fine pigment grain and low-frequency mottling. No flat fills, no ruler lines.
import { f, rand, pick, TAU } from './lib.mjs'

// Pigments of a 14th–15th c. palette, slightly lifted because the grain multiplies them down.
export const P = {
  ink: '#3b2a1e',
  inkSoft: '#5a4330',
  parchment: '#ecdcb8',
  white: '#f1e9d6', // lead white
  azure: '#3c5b8e',
  azureDeep: '#2b4677',
  azurePale: '#9db0c6',
  vermilion: '#b5472f',
  red: '#963a2b',
  ochre: '#c79c50',
  ochrePale: '#dfc58e',
  umber: '#6c4b30',
  umberDark: '#47311f',
  green: '#55703f',
  greenDark: '#34482a',
  greenDeep: '#26371f',
  sap: '#7e9148',
  greenPale: '#9aa564',
  gold: '#c9a24c',
  goldPale: '#ead07f',
  goldDark: '#8e6b26',
  stone: '#ddd1b4',
  stoneWarm: '#d2bf98',
  stoneShade: '#b2a283',
  stoneDark: '#867659',
}

let uid = 0
export const id = (p = 'i') => `${p}${uid++}`

/** Filters every painted file needs. `paint` = tempera surface; blurs = soft pigment pools. */
export function paintDefs(seed = 1, { wobble = 7, grain = 0.5, mottle = 0.22 } = {}) {
  const lin = (slope, icpt) => ['R', 'G', 'B'].map((c) => `<feFunc${c} type="linear" slope="${slope}" intercept="${icpt}"/>`).join('') + '<feFuncA type="linear" slope="0" intercept="1"/>'
  return `
  <filter id="paint" x="-3%" y="-3%" width="106%" height="106%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="2" seed="${seed}" result="warp"/>
    <feDisplacementMap in="SourceGraphic" in2="warp" scale="${wobble}" xChannelSelector="R" yChannelSelector="G" result="w"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.75 0.32" numOctaves="2" seed="${seed + 11}" result="fine"/>
    <feColorMatrix in="fine" type="saturate" values="0" result="fineG"/>
    <feComponentTransfer in="fineG" result="fineM">${lin(grain, 1.02 - grain * 0.5)}</feComponentTransfer>
    <feTurbulence type="fractalNoise" baseFrequency="0.0045" numOctaves="3" seed="${seed + 23}" result="slow"/>
    <feColorMatrix in="slow" type="saturate" values="0" result="slowG"/>
    <feComponentTransfer in="slowG" result="slowM">${lin(mottle * 2, 1.04 - mottle)}</feComponentTransfer>
    <feBlend in="w" in2="fineM" mode="multiply" result="a"/>
    <feBlend in="a" in2="slowM" mode="multiply" result="b"/>
    <feComposite in="b" in2="w" operator="in"/>
  </filter>
  <filter id="rim" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
    <feMorphology in="SourceAlpha" operator="erode" radius="5" result="er"/>
    <feComposite in="SourceAlpha" in2="er" operator="out" result="edge"/>
    <feGaussianBlur in="edge" stdDeviation="4" result="eb"/>
    <feFlood flood-color="${P.umberDark}" flood-opacity=".5" result="fl"/>
    <feComposite in="fl" in2="eb" operator="in" result="edgeC"/>
    <feBlend in="SourceGraphic" in2="edgeC" mode="multiply" result="bl"/>
    <feComposite in="bl" in2="SourceAlpha" operator="in"/>
  </filter>
  <filter id="soft" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="14"/></filter>
  <filter id="soft6" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="6"/></filter>
  <filter id="soft2" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="2"/></filter>
  <linearGradient id="goldLeaf" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${P.goldPale}"/><stop offset=".35" stop-color="${P.gold}"/>
    <stop offset=".55" stop-color="#b88f3b"/><stop offset=".75" stop-color="${P.gold}"/><stop offset="1" stop-color="${P.goldDark}"/></linearGradient>`
}

/** Wrap a whole file's content so it is painted. */
export const painted = (body) => `<g filter="url(#paint)">${body}</g>`

/**
 * A painted area: base colour, soft pools of lighter (sun side, right/top) and darker pigment,
 * a darker rim where paint gathers at the edge, and a thin, slightly translucent ink contour.
 */
export function wash(r, d, base, { box, light, dark, pools = 5, rim = 12, ink = 2.2, inkColor = P.ink, lightBias = 0.6 } = {}) {
  const cid = id('w')
  let s = `<clipPath id="${cid}"><path d="${d}"/></clipPath><path d="${d}" fill="${base}"/>`
  s += `<g clip-path="url(#${cid})">`
  if (box) {
    const [x, y, w, h] = box
    for (let i = 0; i < pools; i++) {
      const isLight = r() < lightBias
      const cx = x + w * (isLight ? rand(r, 0.45, 1) : rand(r, 0, 0.6))
      const cy = y + h * (isLight ? rand(r, 0, 0.55) : rand(r, 0.35, 1))
      s += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(w * rand(r, 0.15, 0.4))}" ry="${f(h * rand(r, 0.12, 0.35))}" fill="${isLight ? light : dark}" opacity="${f(rand(r, 0.25, 0.55))}" filter="url(#soft)"/>`
    }
  }
  if (rim && dark) s += `<path d="${d}" fill="none" stroke="${dark}" stroke-width="${rim}" opacity=".45" filter="url(#soft2)"/>`
  s += '</g>'
  if (ink) s += `<path d="${d}" fill="none" stroke="${inkColor}" stroke-width="${ink}" stroke-linejoin="round" stroke-linecap="round" opacity=".82"/>`
  return s
}

/** Loose brush strokes: an array of polylines, each painted with a tapered-ish round brush. */
export function brush(lines, color, width, opacity = 0.5) {
  const d = lines.map((pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)},${f(y)}`).join(' ')).join(' ')
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>`
}

/** A single dab of paint (leaf, petal, highlight): a small rotated ellipse. */
export const dab = (x, y, rx, ry, rot, fill, opacity = 1) =>
  `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${f(rot)} ${f(x)} ${f(y)})" fill="${fill}" opacity="${f(opacity)}"/>`

/** Organic outline: midpoint displacement between key points (no straight segments, no triangles). */
export function fractalLine(r, keys, depth = 5, rough = 0.32) {
  let pts = keys.map((p) => [...p])
  let amp = rough
  for (let k = 0; k < depth; k++) {
    const next = [pts[0]]
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1]
      const [bx, by] = pts[i]
      const len = Math.hypot(bx - ax, by - ay)
      next.push([(ax + bx) / 2 + rand(r, -1, 1) * len * amp * 0.25, (ay + by) / 2 + rand(r, -1, 1) * len * amp], [bx, by])
    }
    pts = next
    amp *= 0.55
  }
  return pts
}

/** Leaves painted as dabs over a crown: dark under-shadow, mid body, light on the sun side. */
export function foliage(r, cx, cy, rx, ry, { dark, mid, light, count = 40, size = 1 }) {
  let s = ''
  const put = (n, tone, bias) => {
    for (let i = 0; i < n; i++) {
      const a = r() * TAU
      const rr = Math.sqrt(r())
      let x = cx + Math.cos(a) * rx * rr
      let y = cy + Math.sin(a) * ry * rr
      x += bias[0] * rx
      y += bias[1] * ry
      const sz = rand(r, 3.5, 8) * size
      s += dab(x, y, sz * 1.5, sz, rand(r, -60, 60), tone, rand(r, 0.6, 0.95))
    }
  }
  put(Math.round(count * 0.35), dark, [-0.12, 0.18])
  put(Math.round(count * 0.45), mid, [0.02, -0.02])
  put(Math.round(count * 0.3), light, [0.2, -0.22])
  return s
}

/** Mix two hex colours (t=0 → a). Used for atmospheric perspective. */
export function mix(a, b, t) {
  const pa = a.match(/\w\w/g).map((h) => parseInt(h, 16))
  const pb = b.match(/\w\w/g).map((h) => parseInt(h, 16))
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('')
}

export { pick }

export const pathOf = (pts, close = true) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)},${f(y)}`).join(' ') + (close ? 'Z' : '')

/** Irregular coursed masonry: stones of uneven size and tint over darker mortar, clipped to `clipD`. */
export function masonry(r, clipD, [x0, y0, x1, y1], { mortar = P.stoneShade, stones = [P.stone, P.stoneWarm, '#e2d8bf', '#cfc1a0'] } = {}) {
  const cid = id('ms')
  let s = `<clipPath id="${cid}"><path d="${clipD}"/></clipPath><g clip-path="url(#${cid})"><rect x="${x0 - 4}" y="${y0 - 4}" width="${x1 - x0 + 8}" height="${y1 - y0 + 8}" fill="${mortar}"/>`
  for (let y = y0 - 2; y < y1; ) {
    const h = rand(r, 9, 15)
    let x = x0 - rand(r, 0, 24)
    while (x < x1) {
      const w = rand(r, 16, 36)
      s += `<rect x="${f(x + 1.3)}" y="${f(y + 1.3)}" width="${f(w - 2.6)}" height="${f(h - 2.6)}" rx="${f(rand(r, 1.5, 4))}" fill="${pick(r, stones)}" opacity="${f(rand(r, 0.8, 1))}"/>`
      x += w
    }
    y += h
  }
  // the sun is to the right: shade the left of every wall, warm the right
  s += `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="url(#wallLight)"/>`
  return s + '</g>'
}

/** Gradient used by masonry and walls: shadow on the left, warm light on the right. */
export const wallDefs = `<linearGradient id="wallLight" x1="0" x2="1">
  <stop offset="0" stop-color="${P.umberDark}" stop-opacity=".38"/><stop offset=".35" stop-color="${P.umberDark}" stop-opacity=".08"/>
  <stop offset=".7" stop-color="#fff3d0" stop-opacity="0"/><stop offset="1" stop-color="#fff3d0" stop-opacity=".22"/></linearGradient>`

/** Conical slate roof: azure scales, sunlit right half, gold finial. Returns the finial top. */
export function slateRoof(r, x0, x1, y, apex) {
  const mid = (x0 + x1) / 2 + rand(r, -2, 2)
  const d = `M${f(x0 - 7)},${f(y)} Q${f(mid - (x1 - x0) * 0.12)},${f((y + apex) / 2)} ${f(mid)},${f(apex)} Q${f(mid + (x1 - x0) * 0.12)},${f((y + apex) / 2)} ${f(x1 + 7)},${f(y)} Q${f(mid)},${f(y + 6)} ${f(x0 - 7)},${f(y)}Z`
  const cid = id('rf')
  let s = `<clipPath id="${cid}"><path d="${d}"/></clipPath><g filter="url(#rim)"><path d="${d}" fill="${P.azure}"/><g clip-path="url(#${cid})">`
  s += `<path d="M${f(mid)},${f(apex)} L${f(x1 + 10)},${f(y + 8)} L${f(mid + 2)},${f(y + 8)}Z" fill="#7f9cc4" opacity=".55" filter="url(#soft2)"/>`
  const rows = Math.max(3, Math.round((y - apex) / 11))
  let scales = ''
  for (let k = 1; k <= rows; k++) {
    const yy = apex + ((y - apex) * k) / rows
    const half = ((x1 - x0) / 2 + 7) * (k / rows)
    for (let xx = mid - half; xx < mid + half; xx += 9) scales += `M${f(xx)},${f(yy)} q4.5,5 9,0 `
  }
  s += `<path d="${scales}" fill="none" stroke="${P.azureDeep}" stroke-width="1.6" opacity=".6"/></g></g>`
  s += `<path d="${d}" fill="none" stroke="${P.ink}" stroke-width="1.8" opacity=".75"/>`
  s += `<circle cx="${f(mid)}" cy="${f(apex - 2)}" r="5" fill="url(#goldLeaf)" stroke="${P.goldDark}" stroke-width="1.2"/>`
  return { svg: s, top: [mid, apex - 6] }
}

/** Gabled red-tile roof (trapezoid seen from the front). */
export function tileRoof(r, x0, x1, y, h, color = P.red) {
  const w = x1 - x0
  const d = `M${f(x0 - 10)},${f(y)} L${f(x0 + w * 0.22)},${f(y - h)} Q${f(x0 + w / 2)},${f(y - h - 3)} ${f(x0 + w * 0.78)},${f(y - h)} L${f(x1 + 10)},${f(y)} Q${f(x0 + w / 2)},${f(y + 4)} ${f(x0 - 10)},${f(y)}Z`
  const cid = id('tr')
  let s = `<clipPath id="${cid}"><path d="${d}"/></clipPath><g filter="url(#rim)"><path d="${d}" fill="${color}"/><g clip-path="url(#${cid})">`
  s += `<rect x="${f(x0 + w / 2)}" y="${f(y - h - 4)}" width="${f(w / 2 + 14)}" height="${f(h + 8)}" fill="#e08a62" opacity=".28"/>`
  let rows = ''
  for (let k = 1; k < 5; k++) {
    const yy = y - (h * k) / 5
    rows += `M${f(x0 - 12)},${f(yy)} `
    for (let xx = x0 - 12; xx < x1 + 12; xx += 8) rows += `q4,${f(rand(r, 2, 4))} 8,0 `
  }
  s += `<path d="${rows}" fill="none" stroke="#5e2419" stroke-width="1.5" opacity=".55"/></g></g>`
  return s + `<path d="${d}" fill="none" stroke="${P.ink}" stroke-width="1.8" opacity=".75"/>`
}

/** Ivy climbing from (x,y) upward: a wandering stem with clustered leaf dabs. */
export function ivy(r, x, y, height, spread = 30) {
  let stem = `M${f(x)},${f(y)}`
  let leaves = ''
  let cx = x
  for (let yy = y; yy > y - height; yy -= rand(r, 6, 11)) {
    cx += rand(r, -spread * 0.15, spread * 0.15)
    stem += ` L${f(cx)},${f(yy)}`
    for (let k = 0; k < 3; k++) leaves += dab(cx + rand(r, -spread * 0.4, spread * 0.4), yy + rand(r, -5, 5), rand(r, 3, 5), rand(r, 2, 3.4), rand(r, 0, 180), pick(r, [P.green, P.greenDark, P.sap]), rand(r, 0.75, 1))
  }
  return `<path d="${stem}" fill="none" stroke="${P.umberDark}" stroke-width="1.4" opacity=".7"/>` + leaves
}

/** A tiny painted figure (guard, villager): ~h px tall, standing on (x,y). */
export function figure(r, x, y, h, { tunic = P.vermilion, spear = false, hood = null } = {}) {
  const s = h / 18
  let o = `<g transform="translate(${f(x)},${f(y)}) scale(${f(s)})">`
  o += `<path d="M-3,0 L-2.6,-6 M3,0 L2.6,-6" stroke="${P.umberDark}" stroke-width="1.8" stroke-linecap="round"/>`
  o += `<path d="M-4.4,-5 Q-4.8,-10 -3.4,-12.5 L3.4,-12.5 Q4.8,-10 4.4,-5Z" fill="${tunic}" stroke="${P.ink}" stroke-width=".9"/>`
  o += `<circle cx="0" cy="-15" r="2.6" fill="#e6c8a2" stroke="${P.ink}" stroke-width=".7"/>`
  if (hood) o += `<path d="M-2.9,-15 A2.9,3 0 0 1 2.9,-15 L2.9,-13.6 L-2.9,-13.6Z" fill="${hood}"/>`
  if (spear) o += `<path d="M5.5,1 V-22" stroke="${P.umber}" stroke-width="1.1"/><path d="M5.5,-22 l-1.4,3 h2.8Z" fill="#c9ccd0" stroke="${P.ink}" stroke-width=".5"/>`
  return o + '</g>'
}

/**
 * A painted tree crown: irregular dark mass, then leaf dabs in three tones (shadow low-left,
 * light on the sun side), so no two trees share a silhouette.
 */
export function crown(r, cx, cy, rx, ry, tones, { count, size = 1, ink = 1.6 } = {}) {
  const [dark, mid, light] = tones
  const pts = []
  const n = 9 + Math.floor(r() * 5)
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rand(r, -0.2, 0.2)
    const k = rand(r, 0.82, 1.08)
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k])
  }
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`
  for (let i = 1; i <= n; i++) {
    const [px, py] = pts[i - 1]
    const [x, y] = pts[i % n]
    const rad = Math.hypot(x - px, y - py) * rand(r, 0.55, 0.8)
    d += ` A${f(rad)},${f(rad)} 0 0 1 ${f(x)},${f(y)}`
  }
  d += 'Z'
  const c = count ?? Math.round((rx * ry) / 55)
  let s = `<g filter="url(#rim)"><path d="${d}" fill="${dark}"/>` + foliage(r, cx, cy, rx * 0.92, ry * 0.92, { dark, mid, light, count: c, size }) + '</g>'
  if (ink) s += `<path d="${d}" fill="none" stroke="${P.ink}" stroke-width="${ink}" opacity=".55"/>`
  return s
}
