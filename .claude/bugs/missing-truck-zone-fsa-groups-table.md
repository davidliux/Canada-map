# Bug 分析报告：truck_zone_fsa_groups 表缺失导致 API 500 错误

## 摘要
前端组件 `ConfigTargetSelector.jsx` 调用 `/api/v1/truck-delivery/fsa-groups` API 时返回 500 内部服务器错误。根本原因是后端 API 查询了不存在的数据库表 `truck_zone_fsa_groups`。

## 问题详情

### 错误表现
- **错误消息**: GET http://localhost:5001/api/v1/truck-delivery/fsa-groups?city_id=[各种ID] 返回 500 错误
- **影响范围**: 所有城市的 FSA 分组加载都失败
- **受影响组件**: `src/components/pricing/ConfigTargetSelector.jsx`
- **触发条件**: 组件挂载时自动触发 `loadAllData()` 函数

### 调查过程

#### 1. 前端代码检查
- 文件：`src/components/pricing/ConfigTargetSelector.jsx`
- 第 65 行：`await fetch(\`/api/v1/truck-delivery/fsa-groups?city_id=\${city.id}\`)`
- 该请求在组件加载时对每个城市都会执行一次

#### 2. 后端路由检查
- 文件：`backend/src/routes/truckDelivery.js`
- 第 663-697 行：定义了 `/fsa-groups` 路由
- SQL 查询引用了三个表：
  - `truck_zone_fsa_groups` (主表)
  - `truck_delivery_zones`
  - `truck_delivery_cities`

#### 3. 数据库架构检查
- 检查了 `backend/prisma/schema.prisma` - 未发现 `truck_zone_fsa_groups` 模型
- 搜索了所有 SQL 迁移文件 - 未找到创建 `truck_zone_fsa_groups` 表的语句
- 在 `backend/migrations/create_truck_pricing_configs_v2.sql` 中发现了对该表的引用（第 330 行），但没有创建语句

## 根本原因
数据库中缺少 `truck_zone_fsa_groups` 表。该表在以下位置被引用：
1. `backend/src/routes/truckDelivery.js` - API 查询
2. `backend/migrations/create_truck_pricing_configs_v2.sql` - 视图定义

但没有找到创建该表的 SQL 语句或 Prisma 模型定义。

## 解决方案

### 方案 1：创建缺失的数据表（推荐）
创建 `truck_zone_fsa_groups` 表，包含必要的字段：

```sql
CREATE TABLE IF NOT EXISTS truck_zone_fsa_groups (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  city_id VARCHAR NOT NULL,
  zone_id VARCHAR NOT NULL,
  fsa_codes TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (city_id) REFERENCES truck_delivery_cities(id),
  FOREIGN KEY (zone_id) REFERENCES truck_delivery_zones(id)
);
```

### 方案 2：修改 API 返回空数据
临时解决方案，在 API 中添加错误处理，当表不存在时返回空数组：

```javascript
router.get('/fsa-groups', async (req, res) => {
  try {
    // 现有查询代码
  } catch (error) {
    if (error.code === '42P01') { // PostgreSQL 表不存在错误码
      res.json({
        success: true,
        data: [],
        count: 0
      });
    } else {
      // 原有错误处理
    }
  }
});
```

### 方案 3：完全移除该功能
如果 FSA 分组功能不再需要，可以：
1. 从前端移除相关 API 调用
2. 删除后端的 `/fsa-groups` 路由
3. 更新相关组件，不再依赖 FSA 分组数据

## 影响范围
- **前端组件**：`ConfigTargetSelector.jsx` 无法加载 FSA 分组数据
- **功能影响**：定价配置选择器无法显示分组级别的配置选项
- **用户体验**：用户无法选择分组级别进行定价配置

## 建议的修复步骤
1. **确认需求**：确定是否需要 FSA 分组功能
2. **如果需要**：
   - 创建数据库迁移脚本，添加 `truck_zone_fsa_groups` 表
   - 执行迁移脚本
   - 验证 API 正常工作
3. **如果不需要**：
   - 从前端移除相关代码
   - 删除后端路由
   - 清理相关引用

## 测试验证
修复后需要验证：
1. API `/api/v1/truck-delivery/fsa-groups` 返回正确数据
2. `ConfigTargetSelector` 组件正常加载
3. 定价配置功能正常工作

## 相关文件
- `src/components/pricing/ConfigTargetSelector.jsx`
- `backend/src/routes/truckDelivery.js`
- `backend/migrations/create_truck_pricing_configs_v2.sql`

## 优先级
**高** - 该错误阻止了定价配置功能的正常使用