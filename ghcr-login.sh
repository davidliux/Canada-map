#!/bin/bash

# GHCR 快速登录脚本
# 使用方法: ./ghcr-login.sh YOUR_GITHUB_TOKEN

if [ -z "$1" ]; then
    echo "使用方法: ./ghcr-login.sh YOUR_GITHUB_TOKEN"
    echo "例如: ./ghcr-login.sh ghp_xxxxxxxxxxxxxxxxxxxx"
    exit 1
fi

TOKEN=$1
USER="davidliux"

echo "🔐 配置 GitHub Container Registry..."

# 本地登录
echo "配置本地 Docker..."
echo $TOKEN | docker login ghcr.io -u $USER --password-stdin
if [ $? -eq 0 ]; then
    echo "✅ 本地登录成功"
else
    echo "❌ 本地登录失败"
    exit 1
fi

# 服务器登录
echo ""
echo "配置服务器 Docker..."
ssh -i ~/.ssh/github.pem root@114.215.166.34 "echo '$TOKEN' | docker login ghcr.io -u $USER --password-stdin"
if [ $? -eq 0 ]; then
    echo "✅ 服务器登录成功"
else
    echo "❌ 服务器登录失败"
    exit 1
fi

echo ""
echo "✅ GHCR 配置完成！"
echo ""
echo "下一步："
echo "1. 推送代码触发构建: git push origin main"
echo "2. 查看构建进度: https://github.com/davidliux/Canada-map/actions"
echo "3. 部署到服务器:"
echo "   ssh -i ~/.ssh/github.pem root@114.215.166.34"
echo "   cd ~/map-delivery"
echo "   docker-compose pull && docker-compose up -d"