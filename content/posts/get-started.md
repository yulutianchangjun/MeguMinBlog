---
title: 快速上手指南
subtitle: 从建库到发出第一篇文章
date: 2026-01-02
tags:
  - 指南
categories:
  - 随笔
collections:
  - getting-started
excerpt: 本地跑起来、创建博主账号、发第一篇文章——五分钟走完全流程。
---

## 1. 启动服务

前端 `npm run dev`，后端建好 MySQL 与 Redis 后 `mvn package` 并运行 jar，详细步骤见项目 README。

## 2. 创建博主账号

项目**不内置任何默认账号**。用脚本生成密码哈希：

```bash
cd scripts && npm install
node hash-password.mjs '你的密码'
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

更多细节见 README 与 `docs/服务端部署指南.md`。
