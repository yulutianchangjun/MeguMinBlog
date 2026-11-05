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
  admin: {
    githubLogin: '',
    demoPassphrase: 'explosion',
  },
  anniversaries: [
    { label: '云汀凫的生日', date: '11-30', note: '红魔族最伟大的魔法使诞生之日' },
    { label: '学会爆裂魔法纪念日', date: '06-15', note: '第一次把山丘夷为平地' },
    { label: '博客开站周年', date: '11-05', note: '手记的第一页' },
  ],
  icp: '',
  startDate: '2026-11-05',
}
