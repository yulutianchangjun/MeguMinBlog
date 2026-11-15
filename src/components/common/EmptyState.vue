<script setup lang="ts">
import MagicIcon from '@/components/common/MagicIcon.vue'

/**
 * 统一空状态：无内容时的占位说明。
 * 全站一致的结构 —— 插画/图标 + 标题 + 说明 + 可选动作。
 * compact 用于卡片内部（如侧栏小组件），非 compact 用于页面主区块。
 */
withDefaults(
  defineProps<{
    /** 图标名（与 MagicIcon 一致），与 image 二选一 */
    icon?: string
    /** 插画路径，优先于 icon */
    image?: string
    title?: string
    description?: string
    actionText?: string
    actionTo?: string
    /** 紧凑模式：更小的间距与字号 */
    compact?: boolean
  }>(),
  { icon: 'spark', compact: false },
)
</script>

<template>
  <div class="empty-state" :class="{ compact }">
    <img v-if="image" class="art-img" :src="image" :alt="title || '空状态'" loading="lazy" />
    <span v-else class="art">
      <MagicIcon :name="icon" :size="compact ? 18 : 26" />
    </span>

    <strong v-if="title" class="title">{{ title }}</strong>
    <p v-if="description" class="desc">{{ description }}</p>

    <router-link v-if="actionText && actionTo" :to="actionTo" class="action">
      {{ actionText }}
      <MagicIcon name="arrowRight" :size="12" />
    </router-link>

    <slot />
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 44px 26px;
  text-align: center;
  border-radius: var(--r-lg);
  border: 1px dashed var(--c-line);
  background: rgba(26, 21, 34, 0.35);
  color: var(--c-text-2);
}

.empty-state.compact {
  gap: 8px;
  padding: 26px 18px;
}

.art {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 1px solid var(--c-line);
  background: rgba(217, 172, 88, 0.06);
  color: var(--c-gold);
}

.compact .art {
  width: 36px;
  height: 36px;
}

.art-img {
  width: 118px;
  max-width: 60%;
  height: auto;
  opacity: 0.9;
  filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.45));
}

.compact .art-img {
  width: 84px;
}

.title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 500;
  color: var(--c-paper);
}

.compact .title {
  font-size: 12.5px;
}

.desc {
  margin: 0;
  max-width: 460px;
  font-size: 12.5px;
  line-height: 1.9;
  color: var(--c-muted);
}

.compact .desc {
  font-size: 11.5px;
  line-height: 1.8;
}

.action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  font-size: 12px;
  color: var(--c-gold);
  transition: color 0.2s var(--ease);
}

.action:hover {
  color: var(--c-gold-2);
}
</style>
