import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { ParallaxLayer } from './ParallaxLayer'
import { MedievalCamera } from './MedievalCamera'
import { BASE_Z, FOV, LAYERS } from './layers'

type Props = { entered: boolean; interactive: boolean; reduceMotion: boolean }

// Default export so App can React.lazy() it and keep three.js out of the first bundle.
export default function MedievalScene(props: Props) {
  return (
    <Canvas
      className="scene"
      frameloop="demand"
      flat
      dpr={[1, 1.75]}
      camera={{ fov: FOV, position: [0, 0, BASE_Z], near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true }}
      aria-hidden
    >
      <Suspense fallback={null}>
        {LAYERS.map((layer, i) => (
          <ParallaxLayer key={layer.id} layer={layer} order={i} />
        ))}
      </Suspense>
      <MedievalCamera {...props} />
    </Canvas>
  )
}
