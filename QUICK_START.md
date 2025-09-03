# 🚀 加拿大快递配送系统 - 快速启动指南

## 系统要求

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **PostgreSQL**: >= 14.0 (用于后端数据存储)
- **Redis**: >= 6.0 (可选，用于缓存)
- **内存**: >= 4GB
- **磁盘空间**: >= 2GB

## 🎯 一键启动

### macOS/Linux
```bash
./start.sh
```

### Windows
```batch
start.bat
```

## 📦 快速安装

### 1. 克隆项目
```bash
git clone <repository-url>
cd canada-postal-delivery-system
```

### 2. 安装所有依赖
```bash
npm run setup:deps
```

### 3. 配置环境变量
```bash
# 复制环境变量模板
cp backend/.env.example backend/.env

# 编辑配置文件
nano backend/.env  # 或使用你喜欢的编辑器
```

### 4. 初始化数据库
```bash
npm run setup:db
```

### 5. 启动开发服务器
```bash
npm run dev:all
```

## 🎨 访问应用

- **前端应用**: http://localhost:5001
- **后端API**: http://localhost:5050
- **API文档**: http://localhost:5050/api-docs
- **数据库管理**: `npx prisma studio`

## 🛠️ 常用命令

### 开发相关
```bash
# 同时启动前后端
npm run dev:all

# 仅启动前端
npm run dev

# 仅启动后端
npm run dev:backend

# 启动数据库管理界面
cd backend && npx prisma studio
```

### 构建部署
```bash
# 构建生产版本
npm run build:all

# 构建 Electron 桌面应用
npm run build-electron

# Docker 部署
docker-compose up -d
```

### 数据库操作
```bash
# 创建新的迁移
cd backend && npx prisma migrate dev --name <migration-name>

# 重置数据库
cd backend && npx prisma migrate reset

# 生成 Prisma Client
cd backend && npx prisma generate
```

### 测试和清理
```bash
# 运行测试
npm test

# 清理缓存和依赖 (macOS/Linux)
npm run clean

# 清理缓存和依赖 (Windows)
npm run clean:win
```

## 📝 配置说明

### 数据库配置 (backend/.env)
```env
# PostgreSQL 连接字符串
DATABASE_URL="postgresql://username:password@localhost:5432/canada_postal_db"

# Redis 连接（可选）
REDIS_URL="redis://localhost:6379"

# JWT 密钥
JWT_SECRET=your-super-secret-key

# 前端地址（CORS配置）
CORS_ORIGIN=http://localhost:5001
```

### 端口配置
- 前端: 5001 (可在 vite.config.js 中修改)
- 后端: 5050 (可在 backend/.env 中修改)
- PostgreSQL: 5432 (默认)
- Redis: 6379 (默认)

## 🐳 Docker 部署

### 使用 Docker Compose
```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 清理数据
docker-compose down -v
```

### 单独构建镜像
```bash
# 构建前端镜像
docker build -t canada-postal-frontend .

# 构建后端镜像
docker build -t canada-postal-backend ./backend
```

## 🔧 故障排除

### 问题 1: 端口被占用
```bash
# 查找占用端口的进程 (macOS/Linux)
lsof -i :5001
lsof -i :5000

# 查找占用端口的进程 (Windows)
netstat -ano | findstr :5001
netstat -ano | findstr :5000
```

### 问题 2: 数据库连接失败
1. 确保 PostgreSQL 服务正在运行
2. 检查 DATABASE_URL 配置是否正确
3. 确保数据库用户有足够的权限

### 问题 3: 依赖安装失败
```bash
# 清理 npm 缓存
npm cache clean --force

# 删除 node_modules 并重新安装
rm -rf node_modules package-lock.json
npm install
```

### 问题 4: Prisma 相关错误
```bash
# 重新生成 Prisma Client
cd backend
npx prisma generate

# 重置数据库
npx prisma migrate reset
```

## 📊 项目结构

```
canada-postal-delivery-system/
├── src/                    # 前端源代码
│   ├── pages/             # 页面组件
│   ├── components/        # 通用组件
│   ├── layouts/           # 布局组件
│   ├── router/            # 路由配置
│   └── utils/             # 工具函数
├── backend/               # 后端源代码
│   ├── src/              # 源代码
│   │   ├── controllers/  # 控制器
│   │   ├── routes/       # 路由
│   │   ├── services/     # 业务逻辑
│   │   └── middleware/   # 中间件
│   └── prisma/           # 数据库模型
├── public/               # 静态资源
├── dist/                 # 前端构建输出
├── start.sh             # macOS/Linux 启动脚本
├── start.bat            # Windows 启动脚本
└── docker-compose.yml   # Docker 配置
```

## 🌟 功能特性

- ✅ 区域管理：创建和管理配送区域
- ✅ FSA配置：分配和管理FSA（前向分拣区域）
- ✅ 价格设置：配置区域价格和重量区间
- ✅ 邮编管理：导入和管理邮政编码
- ✅ 数据大屏：实时展示配送数据
- ✅ 地图可视化：交互式地图展示
- ✅ 批量操作：支持批量导入导出
- ✅ 用户认证：JWT安全认证（开发中）

## 📚 相关文档

- [API文档](http://localhost:5050/api-docs)
- [数据库模型](./backend/prisma/schema.prisma)
- [环境配置](./backend/.env.example)
- [部署指南](./DEPLOYMENT.md)

## 🤝 获取帮助

如果遇到问题，请：
1. 查看 [故障排除](#-故障排除) 部分
2. 运行健康检查：`./start.sh` 选择选项 8
3. 查看日志文件：`backend/logs/`
4. 提交 Issue 到项目仓库

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

---

**快速开始**: 运行 `./start.sh` (macOS/Linux) 或 `start.bat` (Windows)，选择选项 1 即可启动完整的开发环境！