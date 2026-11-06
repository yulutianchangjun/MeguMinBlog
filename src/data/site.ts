import type { SiteConfig } from '@/types'

export const site: SiteConfig = {
  title: '爆裂魔法使的手记',
  subtitle: 'Explosion Notes',
  author: {
    name: '云汀凫',
    enName: 'changyan',
    avatar: 'assets/megumin/megumin-chibi.webp',
    bio: '红魔族大魔法使。一日一爆，专精爆裂魔法。副业是写日记，主业是找没人的荒野。',
    location: '阿克塞尔 · 红魔之里',
    socials: [
      { label: 'GitHub', icon: 'github', href: 'https://github.com/yulutianchangjun' },
      // { label: 'RSS', icon: 'rss', href: '#/posts' },
      // { label: 'Mail', icon: 'mail', href: 'mailto:megumin@example.com' },
    ],
  },
  // —— 反机器人：Cloudflare Turnstile 站点公钥（也可用 VITE_TURNSTILE_SITE_KEY 覆盖）——
  // —— 文章评论与留言墙均走本站后端（MySQL），与 GitHub 无关 ——
  turnstile: {
    siteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY || '',
  },
  // —— 纪念日倒计时与开站日期已迁至后端（GET /api/site），后台「站点设置」可管理 ——
  icp: '',
}
