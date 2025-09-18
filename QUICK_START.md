# 快速开始部署

## 在服务器上执行以下命令

### 1. 安装 Docker（如果还没安装）
```bash
curl -fsSL https://get.docker.com | sh
```

### 2. 创建部署目录
```bash
mkdir -p ~/map-delivery
cd ~/map-delivery
```

### 3. 登录 GitHub Container Registry
```bash
# 使用您的 GitHub 用户名和 Personal Access Token
echo YOUR_GITHUB_PAT | docker login ghcr.io -u davidliux --password-stdin
```

### 4. 创建环境配置文件
```bash
cat > .env << 'EOF'
GITHUB_REPOSITORY=davidliux/canada-map
NODE_ENV=production
PORT=5050
DATABASE_URL=postgresql://mapuser:password@postgres:5432/mapdb
DB_NAME=mapdb
DB_USER=mapuser
DB_PASSWORD=your_db_password
JWT_SECRET=your-jwt-secret-$(date +%s)
CORS_ORIGIN=http://114.215.166.34
REDIS_PASSWORD=redis_password_$(date +%s)
EOF
```

### 5. 创建 docker-compose.yml
```bash
cat > docker-compose.yml << 'EOF'
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
EOF
```

### 6. 拉取并启动服务
```bash
# 拉取最新镜像
docker pull ghcr.io/davidliux/canada-map-frontend:latest
docker pull ghcr.io/davidliux/canada-map-backend:latest

# 启动服务
docker-compose up -d

# 查看状态
docker-compose ps
```

### 7. 验证部署
```bash
# 测试前端
curl http://localhost

# 测试后端
curl http://localhost:5050/health

# 查看日志
docker-compose logs --tail=50
```

## 故障排查

如果遇到问题，检查：
```bash
# 查看详细日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 完全重新部署
docker-compose down
docker-compose pull
docker-compose up -d
```

## 通过 GitHub Actions 自动部署

推送代码到 main 分支即可自动部署：
```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

然后访问 https://github.com/davidliux/Canada-map/actions 查看部署进度。