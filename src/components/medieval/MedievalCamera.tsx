import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MAX_OFFSET, clampToWorld } from './layers'
import { HOME_POSE, OVERVIEW_POSE, poseFor, signals, type Pose } from './places'
import type { Route } from '../../router'

const TRAVEL_TIME = 0.85 // smooth-damp time constant: eases in AND out, so journeys feel filmed, not snapped
const DRIFT_RATE = 1.8 // pointer follow, exponential: unhurried, like a viewer stepping along a gallery wall
const PREVIEW_LEAN = 0.06 // how far hovering a destination leans the overview toward it
const TOUCH_REACH = 0.35 // a finger drag moves the view at most this fraction of the mouse's reach
// Dev-only: `?snap` jumps straight to each pose, for checking framing in throttled/headless tabs.
const SNAP = import.meta.env.DEV && location.search.includes('snap')

/** Critically damped spring toward a target (Unity's SmoothDamp). Starts gently, settles without overshoot. */
function smoothDamp(current: number, target: number, vel: { v: number }, time: number, dt: number) {
  const omega = 2 / time
  const x = omega * dt
  const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x)
  const change = current - target
  const temp = (vel.v + omega * change) * dt
  vel.v = (vel.v - omega * temp) * decay
  return target + (change + temp) * decay
}

export function MedievalCamera({ route }: { route: Route }) {
  const pointer = useRef({ x: 0, y: 0 })
  const pose = useRef<Pose>([...HOME_POSE])
  const vel = useMemo(() => [{ v: 0 }, { v: 0 }, { v: 0 }], [])
  const drift = useRef({ x: 0, y: 0 })

  useEffect(() => {
    // Touch: only a drag on the painting itself moves the view, by how far the finger travelled
    // (not where it landed), and only a third as far as a mouse can. Scrolling a folio or tapping
    // the nav never nudges the camera.
    const drag = { active: false, x: 0, y: 0 }
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return
      drag.active = !(e.target as Element).closest?.('section, nav, a, button, header')
      drag.x = e.clientX
      drag.y = e.clientY
    }
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') {
        pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
        pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
        return
      }
      if (!drag.active) return
      const span = Math.min(window.innerWidth, window.innerHeight)
      const clamp = (v: number) => Math.max(-TOUCH_REACH, Math.min(TOUCH_REACH, v))
      pointer.current.x = clamp(((drag.x - e.clientX) / span) * TOUCH_REACH * 2)
      pointer.current.y = clamp(((e.clientY - drag.y) / span) * TOUCH_REACH * 2)
    }
    const leave = () => {
      pointer.current.x = pointer.current.y = 0
    }
    // when the finger lifts, the painting drifts back to rest
    const lift = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return
      drag.active = false
      leave()
    }
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', lift)
    window.addEventListener('pointercancel', lift)
    document.documentElement.addEventListener('mouseleave', leave)
    return () => {
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', lift)
      window.removeEventListener('pointercancel', lift)
      document.documentElement.removeEventListener('mouseleave', leave)
    }
  }, [])

  useFrame(({ camera, size, clock }, delta) => {
    const dt = Math.min(delta, 1 / 20) // a tab coming back from background must not teleport the camera
    const aspect = size.width / size.height

    let target: Pose = route.view === 'place' ? poseFor(route.place, aspect) : route.view === 'realm' ? OVERVIEW_POSE : HOME_POSE
    if (route.view === 'realm' && signals.preview) {
      const p = poseFor(signals.preview, aspect)
      target = target.map((v, i) => v + (p[i] - v) * PREVIEW_LEAN) as Pose
    }
    const p = pose.current
    if (SNAP) target.forEach((v, i) => (p[i] = v))
    p[0] = smoothDamp(p[0], target[0], vel[0], TRAVEL_TIME, dt)
    p[1] = smoothDamp(p[1], target[1], vel[1], TRAVEL_TIME, dt)
    p[2] = smoothDamp(p[2], target[2] - signals.nudge, vel[2], TRAVEL_TIME, dt)

    // The painting "breathes" with the mouse; calmer while reading a folio.
    const reach = route.view === 'place' ? 0.35 : 1
    const k = 1 - Math.exp(-DRIFT_RATE * dt)
    drift.current.x += (pointer.current.x * MAX_OFFSET.x * reach - drift.current.x) * k
    drift.current.y += (pointer.current.y * MAX_OFFSET.y * reach - drift.current.y) * k

    // and the painting breathes on its own, very slightly, even when nobody moves
    const t = clock.elapsedTime
    const breathX = Math.sin(t * 0.09) * 0.05
    const breathY = Math.sin(t * 0.13 + 1) * 0.025
    const [x, y] = clampToWorld(p[0] + drift.current.x + breathX, p[1] + drift.current.y + breathY, p[2], aspect)
    camera.position.set(x, y, p[2])
  })

  return null
}
