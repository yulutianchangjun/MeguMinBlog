<script setup lang="ts">
import { computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MagicIcon from '@/components/common/MagicIcon.vue'
import PostCard from '@/components/post/PostCard.vue'
import { useContentStore } from '@/stores/content'
import { useInteractionStore } from '@/stores/interaction'
import { useAuthStore } from '@/stores/auth'

defineOptions({ name: 'PostsView' })

const route = useRoute()
const router = useRouter()
const content = useContentStore()
const interaction = useInteractionStore()
const auth = useAuthStore()

type SortKey = 'new' | 'old' | 'hot'

const sorts: { key: SortKey; label: string; icon: string }[] = [
  { key: 'new', label: '最新', icon: 'clock' },
  { key: 'old', label: '最早', icon: 'book' },
  { key: 'hot', label: '最热', icon: 'flame' },
]

const readList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === 'string' && value) return value.split(',')
  return []
}

const q = ref(String(route.query.q ?? ''))
const selectedCats = ref<string[]>(readList(route.query.cats))
const sort = ref<SortKey>((route.query.sort as SortKey) ?? 'new')
const page = ref(Math.max(1, Number(route.query.page ?? 1)))
const pageSize = 6
const searchInput = ref<HTMLInputElement | null>(null)
let savedScroll = 0
let debounceTimer: number | undefined

// 博主可见隐藏/草稿内容，访客只看到公开文章
const posts = computed(() => (auth.isAdmin ? content.allPosts : content.publicPosts))

const filtered = computed(() => {
  const keyword = q.value.trim().toLowerCase()
  let list = posts.value.filter((post) => {
    if (selectedCats.value.length) {
      const hit = post.categories.some((cat) => selectedCats.value.includes(cat))
      if (!hit) return false
    }
    if (!keyword) return true
    const haystack = [post.title, post.subtitle, post.excerpt, post.content, ...post.categories]
      .join(' ')
      .toLowerCase()
    return haystack.includes(keyword)
  })

  list = [...list]
  if (sort.value === 'hot') {
    list.sort((a, b) => interaction.likeTotal(b.id) - interaction.likeTotal(a.id))
  } else if (sort.value === 'old') {
    list.sort((a, b) => (a.date > b.date ? 1 : -1))
  } else {
    list.sort((a, b) => (a.date < b.date ? 1 : -1))
  }
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))

const paged = computed(() => {
  const start = (page.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize)
})

const hasFilter = computed(() => Boolean(q.value.trim()) || selectedCats.value.length > 0)

function toggleCat(name: string) {
  selectedCats.value = selectedCats.value.includes(name)
    ? selectedCats.value.filter((item) => item !== name)
    : [...selectedCats.value, name]
}

function setSort(key: SortKey) {
  sort.value = key
}

function reset() {
  q.value = ''
  selectedCats.value = []
  sort.value = 'new'
}

function goPage(next: number) {
  page.value = Math.min(totalPages.value, Math.max(1, next))
  window.scrollTo({ top: 260, behavior: 'smooth' })
}

const pageNumbers = computed(() => {
  const total = totalPages.value
  const current = page.value
  const list: number[] = []
  const start = Math.max(1, Math.min(current - 2, total - 4))
  for (let i = start; i < start + Math.min(5, total); i += 1) list.push(i)
  return list
})

function syncQuery() {
  const query: Record<string, string> = {}
  if (q.value.trim()) query.q = q.value.trim()
  if (selectedCats.value.length) query.cats = selectedCats.value.join(',')
  if (sort.value !== 'new') query.sort = sort.value
  if (page.value > 1) query.page = String(page.value)
  sessionStorage.setItem('mgm:last-list-query', JSON.stringify(query))
  router.replace({ path: '/posts', query })
}

watch([q, selectedCats, sort], () => {
  page.value = 1
})

watch([q, selectedCats, sort, page], () => {
  window.clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(syncQuery, 180)
})

watch(totalPages, (total) => {
  if (page.value > total) page.value = total
})

onMounted(() => {
  if (route.query.focus === '1') {
    nextTick(() => searchInput.value?.focus())
  }
})

onActivated(() => {
  if (savedScroll > 120) {
    const target = savedScroll
    window.setTimeout(() => {
      if (Math.abs(window.scrollY - target) > 40) {
        window.scrollTo({ top: target, behavior: 'auto' })
      }
    }, 80)
  }
})

onDeactivated(() => {
  savedScroll = window.scrollY
})

onBeforeUnmount(() => {
  window.clearTimeout(debounceTimer)
  savedScroll = 0
})
</script>

<template>
  <div class="posts-view">
    <header class="page-head mage-card tint-primary">
      <div class="head-inner">
        <div>
          <span class="eyebrow"><i class="tag-dot"></i>Daily Log · 日常</span>
          <h1>荒野与手记</h1>
          <p>
            每一次咏唱之后的记录。按分类筛选，或直接搜一个词——比如「爆裂」。
          </p>
        </div>
        <div class="head-stat">
          <strong>{{ posts.length }}</strong>
          <span>{{ auth.isAdmin ? '篇手记（含隐藏）' : '篇公开手记' }}</span>
          <em>{{ content.categories.length }} 个分类</em>
        </div>
      </div>
    </header>

    <section class="filters mage-card">
      <div class="search-row">
        <label class="search">
          <MagicIcon name="search" :size="16" />
          <input
            ref="searchInput"
            v-model="q"
            type="search"
            placeholder="搜索标题、副标题或正文…"
            aria-label="搜索手记"
          />
          <button v-if="q" class="clear" aria-label="清除" @click="q = ''">
            <MagicIcon name="close" :size="13" />
          </button>
        </label>

        <div class="sorts">
          <button
            v-for="item in sorts"
            :key="item.key"
            class="sort-btn"
            :class="{ active: sort === item.key }"
            @click="setSort(item.key)"
          >
            <MagicIcon :name="item.icon" :size="13" />
            {{ item.label }}
          </button>
        </div>
      </div>

      <div class="cat-row">
        <button class="chip" :class="{ active: !selectedCats.length }" @click="selectedCats = []">
          全部
          <em>{{ posts.length }}</em>
        </button>
        <button
          v-for="cat in content.categories"
          :key="cat.name"
          class="chip"
          :class="{ active: selectedCats.includes(cat.name) }"
          @click="toggleCat(cat.name)"
        >
          {{ cat.name }}
          <em>{{ cat.count }}</em>
        </button>
      </div>

      <div class="result-row">
        <span>
          共 <strong>{{ filtered.length }}</strong> 篇
          <template v-if="hasFilter"> · 已筛选</template>
        </span>
        <button v-if="hasFilter" class="reset" @click="reset">
          <MagicIcon name="close" :size="11" />
          清除筛选
        </button>
      </div>
    </section>

    <div v-if="paged.length" class="post-grid">
      <PostCard v-for="post in paged" :key="post.id" :post="post" />
    </div>

    <div v-else class="empty">
      <div class="empty-art">
        <img src="/assets/megumin/empty-state.webp" alt="没有找到对应的手记" />
      </div>

      <div class="empty-info">
        <span class="eyebrow"><i class="tag-dot"></i>Nothing Found · 空页</span>
        <h3>这一页什么也没有</h3>
        <p v-if="hasFilter">
          没有匹配
          <em v-if="q.trim()">「{{ q.trim() }}」</em>
          <em v-if="q.trim() && selectedCats.length">与</em>
          <em v-if="selectedCats.length">{{ selectedCats.join('、') }}</em>
          的手记。换个词，或者把筛选清掉。
        </p>
        <p v-else>这里暂时还没有公开的手记，晚点再来看看。</p>

        <div class="empty-actions">
          <button class="btn-magic" @click="reset">
            <MagicIcon name="wand" :size="14" />
            清除筛选
          </button>
        </div>

        <span class="empty-hint">也可以直接翻翻分类，或从最新的一篇开始读。</span>
      </div>
    </div>

    <nav v-if="totalPages > 1" class="pager" aria-label="分页">
      <button class="page-btn" :disabled="page === 1" @click="goPage(page - 1)">
        <MagicIcon name="chevronLeft" :size="14" />
      </button>
      <button
        v-for="num in pageNumbers"
        :key="num"
        class="page-btn"
        :class="{ active: num === page }"
        @click="goPage(num)"
      >
        {{ num }}
      </button>
      <button class="page-btn" :disabled="page === totalPages" @click="goPage(page + 1)">
        <MagicIcon name="chevronRight" :size="14" />
      </button>
      <span class="page-info">{{ page }} / {{ totalPages }}</span>
    </nav>
  </div>
</template>

<style scoped>
.posts-view {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.page-head {
  padding: 26px 28px;
  position: relative;
}

.page-head::after {
  content: '';
  position: absolute;
  right: -10px;
  bottom: -26px;
  width: 340px;
  height: 150px;
  background: var(--tex-stardust);
  opacity: 0.5;
  pointer-events: none;
}

.head-inner {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  position: relative;
  z-index: 1;
}

h1 {
  margin: 8px 0 6px;
  font-size: 32px;
  letter-spacing: 0.08em;
}

.page-head p {
  margin: 0;
  max-width: 460px;
  font-size: 13px;
  color: var(--c-text-2);
  line-height: 1.8;
}

.head-stat {
  text-align: right;
  flex: none;
}

.head-stat strong {
  display: block;
  font-family: var(--font-display);
  font-size: 38px;
  line-height: 1;
  color: var(--c-gold-2);
}

.head-stat span {
  font-size: 11px;
  color: var(--c-muted);
  letter-spacing: 0.1em;
}

.head-stat em {
  display: block;
  margin-top: 4px;
  font-style: normal;
  font-size: 10px;
  color: var(--c-gold-dim);
}

.filters {
  padding: 16px 18px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search {
  flex: 1;
  min-width: 220px;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 14px;
  border-radius: 999px;
  border: 1px solid rgba(217, 172, 88, 0.18);
  background: rgba(16, 12, 21, 0.7);
  color: var(--c-muted);
  transition: all 0.26s var(--ease);
}

.search:focus-within {
  border-color: rgba(217, 172, 88, 0.55);
  box-shadow: 0 0 0 4px rgba(165, 42, 54, 0.12);
  color: var(--c-gold);
}

.search input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  outline: none;
  color: var(--c-text);
  font-family: inherit;
  font-size: 13px;
}

.search input::placeholder {
  color: #6f655e;
}

.search input::-webkit-search-cancel-button {
  display: none;
}

.clear {
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 0;
  background: rgba(217, 172, 88, 0.14);
  color: var(--c-text-2);
  cursor: pointer;
}

.sorts {
  display: flex;
  gap: 4px;
  padding: 3px;
  border-radius: 999px;
  border: 1px solid rgba(217, 172, 88, 0.14);
  background: rgba(16, 12, 21, 0.6);
}

.sort-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 13px;
  border-radius: 999px;
  border: 0;
  background: transparent;
  color: var(--c-text-2);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.24s var(--ease);
}

.sort-btn:hover {
  color: var(--c-gold-2);
}

.sort-btn.active {
  color: #fff3e0;
  background: linear-gradient(140deg, rgba(165, 42, 54, 0.7), rgba(100, 28, 43, 0.4));
  box-shadow: inset 0 0 0 1px rgba(217, 172, 88, 0.24);
}

.cat-row {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.chip em {
  font-style: normal;
  font-family: var(--font-mono);
  font-size: 9.5px;
  opacity: 0.65;
}

.result-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px dashed rgba(217, 172, 88, 0.14);
  font-size: 11.5px;
  color: var(--c-muted);
  letter-spacing: 0.04em;
}

.result-row strong {
  color: var(--c-gold-2);
  font-family: var(--font-mono);
}

.reset {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  background: transparent;
  color: var(--c-muted);
  font-size: 11px;
  cursor: pointer;
}

.reset:hover {
  color: var(--c-gold-2);
}

.post-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(22px, 4.6vw, 62px);
  min-height: clamp(380px, 47vh, 540px);
  padding: 20px 12px 44px;
}

.empty-art {
  flex: none;
  width: clamp(232px, 26vw, 320px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-art img {
  width: 100%;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 26px 40px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 26px rgba(165, 42, 54, 0.16));
}

.empty-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  max-width: 400px;
}

.empty h3 {
  margin: 0;
  font-size: 24px;
  letter-spacing: 0.06em;
}

.empty p {
  margin: 0;
  font-size: 13px;
  line-height: 1.9;
  color: var(--c-text-2);
}

.empty p em {
  font-style: normal;
  color: var(--c-gold-2);
}

.empty-actions {
  display: flex;
  gap: 9px;
  flex-wrap: wrap;
  margin-top: 6px;
}


.empty-hint {
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--c-muted);
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 0 4px;
}

.page-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 9px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  border: 1px solid rgba(217, 172, 88, 0.16);
  background: rgba(24, 19, 31, 0.7);
  color: var(--c-text-2);
  font-family: var(--font-mono);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.22s var(--ease);
}

.page-btn:hover:not(:disabled) {
  color: var(--c-gold-2);
  border-color: rgba(217, 172, 88, 0.45);
  transform: translateY(-1px);
}

.page-btn.active {
  color: #fff3e0;
  background: linear-gradient(150deg, #a52a36, #641c2b);
  border-color: rgba(242, 219, 166, 0.45);
}

.page-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.page-info {
  margin-left: 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--c-muted);
  letter-spacing: 0.1em;
}

@media (max-width: 1080px) {
  .post-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .head-inner {
    flex-direction: column;
    align-items: flex-start;
  }
  .head-stat {
    text-align: left;
  }
  h1 {
    font-size: 26px;
  }
  .empty {
    flex-direction: column;
    text-align: center;
    gap: 16px;
    min-height: 0;
    padding: 30px 10px 44px;
  }
  .empty-art {
    width: min(64vw, 250px);
  }
  .empty-info {
    align-items: center;
  }
  .empty-actions {
    justify-content: center;
  }
}
</style>
