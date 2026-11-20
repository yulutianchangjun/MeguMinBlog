<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ImageLightbox from '@/components/common/ImageLightbox.vue'
import { renderMermaidBlocks } from '@/lib/mermaid'

/**
 * Markdown 渲染容器。
 *
 * v-html 插入的节点不在 Vue 的虚拟 DOM 里，Mermaid 需要在「真实的 DOM 就绪之后」再编译。
 * 单靠 onMounted 或 watch + nextTick 都会被下面这些情况绕过：
 * - `<transition mode="out-in">`：新组件挂载晚于 nextTick，容器 ref 还是 null
 * - 异步内容到达：v-html 被替换成新节点，旧节点上的 svg 一起消失
 * - 路由复用同一组件：容器没重建，但内容变了
 *
 * 所以这里用三条路径兜住：挂载后 / html 变化后 / 容器 DOM 发生变更时（MutationObserver）。
 * renderMermaidBlocks 本身幂等，重复调用不会重复渲染。
 */

defineOptions({ inheritAttrs: false })

const props = defineProps<{ html: string }>()

const root = ref<HTMLElement | null>(null)
const lightbox = ref<{ src: string; alt: string } | null>(null)

let observer: MutationObserver | null = null
let timer: number | null = null

/** 合并同一批 DOM 变更，避免 MutationObserver 连触发多次编译 */
function scheduleRender() {
  if (timer) window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    timer = null
    void renderMermaidBlocks(root.value)
  }, 60)
}

onMounted(() => {
  void renderMermaidBlocks(root.value)
  if (typeof MutationObserver !== 'undefined' && root.value) {
    // mermaid 渲染自己的 DOM 也会触发，但那时节点已带 svg，下一次调用会直接返回
    observer = new MutationObserver(scheduleRender)
    observer.observe(root.value, { childList: true, subtree: true })
  }
})

watch(
  () => props.html,
  async () => {
    await nextTick()
    void renderMermaidBlocks(root.value)
    // v-html 换掉整棵子树后，observer 仍绑在同一个根节点上，无需重建
  },
)

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
  if (timer) window.clearTimeout(timer)
})

function onClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  if (target instanceof HTMLImageElement && target.classList.contains('md-image')) {
    lightbox.value = { src: target.currentSrc || target.src, alt: target.alt }
  }
}
</script>

<template>
  <div ref="root" v-bind="$attrs" v-html="html" @click="onClick"></div>
  <ImageLightbox :src="lightbox?.src || ''" :alt="lightbox?.alt || ''" @close="lightbox = null" />
</template>
