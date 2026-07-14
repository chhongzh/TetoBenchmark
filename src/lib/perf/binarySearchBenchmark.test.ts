import { describe, expect, it } from 'vitest'

import { runBinarySearchBenchmark } from './binarySearchBenchmark'

describe('runBinarySearchBenchmark', () => {
  it('会找到满足目标 FPS 的最大数量', async () => {
    const result = await runBinarySearchBenchmark(
      {
        targetFps: 60,
        maxTetos: 512,
        sampleWindowMs: 1000,
        warmupMs: 300,
        settleFrames: 4,
      },
      async (count) => {
        if (count <= 320) {
          return 60
        }

        return 48
      },
    )

    expect(result.tetoCount).toBe(320)
    expect(result.averageFps).toBe(60)
    expect(result.tetosPerFps).toBeCloseTo(320 / 60, 6)
  })
})

