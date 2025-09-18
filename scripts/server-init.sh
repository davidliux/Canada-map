#!/bin/bash

# 阿里云服务器初始化脚本
# 使用方法: bash server-init.sh

echo "==============================================="
echo "   加拿大快递配送地图系统 - 服务器初始化脚本"
echo "==============================================="

# 更新系统
echo "1. 更新系统包..."
sudo apt-get update && sudo apt-get upgrade -y

# 安装必要的工具
echo "2. 安装基础工具..."
sudo apt-get install -y \
    curl \
    git \
    vim \
    htop \
    ufw \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# 安装 Docker
echo "3. 安装 Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | bash
    sudo usermod -aG docker $USER
    echo "Docker 安装完成。请退出并重新登录以使用 docker 命令。"
else
    echo "Docker 已安装"
fi

# 安装 Docker Compose
echo "4. 安装 Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose 安装完成"
else
    echo "Docker Compose 已安装"
fi

# 配置防火墙
echo "5. 配置防火墙..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5050
echo "防火墙配置完成"

# 创建项目目录
echo "6. 创建项目目录..."
mkdir -p ~/map-delivery
cd ~/map-delivery

# 安装 Nginx (可选，如果你想在 Docker 外使用)
echo "7. 安装 Nginx (可选)..."
read -p "是否安装 Nginx？(y/n): " install_nginx
if [ "$install_nginx" = "y" ]; then
    sudo apt-get install -y nginx
    sudo systemctl enable nginx
    echo "Nginx 安装完成"
fi

# 安装 Node.js (可选，用于本地开发)
echo "8. 安装 Node.js (可选)..."
read -p "是否安装 Node.js？(y/n): " install_node
if [ "$install_node" = "y" ]; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "Node.js 安装完成"
fi

# 配置 swap (对于低内存服务器)
echo "9. 配置 Swap..."
if [ ! -f /swapfile ]; then
    read -p "是否配置 2GB Swap？(推荐用于 4GB 内存以下的服务器) (y/n): " setup_swap
    if [ "$setup_swap" = "y" ]; then
        sudo fallocate -l 2G /swapfile
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
        echo "Swap 配置完成"
    fi
else
    echo "Swap 已配置"
fi

# 设置系统监控
echo "10. 安装系统监控工具..."
sudo apt-get install -y netdata
sudo systemctl enable netdata
sudo systemctl start netdata
echo "Netdata 监控已安装，访问 http://your-server-ip:19999"

echo ""
echo "==============================================="
echo "   服务器初始化完成！"
echo "==============================================="
echo ""
echo "下一步操作："
echo "1. 退出并重新登录以使 Docker 权限生效"
echo "2. 将项目文件上传到 ~/map-delivery 目录"
echo "3. 配置 .env 文件"
echo "4. 运行 docker-compose up -d 启动应用"
echo ""
echo "查看 Docker 状态: docker ps"
echo "查看日志: docker-compose logs -f"
echo ""