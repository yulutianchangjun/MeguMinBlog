import type { SiteConfig } from '@/types'

/**
 * 站点品牌与博主资料（前台展示用）。
 * 换成你自己的：改下面的 title/subtitle 与 author 各字段即可。
 * 注意：站点标题同时被 index.html 的 <title>、Logo 文案引用，如需一致请一并修改。
 * 开站日期、纪念日不在本文件——它们在数据库里，登录后台「站点设置」tab 管理。
 */
export const site: SiteConfig = {
  title: '爆裂魔法使的手记',
  subtitle: 'Explosion Notes',
  author: {
    // 改这里换成你的名字 / 昵称
    name: '云汀凫',
    enName: 'changyan',
    avatar: 'assets/megumin/megumin-chibi.webp',
    bio: '红魔族大魔法使。一日一爆，专精爆裂魔法。副业是写日记，主业是找没人的荒野。',
    location: '阿克塞尔 · 红魔之里',
    // 社交链接：icon 可选 github / rss / mail，不需要的整行注释掉
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
