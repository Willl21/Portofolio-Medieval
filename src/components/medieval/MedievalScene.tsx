import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { ParallaxLayer } from './ParallaxLayer'
import { MedievalCamera } from './MedievalCamera'
import { Ambient } from './Ambient'
import { Landmarks } from './Landmarks'
import { Fingerpost } from './Fingerpost'
import { BASE_Z, FOV, LAYERS } from './layers'
import type { Route } from '../../router'

// Default export so App can React.lazy() it and keep three.js out of the first bundle.
export default function MedievalScene({ route }: { route: Route }) {
  return (
    <Canvas
      className="scene"
      flat
      dpr={[1, 1.5]} // art is ~2K wide; rendering finer than this adds cost, not detail
      camera={{ fov: FOV, position: [0, 0, BASE_Z], near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <Suspense fallback={null}>
        {LAYERS.map((layer, i) => (
          <ParallaxLayer key={layer.id} layer={layer} order={i} />
        ))}
        <Ambient />
        <Landmarks />
        <Fingerpost visible={route.view === 'realm'} />
      </Suspense>
      <MedievalCamera route={route} />
    </Canvas>
  )
}
