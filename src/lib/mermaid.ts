/**
 * Mermaid 按需渲染。
 * 只有页面里真的出现 ```mermaid 代码块时才动态加载 mermaid（约 1MB，独立 chunk），
 * 避免每个访客都为图表付出首屏体积。
 */

type MermaidApi = typeof import('mermaid')['default']

let loading: Promise<MermaidApi> | null = null
let seq = 0

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
  loading ??= import('mermaid').then((mod) => {
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
  return loading
}

/**
 * 把容器里所有未处理的 `pre.mermaid` 渲染成 SVG。
 * 单块失败只影响该块：保留原始代码并标记 class，避免整篇文章白屏。
 */
export async function renderMermaidBlocks(root: HTMLElement | null | undefined): Promise<void> {
  if (!root) return
  const nodes = Array.from(root.querySelectorAll<HTMLElement>('pre.mermaid:not([data-rendered])'))
  if (nodes.length === 0) return

  let mermaid: MermaidApi
  try {
    mermaid = await loadMermaid()
  } catch {
    nodes.forEach((node) => {
      node.dataset.rendered = 'error'
      node.classList.add('mermaid-error')
    })
    return
  }

  for (const node of nodes) {
    const code = node.textContent ?? ''
    node.dataset.rendered = '1'
    if (!code.trim()) continue
    node.id = `mermaid-${Date.now()}-${seq++}`
    try {
      const { svg } = await mermaid.render(`${node.id}-svg`, code)
      node.innerHTML = svg
      node.classList.add('mermaid-done')
    } catch (error) {
      node.classList.add('mermaid-error')
      node.innerHTML =
        `<span class="mermaid-error-tip">图表语法有误，已按原文显示</span>` +
        `<code>${escapeHtml(code)}</code>`
      if (import.meta.env.DEV) {
        console.warn('[mermaid] render failed:', error)
      }
    }
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
