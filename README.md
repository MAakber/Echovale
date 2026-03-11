# 🌾 Echovale (乡村回响) —— 基于 AIGC 的乡村数字记忆构建与传播平台

## 📖 项目简介

**Echovale (乡村回响)** 是一款专为大赛打造的创新现代化 Web 应用。本项目利用 **AIGC (生成式人工智能)** 技术，通过数字化手段保存、构建和传播中国乡村的文化记忆。

系统集成了 **AI 老照片修复**、**AI 故事润色** 和 **交互式时空地图**，将碎片化的乡村记忆转化为可感知、可互动、可流传的数字资产，推动“数字乡村”背景下的文化传承。

---

## 🚀 快速开始 (快速部署)

项目采用前后端分离架构，通过 **Go (Gin)** 驱动后端逻辑，**Next.js 15 (Turbopack)** 驱动前端体验。

### 1. 环境准备

- **Node.js**: v18.18 或更高版本
- **Go**: v1.21 或更高版本
- **Git**: 用于版本控制

### 2. 克隆与进入项目

```bash
git clone <your-repo-url>
cd Echovale
```

### 3. 后端部署 (server 项目)

```bash
cd server
# 可选：按需修改 server/.env 中的 OpenRouter 配置
# 下载依赖 (主要包含 Gin, GORM, UUID 等)
go mod tidy
# 运行后端服务器 (默认在 http://localhost:8080 启动)
go run main.go
```

### 4. 前端部署 (client 项目)

```bash
# 打开新的终端窗口
cd client
# 安装依赖
npm install
# 启动开发服务器 (默认在 http://localhost:3000 启动)
npm run dev
```

### 5. 快捷启动 (Windows)

在根目录下双击 `start.bat`，即可一键同时启动后端和前端服务。

如果你习惯从终端启动，直接在项目根目录执行以下命令即可：

```bat
start.bat
```

该脚本会先自动清理当前项目上一次残留的 Next.js / Go 开发进程，再重新启动，避免 `.next/dev/lock` 冲突。

如果你想手动停止当前项目的开发服务，可以执行：

```bat
stop.bat
```

---

## 🛠️ 技术栈构架

### 前端 (Client)

- **框架**: Next.js 16 (App Router) & React 19 (最新稳定版性能卓越)
- **样式**: Tailwind CSS v4 (支持现代 CSS 特性、OKLCH 色彩与原生暗色模式)
- **动画**: Framer Motion (驱动页面过渡、地图滑块及卡片布局动画)
- **图标**: Lucide React (轻量级矢量图标库)
- **状态管理**: React Hooks (useState/useEffect) + Next.js Server Components

### 后端 (Server)

- **语言**: Go 1.25+ (高性能、并发友好的编译型语言)
- **框架**: Gin Gonic (业内领先的高性能轻量级 Web 引擎)
- **数据库**: SQLite (嵌入式数据库，免环境配置，完美支持项目便携性)
- **ORM**: GORM (支持结构体与数据库的无缝映射)
- **接口规范**: 基于 RESTful 标准的 API 设计

---

## 🌟 核心功能

### 1. 记忆长廊 (Gallery)

- **瀑布流布局**: 展示全国各地的乡村记忆卡片。
- **分类过滤**: 支持按“建筑、非遗、民俗、历史”进行动态实时筛选。

### 2. AI 创作中心 (Creative Studio)

- **老照片修复**: 上传受损或褪色的老照片，AI 自动进行色彩还原与清晰度增强。
- **文字深度润色**: 输入碎片化的记忆描述，后端通过 **OpenRouter** 调用 **DeepSeek 免费模型** 生成优美的散文式叙事。

### 3. 时空地图 (Spatio-temporal Map)

- **年代滑块**: 拖动时间轴，观察乡村记忆在不同年代（1920s - 2024）的分布与演变。
- **地理坐标**: 基于实时数据库坐标系统，精准定位每一段记忆的发生地。

### 4. 极致交互体验

- **全站暗色模式**: 深度定制的“宣纸黑”中式美学配色。
- **响应式设计**: 完美适配桌面与移动浏览器。

### 5. 管理台配置能力

- **记忆管理台**: 在本地直接维护 SQLite 中的乡村记忆数据。
- **AI 配置台**: 通过 `/admin/ai-providers` 页面修改文本与图片 API 供应商名称、Base URL、模型和 API Key，保存后立即生效。

---

## 📁 目录结构

```text
Echovale/
├── client/             # Next.js 前端项目
│   ├── src/app/        # 页面路由 (Gallery, Map, Create)
│   ├── src/components/ # UI 组件库
│   └── public/uploads/ # 用户上传资源存放区
├── server/             # Go 后端项目
│   ├── main.go         # 核心 API 与数据库逻辑
│   ├── public/gallery/ # 示例图库静态资源
│   ├── public/placeholders/ # 前端占位图静态资源
│   └── cultural_memory.db # SQLite 数据库文件
├── start.bat           # 一键启动脚本（支持终端重复执行）
├── stop.bat            # 一键停止当前项目开发服务
└── .gitignore          # 经过优化的 Git 忽略配置文件
```

---

## ⚖️ AI 工具合规规范

根据要求，非音乐类作品必须使用以下 10 款工具：

1. **阿里通义系列**：多模态生成、代码补全、可视化。
2. **百度文心系列**：多模态生成、深度学习（飞桨）。
3. **DeepSeek**：逻辑推理、复杂算法、长文本处理。
4. **稿定设计**：图文设计、海报/PPT 模板。
5. **和鲸 ModelWhale**：低代码 AI 开发、数据清洗。
6. **即梦、豆包 AI**：内容创作、视频编辑、多模态交互。
7. **科大讯飞星火**：语音处理、方言识别、智能配音。
8. **Kimi**：超长文本处理、文档分析。
9. **腾讯混元系列**：3D 资产生成、AI 编程、文本润色。
10. **智谱 AI**：技术文档、无代码 Bot 开发。

音乐类作品必须使用：ACE Studio, 海绵音乐, 腾讯音乐·启明星, 天谱, 网易云音乐·XStudio。

## 📈 开发进度

- [X] 项目初始化与环境搭建 (Next.js + Go/Gin)
- [X] 快速启动脚本 (根目录下 `start.bat`)
- [X] 前后端基础架构开发 (已集成本地文件上传 & Go 后端基础 API)
- [X] 指定 AI 接口集成 (Go 侧已对接 OpenRouter DeepSeek 免费模型)
- [ ] 首页与记忆采集前端页面开发
- [ ] 时空地图与展示功能实现
- [ ] 虚拟展厅初版开发
- [ ] 整体测试与部署 (本地环境验证)

## ⚡ 启动指南

在 Windows 环境下，直接双击根目录下的 **`start.bat`** 即可同时启动前端 (Next.js) 和后端 (Go) 服务。

如果你从终端执行，推荐在项目根目录运行 `start.bat`，不要重复手动执行 `npm run dev`，否则会因为已有实例占用 `.next/dev/lock` 而报错。

- 前端: `http://localhost:3000`
- 后端: `http://localhost:8080`
- 接口测试: `http://localhost:8080/ping`

## 🔐 AI 配置

Go 后端会在启动时自动读取 `server/.env`，当前 `POST /api/v1/process-ai` 已接入 OpenRouter 聊天补全接口，默认模型为 `deepseek/deepseek-chat-v3-0324:free`。

同一接口现在也会调用真实图片生成链路。考虑到 OpenRouter 的图片输出模型当前不是免费方案，项目默认改为通过 Pollinations 的免费接口生成图片，并把结果保存到 `client/public/uploads` 后再返回前端展示。

可配置项：

- `OPENROUTER_API_KEY`: OpenRouter 密钥
- `OPENROUTER_MODEL`: 模型 ID
- `OPENROUTER_SITE_URL`: 站点地址，会作为 OpenRouter 请求头传递
- `OPENROUTER_SITE_NAME`: 站点名称，会作为 OpenRouter 请求头传递
- `AI_IMAGE_BASE_URL`: 图片生成接口地址，默认是 `https://image.pollinations.ai/prompt`
- `AI_IMAGE_MODEL`: 图片生成模型名，默认是 `flux`
- `AI_IMAGE_WIDTH`: 生成图片宽度
- `AI_IMAGE_HEIGHT`: 生成图片高度

如果你后续改回 OpenRouter 图片模型，需要另外准备可用的图片模型和相应计费额度。
