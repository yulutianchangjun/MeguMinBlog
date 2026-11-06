<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import MagicIcon from '@/components/common/MagicIcon.vue'
import FireRain from '@/components/layout/FireRain.vue'
import { resolveAsset } from '@/lib/asset'
import TypewriterText from '@/components/common/TypewriterText.vue'
import PostCard from '@/components/post/PostCard.vue'
import { site } from '@/data/site'
import { useAuthStore } from '@/stores/auth'
import { useContentStore } from '@/stores/content'
import { useInteractionStore } from '@/stores/interaction'
import { useProfileStore } from '@/stores/profile'
import { toast } from '@/lib/toast'

const router = useRouter()
const content = useContentStore()
const interaction = useInteractionStore()
const profile = useProfileStore()
const auth = useAuthStore()

const lines = [
  '吾名惠惠，红魔族第一的魔法使。',
  '今天也只打算放一发爆裂魔法。',
  '荒野在城外，手记在这里。',
]

const featured = computed(() => {
  const pinned = content.publicPosts.filter((post) => post.pinned)
  const rest = content.publicPosts.filter((post) => !post.pinned)
  return [...pinned, ...rest].slice(0, 3)
})

const marqueeMessages = computed(() => {
  const list = [...interaction.messages].sort((a, b) => {
    if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1
    return b.createdAt - a.createdAt
  })
  return list.slice(0, 5)
})

const achievements = computed(() => profile.badges)
const nextBadge = computed(() => profile.nextBadge)

const progressToNext = computed(() => {
  if (!nextBadge.value) return 100
  const target = nextBadge.value.threshold
  const current = nextBadge.value.key === 'flame' ? profile.streak : profile.totalDays
  return Math.min(100, Math.round((current / target) * 100))
})

const totalMessages = computed(() => interaction.messages.length)

async function checkin() {
  const result = await profile.doCheckin()
  if (result.ok) toast.success(`签到成功 · 已连续 ${result.streak} 天`)
  else if (result.message) toast.error(result.message)
  else toast.info('今天已经签过了，魔力回路需要休息')
}

function goBoard() {
  router.push('/board')
}
</script>

<template>
  <div class="home">
    <section class="hero mage-card">
      <img class="hero-art" src="/assets/megumin/castle-banner.webp" alt="" />
      <div class="hero-veil"></div>
      <span class="hero-dust"></span>
      <FireRain inline :count="54" class="hero-rain" />
      <span class="corner tl"></span>
      <span class="corner tr"></span>
      <span class="corner bl"></span>
      <span class="corner br"></span>

      <div class="hero-content">
        <span class="eyebrow"><i class="tag-dot"></i>Explosion Notes<span class="eyebrow-cn">· 爆裂魔法使的手记</span></span>
        <h1>
          把每一页<br />
          <span class="gold-text">点燃成一场爆炸</span>
        </h1>
        <p class="typing">
          <TypewriterText :lines="lines" :speed="72" :pause="2400" />
        </p>
        <div class="hero-actions">
          <router-link to="/posts" class="btn-magic">
            <MagicIcon name="book" :size="15" />
            翻看日常流
          </router-link>
          <router-link to="/collections" class="btn-magic ghost">
            <MagicIcon name="layers" :size="15" />
            进入综集
          </router-link>
        </div>

        <div class="hero-stats">
          <div>
            <strong>{{ content.publicPosts.length }}</strong>
            <span>手记</span>
          </div>
          <i></i>
          <div>
            <strong>{{ content.collections.length }}</strong>
            <span>综集</span>
          </div>
          <i></i>
          <div>
            <strong>{{ totalMessages }}</strong>
            <span>墙上的留言</span>
          </div>
          <i></i>
          <div>
            <strong>{{ profile.streak }}</strong>
            <span>连续签到</span>
          </div>
        </div>
      </div>

      <div class="hero-tag">
        <img src="/assets/megumin/megumin-chibi.webp" alt="" />
        <div>
          <strong>{{ site.author.name }}</strong>
          <span>{{ site.author.enName }} · Lv.99</span>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <div>
          <span class="eyebrow">Selected</span>
          <h2>近期精选</h2>
        </div>
        <router-link to="/posts" class="more">
          全部手记
          <MagicIcon name="arrowRight" :size="13" />
        </router-link>
      </div>
      <div class="featured">
        <PostCard v-for="post in featured" :key="post.id" :post="post" />
      </div>
    </section>

    <div class="duo">
      <section class="board-teaser mage-card">
        <div class="panel-title">
          <span>Pinned Notes</span>
          <span class="cn">墙上的置顶</span>
        </div>
        <div class="marquee">
          <div class="marquee-track">
            <template v-for="round in 2" :key="round">
              <button
                v-for="msg in marqueeMessages"
                :key="`${round}-${msg.id}`"
                class="marquee-item"
                @click="goBoard"
              >
                <span class="author">
                  <i class="tag-dot"></i>
                  {{ msg.author }}
                  <em v-if="msg.pinned">置顶</em>
                </span>
                <span class="text">{{ msg.content }}</span>
                <span class="dia">◆</span>
              </button>
            </template>
          </div>
        </div>
        <div class="board-foot">
          <span>共 {{ totalMessages }} 张卡片钉在三面墙上</span>
          <button class="btn-magic ghost small" @click="goBoard">
            <MagicIcon name="pin" :size="13" />
            去留言
          </button>
        </div>
      </section>

      <section class="checkin mage-card">
        <div class="panel-title">
          <span>Achievement</span>
          <span class="cn">签到成就</span>
        </div>
        <div class="checkin-body">
          <div class="flame-wrap">
            <MagicIcon name="flame" :size="30" />
            <span class="glow"></span>
          </div>
          <div class="numbers">
            <div>
              <strong>{{ profile.streak }}</strong>
              <span>连续天数</span>
            </div>
            <div>
              <strong>{{ profile.totalDays }}</strong>
              <span>累计签到</span>
            </div>
          </div>
          <div class="badge-row">
            <span
              v-for="badge in achievements"
              :key="badge.key"
              class="badge"
              :class="{ on: badge.achieved }"
              :title="`${badge.label} · ${badge.desc}`"
            >
              <MagicIcon :name="badge.icon" :size="14" />
            </span>
          </div>
          <div class="next">
            <div class="next-head">
              <span>{{ nextBadge ? `距离「${nextBadge.label}」` : '全部徽章已点亮' }}</span>
              <em>{{ progressToNext }}%</em>
            </div>
            <div class="bar"><span :style="{ width: `${progressToNext}%` }"></span></div>
          </div>
          <button v-if="auth.isAdmin" class="btn-magic full" :disabled="profile.checkedToday" @click="checkin">
            <MagicIcon name="flame" :size="14" />
            {{ profile.checkedToday ? '今日已签到' : '签到打卡' }}
          </button>
          <p v-else class="guest-note">
            <MagicIcon name="lock" :size="10" />
            签到由博主本人完成，访客可查看成就
          </p>
        </div>
      </section>
    </div>

    <section class="section">
      <div class="section-head">
        <div>
          <span class="eyebrow">Series</span>
          <h2>综集速览</h2>
        </div>
        <router-link to="/collections" class="more">
          全部综集
          <MagicIcon name="arrowRight" :size="13" />
        </router-link>
      </div>
      <div class="series">
        <router-link
          v-for="item in content.collections"
          :key="item.id"
          :to="`/collections/${item.id}`"
          class="series-card mage-card"
        >
          <div class="series-cover">
            <template v-if="item.cover">
              <img class="series-blur" :src="resolveAsset(item.cover)" alt="" aria-hidden="true" loading="lazy" />
              <img class="series-main" :src="resolveAsset(item.cover)" :alt="item.title" loading="lazy" />
            </template>
            <div class="series-veil"></div>
            <span class="series-rune">{{ item.runes }}</span>
          </div>
          <div class="series-body">
            <span class="series-en">{{ item.subtitle }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
            <span class="series-count">
              {{ content.publicPosts.filter((p) => p.collections.includes(item.id)).length }} 篇
              <MagicIcon name="arrowRight" :size="12" />
            </span>
          </div>
        </router-link>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 26px;
}

/* ---------- Hero ---------- */

.hero {
  position: relative;
  min-height: 430px;
  padding: 46px 44px;
  display: flex;
  align-items: center;
  overflow: hidden;
  border-color: rgba(217, 172, 88, 0.26);
  background:
    radial-gradient(90% 120% at 92% 10%, rgba(165, 42, 54, 0.4), transparent 62%),
    linear-gradient(150deg, #2a1a26 0%, #1b1520 48%, #141019 100%);
  isolation: isolate;
}

.hero-art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  transform: scale(1.02);
  filter: blur(0.5px) brightness(1.12) saturate(1.06) contrast(1.02);
  z-index: 0;
  pointer-events: none;
}

.hero-veil {
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    linear-gradient(96deg, rgba(12, 8, 16, 0.8) 0%, rgba(12, 8, 16, 0.46) 44%, rgba(12, 8, 16, 0.08) 100%),
    linear-gradient(180deg, rgba(12, 8, 16, 0.04) 0%, rgba(12, 8, 16, 0.14) 58%, rgba(12, 8, 16, 0.58) 100%);
}

.hero-dust {
  position: absolute;
  right: 2%;
  bottom: 0;
  width: 44%;
  height: 30%;
  background: var(--tex-stardust) right bottom / contain no-repeat;
  opacity: 0.26;
  z-index: 2;
  filter: drop-shadow(0 0 12px rgba(255, 176, 84, 0.3));
  animation: dustFloat 9s ease-in-out infinite;
  pointer-events: none;
}

.hero-rain {
  position: absolute;
  z-index: 2;
}

@keyframes dustFloat {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.22; }
  50% { transform: translateY(-8px) scale(1.02); opacity: 0.32; }
}


.hero-content {
  position: relative;
  z-index: 3;
  max-width: 560px;
}

.eyebrow-cn {
  margin-left: 2px;
}

@media (max-width: 560px) {
  .eyebrow-cn {
    display: none;
  }
}

.hero h1 {
  margin: 14px 0 16px;
  font-size: clamp(30px, 3.4vw, 44px);
  line-height: 1.34;
  letter-spacing: 0.06em;
  text-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
}

.typing {
  min-height: 52px;
  margin: 0 0 22px;
  font-family: var(--font-display);
  font-size: 14px;
  letter-spacing: 0.08em;
  color: #e6d9c9;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7);
}

.hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.hero-stats {
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 30px;
  padding-top: 16px;
  border-top: 1px solid rgba(217, 172, 88, 0.16);
  max-width: 430px;
}

.hero-stats div {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.hero-stats strong {
  font-family: var(--font-display);
  font-size: 19px;
  color: var(--c-gold-2);
  line-height: 1.1;
}

.hero-stats span {
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--c-muted);
}

.hero-stats i {
  width: 1px;
  height: 26px;
  background: linear-gradient(180deg, transparent, rgba(217, 172, 88, 0.3), transparent);
}

.hero-tag {
  position: absolute;
  right: 28px;
  bottom: 24px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 6px 14px 6px 6px;
  border-radius: 999px;
  border: 1px solid rgba(217, 172, 88, 0.3);
  background: rgba(16, 12, 21, 0.62);
  backdrop-filter: blur(5px);
}

.hero-tag img {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
  object-position: center 15%;
  border: 1px solid rgba(217, 172, 88, 0.4);
}

.hero-tag strong {
  display: block;
  font-family: var(--font-display);
  font-size: 12px;
  letter-spacing: 0.08em;
  color: var(--c-paper);
  line-height: 1.3;
}

.hero-tag span {
  display: block;
  font-family: var(--font-mono);
  font-size: 8.5px;
  letter-spacing: 0.14em;
  color: var(--c-gold);
}

.corner {
  position: absolute;
  width: 26px;
  height: 26px;
  border: 1px solid rgba(217, 172, 88, 0.45);
  z-index: 4;
}

.corner.tl {
  top: 10px;
  left: 10px;
  border-right: 0;
  border-bottom: 0;
}

.corner.tr {
  top: 10px;
  right: 10px;
  border-left: 0;
  border-bottom: 0;
}

.corner.bl {
  bottom: 10px;
  left: 10px;
  border-right: 0;
  border-top: 0;
}

.corner.br {
  bottom: 10px;
  right: 10px;
  border-left: 0;
  border-top: 0;
}

/* ---------- 通用区块 ---------- */

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.section-head h2 {
  margin-top: 4px;
  font-size: 22px;
  letter-spacing: 0.06em;
}

.more {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  letter-spacing: 0.06em;
  color: var(--c-text-2);
  padding-bottom: 3px;
  border-bottom: 1px dashed rgba(217, 172, 88, 0.28);
  transition: all 0.24s var(--ease);
}

.more:hover {
  color: var(--c-gold-2);
  gap: 8px;
}

.featured {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.duo {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: 18px;
}

/* ---------- 留言走马灯 ---------- */

.board-teaser {
  display: flex;
  flex-direction: column;
}

.marquee {
  flex: 1;
  display: flex;
  align-items: center;
  overflow: hidden;
  padding: 14px 0 16px;
  mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent);
}

.marquee-track {
  display: flex;
  align-items: stretch;
  gap: 12px;
  width: max-content;
  padding-left: 18px;
  animation: marquee 52s linear infinite;
}

.marquee:hover .marquee-track {
  animation-play-state: paused;
}

.marquee-item {
  flex: 0 0 252px;
  min-height: 136px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 14px 16px 12px;
  border-radius: 12px;
  border: 1px solid rgba(217, 172, 88, 0.16);
  background:
    linear-gradient(158deg, rgba(52, 38, 46, 0.62), rgba(24, 19, 30, 0.78));
  color: var(--c-text-2);
  font-size: 12.5px;
  text-align: left;
  white-space: normal;
  cursor: pointer;
  transition: border-color 0.26s var(--ease), transform 0.26s var(--ease), background 0.26s var(--ease);
}

.marquee-item:nth-child(even) {
  transform: rotate(-0.4deg);
}

.marquee-item:hover {
  border-color: rgba(217, 172, 88, 0.42);
  background: linear-gradient(158deg, rgba(70, 44, 52, 0.7), rgba(28, 21, 34, 0.85));
  transform: translateY(-3px) rotate(0deg);
}

.marquee-item .author {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--c-gold-2);
  font-family: var(--font-display);
  font-size: 11.5px;
  letter-spacing: 0.06em;
}

.marquee-item .author em {
  font-style: normal;
  font-size: 8.5px;
  letter-spacing: 0.04em;
  padding: 0 5px;
  border-radius: 4px;
  border: 1px solid rgba(242, 219, 166, 0.35);
  color: var(--c-gold);
}

.marquee-item .text {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.9;
  font-size: 12px;
  color: var(--c-text-2);
  transition: color 0.24s var(--ease);
}

.marquee-item:hover .text {
  color: var(--c-paper);
}

.marquee-item .dia {
  margin-top: auto;
  align-self: flex-end;
  font-size: 9px;
  color: rgba(217, 172, 88, 0.5);
}

.marquee-item .dia {
  color: rgba(217, 172, 88, 0.45);
  font-size: 8px;
}

.board-foot {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 18px 16px;
  border-top: 1px dashed rgba(217, 172, 88, 0.14);
  font-size: 11px;
  color: var(--c-muted);
}

.btn-magic.small {
  padding: 6px 13px;
  font-size: 11px;
}

/* ---------- 签到 ---------- */

.checkin-body {
  padding: 16px 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.flame-wrap {
  position: relative;
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid rgba(217, 172, 88, 0.3);
  background: radial-gradient(circle, rgba(165, 42, 54, 0.45), rgba(20, 15, 26, 0.8));
  color: #f0b45a;
}

.flame-wrap .glow {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(217, 172, 88, 0.28), transparent 70%);
  animation: breathe 3.2s ease-in-out infinite;
}

.numbers {
  display: flex;
  gap: 26px;
}

.numbers strong {
  display: block;
  font-family: var(--font-display);
  font-size: 26px;
  line-height: 1.1;
  color: var(--c-gold-2);
}

.numbers span {
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--c-muted);
}

.badge-row {
  display: flex;
  gap: 8px;
}

.badge {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid rgba(217, 172, 88, 0.14);
  background: rgba(18, 14, 24, 0.7);
  color: #544a4a;
  transition: all 0.3s var(--ease);
}

.badge.on {
  color: #2a1118;
  background: linear-gradient(150deg, #f2dba6, #c9973f);
  border-color: rgba(242, 219, 166, 0.8);
  box-shadow: 0 0 14px rgba(217, 172, 88, 0.35);
}

.next-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10.5px;
  color: var(--c-muted);
  margin-bottom: 6px;
}

.next-head em {
  font-style: normal;
  font-family: var(--font-mono);
  color: var(--c-gold);
}

.bar {
  height: 4px;
  border-radius: 99px;
  background: rgba(217, 172, 88, 0.14);
  overflow: hidden;
}

.bar span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #641c2b, #d9ac58);
  transition: width 0.6s var(--ease);
}

.btn-magic.full {
  width: 100%;
  padding: 9px;
  font-size: 12px;
}

.btn-magic.full:disabled {
  opacity: 0.55;
  cursor: default;
}

.guest-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin: 0;
  padding-top: 2px;
  font-size: 10px;
  color: var(--c-muted);
  letter-spacing: 0.03em;
}

/* ---------- 综集 ---------- */

.series {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.series-card {
  display: flex;
  flex-direction: column;
  transition: transform 0.34s var(--ease), border-color 0.34s var(--ease);
}

.series-card:hover {
  transform: translateY(-3px);
  border-color: rgba(217, 172, 88, 0.4);
}

.series-cover {
  position: relative;
  height: 132px;
  padding: 8px 8px 0;
  overflow: hidden;
  background:
    radial-gradient(90% 86% at 50% 0%, rgba(120, 48, 58, 0.42), rgba(24, 17, 25, 0.96) 74%),
    linear-gradient(160deg, #241a24, #171220);
}

.series-blur {
  position: absolute;
  inset: -10%;
  width: 120%;
  height: 120%;
  object-fit: cover;
  filter: blur(8px) brightness(0.48) saturate(1.06);
  opacity: 0.75;
}

.series-main {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 6px 6px 0 0;
  border: 1px solid rgba(217, 172, 88, 0.12);
  border-bottom: 0;
  background: rgba(11, 8, 14, 0.4);
  filter: brightness(0.98) saturate(1.02);
  transition: transform 0.55s var(--ease);
}

.series-card:hover .series-main {
  transform: scale(1.03);
}

.series-veil {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background: linear-gradient(180deg, transparent 62%, rgba(22, 17, 27, 0.6) 100%);
}

.series-rune {
  position: absolute;
  z-index: 3;
  left: 14px;
  bottom: 10px;
  font-family: var(--font-display);
  font-size: 9px;
  letter-spacing: 0.42em;
  color: rgba(242, 219, 166, 0.6);
}

.series-body {
  padding: 12px 16px 16px;
}

.series-en {
  font-family: var(--font-display);
  font-size: 8.5px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--c-gold-dim);
}

.series-body h3 {
  margin: 4px 0 6px;
  font-size: 16px;
  letter-spacing: 0.04em;
}

.series-body p {
  margin: 0 0 10px;
  font-size: 11.5px;
  line-height: 1.7;
  color: var(--c-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.series-count {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--c-gold);
}

@keyframes marquee {
  to {
    transform: translateX(calc(-50% - 6px));
  }
}

@keyframes breathe {
  0%,
  100% {
    opacity: 0.45;
    transform: scale(0.96);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.05);
  }
}

@media (max-width: 1180px) {
  .featured,
  .series {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .featured > :last-child,
  .series > :last-child {
    display: none;
  }
}

@media (max-width: 900px) {
  .hero {
    padding: 34px 26px 30px;
    min-height: 0;
  }
  .hero-art {
    object-position: 64% center;
    filter: brightness(1.02) saturate(1.02);
  }
  .hero-veil {
    background:
      linear-gradient(100deg, rgba(12, 8, 16, 0.88) 22%, rgba(12, 8, 16, 0.6) 68%, rgba(12, 8, 16, 0.32) 100%),
      linear-gradient(180deg, rgba(12, 8, 16, 0.06), rgba(12, 8, 16, 0.62));
  }
  .hero-dust {
    display: none;
  }
  .hero-stats {
    gap: 12px;
    flex-wrap: wrap;
  }
  .hero-tag {
    display: none;
  }
  .duo {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .featured,
  .series {
    grid-template-columns: 1fr;
  }
  .featured > :last-child,
  .series > :last-child {
    display: flex;
  }
}
</style>
