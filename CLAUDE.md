# CLAUDE.md

NoIX Status — 基于 Astro 7 的服务器状态站，支持多语言（`zh-CN` / `zh-TW` / `en` / `ja`），Docker 部署。

## 开发命令

```bash
# 启动开发服务器（后台运行）
astro dev --background

# 管理后台服务器
astro dev stop      # 停止
astro dev status    # 查看状态
astro dev logs      # 查看日志
```

## 项目结构

```
NoIXStatus/
├── src/
│   ├── pages/[locale]/status.astro  # 唯一页面：系统状态
│   ├── components/
│   │   ├── Navbar.astro     # 顶栏：品牌标识（siteName）+ 语言/主题/特效切换
│   │   ├── Footer.astro     # 页脚
│   │   ├── BackToTop.astro  # 回到顶部按钮
│   │   ├── RainFX.astro     # Canvas 雨滴特效（fx-rain）
│   │   ├── FireflyFX.astro  # Canvas 萤火虫特效（fx-firefly）
│   │   └── SakuraFX.astro   # Canvas 樱花特效（fx-sakura）
│   ├── layouts/Layout.astro
│   ├── styles/global.css    # 字体、pencil-line、服务卡片（st-*）
│   └── site.config.ts       # 站点配置（仅 site）
├── server/
│   ├── status-api.cjs       # 独立 Node 服务：系统指标 + docker ps + 外部服务检测，60s 缓存
│   └── Dockerfile
├── public/service-card.css  # 状态页样式（status.astro 引入）
├── nginx.conf               # 反向代理 /api/ → status-api
└── docker-compose.yml       # site + status-api 两个容器
```

## 架构约定

### FX 特效组件

- 每个 FX 画布默认隐藏（`display:none`）
- `Layout.astro` 内联脚本从 localStorage 读取偏好，给 `<body>` 设置对应 class（如 `fx-sakura`、`fx-firefly`），然后派发 `fx-init` 自定义事件
- FX 组件通过 `MutationObserver`（监听 class 变化）和 `fx-init` 事件（Layout 延迟初始化）双重机制控制启停，由 `running` 标志位防止重复执行

### 状态 API

- `server/status-api.cjs` 启动时采集系统指标，之后每 60 秒后台刷新，请求直接返回缓存
- 前端状态页将最近响应缓存到 localStorage（30 分钟），并每 30 分钟自动刷新

### 样式规范

- **暗色模式**：每个组件的 `<style>` 内定义 `body.dark` 覆盖样式，`global.css` 提供兜底
- **移动端顶栏**：`.navbar` 在手机端加 `align-self: stretch` 铺满整宽（父容器 `.content` 为 `align-items: center`），操作区用 `margin-left: auto` 靠右
- **服务卡片类名**（`st-card`、`st-dot`、`st-name`、`st-sub`、`st-empty`、`st-card-grid`、`st-col2`、`st-up/down/warn/error`）统一定义在 `global.css` 中（非 scoped），确保 JS 动态注入的 HTML 也能匹配

### i18n

- 支持 `zh-CN`、`zh-TW`、`en`、`ja`
- 页面按 `src/pages/[locale]/` 组织

## 外部文档

完整文档：https://docs.astro.build

涉及以下任务时先查阅对应指南：

- [添加页面、动态路由或中间件](https://docs.astro.build/en/guides/routing/)
- [编写 Astro 组件](https://docs.astro.build/en/basics/astro-components/)
- [使用 React/Vue/Svelte 等框架组件](https://docs.astro.build/en/guides/framework-components/)
- [添加或管理内容集合](https://docs.astro.build/en/guides/content-collections/)
- [添加样式或使用 Tailwind](https://docs.astro.build/en/guides/styling/)
- [多语言支持](https://docs.astro.build/en/guides/internationalization/)
