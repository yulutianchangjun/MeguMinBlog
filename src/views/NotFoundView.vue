<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MagicIcon from '@/components/common/MagicIcon.vue'

const route = useRoute()
const path = computed(() => route.fullPath)

const quotes = [
  '这条路径已经被爆裂魔法抹掉了。',
  '连地图都不承认这里存在。',
  '可能是有人把这一页撕下来烧掉了。',
]
const quote = quotes[Math.floor(Math.random() * quotes.length)]
</script>

<template>
  <div class="not-found mage-card">
    <div class="art">
      <img src="/assets/megumin/404.png" alt="404" />
      <div class="art-veil"></div>
    </div>
    <div class="text">
      <span class="eyebrow"><i class="tag-dot"></i>404 · Page Not Found</span>
      <h1>这一页不存在</h1>
      <p class="path">{{ path }}</p>
      <p class="quote">「{{ quote }}」</p>
      <div class="actions">
        <router-link to="/" class="btn-magic">
          <MagicIcon name="home" :size="14" />
          回到首页
        </router-link>
        <router-link to="/posts" class="btn-magic ghost">
          <MagicIcon name="book" :size="14" />
          翻翻手记
        </router-link>
      </div>

      <div class="jump">
        <span>也可以从这里开始</span>
        <router-link to="/collections">综集</router-link>
        <router-link to="/board">留言墙</router-link>
        <router-link to="/about">关于我</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  align-items: stretch;
  overflow: hidden;
  min-height: 420px;
}

.art {
  position: relative;
  overflow: hidden;
  background: radial-gradient(80% 100% at 50% 10%, #7d3040, #2b121b 74%);
}

.art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 20%;
  mix-blend-mode: multiply;
  filter: contrast(1.03) brightness(1.2) saturate(1.08);
}

.art-veil {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, transparent 60%, rgba(24, 19, 30, 0.9) 100%),
    linear-gradient(180deg, rgba(23, 18, 28, 0.1), rgba(24, 19, 30, 0.5));
}

.text {
  padding: 44px 36px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

h1 {
  margin: 6px 0 4px;
  font-size: 30px;
  letter-spacing: 0.08em;
}

.path {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--c-gold);
  word-break: break-all;
  padding: 5px 10px;
  border-radius: 6px;
  background: rgba(217, 172, 88, 0.07);
  border: 1px dashed rgba(217, 172, 88, 0.2);
  align-self: flex-start;
}

.quote {
  margin: 10px 0 20px;
  font-family: var(--font-display);
  font-size: 13px;
  line-height: 1.9;
  color: var(--c-text-2);
}

.actions {
  display: flex;
  gap: 9px;
  flex-wrap: wrap;
}

.jump {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 22px;
  padding-top: 14px;
  border-top: 1px dashed rgba(217, 172, 88, 0.18);
  font-size: 10.5px;
  color: var(--c-muted);
  letter-spacing: 0.04em;
}

.jump a {
  color: var(--c-text-2);
  padding-bottom: 1px;
  border-bottom: 1px dashed rgba(217, 172, 88, 0.28);
}

.jump a:hover {
  color: var(--c-gold-2);
  border-bottom-color: var(--c-gold);
}

@media (max-width: 760px) {
  .not-found {
    grid-template-columns: 1fr;
  }
  .art {
    height: 260px;
  }
  .art-veil {
    background: linear-gradient(180deg, transparent 55%, rgba(24, 19, 30, 0.95) 100%);
  }
  .text {
    padding: 22px;
  }
}
</style>
