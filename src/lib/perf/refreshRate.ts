const COMMON_REFRESH_RATES = [30, 48, 50, 60, 72, 75, 90, 100, 120, 144, 165, 240]

function normalizeRefreshRate(rawRefreshRate: number): number {
  const nearest = COMMON_REFRESH_RATES.reduce((best, current) => {
    const currentDelta = Math.abs(current - rawRefreshRate)
    const bestDelta = Math.abs(best - rawRefreshRate)
    return currentDelta < bestDelta ? current : best
  }, COMMON_REFRESH_RATES[0])

  return Math.abs(nearest - rawRefreshRate) <= 4 ? nearest : Math.round(rawRefreshRate)
}

export function deriveTargetFps(refreshRate: number): number {
  return Math.min(refreshRate, Math.max(30, Math.round(refreshRate * 0.92)))
}

export function computeSafeMaxTetos(
  viewportWidth: number,
  viewportHeight: number,
  devicePixelRatio: number,
): number {
  const viewportArea = viewportWidth * viewportHeight
  const areaFactor = clamp(viewportArea / (1920 * 1080), 0.68, 1.22)
  const dprFactor = clamp(1.18 - (devicePixelRatio - 1) * 0.25, 0.65, 1.1)
  return Math.round(clamp(109800 * areaFactor * dprFactor, 3200, 93600))
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export async function estimateRefreshRate(sampleFrames = 80): Promise<number> {
  if (typeof window === 'undefined' || sampleFrames < 2) {
    return 60
  }

  const timestamps: number[] = []

  await new Promise<void>((resolve) => {
    const collect = (timestamp: number) => {
      timestamps.push(timestamp)

      if (timestamps.length >= sampleFrames) {
        resolve()
        return
      }

      window.requestAnimationFrame(collect)
    }

    window.requestAnimationFrame(collect)
  })

  const frameDurations = timestamps
    .slice(1)
    .map((timestamp, index) => timestamp - timestamps[index])
    .filter((delta) => Number.isFinite(delta) && delta > 0)
    .sort((left, right) => left - right)

  if (frameDurations.length === 0) {
    return 60
  }

  const median = frameDurations[Math.floor(frameDurations.length / 2)]
  return normalizeRefreshRate(1000 / median)
}

