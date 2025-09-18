# 手动部署指南

## 步骤 1: 服务器准备

SSH 到您的服务器：
```bash
ssh root@114.215.166.34
```

## 步骤 2: 运行快速部署脚本

```bash
# 创建部署目录
mkdir -p ~/map-delivery
cd ~/map-delivery

# 创建快速部署脚本
cat > quick-deploy.sh << 'EOF'
[将 scripts/quick-deploy.sh 内容复制到这里]
EOF

# 执行脚本
chmod +x quick-deploy.sh
./quick-deploy.sh
```

## 步骤 3: 配置 GitHub Container Registry

1. 创建 GitHub Personal Access Token:
   - 访问: https://github.com/settings/tokens
   - 点击 "Generate new token (classic)"
   - 选择权限: `read:packages` 和 `write:packages`
   - 复制生成的 token

2. 在服务器上登录 GHCR：
```bash
echo YOUR_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

## 步骤 4: 配置环境变量

编辑 `.env` 文件：
```bash
nano ~/map-delivery/.env
```

修改以下配置：
```env
GITHUB_REPOSITORY=your-github-username/your-repo-name
DATABASE_URL=你的数据库连接串
JWT_SECRET=生成一个随机密钥
CORS_ORIGIN=http://114.215.166.34
```

## 步骤 5: 复制必要的配置文件

从本地复制配置文件到服务器：
```bash
# 在本地执行
scp docker-compose.simple.yml root@114.215.166.34:~/map-delivery/docker-compose.yml
scp nginx.docker.conf root@114.215.166.34:~/map-delivery/
```

## 步骤 6: 首次部署

### 方法 A: 通过 GitHub Actions 自动部署

```bash
# 在本地执行
git add .
git commit -m "feat: 初始化 GHCR 部署"
git push origin main
```

然后在 GitHub Actions 页面查看部署进度。

### 方法 B: 手动拉取和启动

在服务器上执行：
```bash
cd ~/map-delivery

# 设置仓库名称（替换为实际值）
export GITHUB_REPOSITORY=your-username/your-repo

# 拉取镜像
docker pull ghcr.io/${GITHUB_REPOSITORY}-frontend:latest
docker pull ghcr.io/${GITHUB_REPOSITORY}-backend:latest

# 启动服务
docker-compose up -d

# 查看状态
docker-compose ps
docker-compose logs -f
```

## 步骤 7: 验证部署

```bash
# 检查前端
curl http://114.215.166.34

# 检查后端健康状态
curl http://114.215.166.34:5050/health

# 查看容器状态
docker ps

# 查看日志
docker-compose logs --tail=50
```

## 常见问题

### 1. Docker 未安装
```bash
curl -fsSL https://get.docker.com | sh
```

### 2. 端口被占用
```bash
# 查看端口占用
netstat -tulpn | grep -E ":(80|5050)"

# 停止占用的服务
systemctl stop nginx  # 如果是 nginx 占用
```

### 3. 镜像拉取失败
确保已正确登录 GHCR：
```bash
docker logout ghcr.io
echo YOUR_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

### 4. 容器启动失败
查看详细日志：
```bash
docker-compose logs backend
docker-compose logs frontend
```

## 更新部署

当有新代码推送后，GitHub Actions 会自动部署。手动更新：

```bash
cd ~/map-delivery

# 拉取最新镜像
docker-compose pull

# 重启服务
docker-compose down
docker-compose up -d

# 清理旧镜像
docker image prune -f
```

## 监控

```bash
# 实时查看日志
docker-compose logs -f

# 查看资源使用
docker stats

# 检查健康状态
docker ps --format "table {{.Names}}\t{{.Status}}"
```