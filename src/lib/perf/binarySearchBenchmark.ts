export type BenchmarkConfig = {
  targetFps: number
  maxTetos: number
  sampleWindowMs: number
  warmupMs: number
  settleFrames: number
  passRatio?: number
}

export type BenchmarkResult = {
  tetoCount: number
  averageFps: number
  tetosPerFps: number
}

export type BenchmarkProgress = {
  low: number
  high: number
  current: number
  currentFps: number
  bestCount: number
  bestFps: number
}

export type BenchmarkEvaluator = (count: number, config: BenchmarkConfig) => Promise<number>

export type FrameSampleOptions = {
  durationMs: number
  settleFrames?: number
}

export async function waitForMilliseconds(durationMs: number): Promise<void> {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, durationMs)
  })
}

export async function sampleAnimationFps(
  options: FrameSampleOptions,
): Promise<number> {
  const settleFrames = options.settleFrames ?? 0

  return new Promise<number>((resolve) => {
    let lastTimestamp = 0
    let elapsed = 0
    let frameCount = 0
    let skipped = 0

    const tick = (timestamp: number) => {
      if (lastTimestamp !== 0) {
        const delta = timestamp - lastTimestamp

        if (skipped < settleFrames) {
          skipped += 1
        } else {
          elapsed += delta
          frameCount += 1
        }
      }

      lastTimestamp = timestamp

      if (elapsed >= options.durationMs) {
        resolve(frameCount > 0 ? (frameCount * 1000) / elapsed : 0)
        return
      }

      window.requestAnimationFrame(tick)
    }

    window.requestAnimationFrame(tick)
  })
}

export async function runBinarySearchBenchmark(
  config: BenchmarkConfig,
  evaluator: BenchmarkEvaluator,
  onProgress?: (progress: BenchmarkProgress) => void,
): Promise<BenchmarkResult> {
  let low = 1
  let high = Math.max(1, config.maxTetos)
  let bestCount = 1
  let bestFps = 0
  const passRatio = config.passRatio ?? 0.97

  while (low <= high) {
    const current = Math.floor((low + high) / 2)
    const currentFps = await evaluator(current, config)

    if (currentFps >= config.targetFps * passRatio) {
      bestCount = current
      bestFps = currentFps
      low = current + 1
    } else {
      high = current - 1
    }

    onProgress?.({
      low,
      high,
      current,
      currentFps,
      bestCount,
      bestFps,
    })
  }

  return {
    tetoCount: bestCount,
    averageFps: bestFps,
    tetosPerFps: bestCount / Math.max(bestFps, 1),
  }
}
