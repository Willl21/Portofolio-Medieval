import scribe from '../assets/medieval/characters/scribe/scribe.webp'
import divider from '../assets/medieval/ornaments/dividers/divider.webp'
import seal from '../assets/medieval/ornaments/seals/wax-seal.webp'
import { PROFILE } from '../content'
import ui from '../components/ui/manuscript.module.css'
import styles from './pages.module.css'

export default function About() {
  return (
    <>
      <h1 id="folio-title" tabIndex={-1} className={ui.title}>
        The Scribe
      </h1>
      <p className={ui.subtitle}>About me</p>
      <img src={divider} alt="" className={ui.divider} />

      <div className={styles.identity}>
        <img src={scribe} alt="" className={styles.portrait} width="200" height="217" />
        <div>
          <p className={styles.name}>{PROFILE.name}</p>
          <p className={styles.role}>{PROFILE.title}</p>
          <ul className={ui.tags} aria-label="Roles">
            {PROFILE.roles.map((r) => (
              <li key={r} className={ui.tag}>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className={ui.lede}>{PROFILE.intro}</p>

      <h2 className={ui.rubric}>Current focus</h2>
      <ul className={ui.fleurons}>
        {PROFILE.focus.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>

      <h2 className={ui.rubric}>Development interests</h2>
      <ul className={ui.fleurons}>
        {PROFILE.interests.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>

      <p className={styles.signature}>
        <img src={seal} alt="" width="52" height="52" />
        <span>Set down by my own hand — W.</span>
      </p>
    </>
  )
}
