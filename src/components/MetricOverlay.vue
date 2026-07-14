<script setup lang="ts">
type MaybeNumber = number | null | undefined

defineProps<{
  currentCount: number
  liveFps: number
  targetFps: number
  refreshRate: number
  metric: number
  resultCount?: MaybeNumber
}>()

function formatInteger(value: MaybeNumber): string {
  return typeof value === 'number' ? Math.round(value).toLocaleString() : '--'
}

function formatDecimal(value: MaybeNumber, digits = 1): string {
  return typeof value === 'number' ? value.toFixed(digits) : '--'
}
</script>

<template>
  <aside class="metric-overlay">
    <p class="eyebrow">实时统计</p>
    <div class="metric-grid">
      <div class="metric-card metric-card--primary">
        <span class="metric-label">Tetos</span>
        <strong class="metric-value">{{ formatInteger(resultCount ?? currentCount) }}</strong>
      </div>

      <div class="metric-card">
        <span class="metric-label">FPS</span>
        <strong class="metric-value">{{ formatDecimal(liveFps) }}</strong>
      </div>

      <div class="metric-card">
        <span class="metric-label">目标 / 刷新率</span>
        <strong class="metric-value">{{ formatInteger(targetFps) }} / {{ formatInteger(refreshRate) }}</strong>
      </div>

      <div class="metric-card">
        <span class="metric-label">Tetos / FPS</span>
        <strong class="metric-value">{{ formatDecimal(metric, 2) }}</strong>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.metric-overlay {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 4;
  width: min(320px, calc(100vw - 32px));
  padding: 18px;
  border: 1px solid rgba(255, 107, 196, 0.38);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(19, 26, 53, 0.88), rgba(7, 10, 24, 0.76)),
    rgba(8, 9, 18, 0.78);
  box-shadow:
    0 30px 70px rgba(0, 0, 0, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.09);
  backdrop-filter: blur(24px);
}

.eyebrow {
  margin: 0 0 14px;
  color: rgba(167, 247, 255, 0.88);
  font-size: 11px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 94px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.metric-card--primary {
  background:
    radial-gradient(circle at top, rgba(255, 81, 171, 0.26), transparent 65%),
    rgba(255, 255, 255, 0.06);
}

.metric-label {
  color: rgba(226, 232, 255, 0.7);
  font-size: 12px;
}

.metric-value {
  color: #fff4fa;
  font-size: clamp(1.1rem, 2vw, 1.8rem);
  line-height: 1.05;
}

@media (max-width: 720px) {
  .metric-overlay {
    top: 12px;
    right: 12px;
    left: 12px;
    width: auto;
  }

  .metric-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>

