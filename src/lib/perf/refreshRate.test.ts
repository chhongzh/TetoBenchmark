import { describe, expect, it } from 'vitest'

import { computeSafeMaxTetos, deriveTargetFps } from './refreshRate'

describe('refreshRate helpers', () => {
  it('会把目标 FPS 限制在刷新率以内并保留安全余量', () => {
    expect(deriveTargetFps(60)).toBe(55)
    expect(deriveTargetFps(144)).toBe(132)
  })

  it('会根据分辨率和像素比给出受控的安全上限', () => {
    const standard = computeSafeMaxTetos(1920, 1080, 1)
    const highResolution = computeSafeMaxTetos(3840, 2160, 2)
    const smallScreen = computeSafeMaxTetos(800, 600, 2)
    const standardHighDpr = computeSafeMaxTetos(1920, 1080, 2)

    expect(standard).toBeGreaterThan(8000)
    expect(highResolution).toBeGreaterThanOrEqual(standard)
    expect(standardHighDpr).toBeLessThanOrEqual(standard)
    expect(smallScreen).toBeGreaterThanOrEqual(3200)
  })
})
