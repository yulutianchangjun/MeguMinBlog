import { createDiscreteApi, darkTheme } from 'naive-ui'

const { message, notification } = createDiscreteApi(['message', 'notification'], {
  configProviderProps: {
    theme: darkTheme,
    themeOverrides: {
      common: {
        primaryColor: '#A52A36',
        primaryColorHover: '#C73C4B',
        successColor: '#8FB49B',
        warningColor: '#D9AC58',
        errorColor: '#C73C4B',
        borderRadius: '10px',
        fontFamily: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
      },
    },
  },
})

export const toast = {
  success: (text: string) => message.success(text, { duration: 2600 }),
  info: (text: string) => message.info(text, { duration: 2600 }),
  warning: (text: string) => message.warning(text, { duration: 3000 }),
  error: (text: string) => message.error(text, { duration: 3200 }),
  notify: (title: string, content: string) =>
    notification.success({ title, content, duration: 4200, keepAliveOnHover: true }),
}
