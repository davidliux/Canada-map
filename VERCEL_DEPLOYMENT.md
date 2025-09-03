# Vercel 部署指南 - 带数据库支持

## 🗄️ 数据库配置选项

### 选项 1: 使用 Vercel Postgres（推荐）

1. **在 Vercel Dashboard 创建数据库**
   - 进入你的项目 Dashboard
   - 点击 "Storage" 标签
   - 选择 "Create Database"
   - 选择 "Postgres"
   - 按提示创建数据库

2. **自动连接**
   - Vercel 会自动添加以下环境变量：
     - `POSTGRES_URL` - 连接字符串
     - `POSTGRES_PRISMA_URL` - Prisma 专用连接字符串
     - `POSTGRES_URL_NON_POOLING` - 非连接池 URL

3. **更新 Prisma 配置**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("POSTGRES_PRISMA_URL") // 使用 Prisma 专用 URL
   }
   ```

### 选项 2: 使用 Supabase（免费套餐）

1. **创建 Supabase 项目**
   - 访问 [Supabase](https://supabase.com)
   - 创建新项目
   - 获取数据库连接字符串

2. **在 Vercel 添加环境变量**
   ```
   DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require
   ```

### 选项 3: 使用 Neon（免费套餐）

1. **创建 Neon 数据库**
   - 访问 [Neon](https://neon.tech)
   - 创建项目
   - 获取连接字符串

2. **配置环境变量**
   ```
   DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require
   ```

## 📦 部署步骤

### 1. 准备代码

```bash
# 提交所有更改
git add .
git commit -m "配置 Vercel 部署与数据库支持"
git push origin main
```

### 2. 在 Vercel 部署

1. **导入项目**
   - 登录 [Vercel](https://vercel.com)
   - 点击 "New Project"
   - 导入 GitHub 仓库

2. **配置构建设置**
   - Framework Preset: `Vite`
   - Build Command: `npm run build && cd backend && npm install && npx prisma generate`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **配置环境变量**
   
   在 Vercel Dashboard > Settings > Environment Variables 添加：

   **必需变量：**
   ```
   DATABASE_URL = [你的数据库连接字符串]
   NODE_ENV = production
   ```

   **可选变量：**
   ```
   CORS_ORIGIN = https://your-app.vercel.app
   JWT_SECRET = [生成一个安全的密钥]
   LOG_LEVEL = info
   ```

4. **部署**
   - 点击 "Deploy"
   - 等待部署完成

### 3. 初始化数据库

部署成功后，需要运行数据库迁移：

#### 方法 1: 使用 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 运行生产环境迁移
vercel env pull .env.local
cd backend
npx prisma migrate deploy
npx prisma db seed  # 如果有种子数据
```

#### 方法 2: 使用 GitHub Actions

创建 `.github/workflows/migrate.yml`：

```yaml
name: Run Migrations

on:
  push:
    branches: [main]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: |
          cd backend
          npm install
          npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## 🔧 项目结构说明

```
/
├── dist/                    # 前端构建输出
├── backend/
│   ├── api/
│   │   └── index.js        # Vercel Functions 入口
│   ├── prisma/
│   │   ├── schema.prisma   # 数据库模型
│   │   └── migrations/     # 数据库迁移文件
│   ├── src/
│   │   ├── app.js         # Express 应用
│   │   └── server.js      # 本地开发服务器
│   └── package.json
├── src/                    # 前端源码
├── vercel.json            # Vercel 配置
└── package.json           # 项目依赖
```

## 🌐 API 路由

部署后，API 将通过以下路径访问：

- 健康检查: `https://your-app.vercel.app/api/health`
- 获取区域: `https://your-app.vercel.app/api/regions`
- 获取重量区间: `https://your-app.vercel.app/api/regions/:id/weight-ranges`
- 计算价格: `https://your-app.vercel.app/api/calculate-price`

## 🐛 故障排除

### 数据库连接失败

1. 检查环境变量是否正确设置
2. 确认数据库 SSL 设置
3. 检查 IP 白名单（某些数据库服务需要）

### 构建失败

1. 检查 Node.js 版本（需要 >= 16）
2. 确认所有依赖都已安装
3. 查看 Vercel 构建日志

### API 404 错误

1. 检查 `vercel.json` 中的 rewrites 配置
2. 确认 `backend/api/index.js` 文件存在
3. 验证 API 路径是否正确

## 📊 监控和日志

- **Vercel Dashboard**: 查看部署状态、函数日志
- **Vercel Analytics**: 监控性能指标
- **数据库监控**: 使用数据库服务提供的监控工具

## 🔄 更新部署

每次推送到 `main` 分支都会自动触发重新部署：

```bash
git add .
git commit -m "更新功能"
git push origin main
```

## 💡 最佳实践

1. **环境变量管理**
   - 使用 `.env.example` 记录所需变量
   - 不要提交 `.env` 文件到仓库
   - 为不同环境设置不同的变量

2. **数据库优化**
   - 使用连接池
   - 添加适当的索引
   - 定期备份数据

3. **性能优化**
   - 启用 CDN
   - 使用缓存（Redis/Vercel KV）
   - 优化数据库查询

4. **安全考虑**
   - 使用 HTTPS
   - 设置 CORS 正确
   - 实施速率限制
   - 验证用户输入

## 📞 支持

如有问题，请查看：
- [Vercel 文档](https://vercel.com/docs)
- [Prisma 文档](https://www.prisma.io/docs)
- [项目 Issues](https://github.com/your-username/your-repo/issues)