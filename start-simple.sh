#!/bin/bash

# 加拿大快递配送区域地图系统 - 快速启动脚本
# =========================================

echo "================================================"
echo "🚀 启动加拿大快递配送区域地图系统"
echo "================================================"
echo ""

# 1. 启动 PostgreSQL 数据库
echo "📦 步骤 1: 启动 PostgreSQL 数据库..."

# 检查 PostgreSQL 是否已运行
if brew services list | grep -q "postgresql@14.*started"; then
    echo "✅ PostgreSQL 已在运行"
else
    echo "🔄 正在启动 PostgreSQL..."
    brew services start postgresql@14
    sleep 3
    echo "✅ PostgreSQL 启动成功"
fi

# 2. 验证数据库连接
echo ""
echo "📦 步骤 2: 验证数据库连接..."

# 测试数据库连接
if psql -U david -p 5432 -d canada_postal_system -c "SELECT 1" > /dev/null 2>&1; then
    echo "✅ 数据库 'canada_postal_system' 连接成功"

    # 显示数据统计
    CITY_COUNT=$(psql -U david -p 5432 -d canada_postal_system -t -c "SELECT COUNT(*) FROM truck_delivery_cities;" 2>/dev/null | xargs)
    ZONE_COUNT=$(psql -U david -p 5432 -d canada_postal_system -t -c "SELECT COUNT(*) FROM truck_delivery_zones;" 2>/dev/null | xargs)

    echo "📊 当前数据:"
    echo "   城市: ${CITY_COUNT:-0} 个"
    echo "   区域: ${ZONE_COUNT:-0} 个"
else
    echo "❌ 数据库连接失败"
    echo "尝试创建数据库..."
    createdb -U david -p 5432 canada_postal_system

    # 运行迁移脚本
    echo "运行数据库迁移..."
    psql -U david -p 5432 -d canada_postal_system -f backend/migrations/001_create_truck_delivery_tables.sql
    psql -U david -p 5432 -d canada_postal_system -f backend/migrations/add_dynamic_pricing_tables.sql
fi

# 3. 停止旧的后端进程
echo ""
echo "📦 步骤 3: 清理旧进程..."

# 检查并停止占用 5050 端口的进程
if lsof -i :5050 > /dev/null 2>&1; then
    echo "⚠️  停止旧的后端服务..."
    pkill -f "node.*server.js" 2>/dev/null
    sleep 2
fi

# 4. 启动后端服务
echo ""
echo "📦 步骤 4: 启动后端服务..."

cd backend
npm start &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 5

# 验证后端服务
if curl -s http://localhost:5050/api/v1/health > /dev/null 2>&1; then
    echo "✅ 后端服务启动成功 (PID: $BACKEND_PID)"
else
    echo "❌ 后端服务启动失败"
fi

# 5. 启动前端服务
echo ""
echo "📦 步骤 5: 启动前端服务..."

# 检查端口 5001
if lsof -i :5001 > /dev/null 2>&1; then
    echo "✅ 前端服务已在运行"
else
    npm run dev &
    FRONTEND_PID=$!
    sleep 5

    if lsof -i :5001 > /dev/null 2>&1; then
        echo "✅ 前端服务启动成功 (PID: $FRONTEND_PID)"
    else
        echo "⚠️  前端服务启动失败"
    fi
fi

# 6. 显示服务信息
echo ""
echo "================================================"
echo "✅ 系统启动完成！"
echo "================================================"
echo ""
echo "📍 访问地址:"
echo "   前端: http://localhost:5001"
echo "   后端: http://localhost:5050"
echo "   健康检查: http://localhost:5050/api/v1/health"
echo ""
echo "📊 数据库信息:"
echo "   主机: localhost"
echo "   端口: 5432"
echo "   数据库: canada_postal_system"
echo "   用户: david"
echo ""
echo "💡 常用命令:"
echo "   停止服务: pkill -f 'node.*server.js'"
echo "   查看数据: psql -U david -d canada_postal_system"
echo "   查看日志: tail -f backend/logs/*.log"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo "================================================"

# 捕获 Ctrl+C 信号并清理进程
trap "echo ''; echo '正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

# 保持脚本运行
wait