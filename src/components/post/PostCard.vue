<script setup lang="ts">
import { computed } from 'vue'
import MagicIcon from '@/components/common/MagicIcon.vue'
import { readingMinutes } from '@/lib/markdown'
import { useInteractionStore } from '@/stores/interaction'
import type { Post } from '@/types'

const props = withDefaults(
  defineProps<{
    post: Post
    compact?: boolean
    showExcerpt?: boolean
  }>(),
  { compact: false, showExcerpt: true },
)

const interaction = useInteractionStore()

const asset = (path?: string) => {
  if (!path) return ''
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path
  return `./${path.replace(/^\.?\//, '')}`
}

const cover = computed(() => asset(props.post.cover))
const minutes = computed(() => readingMinutes(props.post.content))
const comments = computed(() => interaction.commentCount(props.post.id))
const likes = computed(() => interaction.likeTotal(props.post.id))
const day = computed(() => props.post.date.slice(5).replace('-', ' / '))
const year = computed(() => props.post.date.slice(0, 4))
</script>

<template>
  <router-link :to="`/posts/${post.id}`" class="post-card mage-card" :class="{ compact }">
    <div class="cover">
      <img v-if="cover" :src="cover" :alt="post.title" loading="lazy" />
      <div v-else class="fallback">
        <span class="fallback-seal"></span>
        <span class="fallback-rune">EXPLOSION</span>
      </div>
      <div class="cover-veil"></div>
      <span v-if="post.pinned" class="pin">
        <MagicIcon name="pin" :size="11" />
        置顶
      </span>
      <span v-if="post.hidden || post.draft" class="state">
        {{ post.hidden ? '隐藏' : '草稿' }}
      </span>
      <span class="date-badge">
        <strong>{{ day }}</strong>
        <em>{{ year }}</em>
      </span>
    </div>

    <div class="body">
      <div class="cats">
        <span v-for="cat in post.categories.slice(0, 3)" :key="cat" class="chip">{{ cat }}</span>
      </div>
      <h3>{{ post.title }}</h3>
      <p v-if="post.subtitle" class="subtitle">{{ post.subtitle }}</p>
      <p v-if="showExcerpt" class="excerpt">{{ post.excerpt }}</p>

      <div class="meta">
        <span><MagicIcon name="clock" :size="12" />{{ minutes }} 分钟</span>
        <span><MagicIcon name="comment" :size="12" />{{ comments }}</span>
        <span><MagicIcon name="heart" :size="12" />{{ likes }}</span>
        <span class="read">
          阅读
          <MagicIcon name="arrowRight" :size="12" />
        </span>
      </div>
    </div>
  </router-link>
</template>

<style scoped>
.post-card {
  display: flex;
  flex-direction: column;
  transition: transform 0.34s var(--ease), box-shadow 0.34s var(--ease), border-color 0.34s var(--ease);
}

.post-card:hover {
  transform: translateY(-4px);
  border-color: rgba(217, 172, 88, 0.4);
  box-shadow: 0 28px 48px -32px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(217, 172, 88, 0.08);
}

.cover {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: radial-gradient(82% 92% at 50% 18%, #93404f 0%, #5a2430 55%, #2c141d 100%);
}

.compact .cover {
  aspect-ratio: 21 / 8;
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 22%;
  transform: scale(1.02);
  transition: transform 0.6s var(--ease), filter 0.5s var(--ease);
  mix-blend-mode: multiply;
  filter: contrast(1.03) brightness(1.2) saturate(1.08);
}

.post-card:hover .cover img {
  transform: scale(1.07);
  filter: contrast(1.05) brightness(1.3) saturate(1.14);
}

.fallback {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(120% 100% at 20% 0%, rgba(165, 42, 54, 0.4), transparent 60%),
    repeating-linear-gradient(135deg, rgba(217, 172, 88, 0.06) 0 1px, transparent 1px 14px),
    linear-gradient(160deg, #2a1d29, #171320);
  display: grid;
  place-items: center;
}

.fallback-seal {
  position: absolute;
  width: 62%;
  aspect-ratio: 1;
  background: url('/assets/megumin/magic-circle.png') center/contain no-repeat;
  opacity: 0.28;
  mix-blend-mode: screen;
  animation: spin 60s linear infinite;
}

.fallback-rune {
  position: absolute;
  bottom: 12px;
  right: 14px;
  font-family: var(--font-display);
  font-size: 10px;
  letter-spacing: 0.4em;
  color: rgba(242, 219, 166, 0.4);
}

.cover-veil {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(120% 70% at 50% 0%, rgba(18, 11, 18, 0.55), transparent 62%),
    radial-gradient(120% 90% at 50% 100%, rgba(165, 42, 54, 0.28), transparent 62%),
    linear-gradient(180deg, rgba(15, 11, 19, 0.12) 30%, rgba(18, 14, 24, 0.86) 100%);
}

.pin,
.state {
  position: absolute;
  top: 10px;
  left: 10px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 10px;
  letter-spacing: 0.06em;
  background: rgba(165, 42, 54, 0.85);
  border: 1px solid rgba(242, 219, 166, 0.4);
  color: #fff2dd;
  backdrop-filter: blur(6px);
}

.state {
  left: auto;
  right: 10px;
  background: rgba(20, 16, 25, 0.85);
  border-color: rgba(217, 172, 88, 0.4);
  color: var(--c-gold);
}

.date-badge {
  position: absolute;
  right: 12px;
  bottom: 10px;
  text-align: right;
  line-height: 1;
}

.date-badge strong {
  display: block;
  font-family: var(--font-display);
  font-size: 15px;
  letter-spacing: 0.14em;
  color: rgba(244, 235, 221, 0.92);
}

.date-badge em {
  font-family: var(--font-mono);
  font-style: normal;
  font-size: 9px;
  letter-spacing: 0.2em;
  color: rgba(217, 172, 88, 0.7);
}

.body {
  padding: 16px 18px 18px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.cats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 9px;
}

.cats .chip {
  font-size: 10.5px;
  padding: 1px 8px;
  cursor: default;
  background: rgba(217, 172, 88, 0.08);
  color: var(--c-gold-2);
}

h3 {
  font-size: 18px;
  line-height: 1.45;
  letter-spacing: 0.02em;
  transition: color 0.24s var(--ease);
}

.post-card:hover h3 {
  color: #fff6e6;
}

.subtitle {
  margin: 5px 0 0;
  font-size: 12px;
  color: var(--c-gold-dim);
  letter-spacing: 0.04em;
}

.excerpt {
  margin: 9px 0 0;
  font-size: 12.5px;
  line-height: 1.8;
  color: var(--c-text-2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 14px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--c-muted);
  border-top: 1px solid rgba(217, 172, 88, 0.08);
  margin-top: auto;
}

.meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.meta .read {
  margin-left: auto;
  color: var(--c-gold);
  letter-spacing: 0.08em;
  transition: gap 0.24s var(--ease);
}

.post-card:hover .meta .read {
  gap: 7px;
  color: var(--c-gold-2);
}

.compact h3 {
  font-size: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
