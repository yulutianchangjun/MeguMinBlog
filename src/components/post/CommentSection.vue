<script setup lang="ts">
import { computed, ref } from 'vue'
import MagicIcon from '@/components/common/MagicIcon.vue'
import GiscusThread from '@/components/post/GiscusThread.vue'
import TurnstileGate from '@/components/post/TurnstileGate.vue'
import { discussionsUrl, giscusReady, site } from '@/data/site'
import { hasGuardPass, markGuardPass } from '@/lib/guard'

const props = defineProps<{ postId: string }>()

const siteKey = site.turnstile.siteKey
const verified = ref(!siteKey || hasGuardPass())
const count = ref<number | null>(null)

function onVerified() {
  verified.value = true
  markGuardPass()
}

const totalLabel = computed(() => (count.value === null ? '' : `${count.value} 条`))
</script>

<template>
  <section id="comments" class="comments mage-card">
    <div class="panel-title">
      <span>Comments</span>
      <span class="cn">评论<span v-if="totalLabel"> · {{ totalLabel }}</span></span>
    </div>

    <div class="github-note">
      <span class="gh"><MagicIcon name="github" :size="14" /></span>
      <p>
        评论保存在 GitHub Discussions，需要<strong>登录 GitHub 账号</strong>才能发言；本站不收集邮箱，也没有匿名入口。
      </p>
      <a :href="discussionsUrl" target="_blank" rel="noopener noreferrer" class="gh-link">
        去 Discussions
        <MagicIcon name="external" :size="11" />
      </a>
    </div>

    <template v-if="giscusReady">
      <TurnstileGate v-if="siteKey && !verified" :site-key="siteKey" @verified="onVerified" />
      <GiscusThread v-else :term="props.postId" @count="count = $event" />
    </template>

    <div v-else class="setup">
      <span class="setup-badge"><MagicIcon name="lock" :size="16" /></span>
      <div class="setup-main">
        <h3>评论还没接通 GitHub Discussions</h3>
        <p>
          代码已经接好 giscus，只差三项配置。填完
          <code>src/data/site.ts</code> 里的
          <code>comments.repoId</code> 与 <code>comments.categoryId</code>
          后，这里会自动变成真正的讨论区。
        </p>
        <ol>
          <li>仓库 Settings → Features 勾选 <strong>Discussions</strong>，新建 <code>Comments</code> 分类</li>
          <li>安装 <a href="https://github.com/apps/giscus" target="_blank" rel="noopener noreferrer">giscus App</a> 并授权该仓库</li>
          <li>在 <a href="https://giscus.app/zh-CN" target="_blank" rel="noopener noreferrer">giscus.app</a> 填入仓库，复制 <code>data-repo-id</code> 与 <code>data-category-id</code></li>
        </ol>
      </div>
    </div>

    <div class="foot">
      <MagicIcon name="spark" :size="11" />
      <span v-if="giscusReady">由 giscus 驱动 · 评论直接写入 GitHub，不经过本站服务器</span>
      <span v-else>未配置时评论区只展示这段说明，不会回退到本地假评论</span>
    </div>
  </section>
</template>

<style scoped>
.comments {
  padding-bottom: 6px;
  scroll-margin-top: calc(var(--header-h) + 16px);
}

.github-note {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 14px 14px 12px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(217, 172, 88, 0.14);
  background: linear-gradient(100deg, rgba(165, 42, 54, 0.14), rgba(24, 19, 31, 0.4));
}

.gh {
  width: 28px;
  height: 28px;
  flex: none;
  display: inline-grid;
  place-items: center;
  border-radius: 8px;
  border: 1px solid rgba(217, 172, 88, 0.24);
  background: rgba(12, 9, 16, 0.5);
  color: var(--c-gold-2);
}

.github-note p {
  margin: 0;
  flex: 1;
  min-width: 0;
  font-size: 10.5px;
  line-height: 1.7;
  color: var(--c-text-2);
}

.github-note strong {
  color: var(--c-gold-2);
  font-weight: 500;
}

.gh-link {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  letter-spacing: 0.04em;
  color: var(--c-gold);
}

.gh-link:hover {
  color: var(--c-gold-2);
}

.setup {
  display: flex;
  gap: 14px;
  margin: 0 14px 12px;
  padding: 18px 18px 16px;
  border-radius: 12px;
  border: 1px dashed rgba(217, 172, 88, 0.26);
  background:
    radial-gradient(120% 100% at 8% 0%, rgba(165, 42, 54, 0.16), transparent 62%),
    rgba(12, 9, 16, 0.45);
}

.setup-badge {
  width: 38px;
  height: 38px;
  flex: none;
  display: inline-grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid rgba(217, 172, 88, 0.35);
  background: radial-gradient(circle, rgba(165, 42, 54, 0.45), rgba(20, 15, 26, 0.8));
  color: var(--c-gold-2);
}

.setup-main {
  min-width: 0;
}

.setup-main h3 {
  margin: 2px 0 6px;
  font-size: 15px;
  letter-spacing: 0.04em;
}

.setup-main p {
  margin: 0 0 10px;
  font-size: 11.5px;
  line-height: 1.85;
  color: var(--c-text-2);
}

.setup-main ol {
  margin: 0 0 12px;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 11px;
  line-height: 1.7;
  color: var(--c-muted);
}

.setup-main code {
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 3px;
  background: rgba(217, 172, 88, 0.1);
  color: var(--c-gold-2);
}

.setup-main a:not(.btn-magic) {
  color: var(--c-gold-2);
  border-bottom: 1px dashed rgba(217, 172, 88, 0.4);
}

.small {
  padding: 5px 12px;
  font-size: 11px;
}

.foot {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px 14px;
  border-top: 1px dashed rgba(217, 172, 88, 0.12);
  font-size: 10px;
  color: var(--c-muted);
}

@media (max-width: 640px) {
  .github-note {
    flex-wrap: wrap;
  }
  .gh-link {
    margin-left: 38px;
  }
  .setup {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
