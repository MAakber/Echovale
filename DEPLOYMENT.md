# 部署指南

## 环境要求

### 前端环境
- Node.js >= 18.x
- npm >= 9.x

### 后端环境
- Go >= 1.21
- **无需 CGO**（使用纯 Go SQLite 实现）

## 快速开始

### 方法一：使用一键启动脚本（推荐）

```bash
# Windows
start.bat
```

### 方法二：手动启动

#### 1. 启动后端服务

```bash
cd server
:: 可按需修改 server/.env 中的 OpenRouter 配置
go mod download
go mod tidy
go run main.go
```

后端将在 http://localhost:8080 启动

#### 2. 启动前端服务

```bash
cd client
npm install
npm run dev
```

前端将在 http://localhost:3000 启动

## 常见问题解决

### 1. Turbopack 权限错误（os error 5）

**问题描述：**
```
FATAL: An unexpected Turbopack error occurred.
拒绝访问。 (os error 5)
```

**解决方案：**
- 删除 `.next` 缓存目录：
  ```bash
  cd client
  rmdir /s /q .next
  npm run dev
  ```
- 如果仍有问题，检查防病毒软件设置

### 2. 数据库连接失败 / CGO 错误

**问题描述：**
```
failed to connect database: Binary was compiled with 'CGO_ENABLED=0'
go-sqlite3 requires cgo to work
```

**解决方案：**
- ✅ 已使用 `modernc.org/sqlite`（纯 Go SQLite 实现）
- ✅ 不需要 CGO，可在任何 Windows 电脑上运行
- 确保运行 `go mod tidy` 下载新依赖

### 3. 端口被占用

**前端端口 3000 被占用：**
```bash
cd client
set PORT=3001
npm run dev
```

**后端端口 8080 被占用：**
修改 `server/main.go` 中的端口号：
```go
r.Run(":8081") // 改为其他端口
```

### 4. 权限问题（Windows）

如果遇到权限错误，尝试：
1. 以管理员身份运行命令提示符
2. 关闭可能占用文件的程序（如资源管理器预览窗格）
3. 检查防病毒软件设置

## 项目结构

```
乡村/
├── client/          # Next.js 前端
│   ├── src/
│   ├── public/
│   └── package.json
├── server/          # Go 后端
│   ├── main.go
│   ├── go.mod
│   └── cultural_memory.db (自动生成)
└── start.bat        # 一键启动脚本
```

## 技术栈

- **前端**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **后端**: Go, Gin, GORM, SQLite (modernc.org/sqlite - 纯 Go 实现)
- **AI**: 集成 AI 故事润色功能

## 开发注意事项

1. **首次运行**：确保先执行 `npm install` 安装前端依赖
2. **数据库**：首次运行时会自动创建 SQLite 数据库文件
3. **AI 配置**：后端启动时会自动读取 `server/.env`，文本默认通过 OpenRouter 调用 DeepSeek 免费模型，图片默认通过 Pollinations 免费接口生成；如果你改用 OpenRouter 图片模型，需要额外注意计费
4. **上传目录**：确保 `client/public/uploads` 目录存在且有写入权限
5. **CORS**：后端已配置允许 `http://localhost:3000` 访问
6. **Go 依赖**：首次运行后端前执行 `go mod tidy`

## 故障排查

### 查看日志

**前端日志：**
直接在浏览器控制台查看

**后端日志：**
在运行 `go run main.go` 的终端查看

### 清理缓存

```bash
# 清理前端缓存
cd client
rmdir /s /q .next
rmdir /s /q node_modules
npm install

# 清理后端缓存
cd server
go clean
go mod download
go mod tidy
```

## 联系支持

如有其他问题，请检查：
1. 环境变量配置
2. 防火墙设置
3. 端口占用情况
4. 文件权限设置
