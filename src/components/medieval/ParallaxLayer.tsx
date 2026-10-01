import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture, LinearFilter, SRGBColorSpace, type Material, type Mesh, type Texture } from 'three'
import { artworkFor, planeSize, type LayerDef, type Placeholder } from './layers'
import { useAspect, useTextures, useWaveMaterial } from './sceneKit'

type Props = { layer: LayerDef; order: number }

export function ParallaxLayer({ layer, order }: Props) {
  const url = artworkFor(layer.dir)
  return url ? <ArtworkLayer url={url} layer={layer} order={order} /> : <PlaceholderLayer layer={layer} order={order} />
}

function ArtworkLayer({ url, layer, order }: { url: string; layer: LayerDef; order: number }) {
  const [texture] = useTextures([url])
  // Layers are shown near 1:1, so mipmaps would only cost ~33% extra GPU memory.
  texture.generateMipmaps = false
  texture.minFilter = LinearFilter
  return <LayerPlane texture={texture} layer={layer} order={order} />
}

function PlaceholderLayer({ layer, order }: Props) {
  const texture = useMemo(() => placeholderTexture(layer.id, layer.placeholder), [layer])
  useEffect(() => () => texture.dispose(), [texture])
  return <LayerPlane texture={texture} layer={layer} order={order} />
}

// Within this many world units of the camera a layer dissolves, so flying into the painting passes
// through the foreground like a veil instead of filling the screen with a blurred trunk.
const FADE_NEAR = 1.2
const FADE_SPAN = 2.4

function useNearFade(z: number) {
  const ref = useRef<Mesh>(null)
  useFrame(({ camera }) => {
    const m = ref.current
    if (!m) return
    const o = Math.min(1, Math.max(0, (camera.position.z - z - FADE_NEAR) / FADE_SPAN))
    ;(m.material as Material).opacity = o
    m.visible = o > 0.01
  })
  return ref
}

function LayerPlane({ texture, layer, order }: { texture: Texture; layer: LayerDef; order: number }) {
  const [w, h] = planeSize(layer.z, useAspect())
  const ref = useNearFade(layer.z)
  return layer.sway ? (
    <SwayingPlane texture={texture} z={layer.z} order={order} size={[w, h]} amp={layer.sway} />
  ) : (
    <mesh ref={ref} position={[0, 0, layer.z]} renderOrder={order}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

function SwayingPlane({ texture, z, order, size, amp }: { texture: Texture; z: number; order: number; size: [number, number]; amp: number }) {
  const { material, uniforms } = useWaveMaterial(texture, 'foliage', amp, size)
  useEffect(() => () => material.dispose(), [material])
  const ref = useNearFade(z)
  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime
  })
  return (
    <mesh ref={ref} position={[0, 0, z]} renderOrder={order} material={material}>
      <planeGeometry args={[size[0], size[1], 6, 16]} />
    </mesh>
  )
}

/** Flat, clearly-labelled stand-in so parallax can be tested before real art exists. */
function placeholderTexture(id: string, p: Placeholder): CanvasTexture {
  const W = 1024
  const H = 576
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')!
  g.fillStyle = p.color

  let labelY = 32
  if (p.shape === 'fill') {
    g.fillRect(0, 0, W, H)
  } else if (p.shape === 'ridge') {
    g.beginPath()
    g.moveTo(0, H)
    for (let x = 0; x <= W; x += 8) g.lineTo(x, H * (p.top - p.amp * Math.sin((x / W) * Math.PI * p.freq)))
    g.lineTo(W, H)
    g.fill()
    labelY = H * (p.top + p.amp) + 28
  } else {
    const y = H * p.top
    g.fillRect(W * 0.43, y + H * 0.1, W * 0.14, H * 0.22) // keep wall
    g.fillRect(W * 0.405, y + H * 0.04, W * 0.035, H * 0.28) // left tower
    g.fillRect(W * 0.56, y + H * 0.04, W * 0.035, H * 0.28) // right tower
    g.fillRect(W * 0.48, y, W * 0.04, H * 0.12) // central spire
    labelY = y + H * 0.36
  }

  g.fillStyle = 'rgba(43, 29, 20, 0.6)'
  g.font = 'italic 16px Georgia, serif'
  g.fillText(`${id} — placeholder`, 16, labelY)

  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  return tex
}
