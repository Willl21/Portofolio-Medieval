import divider from '../assets/medieval/ornaments/dividers/divider.webp'
import { EXPERIENCE } from '../content'
import ui from '../components/ui/manuscript.module.css'
import styles from './pages.module.css'

export default function Experience() {
  return (
    <>
      <h1 id="folio-title" tabIndex={-1} className={ui.title}>
        The Archive
      </h1>
      <p className={ui.subtitle}>Experience</p>
      <img src={divider} alt="" className={ui.divider} />
      <p className={ui.text}>Entries from the ledger, newest first.</p>

      <ol className={styles.ledger}>
        {EXPERIENCE.map((e) => (
          <li key={e.role + e.period} className={styles.entry}>
            <p className={styles.period}>{e.period}</p>
            <h2 className={styles.entryRole}>{e.role}</h2>
            <p className={styles.entryOrg}>{e.org}</p>
            <p className={styles.entryText}>{e.text}</p>
          </li>
        ))}
      </ol>
    </>
  )
}
