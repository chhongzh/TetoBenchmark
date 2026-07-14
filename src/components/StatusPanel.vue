<script setup lang="ts">
import type { BenchmarkProgress } from '../lib/perf/binarySearchBenchmark'

defineProps<{
  phase: string
  detail: string
  error: string
  currentCount: number
  maxTetos: number
  progress: BenchmarkProgress | null
  isBenchmarking: boolean
}>()

defineEmits<{
  rerun: []
}>()
</script>

<template>
  <section class="status-panel">
    <p class="status-eyebrow">Teto Benchmark</p>
    <h1 class="status-title">TetoBenchmark</h1>
    <p class="status-phase">{{ phase }}</p>
    <p class="status-detail">{{ detail }}</p>

    <div class="status-grid">
      <article class="status-tile">
        <span class="status-label">当前数量</span>
        <strong>{{ currentCount.toLocaleString() }}</strong>
      </article>

      <article class="status-tile">
        <span class="status-label">安全上限</span>
        <strong>{{ maxTetos.toLocaleString() }}</strong>
      </article>
    </div>

    <div v-if="progress" class="progress-box">
      <span>搜索区间 {{ progress.low.toLocaleString() }} - {{ progress.high.toLocaleString() }}</span>
      <span>最近试探 {{ progress.current.toLocaleString() }} / {{ progress.currentFps.toFixed(1) }} FPS</span>
    </div>

    <p v-if="error" class="status-error">{{ error }}</p>

    <button class="rerun-button" type="button" :disabled="isBenchmarking" @click="$emit('rerun')">
      {{ isBenchmarking ? '压测中...' : '重新测试' }}
    </button>
  </section>
</template>

<style scoped>
.status-panel {
  position: absolute;
  top: 24px;
  left: 24px;
  z-index: 4;
  width: min(430px, calc(100vw - 32px));
  padding: 24px;
  border: 1px solid rgba(112, 247, 255, 0.26);
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(9, 16, 34, 0.9), rgba(8, 9, 18, 0.72)),
    rgba(8, 9, 18, 0.78);
  box-shadow:
    0 28px 64px rgba(0, 0, 0, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(24px);
}

.status-eyebrow {
  margin: 0;
  color: rgba(112, 247, 255, 0.88);
  font-size: 11px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.status-title {
  margin: 10px 0 8px;
  color: #fff6fb;
  font-size: clamp(2rem, 4vw, 3.3rem);
  line-height: 0.95;
}

.status-phase {
  margin: 0;
  color: #ff8aca;
  font-size: 15px;
  font-weight: 700;
}

.status-detail {
  margin: 10px 0 0;
  color: rgba(231, 237, 255, 0.8);
  font-size: 14px;
  line-height: 1.55;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.status-tile {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
}

.status-tile strong {
  color: #ffffff;
  font-size: 1.35rem;
}

.status-label {
  color: rgba(231, 237, 255, 0.66);
  font-size: 12px;
}

.progress-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 16px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(231, 237, 255, 0.8);
  font-size: 13px;
}

.status-error {
  margin: 14px 0 0;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 89, 89, 0.16);
  color: #ffd7db;
  font-size: 13px;
}

.rerun-button {
  margin-top: 18px;
  min-width: 156px;
  padding: 14px 18px;
  border: 1px solid rgba(255, 134, 204, 0.55);
  border-radius: 999px;
  background:
    linear-gradient(180deg, rgba(255, 88, 180, 0.32), rgba(255, 88, 180, 0.18)),
    rgba(255, 255, 255, 0.04);
  color: #fff4fa;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    opacity 180ms ease;
}

.rerun-button:hover:enabled {
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(255, 88, 180, 0.22);
}

.rerun-button:disabled {
  cursor: progress;
  opacity: 0.68;
}

@media (max-width: 720px) {
  .status-panel {
    top: 12px;
    left: 12px;
    right: 12px;
    width: auto;
    padding: 18px;
  }

  .status-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
