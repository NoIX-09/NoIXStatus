# NoIX Status

基于 [Astro 7](https://astro.build) 的服务器状态站，支持国际化、暗色模式与 Canvas 粒子特效。通过独立的 Node API 采集系统指标、Docker 容器与外部服务可达性，并以 60 秒缓存对外提供 `/api/status`。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Astro v7 (SSG) |
| 语言 | TypeScript |
| 字体 | LXGW WenKai / LXGW WenKai Mono（霞鹜文楷） |
| 图标 | Phosphor Icons |
| 后端 | Node (status-api) |
| 部署 | Docker + Nginx |

## 功能

- **系统指标**：CPU、内存、磁盘、负载、运行时间、网络流量
- **Docker 容器**：列出容器运行状态与运行时长
- **HTTP 服务检测**：检测外部服务可达性与延迟（可选，`CHECK_URLS`）
- **国际化**：简体中文 / 繁体中文 / English / 日本語
- **暗色模式**：浅色 / 暗色主题切换，偏好持久化到 localStorage
- **粒子特效**：雨滴 / 萤火虫 / 樱花（Canvas 实现，隐藏时零 GPU 占用）
- **响应式设计**：桌面 / 平板 / 手机三端适配

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 配置

复制 `.env.example` 为 `.env`，按需修改：

```ini
# 站点信息
SITE_NAME=站点名称
SITE_DOMAIN=域名
SITE_URL=站点完整网址（如 https://status.example.com）
SITE_EMAIL=联系邮箱
SITE_COPYRIGHT=页脚版权信息

# 可选：外部服务可达性检测（逗号分隔 URL 列表）
CHECK_URLS=https://service1.example.com,https://service2.example.com
```

## Docker 部署

```bash
# 1. 准备环境变量
cp .env.example .env
vim .env

# 2. 构建并启动
docker compose up -d --build
```

服务包含两个容器：

| 容器 | 说明 |
|------|------|
| `noix-status-site` | Nginx 静态站点（端口 80） |
| `noix-status-api`  | 状态监控 API（端口 3001） |

状态接口经 nginx 反向代理至 `noix-status-api:3001`，对外路径为 `/api/status`。

## 目录结构

```
NoIXStatus/
├── public/                # 静态资源（字体、纹理、service-card.css）
├── server/                # 状态监控 API
│   ├── Dockerfile
│   └── status-api.cjs
├── src/
│   ├── components/        # Navbar、Footer、BackToTop、FX 特效
│   ├── i18n/              # 国际化翻译字典
│   ├── layouts/           # 页面布局
│   ├── pages/
│   │   ├── [locale]/status.astro  # 系统状态页
│   │   ├── 404.astro
│   │   └── index.astro
│   ├── styles/            # 全局样式
│   └── site.config.ts     # 站点配置
├── Dockerfile             # Nginx 静态站点镜像
├── docker-compose.yml
├── nginx.conf
├── astro.config.mjs
└── .env.example
```

## 架构说明

### 状态 API

`server/status-api.cjs` 启动时采集系统指标（`os`、`docker ps`、`df`、`/proc/net/dev`），之后每 60 秒后台刷新一次缓存，所有 `/api/status` 请求直接返回缓存数据，避免并发请求压垮系统。

### 状态页缓存

状态页将最近一次 API 响应缓存到 `localStorage`（有效期 30 分钟），刷新时优先渲染缓存数据再异步拉取新数据，之后每 30 分钟自动刷新。

### FX 特效组件

RainFX、FireflyFX、SakuraFX 三个 Canvas 特效共享同一模式：

- Canvas 初始隐藏（`display: none`），停止时完全不占用 GPU
- `Layout.astro` 内联脚本从 localStorage 读取偏好，设置 `<body>` 对应 class 后派发 `fx-init` 自定义事件
- 组件通过 `MutationObserver` + `fx-init` 事件双重监听，确保无论加载顺序如何都能正确启停

### 样式约定

- 暗色模式覆盖样式分散在各组件 `<style>` 中，通过 `body.dark` 选择器生效，`global.css` 提供兜底
- 服务卡片相关 class（`st-card`、`st-dot`、`st-name`、`st-sub` 等）定义在 `global.css` 中，不加 scoped，确保 JS 动态注入的 HTML 也能正确匹配

## License

MIT
