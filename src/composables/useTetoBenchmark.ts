import { computed, onBeforeUnmount, ref, shallowRef, type Ref } from 'vue'

import { processTetoGif } from '../lib/gif/processTetoGif'
import {
  runBinarySearchBenchmark,
  sampleAnimationFps,
  waitForMilliseconds,
  type BenchmarkProgress,
  type BenchmarkResult,
} from '../lib/perf/binarySearchBenchmark'
import {
  computeSafeMaxTetos,
  deriveTargetFps,
  estimateRefreshRate,
} from '../lib/perf/refreshRate'
import { TetoScene } from '../lib/three/TetoScene'

export function useTetoBenchmark(sceneHost: Ref<HTMLElement | null>) {
  const phase = ref('启动中')
  const detail = ref('正在准备 Teto 性能测试器...')
  const error = ref('')
  const liveFps = ref(0)
  const refreshRate = ref(60)
  const targetFps = ref(55)
  const currentCount = ref(0)
  const maxTetos = ref(6000)
  const benchmarkProgress = ref<BenchmarkProgress | null>(null)
  const result = ref<BenchmarkResult | null>(null)
  const isBenchmarking = ref(false)
  const scene = shallowRef<TetoScene | null>(null)

  let runToken = 0

  const metric = computed(() => {
    if (result.value) {
      return result.value.tetosPerFps
    }

    return currentCount.value / Math.max(liveFps.value, 1)
  })

  async function waitUntilVisible(): Promise<void> {
    if (!document.hidden) {
      return
    }

    phase.value = '等待继续'
    detail.value = '页面处于后台时会暂停压测，请切回当前标签页。'

    await new Promise<void>((resolve) => {
      const resume = () => {
        if (!document.hidden) {
          document.removeEventListener('visibilitychange', resume)
          resolve()
        }
      }

      document.addEventListener('visibilitychange', resume)
    })
  }

  function syncVisibility(): void {
    scene.value?.setPaused(document.hidden)
  }

  async function rerunBenchmark(): Promise<void> {
    if (!scene.value) {
      return
    }

    runToken += 1
    const activeToken = runToken
    error.value = ''
    result.value = null
    benchmarkProgress.value = null
    isBenchmarking.value = true
    phase.value = '二分搜索'
    detail.value = '正在寻找接近屏幕刷新率时的最大稳定 Teto 数量。'

    await waitUntilVisible()

    try {
      const benchmarkResult = await runBinarySearchBenchmark(
        {
          targetFps: targetFps.value,
          maxTetos: maxTetos.value,
          sampleWindowMs: 1600,
          warmupMs: 700,
          settleFrames: 16,
          passRatio: 0.975,
        },
        async (count, config) => {
          if (activeToken !== runToken) {
            return 0
          }

          currentCount.value = count
          scene.value?.setCount(count)
          detail.value = `试探 ${count.toLocaleString()} 个 Tetos，预热后开始采样 FPS。`

          await waitForMilliseconds(config.warmupMs)

          if (activeToken !== runToken) {
            return 0
          }

          const averageFps = await sampleAnimationFps({
            durationMs: config.sampleWindowMs,
            settleFrames: config.settleFrames,
          })

          return averageFps
        },
        (progress) => {
          benchmarkProgress.value = progress
          detail.value = `当前区间 ${progress.low.toLocaleString()} - ${progress.high.toLocaleString()}，最新采样 ${progress.currentFps.toFixed(1)} FPS。`
        },
      )

      if (activeToken !== runToken) {
        return
      }

      result.value = benchmarkResult
      currentCount.value = benchmarkResult.tetoCount
      scene.value.setCount(benchmarkResult.tetoCount)
      phase.value = '最终渲染'
      detail.value = `稳定数量锁定为 ${benchmarkResult.tetoCount.toLocaleString()}，场景已切换到正式展示态。`
    } catch (benchmarkError) {
      error.value =
        benchmarkError instanceof Error ? benchmarkError.message : '压测过程中发生未知错误'
      phase.value = '压测失败'
      detail.value = '可以点击重新测试再试一次。'
    } finally {
      isBenchmarking.value = false
    }
  }

  async function initialize(): Promise<void> {
    if (!sceneHost.value) {
      throw new Error('缺少 Three.js 场景挂载点')
    }

    error.value = ''
    phase.value = '处理素材'
    detail.value = '正在解码 Teto.gif，并把纯白背景剔除为透明。'

    try {
      const [gif, detectedRefreshRate] = await Promise.all([
        processTetoGif({
          whiteThreshold: 244,
          feather: 20,
          colorVariance: 24,
        }),
        estimateRefreshRate(),
      ])

      refreshRate.value = detectedRefreshRate
      targetFps.value = deriveTargetFps(detectedRefreshRate)
      maxTetos.value = computeSafeMaxTetos(
        window.innerWidth,
        window.innerHeight,
        Math.min(window.devicePixelRatio, 1.75),
      )

      phase.value = '创建场景'
      detail.value = `检测到约 ${detectedRefreshRate}Hz 屏幕，目标 FPS 设为 ${targetFps.value}。`

      scene.value?.dispose()
      scene.value = new TetoScene(sceneHost.value, gif, {
        maxInstances: maxTetos.value,
        onFps: (fps) => {
          liveFps.value = fps
        },
      })
      scene.value.setPaused(document.hidden)
      scene.value.setCount(24)
      currentCount.value = 24

      await rerunBenchmark()
    } catch (initializationError) {
      error.value =
        initializationError instanceof Error
          ? initializationError.message
          : '初始化性能测试器时发生未知错误'
      phase.value = '初始化失败'
      detail.value = '请检查浏览器是否支持 WebGL，再重新打开页面。'
    }
  }

  document.addEventListener('visibilitychange', syncVisibility)

  onBeforeUnmount(() => {
    runToken += 1
    document.removeEventListener('visibilitychange', syncVisibility)
    scene.value?.dispose()
    scene.value = null
  })

  return {
    benchmarkProgress,
    currentCount,
    detail,
    error,
    initialize,
    isBenchmarking,
    liveFps,
    maxTetos,
    metric,
    phase,
    refreshRate,
    rerunBenchmark,
    result,
    targetFps,
  }
}

