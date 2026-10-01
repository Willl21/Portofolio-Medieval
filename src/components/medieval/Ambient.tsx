import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture, type Group, type Mesh, type MeshBasicMaterial, type Points, type PointsMaterial } from 'three'
import { BASE_Z, TAN, frameScale, frameToWorld, layerIndex, layerZ } from './layers'
import { BIRDS, CLOUDS, FOGS, PILGRIM, SUN, TEX } from './scenery'
import { useAspect, useTextures } from './sceneKit'

/** Weather and air: the gilt sun, slow clouds, valley fog, a passing flock, a pilgrim, motes of dust. */
export function Ambient() {
  return (
    <>
      <Sun />
      <Clouds />
      <Fogs />
      <Birds />
      <Pilgrim />
      <Motes />
    </>
  )
}

const imgAspect = (t: { image: unknown }) => {
  const { width, height } = t.image as { width: number; height: number }
  return width / height
}

/** The illuminated sun: its rays turn so slowly you only notice they have moved. */
function Sun() {
  const aspect = useAspect()
  const [texture] = useTextures([TEX.sun])
  const z = layerZ('sky') + 0.5
  const size = SUN.size * frameScale(z, aspect)
  const ref = useRef<Mesh>(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z -= delta * 0.006
  })
  return (
    <mesh ref={ref} position={frameToWorld(SUN.x, SUN.y, z, aspect)} renderOrder={layerIndex('sky') + 0.3}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

function Clouds() {
  const aspect = useAspect()
  const textures = useTextures(CLOUDS.map((c) => c.src))
  const meshes = useRef<(Mesh | null)[]>([])
  const placed = CLOUDS.map((c, i) => {
    const s = frameScale(c.z, aspect)
    const w = c.w * s
    return { pos: frameToWorld(c.x, c.y, c.z, aspect), size: [w, w / imgAspect(textures[i])] as const, drift: c.drift }
  })

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    placed.forEach((c, i) => {
      const m = meshes.current[i]
      if (m) m.position.x = c.pos[0] + Math.sin(t * (0.02 + i * 0.006) + i * 1.7) * c.drift
    })
  })

  return placed.map((c, i) => (
    <mesh key={i} ref={(m) => void (meshes.current[i] = m)} position={c.pos} renderOrder={layerIndex('sky') + 0.5}>
      <planeGeometry args={[c.size[0], c.size[1]]} />
      <meshBasicMaterial map={textures[i]} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  ))
}

function Fogs() {
  const aspect = useAspect()
  const [texture] = useTextures([TEX.fog])
  const meshes = useRef<(Mesh | null)[]>([])
  const placed = FOGS.map((f) => {
    const w = f.w * frameScale(f.z, aspect)
    return { pos: frameToWorld(f.x, f.y, f.z, aspect), size: [w, w / imgAspect(texture)] as const, opacity: f.opacity, order: layerIndex(f.layer) + 0.6 }
  })

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    placed.forEach((f, i) => {
      const m = meshes.current[i]
      if (!m) return
      m.position.x = f.pos[0] + Math.sin(t * 0.035 + i * 2) * 0.8
      ;(m.material as MeshBasicMaterial).opacity = f.opacity * (0.85 + 0.15 * Math.sin(t * 0.13 + i))
    })
  })

  return placed.map((f, i) => (
    <mesh key={i} ref={(m) => void (meshes.current[i] = m)} position={f.pos} renderOrder={f.order}>
      <planeGeometry args={[f.size[0], f.size[1]]} />
      <meshBasicMaterial map={texture} transparent opacity={f.opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  ))
}

const FLOCK_PERIOD = 48 // seconds between crossings
const FLOCK_CROSS = 26 // seconds to cross the sky

function Birds() {
  const aspect = useAspect()
  const [texture] = useTextures([TEX.bird])
  const group = useRef<Group>(null)
  const birds = useRef<(Mesh | null)[]>([])
  const s = frameScale(BIRDS.z, aspect)
  const w = BIRDS.w * s
  const [, baseY] = frameToWorld(0, BIRDS.y, BIRDS.z, aspect)
  const halfSpan = TAN * aspect * (BASE_Z - BIRDS.z) * 1.15
  // loose V formation, leader in front
  const formation = useMemo(() => Array.from({ length: BIRDS.count }, (_, i) => [Math.ceil(i / 2) * 0.9, (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 0.35]), [])

  useFrame(({ clock }) => {
    const g = group.current
    if (!g) return
    const t = clock.elapsedTime + 14
    const p = (t % FLOCK_PERIOD) / FLOCK_CROSS
    g.visible = p <= 1
    if (!g.visible) return
    g.position.set(halfSpan * (1 - 2 * p), baseY + Math.sin(p * 4) * 0.6, BIRDS.z)
    birds.current.forEach((b, i) => {
      if (b) b.scale.y = 0.35 + 0.65 * Math.abs(Math.sin(t * 5.5 + i * 0.8))
    })
  })

  return (
    <group ref={group} renderOrder={layerIndex('sky') + 0.6}>
      {formation.map(([dx, dy], i) => (
        <mesh key={i} ref={(m) => void (birds.current[i] = m)} position={[dx, dy, 0]} renderOrder={layerIndex('sky') + 0.6}>
          <planeGeometry args={[w, w / 2]} />
          <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

/** A pilgrim with staff and satchel, walking the road to the castle, then a pause before the next. */
function Pilgrim() {
  const aspect = useAspect()
  const [source] = useTextures([TEX.pilgrim])
  // own copy so the stride (UV offset) doesn't leak to anything else using the image
  const texture = useMemo(() => {
    const t = source.clone()
    t.repeat.set(0.5, 1)
    t.needsUpdate = true
    return t
  }, [source])
  useEffect(() => () => texture.dispose(), [texture])
  const ref = useRef<Mesh>(null)
  const z = layerZ('ground') + 0.05
  const s = frameScale(z, aspect)

  useFrame(({ clock }) => {
    const m = ref.current
    if (!m) return
    const t = (clock.elapsedTime + 6) % (PILGRIM.seconds + PILGRIM.pause)
    const k = t / PILGRIM.seconds
    m.visible = k <= 1
    if (!m.visible) return
    const fx = PILGRIM.from[0] + (PILGRIM.to[0] - PILGRIM.from[0]) * k
    const fy = PILGRIM.from[1] + (PILGRIM.to[1] - PILGRIM.from[1]) * k
    const h = (PILGRIM.height[0] + (PILGRIM.height[1] - PILGRIM.height[0]) * k) * s
    const [x, y] = frameToWorld(fx, fy, z, aspect)
    m.scale.set((h * 90) / 160, h, 1)
    m.position.set(x, y + h / 2 + Math.abs(Math.sin(t * 4.2)) * h * 0.02, z)
    texture.offset.x = Math.floor(t * 2.1) % 2 ? 0.5 : 0
    ;(m.material as MeshBasicMaterial).opacity = Math.min(1, k / 0.06, (1 - k) / 0.1)
  })

  return (
    <mesh ref={ref} renderOrder={layerIndex('ground') + 0.4}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

const MOTES = 46

/** Gold dust drifting up through the sunlit air above the meadow. */
function Motes() {
  const points = useRef<Points>(null)
  const { positions, seeds, sprite } = useMemo(() => {
    const positions = new Float32Array(MOTES * 3)
    const seeds = new Float32Array(MOTES)
    for (let i = 0; i < MOTES; i++) {
      positions.set([(Math.random() - 0.5) * 12, (Math.random() - 0.5) * 5, -3 + Math.random() * 2.6], i * 3)
      seeds[i] = Math.random() * 100
    }
    const c = document.createElement('canvas')
    c.width = c.height = 32
    const g = c.getContext('2d')!
    const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16)
    grad.addColorStop(0, 'rgba(255,240,200,1)')
    grad.addColorStop(1, 'rgba(255,240,200,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 32, 32)
    return { positions, seeds, sprite: new CanvasTexture(c) }
  }, [])
  useEffect(() => () => sprite.dispose(), [sprite])

  useFrame(({ clock, camera }, delta) => {
    const pts = points.current
    const attr = pts?.geometry.getAttribute('position')
    if (!pts || !attr) return
    // fade out as the camera flies in among them, before they become blobs
    const visible = Math.min(1, Math.max(0, (camera.position.z - 5) / 3))
    ;(pts.material as PointsMaterial).opacity = 0.7 * visible
    if (!visible) return
    const t = clock.elapsedTime
    const dt = Math.min(delta, 0.05)
    for (let i = 0; i < MOTES; i++) {
      let y = positions[i * 3 + 1] + dt * (0.05 + (seeds[i] % 1) * 0.06)
      if (y > 2.5) y = -2.5
      positions[i * 3 + 1] = y
      positions[i * 3] += Math.sin(t * 0.4 + seeds[i]) * dt * 0.05
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={points} renderOrder={layerIndex('ground') + 0.5} position={[0, 0, layerZ('ground') + 2]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial map={sprite} color="#f3d98b" size={0.06} sizeAttenuation transparent opacity={0.7} depthWrite={false} toneMapped={false} />
    </points>
  )
}
