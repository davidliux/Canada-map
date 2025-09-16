# Bug 分析报告：地图颜色与配置中心不一致

## 问题描述
地图显示的区域颜色与配置中心设置的颜色不一致。用户在配置中心为每个城市设置了特定的主题颜色，但地图上显示的是根据省份硬编码的颜色。

## 问题现象
- **配置中心显示**：
  - Calgary（粉色/紫色）
  - Toronto（红色）
  - Vancouver（蓝色）
  - on（红色）

- **地图实际显示**：
  - 所有区域显示为绿色或其他硬编码的省份颜色
  - 未使用配置的城市主题色

## 根本原因分析

### 1. 颜色渲染逻辑问题
**文件**: `src/components/TruckDeliveryMap.jsx`
**行号**: 149-161

地图组件使用硬编码的省份颜色映射，而不是使用配置的城市/区域颜色：

```javascript
// 根据省份设置颜色
const province = getProvinceFromFSA(fsaCode);
const provinceColors = {
  'BC': '#10B981',  // 硬编码的绿色
  'AB': '#F59E0B',  // 硬编码的橙色
  'SK': '#8B5CF6',  // 硬编码的紫色
  'MB': '#EC4899',  // 硬编码的粉色
  'ON': '#3B82F6',  // 硬编码的蓝色
  // ...
};
const baseColor = provinceColors[province] || '#6B7280';
```

### 2. 数据流断层
**问题位置**：
- `src/pages/TruckDelivery/Dashboard.jsx` → `src/components/TruckDeliveryMap.jsx`

Dashboard 组件传递给 TruckDeliveryMap 的数据不包含城市和区域的颜色信息：
```javascript
<TruckDeliveryMap
  highlightedFSAs={highlightedFSAs}
  cityView={selectedCity}  // 包含城市信息，但未传递区域颜色
  searchQuery={searchQuery}
  configuredFSAs={allConfiguredFSAs}
/>
```

### 3. 配置系统与显示系统分离
- **配置系统**：使用 `cityData.themeColor` 和 `region.displayColor`
- **显示系统**：使用硬编码的省份颜色
- 两个系统之间没有建立数据连接

## 影响范围
1. `/truck-delivery/dashboard` - 卡车配送数据大屏
2. 所有使用 `TruckDeliveryMap` 组件的页面
3. 用户体验：配置的颜色无法在地图上体现，造成视觉不一致

## 修复方案

### 方案一：传递城市和区域颜色信息（推荐）
1. 修改 Dashboard 组件，传递完整的城市和区域数据
2. 修改 TruckDeliveryMap 组件，接收并使用配置的颜色
3. 建立 FSA 到区域颜色的映射关系

**优点**：
- 完全遵循配置系统
- 支持每个区域独立配色
- 保持系统一致性

**实现步骤**：
1. Dashboard 传递 `cityRegions` 数据给地图组件
2. TruckDeliveryMap 根据 FSA 查找对应区域的 `displayColor`
3. 优先使用区域颜色，如果没有则使用城市主题色

### 方案二：同步省份颜色配置
1. 将省份颜色配置提取为共享配置
2. 允许用户配置省份颜色
3. 地图和配置中心使用相同的颜色源

**优点**：
- 实现简单
- 保持现有逻辑

**缺点**：
- 失去了按城市/区域配色的灵活性
- 不符合当前的业务设计

## 建议修复代码

### 1. 修改 Dashboard.jsx
```javascript
// 传递城市区域数据
<TruckDeliveryMap
  highlightedFSAs={highlightedFSAs}
  cityView={selectedCity}
  cityRegions={cityRegions}  // 新增：传递区域数据
  searchQuery={searchQuery}
  configuredFSAs={allConfiguredFSAs}
/>
```

### 2. 修改 TruckDeliveryMap.jsx
```javascript
const TruckDeliveryMap = ({
  highlightedFSAs = [],
  cityView = null,
  cityRegions = [],  // 新增：接收区域数据
  searchQuery = '',
  configuredFSAs = [],
  className = ''
}) => {
  // ...

  // 创建 FSA 到区域颜色的映射
  const fsaColorMap = useMemo(() => {
    const map = {};
    cityRegions.forEach(region => {
      const fsaCodes = region.fsaCodes || region.fsa_codes || [];
      fsaCodes.forEach(fsa => {
        map[fsa] = region.displayColor || cityView?.themeColor || '#2196F3';
      });
    });
    return map;
  }, [cityRegions, cityView]);

  // 修改 fsaStyle 函数
  const fsaStyle = (feature) => {
    const fsaCode = feature.properties.CFSAUID;
    const isConfigured = configuredFSAs.includes(fsaCode);
    const isHighlighted = highlightedFSAs.includes(fsaCode);

    if (!isConfigured) {
      return {
        fillColor: 'transparent',
        fillOpacity: 0,
        color: 'transparent',
        weight: 0
      };
    }

    // 使用配置的颜色，而不是省份颜色
    const baseColor = fsaColorMap[fsaCode] || cityView?.themeColor || '#6B7280';

    if (isHighlighted) {
      return {
        fillColor: baseColor,
        fillOpacity: 0.6,
        color: baseColor,
        weight: 2
      };
    }

    return {
      fillColor: baseColor,
      fillOpacity: 0.4,
      color: baseColor,
      weight: 0.5
    };
  };
  // ...
}
```

## 测试验证
1. 在配置中心设置不同城市的主题色
2. 为每个城市配置不同的区域
3. 查看地图是否正确显示配置的颜色
4. 切换不同城市，验证颜色是否动态更新

## 风险评估
- **低风险**：修改仅影响颜色显示，不影响功能逻辑
- **兼容性**：需要确保所有使用 TruckDeliveryMap 的页面传递正确的数据

## 总结
这个问题的根本原因是地图组件使用了硬编码的省份颜色，而没有使用配置系统中的颜色。通过传递完整的城市和区域数据，并建立 FSA 到颜色的映射关系，可以解决这个问题，实现配置与显示的一致性。