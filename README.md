# 爆裂魔法使的手记 · Megumin Blog

一个以「爆裂魔法」为核心概念的暗黑复古魔幻风个人博客。**前后端分离架构**：Vue 3 + TypeScript + Vite + Pinia 前端，Spring Boot 3 + MySQL 8 + Redis 7 后端，Docker Compose + Nginx 一键部署。

视觉素材取自仓库内 `meguminUI/slices/`（惠惠主题 UI 素材切片），调色板与布局按《个人博客系统架构与需求设计说明书》实现。

> 本版（第五版）由 GitOps 纯静态方案切换为服务端方案，全部读写走 REST API。前端保留了**无后端时的只读降级**——后端不可用时，前台用构建期 Markdown 展示内容，但登录/留言/后台不可用并给出提示。完整部署步骤见 [docs/服务端部署指南.md](docs/服务端部署指南.md)。

---

## 快速开始

### 前端

```bash
npm install
npm run dev        # 本地开发 http://localhost:5173，读取 .env.development
npm run build      # 生产构建，输出 dist/
npm run preview    # 预览构建产物
npm run typecheck  # vue-tsc 类型检查
```

Node 版本建议 20+。`.env.development` 默认 `VITE_API_BASE_URL=http://localhost:8080/api`。

### 后端

```bash
# 准备 MySQL 8（建库 blog_db，utf8mb4_unicode_ci）与 Redis 7
cd backend
mvn -DskipTests package
MYSQL_PASSWORD=你的密码 java -jar target/app.jar
```

`dev` profile 自动执行建表 + 种子数据，并按 `ADMIN_USERNAME` / `ADMIN_PASSWORD`（默认 `admin` / `Explosion@2026`）创建博主账号。

### Docker Compose（生产）

```bash
cp .env.example .env    # 填 MYSQL_ROOT_PASSWORD / REDIS_PASSWORD / JWT_SECRET / ADMIN_PASSWORD
npm ci && npm run build
docker compose up -d --build
```

详见 [docs/服务端部署指南.md](docs/服务端部署指南.md)。

---

## 架构总览

```
Internet (HTTPS 443)
        │
        ▼
   Nginx (frontend 容器)
   ├── /            → Vue 3 SPA（dist/，try_files 回退 index.html）
   ├── /uploads/    → 上传的封面 / 音频（宿主机 data/uploads）
   └── /api/        → Spring Boot :8080 (backend 容器)
                         ├── MySQL 8（文章、综集、留言、音乐、签到）
                         └── Redis 7（JWT 会话、限流、PV/UV）
```

- **鉴权**：账号密码登录 → BCrypt 校验 → JWT（HS256，7 天）→ Redis 白名单；退出登录即删除会话，旧 token 立即失效。
- **防刷**：Redis 分钟/小时双窗口限流（同 IP 每分钟 1 条、每小时 5 条留言）+ Cloudflare Turnstile 服务端校验 + Jsoup 文本净化。
- **上传**：图片 8MB / 音频 30MB，UUID 文件名落盘 `data/uploads`，经 Nginx `/uploads/` 对外提供。

---

## 功能一览

| 模块 | 已实现 |
| --- | --- |
| 全局布局 | Header（LOGO / 导航 / 操作区）、左侧博主卡 + 音乐播放器、右侧日历 + 纪念日倒计时、Footer；响应式单列降级 |
| 首页 | 打字机欢迎语、火雨与星屑粒子、近期精选、置顶留言走马灯、签到成就看板、综集速览 |
| 日常流 | 多分类筛选、全文/标题实时搜索、最新/最早/最热排序、数字分页；筛选与页码同步至 URL Query + `KeepAlive` + 滚动位置还原；空结果时展示双栏空状态 |
| 文章详情 | 封面 Hero（缺省回退主题色）、Markdown 渲染与代码高亮、目录滚动高亮与阅读进度、悬浮返回/回顶、点赞、复制链接、上下篇 |
| 综集 | 横向轮播（滚动吸附 + 箭头/圆点）、封面等比完整展示 + 同图模糊底衬、合集内复用日常卡片 |
| 留言墙 | 上/左/右三面软木板，每面每批 5 张；钉满自动封存并开启新批次，可回看历史批次；访客自定义底色、字色、纸纹与墙面；右下角签名与时间戳；点击卡片 FLIP 抽取式放大预览。**数据存 MySQL**，发表走 API（限流 + Turnstile），管理员可置顶/删除 |
| 管理面板 | 隐藏唤起（连点头像 5 次或 `Ctrl + Shift + L`）、账号密码登录、文章新建/编辑/删除/置顶/隐藏/草稿、封面上传、编辑器内 `.md` 一键解析、综集增删改、留言置顶/删除、曲库管理、UV 仪表盘、修改密码。**全部走 REST API 落库** |
| 音乐播放器 | 内置 3 段 Web Audio 合成曲；博主可添加曲目——本地音频（上传到后端 `data/uploads`）或外链；全局曲库弹窗（Teleport）支持切歌、二次确认删除、超长列表内部滚动与当前曲目高亮 |
| 签到 | 累计与连续天数、四枚徽章，仅博主可打卡；数据存 MySQL，按 Asia/Shanghai 时区计算 |
| 统计 | PV/UV 存 Redis（保留 120 天），后台 14 天趋势仪表；文章浏览量累加 |
| 404 | 跳过三栏骨架的全宽沉浸页：镂空 404 插画在视口内居中，插画下方为「返回首页 / 翻翻手记」 |

### 角色权限

- **访客**：浏览公开内容、留言墙发表（受限流与人机校验约束）、点赞、查看日历/倒计时/签到成就、听音乐；看不到任何管理入口。
- **博主**：账号密码登录后解锁后台；能编辑/发布文章与综集、管理留言墙、上传封面与音频、签到、查看 UV、修改密码。

---

## 管理入口与鉴权

页面不常驻登录按钮。唤起方式：

1. 连续点击左侧头像 **5 次**；
2. 或按 `Ctrl + Shift + L`。

登录流程：账号密码 → `POST /api/auth/login` → 后端 BCrypt 校验 → 签发 JWT（7 天）并写入 Redis 白名单 → 前端存 `localStorage`（`mgm:api-token`），每次请求自动带 `Authorization: Bearer <token>`。启动时调 `/api/auth/me` 校验会话有效性。

- 退出登录：`POST /api/auth/logout` 删除 Redis 会话，token 立即失效。
- 修改密码：后台「修改密码」或 `POST /api/auth/password`（旧密码 + 新密码），修改后需重新登录。
- 密码以 BCrypt 哈希存储在 `sys_user` 表，数据库泄露也不暴露明文。

---

## 数据与持久化

| 数据 | 存放位置 | 说明 |
| --- | --- | --- |
| 文章 / 综集 / 分类 | MySQL `blog_post` 等表 | 后台发布落库，公开接口实时返回 |
| 留言墙 | MySQL `blog_message_board` | 限流 + Turnstile + Jsoup 净化后入库 |
| 音乐曲库 | MySQL `blog_music` | 本地音频文件在 `data/uploads` |
| 签到记录 | MySQL `blog_checkin` | 连续天数按 Asia/Shanghai 计算 |
| PV / UV / 限流 / JWT 会话 | Redis | UV 按天 Set 去重，保留 120 天 |
| 博主登录态 | `localStorage`（`mgm:api-token`）+ Redis 白名单 | 双向可吊销 |
| 构建期 Markdown 降级内容 | `content/posts/`（打进前端包） | 后端不可用时的只读兜底 |

- 前端在 API 不可用时自动降级为只读模式（`apiReady` 判断），留言/签到/后台给出「无法连接后端」提示；本地失败的操作降级写 localStorage 以便恢复后同步。
- 数据库 9 张表 DDL 在 `backend/src/main/resources/schema.sql`，种子文章由 `node scripts/gen-seed.mjs` 从 `content/posts/*.md` 生成（`INSERT IGNORE`，不覆盖已有数据）。

---

## 目录结构

```
backend/                   # Spring Boot 工程（xyz.cy666.blog）
  src/main/java/.../       # controller / service / security / mapper / entity / dto
  src/main/resources/      # application*.yml、schema.sql、seed.sql
  Dockerfile               # 多阶段构建（maven → temurin 17-jre）
content/                   # Markdown 文章与综集定义（构建期降级内容源）
deploy/
  mysql/init/              # 容器首次启动执行的建表 + 种子 SQL
  nginx/default.conf       # SPA + /api + /uploads 反代
  nginx/ssl/               # 证书目录（不进仓库）
docker-compose.yml         # mysql / redis / backend / frontend 四服务
public/assets/megumin/    # 主题素材（WebP 压缩后）
public/assets/textures/   # 羊皮纸 / 方格纸 / 星屑纹理与粒子贴图
scripts/gen-seed.mjs      # Markdown → seed.sql
src/
  api/                     # REST API 客户端（publicApi / adminApi）
  components/
    admin/                # 登录弹窗、管理面板
    common/               # 图标、打字机、星火
    layout/               # Header / Footer / 侧栏 / 背景
    post/                 # 文章卡片、Turnstile 组件
    widgets/              # 博主卡、音乐播放器、日历、倒计时、目录
  data/                   # 站点配置、构建期内容（virtual:content）
  lib/                    # http（axios）、Frontmatter、Markdown、导出、工具
  router/  stores/  styles/  views/
docs/                     # 服务端部署指南、博主身份绑定指南（旧版参考）
meguminUI/                # 原始素材（不参与构建）
```

---

## 架构变更（第五版：前后端分离）

这一版把数据层从前端/仓库整体迁移到服务端：

- **后端**：Spring Boot 3.3 + MyBatis-Plus + MySQL 8 + Redis 7。公开接口（文章/综集/留言/签到/统计）与管理接口（`/api/admin/**`，JWT 拦截器保护）分离，统一 `ApiResponse{code,message,data}` 响应。
- **鉴权升级**：GitHub PAT 模式改为账号密码 + JWT + Redis 会话白名单，支持即时吊销。
- **留言墙公网化**：原本只是本机 localStorage 便签，现在正式入库，全站可见；限流与 Turnstile 防刷。
- **上传服务化**：封面/音频上传到服务器 `data/uploads`，Nginx 直接分发，不再走 IndexedDB / base64。
- **只读降级**：后端不可用时前台用构建期 Markdown（`content/posts/`，构建时同样物理剔除草稿）展示内容，写操作全部禁用并提示。
- **部署**：Docker Compose 一键拉起 mysql / redis / backend / frontend(nginx)，`/actuator/health` 健康检查。

完整的环境变量、证书申请、备份恢复、排错与安全清单：[**docs/服务端部署指南.md**](docs/服务端部署指南.md)。

---

## 视觉与动效

主题保持「暗黑暗红复古魔幻」，历经四轮文档驱动优化：

- **全局**：无魔法阵，火雨粒子（Canvas，右上→左下 225°，`prefers-reduced-motion` 自动关闭）；页头页脚用压缩后的 `logo.png`；调色板：爆裂红 `#A52A36`、深红暗影 `#641C2B`、深渊暗黑 `#17151C`、魔法阵金 `#D9AC58`、卷轴米白 `#F4EBDD`。
- **纹理**：`public/assets/textures/`（羊皮纸 / 方格纸 / 星屑，由素材包裁切压缩）用于关于页摘句、便签纸纹、软木板与粒子贴图。
- **英雄区**：`object-fit: cover` 铺满，`blur(0.5px) brightness(1.12)`，方向性渐变遮罩。
- **手记卡片**：封面 `object-fit: contain` 完整展示 + 同图模糊底衬。
- **留言墙**：FLIP 抽取式放大动效（`getBoundingClientRect` → `translate3d + rotate + scale` 补间，原位幽灵占位，`transitionend` 销毁）。
- **空状态**：镂空插画 + 提示双栏，内容区居中。
- **404**：路由 `meta.bare` 隐藏侧栏的全宽沉浸页。
- **滚动条**：全局 thin + 主题色滑块。
- **音乐**：内置曲用 Web Audio 实时合成（`src/lib/chime.ts`），首屏零音频加载；图标为内联 SVG `MagicIcon`，无图标库依赖。

## 素材

视觉素材来自 `meguminUI/slices/`（惠惠主题 UI 素材包），仅用于本项目主题演示；角色与作品版权归原作者及版权方所有。
