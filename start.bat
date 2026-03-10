@echo off
setlocal
TITLE 乡村文化记忆库 - 一键启动脚本
CHCP 65001 > nul

set "ROOT=%~dp0"
set "CLIENT_DIR=%ROOT%client"
set "SERVER_DIR=%ROOT%server"

pushd "%ROOT%" > nul

echo ======================================================
echo    乡村文化记忆库 - 基于AIGC的乡村数字记忆构建与传播平台
echo ======================================================
echo.

:: 检查 Go 环境
where go >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 请确保已安装 Go 语言并配置到环境变量。
    pause
    exit /b 1
)

:: 检查 Node 环境
where npm.cmd >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 请确保已安装 Node.js 并在环境变量中包含 npm.cmd。
    pause
    exit /b 1
)

echo [准备] 正在清理上一次运行的前后端实例...
call "%ROOT%stop.bat" --silent

if exist "%CLIENT_DIR%\.next\dev\lock" (
    del /f /q "%CLIENT_DIR%\.next\dev\lock" >nul 2>nul
)

echo [1/2] 正在启动 Go 后端 (Gin) 在端口 8080...
start "Go 后端服务器" cmd /k "cd /d ""%SERVER_DIR%"" && go mod tidy && go run main.go"

echo [2/2] 正在启动 Next.js 前端在端口 3000...
start "Next.js 前端" cmd /k "cd /d ""%CLIENT_DIR%"" && npm.cmd run dev"

echo.
echo ======================================================
echo    一切就绪！
echo    - 前端访问: http://localhost:3000
echo    - 后端接口: http://localhost:8080
echo    - 接口测试: http://localhost:8080/ping
echo ======================================================
echo.
echo 你现在也可以在终端里直接执行：
echo    start.bat
echo.
echo 如果需要停止当前项目的服务，请执行：
echo    stop.bat
echo.
echo 请保留弹出的两个命令窗口（不要关闭），它们是正在运行的服务。
pause

popd > nul
endlocal
