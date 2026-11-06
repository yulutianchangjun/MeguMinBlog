<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import MagicIcon from '@/components/common/MagicIcon.vue'
import { site } from '@/data/site'
import { useAuthStore } from '@/stores/auth'
import { useContentStore } from '@/stores/content'
import { useProfileStore } from '@/stores/profile'
import { useUiStore } from '@/stores/ui'
import { toast } from '@/lib/toast'

const auth = useAuthStore()
const content = useContentStore()
const profile = useProfileStore()
const ui = useUiStore()
const router = useRouter()

const clickCount = ref(0)
let clickTimer: number | undefined

const postCount = computed(() => content.publicPosts.length)

function handleAvatarClick() {
  clickCount.value += 1
  window.clearTimeout(clickTimer)
  clickTimer = window.setTimeout(() => {
    clickCount.value = 0
  }, 1600)
  if (clickCount.value >= 5) {
    clickCount.value = 0
    if (auth.isAdmin) ui.openAdmin('posts')
    else ui.openLogin()
  }
}

async function checkin() {
  const result = await profile.doCheckin()
  if (result.ok) {
    toast.success(`签到成功 · 已连续 ${result.streak} 天，魔力回路已更新`)
  } else if (result.message) {
    toast.error(result.message)
  } else {
    toast.info('今天已经签过了，魔力回路需要休息')
  }
}

onBeforeUnmount(() => window.clearTimeout(clickTimer))
</script>

<template>
  <section class="profile mage-card">
    <div class="banner">
      <img src="/assets/megumin/castle-banner.webp" alt="" />
      <div class="banner-fade"></div>
      <span class="banner-rune">MEGUMIN</span>
    </div>

    <div class="body">
      <button class="avatar" @click="handleAvatarClick">
        <img :src="site.author.avatar" :alt="site.author.name" />
        <span class="avatar-ring"></span>
        <span v-if="auth.isAdmin" class="crown"><MagicIcon name="shield" :size="12" /></span>
      </button>

      <div class="name-row">
        <h3>{{ site.author.name }}</h3>
        <span class="en">{{ site.author.enName }}</span>
      </div>
      <p class="role">红魔族 · 爆裂魔法专精</p>
      <p class="bio">{{ site.author.bio }}</p>

      <div class="stats">
        <div class="stat">
          <strong>{{ postCount }}</strong>
          <span>手记</span>
        </div>
        <div class="stat">
          <strong>{{ profile.totalDays }}</strong>
          <span>累计签到</span>
        </div>
        <div class="stat">
          <strong>{{ profile.streak }}</strong>
          <span>连续天数</span>
        </div>
      </div>

      <div class="badges">
        <span
          v-for="badge in profile.badges"
          :key="badge.key"
          class="badge"
          :class="{ on: badge.achieved }"
          :title="`${badge.label} · ${badge.desc}`"
        >
          <MagicIcon :name="badge.icon" :size="13" />
        </span>
        <span class="badge-text">
          {{ profile.nextBadge ? `下一个徽章：${profile.nextBadge.label}` : '全部徽章已点亮' }}
        </span>
      </div>

      <div class="divider"></div>

      <div class="actions">
        <button v-if="auth.isAdmin" class="btn-magic checkin" :disabled="profile.checkedToday" @click="checkin">
          <MagicIcon name="flame" :size="15" />
          {{ profile.checkedToday ? '今日已签到' : '签到打卡' }}
        </button>
        <span v-else class="guest-note">
          <MagicIcon name="flame" :size="14" />
          博主已连续签到 {{ profile.streak }} 天
        </span>
        <button class="btn-magic ghost about-btn" @click="router.push('/about')">关于我</button>
      </div>

      <div class="socials">
        <a
          v-for="item in site.author.socials"
          :key="item.label"
          :href="item.href"
          class="social"
          target="_blank"
          rel="noopener"
          :title="item.label"
        >
          <MagicIcon :name="item.icon" :size="16" />
        </a>
        <span class="location">
          <MagicIcon name="pin" :size="13" />
          {{ site.author.location }}
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.profile {
  position: relative;
}

.banner {
  position: relative;
  height: 96px;
  overflow: hidden;
}

.banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 40%;
  filter: saturate(0.85) brightness(0.72);
}

.banner-fade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(23, 21, 28, 0.1) 0%, rgba(26, 22, 33, 0.9) 82%, #1a1621 100%),
    linear-gradient(90deg, rgba(165, 42, 54, 0.35), transparent 70%);
}

.banner-rune {
  position: absolute;
  right: 14px;
  bottom: 8px;
  font-family: var(--font-display);
  font-size: 9px;
  letter-spacing: 0.42em;
  color: rgba(242, 219, 166, 0.55);
}

.body {
  position: relative;
  padding: 0 18px 18px;
  margin-top: -34px;
}

.avatar {
  position: relative;
  width: 74px;
  height: 74px;
  padding: 0;
  border-radius: 50%;
  border: 2px solid rgba(217, 172, 88, 0.65);
  background: #221b28;
  cursor: pointer;
  overflow: visible;
  box-shadow: 0 12px 26px -14px #000, 0 0 0 5px rgba(23, 21, 28, 0.9);
  transition: transform 0.3s var(--ease);
}

.avatar:hover {
  transform: translateY(-2px) scale(1.02);
}

.avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  object-position: center 12%;
}

.avatar-ring {
  position: absolute;
  inset: -7px;
  border-radius: 50%;
  border: 1px dashed rgba(217, 172, 88, 0.35);
  animation: ringSpin 30s linear infinite;
}

.crown {
  position: absolute;
  right: -4px;
  bottom: -2px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: linear-gradient(140deg, #a52a36, #641c2b);
  color: var(--c-gold-2);
  border: 1px solid rgba(217, 172, 88, 0.6);
}

.name-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 12px;
}

.name-row h3 {
  font-size: 20px;
  letter-spacing: 0.06em;
}

.en {
  font-family: var(--font-display);
  font-size: 9.5px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--c-gold);
  opacity: 0.8;
}

.role {
  margin: 2px 0 8px;
  font-size: 11.5px;
  letter-spacing: 0.1em;
  color: var(--c-gold-dim);
}

.bio {
  margin: 0 0 14px;
  font-size: 12.5px;
  line-height: 1.85;
  color: var(--c-text-2);
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 10px 0;
  border-top: 1px solid rgba(217, 172, 88, 0.12);
  border-bottom: 1px solid rgba(217, 172, 88, 0.12);
}

.stat {
  text-align: center;
}

.stat strong {
  display: block;
  font-family: var(--font-display);
  font-size: 18px;
  color: var(--c-gold-2);
  line-height: 1.2;
}

.stat span {
  font-size: 10.5px;
  color: var(--c-muted);
  letter-spacing: 0.06em;
}

.badges {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.badge {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid rgba(217, 172, 88, 0.16);
  color: #564a4a;
  background: rgba(20, 16, 25, 0.6);
  transition: all 0.3s var(--ease);
}

.badge.on {
  color: #2a1118;
  background: linear-gradient(150deg, #f2dba6, #c9973f);
  border-color: rgba(242, 219, 166, 0.8);
  box-shadow: 0 0 12px rgba(217, 172, 88, 0.35);
}

.badge-text {
  margin-left: auto;
  font-size: 10px;
  color: var(--c-muted);
  letter-spacing: 0.02em;
}

.divider {
  height: 1px;
  margin: 14px 0 12px;
  background: linear-gradient(90deg, transparent, rgba(217, 172, 88, 0.3), transparent);
}

.actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.checkin,
.about-btn {
  flex: 1;
  padding: 8px 12px;
  font-size: 12px;
}

.checkin:disabled {
  opacity: 0.55;
  cursor: default;
  box-shadow: none;
}

.guest-note {
  flex: 1;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border-radius: 999px;
  border: 1px dashed rgba(217, 172, 88, 0.22);
  color: var(--c-gold-2);
  font-size: 11.5px;
}

.socials {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}

.social {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid rgba(217, 172, 88, 0.16);
  color: var(--c-text-2);
  transition: all 0.24s var(--ease);
}

.social:hover {
  color: var(--c-gold-2);
  border-color: rgba(217, 172, 88, 0.45);
  transform: translateY(-1px);
}

.location {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10.5px;
  color: var(--c-muted);
}

@keyframes ringSpin {
  to {
    transform: rotate(360deg);
  }
}
</style>
