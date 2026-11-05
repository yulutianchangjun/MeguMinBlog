<script setup lang="ts">
import { computed } from 'vue'
import MagicIcon from '@/components/common/MagicIcon.vue'
import { resolveAsset } from '@/lib/asset'
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

const cover = computed(() => resolveAsset(props.post.cover))
const likes = computed(() => interaction.likeTotal(props.post.id))
const day = computed(() => props.post.date.slice(5).replace('-', ' / '))
const year = computed(() => props.post.date.slice(0, 4))
</script>

<template>
  <router-link :to="`/posts/${post.id}`" class="post-card mage-card" :class="{ compact }">
    <div class="cover">
      <div class="art-mat">
        <img v-if="cover" class="art-blur" :src="cover" alt="" aria-hidden="true" loading="lazy" />
        <img v-if="cover" class="art-main" :src="cover" :alt="post.title" loading="lazy" />
        <div v-else class="fallback">
          <span class="fallback-star"></span>
          <span class="fallback-rune">EXPLOSION</span>
        </div>
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
  aspect-ratio: 4 / 3;
  padding: 10px 10px 0;
  overflow: hidden;
  background:
    radial-gradient(90% 80% at 50% 0%, rgba(120, 48, 58, 0.5), rgba(26, 18, 26, 0.96) 72%),
    linear-gradient(160deg, #241a24, #171220);
}

.compact .cover {
  aspect-ratio: 16 / 7;
}

.art-mat {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 7px 7px 0 0;
  border: 1px solid rgba(217, 172, 88, 0.16);
  border-bottom: 0;
  background: rgba(11, 8, 14, 0.62);
}

.art-mat::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--tex-grid) center / cover no-repeat;
  mix-blend-mode: soft-light;
  opacity: 0.1;
  pointer-events: none;
}

.art-mat::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  box-shadow:
    inset 0 0 34px rgba(10, 6, 12, 0.62),
    inset 0 0 10px rgba(10, 6, 12, 0.4);
}

.art-blur {
  position: absolute;
  inset: -8%;
  width: 116%;
  height: 116%;
  object-fit: cover;
  object-position: center;
  filter: blur(6px) brightness(0.5) saturate(1.1);
  opacity: 0.75;
}

.art-main {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center center;
  transition: transform 0.6s var(--ease), filter 0.5s var(--ease);
  filter: saturate(1.04) brightness(0.98);
}

.post-card:hover .art-main {
  transform: scale(1.035);
  filter: saturate(1.1) brightness(1.04);
}

.fallback {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(120% 100% at 20% 0%, rgba(165, 42, 54, 0.32), transparent 60%),
    var(--tex-grid) center / cover no-repeat,
    linear-gradient(160deg, #2a1d29, #171320);
  background-blend-mode: normal, soft-light, normal;
  display: grid;
  place-items: center;
}

.fallback-star {
  position: absolute;
  width: 46%;
  aspect-ratio: 1;
  background: var(--tex-star) center/contain no-repeat;
  opacity: 0.42;
  filter: drop-shadow(0 0 18px rgba(255, 176, 84, 0.35));
}

.fallback-rune {
  position: absolute;
  bottom: 14px;
  right: 16px;
  font-family: var(--font-display);
  font-size: 10px;
  letter-spacing: 0.4em;
  color: rgba(242, 219, 166, 0.4);
}

.cover-veil {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, transparent 62%, rgba(16, 11, 20, 0.62) 100%),
    radial-gradient(120% 60% at 50% 100%, rgba(165, 42, 54, 0.22), transparent 70%);
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

</style>
