# Bug Analysis: 城市选中后边框高亮不一致

## Root Cause Analysis

### 问题定位
**文件**: `src/components/TruckDeliveryMap.jsx`
**函数**: `fsaColorMap` (第165行)
**关键代码**:
```javascript
const isSelectedCity = cityView && cityView.id === city.id;
```

### 核心问题
城市ID比较逻辑存在缺陷，导致 `isSelected` 标记未能正确应用到所有FSA。

### 数据结构分析

#### API返回的城市数据
```json
{
  "id": "cl2uxuh8saq",  // 复杂的生成ID
  "name": "AB",
  "province": "AB",
  "theme_color": "#10B981",
  ...
}
```

#### 问题根源
1. **ID不一致**: `cityView.id` 和 `city.id` 可能不匹配
   - cityView 可能来自不同的数据加载时机
   - 城市ID是动态生成的，可能在不同请求中不一致

2. **比较逻辑缺陷**: 仅依赖ID比较是不可靠的
   - 应该使用更稳定的标识符（如城市名称）
   - 或者确保ID在整个数据流中保持一致

### 数据流追踪

1. **Dashboard.jsx**:
   - 通过 `handleCitySelect(city)` 设置 `selectedCity`
   - 将 `selectedCity` 作为 `cityView` 传递给 TruckDeliveryMap

2. **TruckDeliveryMap.jsx**:
   - 接收 `cityView` 和 `allCities`
   - 在 `fsaColorMap` 中遍历 `allCities`
   - 尝试通过 `cityView.id === city.id` 匹配

3. **问题发生点**:
   - 如果 `cityView` 的对象引用与 `allCities` 中的城市对象不同
   - 或者ID字段在不同时间点有变化
   - 比较将失败，导致 `isSelected` 为 false

## Solution Design

### 方案一：使用城市名称比较（推荐）
```javascript
// 使用更稳定的名称字段进行比较
const isSelectedCity = cityView && (
  cityView.id === city.id ||
  cityView.name === city.name
);
```

### 方案二：规范化ID比较
```javascript
// 确保比较时考虑各种可能的ID格式
const isSelectedCity = cityView && city && (
  String(cityView.id) === String(city.id) ||
  cityView.name === city.name
);
```

### 方案三：使用FSA列表比较
```javascript
// 直接比较FSA是否属于选中城市的区域
const isSelectedCity = cityView && cityRegions.some(region =>
  region.fsaCodes.includes(fsa)
);
```

## 推荐修复方案

采用方案一，因为：
1. 城市名称是稳定的业务标识符
2. 不依赖于动态生成的ID
3. 简单可靠，易于维护

### 具体修改

```javascript
// fsaColorMap 函数中（第165行）
const isSelectedCity = cityView && (
  (cityView.id && city.id && cityView.id === city.id) ||
  (cityView.name && city.name && cityView.name === city.name)
);
```

## Testing Plan

1. **基础测试**:
   - 选择每个城市，确认所有FSA都有高亮边框
   - 切换城市，确认边框正确更新

2. **边缘情况**:
   - 清除选择后重新选择
   - 快速切换多个城市
   - 刷新页面后选择城市

3. **验证点**:
   - 所有属于选中城市的FSA都有白色边框
   - 边框宽度一致
   - 透明度增强效果一致

## Risk Assessment
- **风险等级**: 低
- **影响范围**: 仅影响视觉高亮效果
- **回归风险**: 最小，修改仅涉及比较逻辑

## Implementation Notes
- 修改位于 `TruckDeliveryMap.jsx` 第165行
- 需要同时检查ID和名称以确保兼容性
- 保持向后兼容，支持两种比较方式