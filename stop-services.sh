#!/bin/bash

# 停止服务脚本
echo "🛑 停止加拿大快递配送区域地图系统服务"
echo "======================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 停止前端服务
if [ -f logs/frontend.pid ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "停止前端服务 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        echo -e "${GREEN}✅ 前端服务已停止${NC}"
    else
        echo -e "${YELLOW}前端服务未运行${NC}"
    fi
    rm -f logs/frontend.pid
else
    echo -e "${YELLOW}未找到前端服务 PID 文件${NC}"
fi

# 停止后端服务
if [ -f logs/backend.pid ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "停止后端服务 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        echo -e "${GREEN}✅ 后端服务已停止${NC}"
    else
        echo -e "${YELLOW}后端服务未运行${NC}"
    fi
    rm -f logs/backend.pid
else
    echo -e "${YELLOW}未找到后端服务 PID 文件${NC}"
fi

# 尝试通过端口查找并停止服务
echo ""
echo "检查端口占用..."

# 检查前端端口 3001
FRONTEND_PORT_PID=$(lsof -ti:3001)
if [ ! -z "$FRONTEND_PORT_PID" ]; then
    echo -e "${YELLOW}发现端口 3001 被占用 (PID: $FRONTEND_PORT_PID)${NC}"
    read -p "是否停止该进程? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill $FRONTEND_PORT_PID
        echo -e "${GREEN}✅ 已停止占用端口 3001 的进程${NC}"
    fi
fi

# 检查后端端口 5050
BACKEND_PORT_PID=$(lsof -ti:5050)
if [ ! -z "$BACKEND_PORT_PID" ]; then
    echo -e "${YELLOW}发现端口 5050 被占用 (PID: $BACKEND_PORT_PID)${NC}"
    read -p "是否停止该进程? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill $BACKEND_PORT_PID
        echo -e "${GREEN}✅ 已停止占用端口 5050 的进程${NC}"
    fi
fi

echo ""
echo "======================================="
echo -e "${GREEN}✅ 服务停止完成${NC}"
echo "======================================="