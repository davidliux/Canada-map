#!/bin/bash

echo "🚀 本地测试 Docker 部署"

# 构建前端镜像
echo "📦 构建前端镜像..."
docker build -t map-frontend:local .

# 构建后端镜像
echo "📦 构建后端镜像..."
docker build -t map-backend:local ./backend

# 创建本地测试网络
docker network create map-test-network || true

# 启动前端
echo "▶️ 启动前端容器..."
docker run -d \
  --name map-frontend-test \
  --network map-test-network \
  -p 8080:80 \
  map-frontend:local

# 启动后端
echo "▶️ 启动后端容器..."
docker run -d \
  --name map-backend-test \
  --network map-test-network \
  -p 5050:5050 \
  -e NODE_ENV=production \
  -e PORT=5050 \
  map-backend:local

echo "✅ 本地测试环境已启动"
echo "前端: http://localhost:8080"
echo "后端: http://localhost:5050"
echo ""
echo "查看日志："
echo "  docker logs map-frontend-test"
echo "  docker logs map-backend-test"
echo ""
echo "停止测试："
echo "  docker stop map-frontend-test map-backend-test"
echo "  docker rm map-frontend-test map-backend-test"