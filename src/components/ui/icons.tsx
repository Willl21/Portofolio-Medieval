import type { PlaceId } from '../medieval/places'

// Ink-line glyphs for each destination; stroke follows the text colour.
const PATHS: Record<PlaceId, string> = {
  about: 'M4 21V9l2-2 2 2v3h2V6l2-3 2 3v6h2V9l2-2 2 2v12ZM10 21v-4a2 2 0 0 1 4 0v4',
  projects: 'M4 5h16v14H4ZM7 8h10v8H7ZM12 2l-2 3M12 2l2 3M7 14l3-3 2 2 2-2 3 3',
  skills: 'M5 3l9 9M3 5l2-2M14 12l-2 2 5 5 2-2ZM19 3l-9 9M21 5l-2-2M10 12l2 2-5 5-2-2Z',
  experience: 'M7 3h11a2 2 0 0 1 0 4H7ZM7 3a2 2 0 0 0 0 4v12a2 2 0 0 0 2 2h10V7M10 11h6M10 14h6M10 17h4',
  contact: 'M3 13c3-1 5-4 7-7 1 3 3 4 6 4l5-2-2 4c0 4-4 7-9 7l-3 2v-3c-2-1-3-3-4-5ZM16 10h.01',
}

export function PlaceIcon({ id }: { id: PlaceId }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={PATHS[id]} />
    </svg>
  )
}
