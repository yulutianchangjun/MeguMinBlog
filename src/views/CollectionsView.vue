<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import MagicIcon from '@/components/common/MagicIcon.vue'
import { resolveAsset } from '@/lib/asset'
import { useContentStore } from '@/stores/content'

const content = useContentStore()
const track = ref<HTMLElement | null>(null)
const active = ref(0)

const collections = computed(() => content.collections)

function countOf(id: string) {
  return content.publicPosts.filter((post) => post.collections.includes(id)).length
}

function scrollTo(index: number) {
  const el = track.value
  if (!el) return
  const card = el.children[index] as HTMLElement | undefined
  if (!card) return
  el.scrollTo({ left: card.offsetLeft - 8, behavior: 'smooth' })
  active.value = index
}

function move(delta: number) {
  const next = Math.min(collections.value.length - 1, Math.max(0, active.value + delta))
  scrollTo(next)
}

function onScroll() {
  const el = track.value
  if (!el) return
  const children = [...el.children] as HTMLElement[]
  let nearest = 0
  let min = Infinity
  children.forEach((child, i) => {
    const diff = Math.abs(child.offsetLeft - el.scrollLeft)
    if (diff < min) {
      min = diff
      nearest = i
    }
  })
  active.value = nearest
}

onMounted(() => {
  track.value?.addEventListener('scroll', onScroll, { passive: true })
})
</script>

<template>
  <div class="collections">
    <header class="head mage-card tint-primary">
      <img class="head-bg" src="/assets/megumin/head-seal.webp" alt="" />
      <div class="head-veil"></div>
      <div class="head-inner">
        <span class="eyebrow"><i class="tag-dot"></i>Series · 综集</span>
        <h1>把散落的手记<br /><span class="gold-text">装订成册</span></h1>
        <p>
          一个综集是一段连续的时间。数量不多，每一册都值得从头读到尾。
        </p>
      </div>
      <div class="head-index">
        <span>COLLECTIONS</span>
        <strong>{{ String(collections.length).padStart(2, '0') }}</strong>
      </div>
    </header>

    <section class="carousel mage-card">
      <div class="carousel-head">
        <div>
          <span class="eyebrow">Archive</span>
          <h2>全部综集</h2>
        </div>
        <div class="arrows">
          <button class="nav-btn" :disabled="active === 0" @click="move(-1)">
            <MagicIcon name="chevronLeft" :size="15" />
          </button>
          <button class="nav-btn" :disabled="active >= collections.length - 1" @click="move(1)">
            <MagicIcon name="chevronRight" :size="15" />
          </button>
        </div>
      </div>

      <div ref="track" class="track">
        <router-link
          v-for="(item, i) in collections"
          :key="item.id"
          :to="`/collections/${item.id}`"
          class="card mage-card"
          :class="{ dim: i !== active }"
        >
          <div class="cover">
            <template v-if="item.cover">
              <img class="cover-blur" :src="resolveAsset(item.cover)" alt="" aria-hidden="true" loading="lazy" />
              <img class="cover-main" :src="resolveAsset(item.cover)" :alt="item.title" loading="lazy" />
            </template>
            <div class="cover-veil"></div>
            <span class="index">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="runes">{{ item.runes }}</span>
          </div>
          <div class="body">
            <span class="en">{{ item.subtitle }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
            <div class="foot">
              <span class="count"><MagicIcon name="book" :size="12" />{{ countOf(item.id) }} 篇手记</span>
              <span class="enter">
                进入综集
                <MagicIcon name="arrowRight" :size="12" />
              </span>
            </div>
          </div>
        </router-link>
      </div>

      <div class="dots">
        <button
          v-for="(item, i) in collections"
          :key="item.id"
          class="dot"
          :class="{ on: active === i }"
          :aria-label="`切换到 ${item.title}`"
          @click="scrollTo(i)"
        ></button>
      </div>
    </section>

    <section class="note mage-card">
      <MagicIcon name="spark" :size="14" />
      <p>
        综集按主题固定，不提供全局检索。想找单篇随笔，请去
        <router-link to="/posts">日常流</router-link>。
      </p>
    </section>
  </div>
</template>

<style scoped>
.collections {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.head {
  position: relative;
  min-height: 236px;
  padding: 40px 40px 34px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  overflow: hidden;
  background: linear-gradient(150deg, #2a1a26, #171220);
}

.head-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  filter: brightness(0.6) saturate(1.02);
}

.head-veil {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(96deg, rgba(13, 9, 16, 0.5) 0%, rgba(15, 11, 19, 0.5) 46%, rgba(16, 12, 20, 0) 100%),
    linear-gradient(180deg, rgba(16, 12, 20, 0), rgba(13, 9, 16, 0));
}

.head-inner {
  position: relative;
  z-index: 1;
}

.head h1 {
  margin: 12px 0 12px;
  font-size: clamp(28px, 3.2vw, 38px);
  line-height: 1.4;
  letter-spacing: 0.05em;
}

.head p {
  margin: 0;
  max-width: 480px;
  font-size: 13px;
  color: var(--c-text-2);
}

.head-index {
  position: relative;
  z-index: 1;
  text-align: right;
}

.head-index span {
  display: block;
  font-family: var(--font-display);
  font-size: 9px;
  letter-spacing: 0.32em;
  color: var(--c-gold-dim);
}

.head-index strong {
  font-family: var(--font-display);
  font-size: 54px;
  line-height: 1;
  color: rgba(242, 219, 166, 0.9);
}

.carousel {
  padding: 20px 0 18px;
}

.carousel-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 20px;
  margin-bottom: 14px;
}

.carousel-head h2 {
  margin: 4px 0 0;
  font-size: 20px;
  letter-spacing: 0.06em;
}

.arrows {
  display: flex;
  gap: 6px;
}

.nav-btn {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid rgba(217, 172, 88, 0.2);
  background: rgba(22, 17, 29, 0.7);
  color: var(--c-text-2);
  cursor: pointer;
  transition: all 0.22s var(--ease);
}

.nav-btn:hover:not(:disabled) {
  color: var(--c-gold-2);
  border-color: rgba(217, 172, 88, 0.5);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.track {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding: 4px 20px 10px;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.track::-webkit-scrollbar {
  display: none;
}

.card {
  flex: 0 0 360px;
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  transition: opacity 0.4s var(--ease), transform 0.4s var(--ease), border-color 0.3s var(--ease);
}

.card.dim {
  opacity: 0.62;
  transform: scale(0.985);
}

.card:hover {
  opacity: 1;
  transform: translateY(-3px);
  border-color: rgba(217, 172, 88, 0.45);
}

.cover {
  position: relative;
  height: 196px;
  padding: 10px 10px 0;
  overflow: hidden;
  background:
    radial-gradient(90% 86% at 50% 0%, rgba(120, 48, 58, 0.46), rgba(24, 17, 25, 0.96) 74%),
    linear-gradient(160deg, #241a24, #171220);
}

/* 同图模糊底衬：等比完整展示时填补留白 */
.cover-blur {
  position: absolute;
  inset: -9%;
  width: 118%;
  height: 118%;
  object-fit: cover;
  object-position: center;
  filter: blur(9px) brightness(0.5) saturate(1.08);
  opacity: 0.78;
}

.cover-main {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  border-radius: 7px 7px 0 0;
  border: 1px solid rgba(217, 172, 88, 0.14);
  border-bottom: 0;
  background: rgba(11, 8, 14, 0.42);
  filter: saturate(1.02) brightness(0.98);
  transition: transform 0.55s var(--ease), filter 0.4s var(--ease);
}

.card:hover .cover-main {
  transform: scale(1.025);
  filter: saturate(1.08) brightness(1.04);
}

.cover-veil {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background:
    linear-gradient(180deg, transparent 58%, rgba(20, 15, 26, 0.58) 100%),
    linear-gradient(90deg, rgba(165, 42, 54, 0.16), transparent 58%);
}

.index {
  position: absolute;
  z-index: 3;
  left: 16px;
  top: 12px;
  font-family: var(--font-display);
  font-size: 30px;
  line-height: 1;
  color: rgba(244, 235, 221, 0.9);
  text-shadow: 0 4px 18px rgba(0, 0, 0, 0.6);
}

.runes {
  position: absolute;
  z-index: 3;
  right: 14px;
  bottom: 10px;
  font-family: var(--font-display);
  font-size: 9px;
  letter-spacing: 0.4em;
  color: rgba(242, 219, 166, 0.6);
}

.body {
  padding: 14px 18px 18px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.en {
  font-family: var(--font-display);
  font-size: 8.5px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--c-gold-dim);
}

.body h3 {
  margin: 5px 0 8px;
  font-size: 20px;
  letter-spacing: 0.05em;
}

.body p {
  margin: 0 0 14px;
  font-size: 12px;
  line-height: 1.8;
  color: var(--c-text-2);
  min-height: 43px;
}

.foot {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px dashed rgba(217, 172, 88, 0.16);
}

.count {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--c-muted);
}

.enter {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--c-gold);
  transition: gap 0.24s var(--ease);
}

.card:hover .enter {
  gap: 8px;
  color: var(--c-gold-2);
}

.dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 8px;
}

.dot {
  width: 6px;
  height: 6px;
  padding: 0;
  border-radius: 50%;
  border: 0;
  background: rgba(217, 172, 88, 0.22);
  cursor: pointer;
  transition: all 0.26s var(--ease);
}

.dot.on {
  width: 20px;
  border-radius: 99px;
  background: linear-gradient(90deg, #a52a36, #d9ac58);
}

.note {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  color: var(--c-muted);
}

.note p {
  margin: 0;
  font-size: 11.5px;
}

.note a {
  color: var(--c-gold-2);
  border-bottom: 1px dashed rgba(217, 172, 88, 0.4);
}

@media (max-width: 760px) {
  .head {
    padding: 28px 22px 24px;
  }
  .head-index {
    display: none;
  }
  .card {
    flex-basis: 84%;
  }
}
</style>
