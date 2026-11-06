/**
 * 全局请求进度条（NProgress 风格，主题化配色）
 *
 * - 颜色：深渊深红 → 爆裂红 → 魔法阵金 的渐变，带金色辉光
 * - 并发请求引用计数：第一个请求开始出现，最后一个请求完成收尾
 * - 普通请求用缓动模拟进度（逼近 90%）；上传请求可通过 set() 注入真实进度
 * - 请求失败时进度条短暂切换为更亮的警示红后消失
 * 自包含模块：DOM 与样式均动态注入，无需依赖全局 CSS。
 */

const BAR_ID = 'mgm-progress-root'
const STYLE_ID = 'mgm-progress-style'

const STYLE = `
.mgm-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 10px;
  z-index: 9999;
  pointer-events: none;
  opacity: 1;
  transition: opacity 0.45s ease 0.15s;
}
.mgm-progress.is-leaving {
  opacity: 0;
}
.mgm-progress__track {
  position: relative;
  height: 100%;
  width: 100%;
  background: linear-gradient(90deg, rgba(100, 28, 43, 0.55), rgba(23, 21, 28, 0.35));
  box-shadow: inset 0 1px 0 rgba(217, 172, 88, 0.14);
}
.mgm-progress__bar {
  position: relative;
  height: 100%;
  width: 0%;
  border-radius: 0 4px 4px 0;
  background: linear-gradient(90deg, #641c2b 0%, #a52a36 42%, #c73c4b 68%, #d9ac58 100%);
  box-shadow:
    0 0 14px rgba(217, 172, 88, 0.55),
    0 0 6px rgba(165, 42, 54, 0.85),
    0 2px 10px rgba(0, 0, 0, 0.6);
  transition: width 0.24s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.mgm-progress__bar.is-error {
  background: linear-gradient(90deg, #a52a36 0%, #c73c4b 55%, #f2dba6 100%);
  box-shadow:
    0 0 18px rgba(199, 60, 75, 0.8),
    0 0 8px rgba(242, 219, 166, 0.7),
    0 2px 10px rgba(0, 0, 0, 0.6);
}
.mgm-progress__peg {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: 140px;
  transform: translateX(100%);
  background: linear-gradient(90deg, rgba(242, 219, 166, 0) 0%, rgba(242, 219, 166, 0.65) 100%);
  opacity: 0.9;
  animation: mgm-progress-peg 1.1s ease-out infinite;
  pointer-events: none;
}
@keyframes mgm-progress-peg {
  0% { transform: translateX(100%); opacity: 0.9; }
  60% { transform: translateX(60%); opacity: 0; }
  100% { transform: translateX(60%); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .mgm-progress__peg { animation: none; opacity: 0.45; }
}
`

interface ProgressState {
  pending: number
  value: number
  timer: ReturnType<typeof setTimeout> | null
  failed: boolean
  teardown: ReturnType<typeof setTimeout> | null
}

const state: ProgressState = {
  pending: 0,
  value: 0,
  timer: null,
  failed: false,
  teardown: null,
}

let root: HTMLElement | null = null
let bar: HTMLElement | null = null

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = STYLE
  document.head.appendChild(style)
}

function mount(): void {
  ensureStyle()
  if (root) return
  root = document.createElement('div')
  root.className = 'mgm-progress'
  root.setAttribute('role', 'progressbar')
  root.setAttribute('aria-label', '请求加载中')
  root.setAttribute('aria-hidden', 'false')

  const track = document.createElement('div')
  track.className = 'mgm-progress__track'
  bar = document.createElement('div')
  bar.className = 'mgm-progress__bar'

  const peg = document.createElement('div')
  peg.className = 'mgm-progress__peg'
  bar.appendChild(peg)

  track.appendChild(bar)
  root.appendChild(track)
  document.body.appendChild(root)
}

function unmount(): void {
  if (root) {
    root.remove()
    root = null
    bar = null
  }
  state.timer && clearTimeout(state.timer)
  state.timer = null
  state.teardown && clearTimeout(state.teardown)
  state.teardown = null
}

function render(): void {
  if (bar) bar.style.width = `${state.value}%`
}

function scheduleTick(): void {
  if (state.timer) return
  state.timer = setTimeout(() => {
    state.timer = null
    if (state.pending <= 0) return
    // 缓动逼近 90%：越接近越慢，制造"仍在进行"的观感
    const remaining = 90 - state.value
    if (remaining > 0.5) {
      state.value = Math.min(90, state.value + remaining * 0.16 + 0.6)
      render()
    }
    scheduleTick()
  }, 180 + Math.random() * 160)
}

function finish(): void {
  state.value = 100
  render()
  if (bar && state.failed) bar.classList.add('is-error')
  // 等宽度动画完成后淡出并卸载
  state.teardown = setTimeout(() => {
    if (root) root.classList.add('is-leaving')
    state.teardown = setTimeout(unmount, 550)
  }, 260)
}

export const progress = {
  /** 请求发起时调用（可重入，并发安全） */
  start(): void {
    state.pending += 1
    if (state.teardown) {
      clearTimeout(state.teardown)
      state.teardown = null
      if (root) root.classList.remove('is-leaving')
    }
    if (state.pending === 1) {
      state.value = 0
      state.failed = false
      mount()
      // 起手先推到 ~15%，让"请求已发出"立刻可感知
      state.value = 12 + Math.random() * 8
      render()
      scheduleTick()
    } else if (state.value < 20) {
      state.value = 20
      render()
    }
    if (bar) {
      bar.classList.remove('is-error')
      root?.setAttribute('aria-hidden', 'false')
    }
  },

  /** 注入真实进度（如上传 onUploadProgress），封顶 95% 留出响应阶段 */
  set(percent: number): void {
    if (state.pending <= 0) return
    const next = Math.max(0, Math.min(95, percent))
    if (next > state.value) {
      state.value = next
      render()
    }
  },

  /** 请求结束时调用；ok=false 时以警示红收尾 */
  done(ok = true): void {
    state.pending = Math.max(0, state.pending - 1)
    if (!ok) state.failed = true
    if (state.pending === 0) {
      state.timer && clearTimeout(state.timer)
      state.timer = null
      if (state.teardown) {
        clearTimeout(state.teardown)
        state.teardown = null
      }
      finish()
    }
  },
}
