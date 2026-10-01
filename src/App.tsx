import { Suspense, lazy, useState } from 'react'
import Home from './pages/Home'
import { StaticScene } from './components/medieval/StaticScene'

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
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches

export default function App() {
  const [entered, setEntered] = useState(false)

  return (
    <>
      {hasWebGL ? (
        <Suspense fallback={null}>
          <MedievalScene entered={entered} interactive={finePointer && !reduceMotion} reduceMotion={reduceMotion} />
        </Suspense>
      ) : (
        <StaticScene />
      )}
      <div className="vignette" aria-hidden />
      <Home entered={entered} onEnter={() => setEntered(true)} onReturn={() => setEntered(false)} />
    </>
  )
}
