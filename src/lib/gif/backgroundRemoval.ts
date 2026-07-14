const DEFAULT_WHITE_THRESHOLD = 245
const DEFAULT_FEATHER = 18
const DEFAULT_COLOR_VARIANCE = 20

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export type WhiteRemovalOptions = {
  whiteThreshold?: number
  feather?: number
  colorVariance?: number
}

export function removeWhiteBackground(
  source: ImageData,
  options: WhiteRemovalOptions = {},
): ImageData {
  const whiteThreshold = options.whiteThreshold ?? DEFAULT_WHITE_THRESHOLD
  const feather = options.feather ?? DEFAULT_FEATHER
  const colorVariance = options.colorVariance ?? DEFAULT_COLOR_VARIANCE
  const output = new ImageData(source.width, source.height)

  for (let index = 0; index < source.data.length; index += 4) {
    const red = source.data[index]
    const green = source.data[index + 1]
    const blue = source.data[index + 2]
    const alpha = source.data[index + 3]
    const minChannel = Math.min(red, green, blue)
    const maxChannel = Math.max(red, green, blue)
    const distanceToWhite = 255 - minChannel
    const isNearNeutral = maxChannel - minChannel <= colorVariance

    output.data[index] = red
    output.data[index + 1] = green
    output.data[index + 2] = blue

    if (!isNearNeutral || minChannel < whiteThreshold) {
      output.data[index + 3] = alpha
      continue
    }

    const fadeRatio = clamp(distanceToWhite / Math.max(feather, 1), 0, 1)
    output.data[index + 3] = Math.round(alpha * fadeRatio)
  }

  return output
}

