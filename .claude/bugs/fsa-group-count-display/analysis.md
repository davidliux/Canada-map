# Bug Analysis: FSA分组数量显示不正确

## Executive Summary
分组列表中显示的"(无FSA)"问题是由于API数据格式转换缺失导致的。后端返回的分组数据使用snake_case命名（`fsa_codes`），而前端组件期望camelCase命名（`fsaCodes`），但在API层没有进行相应的转换。

## Root Cause Analysis

### 1. Data Flow Analysis
```
后端API → truckDeliveryApi.js → UnifiedSkidPricingPage → HierarchicalSelector → 显示
```

### 2. Issue Location
**文件**: `src/services/truckDeliveryApi.js`
**函数**: `groupApi.getByZoneId` (Line 357-365)
**问题**: 没有将后端的snake_case字段转换为前端的camelCase字段

### 3. Current Code
```javascript
// src/services/truckDeliveryApi.js:357-365
async getByZoneId(zoneId) {
  const url = `${TRUCK_API}/zones/${zoneId}/groups`;
  const result = await apiRequest(url);
  // 确保返回正确的数据格式
  return {
    success: true,
    data: result.data || []  // ← 问题：直接返回数据，没有格式转换
  };
}
```

### 4. Frontend Expectation
```javascript
// src/components/pricing/skid/HierarchicalSelector.jsx:277
({group.fsaCodes?.join(', ') || '无FSA'})  // 期望 fsaCodes 字段
```

### 5. Data Format Mismatch
- **后端返回**: `{ fsa_codes: ['T0A', 'T0B'] }`
- **前端期望**: `{ fsaCodes: ['T0A', 'T0B'] }`
- **实际接收**: `{ fsa_codes: ['T0A', 'T0B'] }` (未转换)
- **结果**: `group.fsaCodes` 为 `undefined`，显示"无FSA"

## Impact Assessment

### Affected Components
1. `HierarchicalSelector` - 分组选择器显示"无FSA"
2. `UnifiedSkidPricingPage` - 板数定价页面无法正确显示分组FSA数量
3. 任何依赖分组FSA数据的下游功能

### User Impact
- 用户无法看到每个分组包含的FSA数量
- 可能影响用户对分组配置的理解和决策
- 降低系统可信度

## Solution Strategy

### Fix Approach
在API层添加数据格式转换，将后端的snake_case转换为前端需要的camelCase格式。

### Implementation Plan
1. **修改 `groupApi.getByZoneId` 函数**
   - 添加数据转换逻辑
   - 将 `fsa_codes` 转换为 `fsaCodes`

2. **可选：创建通用转换函数**
   - 类似于已存在的 `transformZone` 函数
   - 确保所有group相关字段都正确转换

3. **验证修复**
   - 检查分组列表是否正确显示FSA数量
   - 确保没有破坏其他功能

### Proposed Code Change
```javascript
// src/services/truckDeliveryApi.js
async getByZoneId(zoneId) {
  const url = `${TRUCK_API}/zones/${zoneId}/groups`;
  const result = await apiRequest(url);

  // 转换分组数据格式
  const transformedGroups = (result.data || []).map(group => ({
    ...group,
    fsaCodes: group.fsa_codes || [],  // snake_case to camelCase
    // 保留其他字段的转换（如果需要）
  }));

  return {
    success: true,
    data: transformedGroups
  };
}
```

## Prevention Measures

### Code Standards
1. 在API层统一处理数据格式转换
2. 创建明确的数据转换函数
3. 添加数据格式验证

### Testing Recommendations
1. 添加单元测试验证数据转换
2. 添加集成测试验证端到端数据流
3. 使用TypeScript或PropTypes进行类型检查

## Risk Analysis

### Implementation Risks
- **低风险**: 修改是局部的，只影响一个API函数
- **需要注意**: 确保不破坏依赖这个API的其他功能

### Testing Requirements
1. 验证分组列表显示正确的FSA数量
2. 验证分组选择功能正常
3. 验证价格配置功能不受影响

## Conclusion
问题的根本原因是API层缺少必要的数据格式转换。通过在`groupApi.getByZoneId`函数中添加snake_case到camelCase的转换，可以解决这个问题。这是一个简单的修复，风险较低，但需要确保测试覆盖相关功能。