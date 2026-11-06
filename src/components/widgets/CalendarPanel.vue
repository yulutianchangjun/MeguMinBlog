<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import MagicIcon from '@/components/common/MagicIcon.vue'
import { useContentStore } from '@/stores/content'
import { useSiteStore } from '@/stores/site'

const content = useContentStore()
const siteStore = useSiteStore()
const router = useRouter()

const today = new Date()
const cursor = ref(new Date(today.getFullYear(), today.getMonth(), 1))
const selected = ref('')

const weekday = ['日', '一', '二', '三', '四', '五', '六']

const keyOf = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

const postMap = computed(() => {
  const map = new Map<string, { id: string; title: string }[]>()
  for (const post of content.publicPosts) {
    const list = map.get(post.date) ?? []
    list.push({ id: post.id, title: post.title })
    map.set(post.date, list)
  }
  return map
})

const festivalMap = computed(() => {
  const map = new Map<string, string>()
  for (const item of siteStore.anniversaries) {
    map.set(item.date, item.label)
  }
  return map
})

const year = computed(() => cursor.value.getFullYear())
const month = computed(() => cursor.value.getMonth())
const monthLabel = computed(() => `${year.value} 年 ${month.value + 1} 月`)

const cells = computed(() => {
  const firstWeekday = new Date(year.value, month.value, 1).getDay()
  const daysInMonth = new Date(year.value, month.value + 1, 0).getDate()
  const list: { key: string; day: number; empty: boolean }[] = []
  for (let i = 0; i < firstWeekday; i += 1) {
    list.push({ key: `empty-${i}`, day: 0, empty: true })
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    list.push({ key: keyOf(year.value, month.value, day), day, empty: false })
  }
  return list
})

const todayKey = computed(() => keyOf(today.getFullYear(), today.getMonth(), today.getDate()))
const monthPosts = computed(
  () => [...postMap.value.keys()].filter((key) => key.startsWith(`${year.value}-${String(month.value + 1).padStart(2, '0')}`)).length,
)

const selectedPosts = computed(() => postMap.value.get(selected.value) ?? [])
const selectedFestival = computed(() => festivalMap.value.get(selected.value.slice(5)) ?? '')

function move(delta: number) {
  cursor.value = new Date(year.value, month.value + delta, 1)
}

function selectDay(key: string) {
  selected.value = selected.value === key ? '' : key
}

function openPost(id: string) {
  router.push(`/posts/${id}`)
}
</script>

<template>
  <section class="calendar mage-card side-panel">
    <div class="panel-title">
      <span>Calendar</span>
      <span class="cn">魔法日历</span>
    </div>

    <div class="cal-body">
      <div class="cal-head">
        <button class="nav-btn" aria-label="上个月" @click="move(-1)">
          <MagicIcon name="chevronLeft" :size="14" />
        </button>
        <div class="cal-label">
          <strong>{{ monthLabel }}</strong>
          <span>本月 {{ monthPosts }} 篇手记</span>
        </div>
        <button class="nav-btn" aria-label="下个月" @click="move(1)">
          <MagicIcon name="chevronRight" :size="14" />
        </button>
      </div>

      <div class="cal-week">
        <span v-for="w in weekday" :key="w">{{ w }}</span>
      </div>

      <div class="cal-grid">
        <template v-for="cell in cells" :key="cell.key">
          <span v-if="cell.empty" class="cal-cell empty"></span>
          <button
            v-else
            class="cal-cell"
            :class="{
              today: cell.key === todayKey,
              marked: postMap.has(cell.key),
              festival: festivalMap.has(cell.key.slice(5)),
              selected: cell.key === selected,
            }"
            @click="selectDay(cell.key)"
          >
            {{ cell.day }}
            <i v-if="postMap.has(cell.key)" class="dot"></i>
            <i v-else-if="festivalMap.has(cell.key.slice(5))" class="dot gold"></i>
          </button>
        </template>
      </div>

      <transition name="fade">
        <div v-if="selected" class="cal-detail">
          <div class="detail-head">
            <span>{{ selected }}</span>
            <em v-if="selectedFestival">{{ selectedFestival }}</em>
          </div>
          <button
            v-for="item in selectedPosts"
            :key="item.id"
            class="detail-post"
            @click="openPost(item.id)"
          >
            <span class="tag-dot"></span>
            {{ item.title }}
          </button>
          <p v-if="!selectedPosts.length" class="detail-empty">
            {{ selectedFestival ? '纪念日，没有手记。' : '这一天没有写手记。' }}
          </p>
        </div>
      </transition>
    </div>
  </section>
</template>

<style scoped>
.cal-body {
  padding: 14px 16px 16px;
}

.cal-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.cal-label {
  flex: 1;
  text-align: center;
}

.cal-label strong {
  display: block;
  font-family: var(--font-display);
  font-size: 13px;
  letter-spacing: 0.06em;
  color: var(--c-paper);
}

.cal-label span {
  font-size: 10px;
  color: var(--c-muted);
  letter-spacing: 0.04em;
}

.nav-btn {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid rgba(217, 172, 88, 0.16);
  background: transparent;
  color: var(--c-text-2);
  cursor: pointer;
  transition: all 0.22s var(--ease);
}

.nav-btn:hover {
  color: var(--c-gold-2);
  border-color: rgba(217, 172, 88, 0.45);
}

.cal-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 4px;
}

.cal-week span {
  text-align: center;
  font-size: 10px;
  color: var(--c-muted);
  letter-spacing: 0.06em;
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.cal-cell {
  position: relative;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--c-text-2);
  font-family: var(--font-mono);
  font-size: 11.5px;
  cursor: pointer;
  transition: all 0.2s var(--ease);
}

.cal-cell.empty {
  cursor: default;
}

.cal-cell:hover:not(.empty) {
  background: rgba(217, 172, 88, 0.08);
  color: var(--c-gold-2);
}

.cal-cell.marked {
  color: var(--c-paper);
}

.cal-cell.today {
  border-color: rgba(217, 172, 88, 0.55);
  color: var(--c-gold-2);
  box-shadow: inset 0 0 12px rgba(217, 172, 88, 0.12);
}

.cal-cell.selected {
  background: linear-gradient(140deg, rgba(165, 42, 54, 0.55), rgba(100, 28, 43, 0.3));
  color: #fff;
}

.cal-cell.festival:not(.selected) {
  color: var(--c-gold);
}

.dot {
  position: absolute;
  bottom: 3px;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--c-primary-2);
  box-shadow: 0 0 6px rgba(199, 60, 75, 0.9);
}

.dot.gold {
  background: var(--c-gold);
  box-shadow: 0 0 6px rgba(217, 172, 88, 0.9);
}

.cal-detail {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed rgba(217, 172, 88, 0.18);
}

.detail-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--c-muted);
  margin-bottom: 6px;
}

.detail-head em {
  font-style: normal;
  color: var(--c-gold);
}

.detail-post {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  padding: 5px 4px;
  border: 0;
  background: transparent;
  color: var(--c-text-2);
  font-size: 11.5px;
  text-align: left;
  cursor: pointer;
  border-radius: 5px;
  transition: all 0.2s var(--ease);
}

.detail-post:hover {
  color: var(--c-gold-2);
  background: rgba(217, 172, 88, 0.06);
}

.detail-empty {
  margin: 0;
  font-size: 11px;
  color: var(--c-muted);
}
</style>
