import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { BASE_Z, ENTER_ZOOM, MAX_OFFSET } from './layers'

type Props = { entered: boolean; interactive: boolean; reduceMotion: boolean }

const DRIFT_RATE = 3 // higher = snappier pointer follow
const ZOOM_RATE = 1.6 // slower, cinematic push-in
const EPS = 1e-4

export function MedievalCamera({ entered, interactive, reduceMotion }: Props) {
  const target = useRef({ x: 0, y: 0 })
  const invalidate = useThree((s) => s.invalidate)

  useEffect(() => {
    if (!interactive) return
    const move = (e: PointerEvent) => {
      target.current.x = (e.clientX / window.innerWidth) * 2 - 1
      target.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
      invalidate()
    }
    const leave = () => {
      target.current.x = target.current.y = 0
      invalidate()
    }
    window.addEventListener('pointermove', move)
    document.documentElement.addEventListener('mouseleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('mouseleave', leave)
    }
  }, [interactive, invalidate])

  useEffect(() => invalidate(), [entered, invalidate])

  // frameloop="demand": we only keep requesting frames while the camera is still settling.
  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 1 / 30) // first frame after idle can carry a huge delta
    const drift = reduceMotion ? 1 : 1 - Math.exp(-DRIFT_RATE * dt)
    const zoom = reduceMotion ? 1 : 1 - Math.exp(-ZOOM_RATE * dt)
    const tx = target.current.x * MAX_OFFSET.x
    const ty = target.current.y * MAX_OFFSET.y
    const tz = entered && !reduceMotion ? BASE_Z - ENTER_ZOOM : BASE_Z

    const p = camera.position
    p.x += (tx - p.x) * drift
    p.y += (ty - p.y) * drift
    p.z += (tz - p.z) * zoom

    if (Math.abs(tx - p.x) > EPS || Math.abs(ty - p.y) > EPS || Math.abs(tz - p.z) > EPS) invalidate()
  })

  return null
}
