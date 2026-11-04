# 爆裂魔法使的手记 · Megumin Blog

一个以「爆裂魔法」为核心概念的暗黑复古魔幻风个人博客。Vue 3 + TypeScript + Vite + Pinia + Vue Router，纯静态、无后端，可直接部署到 GitHub Pages。

视觉素材取自仓库内 `meguminUI/slices/`（惠惠主题 UI 素材切片），调色板与布局按《个人博客系统架构与需求设计说明书》实现。

---

## 快速开始

```bash
npm install
npm run dev        # 本地开发 http://localhost:5173
npm run build      # 生产构建，输出 dist/
npm run preview    # 预览构建产物
npm run typecheck  # vue-tsc 类型检查
```

Node 版本建议 20+。

---

## 功能一览

| 模块 | 已实现 |
| --- | --- |
| 全局布局 | Header（LOGO / 导航 / 操作区）、左侧博主卡 + 音乐播放器、右侧日历 + 纪念日倒计时、Footer；响应式单列降级 |
| 首页 | 打字机欢迎语、魔法阵与星火粒子、近期精选、置顶留言走马灯、签到成就看板、综集速览 |
| 日常流 | 多分类筛选、全文/标题实时搜索、最新/最早/最热排序、数字分页；筛选与页码同步至 URL Query + `KeepAlive` + 滚动位置还原 |
| 文章详情 | 封面 Hero（缺省回退主题色）、Markdown 渲染与代码高亮、右侧栏切换文章目录、滚动高亮与阅读进度、悬浮返回/回顶、点赞、复制链接、上下篇 |
| 评论 | 访客填昵称即可发表一级评论；博主可置顶、删除、盖楼回复（唯一二级嵌套） |
| 综集 | 横向轮播（滚动吸附 + 箭头/圆点）、合集内复用日常卡片、不提供全局检索 |
| 留言墙 | 上/左/右三面软木板，每面每批 5 张；钉满自动封存并开启新批次，可回看历史批次；访客自定义底色、字色、纸纹与墙面；右下角签名与时间戳 |
| 管理面板 | 隐藏唤起（连点头像 5 次或 `Ctrl + Shift + L`）、GitHub PAT / 离线口令鉴权、文章新建/编辑/删除/置顶/隐藏/草稿、Markdown 预览、ZIP（Markdown + JSON）导出、`.md`/`.json`/`.zip` 拖拽导入、UV 仪表盘 |
| 签到 | 累计与连续天数、四枚徽章、仅博主可打卡，状态本地持久化 |
| 404 | 主题 404 插画 + 返回入口 |

### 角色权限

- **访客**：浏览公开内容、一级评论、点赞、查看日历/倒计时/签到成就、听合成音乐；看不到任何管理入口。
- **博主**：可见隐藏与草稿内容，管理文章、置顶/删除评论与留言、盖楼回复、签到、导入导出、查看 UV。

---

## 内容组织

文章为 Markdown + Frontmatter，放在 `content/posts/`，构建期通过 `import.meta.glob` 打包为静态资源。示例：

```markdown
---
title: 为何我每天只放一发爆裂魔法
subtitle: 把全部魔力押在一瞬的美学
date: 2026-10-28
categories:
  - 爆裂魔法
  - 魔法研究
collections: explosion-theory
cover: assets/megumin/megumin-cast.png
excerpt: 有人问我，为什么不多放几发？
pinned: true
---

## 小标题

正文……
```

支持的字段：`title` `subtitle` `date` `updated` `categories` `tags` `collections` `cover` `excerpt` `pinned` `hidden` `draft`。
`cover` 使用相对 `public/` 的路径（如 `assets/megumin/xxx.png`），留空则渲染魔法底纹占位。

综集定义在 `content/collections.json`（含 `siteStartDate`，用于「开站第 N 天」）。

站点信息（站名、博主资料、社交外链、纪念日、管理员 GitHub 账号）在 `src/data/site.ts`。

---

## 管理入口与鉴权

页面不常驻登录按钮。唤起方式：

1. 连续点击左侧头像 **5 次**；
2. 或按 `Ctrl + Shift + L`。

两种鉴权方式：

- **GitHub PAT**：在 `src/data/site.ts` 中把 `admin.githubLogin` 设为你的 GitHub 用户名，然后在 GitHub 生成一枚带 `read:user` 权限的令牌（Token 仅存于 `sessionStorage`，关闭浏览器即失效，请求只发往 `api.github.com`）。若 `githubLogin` 留空，则任意有效令牌都会被视为博主。
- **离线口令**：默认 `explosion`，可在 `site.admin.demoPassphrase` 修改。用于无法访问 GitHub 的场景。

> 安全说明：本站无后端，鉴权只作用于前端界面层（`localStorage` 中的会话状态），无法阻止懂技术的人直接改写本地数据。它适用于个人博客的「防止误入」，不适合保护敏感信息。若需要真正的写权限控制，请把内容变更走 GitHub API/PR 或接入带服务端鉴权的 BaaS。

---

## 数据与持久化

静态内容来自 `content/`；运行期的编辑、评论、留言、点赞、签到、访问统计均保存在浏览器 `localStorage`（前缀 `mgm:`）：

- `mgm:content`：文章的增删改覆盖层（不改动源 Markdown）
- `mgm:comments` / `mgm:messages` / `mgm:likes` / `mgm:liked`
- `mgm:checkin`：签到日期与累计次数
- `mgm:uv` / `mgm:visitor-id`：访问统计（按天记录 PV/UV 与页面热度）
- `mgm:auth`（会话内）

因此「管理面板里的编辑」只对当前浏览器生效。要让改动进入仓库，请用管理面板 **导出 ZIP**（`posts/*.md` + `collections.json` + `data/*.json`），把 Markdown 覆盖回 `content/posts/` 后提交；或直接修改 Markdown。

评论、留言、UV 均为本地演示级实现，未接入 Giscus / LeanCloud / Supabase。如需真实多端同步，替换 `src/stores/interaction.ts` 与 `src/stores/profile.ts` 的数据访问层即可，视图无需改动。

---

## 部署到 GitHub Pages

仓库已包含 `.github/workflows/deploy.yml`：推送到 `main` 后自动安装依赖、类型检查、构建并发布 `dist/`。

1. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**；
2. 推送代码即可；
3. 路由使用 **Hash 模式**（`/#/posts`），配合相对资源路径，无需配置 404 回退，项目页与自定义域名都能直接工作。

---

## 目录结构

```
content/                  # Markdown 文章与综集定义
public/assets/megumin/    # 从 meguminUI 切片中挑选并重命名的主题素材
src/
  components/
    admin/                # 登录弹窗、管理面板
    common/               # 图标、打字机、魔法阵、星火
    layout/               # Header / Footer / 侧栏 / 背景
    post/                 # 文章卡片、评论区
    widgets/              # 博主卡、音乐播放器、日历、倒计时、目录
  data/                   # 站点配置、种子内容加载、演示互动数据
  lib/                    # Frontmatter、Markdown、音频合成、导入导出、工具
  router/
  stores/                 # auth / content / interaction / profile / reading / ui
  styles/                 # 设计令牌、基础样式、正文排版
  views/                  # 首页、日常流、详情、综集、留言墙、关于、404
meguminUI/                # 原始素材与切片（未参与构建）
```

---

## 设计说明

- 调色板：核心爆裂红 `#A52A36`、深红暗影 `#641C2B`、深渊暗黑 `#17151C`、魔法阵金 `#D9AC58`、卷轴米白 `#F4EBDD`。
- 素材原图为浅色底，为融入暗色主题，封面统一走「暗红底 + `mix-blend-mode: multiply`」做双色调处理；页面内保留金色符文细线、羊皮纸便签与魔法阵微光动效。
- 音乐播放器没有使用音频文件，而是用 Web Audio 实时合成三段短循环（可在 `src/lib/chime.ts` 调整旋律），因此首屏不加载任何音频资源。
- 图标为内联 SVG 组件 `MagicIcon`，无额外图标库依赖。

## 素材

视觉素材来自 `meguminUI/slices/`（惠惠主题 UI 素材包），仅用于本项目主题演示；角色与作品版权归原作者及版权方所有。
