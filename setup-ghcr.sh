#!/bin/bash

echo "==================================="
echo "GitHub Container Registry 配置向导"
echo "==================================="
echo ""
echo "步骤 1: 创建 GitHub Personal Access Token (PAT)"
echo "-----------------------------------------------"
echo "1. 在浏览器中打开: https://github.com/settings/tokens/new"
echo "2. Token 名称: GHCR Access for Canada Map"
echo "3. 选择过期时间: 建议 90 days"
echo "4. 选择权限："
echo "   ✅ write:packages (上传容器镜像到 GitHub Packages)"
echo "   ✅ read:packages (下载容器镜像)"
echo "   ✅ delete:packages (删除包版本，可选)"
echo "5. 点击 'Generate token'"
echo "6. 复制生成的 token (只显示一次！)"
echo ""
echo "请输入您的 GitHub PAT: "
read -s GITHUB_TOKEN
echo ""
echo "请输入您的 GitHub 用户名 (davidliux): "
read GITHUB_USER
GITHUB_USER=${GITHUB_USER:-davidliux}

echo ""
echo "步骤 2: 配置本地 Docker 登录 GHCR"
echo "-----------------------------------"
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USER --password-stdin

if [ $? -eq 0 ]; then
    echo "✅ 本地 Docker 已成功登录 GHCR"
else
    echo "❌ 登录失败，请检查 token 和用户名"
    exit 1
fi

echo ""
echo "步骤 3: 配置服务器登录 GHCR"
echo "-----------------------------"
ssh -i ~/.ssh/github.pem root@114.215.166.34 << EOF
echo "$GITHUB_TOKEN" | docker login ghcr.io -u $GITHUB_USER --password-stdin
if [ \$? -eq 0 ]; then
    echo "✅ 服务器 Docker 已成功登录 GHCR"
else
    echo "❌ 服务器登录失败"
    exit 1
fi
EOF

echo ""
echo "步骤 4: 更新服务器配置"
echo "----------------------"
ssh -i ~/.ssh/github.pem root@114.215.166.34 << 'EOF'
cd ~/map-delivery

# 更新 .env 文件中的 GITHUB_REPOSITORY
sed -i 's|GITHUB_REPOSITORY=.*|GITHUB_REPOSITORY=davidliux/canada-map|' .env

# 创建简化的 docker-compose 配置
cat > docker-compose.yml << 'COMPOSE'
version: '3.8'

services:
  frontend:
    image: ghcr.io/davidliux/canada-map-frontend:latest
    container_name: map-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    environment:
      - TZ=Asia/Shanghai

  backend:
    image: ghcr.io/davidliux/canada-map-backend:latest
    container_name: map-backend
    restart: unless-stopped
    ports:
      - "5050:5050"
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - PORT=5050
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
COMPOSE

echo "✅ 服务器配置已更新"
EOF

echo ""
echo "==================================="
echo "✅ GHCR 配置完成！"
echo "==================================="
echo ""
echo "下一步操作："
echo "1. 推送代码到 GitHub 触发自动构建："
echo "   git push origin main"
echo ""
echo "2. 在 GitHub Actions 查看构建进度："
echo "   https://github.com/davidliux/Canada-map/actions"
echo ""
echo "3. 构建完成后，在服务器上部署："
echo "   ssh -i ~/.ssh/github.pem root@114.215.166.34"
echo "   cd ~/map-delivery"
echo "   docker-compose pull"
echo "   docker-compose up -d"
echo ""