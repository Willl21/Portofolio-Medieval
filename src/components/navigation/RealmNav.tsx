import emblem from '../../assets/medieval/ornaments/royal-emblems/emblem.webp'
import { PLACES, PLACE_ORDER, signals, type PlaceId } from '../medieval/places'
import { PlaceIcon } from '../ui/icons'
import { href } from '../../router'
import styles from './RealmNav.module.css'

/** The banner across the top (bottom bar on phones). Medieval name + plain label, always both. */
export function RealmNav({ current }: { current: PlaceId | null }) {
  const lean = (id: PlaceId | null) => () => void (signals.preview = id)
  return (
    <nav className={styles.nav} aria-label="Sections">
      <a href={href('realm')} className={styles.crest} aria-label="Map of the realm" title="Map of the realm">
        <img src={emblem} alt="" width="28" height="33" />
      </a>
      <ul className={styles.list}>
        {PLACE_ORDER.map((id) => (
          <li key={id}>
            <a
              href={href(id)}
              className={styles.item}
              aria-current={current === id ? 'page' : undefined}
              onPointerEnter={lean(id)}
              onPointerLeave={lean(null)}
              onFocus={lean(id)}
              onBlur={lean(null)}
              onClick={lean(null)}
            >
              <PlaceIcon id={id} />
              <span className={styles.text}>
                <span className={styles.name}>{PLACES[id].name.replace('The ', '')}</span>
                <span className={styles.label}>{PLACES[id].label}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
