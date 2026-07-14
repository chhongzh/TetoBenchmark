<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

import MetricOverlay from './components/MetricOverlay.vue'
import StatusPanel from './components/StatusPanel.vue'
import { useTetoBenchmark } from './composables/useTetoBenchmark'

const sceneHost = ref<HTMLElement | null>(null)
const isUiVisible = ref(true)

function handleWindowKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Tab') {
    return
  }

  event.preventDefault()
  isUiVisible.value = !isUiVisible.value
}

const {
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
} = useTetoBenchmark(sceneHost)

onMounted(async () => {
  window.addEventListener('keydown', handleWindowKeydown)
  await initialize()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleWindowKeydown)
})
</script>

<template>
  <main class="app-shell">
    <div ref="sceneHost" class="scene-host" aria-label="Teto 3D 场景"></div>

    <div class="glow glow--left"></div>
    <div class="glow glow--right"></div>
    <div class="grid-overlay"></div>

    <div class="ui-hint" :class="{ 'ui-hint--hidden': !isUiVisible }">
      按 <kbd>Tab</kbd> {{ isUiVisible ? '隐藏' : '显示' }} UI
    </div>

    <StatusPanel v-if="isUiVisible" :phase="phase" :detail="detail" :error="error" :current-count="currentCount"
      :max-tetos="maxTetos" :progress="benchmarkProgress" :is-benchmarking="isBenchmarking" @rerun="rerunBenchmark" />

    <MetricOverlay v-if="isUiVisible" :current-count="currentCount" :live-fps="liveFps" :target-fps="targetFps"
      :refresh-rate="refreshRate" :metric="metric" :result-count="result?.tetoCount" />

    <footer v-if="isUiVisible" class="footer-note">
      <span>Made with love!</span>
      <span>结果仅共参考</span>
    </footer>
  </main>
</template>
