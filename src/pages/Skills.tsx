import divider from '../assets/medieval/ornaments/dividers/divider.webp'
import { SKILLS } from '../content'
import ui from '../components/ui/manuscript.module.css'
import styles from './pages.module.css'

export default function Skills() {
  return (
    <>
      <h1 id="folio-title" tabIndex={-1} className={ui.title}>
        The Armory
      </h1>
      <p className={ui.subtitle}>Skills</p>
      <img src={divider} alt="" className={ui.divider} />
      <p className={ui.text}>The tools I carry, racked by craft.</p>

      <div className={styles.racks}>
        {SKILLS.map((g) => (
          <section key={g.group} className={styles.rack} aria-labelledby={`rack-${g.group}`}>
            <h2 id={`rack-${g.group}`} className={styles.rackName}>
              {g.group}
            </h2>
            <p className={styles.rackNote}>{g.note}</p>
            <ul className={styles.plates}>
              {g.items.map((s) => (
                <li key={s} className={styles.plate}>
                  {s}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}
