import { useState, type FormEvent } from 'react'
import divider from '../assets/medieval/ornaments/dividers/divider.webp'
import quill from '../assets/medieval/ornaments/quill/quill.webp'
import seal from '../assets/medieval/ornaments/seals/wax-seal.webp'
import raven from '../assets/medieval/characters/raven/raven.webp'
import { PROFILE } from '../content'
import ui from '../components/ui/manuscript.module.css'
import styles from './pages.module.css'

/**
 * A plain, standard form. "Sending the raven" composes the letter in the visitor's own mail app
 * (no backend to keep alive); the address is also shown so nobody is stuck if mailto does nothing.
 */
export default function Contact() {
  const [sent, setSent] = useState(false)

  const send = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const subject = `A raven from ${data.get('name')}`
    const body = `${data.get('message')}\n\n— ${data.get('name')} (${data.get('email')})`
    window.location.href = `mailto:${PROFILE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setSent(true)
  }

  return (
    <>
      <h1 id="folio-title" tabIndex={-1} className={ui.title}>
        Send a Raven
      </h1>
      <p className={ui.subtitle}>Contact</p>
      <img src={divider} alt="" className={ui.divider} />

      {sent ? (
        <div className={styles.sent} role="status">
          <img src={raven} alt="" className={styles.flyingRaven} />
          <img src={seal} alt="" width="72" height="72" />
          <p className={ui.text}>
            <strong>The raven has flown.</strong> Your mail app should now hold the sealed letter — press send there. If it didn't open, write
            to <a href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>.
          </p>
          <button type="button" className={`${ui.button} ${ui.quiet}`} onClick={() => setSent(false)}>
            Write another
          </button>
        </div>
      ) : (
        <>
          <p className={ui.text}>
            Questions, work, or a fine idea — write it below and a raven will carry it. Or reach me directly at{' '}
            <a href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>.
          </p>
          <form className={styles.form} onSubmit={send}>
            <img src={quill} alt="" className={styles.quill} />
            <label className={styles.field}>
              <span>Name</span>
              <input name="name" autoComplete="name" required />
            </label>
            <label className={styles.field}>
              <span>Email</span>
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label className={styles.field}>
              <span>Message</span>
              <textarea name="message" rows={5} required />
            </label>
            <button type="submit" className={`${ui.button} ${styles.send}`}>
              <img src={seal} alt="" width="22" height="22" />
              Send Raven
            </button>
          </form>
        </>
      )}

      <h2 className={ui.rubric}>Elsewhere</h2>
      <ul className={styles.elsewhere}>
        {PROFILE.links.map((l) => (
          <li key={l.label}>
            <a href={l.href} target="_blank" rel="noreferrer">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </>
  )
}
