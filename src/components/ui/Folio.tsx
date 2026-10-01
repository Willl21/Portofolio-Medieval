import { useEffect, useRef, type ReactNode } from 'react'
import compass from '../../assets/medieval/ornaments/map/compass.webp'
import { PLACES, type PlaceId } from '../medieval/places'
import { href } from '../../router'
import styles from './Folio.module.css'

/**
 * A manuscript leaf that opens beside the landmark the camera flew to.
 * `view` changes when the content inside changes (gallery → project), so focus and scroll reset.
 */
export function Folio({ place, view, children }: { place: PlaceId; view: string; children: ReactNode }) {
  const scroller = useRef<HTMLDivElement>(null)
  const p = PLACES[place]

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
    document.getElementById('folio-title')?.focus({ preventScroll: true })
  }, [view])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') location.hash = href('realm')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <section className={styles.folio} data-side={p.side} aria-labelledby="folio-title">
      <div className={styles.sheet}>
        <div className={styles.head}>
          <p className={styles.kicker}>
            {p.folio} <span aria-hidden>·</span> {p.name}
          </p>
          <a href={href('realm')} className={styles.close} aria-label="Close and return to the map" title="Return to the map (Esc)">
            <img src={compass} alt="" width="26" height="26" />
            <span>Map</span>
          </a>
        </div>
        <div ref={scroller} className={styles.scroll}>
          <div key={view} className={styles.content}>
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}
