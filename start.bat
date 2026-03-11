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

echo [准备] 正在等待端口 8080 和 3000 完全释放...
call :wait_for_port_release 8080 15
if errorlevel 1 goto :startup_failed
call :wait_for_port_release 3000 15
if errorlevel 1 goto :startup_failed

if exist "%CLIENT_DIR%\.next\dev\lock" (
    del /f /q "%CLIENT_DIR%\.next\dev\lock" >nul 2>nul
)

echo [1/2] 正在启动 Go 后端 (Gin) 在端口 8080...
start "Go 后端服务器" cmd /k "cd /d ""%SERVER_DIR%"" && go mod tidy && go run ."

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
exit /b 0

:wait_for_port_release
set "TARGET_PORT=%~1"
set "WAIT_SECONDS=%~2"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$port = [int]'%TARGET_PORT%';" ^
    "$deadline = (Get-Date).AddSeconds([int]'%WAIT_SECONDS%');" ^
    "do {" ^
    "  $listener = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1;" ^
    "  if (-not $listener) { exit 0 }" ^
    "  Start-Sleep -Milliseconds 500;" ^
    "} while ((Get-Date) -lt $deadline);" ^
    "$proc = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $listener.OwningProcess) -ErrorAction SilentlyContinue;" ^
    "if ($proc) {" ^
    "  Write-Output ('[错误] 端口 ' + $port + ' 仍被占用。PID=' + $proc.ProcessId + ' Name=' + $proc.Name);" ^
    "  if ($proc.CommandLine) { Write-Output $proc.CommandLine }" ^
    "} else {" ^
    "  Write-Output ('[错误] 端口 ' + $port + ' 仍被占用，且无法读取进程详情。');" ^
    "}" ^
    "exit 1"
exit /b %errorlevel%

:startup_failed
echo.
echo [失败] 启动前端口未释放，已终止本次启动，请先处理占用进程后重试。
pause
popd > nul
endlocal
exit /b 1
