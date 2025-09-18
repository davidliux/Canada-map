# Bug Analysis: T0M 价格查询数据源分析

## 1. 问题概述

**问题描述**: 分析T0M FSA代码的价格查询数据来源和期望的数据格式

**影响范围**:
- T0M是一个加拿大Alberta省的FSA（Forward Sortation Area）代码
- 位于Kathyrn市（lat: 51.9056, lng: -114.2456）
- 影响所有FSA价格查询功能

## 2. 数据流分析

### 2.1 数据读取流程

当用户点击T0M FSA查询价格时，`FSAPricingPanel`组件（src/components/FSAPricingPanel.jsx）会按以下顺序读取数据：

1. **分组自定义价格** (优先级最高)
   - 调用 `pricingService.getGroupSkidPricing(cityId, regionId, groupId)`
   - 检查该FSA所属分组是否有自定义价格配置

2. **后端API价格数据**
   - 调用 `GET /api/v1/truck-delivery/zones/${regionId}`
   - 从数据库表 `skid_pricing` 读取板数价格

3. **本地存储备份** (最低优先级)
   - 从 `localStorage.getItem(\`skid_pricing_${regionId}\`)`读取
   - 作为后备方案，防止API失败

### 2.2 数据源层次结构

```
数据源优先级：
├── 1. FSA分组自定义价格 (group-level)
│   └── 来源：pricingService / localStorage
├── 2. 区域通用价格 (zone-level)
│   └── 来源：后端API /truck-delivery/zones/:id
└── 3. 本地缓存价格 (fallback)
    └── 来源：localStorage
```

## 3. 期望的数据格式

### 3.1 API响应格式

```javascript
// GET /api/v1/truck-delivery/zones/:id 期望返回：
{
  success: true,
  data: {
    id: "zone-uuid",
    city_id: "toronto",
    name: "区域1",
    level: 1,
    fsa_codes: ["T0M", ...],
    prices: [
      { skid_count: 1, price: 100, currency: "CAD" },
      { skid_count: 2, price: 150, currency: "CAD" },
      { skid_count: 3, price: 200, currency: "CAD" },
      // ... 继续到16+板
      { skid_count: "16+", price: 800, currency: "CAD" }
    ]
  }
}
```

### 3.2 价格数据对象格式

```javascript
// FSAPricingPanel期望的价格数据格式：
const pricingData = {
  source: 'group' | 'zone',    // 价格来源类型
  groupName: "分组名称",         // 如果是分组价格
  zoneName: "区域名称",          // 如果是区域价格
  prices: {
    1: 100,      // 1板价格
    2: 150,      // 2板价格
    3: 200,      // 3板价格
    4: 250,
    5: 300,
    6: 350,
    7: 400,
    8: 450,
    9: 500,
    10: 550,
    11: 600,
    12: 650,
    13: 700,
    14: 750,
    15: 800,
    16: 850,
    "16+": 900   // 16板以上价格
  }
}
```

### 3.3 数据库表结构

```sql
-- skid_pricing表结构
skid_pricing (
  id SERIAL PRIMARY KEY,
  city_id VARCHAR,
  zone_id VARCHAR,      -- 可能是zone.id, zone.name, "区域1", "Zone 1"等格式
  skid_count VARCHAR,   -- "1", "2", ... "16+"
  price DECIMAL(10,2),
  currency VARCHAR DEFAULT 'CAD',
  is_active BOOLEAN DEFAULT true
)
```

## 4. 问题根因分析

### 4.1 数据匹配问题

后端查询使用了多种zone_id匹配方式：
```sql
LEFT JOIN skid_pricing sp ON (
  sp.zone_id = z.id                    -- UUID匹配
  OR sp.zone_id = z.name               -- 名称匹配
  OR sp.zone_id = '区域' || z.level    -- 中文格式
  OR sp.zone_id = 'Zone ' || z.level   -- 英文格式
)
```

这种多重匹配可能导致：
- 数据冗余或重复
- 性能问题
- 数据一致性问题

### 4.2 数据格式转换问题

前端需要将API返回的数组格式转换为对象格式：
```javascript
// API返回数组格式
prices: [
  { skid_count: 1, price: 100 },
  { skid_count: 2, price: 150 }
]

// 需转换为对象格式
prices: {
  1: 100,
  2: 150
}
```

### 4.3 潜在的数据缺失

如果T0M所在的区域没有配置价格数据，系统会使用空价格（全部显示为0），这可能导致用户困惑。

## 5. 建议的解决方案

### 5.1 统一数据源标识

建议使用UUID作为唯一标识，避免多重匹配：
```sql
-- 只使用UUID匹配
LEFT JOIN skid_pricing sp ON sp.zone_id = z.id
```

### 5.2 数据格式标准化

在后端统一返回对象格式的价格数据，减少前端转换：
```javascript
// 后端直接返回对象格式
prices: {
  "1": 100,
  "2": 150,
  // ...
  "16+": 900
}
```

### 5.3 数据完整性检查

添加数据验证确保所有区域都有基础价格配置：
```javascript
// 验证价格数据完整性
const validatePriceData = (prices) => {
  const requiredKeys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, "16+"];
  return requiredKeys.every(key => prices.hasOwnProperty(key) && prices[key] > 0);
};
```

### 5.4 错误处理优化

改进错误处理，提供更明确的用户反馈：
```javascript
if (!applicablePricing || Object.keys(applicablePricing.prices).length === 0) {
  setError(`T0M所在区域（${regionConfig.name}）暂未配置价格，请联系管理员`);
}
```

## 6. 测试建议

1. **单元测试**：测试价格数据格式转换函数
2. **集成测试**：测试完整的价格查询流程
3. **边界测试**：测试无价格数据、部分价格数据等情况
4. **性能测试**：测试大量FSA同时查询价格的性能

## 7. 影响评估

- **低风险**：只影响价格显示，不影响核心业务逻辑
- **中等紧急度**：影响用户体验，但有降级方案（本地存储）
- **修复复杂度**：中等，需要协调前后端数据格式

## 8. 下一步行动

1. 确认T0M所在区域的价格配置状态
2. 检查数据库中skid_pricing表的实际数据
3. 验证API端点返回的数据格式
4. 实施数据格式标准化方案
5. 添加数据完整性验证