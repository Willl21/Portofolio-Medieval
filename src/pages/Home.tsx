import divider from '../assets/medieval/ornaments/dividers/divider.webp'
import { href } from '../router'
import styles from './Home.module.css'

/**
 * Title page of the chronicle. The title is lettered on a banderole unfurled in the sky,
 * the way medieval painters put words into a picture. Stays mounted so it can fade out.
 */
export default function Home({ hidden }: { hidden: boolean }) {
  return (
    <header className={styles.hero} data-hidden={hidden} inert={hidden}>
      <p className={styles.kicker}>A portfolio in five folios</p>
      <div className={styles.scroll}>
        <h1 className={styles.title}>
          <span className={styles.titleSmall}>The Chronicles of</span>
          <span className={styles.titleName}>Wildan</span>
        </h1>
      </div>
      <p className={styles.subtitle}>Web Developer &amp; Digital Craftsman</p>
      <img src={divider} alt="" className={styles.divider} />
      <a href={href('realm')} className={styles.enter}>
        Enter the Realm
      </a>
      <a href={href('projects')} className={styles.skip}>
        or go straight to the projects →
      </a>
    </header>
  )
}
