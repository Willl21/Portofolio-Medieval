// World geometry shared by the WebGL scene, the static fallback and the camera.
// Every layer is a 16:9 frame (authored at 2560×1440); positions in the art are frame pixels.
export const FRAME = { w: 2560, h: 1440 }
const FRAME_ASPECT = FRAME.w / FRAME.h

export const BASE_Z = 10
export const FOV = 35
export const TAN = Math.tan(((FOV / 2) * Math.PI) / 180)
export const MAX_OFFSET = { x: 0.42, y: 0.2 } // world units the mouse drift may move the camera

export type Placeholder =
  | { shape: 'fill'; color: string }
  | { shape: 'ridge'; color: string; top: number; amp: number; freq: number }
  | { shape: 'castle'; color: string; top: number }

export type LayerId = 'sky' | 'mountains' | 'hills' | 'castle' | 'village' | 'forest' | 'ground' | 'rocks' | 'bushes' | 'trees'

export type LayerDef = {
  id: LayerId
  dir: string // folder under src/assets/medieval/
  z: number // further = more negative = less parallax
  sway?: number // wind sway amplitude (world units) for foliage
  placeholder: Placeholder
}

// Back to front. Artwork contract: every layer is a full-frame transparent PNG/WebP at 16:9.
export const LAYERS: LayerDef[] = [
  { id: 'sky', dir: 'background/sky', z: -40, placeholder: { shape: 'fill', color: '#e9dcbc' } },
  { id: 'mountains', dir: 'background/mountains', z: -26, placeholder: { shape: 'ridge', color: '#8a97a6', top: 0.48, amp: 0.08, freq: 3 } },
  { id: 'hills', dir: 'environment/hills', z: -17, placeholder: { shape: 'ridge', color: '#8a8f5e', top: 0.6, amp: 0.035, freq: 2 } },
  { id: 'castle', dir: 'environment/castle', z: -13, placeholder: { shape: 'castle', color: '#6e2f2b', top: 0.46 } },
  { id: 'village', dir: 'environment/village', z: -10, placeholder: { shape: 'ridge', color: '#8d9653', top: 0.68, amp: 0.02, freq: 3 } },
  { id: 'forest', dir: 'environment/forest', z: -7, placeholder: { shape: 'ridge', color: '#45563a', top: 0.72, amp: 0.035, freq: 11 } },
  { id: 'ground', dir: 'environment/ground', z: -3, placeholder: { shape: 'ridge', color: '#74834a', top: 0.84, amp: 0.01, freq: 2 } },
  { id: 'rocks', dir: 'foreground/rocks', z: 0, placeholder: { shape: 'ridge', color: '#a89a7c', top: 0.93, amp: 0.03, freq: 5 } },
  { id: 'bushes', dir: 'foreground/bushes', z: 1, placeholder: { shape: 'ridge', color: '#3e5233', top: 0.95, amp: 0.03, freq: 7 } },
  { id: 'trees', dir: 'foreground/trees', z: 2, sway: 0.035, placeholder: { shape: 'ridge', color: '#4a3826', top: 0.9, amp: 0.06, freq: 4 } },
]

export const layerIndex = (id: LayerId) => LAYERS.findIndex((l) => l.id === id)
export const layerZ = (id: LayerId) => LAYERS[layerIndex(id)].z

/**
 * World size of a layer plane: covers the viewport at its depth plus room for mouse drift.
 * Because of that margin, the camera may translate by
 *   |x| ≤ TAN·aspect·(BASE_Z − camZ) + 1.1·MAX_OFFSET.x   (same for every layer)
 * without ever revealing an edge — see clampToWorld().
 */
export function planeSize(z: number, aspect: number): [number, number] {
  const d = BASE_Z - z
  const visH = 2 * d * TAN
  const visW = visH * aspect
  const h = Math.max(visH + MAX_OFFSET.y * 2.2, (visW + MAX_OFFSET.x * 2.2) / FRAME_ASPECT)
  return [h * FRAME_ASPECT, h]
}

/** Frame pixel on a layer at depth z → world position. */
export function frameToWorld(x: number, y: number, z: number, aspect: number): [number, number, number] {
  const [w, h] = planeSize(z, aspect)
  return [(x / FRAME.w - 0.5) * w, (0.5 - y / FRAME.h) * h, z]
}

/** World units per frame pixel at depth z. */
export const frameScale = (z: number, aspect: number) => planeSize(z, aspect)[0] / FRAME.w

/** Keep the camera inside the region where every layer still covers the screen. */
export function clampToWorld(x: number, y: number, z: number, aspect: number): [number, number] {
  const mx = TAN * aspect * (BASE_Z - z) + MAX_OFFSET.x * 1.1
  const my = TAN * (BASE_Z - z) + MAX_OFFSET.y * 1.1
  return [Math.max(-mx, Math.min(mx, x)), Math.max(-my, Math.min(my, y))]
}

const artwork = import.meta.glob('../../assets/medieval/**/*.{png,webp,jpg,jpeg,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

/** First image found in the layer's folder; drop a file in and it's picked up. */
export function artworkFor(dir: string): string | undefined {
  const key = Object.keys(artwork).sort().find((k) => k.includes(`/medieval/${dir}/`))
  return key && artwork[key]
}
