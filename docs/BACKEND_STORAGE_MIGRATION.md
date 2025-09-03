# 配送区域管理 - 后端数据库存储迁移指南

## 概述

本指南说明如何将配送区域管理系统从浏览器本地存储（localStorage）迁移到后端数据库（PostgreSQL）存储。

## 系统架构变化

### 之前的架构
- 数据存储在浏览器的 localStorage 中
- 每个用户的数据相互独立
- 无法跨设备同步
- 数据容量限制（约 5-10MB）

### 新的架构
- 数据存储在 PostgreSQL 数据库中
- 集中式数据管理
- 支持多用户协作
- 支持跨设备同步
- 无存储容量限制
- 本地缓存提升性能

## 快速开始

### 1. 环境准备

#### 安装 PostgreSQL
```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# 下载安装程序: https://www.postgresql.org/download/windows/
```

#### 创建数据库
```bash
# 登录 PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE canada_postal_delivery;

# 创建用户（可选）
CREATE USER postal_admin WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE canada_postal_delivery TO postal_admin;

# 退出
\q
```

### 2. 配置后端服务

#### 配置环境变量
```bash
cd backend
cp .env.example .env
```

编辑 `backend/.env` 文件：
```env
# 数据库连接
DATABASE_URL="postgresql://postal_admin:your_password@localhost:5432/canada_postal_delivery"

# 服务器配置
PORT=5050
NODE_ENV=development

# CORS 配置（允许前端访问）
CORS_ORIGIN=http://localhost:3001,http://localhost:3000

# JWT 密钥（用于认证）
JWT_SECRET=your_jwt_secret_key_here

# Redis 配置（可选，用于缓存）
REDIS_URL=redis://localhost:6379
```

#### 初始化数据库
```bash
cd backend

# 安装依赖
npm install

# 生成 Prisma 客户端
npx prisma generate

# 创建数据库表
npx prisma migrate dev --name init

# （可选）填充测试数据
npx prisma db seed
```

### 3. 启动服务

#### 使用提供的启动脚本（推荐）
```bash
# 在项目根目录运行
./start-with-backend.sh
```

这个脚本会自动：
- 检查环境依赖
- 启动后端服务（端口 5050）
- 启动前端服务（端口 3001）
- 创建日志文件
- 显示服务状态

#### 手动启动
```bash
# 启动后端（新终端窗口）
cd backend
npm run dev

# 启动前端（新终端窗口）
npm run dev
```

### 4. 数据迁移

#### 自动迁移（推荐）

在浏览器控制台运行：
```javascript
// 导入迁移工具
import migrationTool from './src/utils/dataMigrationTool';

// 检查是否需要迁移
const check = await migrationTool.checkMigrationNeeded();
console.log('迁移检查结果:', check);

// 执行迁移
if (check.needed) {
  const result = await migrationTool.migrate({
    overwrite: false,  // 不覆盖已存在的数据
    batchSize: 5,      // 每批处理5个区域
    onProgress: (progress) => {
      console.log(`迁移进度: ${progress.percentage}%`);
    }
  });
  
  console.log('迁移结果:', result);
}

// 验证迁移
const verification = await migrationTool.verifyMigration();
console.log('验证结果:', verification);
```

#### 手动迁移

如果自动迁移失败，可以手动导出和导入数据：

1. **导出现有数据**
```javascript
// 在浏览器控制台
const data = localStorage.getItem('unified_region_data');
console.log(data);
// 复制输出的 JSON 数据
```

2. **通过 API 导入**
```bash
# 使用 curl 导入
curl -X POST http://localhost:5050/api/v1/regions/import \
  -H "Content-Type: application/json" \
  -d '{"configData": <粘贴JSON数据>, "overwrite": false}'
```

## API 使用说明

### 基础配置

前端已配置好 API 客户端，位于 `src/utils/apiClient.js`：
```javascript
// API 基础 URL
const base = process.env.VITE_API_BASE_URL || 'http://localhost:5050/api/v1';
```

### 主要 API 端点

#### 区域管理
- `GET /api/v1/regions` - 获取所有区域
- `GET /api/v1/regions/:id` - 获取单个区域
- `POST /api/v1/regions` - 创建新区域
- `PUT /api/v1/regions/:id` - 更新区域
- `DELETE /api/v1/regions/:id` - 删除区域

#### 邮编管理
- `GET /api/v1/regions/:id/postal-codes` - 获取区域邮编
- `POST /api/v1/regions/:id/assign-fsas` - 分配FSA到区域
- `POST /api/v1/regions/:id/remove-fsas` - 从区域移除FSA

#### 价格配置
- `GET /api/v1/regions/:id/prices` - 获取价格配置
- `POST /api/v1/regions/:id/prices` - 更新价格配置

#### 数据导入导出
- `POST /api/v1/regions/export` - 导出配置
- `POST /api/v1/regions/import` - 导入配置

## 前端集成

### 使用新的存储服务

新的存储服务提供了与后端同步的功能：

```javascript
import storageService from './src/services/storageService';

// 获取所有区域（自动处理缓存）
const regions = await storageService.getAllRegions();

// 更新区域（自动同步到后端）
await storageService.updateRegion(regionId, updateData);

// 订阅数据更新
const unsubscribe = storageService.subscribe((event) => {
  console.log('数据更新:', event);
});
```

### 向后兼容

为了支持现有代码，提供了兼容层：

```javascript
import compatLayer from './src/utils/unifiedStorageCompat';

// 初始化兼容层（应用启动时调用一次）
await compatLayer.init();

// 使用同步风格的 API（立即返回缓存数据）
const regions = compatLayer.getAllRegionConfigs();
const region = compatLayer.getRegionConfig(regionId);
```

## 故障排除

### 常见问题

#### 1. 数据库连接失败
- 检查 PostgreSQL 是否运行：`pg_isready`
- 检查连接字符串是否正确
- 确认数据库和用户是否创建

#### 2. API 请求失败
- 检查后端服务是否运行：`curl http://localhost:5050/api/v1/health`
- 查看后端日志：`tail -f logs/backend.log`
- 检查 CORS 配置

#### 3. 数据不同步
- 检查网络连接
- 查看浏览器控制台错误
- 确认 API 端点配置正确

#### 4. 迁移失败
- 检查本地数据格式
- 尝试分批迁移
- 使用手动导出/导入

### 日志位置

- 前端日志：`logs/frontend.log`
- 后端日志：`logs/backend.log`
- 数据库日志：查看 PostgreSQL 配置

### 数据备份

#### 备份数据库
```bash
pg_dump -U postgres canada_postal_delivery > backup.sql
```

#### 恢复数据库
```bash
psql -U postgres canada_postal_delivery < backup.sql
```

## 性能优化

### 1. 启用 Redis 缓存
```bash
# 安装 Redis
brew install redis  # macOS
sudo apt install redis-server  # Ubuntu

# 启动 Redis
redis-server
```

配置 `.env`：
```env
REDIS_URL=redis://localhost:6379
```

### 2. 数据库索引
已自动创建的索引：
- 区域 ID 主键索引
- FSA 代码索引
- 激活状态索引

### 3. 前端缓存策略
- 本地缓存热点数据
- 5秒自动同步间隔
- 乐观更新提升响应速度

## 安全建议

1. **生产环境配置**
   - 使用强密码
   - 启用 HTTPS
   - 配置防火墙规则
   - 定期备份数据

2. **认证和授权**
   - 实施用户认证
   - 基于角色的访问控制
   - API 速率限制

3. **数据验证**
   - 前端输入验证
   - 后端数据验证
   - SQL 注入防护

## 监控和维护

### 健康检查
```bash
# API 健康检查
curl http://localhost:5050/api/v1/health

# 数据库连接检查
npx prisma db push --skip-generate
```

### 性能监控
- 使用 Morgan 记录 API 请求
- 监控数据库查询性能
- 跟踪同步队列长度

### 定期维护
- 清理过期日志
- 优化数据库索引
- 更新依赖包

## 联系支持

如有问题，请联系技术支持团队或查看项目文档。

---

最后更新：2024年1月
版本：2.0.0