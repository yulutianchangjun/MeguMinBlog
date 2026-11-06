<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MagicIcon from '@/components/common/MagicIcon.vue'
import CommentSection from '@/components/post/CommentSection.vue'
import { renderMarkdown, readingMinutes } from '@/lib/markdown'
import { resolveAsset } from '@/lib/asset'
import { formatDate } from '@/lib/format'
import { toast } from '@/lib/toast'
import { useAuthStore } from '@/stores/auth'
import { useContentStore } from '@/stores/content'
import { useInteractionStore } from '@/stores/interaction'
import { useReadingStore } from '@/stores/reading'

const route = useRoute()
const router = useRouter()
const content = useContentStore()
const interaction = useInteractionStore()
const reading = useReadingStore()
const auth = useAuthStore()

const showTop = ref(false)
const likeBurst = ref(false)

const post = computed(() => content.allPosts.find((item) => item.id === route.params.id))
const accessible = computed(() => {
  if (!post.value) return false
  return auth.isAdmin || (!post.value.hidden && !post.value.draft && post.value.public !== false)
})

const rendered = computed(() => renderMarkdown(post.value?.content ?? ''))
const minutes = computed(() => readingMinutes(post.value?.content ?? ''))
const cover = computed(() => resolveAsset(post.value?.cover))
const likes = computed(() => interaction.likeTotal(post.value?.id ?? ''))
const liked = computed(() => interaction.hasLiked(post.value?.id ?? ''))

const ordered = computed(() => content.publicPosts)
const index = computed(() => ordered.value.findIndex((item) => item.id === post.value?.id))
const prevPost = computed(() => (index.value > 0 ? ordered.value[index.value - 1] : null))
const nextPost = computed(() =>
  index.value >= 0 && index.value < ordered.value.length - 1 ? ordered.value[index.value + 1] : null,
)

function jumpComments() {
  document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function syncScroll() {
  const doc = document.documentElement
  const total = doc.scrollHeight - window.innerHeight
  reading.progress = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0
  showTop.value = window.scrollY > 420

  const items = reading.toc
  let active = items[0]?.id ?? ''
  for (const item of items) {
    const el = document.getElementById(item.id)
    if (!el) continue
    if (el.getBoundingClientRect().top <= 150) active = item.id
  }
  reading.activeId = active
}

watch(
  rendered,
  async () => {
    reading.setToc(rendered.value.toc)
    await nextTick()
    syncScroll()
  },
  { immediate: true },
)

watch(
  () => route.params.id,
  () => {
    reading.clear()
    window.scrollTo({ top: 0 })
  },
)

function backToList() {
  const query = sessionStorage.getItem('mgm:last-list-query')
  if (query === null) {
    router.push('/posts')
    return
  }
  try {
    const parsed = JSON.parse(query) as Record<string, string>
    router.push({ path: '/posts', query: parsed })
  } catch {
    router.push('/posts')
  }
}

function toTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function like() {
  if (!post.value) return
  interaction.toggleLike(post.value.id)
  if (!liked.value) {
    likeBurst.value = true
    window.setTimeout(() => (likeBurst.value = false), 600)
  }
}

async function share() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    toast.success('链接已复制，可以扔给别人了')
  } catch {
    toast.warning('复制失败，请手动复制地址栏')
  }
}

onMounted(() => {
  window.addEventListener('scroll', syncScroll, { passive: true })
  syncScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', syncScroll)
  reading.clear()
})
</script>

<template>
  <div v-if="!post || !accessible" class="missing mage-card">
    <img src="/assets/megumin/megumin-portrait.webp" alt="" />
    <div>
      <span class="eyebrow">404 · Lost Page</span>
      <h2>这一页被魔力吞掉了</h2>
      <p>文章不存在，或者被博主藏进了草稿箱。</p>
      <button class="btn-magic" @click="backToList">
        <MagicIcon name="arrowLeft" :size="14" />
        返回日常流
      </button>
    </div>
  </div>

  <article v-else class="detail">
    <header class="hero mage-card" :class="{ 'no-cover': !cover }">
      <img v-if="cover" :src="cover" class="hero-bg" :alt="post.title" />
      <div class="hero-veil"></div>
      <div class="hero-content">
        <nav class="crumbs">
          <router-link to="/">首页</router-link>
          <span>/</span>
          <router-link to="/posts">日常流</router-link>
          <span>/</span>
          <em>{{ post.categories[0] ?? '未分类' }}</em>
        </nav>
        <h1>{{ post.title }}</h1>
        <p v-if="post.subtitle" class="subtitle">{{ post.subtitle }}</p>
        <div class="meta">
          <span><MagicIcon name="calendar" :size="13" />{{ formatDate(post.date, 'YYYY 年 MM 月 DD 日') }}</span>
          <span><MagicIcon name="clock" :size="13" />{{ minutes }} 分钟阅读</span>
          <button class="meta-link" @click="jumpComments">
            <MagicIcon name="comment" :size="13" />
            写评论
          </button>
          <span v-if="post.updated"><MagicIcon name="edit" :size="13" />更新于 {{ formatDate(post.updated) }}</span>
        </div>
        <div class="hero-actions">
          <button class="like-btn" :class="{ liked }" @click="like">
            <MagicIcon name="heart" :size="15" />
            <span>{{ likes }}</span>
            <em v-if="likeBurst" class="burst">+1</em>
          </button>
          <button class="round-btn" title="复制链接" @click="share">
            <MagicIcon name="copy" :size="15" />
          </button>
          <span v-if="post.pinned" class="pin-flag">
            <MagicIcon name="pin" :size="11" />
            置顶手记
          </span>
        </div>
      </div>
    </header>

    <div class="body mage-card paper-veil">
      <div class="prose" v-html="rendered.html"></div>

      <div v-if="post.tags.length" class="tags">
        <MagicIcon name="spark" :size="12" />
        <span v-for="tag in post.tags" :key="tag" class="tag">#{{ tag }}</span>
      </div>

      <div v-if="post.collections.length" class="collection-hint">
        <MagicIcon name="layers" :size="13" />
        收录于
        <router-link
          v-for="cid in post.collections"
          :key="cid"
          :to="`/collections/${cid}`"
          class="collection-link"
        >
          {{ content.collections.find((c) => c.id === cid)?.title ?? cid }}
        </router-link>
      </div>
    </div>

    <nav class="siblings">
      <router-link v-if="prevPost" :to="`/posts/${prevPost.id}`" class="sibling mage-card">
        <span class="dir"><MagicIcon name="chevronLeft" :size="12" />上一篇</span>
        <strong>{{ prevPost.title }}</strong>
      </router-link>
      <div v-else class="sibling placeholder">已经是最早的一篇了</div>
      <router-link v-if="nextPost" :to="`/posts/${nextPost.id}`" class="sibling mage-card next">
        <span class="dir">下一篇<MagicIcon name="chevronRight" :size="12" /></span>
        <strong>{{ nextPost.title }}</strong>
      </router-link>
      <div v-else class="sibling placeholder">这是最新的一篇</div>
    </nav>

    <CommentSection :post-id="post.id" />

    <div class="floaters">
      <transition name="fade">
        <button v-if="showTop" class="floater" title="回到顶部" @click="toTop">
          <MagicIcon name="arrowUp" :size="17" />
        </button>
      </transition>
      <button class="floater back" title="返回列表（保持筛选与位置）" @click="backToList">
        <MagicIcon name="arrowLeft" :size="17" />
      </button>
    </div>
  </article>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* ---------- Hero ---------- */

.hero {
  position: relative;
  min-height: 300px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  padding: 34px 36px;
  background:
    radial-gradient(80% 120% at 78% 0%, #7d3040 0%, #3d1823 52%, #22121a 100%);
}

.hero.no-cover {
  background:
    radial-gradient(90% 120% at 80% 0%, rgba(165, 42, 54, 0.35), transparent 60%),
    linear-gradient(150deg, #2a1a26, #171220);
}

.hero-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  filter: brightness(0.78) saturate(1.04);
  transform: scale(1.03);
}

.hero-veil {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(96deg, rgba(10, 7, 14, 0.84) 0%, rgba(12, 8, 16, 0.5) 54%, rgba(16, 11, 20, 0.2) 100%),
    linear-gradient(180deg, rgba(15, 11, 19, 0.1) 0%, rgba(16, 12, 21, 0.62) 58%, rgba(18, 13, 24, 0.95) 100%),
    linear-gradient(100deg, rgba(120, 30, 45, 0.2), transparent 64%);
}

.hero-content {
  position: relative;
  z-index: 2;
  width: 100%;
}

.crumbs {
  display: flex;
  align-items: center;
  gap: 7px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--c-muted);
  margin-bottom: 12px;
}

.crumbs a:hover {
  color: var(--c-gold-2);
}

.crumbs em {
  font-style: normal;
  color: var(--c-gold);
}

.hero h1 {
  max-width: 720px;
  font-size: clamp(26px, 3vw, 36px);
  line-height: 1.4;
  letter-spacing: 0.03em;
  text-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
}

.subtitle {
  margin: 10px 0 0;
  max-width: 640px;
  font-family: var(--font-display);
  font-size: 13.5px;
  letter-spacing: 0.05em;
  color: var(--c-gold-2);
  opacity: 0.9;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--c-text-2);
}

.meta span,
.meta-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.meta-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  cursor: pointer;
  transition: color 0.22s var(--ease);
}

.meta-link:hover {
  color: var(--c-gold-2);
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 18px;
}

.like-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 16px;
  border-radius: 999px;
  border: 1px solid rgba(217, 172, 88, 0.3);
  background: rgba(20, 15, 26, 0.6);
  color: var(--c-text-2);
  font-family: var(--font-mono);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.26s var(--ease);
}

.like-btn:hover {
  color: #ffb3bd;
  border-color: rgba(199, 60, 75, 0.6);
}

.like-btn.liked {
  color: #ff8f9b;
  border-color: rgba(199, 60, 75, 0.7);
  background: rgba(165, 42, 54, 0.28);
}

.burst {
  position: absolute;
  right: 6px;
  top: -12px;
  font-style: normal;
  font-size: 11px;
  color: #ff8f9b;
  animation: burst 0.6s ease-out forwards;
}

.round-btn {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid rgba(217, 172, 88, 0.24);
  background: rgba(20, 15, 26, 0.6);
  color: var(--c-text-2);
  cursor: pointer;
  transition: all 0.24s var(--ease);
}

.round-btn:hover {
  color: var(--c-gold-2);
  border-color: rgba(217, 172, 88, 0.5);
}

.pin-flag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--c-gold);
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px dashed rgba(217, 172, 88, 0.35);
}

/* ---------- 正文 ---------- */

.body {
  padding: 34px 40px 26px;
}

.body > * {
  position: relative;
  z-index: 1;
}







.tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 26px;
  padding-top: 16px;
  border-top: 1px dashed rgba(217, 172, 88, 0.16);
  color: var(--c-gold);
}

.tag {
  font-size: 11.5px;
  color: var(--c-text-2);
  padding: 2px 9px;
  border-radius: 999px;
  background: rgba(217, 172, 88, 0.08);
  border: 1px solid rgba(217, 172, 88, 0.14);
}

.collection-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  font-size: 11.5px;
  color: var(--c-muted);
}

.collection-link {
  color: var(--c-gold-2);
  border-bottom: 1px dashed rgba(217, 172, 88, 0.35);
}

/* ---------- 上一篇 / 下一篇 ---------- */

.siblings {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.sibling {
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: all 0.3s var(--ease);
}

.sibling:hover {
  border-color: rgba(217, 172, 88, 0.4);
  transform: translateY(-2px);
}

.sibling .dir {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.12em;
  color: var(--c-gold);
}

.sibling strong {
  font-family: var(--font-display);
  font-size: 13.5px;
  font-weight: 500;
  color: var(--c-paper);
  line-height: 1.5;
}

.sibling.next {
  text-align: right;
  align-items: flex-end;
}

.sibling.placeholder {
  border: 1px dashed rgba(217, 172, 88, 0.14);
  border-radius: var(--r-lg);
  color: var(--c-muted);
  font-size: 11.5px;
  display: grid;
  place-items: center;
  min-height: 74px;
}

/* ---------- 悬浮按钮 ---------- */

.floaters {
  position: fixed;
  right: 26px;
  bottom: 34px;
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.floater {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid rgba(217, 172, 88, 0.3);
  background: rgba(22, 17, 29, 0.88);
  color: var(--c-text-2);
  cursor: pointer;
  backdrop-filter: blur(5px);
  box-shadow: 0 14px 30px -18px #000;
  transition: all 0.26s var(--ease);
}

.floater:hover {
  color: var(--c-gold-2);
  border-color: rgba(217, 172, 88, 0.6);
  transform: translateY(-2px);
}

.floater.back {
  color: var(--c-gold-2);
  background: linear-gradient(150deg, rgba(165, 42, 54, 0.9), rgba(100, 28, 43, 0.9));
  border-color: rgba(242, 219, 166, 0.45);
}

/* ---------- 缺失 ---------- */

.missing {
  display: flex;
  align-items: center;
  gap: 26px;
  padding: 34px;
}

.missing img {
  width: 150px;
  height: 180px;
  object-fit: cover;
  object-position: center 8%;
  border-radius: 14px;
  border: 1px solid rgba(217, 172, 88, 0.2);
}

.missing h2 {
  margin: 8px 0 8px;
  font-size: 24px;
}

.missing p {
  margin: 0 0 16px;
  color: var(--c-muted);
  font-size: 13px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes burst {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-18px) scale(1.3);
  }
}

@media (max-width: 900px) {
  .hero {
    padding: 26px 22px;
    min-height: 240px;
  }
  .body {
    padding: 24px 20px 20px;
  }
  .siblings {
    grid-template-columns: 1fr;
  }
  .floaters {
    right: 14px;
    bottom: 20px;
  }
  .missing {
    flex-direction: column;
    text-align: center;
  }
}
</style>
