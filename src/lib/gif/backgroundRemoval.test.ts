import { beforeAll, describe, expect, it } from 'vitest'

import { removeWhiteBackground } from './backgroundRemoval'

beforeAll(() => {
  class ImageDataPolyfill {
    readonly data: Uint8ClampedArray

    readonly width: number

    readonly height: number

    constructor(
      dataOrWidth: Uint8ClampedArray | number,
      widthOrHeight: number,
      maybeHeight?: number,
    ) {
      if (typeof dataOrWidth === 'number') {
        this.width = dataOrWidth
        this.height = widthOrHeight
        this.data = new Uint8ClampedArray(this.width * this.height * 4)
        return
      }

      this.data = dataOrWidth
      this.width = widthOrHeight
      this.height = maybeHeight ?? 1
    }
  }

  Object.defineProperty(globalThis, 'ImageData', {
    value: ImageDataPolyfill,
    configurable: true,
  })
})

function createImageData(pixels: number[]): ImageData {
  return new ImageData(new Uint8ClampedArray(pixels), 1, pixels.length / 4)
}

describe('removeWhiteBackground', () => {
  it('会把纯白背景剔除为透明', () => {
    const image = createImageData([255, 255, 255, 255])
    const result = removeWhiteBackground(image)

    expect(result.data[3]).toBe(0)
  })

  it('会保留明显不是白底的角色像素', () => {
    const image = createImageData([240, 30, 110, 255])
    const result = removeWhiteBackground(image)

    expect(result.data[3]).toBe(255)
  })

  it('会对接近纯白的边缘做软化透明处理', () => {
    const image = createImageData([248, 247, 249, 255])
    const result = removeWhiteBackground(image, {
      whiteThreshold: 244,
      feather: 18,
    })

    expect(result.data[3]).toBeGreaterThan(0)
    expect(result.data[3]).toBeLessThan(255)
  })
})
