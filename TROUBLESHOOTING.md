# 快速故障排查指南

## 🚨 常见错误及解决方案

### 错误 1: Turbopack 权限错误
```
FATAL: An unexpected Turbopack error occurred.
拒绝访问。 (os error 5)
```

**解决方法：**
```bash
cd client
rmdir /s /q .next
npm run dev
```

---

### 错误 2: CGO SQLite 错误
```
failed to connect database: Binary was compiled with 'CGO_ENABLED=0'
go-sqlite3 requires cgo to work
```

**解决方法：**
```bash
cd server
go mod tidy
go run main.go
```

> ✅ 已修复：项目已使用纯 Go SQLite 驱动，不需要 CGO

---

### 错误 3: 端口被占用
```
listen tcp :3000: bind: Only one usage of each socket address is allowed
```

**解决方法：**
```bash
# 方法 1: 关闭占用端口的程序
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# 方法 2: 使用其他端口
cd client
set PORT=3001
npm run dev
```

### 错误 3.1: Next.js lock 文件冲突
```
Unable to acquire lock at client/.next/dev/lock
```

**解决方法：**
```bat
:: 推荐：直接使用项目根目录脚本，它会先清理残留进程再启动
start.bat

:: 或者手动先停掉当前项目的开发服务
stop.bat
start.bat
```

> ✅ 已修复：`start.bat` 现在会自动停止当前项目残留的 Next / Go 开发进程，并清理 lock 文件。

### 错误 3.2: PowerShell 无法直接执行 npm
```
无法加载文件 npm.ps1，因为在此系统上禁止运行脚本
```

**解决方法：**
```bat
:: 不要直接在 PowerShell 里运行 npm
start.bat

:: 如果只想启动前端，请使用 cmd 方式
cmd /c "cd /d client && npm.cmd run dev"
```

---

### 错误 4: 数据库文件不存在
```
unable to open database file
```

**解决方法：**
```bash
# 确保在 server 目录运行
cd server
go run main.go
# 数据库会自动创建
```

---

### 错误 5: AI 处理失败 / OpenRouter 配置错误
```
AI 处理失败，请检查 OpenRouter 配置或稍后重试
```

如果你看到类似下面这种报错：

```
openrouter request failed: Post "https://openrouter.ai/api/v1/chat/completions": EOF
```

它的意思不是“模型名错了”，而是“HTTP 连接已经发出去了，但在服务端返回完整响应之前，连接被提前断开了”。这通常是以下几类原因：

- 代理软件或网络中间层临时断连
- OpenRouter 上游瞬时抖动
- 本机网络可以连上 443，但 TLS/HTTP 请求在中途被重置

现在后端已经对这类错误自动重试一次；如果仍然失败，优先检查：

- 是否正在使用代理、系统 VPN、Mihomo、Clash 一类网络中间层
- 当前网络是否能稳定访问 `https://openrouter.ai`
- 稍等几秒后再次测试，确认是不是瞬时抖动

如果你看到类似下面这种报错：

```
decode response failed: provider returned invalid or incomplete JSON (status 524, body <empty body>): unexpected end of JSON input
```

它的实际含义通常是：

- 不是你提交的 JSON 有问题
- 而是上游服务超时了，最终回了一个 `524`，并且响应体是空的
- 之前后端会把这种情况误报成“JSON 解析失败”，现在已经改成优先识别为“上游超时”，并自动重试一次

`524` 一般表示：

- 你的自定义供应商或它背后的网关处理太慢
- 上游模型正在拥塞或排队
- 反向代理/CDN 在等待上游响应时超时

优先检查：

- 当前供应商网关本身是否稳定
- 当前模型是否响应特别慢
- 稍后重试是否恢复
- 是否需要换一个更快的模型，或让供应商提高超时时间

**解决方法：**
```bash
cd server
# 检查 server/.env 是否存在且 OPENROUTER_API_KEY 是否有效
go run main.go
```

检查项：
- `server/.env` 中的 `OPENROUTER_API_KEY` 是否为空
- `OPENROUTER_MODEL` 是否为可用模型 ID
- 当前网络是否可以访问 `https://openrouter.ai`

### 错误 6: AI 图片创作失败
```
AI 图片创作失败，请稍后重试
```

检查项：
- `server/.env` 中的 `AI_IMAGE_BASE_URL` 是否可访问
- `server/.env` 中的 `AI_IMAGE_MODEL` 是否与当前图片供应商匹配（默认免费方案为 Pollinations 的 `flux`）
- 如果你改成 OpenRouter 图片模型，确认 `OPENROUTER_API_KEY` 或 `AI_IMAGE_API_KEY` 有效且账户可计费
- 默认免费方案下，确认当前网络是否可以访问 `https://image.pollinations.ai`

### 错误 7: 管理台保存 AI 配置失败
```
保存 AI 配置失败
```

检查项：
- `server/ai_provider_config.json` 是否有写入权限
- 后端服务是否已重启到最新代码
- 管理台请求的后端地址是否仍然是 `http://localhost:8080`

---

## 📋 完整重置步骤

如果问题持续，尝试完全重置：

### 1. 清理前端
```bash
cd client
rmdir /s /q node_modules
rmdir /s /q .next
npm install
```

### 2. 清理后端
```bash
cd server
go clean -modcache
go mod download
go mod tidy
```

### 3. 删除数据库（可选）
```bash
# 删除旧数据库文件（会重新创建）
del server\cultural_memory.db
```

### 4. 重新启动
```bash
# 在项目根目录
start.bat
```

---

## 🔍 检查清单

- [ ] Node.js 版本 >= 18.x (`node -v`)
- [ ] Go 版本 >= 1.21 (`go version`)
- [ ] 前端依赖已安装 (`client/node_modules` 存在)
- [ ] 后端依赖已下载 (`server/go.sum` 存在)
- [ ] 端口 3000 和 8080 未被占用
- [ ] 有写入权限（特别是 `server/` 和 `client/public/uploads/` 目录）

---

## 💡 提示

1. **首次运行**：务必先执行 `npm install` 和 `go mod tidy`
2. **权限问题**：尝试以管理员身份运行命令提示符
3. **网络问题**：如果 `go mod tidy` 失败，检查网络连接
4. **文件锁定**：关闭可能占用文件的程序（如资源管理器预览）

---

## 📞 需要帮助？

如果以上方法都无法解决问题，请提供：
1. 完整的错误信息
2. 操作系统版本
3. Node.js 和 Go 版本
4. 已尝试的解决方法
