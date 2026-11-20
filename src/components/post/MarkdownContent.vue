<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ImageLightbox from '@/components/common/ImageLightbox.vue'
import SvgLightbox from '@/components/common/SvgLightbox.vue'
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
const svgPreview = ref<{ svg: string; label: string } | null>(null)

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
  if (!target) return

  // 正文图片 → 图片灯箱
  if (target instanceof HTMLImageElement && target.classList.contains('md-image')) {
    lightbox.value = { src: target.currentSrc || target.src, alt: target.alt }
    return
  }

  // Mermaid 图表 → 矢量放大预览
  const wrap = target.closest('.mermaid-wrap')
  if (!wrap) return
  const source = wrap.querySelector('svg')
  if (!source) return
  openMermaid(source, wrap as HTMLElement)
}

/** 克隆图表并交给 SvgLightbox：解除固定宽度，保留 viewBox 以便无损缩放 */
function openMermaid(source: SVGSVGElement, wrap: HTMLElement) {
  const clone = source.cloneNode(true) as SVGSVGElement
  // 不要改 svg 的 id：mermaid 把样式写成 `#<svgId> .node rect{...}`，
  // 改了 id 选择器就失配，图表会退回全黑默认色。
  // 克隆体与原图共用 id 在 CSS 层面是安全的（选择器会同时命中两份，内容相同）。

  const rect = source.getBoundingClientRect()
  const box = source.viewBox?.baseVal
  const width = Math.round(box && box.width ? box.width : rect.width)
  const height = Math.round(box && box.height ? box.height : rect.height)

  clone.removeAttribute('width')
  clone.removeAttribute('height')
  // 注意：不能整个删掉 style —— mermaid 把主题色变量（--mermaid-*）写在 svg 的
  // 内联 style 上，删了会导致节点/连线全部变黑。这里只覆盖尺寸相关声明。
  clone.style.width = `${width}px`
  clone.style.height = `${height}px`
  clone.style.maxWidth = '90vw'
  clone.style.maxHeight = '78vh'

  // 用图表上方最近的标题作为脚注，方便知道自己在看哪一节
  let label = ''
  let node = wrap.previousElementSibling
  while (node && !label) {
    if (/^H[1-6]$/.test(node.tagName)) label = node.textContent?.trim() ?? ''
    node = node.previousElementSibling
  }

  svgPreview.value = { svg: clone.outerHTML, label }
}
</script>

<template>
  <div ref="root" v-bind="$attrs" v-html="html" @click="onClick"></div>
  <ImageLightbox :src="lightbox?.src || ''" :alt="lightbox?.alt || ''" @close="lightbox = null" />
  <SvgLightbox :svg="svgPreview?.svg || ''" :label="svgPreview?.label || ''" @close="svgPreview = null" />
</template>
