import {
  Color,
  DoubleSide,
  DynamicDrawUsage,
  InstancedMesh,
  MathUtils,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  WebGLRenderer,
  type Material,
} from 'three'

import type { ProcessedGif } from '../gif/processTetoGif'

type TetoSceneOptions = {
  maxInstances: number
  pixelRatio?: number
  onFps?: (fps: number) => void
}

export class TetoScene {
  private readonly container: HTMLElement

  private readonly processedGif: ProcessedGif

  private readonly maxInstances: number

  private readonly onFps?: (fps: number) => void

  private readonly renderer: WebGLRenderer

  private readonly scene: Scene

  private readonly camera: PerspectiveCamera

  private readonly dummy = new Object3D()

  private readonly geometry: PlaneGeometry

  private readonly material: MeshBasicMaterial

  private readonly mesh: InstancedMesh

  private readonly resizeObserver: ResizeObserver

  private readonly positionsX: Float32Array

  private readonly positionsY: Float32Array

  private readonly positionsZ: Float32Array

  private readonly scales: Float32Array

  private readonly speeds: Float32Array

  private readonly spins: Float32Array

  private readonly tilts: Float32Array

  private readonly swayAmplitudes: Float32Array

  private readonly swayFrequencies: Float32Array

  private readonly swayPhases: Float32Array

  private animationFrameId = 0

  private lastTimestamp = 0

  private frameTextureIndex = 0

  private frameElapsedMs = 0

  private currentFps = 0

  private paused = false

  private visibleCount = 1

  constructor(
    container: HTMLElement,
    processedGif: ProcessedGif,
    options: TetoSceneOptions,
  ) {
    this.container = container
    this.processedGif = processedGif
    this.maxInstances = options.maxInstances
    this.onFps = options.onFps

    this.renderer = new WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(Math.min(options.pixelRatio ?? window.devicePixelRatio, 1.75))
    this.renderer.setClearAlpha(0)

    this.scene = new Scene()
    this.scene.background = null
    this.scene.fog = null

    this.camera = new PerspectiveCamera(42, 1, 0.1, 100)
    this.camera.position.set(0, 0.75, 19)
    this.camera.lookAt(0, 0.5, 0)

    const aspect = processedGif.width / processedGif.height
    this.geometry = new PlaneGeometry(aspect * 1.4, 1.4)
    this.material = new MeshBasicMaterial({
      map: processedGif.frames[0]?.texture ?? null,
      transparent: true,
      alphaTest: 0.02,
      opacity: 0.98,
      side: DoubleSide,
      depthWrite: false,
      color: new Color('#ffe7f6'),
    })

    this.mesh = new InstancedMesh(this.geometry, this.material, this.maxInstances)
    this.mesh.count = this.visibleCount
    this.mesh.instanceMatrix.setUsage(DynamicDrawUsage)
    this.scene.add(this.mesh)

    this.positionsX = new Float32Array(this.maxInstances)
    this.positionsY = new Float32Array(this.maxInstances)
    this.positionsZ = new Float32Array(this.maxInstances)
    this.scales = new Float32Array(this.maxInstances)
    this.speeds = new Float32Array(this.maxInstances)
    this.spins = new Float32Array(this.maxInstances)
    this.tilts = new Float32Array(this.maxInstances)
    this.swayAmplitudes = new Float32Array(this.maxInstances)
    this.swayFrequencies = new Float32Array(this.maxInstances)
    this.swayPhases = new Float32Array(this.maxInstances)

    for (let index = 0; index < this.maxInstances; index += 1) {
      this.respawn(index, true)
    }

    this.container.appendChild(this.renderer.domElement)
    this.resizeObserver = new ResizeObserver(() => {
      this.resize()
    })
    this.resizeObserver.observe(this.container)
    this.resize()
    this.render(0)
  }

  setCount(count: number): void {
    this.visibleCount = Math.max(1, Math.min(this.maxInstances, Math.round(count)))
    this.mesh.count = this.visibleCount
  }

  getCurrentFps(): number {
    return this.currentFps
  }

  setPaused(paused: boolean): void {
    this.paused = paused
    if (!paused) {
      this.lastTimestamp = 0
    }
  }

  dispose(): void {
    window.cancelAnimationFrame(this.animationFrameId)
    this.resizeObserver.disconnect()
    this.geometry.dispose()
    this.disposeMaterial(this.material)

    for (const frame of this.processedGif.frames) {
      frame.texture.dispose()
    }

    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  private disposeMaterial(material: Material): void {
    material.dispose()
  }

  private resize(): void {
    const width = Math.max(1, this.container.clientWidth)
    const height = Math.max(1, this.container.clientHeight)

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height, false)
  }

  private respawn(index: number, distribute: boolean): void {
    this.positionsX[index] = MathUtils.randFloatSpread(26)
    this.positionsZ[index] = MathUtils.randFloatSpread(18)
    this.positionsY[index] = distribute
      ? MathUtils.randFloatSpread(28)
      : MathUtils.randFloat(15, 26)
    this.scales[index] = MathUtils.randFloat(0.42, 0.95)
    this.speeds[index] = MathUtils.randFloat(1.6, 4.8)
    this.spins[index] = MathUtils.randFloatSpread(1.6)
    this.tilts[index] = MathUtils.randFloatSpread(0.6)
    this.swayAmplitudes[index] = MathUtils.randFloat(0.08, 0.9)
    this.swayFrequencies[index] = MathUtils.randFloat(0.5, 1.7)
    this.swayPhases[index] = MathUtils.randFloat(0, Math.PI * 2)
  }

  private updateFrameTexture(deltaMs: number): void {
    if (this.processedGif.frames.length <= 1) {
      return
    }

    this.frameElapsedMs += deltaMs

    while (
      this.frameElapsedMs >= this.processedGif.frames[this.frameTextureIndex].delayMs
    ) {
      this.frameElapsedMs -= this.processedGif.frames[this.frameTextureIndex].delayMs
      this.frameTextureIndex =
        (this.frameTextureIndex + 1) % this.processedGif.frames.length
      this.material.map = this.processedGif.frames[this.frameTextureIndex].texture
    }
  }

  private updateInstances(deltaSeconds: number, elapsedSeconds: number): void {
    for (let index = 0; index < this.visibleCount; index += 1) {
      this.positionsY[index] -= this.speeds[index] * deltaSeconds

      if (this.positionsY[index] < -18) {
        this.respawn(index, false)
      }

      const sway = Math.sin(
        elapsedSeconds * this.swayFrequencies[index] + this.swayPhases[index],
      )
      const drift = Math.cos(
        elapsedSeconds * (this.swayFrequencies[index] * 0.45) + this.swayPhases[index],
      )

      this.dummy.position.set(
        this.positionsX[index] + sway * this.swayAmplitudes[index],
        this.positionsY[index],
        this.positionsZ[index] + drift * 0.7,
      )
      this.dummy.rotation.set(
        this.tilts[index] + sway * 0.35,
        elapsedSeconds * this.spins[index],
        sway * 0.55,
      )

      const perspectiveBoost = MathUtils.mapLinear(
        this.positionsZ[index],
        -9,
        9,
        0.82,
        1.18,
      )
      const scale = this.scales[index] * perspectiveBoost
      this.dummy.scale.setScalar(scale)
      this.dummy.updateMatrix()
      this.mesh.setMatrixAt(index, this.dummy.matrix)
    }

    this.mesh.instanceMatrix.needsUpdate = true
  }

  private render = (timestamp: number): void => {
    this.animationFrameId = window.requestAnimationFrame(this.render)

    if (this.paused) {
      return
    }

    if (this.lastTimestamp === 0) {
      this.lastTimestamp = timestamp
      return
    }

    const deltaMs = Math.min(timestamp - this.lastTimestamp, 50)
    const deltaSeconds = deltaMs / 1000
    this.lastTimestamp = timestamp

    const instantFps = 1000 / Math.max(deltaMs, 1)
    this.currentFps = this.currentFps === 0
      ? instantFps
      : MathUtils.lerp(this.currentFps, instantFps, 0.08)

    this.onFps?.(this.currentFps)
    this.updateFrameTexture(deltaMs)
    this.updateInstances(deltaSeconds, timestamp / 1000)

    this.camera.position.x = Math.sin(timestamp * 0.00012) * 0.65
    this.camera.position.y = 0.75 + Math.cos(timestamp * 0.00017) * 0.18
    this.camera.lookAt(0, 0.5, 0)

    this.renderer.render(this.scene, this.camera)
  }
}

