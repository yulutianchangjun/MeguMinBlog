<script setup lang="ts">
import { useRouter } from 'vue-router'
import MagicIcon from '@/components/common/MagicIcon.vue'
import { site } from '@/data/site'

const router = useRouter()
const year = new Date().getFullYear()

function toTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function openAdminHint() {
  router.push('/about')
}
</script>

<template>
  <footer class="app-footer">
    <div class="footer-inner">
      <div class="brand-mini">
        <span class="seal">
          <img src="/assets/megumin/logo.png" alt="站点 LOGO" />
        </span>
        <div>
          <strong>{{ site.title }}</strong>
          <span>以爆裂魔法写下的每一页</span>
        </div>
      </div>

      <div class="meta">
        <span>© {{ year }} {{ site.author.name }} </span>
        <!-- <span class="dot">·</span>
        <span>驱动 Vue 3 / Vite / Pinia</span> -->
        <span class="dot">·</span>
        <button class="link" @click="openAdminHint">关于本站</button>
      </div>

      <button class="to-top" title="回到顶部" @click="toTop">
        <MagicIcon name="arrowUp" :size="15" />
        <span>Top</span>
      </button>
    </div>
    <div class="rune-line">
      <span>EXPLOSION</span>
      <i></i>
      <span>MEGUMIN</span>
      <i></i>
      <span>AKUSERU</span>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  position: relative;
  margin-top: 30px;
  border-top: 1px solid rgba(217, 172, 88, 0.14);
  background: linear-gradient(180deg, rgba(16, 13, 19, 0.4), rgba(12, 10, 15, 0.9));
}

.footer-inner {
  max-width: var(--max-w);
  margin: 0 auto;
  padding: 26px var(--gutter) 18px;
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.brand-mini {
  display: flex;
  align-items: center;
  gap: 10px;
}

.seal {
  width: 38px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.seal img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0.9;
  filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.5));
}

.brand-mini strong {
  display: block;
  font-family: var(--font-display);
  font-size: 13px;
  letter-spacing: 0.08em;
  color: var(--c-paper);
}

.brand-mini span {
  font-size: 10.5px;
  color: var(--c-muted);
  letter-spacing: 0.04em;
}

.meta {
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 11px;
  color: var(--c-muted);
  letter-spacing: 0.03em;
}

.meta .dot {
  opacity: 0.4;
}

.link {
  border: 0;
  background: transparent;
  color: var(--c-text-2);
  font-size: 11px;
  cursor: pointer;
  padding: 0;
  border-bottom: 1px dashed rgba(217, 172, 88, 0.3);
}

.link:hover {
  color: var(--c-gold-2);
}

.to-top {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 13px;
  border-radius: 999px;
  border: 1px solid rgba(217, 172, 88, 0.2);
  background: rgba(24, 19, 31, 0.7);
  color: var(--c-text-2);
  font-family: var(--font-display);
  font-size: 9.5px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.24s var(--ease);
}

.to-top:hover {
  color: var(--c-gold-2);
  border-color: rgba(217, 172, 88, 0.5);
  transform: translateY(-1px);
}

.rune-line {
  max-width: var(--max-w);
  margin: 0 auto;
  padding: 0 var(--gutter) 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-display);
  font-size: 8.5px;
  letter-spacing: 0.4em;
  color: rgba(139, 128, 120, 0.5);
}

.rune-line i {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(217, 172, 88, 0.14), transparent);
}

@media (max-width: 760px) {
  .meta {
    margin: 0;
    order: 3;
    width: 100%;
  }
  .to-top {
    margin-left: auto;
  }
}
</style>
