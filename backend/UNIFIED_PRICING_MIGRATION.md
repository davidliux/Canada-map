# 统一定价API数据库迁移指南

## 概述

本迁移实现任务 1.1: "更新数据库表结构"，为统一定价API添加必要的数据库支持。

## 迁移内容

### 1. 更新 `truck_pricing_configs` 表
- ✅ 添加 `effective_date` (TIMESTAMP) - 配置生效日期
- ✅ 添加 `expiry_date` (TIMESTAMP) - 配置过期日期
- ✅ 修改 `version` 字段类型为 VARCHAR(20) - 支持语义化版本

### 2. 新增 `pricing_query_logs` 表
用于跟踪API查询和性能监控：
- `id` (UUID) - 主键
- `request_params` (JSONB) - 请求参数
- `response_data` (JSONB) - 响应数据
- `query_time_ms` (INTEGER) - 查询执行时间
- `created_at` (TIMESTAMP) - 创建时间
- `client_ip` (VARCHAR(45)) - 客户端IP
- `user_agent` (TEXT) - 用户代理

### 3. 新增 `pricing_cache` 表
用于缓存机制，提高查询性能：
- `cache_key` (VARCHAR(255)) - 缓存键名（主键）
- `cache_value` (JSONB) - 缓存值
- `expires_at` (TIMESTAMP) - 过期时间
- `created_at` (TIMESTAMP) - 创建时间

### 4. 性能索引
- `idx_configs_effective` - truck_pricing_configs(effective_date, expiry_date)
- `idx_configs_composite` - truck_pricing_configs(level, target_id, is_active, priority DESC)
- `idx_query_logs_time` - pricing_query_logs(created_at DESC)
- `idx_cache_expires` - pricing_cache(expires_at)

## 执行步骤

### 前置条件
1. 确保数据库连接配置正确
2. 设置环境变量 `DATABASE_URL`

```bash
export DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
```

### 执行迁移

#### 方法 1: 使用自动化脚本（推荐）
```bash
cd backend
node run-unified-pricing-migration.js
```

#### 方法 2: 手动执行SQL
```bash
cd backend
psql $DATABASE_URL -f prisma/migrations/add_unified_pricing_tables.sql
```

#### 方法 3: 使用Prisma
```bash
cd backend
npx prisma db push
```

### 验证迁移

执行测试脚本验证迁移结果：
```bash
cd backend
node test-unified-pricing-schema.js
```

## 迁移后验证清单

- [ ] `truck_pricing_configs` 表包含新的版本控制字段
- [ ] `pricing_query_logs` 表创建成功
- [ ] `pricing_cache` 表创建成功
- [ ] 所有必需的索引已创建
- [ ] 现有数据完整性保持不变
- [ ] 基本CRUD操作正常工作

## 回滚方案

如需回滚迁移，执行以下SQL：

```sql
-- 删除新增的表
DROP TABLE IF EXISTS pricing_cache;
DROP TABLE IF EXISTS pricing_query_logs;

-- 回滚 truck_pricing_configs 表的修改
ALTER TABLE truck_pricing_configs
DROP COLUMN IF EXISTS effective_date,
DROP COLUMN IF EXISTS expiry_date;

ALTER TABLE truck_pricing_configs
ALTER COLUMN version TYPE INTEGER USING version::INTEGER;
```

## 性能考虑

1. **索引优化**: 新增的复合索引将显著提高查询性能
2. **缓存机制**: `pricing_cache` 表支持查询结果缓存
3. **日志分析**: `pricing_query_logs` 表支持性能监控和分析

## 向后兼容性

- ✅ 现有代码无需修改
- ✅ 现有数据完全保留
- ✅ 新字段设置了合理的默认值

## 技术规格

- **数据库**: PostgreSQL + PostGIS
- **ORM**: Prisma
- **迁移方式**: 增量式 (Additive)
- **事务安全**: 所有操作在事务中执行

## 相关文件

- `prisma/migrations/add_unified_pricing_tables.sql` - 迁移SQL脚本
- `run-unified-pricing-migration.js` - 自动化迁移脚本
- `test-unified-pricing-schema.js` - 测试验证脚本
- `prisma/schema.prisma` - 更新后的Prisma数据模型

## 联系支持

如遇到问题，请查看日志输出或联系开发团队。