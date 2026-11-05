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
  <div class="not-found">
    <h1 class="sr-only">404 · 这一页不存在</h1>

    <div class="art">
      <span class="art-glow" aria-hidden="true"></span>
      <img src="/assets/megumin/404-cutout.webp" alt="惠惠趴在地上，旁边写着 404 Not Found" />
    </div>

    <div class="actions">
      <router-link to="/" class="btn-magic">
        <MagicIcon name="home" :size="15" />
        返回首页
      </router-link>
      <router-link to="/posts" class="btn-magic ghost">
        <MagicIcon name="book" :size="14" />
        翻翻手记
      </router-link>
    </div>

    <p class="meta">
      <span class="path">{{ path }}</span>
      <span class="dot">·</span>
      <span class="quote">「{{ quote }}」</span>
    </p>
  </div>
</template>

<style scoped>
.not-found {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 26px 0 40px;
  text-align: center;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.art {
  position: relative;
  width: clamp(320px, 44vw, 560px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.art-glow {
  position: absolute;
  width: 86%;
  aspect-ratio: 1;
  border-radius: 50%;
  background:
    radial-gradient(circle, rgba(217, 172, 88, 0.16) 0%, rgba(165, 42, 54, 0.16) 42%, transparent 70%);
  filter: blur(18px);
  pointer-events: none;
}

.art img {
  position: relative;
  width: 100%;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 30px 46px rgba(0, 0, 0, 0.62)) saturate(1.02);
  animation: artFloat 7s ease-in-out infinite;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: -6px;
}

.meta {
  margin: 16px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 10.5px;
  letter-spacing: 0.04em;
  color: var(--c-muted);
}

.meta .path {
  font-family: var(--font-mono);
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px dashed rgba(217, 172, 88, 0.22);
  background: rgba(217, 172, 88, 0.05);
  color: var(--c-gold-dim);
  max-width: 60vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta .dot {
  color: rgba(217, 172, 88, 0.4);
}

.meta .quote {
  font-family: var(--font-display);
  color: var(--c-text-2);
}

@keyframes artFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-7px);
  }
}

@media (max-width: 760px) {
  .not-found {
    padding: 18px 0 34px;
  }
  .art {
    width: min(86vw, 420px);
  }
  .meta {
    flex-direction: column;
    gap: 6px;
  }
  .meta .dot {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .art img {
    animation: none;
  }
}
</style>
