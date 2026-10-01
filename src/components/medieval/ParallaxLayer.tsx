import { useMemo } from 'react'
import { useLoader, useThree } from '@react-three/fiber'
import { CanvasTexture, MathUtils, SRGBColorSpace, Texture, TextureLoader } from 'three'
import { BASE_Z, FOV, MAX_OFFSET, artworkFor, type LayerDef, type Placeholder } from './layers'

type Props = { layer: LayerDef; order: number }

export function ParallaxLayer({ layer, order }: Props) {
  const url = artworkFor(layer.dir)
  return url ? <ArtworkLayer url={url} z={layer.z} order={order} /> : <PlaceholderLayer layer={layer} order={order} />
}

function ArtworkLayer({ url, z, order }: { url: string; z: number; order: number }) {
  const texture = useLoader(TextureLoader, url)
  texture.colorSpace = SRGBColorSpace
  return <LayerPlane texture={texture} z={z} order={order} />
}

function PlaceholderLayer({ layer, order }: Props) {
  const texture = useMemo(() => placeholderTexture(layer.id, layer.placeholder), [layer])
  return <LayerPlane texture={texture} z={layer.z} order={order} />
}

/** Sizes the plane to cover the viewport at its depth, plus room for camera drift. */
function LayerPlane({ texture, z, order }: { texture: Texture; z: number; order: number }) {
  const size = useThree((s) => s.size)
  const distance = BASE_Z - z
  const visH = 2 * distance * Math.tan(MathUtils.degToRad(FOV / 2))
  const visW = (visH * size.width) / size.height
  const { width: iw, height: ih } = texture.image as { width: number; height: number }
  const aspect = iw / ih
  const h = Math.max(visH + MAX_OFFSET.y * 2.2, (visW + MAX_OFFSET.x * 2.2) / aspect)

  return (
    <mesh position={[0, 0, z]} renderOrder={order}>
      <planeGeometry args={[h * aspect, h]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
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
