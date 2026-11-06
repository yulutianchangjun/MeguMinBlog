<script setup lang="ts">
import { computed } from 'vue'
import MagicIcon from '@/components/common/MagicIcon.vue'
import { site } from '@/data/site'
import { formatDate } from '@/lib/format'
import { useContentStore } from '@/stores/content'
import { useInteractionStore } from '@/stores/interaction'
import { useProfileStore } from '@/stores/profile'
import { useSiteStore } from '@/stores/site'

const content = useContentStore()
const interaction = useInteractionStore()
const profile = useProfileStore()
const siteStore = useSiteStore()

const attributes = [
  { label: '爆裂魔法', en: 'Explosion', value: 100 },
  { label: '魔力总量', en: 'Mana', value: 94 },
  { label: '咏唱速度', en: 'Chanting', value: 87 },
  { label: '近战能力', en: 'Melee', value: 12 },
  { label: '家务技能', en: 'Chores', value: 6 },
]

const timeline = computed(() => [
  { date: '红魔之里', title: '出生在一个全是怪人的村子', desc: '第一天就哭得比谁都响。' },
  { date: '某年夏', title: '第一次看见爆裂魔法', desc: '山丘消失了，我决定这就是我要花一辈子的东西。' },
  { date: '来到阿克塞尔', title: '带着一顶帽子和一枚硬币出发', desc: '队友换了好几个，帽子一直没换。' },
  ...(siteStore.startDate
    ? [{ date: formatDate(siteStore.startDate, 'YYYY'), title: '开始写这本手记', desc: '因为每次爆炸之后，总有些东西想留下来。' }]
    : []),
])

const stack = [
  { name: 'Vue 3', desc: '组合式 API' },
  { name: 'TypeScript', desc: '类型约束' },
  { name: 'Vite', desc: '构建' },
  { name: 'Pinia', desc: '状态管理' },
  { name: 'Vue Router', desc: '路由与状态持久化' },
  { name: 'Naive UI', desc: '组件库' },
  { name: 'Spring Boot', desc: '服务端' },
  { name: 'MySQL + Redis', desc: '数据与统计' },
]
</script>

<template>
  <div class="about">
    <header class="hero mage-card">
      <div class="portrait">
        <img src="/assets/megumin/megumin-cast.webp" alt="惠惠" />
        <div class="mask-left"></div>
        <div class="mask-right"></div>
        <span class="frame"></span>
      </div>
      <div class="intro">
        <span class="eyebrow"><i class="tag-dot"></i>About · 关于我</span>
        <h1>{{ site.author.name }} <em>{{ site.author.enName }}</em></h1>
        <p class="role">红魔族 · 大魔法使 · 爆裂魔法专精</p>
        <p class="bio">
          我把全部魔力押注在一发爆裂魔法上，也把大部分空闲时间押在这本手记上。
          写咏唱、写旅途、写一顶帽子和一只黑猫。如果你也喜欢把一件事做到极致，欢迎坐下来翻两页。
        </p>
        <div class="facts">
          <div><span>种族</span><strong>红魔族</strong></div>
          <div><span>职业</span><strong>大魔法使</strong></div>
          <div><span>据点</span><strong>{{ site.author.location }}</strong></div>
          <div><span>手记</span><strong>{{ content.publicPosts.length }} 篇</strong></div>
        </div>
        <div class="socials">
          <a v-for="item in site.author.socials" :key="item.label" :href="item.href" target="_blank" rel="noopener">
            <MagicIcon :name="item.icon" :size="15" />
            {{ item.label }}
          </a>
        </div>
      </div>
    </header>

    <div class="duo">
      <section class="stats mage-card">
        <div class="panel-title"><span>Attributes</span><span class="cn">魔法属性</span></div>
        <div class="attr-body">
          <div v-for="item in attributes" :key="item.label" class="attr">
            <div class="attr-head">
              <span>{{ item.label }}</span>
              <em>{{ item.en }}</em>
              <strong>{{ item.value }}</strong>
            </div>
            <div class="bar"><span :style="{ width: `${item.value}%` }"></span></div>
          </div>
        </div>
      </section>

      <section class="numbers mage-card">
        <div class="panel-title"><span>Numbers</span><span class="cn">一些数字</span></div>
        <div class="num-grid">
          <div><strong>{{ content.publicPosts.length }}</strong><span>公开手记</span></div>
          <div><strong>{{ content.collections.length }}</strong><span>综集</span></div>
          <div><strong>{{ interaction.messages.length }}</strong><span>墙上留言</span></div>
          <div><strong>{{ profile.totalDays }}</strong><span>累计签到</span></div>
          <div><strong>{{ profile.streak }}</strong><span>连续签到</span></div>
          <div><strong>{{ profile.uvSummary.uv }}</strong><span>来访旅人</span></div>
        </div>
        <p class="num-note">
          <MagicIcon name="eye" :size="11" />
          访客数据仅统计在本机，不上传任何服务器
        </p>
      </section>
    </div>

    <section class="timeline mage-card">
      <div class="panel-title"><span>Timeline</span><span class="cn">简史</span></div>
      <div class="tl-body">
        <div v-for="(item, i) in timeline" :key="i" class="tl-item">
          <span class="tl-date">{{ item.date }}</span>
          <span class="tl-node"></span>
          <div class="tl-text">
            <strong>{{ item.title }}</strong>
            <p>{{ item.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="scroll-quote" aria-label="手记摘句">
      <div class="scroll-frame">
        <p>「爆炸之后，总有些东西值得留下来。」</p>
        <span>—— 惠惠，写于第三百次爆裂之后</span>
      </div>
    </section>

    <section class="site-info mage-card">
      <div class="panel-title"><span>Colophon</span><span class="cn">关于本站</span></div>
      <div class="info-body">
        <div class="stack">
          <span v-for="item in stack" :key="item.name" class="tech">
            <strong>{{ item.name }}</strong>
            <em>{{ item.desc }}</em>
          </span>
        </div>
        <div class="notes">
          <strong>由于非常喜欢MeguMin,便做了对应的主题Blog</strong>
          <!-- <p>
            <strong>内容</strong>：文章以 Markdown + Frontmatter 存放，构建期打包为静态资源，无后端依赖。
          </p>
          <p>
            <strong>互动</strong>：评论、留言、点赞、签到保存在浏览器本地存储，导出 JSON / ZIP 后可自行迁移。
          </p>
          <p>
            <strong>权限</strong>：访客只能浏览与一级评论；博主可管理内容、置顶留言、盖楼回复。
          </p>
          <p class="easter">
            <MagicIcon name="lock" :size="10" />
            暗门：连续点击左侧头像 5 次，或按下 Ctrl + Shift + L。
          </p> -->
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.about {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hero {
  position: relative;
  padding: 30px;
  display: grid;
  grid-template-columns: 230px minmax(0, 1fr);
  gap: 26px;
  align-items: center;
  overflow: hidden;
}



.portrait {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(217, 172, 88, 0.28);
  box-shadow: 0 24px 40px -26px #000;
  background: radial-gradient(80% 100% at 70% 10%, #7d3040, #2b121b 74%);
}

.portrait img {
  width: 100%;
  height: 300px;
  object-fit: cover;
  object-position: center 18%;
  filter: contrast(1.03) brightness(1) saturate(1.08);
  display: block;
}

.mask-left {
  position: absolute;
  inset: 0;
  clip-path: polygon(0 0, 52% 100%, 0 100%);
  background: rgba(30, 10, 18, 0.7); 
  z-index: 1;
  pointer-events: none;
}

.mask-right {
  position: absolute;
  inset: 0;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 52% 100%);
  background: rgba(30, 10, 18, 0.25);
  z-index: 1;
  pointer-events: none;
}

/* 内部边框 */
.portrait .frame {
  position: absolute;
  inset: 6px;
  border: 1px solid rgba(217, 172, 88, 0.4);
  border-radius: 8px;
  z-index: 2;
  pointer-events: none;
}

.frame {
  position: absolute;
  inset: 7px;
  border: 1px solid rgba(244, 235, 221, 0.25);
  border-radius: 8px;
  pointer-events: none;
}

.intro {
  position: relative;
  z-index: 1;
}

.intro h1 {
  margin: 10px 0 4px;
  font-size: 34px;
  letter-spacing: 0.06em;
}

.intro h1 em {
  font-style: normal;
  font-family: var(--font-display);
  font-size: 13px;
  letter-spacing: 0.3em;
  color: var(--c-gold);
  vertical-align: 6px;
}

.role {
  margin: 0 0 12px;
  font-size: 11px;
  letter-spacing: 0.14em;
  color: var(--c-gold-dim);
}

.bio {
  margin: 0 0 16px;
  font-size: 13px;
  line-height: 1.95;
  color: var(--c-text-2);
  max-width: 560px;
}

.facts {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  padding: 12px 0;
  border-top: 1px solid rgba(217, 172, 88, 0.12);
  border-bottom: 1px solid rgba(217, 172, 88, 0.12);
}

.facts div {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.facts span {
  font-size: 9.5px;
  letter-spacing: 0.12em;
  color: var(--c-muted);
}

.facts strong {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 500;
  color: var(--c-paper);
}

.socials {
  display: flex;
  gap: 8px;
  margin-top: 14px;
  flex-wrap: wrap;
}

.socials a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 13px;
  border-radius: 999px;
  border: 1px solid rgba(217, 172, 88, 0.2);
  background: rgba(20, 16, 26, 0.6);
  color: var(--c-text-2);
  font-size: 11px;
  transition: all 0.24s var(--ease);
}

.socials a:hover {
  color: var(--c-gold-2);
  border-color: rgba(217, 172, 88, 0.5);
  transform: translateY(-1px);
}

.duo {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: 18px;
}

.attr-body {
  padding: 16px 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.attr-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 5px;
  font-size: 11.5px;
  color: var(--c-text-2);
}

.attr-head em {
  font-style: normal;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.1em;
  color: var(--c-muted);
}

.attr-head strong {
  margin-left: auto;
  font-family: var(--font-display);
  font-size: 12px;
  color: var(--c-gold-2);
}

.bar {
  height: 4px;
  border-radius: 99px;
  background: rgba(217, 172, 88, 0.12);
  overflow: hidden;
}

.bar span {
  display: block;
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, #641c2b, #c73c4b 60%, #d9ac58);
  box-shadow: 0 0 10px rgba(199, 60, 75, 0.4);
}

.num-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: rgba(217, 172, 88, 0.12);
  margin: 16px 18px;
  border: 1px solid rgba(217, 172, 88, 0.12);
  border-radius: 10px;
  overflow: hidden;
}

.num-grid div {
  background: rgba(22, 17, 28, 0.9);
  padding: 14px 10px;
  text-align: center;
}

.num-grid strong {
  display: block;
  font-family: var(--font-display);
  font-size: 21px;
  color: var(--c-gold-2);
  line-height: 1.2;
}

.num-grid span {
  font-size: 9.5px;
  letter-spacing: 0.06em;
  color: var(--c-muted);
}

.num-note {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0 18px 16px;
  font-size: 10px;
  color: var(--c-muted);
}

.tl-body {
  padding: 20px 22px 22px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.tl-item {
  display: grid;
  grid-template-columns: 96px 18px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  position: relative;
}

.tl-date {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--c-gold);
  padding-top: 3px;
  text-align: right;
}

.tl-node {
  position: relative;
  width: 9px;
  height: 9px;
  margin: 6px auto 0;
  border-radius: 50%;
  background: var(--c-primary);
  border: 2px solid rgba(242, 219, 166, 0.5);
  box-shadow: 0 0 10px rgba(165, 42, 54, 0.6);
}

.tl-item:not(:last-child) .tl-node::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 12px;
  width: 1px;
  height: calc(100% + 15px);
  transform: translateX(-50%);
  background: linear-gradient(180deg, rgba(217, 172, 88, 0.35), transparent);
}

.tl-text strong {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 500;
  color: var(--c-paper);
}

.tl-text p {
  margin: 3px 0 0;
  font-size: 12px;
  color: var(--c-muted);
}

.scroll-quote {
  position: relative;
  width: min(100%, 660px);
  margin: 0 auto;
  aspect-ratio: 760 / 616;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--tex-scroll) center / 100% 100% no-repeat;
  filter: drop-shadow(0 22px 34px rgba(0, 0, 0, 0.55));
}

.scroll-frame {
  width: 72%;
  margin-top: -2%;
  text-align: center;
  color: #6d3524;
}

.scroll-frame p {
  margin: 0 0 12px;
  font-family: var(--font-display);
  font-size: clamp(14px, 1.4vw, 18px);
  line-height: 1.95;
  letter-spacing: 0.06em;
}

.scroll-frame span {
  font-size: 11px;
  letter-spacing: 0.12em;
  color: #8a5a3f;
}

.info-body {
  padding: 18px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
  gap: 20px;
}

.stack {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  align-content: flex-start;
}

.tech {
  display: flex;
  flex-direction: column;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid rgba(217, 172, 88, 0.16);
  background: rgba(20, 16, 26, 0.6);
}

.tech strong {
  font-family: var(--font-display);
  font-size: 11.5px;
  font-weight: 500;
  color: var(--c-gold-2);
  letter-spacing: 0.04em;
}

.tech em {
  font-style: normal;
  font-size: 9px;
  color: var(--c-muted);
}

.notes p {
  margin: 0 0 8px;
  font-size: 11.5px;
  line-height: 1.8;
  color: var(--c-text-2);
}

.notes strong {
  color: var(--c-paper);
  font-weight: 500;
}

.easter {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--c-gold) !important;
  font-size: 10.5px !important;
  margin-top: 12px !important;
  padding-top: 10px;
  border-top: 1px dashed rgba(217, 172, 88, 0.2);
}

@media (max-width: 1080px) {
  .duo {
    grid-template-columns: 1fr;
  }
  .scroll-quote {
  position: relative;
  width: min(100%, 660px);
  margin: 0 auto;
  aspect-ratio: 760 / 616;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--tex-scroll) center / 100% 100% no-repeat;
  filter: drop-shadow(0 22px 34px rgba(0, 0, 0, 0.55));
}

.scroll-frame {
  width: 72%;
  margin-top: -2%;
  text-align: center;
  color: #6d3524;
}

.scroll-frame p {
  margin: 0 0 12px;
  font-family: var(--font-display);
  font-size: clamp(14px, 1.4vw, 18px);
  line-height: 1.95;
  letter-spacing: 0.06em;
}

.scroll-frame span {
  font-size: 11px;
  letter-spacing: 0.12em;
  color: #8a5a3f;
}

.info-body {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .hero {
    grid-template-columns: 1fr;
    padding: 22px;
  }
  .portrait img {
    height: 240px;
  }
  .intro h1 {
    font-size: 27px;
  }
  .tl-item {
    grid-template-columns: 74px 14px minmax(0, 1fr);
  }
}
</style>
