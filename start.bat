@echo off
chcp 65001 >nul
echo 🚀 启动 Tripadvisor 前后端服务
echo.

REM 检查是否在项目根目录
if not exist "backend" (
    echo ❌ 请在项目根目录运行此脚本
    exit /b 1
)
if not exist "frontend" (
    echo ❌ 请在项目根目录运行此脚本
    exit /b 1
)

REM 启动后端
echo 📦 启动后端服务器 (端口 3000)...
start "Backend Server" cmd /k "cd backend && npm run dev"

REM 等待后端启动
timeout /t 3 /nobreak >nul

REM 检查前端依赖
cd frontend
if not exist "node_modules" (
    echo 📥 安装前端依赖...
    call npm install
)

REM 启动前端
echo 🎨 启动前端开发服务器 (端口 5173)...
start "Frontend Server" cmd /k "npm run dev"
cd ..

echo.
echo ✅ 服务启动成功！
echo.
echo 📍 访问地址：
echo    前端: http://localhost:5173
echo    后端: http://localhost:3000
echo.
echo 提示：关闭命令行窗口即可停止服务
pause
