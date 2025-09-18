# 部署指南 - GitHub Container Registry CI/CD

## 概述

本项目使用 GitHub Container Registry (GHCR) 和 GitHub Actions 实现自动化 CI/CD 部署。

## 架构

```
GitHub Repository → GitHub Actions → GitHub Container Registry → 服务器
```

## 前置要求

### 1. GitHub 配置

#### 创建 Personal Access Token (PAT)
1. 访问 GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 创建新 token，权限包括：
   - `write:packages` - 推送镜像到 GHCR
   - `read:packages` - 拉取镜像
   - `delete:packages` - 清理旧镜像（可选）

#### 配置 Repository Secrets
在仓库设置中添加以下 Secrets：

```bash
SERVER_HOST=114.215.166.34        # 服务器 IP
SERVER_USER=root                  # 服务器用户名
SERVER_SSH_KEY=<YOUR_SSH_KEY>     # SSH 私钥内容
DATABASE_URL=postgresql://...     # 数据库连接串
JWT_SECRET=<YOUR_SECRET>          # JWT 密钥
CORS_ORIGIN=https://yourdomain.com # 允许的前端域名
DB_PASSWORD=<DB_PASSWORD>         # 数据库密码
REDIS_PASSWORD=<REDIS_PASSWORD>   # Redis 密码
```

### 2. 服务器配置

#### 初始化服务器
```bash
# 在本地执行，初始化远程服务器
ssh root@114.215.166.34 'bash -s' < scripts/server-setup.sh
```

#### 配置 GHCR 登录
```bash
# SSH 到服务器
ssh root@114.215.166.34

# 登录 GHCR
echo YOUR_GITHUB_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

#### 配置环境变量
```bash
cd ~/map-delivery
cp .env.template .env
# 编辑 .env 文件，填入实际配置
nano .env
```

## 部署流程

### 自动部署

推送到 main 分支会自动触发部署：

```bash
git add .
git commit -m "feat: 新功能"
git push origin main
```

### 手动部署

在 GitHub Actions 页面手动触发 workflow：

1. 访问 Actions 页面
2. 选择 "Build and Deploy via GHCR"
3. 点击 "Run workflow"
4. 选择部署环境（production/staging）

## 镜像管理

### 查看镜像

镜像发布在：
- Frontend: `ghcr.io/<your-github-username>/<repo-name>-frontend`
- Backend: `ghcr.io/<your-github-username>/<repo-name>-backend`

### 镜像标签策略

- `latest` - 最新的 main 分支构建
- `main-<sha>` - 特定提交的构建
- `<version>` - 带时间戳的版本号

## 监控和维护

### 查看服务状态

```bash
ssh root@114.215.166.34

# 查看容器状态
cd ~/map-delivery
docker-compose ps

# 查看日志
docker-compose logs -f frontend
docker-compose logs -f backend

# 运行监控脚本
./monitor.sh
```

### 备份

自动备份每天凌晨 2 点执行，手动备份：

```bash
~/map-delivery/backup.sh
```

### 回滚

如果部署失败，Actions 会自动回滚。手动回滚：

```bash
cd ~/map-delivery

# 查看备份
ls -la backups/

# 恢复到指定备份
cp backups/docker-compose.yml.20240318_120000 docker-compose.yml
docker-compose down
docker-compose up -d
```

## SSL/HTTPS 配置

### 使用 Let's Encrypt

```bash
# 安装 certbot
sudo apt-get install certbot

# 获取证书
sudo certbot certonly --standalone -d yourdomain.com

# 复制证书到应用目录
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ~/map-delivery/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ~/map-delivery/ssl/
```

### 更新 Nginx 配置

编辑 `nginx.conf` 添加 SSL 配置：

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # ... 其他配置
}
```

## 故障排查

### 容器无法启动

```bash
# 查看详细日志
docker-compose logs --tail=100

# 检查容器状态
docker ps -a

# 检查网络
docker network ls
```

### 数据库连接失败

```bash
# 测试数据库连接
docker exec -it map-postgres psql -U mapuser -d mapdb

# 检查数据库日志
docker logs map-postgres
```

### 端口占用

```bash
# 查看端口占用
sudo netstat -tulpn | grep -E ":(80|443|5050|5432|6379)"

# 停止占用进程
sudo kill -9 <PID>
```

## 性能优化

### Docker 资源限制

在 `docker-compose.production.yml` 中添加资源限制：

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 日志轮转

确保日志轮转正常工作：

```bash
# 测试日志轮转
sudo logrotate -f /etc/logrotate.d/map-delivery
```

## 安全建议

1. **定期更新**：定期更新 Docker 镜像和系统包
2. **密钥管理**：使用强密码，定期轮换密钥
3. **防火墙**：只开放必要端口
4. **监控**：设置告警和监控
5. **备份**：定期测试备份恢复流程

## 联系方式

如有问题，请联系运维团队或查看项目 Wiki。