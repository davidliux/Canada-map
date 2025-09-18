#!/bin/bash
# VNC部署脚本 - 在VNC控制台中执行

echo "==================================="
echo "   地图系统部署脚本 v1.0"
echo "==================================="

# 1. 更新系统
echo "[1/7] 更新系统包..."
apt-get update

# 2. 安装Docker
echo "[2/7] 安装Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | bash
else
    echo "Docker已安装"
fi

# 3. 安装Docker Compose
echo "[3/7] 安装Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo "Docker Compose已安装"
fi

# 4. 克隆项目
echo "[4/7] 克隆项目代码..."
cd /root
if [ -d "Canada-map" ]; then
    echo "项目已存在，更新代码..."
    cd Canada-map
    git pull
else
    git clone https://github.com/davidliux/Canada-map.git
    cd Canada-map
fi

# 5. 创建环境文件
echo "[5/7] 配置环境变量..."
cat > .env << 'EOF'
DB_USER=postgres
DB_PASSWORD=SecurePass2024
DB_NAME=map_delivery
JWT_SECRET=jwt-secret-key-2024
VITE_API_URL=http://114.215.166.34/api
NODE_ENV=production
EOF

# 6. 构建并启动
echo "[6/7] 构建Docker镜像..."
docker-compose build

echo "[7/7] 启动服务..."
docker-compose up -d

# 7. 检查状态
echo ""
echo "==================================="
echo "   部署完成！"
echo "==================================="
docker-compose ps

echo ""
echo "访问地址："
echo "前端: http://114.215.166.34"
echo "API: http://114.215.166.34:5050"
echo ""
echo "查看日志: docker-compose logs -f"