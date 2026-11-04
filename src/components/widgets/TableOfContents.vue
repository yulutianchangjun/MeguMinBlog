<script setup lang="ts">
import { computed } from 'vue'
import MagicIcon from '@/components/common/MagicIcon.vue'
import { useReadingStore } from '@/stores/reading'

const reading = useReadingStore()

const toc = computed(() => reading.toc)
const active = computed(() => reading.activeId)
const progress = computed(() => Math.round(reading.progress * 100))

function jump(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY - 104
  window.scrollTo({ top, behavior: 'smooth' })
}
</script>

<template>
  <section class="toc mage-card side-panel">
    <div class="panel-title">
      <span>Contents</span>
      <span class="cn">本篇目录</span>
    </div>

    <div class="progress-row">
      <div class="bar"><span :style="{ width: `${Math.max(3, progress)}%` }"></span></div>
      <em>{{ progress }}%</em>
    </div>

    <nav v-if="toc.length" class="toc-list">
      <button
        v-for="item in toc"
        :key="item.id"
        class="toc-item"
        :class="{ active: active === item.id, sub: item.level === 3 }"
        @click="jump(item.id)"
      >
        <span class="marker"></span>
        <span class="text">{{ item.text }}</span>
      </button>
    </nav>
    <div v-else class="empty-state">
      <MagicIcon name="book" :size="18" />
      <p>这篇文章没有小标题</p>
    </div>

    <div class="toc-foot">
      <MagicIcon name="spark" :size="12" />
      <span>滚动时自动高亮所在段落</span>
    </div>
  </section>
</template>

<style scoped>
.progress-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px 4px;
}

.bar {
  flex: 1;
  height: 3px;
  border-radius: 99px;
  background: rgba(217, 172, 88, 0.14);
  overflow: hidden;
}

.bar span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #641c2b, #d9ac58);
  transition: width 0.12s linear;
}

.progress-row em {
  font-family: var(--font-mono);
  font-style: normal;
  font-size: 10px;
  color: var(--c-gold);
}

.toc-list {
  display: flex;
  flex-direction: column;
  padding: 8px 10px 14px;
  max-height: calc(100vh - 320px);
  overflow-y: auto;
  scrollbar-width: thin;
}

.toc-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--c-text-2);
  font-size: 12px;
  line-height: 1.5;
  text-align: left;
  cursor: pointer;
  transition: all 0.22s var(--ease);
}

.toc-item.sub {
  padding-left: 24px;
  font-size: 11.5px;
  color: var(--c-muted);
}

.toc-item .marker {
  width: 4px;
  height: 4px;
  flex: none;
  border-radius: 50%;
  background: rgba(217, 172, 88, 0.35);
  transition: all 0.24s var(--ease);
}

.toc-item .text {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.toc-item:hover {
  color: var(--c-gold-2);
  background: rgba(217, 172, 88, 0.06);
}

.toc-item.active {
  color: #fff3e0;
  background: linear-gradient(90deg, rgba(165, 42, 54, 0.35), transparent);
}

.toc-item.active .marker {
  background: var(--c-gold);
  box-shadow: 0 0 8px rgba(217, 172, 88, 0.9);
  transform: scale(1.4);
}

.toc-foot {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px 14px;
  border-top: 1px dashed rgba(217, 172, 88, 0.14);
  font-size: 10px;
  letter-spacing: 0.04em;
  color: var(--c-muted);
}

.empty-state {
  padding: 26px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.empty-state p {
  margin: 0;
}
</style>
