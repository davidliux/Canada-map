# Bug分析：定价模式冲突问题

## 问题概述
**Bug类型**: 数据完整性约束缺失
**严重程度**: 高
**影响范围**: 卡车配送定价系统
**报告时间**: 2025-09-17

### 问题描述
在`truck_pricing_configs`表中，同一个城市（city_id）在没有区域ID和分组ID的情况下，可以同时存在多种定价模式（如"首续托定价"和"板数定价"），导致同一城市有多套定价规则，产生定价冲突。

### 业务影响
- 同一城市可能出现多个有效的定价配置，系统无法确定使用哪套价格
- 可能导致价格计算错误或不一致
- 影响客户报价准确性

## 问题分析

### 1. 数据库层面问题

#### 当前约束设计
```sql
-- truck_pricing_configs表的唯一约束
CONSTRAINT unique_active_config UNIQUE(city_id, zone_id, group_id, pricing_mode)
```

**问题**：此约束允许同一层级（城市/区域/分组）存在不同定价模式的配置。例如：
- `(city_id='AB', zone_id=NULL, group_id=NULL, pricing_mode='skid')` ✅
- `(city_id='AB', zone_id=NULL, group_id=NULL, pricing_mode='first_cont')` ✅

两条记录都能通过约束，但业务上不合理。

### 2. API层面问题

#### 保存配置逻辑（truckPricingV2.js）
```javascript
// 第276-285行：只停用同模式的配置
if (is_active !== false) {
  await client.query(
    `UPDATE truck_pricing_configs
     SET is_active = false
     WHERE city_id = $1
       AND (zone_id = $2 OR (zone_id IS NULL AND $2 IS NULL))
       AND (group_id = $3 OR (group_id IS NULL AND $3 IS NULL))
       AND pricing_mode = $4  // ⚠️ 只限制同一模式
       AND is_active = true`,
    [city_id, zone_id, group_id, pricing_mode]
  );
}
```

**问题**：保存新配置时，只将相同模式的旧配置设为inactive，不同模式的配置仍保持active状态。

### 3. 实际数据示例
```
城市: AB (cl2uxuh8saq)
├── 首续托定价 (first_cont) - 多条记录 ❌
└── 板数定价 (skid) - 1条记录 ✅
```
同一城市同时存在两种模式的激活配置，违反业务规则。

## 根本原因

1. **数据库设计缺陷**：唯一约束未正确反映业务规则
2. **API逻辑不完整**：未考虑跨模式的配置冲突
3. **缺少业务规则验证**：未在应用层验证"同一层级只能有一套定价"的规则

## 解决方案

### 方案1：修改数据库约束（推荐）

#### 1.1 移除现有约束，添加新的函数级约束
```sql
-- 创建触发器函数，确保同一层级只有一个激活配置
CREATE OR REPLACE FUNCTION check_single_active_pricing_per_level()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    -- 检查是否已存在同层级的其他激活配置
    IF EXISTS (
      SELECT 1 FROM truck_pricing_configs
      WHERE city_id = NEW.city_id
        AND (zone_id = NEW.zone_id OR (zone_id IS NULL AND NEW.zone_id IS NULL))
        AND (group_id = NEW.group_id OR (group_id IS NULL AND NEW.group_id IS NULL))
        AND id != NEW.id
        AND is_active = true
    ) THEN
      RAISE EXCEPTION '同一层级只能有一个激活的定价配置';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER ensure_single_active_pricing
  BEFORE INSERT OR UPDATE ON truck_pricing_configs
  FOR EACH ROW EXECUTE FUNCTION check_single_active_pricing_per_level();
```

#### 1.2 或使用部分唯一索引
```sql
-- 删除原有约束
ALTER TABLE truck_pricing_configs
DROP CONSTRAINT IF EXISTS unique_active_config;

-- 创建新的部分唯一索引
CREATE UNIQUE INDEX idx_single_active_pricing
ON truck_pricing_configs(city_id, zone_id, group_id)
WHERE is_active = true;
```

### 方案2：修改API逻辑

修改`truckPricingV2.js`中的保存逻辑：

```javascript
// POST /pricing-configs 路由修改
if (is_active !== false) {
  // 停用同一层级的所有配置（不限定pricing_mode）
  await client.query(
    `UPDATE truck_pricing_configs
     SET is_active = false
     WHERE city_id = $1
       AND (zone_id = $2 OR (zone_id IS NULL AND $2 IS NULL))
       AND (group_id = $3 OR (group_id IS NULL AND $3 IS NULL))
       AND is_active = true`,
    [city_id, zone_id, group_id]  // 移除 pricing_mode 参数
  );
}
```

### 方案3：数据清理

清理现有的冲突数据：
```sql
-- 查找冲突的配置
WITH conflict_configs AS (
  SELECT city_id, zone_id, group_id, COUNT(*) as active_count
  FROM truck_pricing_configs
  WHERE is_active = true
  GROUP BY city_id, zone_id, group_id
  HAVING COUNT(*) > 1
)
-- 保留优先级最高的，停用其他
UPDATE truck_pricing_configs t1
SET is_active = false
FROM conflict_configs c
WHERE t1.city_id = c.city_id
  AND (t1.zone_id = c.zone_id OR (t1.zone_id IS NULL AND c.zone_id IS NULL))
  AND (t1.group_id = c.group_id OR (t1.group_id IS NULL AND c.group_id IS NULL))
  AND t1.is_active = true
  AND t1.id NOT IN (
    SELECT id FROM truck_pricing_configs t2
    WHERE t2.city_id = c.city_id
      AND (t2.zone_id = c.zone_id OR (t2.zone_id IS NULL AND c.zone_id IS NULL))
      AND (t2.group_id = c.group_id OR (t2.group_id IS NULL AND c.group_id IS NULL))
      AND t2.is_active = true
    ORDER BY priority DESC, updated_at DESC
    LIMIT 1
  );
```

## 实施计划

### 第一步：数据备份
```bash
pg_dump -t truck_pricing_configs > backup_pricing_configs.sql
```

### 第二步：清理冲突数据
执行上述数据清理SQL

### 第三步：更新数据库约束
选择方案1.1或1.2实施

### 第四步：更新API代码
1. 修改`truckPricingV2.js`的保存逻辑
2. 添加前端验证提示

### 第五步：测试验证
1. 测试同一城市不能同时激活多种定价模式
2. 测试切换定价模式时旧配置自动停用
3. 测试分组、区域、城市三级优先级正常工作

## 预防措施

1. **添加单元测试**：测试定价配置的唯一性约束
2. **添加集成测试**：测试完整的定价配置保存流程
3. **代码审查**：确保业务规则在代码中明确体现
4. **监控告警**：添加数据一致性检查的定时任务

## 风险评估

- **修改约束风险**：可能影响现有数据插入，需要先清理数据
- **API修改风险**：需要全面测试，确保不影响正常业务
- **性能影响**：触发器会略微增加写入开销，但影响很小

## 总结

这是一个典型的业务规则未正确实现的bug。问题根源在于数据库设计和API逻辑都没有正确实现"同一层级只能有一套定价"的业务规则。建议采用数据库约束+API逻辑双重保障的方式修复此问题。