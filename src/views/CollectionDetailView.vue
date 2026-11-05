<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MagicIcon from '@/components/common/MagicIcon.vue'
import { resolveAsset } from '@/lib/asset'
import PostCard from '@/components/post/PostCard.vue'
import { useContentStore } from '@/stores/content'

const route = useRoute()
const content = useContentStore()

const collection = computed(() => content.collections.find((item) => item.id === route.params.id))

const posts = computed(() =>
  content.publicPosts.filter((post) => post.collections.includes(String(route.params.id))),
)

const cover = computed(() => resolveAsset(collection.value?.cover))

const categories = computed(() => {
  const set = new Set<string>()
  posts.value.forEach((post) => post.categories.forEach((cat) => set.add(cat)))
  return [...set]
})
</script>

<template>
  <div class="collection-detail">
    <template v-if="collection">
      <header class="hero mage-card" :class="{ plain: !cover }">
        <img v-if="cover" :src="cover" class="hero-bg" :alt="collection.title" />
        <div class="hero-veil"></div>
        <span class="hero-rune">{{ collection.runes }}</span>
        <div class="hero-content">
          <nav class="crumbs">
            <router-link to="/">首页</router-link>
            <span>/</span>
            <router-link to="/collections">综集</router-link>
            <span>/</span>
            <em>{{ collection.subtitle }}</em>
          </nav>
          <h1>{{ collection.title }}</h1>
          <p>{{ collection.description }}</p>
          <div class="meta">
            <span><MagicIcon name="book" :size="13" />{{ posts.length }} 篇手记</span>
            <span><MagicIcon name="layers" :size="13" />{{ categories.length }} 个分类</span>
            <span class="cats">
              <em v-for="cat in categories" :key="cat">{{ cat }}</em>
            </span>
          </div>
        </div>
      </header>

      <div class="section-head">
        <div>
          <span class="eyebrow">Contents</span>
          <h2>本册目录</h2>
        </div>
        <router-link to="/collections" class="back-link">
          <MagicIcon name="arrowLeft" :size="12" />
          全部综集
        </router-link>
      </div>

      <div v-if="posts.length" class="grid">
        <PostCard v-for="post in posts" :key="post.id" :post="post" />
      </div>
      <div v-else class="empty mage-card">这一册还没有装订任何手记。</div>
    </template>

    <div v-else class="missing mage-card">
      <MagicIcon name="layers" :size="30" />
      <h2>找不到这一册综集</h2>
      <p>它可能被拆掉重编了。</p>
      <router-link to="/collections" class="btn-magic">返回综集</router-link>
    </div>
  </div>
</template>

<style scoped>
.collection-detail {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hero {
  position: relative;
  min-height: 280px;
  display: flex;
  align-items: flex-end;
  padding: 34px 36px;
  overflow: hidden;
}

.hero.plain {
  background: linear-gradient(150deg, #2a1a26, #171220);
}

.hero-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 22%;
  mix-blend-mode: multiply;
  filter: contrast(1.03) brightness(1.2) saturate(1.08);
}

.hero-veil {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(15, 11, 19, 0.08), rgba(17, 12, 21, 0.72)),
    linear-gradient(100deg, rgba(120, 30, 45, 0.18), transparent 64%);
}

.hero-rune {
  position: absolute;
  right: 30px;
  top: 22px;
  font-family: var(--font-display);
  font-size: 10px;
  letter-spacing: 0.5em;
  color: rgba(242, 219, 166, 0.45);
  writing-mode: vertical-rl;
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 680px;
}

.crumbs {
  display: flex;
  align-items: center;
  gap: 7px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--c-muted);
  letter-spacing: 0.06em;
  margin-bottom: 10px;
}

.crumbs em {
  font-style: normal;
  color: var(--c-gold);
}

.crumbs a:hover {
  color: var(--c-gold-2);
}

.hero h1 {
  font-size: clamp(26px, 3vw, 34px);
  letter-spacing: 0.05em;
}

.hero p {
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.8;
  color: var(--c-text-2);
}

.meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 16px;
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--c-text-2);
}

.meta span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.cats {
  gap: 6px;
}

.cats em {
  font-style: normal;
  padding: 1px 8px;
  border-radius: 999px;
  border: 1px solid rgba(217, 172, 88, 0.18);
  background: rgba(217, 172, 88, 0.08);
  color: var(--c-gold-2);
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: 4px;
}

.section-head h2 {
  margin-top: 4px;
  font-size: 21px;
  letter-spacing: 0.06em;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: var(--c-text-2);
  padding-bottom: 3px;
  border-bottom: 1px dashed rgba(217, 172, 88, 0.3);
}

.back-link:hover {
  color: var(--c-gold-2);
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.empty,
.missing {
  padding: 40px;
  text-align: center;
  color: var(--c-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.missing h2 {
  font-size: 22px;
  margin: 0;
}

.missing p {
  margin: 0 0 8px;
  font-size: 13px;
}

@media (max-width: 1080px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .hero {
    padding: 24px 20px;
    min-height: 230px;
  }
  .hero-rune {
    display: none;
  }
}
</style>
