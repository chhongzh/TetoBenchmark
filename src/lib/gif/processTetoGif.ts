import { CanvasTexture, LinearFilter, SRGBColorSpace } from 'three'
import { decompressFrames, parseGIF, type ParsedFrame } from 'gifuct-js'

import {
  removeWhiteBackground,
  type WhiteRemovalOptions,
} from './backgroundRemoval'

export type GifFrameTexture = {
  canvas: HTMLCanvasElement
  texture: CanvasTexture
  delayMs: number
}

export type ProcessedGif = {
  frames: GifFrameTexture[]
  width: number
  height: number
  transparentThreshold: number
}

export type ProcessTetoGifOptions = WhiteRemovalOptions & {
  url?: string
}

function cloneImageData(source: ImageData): ImageData {
  return new ImageData(new Uint8ClampedArray(source.data), source.width, source.height)
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function applyFramePatch(target: ImageData, frame: ParsedFrame): void {
  const { width, height, left, top } = frame.dims

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceIndex = (y * width + x) * 4
      const targetX = left + x
      const targetY = top + y

      if (
        targetX < 0 ||
        targetY < 0 ||
        targetX >= target.width ||
        targetY >= target.height
      ) {
        continue
      }

      const targetIndex = (targetY * target.width + targetX) * 4
      const sourceAlpha = frame.patch[sourceIndex + 3]

      if (sourceAlpha === 0) {
        continue
      }

      target.data[targetIndex] = frame.patch[sourceIndex]
      target.data[targetIndex + 1] = frame.patch[sourceIndex + 1]
      target.data[targetIndex + 2] = frame.patch[sourceIndex + 2]
      target.data[targetIndex + 3] = sourceAlpha
    }
  }
}

function clearFrameArea(target: ImageData, frame: ParsedFrame): void {
  const { width, height, left, top } = frame.dims

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const targetX = left + x
      const targetY = top + y

      if (
        targetX < 0 ||
        targetY < 0 ||
        targetX >= target.width ||
        targetY >= target.height
      ) {
        continue
      }

      const targetIndex = (targetY * target.width + targetX) * 4
      target.data[targetIndex] = 0
      target.data[targetIndex + 1] = 0
      target.data[targetIndex + 2] = 0
      target.data[targetIndex + 3] = 0
    }
  }
}

function createFrameTexture(imageData: ImageData, delayMs: number): GifFrameTexture {
  const canvas = createCanvas(imageData.width, imageData.height)
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('无法创建 GIF 帧画布上下文')
  }

  context.putImageData(imageData, 0, 0)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.needsUpdate = true

  return {
    canvas,
    texture,
    delayMs,
  }
}

export async function processTetoGif(
  options: ProcessTetoGifOptions = {},
): Promise<ProcessedGif> {
  const whiteThreshold = options.whiteThreshold ?? 245
  const response = await fetch(options.url ?? '/Teto.gif')

  if (!response.ok) {
    throw new Error(`GIF 素材加载失败: ${response.status}`)
  }

  const parsed = parseGIF(await response.arrayBuffer())
  const frames = decompressFrames(parsed, true)

  if (frames.length === 0) {
    throw new Error('GIF 未包含可用帧')
  }

  const width = parsed.lsd.width
  const height = parsed.lsd.height
  let composite = new ImageData(width, height)

  const processedFrames = frames.map((frame) => {
    const previous = frame.disposalType === 3 ? cloneImageData(composite) : null

    applyFramePatch(composite, frame)
    const transparentFrame = removeWhiteBackground(composite, options)
    const frameTexture = createFrameTexture(transparentFrame, frame.delay ?? 100)

    if (frame.disposalType === 2) {
      clearFrameArea(composite, frame)
    } else if (frame.disposalType === 3 && previous) {
      composite = previous
    }

    return frameTexture
  })

  return {
    frames: processedFrames,
    width,
    height,
    transparentThreshold: whiteThreshold,
  }
}
