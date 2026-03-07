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
