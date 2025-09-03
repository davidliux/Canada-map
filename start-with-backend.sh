#!/bin/bash

# 启动脚本 - 同时运行前端和后端服务
# 使用方法: ./start-with-backend.sh

echo "🚀 加拿大快递配送区域地图系统 - 完整启动"
echo "========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 错误: Node.js 未安装${NC}"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

# 检查 PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  警告: PostgreSQL 客户端未找到${NC}"
    echo "请确保 PostgreSQL 已安装并运行"
fi

# 创建日志目录
mkdir -p logs

# 启动后端服务
echo -e "${GREEN}📦 启动后端服务...${NC}"
cd backend

# 检查后端依赖
if [ ! -d "node_modules" ]; then
    echo "安装后端依赖..."
    npm install
fi

# 检查环境配置
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}创建后端环境配置文件...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}请编辑 backend/.env 文件配置数据库连接${NC}"
fi

# 检查数据库连接
echo "检查数据库连接..."
npx prisma db push --skip-generate 2>/dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  数据库连接失败，请检查配置${NC}"
    echo "继续以本地存储模式运行..."
fi

# 启动后端服务（后台运行）
echo "启动后端服务器..."
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "后端服务 PID: $BACKEND_PID"

# 等待后端启动
sleep 3

# 检查后端是否启动成功
curl -s http://localhost:5050/api/v1/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 后端服务启动成功 (http://localhost:5050)${NC}"
else
    echo -e "${YELLOW}⚠️  后端服务可能未完全启动，请查看 logs/backend.log${NC}"
fi

cd ..

# 启动前端服务
echo -e "${GREEN}🎨 启动前端服务...${NC}"

# 检查前端依赖
if [ ! -d "node_modules" ]; then
    echo "安装前端依赖..."
    npm install
fi

# 设置环境变量
export VITE_API_BASE_URL="http://localhost:5050/api/v1"

# 启动前端服务
echo "启动前端开发服务器..."
npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "前端服务 PID: $FRONTEND_PID"

# 等待前端启动
sleep 3

# 保存 PID 到文件以便后续关闭
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid

echo ""
echo "========================================="
echo -e "${GREEN}✅ 系统启动完成！${NC}"
echo ""
echo "访问地址:"
echo "  前端界面: http://localhost:3001"
echo "  后端 API: http://localhost:5050"
echo "  API 文档: http://localhost:5050/api-docs"
echo ""
echo "日志文件:"
echo "  前端日志: logs/frontend.log"
echo "  后端日志: logs/backend.log"
echo ""
echo "停止服务:"
echo "  运行: ./stop-services.sh"
echo "  或手动: kill $FRONTEND_PID $BACKEND_PID"
echo ""
echo -e "${YELLOW}提示: 按 Ctrl+C 停止所有服务${NC}"
echo "========================================="

# 捕获退出信号
trap 'echo "正在停止服务..."; kill $FRONTEND_PID $BACKEND_PID 2>/dev/null; exit' INT TERM

# 等待并监控服务
while true; do
    # 检查进程是否还在运行
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${RED}前端服务已停止${NC}"
        break
    fi
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}后端服务已停止${NC}"
        break
    fi
    sleep 5
done

# 清理
kill $FRONTEND_PID $BACKEND_PID 2>/dev/null
rm -f logs/*.pid