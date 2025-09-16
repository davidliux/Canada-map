#!/bin/bash

# 加拿大快递配送区域地图系统 - 停止脚本
# =====================================

echo "================================================"
echo "🛑 停止加拿大快递配送区域地图系统"
echo "================================================"
echo ""

# 1. 停止前端服务
echo "📦 停止前端服务..."
if lsof -i :5001 > /dev/null 2>&1; then
    PID=$(lsof -ti :5001)
    kill $PID 2>/dev/null
    echo "✅ 前端服务已停止 (PID: $PID)"
else
    echo "⚠️  前端服务未运行"
fi

# 2. 停止后端服务
echo "📦 停止后端服务..."
if lsof -i :5050 > /dev/null 2>&1; then
    PID=$(lsof -ti :5050)
    kill $PID 2>/dev/null
    echo "✅ 后端服务已停止 (PID: $PID)"
else
    echo "⚠️  后端服务未运行"
fi

# 3. 清理所有 Node 进程
echo "📦 清理 Node 进程..."
pkill -f "node.*server.js" 2>/dev/null
pkill -f "node.*vite" 2>/dev/null

# 4. PostgreSQL 数据库（可选）
echo ""
read -p "是否停止 PostgreSQL 数据库？(y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 停止 PostgreSQL..."
    brew services stop postgresql@14
    echo "✅ PostgreSQL 已停止"
else
    echo "⚠️  PostgreSQL 保持运行"
fi

echo ""
echo "================================================"
echo "✅ 服务停止完成！"
echo "================================================"