import { useMemo } from 'react'
import { useLoader, useThree } from '@react-three/fiber'
import { MeshBasicMaterial, SRGBColorSpace, TextureLoader, type Texture } from 'three'

export function useTextures(urls: string[]): Texture[] {
  const textures = useLoader(TextureLoader, urls)
  for (const t of textures) t.colorSpace = SRGBColorSpace
  return textures
}

export const useAspect = () => useThree((s) => s.size.width / s.size.height)

// Vertex-shader wind, injected into MeshBasicMaterial so colour management stays three's job.
// Plane must be subdivided along the bending axis.
const WAVES = {
  // k: 0 at the pole → 1 at the tip
  flag: `float k = position.x / uSize.x + 0.5;
    transformed.y += sin(k * 6.5 - uTime * 4.2) * uAmp * k;
    transformed.x -= (1.0 - cos(k * 3.0 - uTime * 1.7)) * uAmp * 0.35 * k;`,
  // k: 0 at the roots → 1 at the crown; phase varies across x so the two trees don't move in lockstep
  foliage: `float k = position.y / uSize.y + 0.5;
    transformed.x += (sin(uTime * 0.55 + position.x * 0.35) + 0.4 * sin(uTime * 1.3)) * uAmp * k * k;`,
}

export function useWaveMaterial(map: Texture, kind: keyof typeof WAVES, amp: number, size: [number, number]) {
  return useMemo(() => {
    const uniforms = { uTime: { value: 0 }, uAmp: { value: amp }, uSize: { value: size } }
    const material = new MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false })
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms)
      shader.vertexShader =
        'uniform float uTime;\nuniform float uAmp;\nuniform vec2 uSize;\n' +
        shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n${WAVES[kind]}`)
    }
    material.customProgramCacheKey = () => kind
    return { material, uniforms }
  }, [map, kind, amp, size[0], size[1]])
}
