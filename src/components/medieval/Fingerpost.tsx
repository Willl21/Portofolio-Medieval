import { use, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { CanvasTexture, MathUtils, SRGBColorSpace, type Group, type MeshBasicMaterial } from 'three'
import armArt from '../../assets/medieval/ornaments/signs/arm.webp'
import postArt from '../../assets/medieval/ornaments/signs/post.webp'
import { MAX_OFFSET, TAN, frameScale, frameToWorld, layerIndex, layerZ } from './layers'
import { OVERVIEW_POSE, PLACES, signals, type PlaceId } from './places'
import { useAspect, useTextures } from './sceneKit'
import { href } from '../../router'

// Art sizes from scripts/art/sprites.mjs → fingerpost(): post, arm, and the parchment label on the arm.
const POST = { w: 90, h: 480 }
const ARM = { w: 340, h: 92, text: [26, 16, 272, 76] }

// Where it stands: on the meadow to the right of the road, in frame px of the ground layer.
const FOOT = { x: 1700, y: 1306 }
const POST_W = 60 // frame px
const ARM_W = 284 // frame px
// Top to bottom; each arm points the way you would walk to get there.
type ArmSpec = { id: PlaceId; dir: 1 | -1; y: number }
const ARMS: ArmSpec[] = [
  { id: 'contact', dir: 1, y: 1004 },
  { id: 'about', dir: -1, y: 1066 },
  { id: 'experience', dir: 1, y: 1128 },
  { id: 'projects', dir: -1, y: 1190 },
  { id: 'skills', dir: -1, y: 1252 },
]
// Portrait: little room under the castle, so the arms pair up left/right in three rows.
const ARMS_NARROW: ArmSpec[] = [
  { id: 'contact', dir: 1, y: 1120 },
  { id: 'about', dir: -1, y: 1120 },
  { id: 'experience', dir: 1, y: 1190 },
  { id: 'projects', dir: -1, y: 1190 },
  { id: 'skills', dir: -1, y: 1260 },
]

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image()
    img.onload = () => res(img)
    img.onerror = rej
    img.src = src
  })

// Letter the arms only once the manuscript faces have loaded, or the canvas bakes a fallback font.
const ready = Promise.all([loadImage(armArt), document.fonts.load('700 60px "Grenze Gotisch"'), document.fonts.load('italic 500 40px "EB Garamond"')]).then(([img]) => img)

/** Paint one arm (mirrored for left-pointing arms) and letter it the right way round. */
function letterArm(img: HTMLImageElement, name: string, label: string, dir: 1 | -1) {
  const k = 3
  const c = document.createElement('canvas')
  c.width = ARM.w * k
  c.height = ARM.h * k
  const g = c.getContext('2d')!
  g.scale(k, k)
  g.save()
  if (dir < 0) {
    g.translate(ARM.w, 0)
    g.scale(-1, 1)
  }
  g.drawImage(img, 0, 0, ARM.w, ARM.h)
  g.restore()
  let [x0, , x1] = ARM.text
  const [, y0, , y1] = ARM.text
  if (dir < 0) [x0, x1] = [ARM.w - x1, ARM.w - x0]
  const cx = (x0 + x1) / 2
  g.textAlign = 'center'
  let size = 31
  g.font = `700 ${size}px "Grenze Gotisch"`
  while (g.measureText(name).width > x1 - x0 - 16 && size > 20) g.font = `700 ${(size -= 1)}px "Grenze Gotisch"`
  const w = g.measureText(name).width
  g.fillStyle = '#3b2a1e'
  g.fillText(name, cx, y0 + (y1 - y0) * 0.5)
  g.textAlign = 'left'
  g.fillStyle = '#3c5b8e' // azure initial
  g.fillText(name[0], cx - w / 2, y0 + (y1 - y0) * 0.5)
  g.textAlign = 'center'
  g.font = 'italic 500 23px "EB Garamond"'
  g.fillStyle = '#8f2f22'
  g.fillText(label, cx, y0 + (y1 - y0) * 0.9)
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

/**
 * The fingerpost at the crossroads: the world's own signage. Each arm points toward its landmark;
 * hovering one leans the camera that way. Mouse/touch shortcut; the nav banner is the accessible route.
 */
export function Fingerpost({ visible }: { visible: boolean }) {
  const img = use(ready)
  const [postTex] = useTextures([postArt])
  const aspect = useAspect()
  const z = layerZ('ground') + 0.1
  // Portrait screens only see the middle of the painting: stand the post just right of the road,
  // a little larger so the lettering stays legible.
  const narrow = aspect < 1
  const k = narrow ? 1.15 : 1
  const s = frameScale(z, aspect) * k
  const footX = narrow ? 1330 : FOOT.x
  const [fx, fy] = frameToWorld(footX, FOOT.y, z, aspect)
  const armY = (y: number) => fy + (FOOT.y - y) * s // world y of an arm, scaled about the foot
  const postW = POST_W * s
  const postH = (postW * POST.h) / POST.w
  const group = useRef<Group>(null)
  const postMat = useRef<MeshBasicMaterial>(null)
  const order = layerIndex('ground') + 0.7

  // The foot of the painting is cropped more on short or very wide screens. Find where the bottom
  // of the screen lands on this plane at the overview pose, with the mouse lifting the view as high
  // as it can go, and raise the whole post until its lowest arm clears it (plus the page border).
  const halfH = TAN * (OVERVIEW_POSE[2] - z)
  const screenBottom = OVERVIEW_POSE[1] + MAX_OFFSET.y * 1.1 + 0.03 - halfH
  const armH = (ARM_W * s * ARM.h) / ARM.w
  const arms = narrow ? ARMS_NARROW : ARMS
  const lowest = armY(arms.at(-1)!.y) - armH / 2
  // on phones the tab bar covers the foot of the screen as well
  const lift = Math.max(0, screenBottom + halfH * (narrow ? 0.26 : 0.05) - lowest)

  useFrame((_, delta) => {
    const m = postMat.current
    if (!m || !group.current) return
    m.opacity = MathUtils.damp(m.opacity, visible ? 1 : 0, 5, delta)
    group.current.visible = m.opacity > 0.01
  })

  return (
    <group ref={group} position={[0, lift, 0]}>
      <mesh position={[fx, fy + postH / 2, z]} renderOrder={order}>
        <planeGeometry args={[postW, postH]} />
        <meshBasicMaterial ref={postMat} map={postTex} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      {arms.map((arm, i) => {
        return <Arm key={arm.id} {...arm} img={img} pivot={[fx, armY(arm.y), z + 0.01]} width={ARM_W * s} visible={visible} order={order + 0.01 * (arms.length - i)} postMat={postMat} />
      })}
    </group>
  )
}

type ArmProps = {
  id: PlaceId
  dir: 1 | -1
  img: HTMLImageElement
  pivot: [number, number, number]
  width: number
  visible: boolean
  order: number
  postMat: React.RefObject<MeshBasicMaterial | null>
}

function Arm({ id, dir, img, pivot, width, visible, order, postMat }: ArmProps) {
  const p = PLACES[id]
  const texture = useMemo(() => letterArm(img, p.name, p.label, dir), [img, p.name, p.label, dir])
  useEffect(() => () => texture.dispose(), [texture])
  const h = (width * ARM.h) / ARM.w
  const tilt = (dir > 0 ? 0.03 : -0.025) * (id === 'skills' ? -1 : 1)
  const swing = useRef<Group>(null)
  const mat = useRef<MeshBasicMaterial>(null)
  const [hover, setHover] = useState(false)
  const gl = useThree((st) => st.gl)

  useFrame(({ clock }, delta) => {
    const g = swing.current
    const m = mat.current
    if (!g || !m) return
    m.opacity = postMat.current?.opacity ?? 0
    const lit = hover || signals.preview === id
    // boards creak a little in the wind; the one you touch swings toward its destination
    g.rotation.z = MathUtils.damp(g.rotation.z, tilt + (lit ? dir * 0.05 : 0) + Math.sin(clock.elapsedTime * 0.8 + pivot[1] * 3) * 0.004, 8, delta)
    g.scale.setScalar(MathUtils.damp(g.scale.x, lit ? 1.04 : 1, 10, delta))
    m.color.setScalar(MathUtils.damp(m.color.r, lit ? 1.14 : 1, 8, delta))
  })

  const enter = (e: ThreeEvent<PointerEvent>) => {
    if (!visible) return
    e.stopPropagation()
    setHover(true)
    signals.preview = id
    gl.domElement.style.cursor = 'pointer'
  }
  const leave = () => {
    setHover(false)
    if (signals.preview === id) signals.preview = null
    gl.domElement.style.cursor = ''
  }
  useEffect(() => () => void (gl.domElement.style.cursor = ''), [gl])

  // pivot on the post; the arm extends to its side, overlapping the post a touch
  const cx = dir * (width / 2 - width * 0.03)
  return (
    <group ref={swing} position={pivot}>
      <mesh
        position={[cx, 0, 0]}
        renderOrder={order}
        onPointerOver={enter}
        onPointerOut={leave}
        onClick={(e) => {
          if (!visible) return
          e.stopPropagation()
          leave()
          location.hash = href(id)
        }}
      >
        <planeGeometry args={[width, h]} />
        <meshBasicMaterial ref={mat} map={texture} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}
