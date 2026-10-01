// Camera rig constants shared by the scene, layers and camera.
export const BASE_Z = 10
export const FOV = 35
export const MAX_OFFSET = { x: 0.6, y: 0.3 } // world units the camera may drift
export const ENTER_ZOOM = 1.4 // world units the camera pushes in on "Enter"

export type Placeholder =
  | { shape: 'fill'; color: string }
  | { shape: 'ridge'; color: string; top: number; amp: number; freq: number }
  | { shape: 'castle'; color: string; top: number }

export type LayerDef = {
  id: string
  dir: string // folder under src/assets/medieval/
  z: number // further = more negative = less parallax
  placeholder: Placeholder
}

// Back to front. Artwork contract: every layer is a full-frame transparent
// PNG/WebP with the SAME aspect ratio (e.g. 2560×1440), so layers line up.
export const LAYERS: LayerDef[] = [
  { id: 'sky', dir: 'background/sky', z: -40, placeholder: { shape: 'fill', color: '#e9dcbc' } },
  { id: 'mountains', dir: 'background/mountains', z: -26, placeholder: { shape: 'ridge', color: '#8a97a6', top: 0.48, amp: 0.08, freq: 3 } },
  { id: 'hills', dir: 'environment/hills', z: -16, placeholder: { shape: 'ridge', color: '#8a8f5e', top: 0.64, amp: 0.035, freq: 2 } },
  { id: 'castle', dir: 'environment/castle', z: -13, placeholder: { shape: 'castle', color: '#6e2f2b', top: 0.4 } },
  { id: 'forest', dir: 'environment/forest', z: -6, placeholder: { shape: 'ridge', color: '#45563a', top: 0.76, amp: 0.035, freq: 11 } },
  { id: 'foreground', dir: 'foreground/trees', z: 2, placeholder: { shape: 'ridge', color: '#4a3826', top: 0.9, amp: 0.06, freq: 4 } },
]

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
