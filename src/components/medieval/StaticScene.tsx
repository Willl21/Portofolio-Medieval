import { useState, type CSSProperties } from 'react'
import { FRAME, LAYERS, artworkFor } from './layers'
import { CLOUDS, FIRES, FLAGS, FOGS, KNIGHT, RAVEN, SUN, TEX } from './scenery'
import styles from './StaticScene.module.css'

const pct = (x: number, y: number, w: number): CSSProperties => ({
  left: `${(x / FRAME.w) * 100}%`,
  top: `${(y / FRAME.h) * 100}%`,
  width: `${(w / FRAME.w) * 100}%`,
})

const LAYER_SRCS = LAYERS.map((l) => artworkFor(l.dir))
const LAYER_COUNT = LAYER_SRCS.filter(Boolean).length

/**
 * Mobile / reduced-motion / no-WebGL: the same painting as plain <img>s in one 16:9 box that
 * covers the screen, so every sprite lands where the art expects it. Also sits under the canvas
 * on desktop, so the first paint is never empty while textures load.
 */
export function StaticScene() {
  // Reveal the painting whole: small sprites load first and would otherwise float on blank parchment.
  const [loaded, setLoaded] = useState(0)
  return (
    <div className="scene" aria-hidden>
      <div className={styles.box} data-ready={loaded >= LAYER_COUNT}>
        {LAYERS.map((l, i) => {
          const src = LAYER_SRCS[i]
          return (
            src && (
              <img key={l.id} src={src} alt="" className={styles.layer} style={{ zIndex: i * 10 }} onLoad={() => setLoaded((n) => n + 1)} />
            )
          )
        })}
        <img src={TEX.sun} alt="" className={styles.sprite} style={{ ...pct(SUN.x, SUN.y, SUN.size), zIndex: 3 }} />
        {CLOUDS.map((c, i) => (
          <img key={i} src={c.src} alt="" className={`${styles.sprite} ${styles.cloud}`} style={{ ...pct(c.x, c.y, c.w), zIndex: 5, animationDelay: `${-i * 9}s` }} />
        ))}
        {FOGS.map((f, i) => (
          <img key={i} src={TEX.fog} alt="" className={styles.sprite} style={{ ...pct(f.x, f.y, f.w), zIndex: i ? 36 : 15, opacity: f.opacity }} />
        ))}
        {FLAGS.map((f, i) => (
          <img key={i} src={f.src} alt="" className={styles.flag} style={{ ...pct(f.x, f.y, f.w), zIndex: f.layer === 'castle' ? 35 : 45 }} />
        ))}
        {FIRES.filter((f) => f.kind !== 'glow').map((f, i) => (
          <img key={i} src={TEX.flame} alt="" className={styles.grounded} style={{ ...pct(f.x, f.y + 6, f.kind === 'torch' ? 11 : 24), zIndex: f.layer === 'castle' ? 35 : 45 }} />
        ))}
        <img src={TEX.knight} alt="" className={styles.grounded} style={{ ...pct(KNIGHT.x, KNIGHT.y, (KNIGHT.height * 460) / 860), zIndex: 45 }} />
        <img src={TEX.raven} alt="" className={styles.grounded} style={{ ...pct(RAVEN.x, RAVEN.y, RAVEN.height), zIndex: 45 }} />
      </div>
    </div>
  )
}
