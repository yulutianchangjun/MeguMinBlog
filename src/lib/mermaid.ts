/**
 * Mermaid 按需渲染。
 * 只有页面里真的出现 ```mermaid 代码块时才动态加载 mermaid（约 1MB，独立 chunk），
 * 避免每个访客都为图表付出首屏体积。
 *
 * 渲染调度不依赖某个固定生命周期：调用方在挂载后、DOM 变化后都应调用一次，
 * 本函数是幂等的（已渲染 / 渲染中 / 语法错误 的节点都会跳过）。
 */

type MermaidApi = typeof import('mermaid')['default']

let loading: Promise<MermaidApi> | null = null
let seq = 0

/** 节点在过渡动画中被跳过时，主动延迟重试；DOM 不变时 MutationObserver 不会触发 */
let retryRoot: HTMLElement | null = null
let retryTimer: number | null = null
let retryCount = 0
const MAX_RETRY = 8

function scheduleRetry(root: HTMLElement) {
  retryRoot = root
  if (retryTimer || retryCount >= MAX_RETRY) return
  retryTimer = window.setTimeout(() => {
    retryTimer = null
    retryCount += 1
    const target = retryRoot
    retryRoot = null
    // 容器已被移除（路由已离开）就停止重试
    if (target && target.isConnected) void renderMermaidBlocks(target)
  }, 320)
}

/** 同一节点最多尝试几次（应对过渡动画期间节点不可见导致的空渲染等） */
const MAX_ATTEMPTS = 6

/** 站点暗红主题，与全局配色（爆裂红 / 深渊黑 / 魔法阵金）保持一致 */
const THEME_VARIABLES: Record<string, string | boolean> = {
  darkMode: true,
  background: '#17151C',
  fontFamily: '"Noto Sans SC", "PingFang SC", system-ui, sans-serif',
  fontSize: '14px',
  primaryColor: '#3a1b24',
  primaryTextColor: '#F4EBDD',
  primaryBorderColor: '#A52A36',
  secondaryColor: '#241a2e',
  secondaryTextColor: '#F4EBDD',
  secondaryBorderColor: '#641C2B',
  tertiaryColor: '#1c1624',
  tertiaryTextColor: '#F4EBDD',
  tertiaryBorderColor: '#641C2B',
  mainBkg: '#241a2e',
  nodeBorder: '#A52A36',
  nodeTextColor: '#F4EBDD',
  clusterBkg: 'rgba(36,26,46,0.72)',
  clusterBorder: '#641C2B',
  lineColor: '#D9AC58',
  textColor: '#F4EBDD',
  titleColor: '#F4EBDD',
  edgeLabelBackground: '#17151C',
  actorBkg: '#2b2231',
  actorBorder: '#A52A36',
  actorTextColor: '#F4EBDD',
  actorLineColor: '#641C2B',
  signalColor: '#D9AC58',
  signalTextColor: '#F4EBDD',
  labelBoxBkgColor: '#241a2e',
  labelBoxBorderColor: '#641C2B',
  labelTextColor: '#F4EBDD',
  loopTextColor: '#F4EBDD',
  noteBkgColor: '#2b2231',
  noteBorderColor: '#D9AC58',
  noteTextColor: '#F4EBDD',
  activationBkgColor: '#3a1b24',
  activationBorderColor: '#A52A36',
  sequenceNumberColor: '#17151C',
}

async function loadMermaid(): Promise<MermaidApi> {
  loading ??= import('mermaid')
    .then((mod) => {
      const mermaid = mod.default
      mermaid.initialize({
        startOnLoad: false,
        // strict：不执行图表里的 HTML/脚本，降低注入风险
        securityLevel: 'strict',
        theme: 'base',
        themeVariables: THEME_VARIABLES,
        flowchart: { curve: 'basis', useMaxWidth: true, htmlLabels: true },
        sequence: { useMaxWidth: true, mirrorActors: false },
        gantt: { useMaxWidth: true },
        pie: { useMaxWidth: true },
        er: { useMaxWidth: true },
        journey: { useMaxWidth: true },
      })
      return mermaid
    })
    .catch((error) => {
      // 加载失败（网络抖动 / chunk 404）时清掉缓存，下次调用可重试
      loading = null
      throw error
    })
  return loading
}

/**
 * 把容器里待渲染的 `pre.mermaid` 渲染成 SVG。
 * - 幂等：已渲染（含 svg）、渲染中、语法错误的节点都跳过
 * - 单块失败只影响该块：保留原始代码 + 提示，不影响整篇文章
 */
export async function renderMermaidBlocks(root: HTMLElement | null | undefined): Promise<void> {
  if (!root) return
  const nodes = Array.from(root.querySelectorAll<HTMLElement>('pre.mermaid')).filter((node) => {
    if (node.querySelector('svg')) return false
    if (node.dataset.rendering === '1') return false
    if (node.dataset.failed === '1') return false
    return Number(node.dataset.attempts || '0') < MAX_ATTEMPTS
  })
  if (nodes.length === 0) {
    // 没有待处理节点说明都成功了，重置重试预算
    retryCount = 0
    return
  }

  let mermaid: MermaidApi
  try {
    mermaid = await loadMermaid()
  } catch {
    // 加载失败不标记失败，留给下一次（路由切换 / MutationObserver）重试
    return
  }

  for (const node of nodes) {
    // 节点还没进文档（过渡动画中/即将被替换）时先不渲染：此时量不到尺寸，
    // mermaid 容易产出空图。等 MutationObserver 或下一次 watch 再调用。
    if (!node.isConnected) {
      scheduleRetry(root)
      continue
    }
    // 过渡动画/折叠状态下量不到尺寸，先跳过，等下一拍再试
    const rect = node.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) {
      scheduleRetry(root)
      continue
    }

    const code = node.textContent ?? ''
    if (!code.trim()) {
      node.dataset.failed = '1'
      continue
    }
    node.dataset.rendering = '1'
    node.dataset.attempts = String(Number(node.dataset.attempts || '0') + 1)
    const renderId = `mermaid-${Date.now()}-${seq++}`
    try {
      const { svg } = await mermaid.render(renderId, code)
      if (!svg || !svg.includes('<svg')) {
        // 渲染出空结果（通常是节点处于隐藏/过渡中），保持原样等待重试
        node.classList.remove('mermaid-done')
        scheduleRetry(root)
        continue
      }
      node.innerHTML = svg
      node.classList.add('mermaid-done')
      node.classList.remove('mermaid-error')
      retryCount = 0
    } catch {
      // 语法错误：保留原文，插入一次提示，不再重试
      node.dataset.failed = '1'
      node.classList.add('mermaid-error')
      if (node.dataset.tip !== '1') {
        node.dataset.tip = '1'
        node.insertAdjacentHTML(
          'beforebegin',
          '<div class="mermaid-error-tip">图表语法有误，已按原文显示</div>',
        )
      }
      if (import.meta.env.DEV) {
        console.warn('[mermaid] render failed, original code kept')
      }
    } finally {
      delete node.dataset.rendering
      // mermaid.render 失败时可能在 body 残留临时容器。
      // 注意：成功时返回的 <svg> 也带 renderId 这个 id，且已放进 node 里，
      // 所以这里只能删 body 下的临时 div，绝不能按 renderId 去删元素。
      const ghost = document.getElementById(`d${renderId}`)
      if (ghost && ghost.parentElement === document.body) ghost.remove()
    }
  }
}
