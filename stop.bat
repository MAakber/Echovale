@echo off
setlocal
CHCP 65001 > nul

set "ROOT=%~dp0"
set "CLIENT_DIR=%ROOT%client"
set "SERVER_DIR=%ROOT%server"
set "SILENT=0"

if /I "%~1"=="--silent" set "SILENT=1"

if "%SILENT%"=="0" (
    echo [停止] 正在关闭当前项目的前后端开发进程...
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$client = '%CLIENT_DIR%';" ^
  "$server = '%SERVER_DIR%';" ^
    "$processes = Get-CimInstance Win32_Process;" ^
    "$seedIds = $processes | Where-Object {" ^
    "  ($_.CommandLine -like ('*' + $client + '*npm*.cmd run dev*')) -or" ^
    "  ($_.CommandLine -like ('*' + $client + '*npm-cli.js*run dev*')) -or" ^
    "  ($_.CommandLine -like ('*' + $client + '*next*dev*')) -or" ^
    "  ($_.CommandLine -like ('*' + $client + '*start-server.js*')) -or" ^
    "  ($_.CommandLine -like ('*' + $server + '*go run main.go*')) -or" ^
    "  ($_.CommandLine -like ('*' + $server + '*server.exe*'))" ^
    "} | Select-Object -ExpandProperty ProcessId -Unique;" ^
    "$toStop = New-Object 'System.Collections.Generic.HashSet[int]';" ^
    "$queue = New-Object 'System.Collections.Generic.Queue[int]';" ^
    "foreach ($id in $seedIds) { if ($toStop.Add([int]$id)) { $queue.Enqueue([int]$id) } };" ^
    "while ($queue.Count -gt 0) {" ^
    "  $current = $queue.Dequeue();" ^
    "  foreach ($child in ($processes | Where-Object { $_.ParentProcessId -eq $current })) {" ^
    "    if ($toStop.Add([int]$child.ProcessId)) { $queue.Enqueue([int]$child.ProcessId) }" ^
    "  }" ^
    "};" ^
    "$toStop | Sort-Object -Descending | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue };" ^
    "Get-NetTCPConnection -LocalPort 3000,3001,8080 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { if ($_ -gt 0) { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }"

    for %%P in (3000 3001 8080) do (
        for /f %%I in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort %%P -ErrorAction SilentlyContinue ^| Select-Object -ExpandProperty OwningProcess -Unique"') do (
            if not "%%I"=="0" taskkill /PID %%I /F /T >nul 2>nul
        )
    )

if exist "%CLIENT_DIR%\.next\dev\lock" (
    del /f /q "%CLIENT_DIR%\.next\dev\lock" >nul 2>nul
)

if "%SILENT%"=="0" (
    echo [完成] 当前项目的前后端进程已停止。
)

endlocal