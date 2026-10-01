import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, MeshBasicMaterial, type Group, type Mesh, type Texture } from 'three'
import { frameScale, frameToWorld, layerIndex, layerZ, type LayerId } from './layers'
import { FIRES, FLAGS, KNIGHT, RAVEN, SMOKES, TEX } from './scenery'
import { useAspect, useTextures, useWaveMaterial } from './sceneKit'

/** Everything that lives on the buildings: banners, chimney smoke, fire, the sentry and the raven. */
export function Landmarks() {
  return (
    <>
      <Flags />
      {SMOKES.map((s, i) => (
        <SmokeColumn key={i} {...s} seed={i} />
      ))}
      <Fires />
      <Knight />
      <Raven />
    </>
  )
}

/** World placement for something drawn at a frame pixel of a given layer. */
function useSpot(layer: LayerId, x: number, y: number) {
  const aspect = useAspect()
  const z = layerZ(layer) + 0.02
  return { pos: frameToWorld(x, y, z, aspect), s: frameScale(z, aspect), order: layerIndex(layer) + 0.5 }
}

function Flags() {
  const textures = useTextures(FLAGS.map((f) => f.src))
  return FLAGS.map((f, i) => <Flag key={i} flag={f} texture={textures[i]} phase={i * 1.37} />)
}

function Flag({ flag, texture, phase }: { flag: (typeof FLAGS)[number]; texture: Texture; phase: number }) {
  const { pos, s, order } = useSpot(flag.layer, flag.x, flag.y)
  const w = flag.w * s
  const h = (w * 64) / 140
  const { material, uniforms } = useWaveMaterial(texture, 'flag', h * 0.16, [w, h])
  const amp = h * 0.16
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    uniforms.uTime.value = t + phase
    // gusts: each banner rises and settles on its own slow rhythm
    uniforms.uAmp.value = amp * (0.55 + 0.45 * Math.sin(t * 0.23 + phase) * Math.sin(t * 0.11 + phase * 2))
  })
  // texture's pole edge sits on the left; hang the pennant from the pole top
  return (
    <mesh position={[pos[0] + w / 2, pos[1] - h / 2 + 2 * s, pos[2]]} renderOrder={order + 0.1} material={material}>
      <planeGeometry args={[w, h, 10, 1]} />
    </mesh>
  )
}

const PUFF_LIFE = 7 // seconds from chimney to gone

function SmokeColumn({ layer, x, y, small, seed }: { layer: LayerId; x: number; y: number; small?: boolean; seed: number }) {
  const [texture] = useTextures([TEX.smoke])
  const { pos, s, order } = useSpot(layer, x, y)
  const count = small ? 3 : 6
  const size = (small ? 22 : 38) * s
  const rise = (small ? 90 : 170) * s
  const wind = (small ? 40 : 80) * s
  const puffs = useRef<(Mesh | null)[]>([])
  const materials = useMemo(
    () => Array.from({ length: count }, () => new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 })),
    [texture, count],
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed * 2.3
    puffs.current.forEach((m, i) => {
      if (!m) return
      const k = ((t / PUFF_LIFE + i / count) % 1 + 1) % 1
      m.position.set(pos[0] + k * wind + Math.sin(t * 0.8 + i) * size * 0.15, pos[1] + k * rise, pos[2])
      m.scale.setScalar(0.45 + k * 1.4)
      materials[i].opacity = Math.sin(Math.PI * k) * (small ? 0.35 : 0.5)
    })
  })

  return materials.map((mat, i) => (
    <mesh key={i} ref={(m) => void (puffs.current[i] = m)} material={mat} renderOrder={order + 0.2}>
      <planeGeometry args={[size, size]} />
    </mesh>
  ))
}

function Fires() {
  const [flameTex, glowTex] = useTextures([TEX.flame, TEX.glow])
  return FIRES.map((f, i) => <Fire key={i} fire={f} flameTex={flameTex} glowTex={glowTex} seed={i} />)
}

function Fire({ fire, flameTex, glowTex, seed }: { fire: (typeof FIRES)[number]; flameTex: Texture; glowTex: Texture; seed: number }) {
  const { pos, s, order } = useSpot(fire.layer, fire.x, fire.y)
  const flame = useRef<Group>(null)
  const glow = useRef<Mesh>(null)
  const glowSize = { flame: 130, glow: 110, torch: 46 }[fire.kind] * s
  const fw = (fire.kind === 'torch' ? 11 : 24) * s
  const fh = fw * (160 / 96)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 1.0 + seed * 10
    const flicker = 0.5 + 0.25 * Math.sin(t * 13) * Math.sin(t * 7.3 + 1) + 0.25 * Math.sin(t * 3.1)
    if (flame.current) flame.current.scale.set(1 + 0.06 * Math.sin(t * 9), 0.9 + 0.2 * flicker, 1)
    if (glow.current) (glow.current.material as MeshBasicMaterial).opacity = 0.35 + 0.3 * flicker
  })

  return (
    <>
      <mesh ref={glow} position={pos} renderOrder={order + 0.3}>
        <planeGeometry args={[glowSize, glowSize]} />
        <meshBasicMaterial map={glowTex} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      {fire.kind !== 'glow' && (
        <group ref={flame} position={[pos[0], pos[1] - fh * 0.15, pos[2]]}>
          <mesh position={[0, fh / 2, 0]} renderOrder={order + 0.35}>
            <planeGeometry args={[fw, fh]} />
            <meshBasicMaterial map={flameTex} transparent depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      )}
    </>
  )
}

/** A sentry pacing in front of the Armory. */
function Knight() {
  const [texture] = useTextures([TEX.knight])
  const { pos, s, order } = useSpot(KNIGHT.layer, KNIGHT.x, KNIGHT.y)
  const h = KNIGHT.height * s
  const w = (h * 460) / 860
  const ref = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.x = pos[0] + Math.sin(clock.elapsedTime * 0.22) * 16 * s
  })
  return (
    <mesh ref={ref} position={[pos[0], pos[1] + h / 2, pos[2]]} renderOrder={order + 0.4}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

/** The raven perched on the tower battlement, glancing about now and then. */
function Raven() {
  const [texture] = useTextures([TEX.raven])
  const { pos, s, order } = useSpot(RAVEN.layer, RAVEN.x, RAVEN.y)
  const h = RAVEN.height * s
  const ref = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.scale.x = Math.sin(clock.elapsedTime * 0.45) > -0.35 ? -1 : 1
  })
  return (
    <mesh ref={ref} position={[pos[0], pos[1] + h / 2, pos[2]]} renderOrder={order + 0.4}>
      <planeGeometry args={[h, h]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  )
}
