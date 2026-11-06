<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { NDrawer, NPopconfirm } from 'naive-ui'
import MagicIcon from '@/components/common/MagicIcon.vue'
import ImageUploader from '@/components/admin/ImageUploader.vue'
import { adminApi, type ApiComment } from '@/api'
import { exportJson, exportZip, parseImportFile } from '@/lib/exporter'
import { formatDate } from '@/lib/format'
import { API_BASE, apiReady } from '@/lib/http'
import { renderMarkdown, slugify } from '@/lib/markdown'
import { postFromMarkdown } from '@/lib/post'
import { resolveAsset } from '@/lib/asset'
import { STORAGE_PREFIX } from '@/lib/storage'
import { toast } from '@/lib/toast'
import { useAuthStore } from '@/stores/auth'
import { useContentStore } from '@/stores/content'
import { useInteractionStore } from '@/stores/interaction'
import { useProfileStore } from '@/stores/profile'
import { useSiteStore, type SiteAnniversary } from '@/stores/site'
import { useUiStore } from '@/stores/ui'
import type { AdminTab } from '@/stores/ui'
import type { Collection, Post } from '@/types'

const ui = useUiStore()
const content = useContentStore()
const interaction = useInteractionStore()
const profile = useProfileStore()
const auth = useAuthStore()
const siteStore = useSiteStore()
const router = useRouter()

const show = computed({
  get: () => ui.adminOpen,
  set: (value: boolean) => (value ? ui.openAdmin() : ui.closeAdmin()),
})

const tabs: { key: AdminTab; label: string; en: string; icon: string }[] = [
  { key: 'posts', label: '文章管理', en: 'Posts', icon: 'book' },
  { key: 'collections', label: '综集管理', en: 'Series', icon: 'layers' },
  { key: 'comments', label: '评论管理', en: 'Comments', icon: 'comment' },
  { key: 'site', label: '站点设置', en: 'Site', icon: 'star' },
  { key: 'data', label: '导入导出', en: 'Data', icon: 'upload' },
  { key: 'stats', label: '数据仪表', en: 'Stats', icon: 'eye' },
]

const editing = ref<Post | null>(null)
const isNew = ref(false)
const catText = ref('')
const tagText = ref('')
const preview = ref(false)
const saving = ref(false)
const importing = ref(false)
const importLog = ref<{ name: string; posts: number; skippedMessages: number }[]>([])

// —— 评论管理 ——
const comments = ref<ApiComment[]>([])
const commentsLoading = ref(false)

async function loadComments() {
  if (!auth.isAdmin) return
  commentsLoading.value = true
  try {
    comments.value = await adminApi.comments()
  } catch (error) {
    toast.error(error instanceof Error ? error.message : '评论加载失败')
  } finally {
    commentsLoading.value = false
  }
}

function postTitleOf(postId: number): string {
  const post = content.allPosts.find((item) => item.remoteId === postId)
  return post?.title ?? `文章 #${postId}`
}

async function removeComment(id: number) {
  try {
    await adminApi.deleteComment(id)
    comments.value = comments.value.filter((item) => item.id !== id)
    toast.success('评论已删除')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : '删除失败')
  }
}
const fileInput = ref<HTMLInputElement | null>(null)
const mdInput = ref<HTMLInputElement | null>(null)
const dragOver = ref(false)
const collectionDraft = ref<Collection | null>(null)
const collectionIsNew = ref(false)

const anniversaryDraft = ref<SiteAnniversary | null>(null)
const anniversaryIsNew = ref(false)
const startDateInput = ref('')
const savingSite = ref(false)

const exportStartDate = computed(() => siteStore.startDate || today())

async function saveStartDate() {
  const value = startDateInput.value.trim()
  if (!value) {
    toast.warning('请填写开站日期')
    return
  }
  savingSite.value = true
  try {
    await siteStore.saveStartDate(value)
    toast.success('开站日期已更新')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : '保存失败')
  } finally {
    savingSite.value = false
  }
}

function newAnniversary() {
  anniversaryIsNew.value = true
  anniversaryDraft.value = { id: 0, label: '', date: '', note: '', sort: 99 }
}

function editAnniversary(item: SiteAnniversary) {
  anniversaryIsNew.value = false
  anniversaryDraft.value = { ...item }
}

async function saveAnniversaryDraft() {
  const draft = anniversaryDraft.value
  if (!draft) return
  if (!draft.label.trim()) {
    toast.warning('请填写纪念日名称')
    return
  }
  if (!/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(draft.date.trim())) {
    toast.warning('日期格式应为 MM-DD，例如 11-30')
    return
  }
  savingSite.value = true
  try {
    await siteStore.saveAnniversary(
      { ...draft, label: draft.label.trim(), date: draft.date.trim(), note: draft.note.trim() },
      anniversaryIsNew.value,
    )
    anniversaryDraft.value = null
    toast.success(anniversaryIsNew.value ? '纪念日已添加' : '纪念日已更新')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : '保存失败')
  } finally {
    savingSite.value = false
  }
}

async function removeAnniversary(item: SiteAnniversary) {
  try {
    await siteStore.deleteAnniversary(item.id)
    toast.success(`已删除「${item.label}」`)
  } catch (error) {
    toast.error(error instanceof Error ? error.message : '删除失败')
  }
}

const totalLikes = computed(() =>
  content.allPosts.reduce((sum, post) => sum + interaction.likeTotal(post.id), 0),
)

const apiBase = API_BASE
const apiConfigured = apiReady
const reloading = ref(false)

async function reloadAll() {
  if (!apiConfigured) {
    toast.warning('未配置 VITE_API_BASE_URL，当前为只读静态模式')
    return
  }
  reloading.value = true
  try {
    await content.load()
    await interaction.load()
    if (auth.isAdmin) await profile.loadUv()
    toast.success('已从后端重新拉取数据')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : '拉取失败')
  } finally {
    reloading.value = false
  }
}

const maxPv = computed(() => Math.max(1, ...profile.uvSeries.map((day) => day.pv)))

const hiddenCount = computed(() => content.allPosts.filter((p) => p.hidden || p.draft).length)

const previewHtml = computed(() => (editing.value ? renderMarkdown(editing.value.content).html : ''))

const draftCollections = computed(() => editing.value?.collections ?? [])

function switchTab(tab: AdminTab) {
  editing.value = null
  ui.adminTab = tab
  if (tab === 'stats' && auth.isAdmin) {
    void profile.loadUv()
  }
  if (tab === 'comments') {
    void loadComments()
  }
  if (tab === 'site') {
    startDateInput.value = siteStore.startDate
  }
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function newPost() {
  isNew.value = true
  preview.value = false
  catText.value = ''
  tagText.value = ''
  editing.value = {
    id: '',
    title: '',
    subtitle: '',
    date: today(),
    categories: [],
    tags: [],
    collections: [],
    cover: '',
    excerpt: '',
    content: '## 小标题\n\n在这里写下你的手记。\n',
  }
}

function editPost(post: Post) {
  isNew.value = false
  preview.value = false
  editing.value = { ...post, categories: [...post.categories], tags: [...post.tags], collections: [...post.collections] }
  catText.value = post.categories.join('，')
  tagText.value = post.tags.join('，')
}

function splitList(input: string): string[] {
  return input
    .split(/[,，、]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function toggleCollection(id: string) {
  if (!editing.value) return
  const list = editing.value.collections
  editing.value.collections = list.includes(id) ? list.filter((item) => item !== id) : [...list, id]
}

function toggleFlag(flag: 'pinned' | 'hidden' | 'draft') {
  if (!editing.value) return
  editing.value[flag] = !editing.value[flag]
}

function asciiSlug(text: string, prefix = 'post'): string {
  const ascii = slugify(text)
    .replace(/[^a-z0-9-]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return ascii || `${prefix}-${Date.now().toString(36)}`
}

function uniqueId(base: string): string {
  const stem = asciiSlug(base)
  let id = stem
  let i = 2
  while (content.allPosts.some((post) => post.id === id) && id !== editing.value?.id) {
    id = `${stem}-${i}`
    i += 1
  }
  return id
}

async function save() {
  if (!editing.value) return
  if (!editing.value.title.trim()) {
    toast.warning('标题不能为空')
    return
  }
  if (!editing.value.content.trim()) {
    toast.warning('正文不能为空')
    return
  }
  const payload: Post = {
    ...editing.value,
    title: editing.value.title.trim(),
    categories: splitList(catText.value),
    tags: splitList(tagText.value),
    id: isNew.value || !editing.value.id ? uniqueId(editing.value.title) : editing.value.id,
    excerpt:
      editing.value.excerpt?.trim() ||
      editing.value.content.replace(/[#>*`\-\n]/g, ' ').trim().slice(0, 90),
    source: editing.value.source,
  }
  saving.value = true
  try {
    await content.savePost(payload)
    editing.value = null
    if (payload.draft) {
      toast.success('已保存为草稿：前台不可见，博主仍可在后台继续编辑')
    } else if (payload.hidden) {
      toast.success('已保存并隐藏：不出现在列表，直链仍可访问')
    } else {
      toast.success(isNew.value ? '文章已发布' : '修改已保存')
    }
    isNew.value = false
  } catch (error) {
    toast.error(error instanceof Error ? error.message : '提交失败')
  } finally {
    saving.value = false
  }
}

async function remove(post: Post) {
  try {
    await content.deletePost(post)
    toast.info(`已提交删除《${post.title}》，部署后消失`)
  } catch (error) {
    toast.error(error instanceof Error ? error.message : '删除失败')
  }
}

async function togglePostFlag(post: Post, flag: 'pinned' | 'hidden' | 'draft') {
  try {
    await content.toggleFlag(post.id, flag)
    toast.success('设置已保存')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : '提交失败')
  }
}

async function onMdPick(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const raw = await file.text()
    const parsed = postFromMarkdown(raw, file.name.replace(/\.md$/i, ''))
    const base = editing.value
    editing.value = {
      ...parsed,
      id: base?.id ?? '',
      date: parsed.date,
      source: base?.source,
    }
    catText.value = parsed.categories.join('，')
    tagText.value = parsed.tags.join('，')
    preview.value = false
    toast.success(`已解析「${parsed.title}」，检查后保存即可`)
  } catch {
    toast.error('Markdown 解析失败，请检查 Frontmatter 格式')
  } finally {
    input.value = ''
  }
}

function collectionCount(id: string): number {
  return content.publicPosts.filter((post) => post.collections.includes(id)).length
}

function newCollection() {
  collectionIsNew.value = true
  collectionDraft.value = {
    id: '',
    title: '',
    subtitle: '',
    description: '',
    cover: '',
    order: content.collections.length + 1,
  }
}

function editCollection(collection: Collection) {
  collectionIsNew.value = false
  collectionDraft.value = { ...collection }
}

function uniqueCollectionId(title: string): string {
  const stem = asciiSlug(title, 'series')
  let id = stem
  let index = 2
  while (content.collections.some((item) => item.id === id) && id !== collectionDraft.value?.id) {
    id = `${stem}-${index}`
    index += 1
  }
  return id
}

async function saveCollectionDraft() {
  const draft = collectionDraft.value
  if (!draft) return
  if (!draft.title.trim()) {
    toast.warning('综集名称不能为空')
    return
  }
  const payload: Collection = {
    ...draft,
    title: draft.title.trim(),
    subtitle: draft.subtitle?.trim() ?? '',
    description: draft.description?.trim() ?? '',
    id: collectionIsNew.value || !draft.id ? uniqueCollectionId(draft.title) : draft.id,
  }
  try {
    await content.saveCollection(payload)
    collectionDraft.value = null
    collectionIsNew.value = false
    toast.success('综集已保存')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : '提交失败')
  }
}

async function removeCollection(collection: Collection) {
  try {
    await content.deleteCollection(collection.id)
    toast.info(`已提交删除综集《${collection.title}》`)
  } catch (error) {
    toast.error(error instanceof Error ? error.message : '删除失败')
  }
}

function openPost(post: Post) {
  ui.closeAdmin()
  router.push(`/posts/${post.id}`)
}

async function doExportZip() {
  await exportZip({
    posts: content.allPosts,
    collections: content.collections,
    messages: interaction.messages,
    siteStartDate: exportStartDate.value,
  })
  toast.success('ZIP 已生成，包含全部 Markdown 与互动备份')
}

function doExportJson() {
  exportJson({
    posts: content.allPosts,
    collections: content.collections,
    messages: interaction.messages,
    siteStartDate: exportStartDate.value,
  })
  toast.success('JSON 已导出')
}

async function handleFiles(files: FileList | File[]) {
  const list = Array.from(files)
  if (!list.length) return
  importing.value = true
  importLog.value = []
  let posts = 0
  let failed = false
  for (const file of list) {
    try {
      const result = await parseImportFile(file)
      const addedPosts = await content.importPosts(result.posts)
      posts += addedPosts
      importLog.value.push({ name: file.name, posts: addedPosts, skippedMessages: result.messages.length })
    } catch (error) {
      failed = true
      const reason = error instanceof Error ? error.message : '解析失败'
      importLog.value.push({ name: `${file.name} · ${reason}`, posts: 0, skippedMessages: 0 })
    }
  }
  importing.value = false
  if (posts) {
    toast.success(`导入完成：${posts} 篇手记已提交到后端`)
  } else if (failed) {
    toast.error('导入未提交任何文章，请检查登录状态与后端连接')
  } else {
    toast.warning('没有识别到可导入的内容')
  }
}

function onDrop(event: DragEvent) {
  dragOver.value = false
  const files = event.dataTransfer?.files
  if (files) void handleFiles(files)
}

function onPick(event: Event) {
  const files = (event.target as HTMLInputElement).files
  if (files) void handleFiles(files)
  ;(event.target as HTMLInputElement).value = ''
}

async function resetOverlay() {
  try {
    await content.resetOverlay()
    await interaction.load()
    toast.info('已重新拉取后端数据')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : '刷新失败')
  }
}

function clearAll() {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (key?.startsWith(STORAGE_PREFIX)) keys.push(key)
  }
  keys.forEach((key) => localStorage.removeItem(key))
  window.location.reload()
}

function logout() {
  auth.logout()
  ui.closeAdmin()
  toast.info('已退出博主身份')
}

</script>

<template>
  <n-drawer
    v-model:show="show"
    placement="right"
    :width="780"
    :trap-focus="false"
    :header-style="{ display: 'none' }"
    :content-style="{ background: '#181320', padding: 0 }"
    :footer-style="{ display: 'none' }"
  >
    <div class="admin">
      <header class="admin-head">
        <div class="head-left">
          <span class="seal">
            <img v-if="auth.avatar" :src="auth.avatar" :alt="auth.login" />
            <MagicIcon v-else name="shield" :size="16" />
          </span>
          <div>
            <strong>管理面板</strong>
            <span>@{{ auth.login || '博主' }}<template v-if="auth.user"> · UID {{ auth.user.id }}</template> · 已登录</span>
          </div>
        </div>
        <div class="head-right">
          <button class="icon-btn" title="退出登录" @click="logout"><MagicIcon name="logout" :size="15" /></button>
          <button class="icon-btn" title="关闭" @click="ui.closeAdmin()"><MagicIcon name="close" :size="15" /></button>
        </div>
      </header>

      <nav class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab"
          :class="{ active: ui.adminTab === tab.key }"
          @click="switchTab(tab.key)"
        >
          <MagicIcon :name="tab.icon" :size="14" />
          <span>{{ tab.label }}</span>
          <em>{{ tab.en }}</em>
        </button>
      </nav>

      <div class="admin-body">
        <!-- 文章管理 -->
        <template v-if="ui.adminTab === 'posts'">
          <template v-if="editing">
            <div class="editor-head">
              <button class="back" @click="editing = null">
                <MagicIcon name="arrowLeft" :size="13" />
                返回列表
              </button>
              <span class="editor-title">{{ isNew ? '新建手记' : '编辑手记' }}</span>
              <button class="btn-magic ghost small" @click="mdInput?.click()">
                <MagicIcon name="book" :size="13" />
                导入 .md
              </button>
              <input ref="mdInput" type="file" accept=".md,text/markdown" hidden @change="onMdPick" />
              <button class="btn-magic small" :disabled="saving" @click="save">
                <MagicIcon name="check" :size="13" />
                保存
              </button>
            </div>

            <div class="editor">
              <label class="field">
                <span>标题</span>
                <input v-model="editing.title" placeholder="为一篇手记命名" />
              </label>

              <label class="field">
                <span>副标题</span>
                <input v-model="editing.subtitle" placeholder="可选，一句话点题" />
              </label>

              <div class="row-2">
                <label class="field">
                  <span>发布日期</span>
                  <input v-model="editing.date" type="date" />
                </label>
                <label class="field">
                  <span>标签</span>
                  <input v-model="tagText" placeholder="荒野，咏唱" />
                </label>
              </div>

              <label class="field">
                <span>分类（逗号分隔，可多个）</span>
                <input v-model="catText" placeholder="爆裂魔法，手记" />
              </label>

              <ImageUploader v-model="editing.cover" label="封面图" />

              <div class="field">
                <span>归属综集</span>
                <div class="chips">
                  <button
                    v-for="item in content.collections"
                    :key="item.id"
                    class="chip"
                    :class="{ active: draftCollections.includes(item.id) }"
                    @click="toggleCollection(item.id)"
                  >
                    {{ item.title }}
                  </button>
                </div>
              </div>

              <label class="field">
                <span>摘要</span>
                <textarea v-model="editing.excerpt" rows="2" placeholder="留空则自动截取正文开头"></textarea>
              </label>

              <div class="flags">
                <button class="flag" :class="{ on: editing.pinned }" @click="toggleFlag('pinned')">
                  <MagicIcon name="pin" :size="13" />{{ editing.pinned ? '已置顶' : '置顶' }}
                </button>
                <button class="flag" :class="{ on: editing.hidden }" @click="toggleFlag('hidden')">
                  <MagicIcon name="eyeOff" :size="13" />{{ editing.hidden ? '已隐藏' : '隐藏' }}
                </button>
                <button class="flag" :class="{ on: editing.draft }" @click="toggleFlag('draft')">
                  <MagicIcon name="edit" :size="13" />{{ editing.draft ? '草稿态' : '草稿' }}
                </button>
                <button class="flag preview-toggle" :class="{ on: preview }" @click="preview = !preview">
                  <MagicIcon name="eye" :size="13" />{{ preview ? '编辑' : '预览' }}
                </button>
              </div>

              <p class="build-tip">
                <MagicIcon name="shield" :size="11" />
                草稿与隐藏都由后端 <code>blog_post.status</code> 控制：草稿前台完全不可见，隐藏不出现在列表但直链可访问。
              </p>

              <div v-if="preview" class="preview-box">
                <h2 class="preview-title">{{ editing.title || '无题' }}</h2>
                <div class="prose" v-html="previewHtml"></div>
              </div>
              <label v-else class="field">
                <span>正文（Markdown）</span>
                <textarea v-model="editing.content" class="md-input" rows="18" spellcheck="false"></textarea>
              </label>
            </div>
          </template>

          <template v-else>
            <div class="toolbar">
              <div class="summary">
                <span><strong>{{ content.allPosts.length }}</strong> 篇总计</span>
                <span><strong>{{ content.allPosts.length - hiddenCount }}</strong> 篇公开</span>
                <span><strong>{{ hiddenCount }}</strong> 隐藏/草稿</span>
              </div>
              <button class="btn-magic small" @click="newPost">
                <MagicIcon name="plus" :size="13" />
                新建手记
              </button>
            </div>

            <ul class="post-list">
              <li v-for="post in content.allPosts" :key="post.id" class="post-row">
                <div class="row-main">
                  <div class="row-title">
                    <span v-if="post.pinned" class="badge gold">置顶</span>
                    <span v-if="post.hidden" class="badge">隐藏</span>
                    <span v-if="post.draft" class="badge">草稿</span>
                    <strong>{{ post.title }}</strong>
                  </div>
                  <div class="row-meta">
                    <span>{{ formatDate(post.date) }}</span>
                    <span>{{ post.categories.join(' / ') || '未分类' }}</span>
                    <span>{{ post.collections.length ? '综集 ' + post.collections.length : '单篇' }}</span>
                  </div>
                </div>
                <div class="row-actions">
                  <button title="查看" @click="openPost(post)"><MagicIcon name="eye" :size="13" /></button>
                  <button title="编辑" @click="editPost(post)"><MagicIcon name="edit" :size="13" /></button>
                  <button title="置顶" :class="{ on: post.pinned }" @click="togglePostFlag(post, 'pinned')">
                    <MagicIcon name="pin" :size="13" />
                  </button>
                  <button title="隐藏" :class="{ on: post.hidden }" @click="togglePostFlag(post, 'hidden')">
                    <MagicIcon :name="post.hidden ? 'eyeOff' : 'eye'" :size="13" />
                  </button>
                  <n-popconfirm @positive-click="remove(post)">
                    <template #trigger>
                      <button class="danger" title="删除"><MagicIcon name="trash" :size="13" /></button>
                    </template>
                    删除《{{ post.title }}》？删除后立即从站点消失。
                  </n-popconfirm>
                </div>
              </li>
            </ul>
          </template>
        </template>

        <!-- 综集管理 -->
        <template v-else-if="ui.adminTab === 'collections'">
          <template v-if="collectionDraft">
            <div class="editor-head">
              <button class="back" @click="collectionDraft = null">
                <MagicIcon name="arrowLeft" :size="13" />
                返回列表
              </button>
              <span class="editor-title">{{ collectionIsNew ? '添加综集' : '编辑综集' }}</span>
              <button class="btn-magic small" @click="saveCollectionDraft">
                <MagicIcon name="check" :size="13" />
                保存
              </button>
            </div>

            <div class="editor">
              <label class="field">
                <span>综集名称</span>
                <input v-model="collectionDraft.title" placeholder="例如：爆裂魔法理论" />
              </label>
              <label class="field">
                <span>英文副标题</span>
                <input v-model="collectionDraft.subtitle" placeholder="Explosion Theory" />
              </label>
              <label class="field">
                <span>简介</span>
                <textarea
                  v-model="collectionDraft.description"
                  rows="3"
                  placeholder="一两句话说明这一册收录什么"
                ></textarea>
              </label>
              <ImageUploader v-model="collectionDraft.cover" label="综集封面" />
              <p class="editor-tip">
                <MagicIcon name="spark" :size="11" />
                新综集会立刻出现在综集页与首页速览中，文章可在编辑时勾选归属。
              </p>
            </div>
          </template>

          <template v-else>
            <div class="toolbar">
              <div class="summary">
                <span><strong>{{ content.collections.length }}</strong> 个综集</span>
                <span><strong>{{ content.publicPosts.length }}</strong> 篇手记</span>
              </div>
              <button class="btn-magic small" @click="newCollection">
                <MagicIcon name="plus" :size="13" />
                添加综集
              </button>
            </div>

            <ul class="post-list">
              <li v-for="item in content.collections" :key="item.id" class="post-row">
                <img
                  v-if="item.cover"
                  class="series-thumb"
                  :src="resolveAsset(item.cover)"
                  :alt="item.title"
                />
                <div class="row-main">
                  <div class="row-title">
                    <strong>{{ item.title }}</strong>
                    <span class="badge gold">{{ collectionCount(item.id) }} 篇</span>
                  </div>
                  <div class="row-meta">
                    <span>{{ item.subtitle || '未设英文名' }}</span>
                    <span>{{ item.id }}</span>
                  </div>
                </div>
                <div class="row-actions">
                  <button title="编辑" @click="editCollection(item)"><MagicIcon name="edit" :size="13" /></button>
                  <n-popconfirm @positive-click="removeCollection(item)">
                    <template #trigger>
                      <button class="danger" title="删除"><MagicIcon name="trash" :size="13" /></button>
                    </template>
                    删除综集《{{ item.title }}》？其下文章不会被删除。
                  </n-popconfirm>
                </div>
              </li>
            </ul>
          </template>
        </template>

        <!-- 评论管理 -->
        <template v-else-if="ui.adminTab === 'comments'">
          <div class="toolbar">
            <div class="summary">
              <span><strong>{{ comments.length }}</strong> 条评论</span>
              <button class="btn-magic small" :disabled="commentsLoading" @click="loadComments">
                <MagicIcon name="refresh" :size="13" />
                {{ commentsLoading ? '加载中…' : '刷新' }}
              </button>
            </div>
          </div>

          <p v-if="!commentsLoading && !comments.length" class="empty-tip">
            还没有评论。文章页的评论区发表后会出现在这里。
          </p>

          <ul class="post-list">
            <li v-for="item in comments" :key="item.id" class="post-row comment-row">
              <div class="row-main">
                <div class="row-title">
                  <strong>{{ item.author }}</strong>
                  <span class="badge gold">{{ postTitleOf(item.postId) }}</span>
                </div>
                <div class="row-meta">
                  <span class="comment-text">{{ item.content }}</span>
                </div>
                <div class="row-meta">
                  <span>{{ formatDate(item.createdAt) }}</span>
                </div>
              </div>
              <div class="row-actions">
                <n-popconfirm @positive-click="removeComment(item.id)">
                  <template #trigger>
                    <button class="danger" title="删除"><MagicIcon name="trash" :size="13" /></button>
                  </template>
                  删除 {{ item.author }} 的这条评论？
                </n-popconfirm>
              </div>
            </li>
          </ul>
        </template>

        <!-- 站点设置 -->
        <template v-else-if="ui.adminTab === 'site'">
          <div class="editor">
            <label class="field">
              <span>开站日期</span>
              <input v-model="startDateInput" type="date" />
            </label>
            <button class="btn-magic small" :disabled="savingSite" @click="saveStartDate">
              <MagicIcon name="check" :size="13" />
              {{ savingSite ? '保存中…' : '保存开站日期' }}
            </button>
            <p class="editor-tip">
              <MagicIcon name="spark" :size="11" />
              用于右侧栏「开站第 N 天」与关于页时间线。
            </p>
          </div>

          <template v-if="anniversaryDraft">
            <div class="editor-head">
              <button class="back" @click="anniversaryDraft = null">
                <MagicIcon name="arrowLeft" :size="13" />
                返回列表
              </button>
              <span class="editor-title">{{ anniversaryIsNew ? '添加纪念日' : '编辑纪念日' }}</span>
              <button class="btn-magic small" :disabled="savingSite" @click="saveAnniversaryDraft">
                <MagicIcon name="check" :size="13" />
                保存
              </button>
            </div>

            <div class="editor">
              <label class="field">
                <span>名称</span>
                <input v-model="anniversaryDraft.label" placeholder="例如：云汀凫的生日" />
              </label>
              <label class="field">
                <span>日期（MM-DD，每年循环）</span>
                <input v-model="anniversaryDraft.date" placeholder="11-30" />
              </label>
              <label class="field">
                <span>备注</span>
                <input v-model="anniversaryDraft.note" placeholder="显示在倒计时卡片下方" />
              </label>
              <label class="field">
                <span>排序（小的靠前）</span>
                <input v-model.number="anniversaryDraft.sort" type="number" min="0" max="99" />
              </label>
            </div>
          </template>

          <template v-else>
            <div class="toolbar">
              <div class="summary">
                <span><strong>{{ siteStore.anniversaries.length }}</strong> 个纪念日</span>
              </div>
              <button class="btn-magic small" @click="newAnniversary">
                <MagicIcon name="plus" :size="13" />
                添加纪念日
              </button>
            </div>

            <ul class="post-list">
              <li v-for="item in siteStore.anniversaries" :key="item.id" class="post-row">
                <div class="row-main">
                  <div class="row-title">
                    <strong>{{ item.label }}</strong>
                    <span class="badge gold">{{ item.date }}</span>
                  </div>
                  <div class="row-meta">
                    <span>{{ item.note || '未设备注' }}</span>
                    <span>排序 {{ item.sort }}</span>
                  </div>
                </div>
                <div class="row-actions">
                  <button title="编辑" @click="editAnniversary(item)"><MagicIcon name="edit" :size="13" /></button>
                  <n-popconfirm @positive-click="removeAnniversary(item)">
                    <template #trigger>
                      <button class="danger" title="删除"><MagicIcon name="trash" :size="13" /></button>
                    </template>
                    删除「{{ item.label }}」？
                  </n-popconfirm>
                </div>
              </li>
            </ul>
          </template>
        </template>

        <!-- 导入导出 -->
        <template v-else-if="ui.adminTab === 'data'">
          <div class="data-grid">
            <section class="data-card">
              <span class="data-icon"><MagicIcon name="download" :size="18" /></span>
              <h3>导出全量内容</h3>
              <p>把全部已发布手记打包成 Markdown（含 Frontmatter）</p>
              <div class="data-actions">
                <button class="btn-magic small" @click="doExportZip">
                  <MagicIcon name="download" :size="13" />
                  导出 ZIP
                </button>
                <button class="btn-magic ghost small" @click="doExportJson">
                  <MagicIcon name="download" :size="13" />
                  导出 JSON
                </button>
              </div>
            </section>

            <section class="data-card">
              <span class="data-icon"><MagicIcon name="upload" :size="18" /></span>
              <h3>导入内容</h3>
              <p>支持单个 / 多个 .md、标准结构 .json 与完整 ZIP。导入会逐篇提交，同名文章被覆盖。</p>
              <div
                class="dropzone"
                :class="{ over: dragOver }"
                @dragover.prevent="dragOver = true"
                @dragleave.prevent="dragOver = false"
                @drop.prevent="onDrop"
                @click="fileInput?.click()"
              >
                <MagicIcon name="upload" :size="20" />
                <strong>{{ importing ? '正在解析…' : '拖拽文件到这里' }}</strong>
                <span>.md / .json / .zip</span>
              </div>
              <input ref="fileInput" type="file" multiple accept=".md,.json,.zip" hidden @change="onPick" />
            </section>
          </div>

          <section v-if="importLog.length" class="log">
            <div class="log-head">最近导入</div>
            <div v-for="(item, i) in importLog" :key="i" class="log-row">
              <span class="log-name">{{ item.name }}</span>
              <span>{{ item.posts }} 篇</span>
              <span v-if="item.skippedMessages">跳过 {{ item.skippedMessages }} 条留言</span>
            </div>
          </section>

          <section class="storage">
            <div class="storage-row">
              <div>
                <span>当前数据</span>
                <strong>{{ content.allPosts.length }} 篇 · {{ content.collections.length }} 综集 · {{ interaction.messages.length }} 便签</strong>
              </div>
            </div>

            <p v-if="content.lastAction" class="repo-probe">
              <MagicIcon name="refresh" :size="11" />
              最近操作：{{ content.lastAction.message }}（本次会话 {{ content.mutations }} 次）
            </p>

          </section>
        </template>

        <!-- 数据仪表 -->
        <template v-else>
          <div class="stat-grid">
            <div class="stat-card">
              <span>总浏览量 PV</span>
              <strong>{{ profile.uvSummary.pv }}</strong>
            </div>
            <div class="stat-card">
              <span>独立访客 UV</span>
              <strong>{{ profile.uvSummary.uv }}</strong>
            </div>
            <div class="stat-card">
              <span>今日访问</span>
              <strong>{{ profile.uvSummary.todayPv }}<em>/ {{ profile.uvSummary.todayUv }} UV</em></strong>
            </div>
            <div class="stat-card">
              <span>有访问的天数</span>
              <strong>{{ profile.uvSummary.activeDays }}</strong>
            </div>
          </div>

          <section class="chart-card">
            <div class="chart-head">
              <span>近 14 天访问趋势</span>
              <em>PV / UV</em>
            </div>
            <div class="chart">
              <div
                v-for="(day, index) in profile.uvSeries"
                :key="day.date"
                class="bar-col"
                :title="`${day.date} · ${day.pv} PV / ${day.uv} UV`"
              >
                <span class="grid-line"></span>
                <span class="bar pv" :style="{ height: `${Math.max(2, (day.pv / maxPv) * 100)}%` }"></span>
                <span class="bar uv" :style="{ height: `${Math.max(1, (day.uv / maxPv) * 100)}%` }"></span>
                <em v-if="index % 3 === 0 || index === profile.uvSeries.length - 1">{{ day.label }}</em>
              </div>
            </div>
          </section>

          <div class="stat-columns">
            <section class="mini-card">
              <div class="mini-head">热门页面</div>
              <ul class="rank">
                <li v-for="(page, i) in profile.uvSummary.topPages" :key="page.path">
                  <span class="rank-num">{{ String(i + 1).padStart(2, '0') }}</span>
                  <span class="rank-path">{{ page.path }}</span>
                  <em>{{ page.count }}</em>
                </li>
                <li v-if="!profile.uvSummary.topPages.length" class="empty">还没有访问记录</li>
              </ul>
            </section>

            <section class="mini-card">
              <div class="mini-head">内容与互动</div>
              <ul class="rank">
                <li><span class="rank-num">篇</span><span class="rank-path">公开手记</span><em>{{ content.publicPosts.length }}</em></li>
                <li><span class="rank-num">论</span><span class="rank-path">评论存储</span><em>本站数据库</em></li>
                <li><span class="rank-num">卡</span><span class="rank-path">留言卡片</span><em>{{ interaction.messages.length }}</em></li>
                <li><span class="rank-num">赞</span><span class="rank-path">累计点赞</span><em>{{ totalLikes }}</em></li>
                <li><span class="rank-num">签</span><span class="rank-path">累计签到 / 连续</span><em>{{ profile.totalDays }} / {{ profile.streak }}</em></li>
              </ul>
            </section>
          </div>

          <p class="stat-note">
            <MagicIcon name="eye" :size="11" />
            统计基于本浏览器内的访问记录（无后端、无埋点脚本），仅用于展示仪表盘效果。
          </p>
        </template>
      </div>
    </div>
  </n-drawer>
</template>

<style scoped>
.admin {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #181320;
  color: var(--c-text);
}

.admin-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(217, 172, 88, 0.14);
  background: linear-gradient(180deg, rgba(44, 30, 40, 0.6), transparent);
}

.head-left {
  display: flex;
  align-items: center;
  gap: 11px;
}

.seal {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
  border: 1px solid rgba(217, 172, 88, 0.4);
  background: radial-gradient(circle, rgba(165, 42, 54, 0.45), rgba(20, 15, 26, 0.9));
  color: var(--c-gold-2);
}

.seal img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.head-left strong {
  display: block;
  font-family: var(--font-display);
  font-size: 15px;
  letter-spacing: 0.1em;
  color: var(--c-paper);
}

.head-left span {
  display: block;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.04em;
  color: var(--c-muted);
}

.head-right {
  display: flex;
  gap: 6px;
}

.icon-btn {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid rgba(217, 172, 88, 0.18);
  background: rgba(20, 16, 26, 0.6);
  color: var(--c-text-2);
  cursor: pointer;
  transition: all 0.22s var(--ease);
}

.icon-btn:hover {
  color: var(--c-gold-2);
  border-color: rgba(217, 172, 88, 0.5);
}

.tabs {
  display: flex;
  gap: 4px;
  padding: 12px 20px 0;
  border-bottom: 1px solid rgba(217, 172, 88, 0.12);
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--c-text-2);
  font-size: 12.5px;
  cursor: pointer;
  transition: all 0.22s var(--ease);
}

.tab em {
  font-style: normal;
  font-family: var(--font-display);
  font-size: 8px;
  letter-spacing: 0.2em;
  opacity: 0.4;
}

.tab:hover {
  color: var(--c-gold-2);
}

.tab.active {
  color: var(--c-gold-2);
  border-bottom-color: var(--c-gold);
}

.admin-body {
  flex: 1;
  overflow-y: auto;
  padding: 18px 20px 40px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.summary {
  display: flex;
  gap: 14px;
  font-size: 10.5px;
  color: var(--c-muted);
}

.summary strong {
  font-family: var(--font-display);
  font-size: 12px;
  color: var(--c-gold-2);
  margin-right: 2px;
}

.btn-magic.small {
  padding: 7px 14px;
  font-size: 11.5px;
}

.btn-magic.small.danger {
  color: #ffb3bd;
  border-color: rgba(199, 60, 75, 0.4);
}

.post-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.empty-tip {
  margin: 24px 0;
  text-align: center;
  font-size: 11.5px;
  color: var(--c-muted);
}

.comment-row {
  align-items: flex-start;
}

.comment-row .comment-text {
  max-width: 420px;
  font-size: 11.5px;
  line-height: 1.7;
  color: var(--c-text);
  white-space: pre-wrap;
  word-break: break-word;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.post-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 9px;
  border: 1px solid rgba(217, 172, 88, 0.1);
  background: rgba(26, 21, 34, 0.7);
  transition: all 0.2s var(--ease);
}

.post-row:hover {
  border-color: rgba(217, 172, 88, 0.28);
  background: rgba(32, 25, 41, 0.8);
}

.row-main {
  min-width: 0;
  flex: 1;
}

.row-title {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.row-title strong {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 500;
  color: var(--c-paper);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.badge {
  flex: none;
  font-size: 8.5px;
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid rgba(217, 172, 88, 0.24);
  color: var(--c-text-2);
}

.badge.gold {
  color: var(--c-gold);
  border-color: rgba(217, 172, 88, 0.45);
}

.row-meta {
  display: flex;
  gap: 10px;
  margin-top: 3px;
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--c-muted);
  overflow: hidden;
  white-space: nowrap;
}

.row-actions {
  display: flex;
  gap: 3px;
  flex: none;
}

.row-actions button {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  border: 1px solid rgba(217, 172, 88, 0.14);
  background: transparent;
  color: var(--c-text-2);
  cursor: pointer;
  transition: all 0.18s var(--ease);
}

.row-actions button:hover {
  color: var(--c-gold-2);
  border-color: rgba(217, 172, 88, 0.4);
}

.row-actions button.on {
  color: var(--c-gold);
  background: rgba(165, 42, 54, 0.3);
  border-color: rgba(217, 172, 88, 0.4);
}

.row-actions button.danger:hover {
  color: #ff8f9b;
  border-color: rgba(199, 60, 75, 0.6);
}

/* 编辑器 */
.editor-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px dashed rgba(217, 172, 88, 0.16);
}

.back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  background: transparent;
  color: var(--c-text-2);
  font-size: 11px;
  cursor: pointer;
}

.back:hover {
  color: var(--c-gold-2);
}

.editor-title {
  font-family: var(--font-display);
  font-size: 13px;
  letter-spacing: 0.08em;
  color: var(--c-gold-2);
  margin-left: auto;
}

.editor {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field > span {
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--c-muted);
}

.field input,
.field textarea {
  padding: 8px 11px;
  border-radius: 8px;
  border: 1px solid rgba(217, 172, 88, 0.16);
  background: rgba(12, 9, 16, 0.7);
  color: var(--c-text);
  font-family: inherit;
  font-size: 12px;
  outline: none;
  transition: border-color 0.22s var(--ease);
}

.field textarea {
  resize: vertical;
  line-height: 1.8;
}

.field input:focus,
.field textarea:focus {
  border-color: rgba(217, 172, 88, 0.5);
}

.field .md-input {
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.85;
}

.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chips .chip {
  font-size: 10.5px;
}

.flags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.flag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border-radius: 999px;
  border: 1px solid rgba(217, 172, 88, 0.16);
  background: rgba(20, 16, 26, 0.6);
  color: var(--c-text-2);
  font-size: 10.5px;
  cursor: pointer;
  transition: all 0.2s var(--ease);
}

.flag.on {
  color: #fff3e0;
  border-color: rgba(242, 219, 166, 0.45);
  background: linear-gradient(150deg, rgba(165, 42, 54, 0.7), rgba(100, 28, 43, 0.4));
}

.flag.preview-toggle {
  margin-left: auto;
}

.preview-box {
  padding: 18px 20px;
  border-radius: 10px;
  border: 1px solid rgba(217, 172, 88, 0.14);
  background: rgba(18, 14, 23, 0.8);
  max-height: 520px;
  overflow-y: auto;
}

.series-thumb {
  width: 72px;
  height: 46px;
  flex: none;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid rgba(217, 172, 88, 0.18);
  background: rgba(12, 9, 16, 0.6);
}

.editor-tip {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0;
  font-size: 10px;
  line-height: 1.7;
  color: var(--c-muted);
}

.preview-title {
  margin: 0 0 14px;
  font-size: 22px;
}

/* 导入导出 */
.data-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.data-card {
  padding: 16px;
  border-radius: 11px;
  border: 1px solid rgba(217, 172, 88, 0.14);
  background: rgba(26, 21, 34, 0.7);
}

.data-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  border: 1px solid rgba(217, 172, 88, 0.22);
  color: var(--c-gold);
  margin-bottom: 10px;
}

.data-card h3 {
  margin: 0 0 6px;
  font-size: 15px;
  letter-spacing: 0.04em;
}

.data-card p {
  margin: 0 0 12px;
  font-size: 11px;
  line-height: 1.75;
  color: var(--c-muted);
}

.data-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 16px;
  border-radius: 9px;
  border: 1px dashed rgba(217, 172, 88, 0.3);
  background: rgba(12, 9, 16, 0.5);
  color: var(--c-muted);
  cursor: pointer;
  transition: all 0.22s var(--ease);
}

.dropzone:hover,
.dropzone.over {
  border-color: rgba(217, 172, 88, 0.65);
  background: rgba(165, 42, 54, 0.12);
  color: var(--c-gold-2);
}

.dropzone strong {
  font-size: 11.5px;
  color: var(--c-text);
}

.dropzone span {
  font-family: var(--font-mono);
  font-size: 9px;
}

.log {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 9px;
  border: 1px solid rgba(217, 172, 88, 0.12);
  background: rgba(20, 16, 26, 0.6);
}

.log-head {
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--c-gold);
  margin-bottom: 6px;
}

.log-row {
  display: flex;
  gap: 12px;
  font-family: var(--font-mono);
  font-size: 9.5px;
  color: var(--c-muted);
  padding: 3px 0;
}

.log-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--c-text-2);
}

.storage {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed rgba(217, 172, 88, 0.14);
}

.storage-row {
  display: flex;
  gap: 28px;
  margin-bottom: 14px;
}

.storage-row span {
  display: block;
  font-size: 9.5px;
  color: var(--c-muted);
}

.storage-row strong {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--c-gold-2);
}

.storage-row strong {
  word-break: break-all;
}

.repo-probe {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
  margin: 0 0 10px;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid rgba(143, 180, 155, 0.28);
  background: rgba(143, 180, 155, 0.08);
  font-size: 10px;
  line-height: 1.6;
  color: #a9d0b8;
}

.repo-probe.bad {
  border-color: rgba(199, 60, 75, 0.35);
  background: rgba(165, 42, 54, 0.12);
  color: #ffc4cc;
}

.repo-probe a {
  color: inherit;
  border-bottom: 1px dashed currentColor;
}

.build-tip {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  margin: 2px 0 0;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px dashed rgba(217, 172, 88, 0.18);
  background: rgba(217, 172, 88, 0.04);
  font-size: 9.5px;
  line-height: 1.7;
  color: var(--c-muted);
}

.danger-zone {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 仪表 */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}

.stat-card {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(217, 172, 88, 0.14);
  background: linear-gradient(160deg, rgba(44, 32, 46, 0.7), rgba(24, 19, 31, 0.8));
}

.stat-card span {
  display: block;
  font-size: 9.5px;
  letter-spacing: 0.08em;
  color: var(--c-muted);
  margin-bottom: 4px;
}

.stat-card strong {
  font-family: var(--font-display);
  font-size: 24px;
  color: var(--c-gold-2);
  line-height: 1.1;
}

.stat-card em {
  font-style: normal;
  font-size: 9px;
  color: var(--c-muted);
  margin-left: 3px;
}

.chart-card {
  padding: 14px 16px 10px;
  border-radius: 11px;
  border: 1px solid rgba(217, 172, 88, 0.14);
  background: rgba(22, 17, 29, 0.7);
  margin-bottom: 14px;
}

.chart-head {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--c-text-2);
  margin-bottom: 10px;
}

.chart-head em {
  font-style: normal;
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--c-muted);
}

.chart {
  display: flex;
  align-items: flex-end;
  gap: 5px;
  height: 130px;
  padding-top: 6px;
}

.bar-col {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 1px;
  position: relative;
  padding-bottom: 16px;
}

.bar {
  width: 42%;
  border-radius: 2px 2px 0 0;
  transition: height 0.4s var(--ease);
}

.bar.pv {
  background: linear-gradient(180deg, #d9ac58, #8e2634);
}

.bar.uv {
  background: rgba(120, 190, 165, 0.55);
}

.bar-col em {
  position: absolute;
  bottom: 0;
  font-style: normal;
  font-family: var(--font-mono);
  font-size: 8px;
  color: var(--c-muted);
  white-space: nowrap;
}

.grid-line {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 16px;
  height: 1px;
  background: rgba(217, 172, 88, 0.08);
}

.stat-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.mini-card {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(217, 172, 88, 0.12);
  background: rgba(22, 17, 29, 0.7);
}

.mini-head {
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--c-gold);
  margin-bottom: 8px;
}

.rank {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rank li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10.5px;
  color: var(--c-text-2);
}

.rank-num {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--c-gold-dim);
  width: 16px;
}

.rank-path {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank em {
  font-style: normal;
  font-family: var(--font-mono);
  font-size: 9.5px;
  color: var(--c-gold-2);
}

.rank .empty {
  color: var(--c-muted);
  font-size: 10px;
}

.stat-note {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 12px 0 0;
  font-size: 9.5px;
  color: var(--c-muted);
  line-height: 1.6;
}

@media (max-width: 700px) {
  .data-grid,
  .stat-columns,
  .row-2 {
    grid-template-columns: 1fr;
  }
  .stat-grid {
    grid-template-columns: 1fr 1fr;
  }
  .summary {
    flex-wrap: wrap;
  }
}
</style>
