import { Suspense, lazy, useEffect } from 'react'
import Home from './pages/Home'
import About from './pages/About'
import Projects from './pages/Projects'
import Skills from './pages/Skills'
import Experience from './pages/Experience'
import Contact from './pages/Contact'
import { StaticScene } from './components/medieval/StaticScene'
import { RealmNav } from './components/navigation/RealmNav'
import { Folio } from './components/ui/Folio'
import { PLACES, type PlaceId } from './components/medieval/places'
import { PROJECTS } from './content'
import { useRoute } from './router'

const MedievalScene = lazy(() => import('./components/medieval/MedievalScene'))

const hasWebGL = (() => {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
})()

// ponytail: read once at load; make reactive if switching OS settings live ever matters.
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
// The living 2.5D painting everywhere WebGL works (phones included; they may run slower).
// Reduced motion and no-WebGL get the static painting.
// ponytail: no per-device quality tiers yet; add lighter textures for phones if they lag too much.
const animated = hasWebGL && !reduceMotion

const PAGES: Record<PlaceId, (props: { detail?: string }) => React.ReactNode> = {
  about: About,
  projects: ({ detail }) => <Projects slug={detail} />,
  skills: Skills,
  experience: Experience,
  contact: Contact,
}

export default function App() {
  const route = useRoute()
  const place = route.view === 'place' ? route.place : null
  const detail = route.view === 'place' ? route.detail : undefined

  useEffect(() => {
    const project = PROJECTS.find((p) => p.slug === detail)
    const section = place && (project?.name ?? `${PLACES[place].label} — ${PLACES[place].name}`)
    document.title = section ? `${section} · The Chronicles of Wildan` : 'The Chronicles of Wildan'
  }, [place, detail])

  const Page = place && PAGES[place]

  return (
    <>
      {/* Always underneath: paints instantly, and the canvas's opaque sky covers it once textures load. */}
      <StaticScene />
      {animated && (
        <Suspense fallback={null}>
          <MedievalScene route={route} />
        </Suspense>
      )}
      <div className="vignette" aria-hidden />
      <div className="page-frame" aria-hidden />

      <Home hidden={route.view !== 'title'} />

      {route.view !== 'title' && <RealmNav current={place} />}

      {route.view === 'realm' && (
        <p className="realm-hint" data-place={animated ? 'top' : 'bottom'} role="status">
          <span className="wide">{animated ? 'Follow a signpost, or choose from the banner above.' : 'Choose a destination from the banner above.'}</span>
          <span className="narrow">Choose a destination below.</span>
        </p>
      )}

      {place && Page && (
        <main>
          <Folio key={place} place={place} view={`${place}/${detail ?? ''}`}>
            <Page detail={detail} />
          </Folio>
        </main>
      )}
    </>
  )
}
