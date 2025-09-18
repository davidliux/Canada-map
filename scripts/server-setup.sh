#!/bin/bash

# 服务器初始化脚本 - 在第一次部署前运行
# 用法: ssh user@server 'bash -s' < server-setup.sh

set -e

echo "🚀 开始服务器初始化..."

# 更新系统包
echo "📦 更新系统包..."
sudo apt-get update
sudo apt-get upgrade -y

# 安装 Docker
if ! command -v docker &> /dev/null; then
    echo "🐋 安装 Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
else
    echo "✅ Docker 已安装"
fi

# 安装 Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "🐋 安装 Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    echo "✅ Docker Compose 已安装"
fi

# 配置 Docker 登录到 GitHub Container Registry
echo "🔐 配置 Docker 登录..."
echo "请在 GitHub 设置中创建一个 Personal Access Token (PAT)，权限包括 read:packages"
echo "然后使用以下命令登录："
echo "echo YOUR_GITHUB_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin"

# 创建应用目录结构
echo "📁 创建目录结构..."
mkdir -p ~/map-delivery/{data,logs/{nginx,backend},ssl,backups}

# 配置防火墙
echo "🔥 配置防火墙..."
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 5050/tcp  # Backend API
sudo ufw --force enable

# 安装 Nginx（作为反向代理备用）
echo "🌐 安装 Nginx（可选）..."
sudo apt-get install -y nginx
sudo systemctl stop nginx  # 停止系统 nginx，使用 Docker 版本

# 创建 SSL 证书目录
echo "🔒 准备 SSL 配置..."
mkdir -p ~/map-delivery/ssl
echo "请将 SSL 证书文件放置到 ~/map-delivery/ssl/ 目录"

# 创建环境变量模板
echo "📝 创建环境变量模板..."
cat > ~/map-delivery/.env.template << 'EOF'
# 生产环境配置
NODE_ENV=production
PORT=5050

# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# JWT 配置
JWT_SECRET=your-jwt-secret-here

# CORS 配置
CORS_ORIGIN=https://yourdomain.com

# Redis 配置（如果需要）
REDIS_URL=redis://localhost:6379

# 邮件配置（如果需要）
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
EOF

# 设置自动备份脚本
echo "💾 创建自动备份脚本..."
cat > ~/map-delivery/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=~/map-delivery/backups
DATE=$(date +%Y%m%d_%H%M%S)

# 备份 Docker 卷
docker run --rm -v map-delivery_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/data_$DATE.tar.gz -C /data .

# 备份数据库（如果使用）
# docker exec map-backend pg_dump -U user dbname > $BACKUP_DIR/db_$DATE.sql

# 清理旧备份（保留最近 7 天）
find $BACKUP_DIR -type f -mtime +7 -delete

echo "备份完成: $DATE"
EOF
chmod +x ~/map-delivery/backup.sh

# 添加 cron 任务（每天凌晨 2 点备份）
echo "⏰ 设置定时备份..."
(crontab -l 2>/dev/null; echo "0 2 * * * ~/map-delivery/backup.sh >> ~/map-delivery/logs/backup.log 2>&1") | crontab -

# 创建监控脚本
echo "📊 创建监控脚本..."
cat > ~/map-delivery/monitor.sh << 'EOF'
#!/bin/bash

# 检查容器状态
check_containers() {
    echo "=== 容器状态 ==="
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# 检查资源使用
check_resources() {
    echo -e "\n=== 资源使用 ==="
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
}

# 检查磁盘空间
check_disk() {
    echo -e "\n=== 磁盘空间 ==="
    df -h | grep -E '^/dev/|Filesystem'
}

# 检查日志大小
check_logs() {
    echo -e "\n=== 日志文件大小 ==="
    du -sh ~/map-delivery/logs/*
}

# 执行所有检查
check_containers
check_resources
check_disk
check_logs
EOF
chmod +x ~/map-delivery/monitor.sh

# 配置日志轮转
echo "📜 配置日志轮转..."
sudo tee /etc/logrotate.d/map-delivery > /dev/null << 'EOF'
/home/*/map-delivery/logs/*/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        docker exec map-frontend nginx -s reload 2>/dev/null || true
        docker exec map-backend kill -USR1 1 2>/dev/null || true
    endscript
}
EOF

# 安装监控工具
echo "📈 安装监控工具..."
sudo apt-get install -y htop iotop nethogs

# 打印系统信息
echo -e "\n✅ 服务器初始化完成！"
echo "===================="
echo "系统信息："
echo "- Docker 版本: $(docker --version)"
echo "- Docker Compose 版本: $(docker-compose --version)"
echo "- 工作目录: ~/map-delivery"
echo ""
echo "下一步操作："
echo "1. 配置 GitHub Container Registry 登录"
echo "2. 复制 .env.template 为 .env 并填写实际配置"
echo "3. 配置 SSL 证书（如果需要 HTTPS）"
echo "4. 在 GitHub 仓库设置 Secrets："
echo "   - SERVER_HOST: 114.215.166.34"
echo "   - SERVER_USER: $(whoami)"
echo "   - SERVER_SSH_KEY: 您的 SSH 私钥"
echo "   - DATABASE_URL: 数据库连接字符串"
echo "   - JWT_SECRET: JWT 密钥"
echo "   - CORS_ORIGIN: 允许的前端域名"
echo ""
echo "监控命令："
echo "- 查看系统状态: ~/map-delivery/monitor.sh"
echo "- 查看容器日志: docker-compose logs -f [service-name]"
echo "- 手动备份: ~/map-delivery/backup.sh"
echo "===================="