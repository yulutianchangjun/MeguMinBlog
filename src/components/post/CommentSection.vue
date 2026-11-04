<script setup lang="ts">
import { computed, ref } from 'vue'
import MagicIcon from '@/components/common/MagicIcon.vue'
import { formatRelative } from '@/lib/format'
import { toast } from '@/lib/toast'
import { useAuthStore } from '@/stores/auth'
import { useInteractionStore } from '@/stores/interaction'
import type { Comment } from '@/types'

const props = defineProps<{ postId: string }>()

const interaction = useInteractionStore()
const auth = useAuthStore()

const nickname = ref(localStorage.getItem('mgm:nickname') ?? '')
const content = ref('')
const replyTo = ref<string | null>(null)
const replyText = ref('')

const list = computed(() => interaction.commentsByPost(props.postId))
const roots = computed(() => list.value.filter((c) => !c.parentId))
const repliesOf = (id: string) => list.value.filter((c) => c.parentId === id)

const total = computed(() => list.value.length)

function submit() {
  if (!content.value.trim()) {
    toast.warning('留言内容不能为空')
    return
  }
  if (!nickname.value.trim()) {
    toast.warning('先留下一个名字吧')
    return
  }
  if (content.value.trim().length > 500) {
    toast.warning('内容太长了，压缩一下魔力')
    return
  }
  localStorage.setItem('mgm:nickname', nickname.value.trim())
  interaction.addComment(props.postId, nickname.value, content.value)
  content.value = ''
  toast.success('评论已记录')
}

function startReply(id: string) {
  replyTo.value = replyTo.value === id ? null : id
  replyText.value = ''
}

function submitReply(parentId: string) {
  if (!replyText.value.trim()) return
  interaction.addReply(props.postId, parentId, replyText.value)
  replyText.value = ''
  replyTo.value = null
  toast.success('回复已盖楼')
}

function removeComment(comment: Comment) {
  interaction.deleteComment(comment.id)
  toast.info('评论已删除')
}

function displayTime(value: number) {
  return formatRelative(value)
}

function initial(name: string) {
  return name.slice(0, 1).toUpperCase()
}
</script>

<template>
  <section class="comments mage-card">
    <div class="panel-title">
      <span>Comments</span>
      <span class="cn">评论 · {{ total }}</span>
    </div>

    <form class="comment-form" @submit.prevent="submit">
      <div class="form-head">
        <span class="avatar unknown">{{ nickname ? initial(nickname) : '?' }}</span>
        <input
          v-model="nickname"
          class="nick"
          type="text"
          maxlength="16"
          placeholder="你的昵称（访客填写即可发言）"
          aria-label="昵称"
        />
        <span class="form-hint">
          <MagicIcon name="lock" :size="11" />
          访客仅可发表一级评论
        </span>
      </div>
      <textarea
        v-model="content"
        class="textarea"
        rows="3"
        maxlength="500"
        placeholder="写下你想说的话…（魔法阵会记住每一次留言）"
        aria-label="评论内容"
      ></textarea>
      <div class="form-foot">
        <span class="count">{{ content.length }} / 500</span>
        <button type="submit" class="btn-magic">
          <MagicIcon name="send" :size="14" />
          发表评论
        </button>
      </div>
    </form>

    <div v-if="roots.length" class="comment-list">
      <article v-for="comment in roots" :key="comment.id" class="comment" :class="{ pinned: comment.pinned }">
        <span class="avatar" :class="{ admin: comment.isAdmin }">{{ initial(comment.author) }}</span>
        <div class="main">
          <div class="head">
            <strong>{{ comment.author }}</strong>
            <em v-if="comment.isAdmin" class="admin-badge">博主</em>
            <span class="time">{{ displayTime(comment.createdAt) }}</span>
            <span v-if="comment.pinned" class="pin-badge">
              <MagicIcon name="pin" :size="10" />
              置顶
            </span>
            <div v-if="auth.isAdmin" class="admin-actions">
              <button class="mini" title="置顶/取消" @click="interaction.toggleCommentPin(comment.id)">
                <MagicIcon name="pin" :size="12" />
              </button>
              <button class="mini" title="回复" @click="startReply(comment.id)">
                <MagicIcon name="comment" :size="12" />
              </button>
              <button class="mini danger" title="删除" @click="removeComment(comment)">
                <MagicIcon name="trash" :size="12" />
              </button>
            </div>
          </div>
          <p class="text">{{ comment.content }}</p>

          <div v-if="repliesOf(comment.id).length" class="replies">
            <div v-for="reply in repliesOf(comment.id)" :key="reply.id" class="reply">
              <div class="reply-head">
                <strong>{{ reply.author }}</strong>
                <em class="admin-badge">博主</em>
                <span class="time">{{ displayTime(reply.createdAt) }}</span>
                <button
                  v-if="auth.isAdmin"
                  class="mini danger reply-del"
                  title="删除回复"
                  @click="removeComment(reply)"
                >
                  <MagicIcon name="trash" :size="11" />
                </button>
              </div>
              <p class="text">{{ reply.content }}</p>
            </div>
          </div>

          <div v-if="auth.isAdmin && replyTo === comment.id" class="reply-form">
            <textarea
              v-model="replyText"
              class="textarea small"
              rows="2"
              placeholder="以博主身份回复…"
            ></textarea>
            <div class="reply-actions">
              <button class="btn-magic ghost mini-btn" @click="replyTo = null">取消</button>
              <button class="btn-magic mini-btn" @click="submitReply(comment.id)">盖楼</button>
            </div>
          </div>
        </div>
      </article>
    </div>

    <div v-else class="empty-state">
      还没有人留言。成为第一个推开这扇门的人吧。
    </div>

    <div v-if="!auth.isAdmin && total > 0" class="guest-foot">
      <MagicIcon name="spark" :size="11" />
      回复仅博主可见权限，访客可继续发表一级评论
    </div>
  </section>
</template>

<style scoped>
.comments {
  padding-bottom: 6px;
}

.comment-form {
  padding: 16px 18px;
  border-bottom: 1px dashed rgba(217, 172, 88, 0.14);
}

.form-head {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.avatar {
  width: 32px;
  height: 32px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid rgba(217, 172, 88, 0.25);
  background: rgba(165, 42, 54, 0.18);
  color: var(--c-gold-2);
  font-family: var(--font-display);
  font-size: 13px;
  letter-spacing: 0.02em;
}

.avatar.unknown {
  color: var(--c-muted);
  background: rgba(30, 24, 38, 0.8);
}

.avatar.admin {
  border-color: rgba(242, 219, 166, 0.6);
  background: linear-gradient(150deg, #a52a36, #641c2b);
  color: #fff3e0;
  box-shadow: 0 0 12px rgba(165, 42, 54, 0.4);
}

.nick {
  flex: 0 1 210px;
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid rgba(217, 172, 88, 0.2);
  background: rgba(15, 11, 20, 0.7);
  color: var(--c-text);
  font-family: inherit;
  font-size: 12px;
  outline: none;
  transition: all 0.24s var(--ease);
}

.nick:focus {
  border-color: rgba(217, 172, 88, 0.5);
  box-shadow: 0 0 0 3px rgba(165, 42, 54, 0.12);
}

.form-hint {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--c-muted);
}

.textarea {
  width: 100%;
  padding: 11px 13px;
  border-radius: 10px;
  border: 1px solid rgba(217, 172, 88, 0.18);
  background: rgba(15, 11, 20, 0.7);
  color: var(--c-text);
  font-family: inherit;
  font-size: 12.5px;
  line-height: 1.8;
  resize: vertical;
  outline: none;
  transition: all 0.24s var(--ease);
}

.textarea:focus {
  border-color: rgba(217, 172, 88, 0.5);
  box-shadow: 0 0 0 3px rgba(165, 42, 54, 0.12);
}

.textarea.small {
  font-size: 12px;
  margin-top: 8px;
}

.form-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}

.count {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--c-muted);
}

.comment-list {
  padding: 6px 18px 10px;
}

.comment {
  display: flex;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(217, 172, 88, 0.08);
}

.comment:last-child {
  border-bottom: 0;
}

.comment.pinned {
  background: linear-gradient(90deg, rgba(165, 42, 54, 0.1), transparent 72%);
  margin: 0 -18px;
  padding-left: 18px;
  padding-right: 18px;
}

.main {
  flex: 1;
  min-width: 0;
}

.head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.head strong {
  font-family: var(--font-display);
  font-size: 13px;
  letter-spacing: 0.04em;
  color: var(--c-paper);
}

.time {
  font-family: var(--font-mono);
  font-size: 9.5px;
  color: var(--c-muted);
}

.admin-badge {
  font-style: normal;
  font-size: 9px;
  letter-spacing: 0.08em;
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid rgba(242, 219, 166, 0.35);
  background: rgba(165, 42, 54, 0.28);
  color: var(--c-gold-2);
}

.pin-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 9px;
  color: var(--c-gold);
}

.admin-actions {
  margin-left: auto;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.22s var(--ease);
}

.comment:hover .admin-actions {
  opacity: 1;
}

.mini {
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  border: 1px solid rgba(217, 172, 88, 0.18);
  background: rgba(22, 17, 28, 0.8);
  color: var(--c-text-2);
  cursor: pointer;
  transition: all 0.2s var(--ease);
}

.mini:hover {
  color: var(--c-gold-2);
  border-color: rgba(217, 172, 88, 0.45);
}

.mini.danger:hover {
  color: #ff8f9b;
  border-color: rgba(199, 60, 75, 0.6);
}

.text {
  margin: 7px 0 0;
  font-size: 13px;
  line-height: 1.85;
  color: var(--c-text-2);
  white-space: pre-wrap;
  word-break: break-word;
}

.replies {
  margin-top: 10px;
  padding-left: 14px;
  border-left: 1px solid rgba(217, 172, 88, 0.22);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reply {
  padding: 10px 12px;
  border-radius: 9px;
  background: rgba(165, 42, 54, 0.08);
  border: 1px solid rgba(217, 172, 88, 0.1);
}

.reply-head {
  display: flex;
  align-items: center;
  gap: 7px;
}

.reply-del {
  margin-left: auto;
  width: 20px;
  height: 20px;
}

.reply-form {
  margin-top: 10px;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.mini-btn {
  padding: 5px 13px;
  font-size: 11px;
}

.guest-foot {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px 14px;
  border-top: 1px dashed rgba(217, 172, 88, 0.12);
  font-size: 10.5px;
  color: var(--c-muted);
}

@media (max-width: 640px) {
  .form-hint {
    width: 100%;
    margin-left: 0;
  }
  .admin-actions {
    opacity: 1;
  }
}
</style>
