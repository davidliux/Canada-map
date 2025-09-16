# Bug Analysis Report: 板数定价保存失败

## 执行摘要
- **问题**: 板数定价数据保存失败，刷新后数据丢失
- **数据库表**: `skid_pricing` (PostgreSQL: canada_postal_system)
- **根本原因**: 数据库唯一约束冲突导致事务回滚
- **影响**: 用户无法保存板数定价配置

## 问题重现

### 现象描述
1. 用户在前端输入板数定价数据
2. 点击保存按钮
3. 界面显示保存成功（假象）
4. 刷新页面后，数据未保存或显示不正确

### 当前数据状态
```sql
-- Calgary城市当前只有1条活跃数据
city_id | zone_id | skid_count | price    | is_active
--------|---------|------------|----------|----------
calgary | 区域1   | 1          | 1000.00  | true
```

## 技术调查

### 数据流程
```
前端(SkidPricingMatrix)
  → POST /api/v1/truck-delivery/skid-pricing/{cityId}
  → 后端事务处理：
    1. UPDATE设置旧数据 is_active = false
    2. INSERT新数据
  → PostgreSQL数据库 (skid_pricing表)
```

### 数据库表结构
```sql
表名: skid_pricing
唯一约束: (city_id, zone_id, skid_count)
字段:
- id: UUID主键
- city_id: VARCHAR(50)
- zone_id: VARCHAR(50)
- skid_count: INTEGER
- price: DECIMAL(10,2)
- is_active: BOOLEAN
```

## 根本原因分析

### 问题1: 唯一约束冲突
- **原因**: 事务中UPDATE和INSERT操作存在竞态条件
- **详情**: 当旧数据的is_active更新失败或不完整时，新数据插入会违反唯一约束
- **错误信息**: "Unique constraint failed on the fields: (city_id, zone_id, skid_count)"

### 问题2: 事务回滚导致数据不一致
- 后端使用事务处理，任何错误都会导致整个事务回滚
- 前端没有正确处理错误响应，显示成功但实际失败

### 测试验证
```bash
# 直接API测试结果
POST /api/v1/truck-delivery/skid-pricing/calgary
响应: {"success":false, "error":"Unique constraint failed..."}
```

## 影响评估

### 业务影响
- 用户无法保存板数定价配置
- 数据看似保存但实际丢失，影响用户信任

### 技术影响
- 数据库中存在不一致状态（部分数据is_active=false，部分为true）
- 事务失败但前端未能正确反馈

## 解决方案

### 立即修复
1. **修改后端事务逻辑**
   ```javascript
   // 先删除旧数据，再插入新数据
   await tx.skidPricing.deleteMany({
     where: { cityId: cityId }
   });
   // 然后插入新数据
   await tx.skidPricing.createMany({
     data: dataToInsert
   });
   ```

2. **改进唯一约束处理**
   - 使用 upsert 操作替代 delete+insert
   - 或在插入前先检查并删除冲突记录

3. **前端错误处理**
   - 正确显示保存失败的错误信息
   - 添加重试机制

### 长期改进
1. 添加数据库级别的触发器确保数据一致性
2. 实现乐观锁机制避免并发冲突
3. 添加数据验证和完整性检查

## 测试计划

### 单元测试
- 测试唯一约束冲突场景
- 测试事务回滚机制

### 集成测试
- 模拟并发保存操作
- 验证数据持久化

### 用户验收测试
- 保存各种板数配置
- 验证刷新后数据正确显示

## 风险评估

### 修复风险
- 低风险：修改仅影响板数定价模块
- 数据迁移：需要清理现有冲突数据

### 未修复风险
- 高风险：用户无法使用板数定价功能
- 数据丢失风险持续存在

## 建议

### 立即行动
1. 清理数据库中的冲突数据
2. 部署修复后的后端代码
3. 验证前端错误处理

### 预防措施
1. 添加数据库约束检查的单元测试
2. 实施代码审查流程
3. 添加生产环境监控告警