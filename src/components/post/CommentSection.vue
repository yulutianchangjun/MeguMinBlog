<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import MagicIcon from '@/components/common/MagicIcon.vue'
import TurnstileWidget from '@/components/post/TurnstileWidget.vue'
import { publicApi, adminApi, type ApiComment } from '@/api'
import { site } from '@/data/site'
import { formatDate } from '@/lib/format'
import { apiReady } from '@/lib/http'
import { toast } from '@/lib/toast'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{ postId: string }>()

const auth = useAuthStore()
const siteKey = site.turnstile.siteKey

const comments = ref<ApiComment[]>([])
const loading = ref(false)
const submitting = ref(false)
const cfToken = ref('')

const form = ref({
  author: localStorage.getItem('mgm:board-name') ?? '',
  content: '',
})

const count = computed(() => comments.value.length)

async function load() {
  if (!apiReady) return
  loading.value = true
  try {
    comments.value = await publicApi.comments(props.postId)
  } catch {
    comments.value = []
  } finally {
    loading.value = false
  }
}

function onVerified(token: string) {
  cfToken.value = token
}

async function submit() {
  const author = form.value.author.trim()
  const content = form.value.content.trim()
  if (author.length < 2) {
    toast.warning('昵称至少 2 个字符')
    return
  }
  if (content.length < 2) {
    toast.warning('评论内容太短了')
    return
  }
  if (siteKey && !cfToken.value) {
    toast.warning('请先完成人机校验')
    return
  }
  submitting.value = true
  try {
    await publicApi.createComment(props.postId, {
      author,
      content,
      turnstileToken: cfToken.value || undefined,
    })
    localStorage.setItem('mgm:board-name', author)
    form.value.content = ''
    cfToken.value = ''
    await load()
    toast.success('评论已发表')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : '评论失败，请稍后再试')
  } finally {
    submitting.value = false
  }
}

async function remove(id: number) {
  try {
    await adminApi.deleteComment(id)
    comments.value = comments.value.filter((item) => item.id !== id)
    toast.success('评论已删除')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : '删除失败')
  }
}

onMounted(load)
watch(() => props.postId, load)
</script>

<template>
  <section id="comments" class="comments mage-card">
    <div class="panel-title">
      <span>Comments</span>
      <span class="cn">评论<span v-if="count"> · {{ count }} 条</span></span>
    </div>

    <div v-if="apiReady" class="composer">
      <div class="fields">
        <input
          v-model="form.author"
          class="name-input"
          type="text"
          maxlength="20"
          placeholder="你的昵称（2~20 字）"
        />
        <textarea
          v-model="form.content"
          class="content-input"
          maxlength="1000"
          rows="3"
          placeholder="写下你的评论（2~1000 字，支持换行）"
        ></textarea>
      </div>
      <div class="composer-foot">
        <TurnstileWidget v-if="siteKey" :site-key="siteKey" @verified="onVerified" />
        <div class="actions">
          <span class="hint">{{ form.content.length }}/1000</span>
          <button class="btn-magic" :disabled="submitting" @click="submit">
            <MagicIcon name="spark" :size="12" />
            {{ submitting ? '发表中…' : '发表评论' }}
          </button>
        </div>
      </div>
    </div>

    <p v-else class="offline">后端未连接，评论暂不可用。</p>

    <div class="thread">
      <p v-if="loading" class="empty">正在取回评论…</p>
      <p v-else-if="!comments.length" class="empty">还没有人留下评论，第一层楼留给你。</p>
      <article v-for="(item, index) in comments" :key="item.id" class="floor">
        <div class="floor-head">
          <span class="floor-no">#{{ index + 1 }}</span>
          <strong class="floor-author">{{ item.author }}</strong>
          <time class="floor-time">{{ formatDate(item.createdAt) }}</time>
          <button
            v-if="auth.isAdmin"
            class="floor-del"
            title="删除评论"
            @click="remove(item.id)"
          >
            <MagicIcon name="trash" :size="11" />
          </button>
        </div>
        <p class="floor-content">{{ item.content }}</p>
      </article>
    </div>

    <div class="foot">
      <MagicIcon name="spark" :size="11" />
      <span>评论保存在本站数据库 · 发布后即时可见</span>
    </div>
  </section>
</template>

<style scoped>
.comments {
  padding-bottom: 6px;
  scroll-margin-top: calc(var(--header-h) + 16px);
}

.composer {
  margin: 14px 14px 12px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(217, 172, 88, 0.16);
  background:
    radial-gradient(120% 100% at 8% 0%, rgba(165, 42, 54, 0.14), transparent 62%),
    rgba(12, 9, 16, 0.45);
}

.fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.name-input,
.content-input {
  width: 100%;
  border-radius: 8px;
  border: 1px solid rgba(217, 172, 88, 0.2);
  background: rgba(12, 9, 16, 0.55);
  color: var(--c-text);
  font: inherit;
  padding: 8px 12px;
  outline: none;
  transition: border-color 0.2s;
}

.name-input:focus,
.content-input:focus {
  border-color: rgba(217, 172, 88, 0.55);
}

.name-input {
  max-width: 260px;
}

.content-input {
  resize: vertical;
  min-height: 72px;
  line-height: 1.7;
}

.composer-foot {
  margin-top: 12px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.hint {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--c-muted);
}

.offline {
  margin: 14px;
  padding: 12px;
  border-radius: 10px;
  border: 1px dashed rgba(165, 42, 54, 0.4);
  font-size: 11.5px;
  color: var(--c-muted);
  text-align: center;
}

.thread {
  margin: 0 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 460px;
  overflow-y: auto;
}

.empty {
  margin: 6px 0;
  padding: 14px 0 8px;
  text-align: center;
  font-size: 11.5px;
  color: var(--c-muted);
}

.floor {
  padding: 10px 12px 11px;
  border-radius: 10px;
  border: 1px solid rgba(217, 172, 88, 0.1);
  background: rgba(12, 9, 16, 0.35);
}

.floor-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.floor-no {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--c-gold);
}

.floor-author {
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--c-gold-2);
}

.floor-time {
  margin-left: auto;
  font-size: 10px;
  color: var(--c-muted);
}

.floor-del {
  width: 22px;
  height: 22px;
  display: inline-grid;
  place-items: center;
  border-radius: 6px;
  border: 1px solid rgba(165, 42, 54, 0.35);
  background: transparent;
  color: var(--c-muted);
  cursor: pointer;
}

.floor-del:hover {
  color: var(--c-burst);
  border-color: rgba(165, 42, 54, 0.6);
}

.floor-content {
  margin: 0;
  font-size: 12px;
  line-height: 1.85;
  color: var(--c-text);
  white-space: pre-wrap;
  word-break: break-word;
}

.foot {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px 14px;
  margin-top: 10px;
  border-top: 1px dashed rgba(217, 172, 88, 0.12);
  font-size: 10px;
  color: var(--c-muted);
}

@media (max-width: 640px) {
  .name-input {
    max-width: none;
  }
  .actions {
    margin-left: 0;
  }
}
</style>
