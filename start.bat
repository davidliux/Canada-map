@echo off
chcp 65001 >nul
title 加拿大快递配送系统 - 启动控制台

REM 加拿大快递配送系统 - Windows 启动脚本
REM =====================================

:MENU
cls
echo.
echo ==========================================
echo    加拿大快递配送系统 - 启动控制台 v2.0
echo ==========================================
echo.
echo 请选择启动模式：
echo.
echo   1) 🚀 开发模式 (前端+后端+数据库)
echo   2) 💻 仅前端开发
echo   3) 🔧 仅后端开发
echo   4) 🗄️  初始化数据库
echo   5) 📦 构建生产版本
echo   6) 🧹 清理缓存和依赖
echo   7) 📊 系统健康检查
echo   8) 📝 查看日志
echo   9) ❌ 退出
echo.
set /p choice=请输入选项 (1-9): 

if "%choice%"=="1" goto DEV_MODE
if "%choice%"=="2" goto FRONTEND_ONLY
if "%choice%"=="3" goto BACKEND_ONLY
if "%choice%"=="4" goto INIT_DB
if "%choice%"=="5" goto BUILD_PROD
if "%choice%"=="6" goto CLEAN
if "%choice%"=="7" goto HEALTH_CHECK
if "%choice%"=="8" goto VIEW_LOGS
if "%choice%"=="9" goto EXIT

echo 无效选项，请重新选择
pause
goto MENU

:CHECK_DEPS
echo [INFO] 检查系统依赖...

REM 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js 未安装。请先安装 Node.js ^>= 18.0.0
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [SUCCESS] Node.js 版本: %NODE_VERSION%

REM 检查 npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm 未安装
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo [SUCCESS] npm 版本: v%NPM_VERSION%

REM 检查 PostgreSQL (可选)
where psql >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] PostgreSQL 已安装
) else (
    echo [WARNING] PostgreSQL 未检测到 (后端功能需要)
)

goto :eof

:INSTALL_DEPS
echo [INFO] 安装项目依赖...

REM 安装前端依赖
echo [INFO] 安装前端依赖...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] 前端依赖安装失败
    pause
    goto MENU
)
echo [SUCCESS] 前端依赖安装成功

REM 安装后端依赖
echo [INFO] 安装后端依赖...
cd backend
call npm install
cd ..
if %errorlevel% neq 0 (
    echo [ERROR] 后端依赖安装失败
    pause
    goto MENU
)
echo [SUCCESS] 后端依赖安装成功

goto :eof

:DEV_MODE
call :CHECK_DEPS

REM 检查依赖是否已安装
if not exist "node_modules\" (
    call :INSTALL_DEPS
)
if not exist "backend\node_modules\" (
    call :INSTALL_DEPS
)

echo [INFO] 启动开发模式...

REM 检查是否安装了 concurrently
where concurrently >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] 使用 concurrently 启动前后端...
    npx concurrently --names "FRONTEND,BACKEND" --prefix-colors "cyan,yellow" "npm run dev" "cd backend && npm run dev"
) else (
    echo [INFO] 安装 concurrently...
    call npm install -g concurrently
    npx concurrently --names "FRONTEND,BACKEND" --prefix-colors "cyan,yellow" "npm run dev" "cd backend && npm run dev"
)

pause
goto MENU

:FRONTEND_ONLY
call :CHECK_DEPS

if not exist "node_modules\" (
    echo [INFO] 安装前端依赖...
    call npm install
)

echo [INFO] 启动前端开发服务器...
echo [INFO] 前端地址: http://localhost:5001
call npm run dev

pause
goto MENU

:BACKEND_ONLY
call :CHECK_DEPS

cd backend
if not exist "node_modules\" (
    echo [INFO] 安装后端依赖...
    call npm install
)

echo [INFO] 启动后端 API 服务器...
echo [INFO] 后端地址: http://localhost:5050
call npm run dev
cd ..

pause
goto MENU

:INIT_DB
echo [INFO] 初始化数据库...

REM 检查 .env 文件
if not exist "backend\.env" (
    echo [WARNING] .env 文件不存在，创建默认配置...
    copy backend\.env.example backend\.env
    echo [INFO] 请编辑 backend\.env 文件配置数据库连接
    notepad backend\.env
    pause
)

cd backend

REM 运行 Prisma 迁移
echo [INFO] 运行数据库迁移...
call npx prisma migrate dev --name init

if %errorlevel% neq 0 (
    echo [ERROR] 数据库迁移失败
    cd ..
    pause
    goto MENU
)

echo [SUCCESS] 数据库迁移成功

REM 生成 Prisma Client
echo [INFO] 生成 Prisma Client...
call npx prisma generate

REM 运行种子数据（如果存在）
if exist "prisma\seed.js" (
    echo [INFO] 导入种子数据...
    call npm run prisma:seed
)

cd ..
echo [SUCCESS] 数据库初始化完成

pause
goto MENU

:BUILD_PROD
echo [INFO] 构建生产版本...

REM 构建前端
echo [INFO] 构建前端...
call npm run build

if %errorlevel% neq 0 (
    echo [ERROR] 前端构建失败
    pause
    goto MENU
)

echo [SUCCESS] 前端构建成功

REM 构建后端
echo [INFO] 准备后端生产环境...
cd backend
if exist "package.json" (
    findstr /C:"\"build\"" package.json >nul
    if %errorlevel% equ 0 (
        call npm run build
    )
)
cd ..

echo [SUCCESS] 生产版本构建完成
echo [INFO] 前端文件: .\dist
echo [INFO] 启动生产服务器: cd backend ^&^& npm start

pause
goto MENU

:CLEAN
echo [WARNING] 即将清理所有缓存和依赖...
set /p confirm=确定要继续吗？(y/n): 

if /i "%confirm%"=="y" (
    echo [INFO] 清理前端...
    if exist "node_modules\" rmdir /s /q node_modules
    if exist "package-lock.json" del package-lock.json
    if exist "dist\" rmdir /s /q dist
    
    echo [INFO] 清理后端...
    if exist "backend\node_modules\" rmdir /s /q backend\node_modules
    if exist "backend\package-lock.json" del backend\package-lock.json
    
    echo [INFO] 清理 npm 缓存...
    call npm cache clean --force
    
    echo [SUCCESS] 清理完成
) else (
    echo [INFO] 取消清理
)

pause
goto MENU

:HEALTH_CHECK
echo [INFO] 执行系统健康检查...

REM 检查前端
echo [INFO] 检查前端服务...
curl -s http://localhost:5001 >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] 前端服务运行正常
) else (
    echo [WARNING] 前端服务未运行
)

REM 检查后端
echo [INFO] 检查后端 API...
curl -s http://localhost:5050/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] 后端 API 运行正常
) else (
    echo [WARNING] 后端 API 未运行
)

REM 检查数据库连接
echo [INFO] 检查数据库连接...
cd backend
call npx prisma db push --accept-data-loss --skip-generate >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] 数据库连接正常
) else (
    echo [WARNING] 数据库连接失败
)
cd ..

REM 检查端口占用
echo [INFO] 检查端口占用...
netstat -an | findstr :5050 >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] 端口 5050 (后端) 已被占用
) else (
    echo [INFO] 端口 5050 (后端) 可用
)

netstat -an | findstr :5001 >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] 端口 5001 (前端) 已被占用
) else (
    echo [INFO] 端口 5001 (前端) 可用
)

pause
goto MENU

:VIEW_LOGS
echo [INFO] 查看日志文件...
echo.
echo 选择要查看的日志：
echo 1) 前端日志
echo 2) 后端日志
echo 3) 数据库日志
echo 4) 返回主菜单
echo.
set /p log_choice=请选择 (1-4): 

if "%log_choice%"=="1" (
    if exist "logs\frontend.log" (
        type logs\frontend.log | more
    ) else (
        echo [WARNING] 前端日志文件不存在
    )
) else if "%log_choice%"=="2" (
    if exist "backend\logs\all.log" (
        type backend\logs\all.log | more
    ) else (
        echo [WARNING] 后端日志文件不存在
    )
) else if "%log_choice%"=="3" (
    if exist "backend\logs\database.log" (
        type backend\logs\database.log | more
    ) else (
        echo [WARNING] 数据库日志文件不存在
    )
) else if "%log_choice%"=="4" (
    goto MENU
)

pause
goto VIEW_LOGS

:EXIT
echo.
echo 感谢使用加拿大快递配送系统！
echo.
timeout /t 2 >nul
exit /b 0