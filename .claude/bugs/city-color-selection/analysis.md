# Bug Analysis: 城市选择时所有城市颜色被覆盖

## Root Cause Analysis

### 问题定位
**文件**: `src/components/TruckDeliveryMap.jsx`
**函数**: `fsaColorMap` (lines 132-230)

### 核心问题
在 `fsaColorMap` 的逻辑中存在条件判断缺陷：

```javascript
// 当前错误逻辑
if (cityRegions && cityRegions.length > 0 && cityView) {
  // 只处理选中城市的区域，使用选中城市的颜色
  const cityBaseColor = cityView.themeColor || cityView.theme_color || cityView.color || '#3B82F6';
  // ... 将所有FSA都设置为选中城市的颜色
}
else if (allCities && allCities.length > 0) {
  // 只有在没有选中城市时才处理所有城市
  // ... 每个城市使用自己的颜色
}
```

### 问题分析
1. **条件分支错误**: 使用了 `if-else` 结构，导致选中城市时完全忽略其他城市的颜色
2. **颜色覆盖**: 当 `cityView` 存在时，只使用选中城市的 `themeColor` 为所有FSA着色
3. **逻辑缺陷**: 选中城市应该是**高亮**显示，而不是**替换**所有城市的颜色

### 数据流追踪
1. `Dashboard.jsx` 传递参数给 `TruckDeliveryMap`:
   - `cityView={selectedCity}` - 当前选中的城市
   - `cityRegions={cityRegions}` - 选中城市的区域
   - `allCities={cities}` - 所有城市数据
2. `TruckDeliveryMap` 使用这些数据计算颜色映射
3. 错误发生在颜色映射计算逻辑中

## Solution Design

### 修复策略
重构 `fsaColorMap` 逻辑，确保：
1. **始终处理所有城市**：不论是否有选中城市，都应该为所有城市的FSA分配正确的颜色
2. **选中城市特殊处理**：通过调整透明度或边框来高亮选中城市，而不是改变其他城市的颜色
3. **保持视觉层次**：选中城市更明显，其他城市保持可见但相对淡化

### 具体修改方案

```javascript
const fsaColorMap = useMemo(() => {
  const map = {};

  // Step 1: 始终先处理所有城市，为每个FSA分配其所属城市的颜色
  if (allCities && allCities.length > 0) {
    allCities.forEach(city => {
      const cityThemeColor = city.theme_color || city.themeColor || '#3B82F6';

      if (city.regions && Array.isArray(city.regions)) {
        city.regions.forEach(region => {
          const fsaCodes = region.fsaCodes || region.fsa_codes || region.fsaList || [];

          // 计算区域级别和透明度
          const zoneName = region.name || region.zone_name || '';
          let zoneLevel = 1;
          const zoneMatch = zoneName.match(/zone\s*(\d+)|区域\s*(\d+)|region\s*(\d+)/i);
          if (zoneMatch) {
            zoneLevel = parseInt(zoneMatch[1] || zoneMatch[2] || zoneMatch[3]) || 1;
          }

          // 基础透明度映射
          const baseOpacityMap = {
            1: 0.8,
            2: 0.65,
            3: 0.5,
            4: 0.35,
            5: 0.25
          };

          // 如果是选中的城市，稍微增加透明度以高亮显示
          const isSelectedCity = cityView && cityView.id === city.id;
          const opacityBoost = isSelectedCity ? 0.1 : 0;
          const opacity = Math.min((baseOpacityMap[zoneLevel] || 0.5) + opacityBoost, 0.9);

          if (fsaCodes && fsaCodes.length > 0) {
            fsaCodes.forEach(fsa => {
              map[fsa] = {
                color: cityThemeColor,  // 保持原城市颜色
                opacity: opacity,
                zoneLevel: zoneLevel,
                isSelected: isSelectedCity  // 标记是否为选中城市
              };
            });
          }
        });
      }
    });
  }

  // Step 2: 如果没有城市数据但有选中城市，使用备用方案
  if (Object.keys(map).length === 0 && cityView?.themeColor) {
    highlightedFSAs.forEach(fsa => {
      map[fsa] = {
        color: cityView.themeColor,
        opacity: 0.6,
        zoneLevel: 1,
        isSelected: true
      };
    });
  }

  return map;
}, [allCities, cityView, highlightedFSAs]);
```

### 样式调整建议
除了颜色映射修复，还可以在 `fsaStyle` 函数中增强视觉效果：
- 选中城市的FSA：增加边框宽度，使用白色边框
- 其他城市的FSA：保持原有颜色但降低一点透明度
- 悬停效果：保持现有逻辑

## Testing Plan
1. **多城市显示测试**：确认初始状态下各城市使用不同颜色
2. **城市选择测试**：选择某个城市后，该城市高亮，其他城市颜色不变
3. **切换城市测试**：在不同城市间切换，颜色正确更新
4. **清除选择测试**：清除选择后恢复到全局视图

## Risk Assessment
- **风险等级**：低
- **影响范围**：仅影响视觉渲染
- **回归风险**：修改仅涉及颜色计算逻辑，不影响其他功能
- **性能影响**：优化后的逻辑实际上更简洁，性能可能略有提升

## Implementation Notes
- 修改集中在 `TruckDeliveryMap.jsx` 文件
- 主要修改 `fsaColorMap` useMemo hook
- 可选：调整 `fsaStyle` 函数以增强视觉效果
- 不需要修改 `Dashboard.jsx` 或其他文件