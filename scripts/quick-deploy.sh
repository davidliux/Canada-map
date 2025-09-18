#!/bin/bash

# 快速部署脚本 - 在服务器上执行
# 请先将此脚本复制到服务器

set -e

echo "🚀 快速部署配置"

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "📦 安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    usermod -aG docker $USER
fi

# 检查 Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "📦 安装 Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 创建目录
mkdir -p ~/map-delivery/{data,logs,ssl,backups}
cd ~/map-delivery

# 提示配置 GHCR
echo ""
echo "📝 请配置 GitHub Container Registry 访问："
echo "1. 在 GitHub 创建 Personal Access Token (PAT)"
echo "   - 访问: https://github.com/settings/tokens"
echo "   - 权限: read:packages"
echo ""
echo "2. 运行以下命令登录 GHCR："
echo "   echo YOUR_PAT | docker login ghcr.io -u YOUR_USERNAME --password-stdin"
echo ""
echo "按回车继续..."
read

# 创建 .env 文件
cat > .env << 'EOF'
# 基础配置
NODE_ENV=production
PORT=5050
GITHUB_REPOSITORY=your-username/your-repo

# 数据库配置（可选）
DATABASE_URL=postgresql://mapuser:password@localhost:5432/mapdb
DB_NAME=mapdb
DB_USER=mapuser
DB_PASSWORD=your_db_password

# JWT 配置
JWT_SECRET=your-jwt-secret-here

# CORS 配置
CORS_ORIGIN=http://114.215.166.34

# Redis 配置（可选）
REDIS_PASSWORD=your_redis_password
EOF

echo "✏️  请编辑 .env 文件填入实际配置"
echo "   nano .env"
echo ""
echo "✅ 基础配置完成！"
echo ""
echo "下一步："
echo "1. 编辑 .env 文件"
echo "2. 推送代码到 GitHub 触发自动部署"
echo "3. 或手动拉取镜像："
echo "   docker pull ghcr.io/your-username/your-repo-frontend:latest"
echo "   docker pull ghcr.io/your-username/your-repo-backend:latest"