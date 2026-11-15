import { useDialog } from 'naive-ui'

export interface ConfirmOptions {
  /** 对话框标题，默认「确认操作」 */
  title?: string
  /** 正文，说清楚删除什么、后果是什么 */
  content: string
  /** 确认按钮文案，默认「确定删除」 */
  positiveText?: string
  /** 取消按钮文案，默认「取消」 */
  negativeText?: string
}

/**
 * 统一的危险操作二次确认（删除评论、取下便签等）。
 * 返回 Promise<boolean>：确认 true，取消 / 关闭 / 点遮罩 / 按 Esc 均为 false。
 *
 * 用法：
 *   const confirm = useConfirm()
 *   if (!(await confirm({ content: '确定删除这条评论吗？' }))) return
 */
export function useConfirm() {
  const dialog = useDialog()

  return function confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      let settled = false
      const finish = (value: boolean) => {
        if (settled) return
        settled = true
        resolve(value)
      }
      dialog.warning({
        title: options.title ?? '确认操作',
        content: options.content,
        positiveText: options.positiveText ?? '确定删除',
        negativeText: options.negativeText ?? '取消',
        maskClosable: false,
        closeOnEsc: true,
        onPositiveClick: () => {
          finish(true)
          return true
        },
        onNegativeClick: () => {
          finish(false)
          return true
        },
        onClose: () => {
          finish(false)
          return true
        },
        onMaskClick: () => finish(false),
        onEsc: () => finish(false),
      })
    })
  }
}
