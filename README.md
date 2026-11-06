# Megumin Blog · 爆裂魔法使的手记

> 一个开箱即用的前后端分离个人博客系统。暗黑复古魔幻风 UI，文章 / 综集 / 留言墙 / 音乐播放器 / 签到 / 统计全套功能，自带管理后台，一条 `docker compose up` 即可上线。

**Vue 3 + TypeScript + Vite + Pinia** 前端 · **Spring Boot 3 + MyBatis-Plus + MySQL 8 + Redis 7** 后端 · **Docker Compose + Nginx** 部署

---

## 目录

- [这个项目是什么](#这个项目是什么)
- [功能特性](#功能特性)
- [技术组成](#技术组成)
- [系统架构](#系统架构)
- [目录结构](#目录结构)
- [数据库结构](#数据库结构)
- [快速开始](#快速开始)
- [创建博主账号](#创建博主账号)
- [导入示例数据](#导入示例数据)
- [Docker Compose 部署](#docker-compose-部署)
- [个性化配置](#个性化配置)
- [管理后台](#管理后台)
- [API 一览](#api-一览)
- [开源协议](#开源协议)

---

## 这个项目是什么

一个完整的个人博客系统。

- **内容全部存数据库**：文章、综集、留言、评论、曲库、签到、纪念日都由 REST API 实时提供，改一处即全站生效，无需重新构建。
- **自带管理后台**：登录后可写文章（Markdown 编辑器 + 实时预览）、传封面、管理留言与评论、维护曲库、看 PV/UV 趋势，全程无需碰代码。
- **一套代码可复刻**：前端零静态内容兜底，站点标题、博主资料、配色、纪念日都在少数几个位置，换掉就是你的博客。
- **默认安全**：不内置任何账号密码，JWT + Redis 会话白名单、接口限流、XSS 净化、人机校验开箱可用。

适合：想拥有一个独立博客、又不想依赖第三方平台托管内容与评论的人。

---

## 功能特性

| 模块 | 说明 |
| --- | --- |
| **首页** | 打字机欢迎语、火雨与星屑粒子背景、近期精选、置顶留言、签到成就、综集速览 |
| **日常流** | 分类筛选、全文搜索、最新/最早/最热排序、分页；筛选状态同步 URL，返回时保留滚动位置 |
| **文章详情** | Markdown 渲染 + 代码高亮、目录滚动高亮、阅读进度、点赞、复制链接、上下篇、本站评论区 |
| **综集** | 把系列文章归入同一综集，横向轮播 + 封面模糊底衬 |
| **留言墙** | 三面软木板，钉满自动封存开新批次，可回看历史；自定义底色/字色/纸纹；点击 FLIP 抽取放大 |
| **音乐播放器** | 全局播放器 + 曲库弹窗；支持上传音频或外链，内置 3 首 Web Audio 实时合成曲（零音频资源） |
| **签到 / 统计** | 博主打卡与徽章、连续天数；PV/UV 存 Redis，后台 14 天趋势图与热门页面 Top5 |
| **管理后台** | 文章、综集、评论、留言、曲库、站点设置（开站日期 + 纪念日）、UV 仪表盘、改密码 |
| **请求进度条** | 顶部 10px 主题色进度条响应所有 API 请求，上传显示真实进度，失败变警示红 |

**角色权限**：访客可浏览、评论、留言、点赞、听歌；博主登录后解锁后台全部权限。管理入口不常驻页面——**连点左侧头像 5 次**或按 `Ctrl + Shift + L` 唤起。

---

## 技术组成

### 前端

| 项 | 选型 |
| --- | --- |
| 框架 | Vue 3（`<script setup>` + TypeScript） |
| 构建 | Vite 6 |
| 状态 | Pinia |
| 路由 | Vue Router（Hash 模式） |
| UI 组件 | Naive UI（按需引入） |
| 请求 | axios（统一拦截器：注入 token、全局进度条） |
| 内容渲染 | markdown-it + highlight.js |
| 样式 | 原生 CSS 变量主题（`src/styles/tokens.css`） |

### 后端

| 项 | 选型 |
| --- | --- |
| 框架 | Spring Boot 3.3（Java 17） |
| ORM | MyBatis-Plus |
| 数据库 | MySQL 8（utf8mb4） |
| 缓存 | Redis 7（会话白名单、限流、PV/UV） |
| 鉴权 | JWT（HS256，7 天）+ BCrypt 密码哈希 |
| 安全 | Jsoup 文本净化、接口限流、Cloudflare Turnstile（可选） |
| 上传 | 图片 8MB / 音频 30MB，UUID 命名落盘 |

### 部署

- **开发**：Vite dev server `:5173` + Spring Boot `:8080`
- **生产（推荐）**：Docker Compose 四服务（mysql / redis / backend / nginx），Nginx 同时托管 SPA、反代 API、分发上传文件
- **单机小内存（≤2G）**：宿主机 nginx + 三容器（见 [部署指南第 11 章](docs/服务端部署指南.md)）

---

## 系统架构

```
                        ┌─────────────────────────────┐
   Browser  ──HTTPS──▶  │  Nginx (frontend 容器)       │
                        │  ├─ /          Vue 3 SPA     │
                        │  ├─ /assets/   长缓存静态资源  │
                        │  ├─ /uploads/  封面与音频      │
                        │  └─ /api/  ──▶ Spring Boot   │
                        └─────────────────────────────┘
                                        │
                          ┌─────────────┴─────────────┐
                          ▼                           ▼
                    MySQL 8                     Redis 7
              内容、评论、留言、曲库        会话、限流、PV/UV
```

- **鉴权链路**：登录 → BCrypt 校验 → 签发 JWT → 写入 Redis 白名单。退出登录即删除会话，旧 token 立刻失效。
- **接口分层**：`/api/**` 公开只读 + 访客写入；`/api/admin/**` 由拦截器强制校验 JWT。
- **统一响应**：`{ code, message, data }`，`code = 0` 表示成功。

---

## 目录结构

```
├── src/                        # 前端
│   ├── api/                    # REST 客户端（publicApi / adminApi）
│   ├── components/
│   │   ├── admin/              # 管理面板、登录弹窗、上传器
│   │   ├── layout/             # Header / Footer / 侧栏 / 背景粒子
│   │   ├── post/               # 文章卡片、评论区、目录
│   │   └── widgets/            # 博主卡、播放器、日历、倒计时
│   ├── data/site.ts            # ★ 站点标题与博主资料（改成你的）
│   ├── lib/                    # http、Markdown、图片压缩、进度条
│   ├── router/ stores/ styles/ views/
│   └── main.ts
├── backend/                    # 后端（包 xyz.cy666.blog）
│   ├── src/main/java/.../      # controller / service / mapper / entity / dto / security
│   └── src/main/resources/
│       ├── application*.yml    # dev / prod 配置
│       ├── schema.sql          # ★ 12 张表 DDL（启动自动建表）
│       └── seed.sql            # 示例种子数据（手工导入）
├── content/                    # 种子内容来源
│   ├── posts/*.md              # 示例文章（带 frontmatter）
│   └── collections.json        # 综集与开站日期
├── deploy/
│   ├── mysql/init/01-schema.sql
│   ├── nginx/default.conf      # 容器内 nginx
│   ├── nginx/blog.server.conf  # 宿主机 nginx 生产参考
│   └── docker-compose.server.yml
├── docs/服务端部署指南.md        # 完整部署、证书、备份、排错
├── scripts/gen-seed.mjs        # Markdown → seed.sql 生成器
├── scripts/hash-password.mjs   # 生成 BCrypt 密码哈希
└── docker-compose.yml          # 四服务一键启动
```

---

## 数据库结构

12 张表，全部 `InnoDB` / `utf8mb4_unicode_ci`，DDL 见 [`backend/src/main/resources/schema.sql`](backend/src/main/resources/schema.sql)。后端启动时以 `CREATE TABLE IF NOT EXISTS` 自动建表（幂等），**不会插入任何数据**。

### 表一览

| 表名 | 用途 | 关键字段 | 索引 / 约束 |
| --- | --- | --- | --- |
| `sys_user` | 博主账号 | `username`、`password`(BCrypt)、`nickname`、`avatar`、`status` | `uk_sys_user_username` |
| `blog_post` | 文章 | `slug`、`title`、`subtitle`、`excerpt`、`tags`、`content`(LONGTEXT)、`cover`、`status`、`pinned`、`views`、`published_at` | `uk_blog_post_slug`、`idx(status, published_at)` |
| `blog_category` | 分类 | `name`、`slug`、`sort` | `uk_blog_category_name` |
| `blog_post_category` | 文章↔分类 | `post_id`、`category_id` | 联合主键、`idx_pc_category` |
| `blog_collection` | 综集（系列） | `slug`、`title`、`subtitle`、`description`、`cover`、`runes`、`sort` | `uk_blog_collection_slug` |
| `blog_post_collection` | 文章↔综集 | `post_id`、`collection_id` | 联合主键、`idx_pcol_collection` |
| `blog_message_board` | 留言墙 | `author`、`content`、`wall`(top/left/right)、`bg_color`、`font_color`、`texture`、`rotation`、`pinned`、`ip`、`status` | `idx(status, created_at)`、`idx_msg_ip` |
| `blog_comment` | 文章评论 | `post_id`、`author`、`content`、`ip`、`status`、`created_at` | `idx_comment_post(post_id, status, created_at)` |
| `blog_music` | 曲库 | `title`、`artist`、`cover`、`url`、`kind`(synth/url/upload)、`size`、`sort` | `idx_music_sort` |
| `blog_checkin` | 博主签到 | `checkin_date` | `uk_checkin_date`（一天一条） |
| `blog_anniversary` | 纪念日倒计时 | `label`、`memorial_date`(MM-DD)、`note`、`sort` | `idx_anniversary_sort` |
| `blog_config` | 站点键值配置 | `config_key`、`config_value`（如 `site.start-date`） | 主键 `config_key` |

### 关系

```
blog_post ──< blog_post_category >── blog_category
     │
     ├──< blog_post_collection >── blog_collection
     └──< blog_comment
sys_user        博主单账号，与内容无外键（作者即博主）
blog_message_board / blog_music / blog_checkin / blog_anniversary / blog_config  独立表
```

- `status` 约定：`published` / `draft` / `hidden`（文章）、`approved` / `pending`（留言与评论）。
- `blog_anniversary.memorial_date` 只存 `MM-DD`，每年循环；开站日期存 `blog_config` 的 `site.start-date`。
- 表间不建物理外键，由业务层维护一致性（便于分库与清理）。

### Redis 键

| 键 | 用途 |
| --- | --- |
| `auth:token:<jti>` | JWT 白名单（7 天 TTL） |
| `rl:*` | 接口限流（留言每分钟 1 / 每小时 5，评论每分钟 1 / 每小时 10） |
| `blog:uv:<date>` | 当日 UV Set（去重，保留 120 天） |
| `blog:pages` | 热门页面计数 Hash（Top5） |

---

## 快速开始

### 前置要求

| 依赖 | 版本 |
| --- | --- |
| Node.js | 20+ |
| JDK | 17+ |
| Maven | 3.8+ |
| MySQL | 8.0+ |
| Redis | 7.x |

### 1. 安装前端依赖

```bash
npm install
```

### 2. 准备数据库与缓存

```sql
CREATE DATABASE blog_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

启动本机 Redis（默认 `localhost:6379`，无密码）。若你的 MySQL 账号密码不是 `root / 123456`，用环境变量覆盖，例如：

```bash
export MYSQL_USER=blog
export MYSQL_PASSWORD=your-password
```

### 3. 启动后端

```bash
cd backend
mvn -DskipTests package
java -jar target/app.jar
# 或开发模式：mvn spring-boot:run
```

启动后 `http://localhost:8080/actuator/health` 返回 `UP`，首次启动会自动建好 12 张表（不插数据）。默认 dev 配置的数据库连接：`localhost:3306/blog_db`，账号 `root/123456`，可用 `MYSQL_*` / `REDIS_*` 环境变量覆盖。

### 4. 启动前端

```bash
npm run dev     # http://localhost:5173
```

`.env.development` 默认 `VITE_API_BASE_URL=http://localhost:8080/api`，无需修改。

其他脚本：

```bash
npm run build      # 生产构建 → dist/
npm run preview    # 预览构建产物
npm run typecheck  # vue-tsc 类型检查
```

### 5. 登录后台

1. 打开 `http://localhost:5173`
2. 连点左侧头像 **5 次**，或按 `Ctrl + Shift + L`
3. 用[下面创建的账号](#创建博主账号)登录

---

## 创建博主账号

出于安全考虑，**项目不内置任何默认账号，启动也不会自动创建用户**。请自行生成 BCrypt 哈希后插入：

```bash
cd scripts
npm install
node hash-password.mjs 'your-password'
# 输出：$2a$10$....（复制这一整串）
```

```sql
INSERT INTO sys_user (username, password, nickname, status)
VALUES ('admin', '<粘贴上一步的哈希>', '博主', 1);
```

数据库只保存哈希，不看得到明文。之后可在后台「修改密码」或调 `POST /api/auth/password` 更换。

---

## 导入示例数据

仓库自带 2 篇示例文章和一个示例综集，可选导入（不导也能用，直接后台发文）：

```bash
mysql -uroot -p blog_db < backend/src/main/resources/seed.sql
```

种子由 `scripts/gen-seed.mjs` 从 `content/` 生成，格式说明：

- `content/posts/*.md`：文章，frontmatter 支持 `title` / `subtitle` / `date` / `tags` / `categories` / `collections` / `cover` / `excerpt` / `pinned` / `draft`
- `content/collections.json`：综集定义与 `siteStartDate`（开站日期）

改完 Markdown 后重新生成：

```bash
node scripts/gen-seed.mjs   # 重写 backend/src/main/resources/seed.sql
```

种子用 `INSERT IGNORE` + 显式主键，可重复执行不覆盖已有数据。

> 日常发文不需要这套流程：直接用后台编辑器发布，内容实时入库。

---

## Docker Compose 部署

```bash
cp .env.example .env       # 填写 MYSQL_ROOT_PASSWORD / REDIS_PASSWORD / JWT_SECRET（32 位以上随机串）
npm ci && npm run build    # 生成 dist/
docker compose up -d --build
```

四个服务：`mysql`、`redis`、`backend`、`frontend`（nginx）。容器首次启动只执行建表，不灌数据；账号与示例数据仍按上面两步手工导入。

部署到公网服务器（HTTPS、证书、域名、备份、排错、性能调优）请看 **[docs/服务端部署指南.md](docs/服务端部署指南.md)**，配置里的 `your-domain.com` 换成你的域名即可。

---

## 个性化配置

| 想改什么 | 改哪里 |
| --- | --- |
| 博客标题、副标题 | `src/data/site.ts` 的 `title` / `subtitle`（同步改 `index.html` 的 `<title>`） |
| 博主名字、简介、头像、社交链接 | `src/data/site.ts` 的 `author` |
| 开站日期、纪念日 | 登录后台 →「站点设置」 tab（存数据库，无需改代码） |
| 主题配色 | `src/styles/tokens.css` 的 CSS 变量（爆裂红 / 魔法阵金 / 深渊黑等） |
| 首页文案、关于页 | `src/views/HomeView.vue`、`src/views/AboutView.vue` |
| 导航菜单 | `src/components/layout/AppHeader.vue` |
| 封面与纹理素材 | `public/assets/megumin/`、`public/assets/textures/` |
| 示例文章 | `content/posts/*.md` → 重新生成 seed，或直接在后台删改 |
| 登录入口触发方式 | `src/components/widgets/ProfileCard.vue`（连点头像 5 次）、`src/App.vue`（`Ctrl + Shift + L`） |
| 接口地址（前端） | `.env.development` / `.env.production` 的 `VITE_API_BASE_URL` |
| 人机校验 | `VITE_TURNSTILE_SITE_KEY`（前端）+ `TURNSTILE_SECRET`（后端）；留空则跳过校验 |

---

## 管理后台

| 能力 | 说明 |
| --- | --- |
| 文章 | 新建 / 编辑 / 删除 / 置顶 / 隐藏 / 草稿；Markdown 编辑 + 预览；上传 `.md` 一键解析 |
| 封面 | 选图后浏览器端压成 WebP 再上传，落盘 `data/uploads/` |
| 综集 | 增删改，设置封面、符文、排序 |
| 评论 / 留言 | 列表查看、置顶、删除 |
| 曲库 | 上传音频或填外链，调整排序 |
| 站点设置 | 开站日期 + 纪念日 CRUD |
| 统计 | 14 天 PV/UV 趋势、热门页面 Top5 |
| 账号 | 修改密码（改后需重新登录） |

**接口安全**：`/api/admin/**` 全部经 JWT 拦截器校验；登录失败与写接口有 Redis 限流；留言与评论内容经 Jsoup 净化后入库。

---

## API 一览

统一前缀 `/api`，响应 `{ code, message, data }`（`code=0` 成功）。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/auth/login` | 登录，返回 JWT |
| GET | `/auth/me` | 校验当前会话 |
| POST | `/auth/logout` | 退出（删除 Redis 会话） |
| POST | `/auth/password` | 修改密码 |
| GET | `/site` | 站点信息（开站日期 + 纪念日） |
| GET | `/posts` | 文章列表（分页、分类、搜索、排序） |
| GET | `/posts/{slug}` | 文章详情 |
| GET/POST | `/posts/{slug}/comments` | 文章评论列表 / 发表 |
| GET | `/collections` | 综集列表与详情 |
| GET/POST | `/messages` | 留言墙列表 / 发表 |
| GET | `/music` | 曲库 |
| GET/POST | `/checkin` | 签到状态 / 打卡 |
| POST | `/track` | PV/UV 上报 |
| — | `/admin/**` | 后台管理接口（需 Bearer token） |

---

## 开源协议

代码以 [MIT License](LICENSE) 开源，可自由使用、修改、分发、商用。

**素材声明**：`public/assets/megumin/` 中的角色立绘与主题素材取自第三方《为美好的世界献上祝福！》主题 UI 素材包，**版权归原作者及版权方所有**，仅限本项目演示与个人学习使用，不可商用。若你要用于正式站点，请替换为自己的图片素材（路径可在 `src/data/site.ts` 与 `public/assets/` 中调整）。

**第三方依赖** 各自遵循其原许可（Vue、Naive UI、Spring Boot、MySQL 等）。

---

## 致谢

- UI 主题：惠惠（《为美好的世界献上祝福！》）同人素材
- 灵感与排版参考：各类优秀个人博客

> 如果这个项目对你有帮助，欢迎点个 Star ⭐
