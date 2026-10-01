// Shared helpers for the procedural manuscript-style art. Deterministic: same seed, same picture.
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
export const OUT = resolve(ROOT, 'src/assets/medieval')
export const TAU = Math.PI * 2

export const C = {
  ink: '#3a2819',
  cream: '#efe6cf',
  creamShade: '#d8caa8',
  gold: '#c09a45',
  goldDark: '#8a6a28',
  goldLight: '#dcbf72',
  red: '#8c3b32',
  burgundy: '#5c1f24',
  blue: '#5f7699',
  blueLight: '#7f95b2',
  green: '#3f5236',
  greenLight: '#5b7044',
  greenDark: '#2f4127',
  brown: '#5a3e2b',
  stone: '#a89a7c',
  stoneShade: '#8a7c60',
  stoneLight: '#c6b99b',
}

export function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export const rand = (r, a, b) => a + r() * (b - a)
export const pick = (r, arr) => arr[Math.floor(r() * arr.length)]
export const f = (n) => Math.round(n * 10) / 10

export const poly = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)},${f(y)}`).join(' ')

/** Catmull-Rom through points → cubic bézier path (no closing). */
export function smooth(pts) {
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const [p1, p2] = [pts[i], pts[i + 1]]
    const p3 = pts[i + 2] || p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`
  }
  return d
}

/** Scalloped blob (tree canopy, bush, cloud puff): outward arcs between points on an ellipse. */
export function lobed(r, cx, cy, rx, ry, n, jitter = 0.15) {
  const a0 = r() * TAU
  const pts = Array.from({ length: n }, (_, i) => {
    const a = a0 + ((i + rand(r, -jitter, jitter)) / n) * TAU
    const k = rand(r, 0.9, 1.05)
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]
  })
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`
  for (let i = 1; i <= n; i++) {
    const [px, py] = pts[i - 1]
    const [x, y] = pts[i % n]
    const rad = Math.hypot(x - px, y - py) * rand(r, 0.55, 0.75)
    d += ` A${f(rad)},${f(rad)} 0 0 1 ${f(x)},${f(y)}`
  }
  return d + 'Z'
}

export const path = (d, fill, sw = 4, extra = '') =>
  `<path d="${d}" fill="${fill}" ${sw ? `stroke="${C.ink}" stroke-width="${sw}"` : ''} stroke-linejoin="round" stroke-linecap="round" ${extra}/>`
export const line = (d, stroke, sw = 2, extra = '') =>
  `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`
export const circle = (cx, cy, rad, fill, sw = 3, extra = '') =>
  `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rad)}" fill="${fill}" ${sw ? `stroke="${C.ink}" stroke-width="${sw}"` : ''} ${extra}/>`

/** Five-pointed star (heraldic mullet). */
export function mullet(cx, cy, R) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const rad = i % 2 ? R * 0.42 : R
    return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]
  })
  return poly(pts) + 'Z'
}

export const svg = (w, h, body, { defs = '', scale = 1 } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(w * scale)}" height="${Math.round(h * scale)}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`

/** .svg → written as-is; anything else → rasterized to WebP. */
export async function save(rel, markup) {
  const file = resolve(OUT, rel)
  await mkdir(dirname(file), { recursive: true })
  if (rel.endsWith('.svg')) await writeFile(file, markup)
  else await sharp(Buffer.from(markup)).webp({ quality: 85, alphaQuality: 90, effort: 5 }).toFile(file)
  console.log('✓', rel)
  return file
}
