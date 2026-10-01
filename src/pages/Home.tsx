import styles from './Home.module.css'

type Props = { entered: boolean; onEnter: () => void; onReturn: () => void }

export default function Home({ entered, onEnter, onReturn }: Props) {
  return (
    <main className={styles.landing}>
      <header className={styles.hero} data-hidden={entered} inert={entered}>
        <h1 className={styles.title}>
          <span className={styles.titleSmall}>The Chronicles of</span>
          <span className={styles.titleName}>Wildan</span>
        </h1>
        <p className={styles.divider} aria-hidden>
          ❦
        </p>
        <p className={styles.subtitle}>Web Developer &amp; Digital Craftsman</p>
        <button type="button" className={styles.enter} onClick={onEnter}>
          Enter the Realm
        </button>
      </header>

      {/* ponytail: stand-in until Phase 6 builds the real destination scene */}
      {entered && (
        <button type="button" className={styles.back} onClick={onReturn}>
          ← Return
        </button>
      )}
    </main>
  )
}
