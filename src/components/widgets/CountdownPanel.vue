<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import MagicIcon from '@/components/common/MagicIcon.vue'
import { useSiteStore } from '@/stores/site'

const siteStore = useSiteStore()
const today = dayjs().startOf('day')

const items = computed(() =>
  siteStore.anniversaries
    .map((item) => {
      const target = dayjs(`${today.year()}-${item.date}`)
      const next = target.isBefore(today) ? target.add(1, 'year') : target
      return {
        ...item,
        next,
        days: next.diff(today, 'day'),
        dateLabel: next.format('YYYY.MM.DD'),
        weekday: ['日', '一', '二', '三', '四', '五', '六'][next.day()],
      }
    })
    .sort((a, b) => a.days - b.days),
)

const primary = computed(() => items.value[0])
const others = computed(() => items.value.slice(1))
const openedDays = computed(() =>
  siteStore.startDate ? today.diff(dayjs(siteStore.startDate).startOf('day'), 'day') + 1 : 0,
)
</script>

<template>
  <section class="countdown mage-card side-panel">
    <div class="panel-title">
      <span>Countdown</span>
      <span class="cn">纪念日倒计时</span>
    </div>

    <div v-if="primary" class="cd-body">
      <div class="primary">
        <span class="label">
          <MagicIcon name="star" :size="12" />
          {{ primary.label }}
        </span>
        <div class="number">
          <strong>{{ primary.days }}</strong>
          <em>天后</em>
        </div>
        <p class="date">{{ primary.dateLabel }} · 周{{ primary.weekday }}</p>
        <p v-if="primary.note" class="note">{{ primary.note }}</p>
        <span class="seal-line"></span>
      </div>

      <ul class="list">
        <li v-for="item in others" :key="item.id">
          <span class="name">{{ item.label }}</span>
          <span class="days">{{ item.days }}<em>d</em></span>
        </li>
      </ul>

      <div class="footer">
        <span>开站第</span>
        <strong>{{ openedDays || '—' }}</strong>
        <span>天</span>
      </div>
    </div>

    <div v-else class="cd-body empty">
      <p>{{ siteStore.error || '正在获取倒计时…' }}</p>
    </div>
  </section>
</template>

<style scoped>
.cd-body {
  padding: 16px 18px 18px;
}

.cd-body.empty p {
  margin: 0;
  font-size: 11px;
  line-height: 1.8;
  color: var(--c-muted);
  text-align: center;
}

.primary {
  position: relative;
  padding: 14px 16px 16px;
  border-radius: 12px;
  border: 1px solid rgba(217, 172, 88, 0.16);
  background:
    radial-gradient(120% 110% at 88% 0%, rgba(165, 42, 54, 0.34), transparent 62%),
    rgba(18, 14, 22, 0.7);
  overflow: hidden;
}

.primary::after {
  content: '';
  position: absolute;
  right: -28px;
  bottom: -34px;
  width: 110px;
  height: 110px;
  background: var(--tex-star) center/contain no-repeat;
  opacity: 0.22;
  filter: drop-shadow(0 0 18px rgba(255, 176, 84, 0.35));
}

.label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--c-gold);
}

.number {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 4px 0 2px;
}

.number strong {
  font-family: var(--font-display);
  font-size: 42px;
  line-height: 1;
  background: linear-gradient(100deg, #f6e4b8, #d9ac58 60%, #a97f36);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.number em {
  font-style: normal;
  font-size: 12px;
  color: var(--c-text-2);
}

.date {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.08em;
  color: var(--c-text-2);
}

.note {
  margin: 6px 0 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--c-muted);
}

.seal-line {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 8px;
  height: 1px;
  background: linear-gradient(90deg, rgba(217, 172, 88, 0.4), transparent);
}

.list {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11.5px;
  color: var(--c-text-2);
  padding-bottom: 6px;
  border-bottom: 1px dashed rgba(217, 172, 88, 0.12);
}

.list li:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.days {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--c-gold-2);
}

.days em {
  font-style: normal;
  font-size: 9px;
  opacity: 0.6;
  margin-left: 1px;
}

.footer {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px solid rgba(217, 172, 88, 0.12);
  font-size: 10.5px;
  color: var(--c-muted);
  letter-spacing: 0.08em;
}

.footer strong {
  font-family: var(--font-display);
  font-size: 16px;
  color: var(--c-gold-2);
}
</style>
