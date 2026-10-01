import anchors from './anchors.json'
import { BASE_Z, TAN, clampToWorld, frameToWorld, layerZ, type LayerId } from './layers'

export type PlaceId = 'about' | 'projects' | 'skills' | 'experience' | 'contact'

type Place = {
  name: string // in-world name
  label: string // plain label, so nobody has to decode the metaphor
  folio: string // manuscript-style numbering for the panel
  side: 'left' | 'right' // where the panel opens; the landmark is framed on the other side
  zoom: number // how far the camera flies in (world units); past the foreground planes, which simply fall behind it
}

export const PLACES: Record<PlaceId, Place> = {
  about: { name: 'The Castle', label: 'About', folio: 'Folio I', side: 'right', zoom: 6.5 },
  projects: { name: 'The Gallery', label: 'Projects', folio: 'Folio II', side: 'right', zoom: 9.5 },
  skills: { name: 'The Armory', label: 'Skills', folio: 'Folio III', side: 'right', zoom: 10 },
  experience: { name: 'The Archive', label: 'Experience', folio: 'Folio IV', side: 'left', zoom: 9.5 },
  contact: { name: 'The Raven Tower', label: 'Contact', folio: 'Folio V', side: 'left', zoom: 9 },
}
export const PLACE_ORDER: PlaceId[] = ['about', 'projects', 'skills', 'experience', 'contact']

export const anchorOf = (id: PlaceId) => anchors.places[id] as { layer: LayerId; x: number; y: number }

export type Pose = [number, number, number]
export const HOME_POSE: Pose = [0, 0, BASE_Z]
export const OVERVIEW_POSE: Pose = [0, 0.12, BASE_Z - 0.9]

/** Camera pose that frames a landmark on the side opposite its panel. */
export function poseFor(id: PlaceId, aspect: number): Pose {
  const a = anchorOf(id)
  const z = layerZ(a.layer)
  const [lx, ly] = frameToWorld(a.x, a.y, z, aspect)
  const p = PLACES[id]
  const cz = BASE_Z - p.zoom
  const d = cz - z
  // On narrow screens the panel covers everything, so just center the landmark.
  const ndcX = aspect < 1 ? 0 : p.side === 'left' ? 0.4 : -0.4
  const [cx, cy] = clampToWorld(lx - ndcX * TAN * aspect * d, ly + 0.08 * TAN * d, cz, aspect)
  return [cx, cy, cz]
}

/** Mutable, React-free channel from UI hover → camera (read every frame, never re-renders). */
export const signals = {
  preview: null as PlaceId | null, // nav/marker hover: lean the camera toward a place
  nudge: 0, // project hover: tiny extra push-in
}
