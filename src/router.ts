import { useSyncExternalStore } from 'react'
import { PLACE_ORDER, type PlaceId } from './components/medieval/places'

// Hash routes: '' title page · '#/realm' overview · '#/about' · '#/projects/<slug>' …
// Hash keeps it a static site (no server rewrites) and makes every view linkable + back-button friendly.
export type Route = { view: 'title' } | { view: 'realm' } | { view: 'place'; place: PlaceId; detail?: string }

function parse(hash: string): Route {
  const [first, second] = hash.replace(/^#\/?/, '').split('/')
  if (!first) return { view: 'title' }
  if ((PLACE_ORDER as string[]).includes(first)) return { view: 'place', place: first as PlaceId, detail: second || undefined }
  return { view: 'realm' }
}

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

let cached = { hash: '\0', route: { view: 'title' } as Route }
const snapshot = () => {
  if (cached.hash !== location.hash) cached = { hash: location.hash, route: parse(location.hash) }
  return cached.route
}

export const useRoute = () => useSyncExternalStore(subscribe, snapshot)

export const href = (path = '') => `#/${path}`
