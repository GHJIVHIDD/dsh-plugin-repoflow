# dsh-plugin-repoflow

> Deployment-level Git plugin for [DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness) (DSH) — a **Git** settings section after 通用设置 / 模型 / 插件 / agent 预设, with global GitHub account configuration and visual local repository management.

中文简介：在设置页「模型 / 插件 / agent 预设」之后新增「Git」入口。全局保存 GitHub 账号信息（用户名 / 邮箱 / Token / Host / 默认可见性），并针对本地目录提供仓库可视化：分支、领先/落后、暂存/未暂存/未跟踪/冲突、最近提交、变更文件，以及初始化、创建 GitHub 仓库、提交、推送等常用操作。

---

## ✨ Features / 功能特性

- **设置页入口**：与通用设置 / 模型 / 插件 / agent 预设同一视觉语言，注册在 `settings.section`，顺序在归档之后（`order: 40`）。
- **全局 GitHub 配置**：保存到 `~/.dsh/git/config.json`（权限 `0600`），Token 不会明文回显。
- **连接测试**：通过 GitHub API `/user` 验证 Token 与 Host 是否可用。
- **仓库可视化**：
  - 当前分支、ahead / behind、远程仓库
  - 已暂存 / 未暂存 / 未跟踪 / 冲突统计
  - 最近 12 条提交
  - 变更文件列表（porcelain 状态码）
- **常用操作**：
  - `初始化仓库`：`git init -b main`，并写入全局用户名 / 邮箱
  - `创建 GitHub 仓库并推送`：自动初始化（如需要）→ GitHub API 创建仓库 → 设置干净 remote → 创建初始提交（如需要）→ 推送
  - `提交`：`git add -A && git commit`
  - `推送`：使用保存的 Token 通过 HTTP extraheader 推送，不在 remote URL 中写入 Token
  - `分支管理`：查看本地分支、一键切换分支、创建并切换到新分支
  - `提交分支图`：`git log --graph --oneline --decorate --all` 图形化展示提交历史与分支拓扑
  - `GitHub 仓库列表`：连接后自动展示当前账号已有的远程仓库
- **模型工具（Agent 可用）**：
  - `git_status`：仓库状态 / 分支 / 提交图 / 变更文件
  - `git_repos`：列出 GitHub 账号下已有远程仓库
  - `git_init`：初始化仓库
  - `git_commit`：提交全部更改
  - `git_push`：推送当前分支
  - `git_create_repo`：创建 GitHub 远程仓库并推送
  - `git_branch`：列出本地分支
  - `git_checkout`：切换 / 创建并切换分支
  - `git_log`：查看图形化提交历史

## 🔐 Required Permissions / 权限说明

本插件使用 GitHub Personal Access Token 完成以下操作：

- 测试 GitHub 连接（`GET /user`）
- 列出当前账号已有的远程仓库（`GET /user/repos`）
- 创建 GitHub 仓库（`POST /user/repos`）
- 通过 HTTPS 推送代码到远程仓库

如果你只使用本地 Git 功能（`init` / `commit` / `branch` / `checkout` / `log` / `status`），**不需要 Token**。

### Classic PAT 推荐权限

| 场景 | 所需 Scope |
|---|---|
| 仅操作公开仓库 / 创建公开仓库 | `public_repo` |
| 操作私有仓库 / 创建私有仓库 | `repo` |
| 推荐直接使用 | `repo`（包含公开与私有仓库的完整读写） |

### Fine-grained PAT 推荐权限

| 设置项 | 推荐值 |
|---|---|
| Repository access | All repositories，或至少选择需要操作的仓库 |
| Contents | **Read and write** |
| Administration | **Read and write**（仅当需要通过 API 创建/删除仓库时必需） |
| Metadata | Read（GitHub 自动包含） |

> 如果只用现有仓库进行提交和推送，`Administration` 可以不开；如果需要“创建 GitHub 仓库并推送”，则必须开启 `Administration: Read and write`。

### 安全说明

- Token 仅保存在本机 `~/.dsh/git/config.json`
- 配置文件权限为 `0600`
- Token 不会写入 Git remote URL
- 请勿将 Token 提交到任何公开仓库

## 🚀 Install / 安装

### 方式 A：本地源码 / 手动安装

```sh
# 1. 将插件复制到 profile 的插件目录
cp -R dsh-plugin-repoflow ~/.dsh/profiles/web/node_modules/@dsh-community/

# 2. 在 profile 的用户补丁层注册插件行
cat >> ~/.dsh/profiles/web/cordis.patch.yml << 'EOF'

- insert:
    - id: ui-repoflow
      name: '@dsh-community/dsh-plugin-repoflow'
EOF

# 3. 重启 profile（或等待 HMR 事务性重读用户补丁）
```

### 方式 B：官方 CLI（本地目录 / GitHub 仓库）

```sh
# 本地目录安装（开发调试推荐）
dsh plugin --profile web add /path/to/dsh-plugin-repoflow

# 若发布为 GitHub 仓库
npx -p @deepseek-ai/dsh dsh plugin --profile web add GHJIVHIDD/dsh-plugin-repoflow
```

## 🧩 Architecture / 架构

```
浏览器 (client, lib/client.js)                       Node (host, lib/index.js)
┌──────────────────────────────────────┐   fetch   ┌──────────────────────────────────────┐
│ settings.section "Git"               │ ─────────▶ │ webServer.register({kind:'exact'})     │
│ 账号配置 / 仓库可视化 / 操作按钮        │  /git-api/* │ 配置持久化 + git CLI + GitHub API      │
└──────────────────────────────────────┘ ◀───────── └──────────────────────────────────────┘
```

- 客户端注册 `settings.section`，使用与设置页一致的主题变量。
- Host 半区零外部依赖，仅使用 Node 内置模块与 `git` CLI。
- Token 仅保存在全局配置文件中，不会写入 Git remote URL。

## ✅ Verify / 离线验证

```sh
node scripts/verify.mjs
```

覆盖：双半区语法检查 → host ESM 导出 → mock ctx 下 10 个路由注册 → client bundle 沙箱模拟执行。

## 📦 Package structure / 包结构

```
dsh-plugin-repoflow/
├── package.json          # dsh.bundle + dsh.client 声明、exports["./client"]
├── cordis.patch.yml      # bundle 补丁：插入 ui-repoflow 设置页
├── lib/
│   ├── index.js          # host 半区（webServer /git-api/*）
│   ├── client.js         # client 半区（settings.section Git 页）
│   └── types/index.d.ts  # host 类型声明
├── scripts/verify.mjs    # 离线验证
└── README.md / LICENSE
```

## 📄 License

[MIT](./LICENSE)
