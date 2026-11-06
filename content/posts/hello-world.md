---
title: 你好，世界
subtitle: 第一篇示例文章
date: 2026-01-01
tags:
  - 示例
  - Markdown
categories:
  - 手记
  - 随笔
collections:
  - getting-started
cover: assets/megumin/megumin-cast.webp
excerpt: 这是博客的第一篇文章。删掉它，或者直接在后台写你自己的。
pinned: true
---

## 欢迎来到你的博客

这一篇演示文章展示了正文的全部排版能力，你可以随时在后台删除它，或者参考它写自己的第一篇文章。

### 常用 Markdown 语法

**加粗**、*斜体*、`行内代码`、[链接](#/posts) 都可以正常渲染。

代码块会自动高亮：

```js
// 一个小小的欢迎
export function hello() {
  return 'Explosion!'
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

写好 Markdown 后运行 `node scripts/gen-seed.mjs` 重新生成 `backend/src/main/resources/seed.sql`，再手工导入数据库（仅种子流程需要；日常发文直接用后台编辑器即可）。
