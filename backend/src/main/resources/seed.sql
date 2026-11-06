-- 由 scripts/gen-seed.mjs 自动生成，请勿手改。
-- 内容来源：content/posts/*.md + content/collections.json + 生成器内置的站点种子
SET NAMES utf8mb4;

-- 综集
INSERT IGNORE INTO blog_collection (slug, title, subtitle, description, cover, runes, sort) VALUES ('getting-started', '开始使用', 'Getting Started', '从这里开始：认识这个博客的结构，然后写下你自己的第一篇。', 'assets/megumin/megumin-chibi.webp', 'START', 1);

-- 分类
INSERT IGNORE INTO blog_category (name, slug, sort) VALUES ('手记', 'cat-815813', 0);
INSERT IGNORE INTO blog_category (name, slug, sort) VALUES ('随笔', 'cat-1226341', 1);

-- 文章
INSERT IGNORE INTO blog_post (slug, title, subtitle, excerpt, tags, content, cover, status, pinned, views, published_at) VALUES ('get-started', '快速上手指南', '从建库到发出第一篇文章', '本地跑起来、创建博主账号、发第一篇文章——五分钟走完全流程。', '指南', '## 1. 启动服务

前端 `npm run dev`，后端建好 MySQL 与 Redis 后 `mvn package` 并运行 jar，详细步骤见项目 README。

## 2. 创建博主账号

项目**不内置任何默认账号**。用脚本生成密码哈希：

```bash
cd scripts && npm install
node hash-password.mjs ''你的密码''
```

把输出的 BCrypt 哈希手工插入 `sys_user` 表（SQL 见 README「创建博主账号」一节）。

## 3. 登录后台

页面不常驻登录入口：**连点左侧头像 5 次**，或按 `Ctrl + Shift + L` 唤起登录框。

## 4. 发文章

后台「文章」tab 新建文章：支持 Markdown 编辑、`.md` 文件一键解析、封面上传（自动压缩为 WebP）。发布后前台立即可见。

## 5. 个性化

- 博主资料（名字、简介、社交链接）：改 `src/data/site.ts`
- 站点标题、开站日期、纪念日：登录后台「站点设置」tab
- 主题配色：`src/styles/tokens.css`

更多细节见 README 与 `docs/服务端部署指南.md`。', NULL, 'published', 0, 0, '2026-01-02');
INSERT IGNORE INTO blog_post (slug, title, subtitle, excerpt, tags, content, cover, status, pinned, views, published_at) VALUES ('hello-world', '你好，世界', '第一篇示例文章', '这是博客的第一篇文章。删掉它，或者直接在后台写你自己的。', '示例,Markdown', '## 欢迎来到你的博客

这一篇演示文章展示了正文的全部排版能力，你可以随时在后台删除它，或者参考它写自己的第一篇文章。

### 常用 Markdown 语法

**加粗**、*斜体*、`行内代码`、[链接](#/posts) 都可以正常渲染。

代码块会自动高亮：

```js
// 一个小小的欢迎
export function hello() {
  return ''Explosion!''
}
```

> 引用块：每一天都要过得轰轰烈烈。

### 列表与表格

- 无序列表项
- 另一项

1. 有序列表
2. 第二项

| 功能 | 状态 |
| --- | --- |
| Markdown 渲染 | ✅ |
| 代码高亮 | ✅ |
| 文章评论 | ✅ |

### Frontmatter 字段说明

本文件头部的 `---` 区块是文章元信息：

- `title` / `subtitle`：标题与副标题
- `date`：发布日期（`YYYY-MM-DD`）
- `tags` / `categories`：标签与分类（列表）
- `collections`：所属综集（对应 `content/collections.json` 里的 `id`）
- `cover`：封面图路径（可留空，详情页会回退为主题色）
- `excerpt`：摘要（留空则自动截取正文前 90 字）
- `pinned`：是否置顶
- `draft: true` 或 `public: false`：草稿 / 隐藏

写好 Markdown 后运行 `node scripts/gen-seed.mjs` 重新生成 `backend/src/main/resources/seed.sql`，再手工导入数据库（仅种子流程需要；日常发文直接用后台编辑器即可）。', 'assets/megumin/megumin-cast.webp', 'published', 1, 0, '2026-01-01');

-- 文章 ↔ 分类
INSERT IGNORE INTO blog_post_category (post_id, category_id) SELECT p.id, c.id FROM blog_post p, blog_category c WHERE p.slug = 'get-started' AND c.name = '随笔';
INSERT IGNORE INTO blog_post_category (post_id, category_id) SELECT p.id, c.id FROM blog_post p, blog_category c WHERE p.slug = 'hello-world' AND c.name = '手记';
INSERT IGNORE INTO blog_post_category (post_id, category_id) SELECT p.id, c.id FROM blog_post p, blog_category c WHERE p.slug = 'hello-world' AND c.name = '随笔';

-- 文章 ↔ 综集
INSERT IGNORE INTO blog_post_collection (post_id, collection_id) SELECT p.id, c.id FROM blog_post p, blog_collection c WHERE p.slug = 'get-started' AND c.slug = 'getting-started';
INSERT IGNORE INTO blog_post_collection (post_id, collection_id) SELECT p.id, c.id FROM blog_post p, blog_collection c WHERE p.slug = 'hello-world' AND c.slug = 'getting-started';

-- 站点配置与纪念日倒计时
INSERT IGNORE INTO blog_config (config_key, config_value) VALUES ('site.start-date', '2026-01-01');
INSERT IGNORE INTO blog_anniversary (id, label, memorial_date, note, sort) VALUES (1, '示例纪念日', '01-01', '在后台「站点设置」里改成你自己的纪念日', 0);
INSERT IGNORE INTO blog_anniversary (id, label, memorial_date, note, sort) VALUES (2, '博客开站周年', '01-01', '与站点设置中的开站日期一致即可', 1);

-- 内置合成曲（kind=synth，url 对应前端 Web Audio 引擎的曲谱 id）
INSERT IGNORE INTO blog_music (id, title, artist, cover, url, kind, size, sort) VALUES (1, '爆裂魔法のテーマ', '惠惠的留声机', '', 'explosion-theme', 'synth', 0, 1);
INSERT IGNORE INTO blog_music (id, title, artist, cover, url, kind, size, sort) VALUES (2, '紅魔族の朝', '惠惠的留声机', '', 'red-demon-morning', 'synth', 0, 2);
INSERT IGNORE INTO blog_music (id, title, artist, cover, url, kind, size, sort) VALUES (3, '荒野の夜', '惠惠的留声机', '', 'night-wilderness', 'synth', 0, 3);
