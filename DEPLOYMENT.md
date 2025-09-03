# 部署指南 - Vercel + Supabase

## 架构说明

本项目支持三种部署模式：

1. **纯前端模式**：仅使用 localStorage，无需后端
2. **Serverless 模式**：使用 Vercel Functions + Supabase
3. **完整模式**：本地开发，使用 Express + PostgreSQL

## Vercel 部署步骤

### 1. 准备 Supabase（可选）

如果需要数据持久化和多用户共享，配置 Supabase：

1. 注册 [Supabase](https://supabase.com) 账号
2. 创建新项目
3. 在 SQL Editor 中执行以下脚本创建表：

```sql
-- 创建区域表
CREATE TABLE delivery_regions (
  id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  fsa JSONB DEFAULT '[]',
  postal_codes JSONB DEFAULT '[]',
  weight_ranges JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_delivery_regions_updated_at
BEFORE UPDATE ON delivery_regions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- 创建索引以提高查询性能
CREATE INDEX idx_delivery_regions_is_active ON delivery_regions(is_active);
CREATE INDEX idx_delivery_regions_name ON delivery_regions(name);
```

4. 获取项目配置：
   - 进入 Settings > API
   - 复制 `Project URL` (SUPABASE_URL)
   - 复制 `anon public` key (SUPABASE_ANON_KEY)
   - 复制 `service_role` key (SUPABASE_SERVICE_KEY) - 仅服务端使用

### 2. 部署到 Vercel

#### 方式一：通过 GitHub（推荐）

1. 将代码推送到 GitHub
2. 访问 [Vercel](https://vercel.com)
3. 点击 "Import Project"
4. 选择您的 GitHub 仓库
5. 配置环境变量（见下方）
6. 点击 "Deploy"

#### 方式二：使用 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel

# 生产部署
vercel --prod
```

### 3. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

#### 必需的环境变量

```bash
# API 模式
VITE_API_MODE=serverless
```

#### Supabase 配置（可选）

```bash
# Supabase URL 和密钥
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_KEY=your-supabase-service-key

# 或使用公开密钥（前端可访问）
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

#### 纯前端模式（无需 Supabase）

如果不使用 Supabase，设置：

```bash
VITE_API_MODE=disabled
```

### 4. 验证部署

部署完成后，访问您的 Vercel URL：

- 检查地图是否正常加载
- 测试区域管理功能
- 验证数据保存和读取

## 本地开发

### 1. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖（可选）
cd backend && npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```bash
# 使用本地后端
VITE_API_MODE=local
VITE_API_BASE_URL=http://localhost:5050/api/v1

# 或使用 Serverless（需要配置 Supabase）
# VITE_API_MODE=serverless
# VITE_SUPABASE_URL=your-supabase-url
# VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. 启动开发服务器

```bash
# 仅前端
npm run dev

# 前后端一起（需要 PostgreSQL）
npm run dev:all
```

## API 模式说明

### disabled 模式
- 完全不使用后端 API
- 数据保存在浏览器 localStorage
- 适合单用户使用
- 无需任何后端配置

### serverless 模式
- 使用 Vercel Serverless Functions
- 可选配置 Supabase 数据库
- 支持多用户数据共享
- 自动扩展，无需维护服务器

### local 模式
- 使用本地 Express 服务器
- 需要 PostgreSQL 数据库
- 适合开发和测试
- 完整的后端功能

## 故障排除

### 问题：API 调用失败

检查：
1. 环境变量是否正确配置
2. Supabase 项目是否正常运行
3. API 密钥是否正确

### 问题：数据不持久

检查：
1. 是否配置了 Supabase
2. API 模式是否为 `serverless`
3. 浏览器 localStorage 是否被清理

### 问题：地图不显示

检查：
1. 网络连接是否正常
2. 地图瓦片服务是否可访问
3. 浏览器控制台是否有错误

## 性能优化建议

1. **启用 Vercel Edge Network**：自动 CDN 加速
2. **配置缓存**：合理设置 API 缓存时间
3. **优化图片**：使用 WebP 格式
4. **代码分割**：按需加载组件

## 安全建议

1. **不要暴露 service_role key**：仅在服务端使用
2. **配置 RLS**：在 Supabase 中启用行级安全
3. **限制 API 访问**：配置 CORS 和速率限制
4. **定期备份数据**：导出重要配置

## 监控和日志

1. **Vercel Analytics**：查看访问统计
2. **Vercel Logs**：查看函数执行日志
3. **Supabase Dashboard**：监控数据库性能
4. **浏览器 DevTools**：调试前端问题

## 联系支持

如有问题，请查看：
- [Vercel 文档](https://vercel.com/docs)
- [Supabase 文档](https://supabase.com/docs)
- 项目 Issues 页面