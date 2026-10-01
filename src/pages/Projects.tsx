import divider from '../assets/medieval/ornaments/dividers/divider.webp'
import { PROJECTS, type Project } from '../content'
import { signals } from '../components/medieval/places'
import { href } from '../router'
import ui from '../components/ui/manuscript.module.css'
import styles from './pages.module.css'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI']

export default function Projects({ slug }: { slug?: string }) {
  const project = PROJECTS.find((p) => p.slug === slug)
  return project ? <ProjectChronicle project={project} /> : <Gallery />
}

// Hovering a painting pushes the camera a hair closer, as if leaning in to look.
const lean = (v: number) => () => void (signals.nudge = v)

function Gallery() {
  return (
    <>
      <h1 id="folio-title" tabIndex={-1} className={ui.title}>
        The Gallery
      </h1>
      <p className={ui.subtitle}>Projects</p>
      <img src={divider} alt="" className={ui.divider} />
      <p className={ui.text}>Each work hangs with its plaque. Choose a painting to read its full chronicle.</p>

      <ul className={styles.gallery}>
        {PROJECTS.map((p, i) => (
          <li key={p.slug}>
            <a
              href={href(`projects/${p.slug}`)}
              className={styles.work}
              onPointerEnter={lean(0.35)}
              onPointerLeave={lean(0)}
              onFocus={lean(0.35)}
              onBlur={lean(0)}
              onClick={lean(0)}
            >
              <span className={styles.frame}>
                <img src={p.image} alt="" width="720" height="540" loading="lazy" />
              </span>
              <span className={styles.plaque}>
                <span className={styles.no}>No. {ROMAN[i]}</span>
                <span className={styles.workName}>{p.name}</span>
                <span className={styles.category}>{p.category}</span>
                <span className={styles.summary}>{p.summary}</span>
                <span className={styles.techLine}>{p.tech.join(' · ')}</span>
                <span className={styles.read} aria-hidden>
                  Read the chronicle →
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </>
  )
}

function ProjectChronicle({ project: p }: { project: Project }) {
  return (
    <>
      <a href={href('projects')} className={ui.back}>
        ← Back to the Gallery
      </a>
      <h1 id="folio-title" tabIndex={-1} className={ui.title}>
        {p.name}
      </h1>
      <p className={ui.subtitle}>{p.category}</p>

      <span className={`${styles.frame} ${styles.frameWide}`}>
        <img src={p.image} alt={`Illustration for ${p.name}`} width="720" height="540" />
      </span>

      <p className={ui.lede}>{p.description}</p>

      <dl className={styles.facts}>
        <div>
          <dt>Role</dt>
          <dd>{p.role}</dd>
        </div>
        <div>
          <dt>Built with</dt>
          <dd>
            <ul className={ui.tags}>
              {p.tech.map((t) => (
                <li key={t} className={ui.tag}>
                  {t}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>

      <h2 className={ui.rubric}>Features</h2>
      <ul className={ui.fleurons}>
        {p.features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>

      {(p.github || p.demo) && (
        <div className={styles.links}>
          {p.demo && (
            <a className={ui.button} href={p.demo} target="_blank" rel="noreferrer">
              Live demo
            </a>
          )}
          {p.github && (
            <a className={`${ui.button} ${p.demo ? ui.quiet : ''}`} href={p.github} target="_blank" rel="noreferrer">
              Source on GitHub
            </a>
          )}
        </div>
      )}
    </>
  )
}
