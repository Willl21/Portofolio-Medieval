// Living details placed in frame pixels, shared by the WebGL scene and the static fallback.
// Anything tied to the art (poles, chimneys, braziers) comes from anchors.json, written by `npm run art`.
import anchors from './anchors.json'
import type { LayerId } from './layers'
import cloudA from '../../assets/medieval/background/clouds/cloud-a.webp'
import cloudB from '../../assets/medieval/background/clouds/cloud-b.webp'
import cloudC from '../../assets/medieval/background/clouds/cloud-c.webp'
import bird from '../../assets/medieval/background/birds/bird.webp'
import fog from '../../assets/medieval/effects/fog.webp'
import smoke from '../../assets/medieval/effects/smoke.webp'
import glow from '../../assets/medieval/effects/glow.webp'
import flame from '../../assets/medieval/effects/flame.webp'
import pennantRed from '../../assets/medieval/environment/banners/pennant-red.webp'
import pennantBlue from '../../assets/medieval/environment/banners/pennant-blue.webp'
import pennantGold from '../../assets/medieval/environment/banners/pennant-gold.webp'
import knight from '../../assets/medieval/characters/knight/knight.webp'
import raven from '../../assets/medieval/characters/raven/raven-perched.webp'
import sun from '../../assets/medieval/background/sun/sun.webp'
import pilgrim from '../../assets/medieval/characters/pilgrim/pilgrim.webp'

export const TEX = { bird, fog, smoke, glow, flame, knight, raven, sun, pilgrim }

type Anchor = { layer: LayerId; x: number; y: number }

// Clouds float between the sky and the mountains, kept clear of the title above the castle.
export const CLOUDS = [
  { src: cloudA, x: 330, y: 420, w: 440, z: -36, drift: 1.4 },
  { src: cloudB, x: 1880, y: 560, w: 340, z: -34, drift: 1.1 },
  { src: cloudC, x: 120, y: 690, w: 260, z: -31, drift: 0.9 },
  { src: cloudC, x: 2260, y: 250, w: 280, z: -37, drift: 1.2 },
  { src: cloudB, x: 760, y: 220, w: 300, z: -38, drift: 1.0 },
]

// Fog lies in valleys between depth planes: it is what sells the distance between them.
export const FOGS = [
  { layer: 'mountains' as LayerId, x: 1280, y: 960, w: 3000, opacity: 0.55, z: -21 },
  { layer: 'castle' as LayerId, x: 1280, y: 1040, w: 1900, opacity: 0.6, z: -11.6 },
]

export const BIRDS = { z: -29, y: 330, count: 5, w: 26 }

const PENNANTS: Record<string, string> = { red: pennantRed, blue: pennantBlue, gold: pennantGold }
export const FLAGS = (anchors.flags as (Anchor & { tex: string })[]).map((f) => ({ ...f, src: PENNANTS[f.tex], w: f.layer === 'castle' ? 46 : 40 }))
export const SMOKES = anchors.smoke as (Anchor & { small?: boolean })[]
export const FIRES = anchors.fire as (Anchor & { kind: 'glow' | 'flame' | 'torch' })[]
export const KNIGHT = anchors.knight as Anchor & { height: number }
export const RAVEN = anchors.raven as Anchor & { height: number }
export const SUN = anchors.sun as Anchor & { size: number }

// A pilgrim walking the road to the castle: from the foot of the frame to the forest's edge.
export const PILGRIM = { from: [1336, 1470], to: [1288, 1226], height: [74, 22], seconds: 46, pause: 14 }
