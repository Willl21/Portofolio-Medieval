import { LAYERS, artworkFor } from './layers'

/** Mobile / reduced-motion / no-WebGL: same artwork stacked with plain <img>, no motion. */
export function StaticScene() {
  return (
    <div className="scene" aria-hidden>
      {LAYERS.map((l) => {
        const src = artworkFor(l.dir)
        return src && <img key={l.id} src={src} alt="" className="scene-static-layer" />
      })}
    </div>
  )
}
