# FSA分组数据加载实施说明

## 实施内容

### 1. 后端API增强

#### 新增端点
- **GET** `/api/v1/truck-delivery/zones/:zoneId/groups` - 获取区域的所有分组
- **GET** `/api/v1/truck-delivery/groups/:groupId` - 获取单个分组详情

#### 数据结构
```javascript
// 分组数据结构
{
  id: 'group-xxxxx',
  zone_id: 'zone-id',
  name: '分组名称',
  fsa_codes: 'T4B,T0M',  // FSA代码列表
  custom_pricing: {...},   // 自定义定价配置
  display_color: '#8B5CF6', // 显示颜色
  city_id: 'city-id',      // 关联城市ID
  zone_name: '区域名称',    // 区域名称
  city_name: '城市名称'     // 城市名称
}
```

### 2. 前端API服务更新

#### 文件: `src/services/truckDeliveryApi.js`
- 添加了 `groupApi` 对象，包含分组相关的所有API方法
- `getByZoneId(zoneId)` - 获取区域的分组列表
- `create/update/delete` - 分组的增删改操作

### 3. 统一定价页面数据加载

#### 文件: `src/pages/TruckDelivery/UnifiedSkidPricingPage.jsx`
更新了 `loadCities` 方法：
1. 首先加载所有城市
2. 对每个城市加载其区域
3. 对每个区域加载其分组
4. 构建完整的层级数据结构

### 4. 层级选择器组件

#### 文件: `src/components/pricing/skid/HierarchicalSelector.jsx`
支持三级层级选择：
- **城市级别** - 最大的选择按钮
- **区域级别** - 中等大小的卡片
- **分组级别** - 最小的列表项

## 数据流程

```
PostgreSQL Database
    ↓
truck_delivery_cities (城市表)
    ↓
truck_delivery_zones (区域表)
    ↓
truck_zone_fsa_groups (分组表)
    ↓
Backend API (/api/v1/truck-delivery)
    ↓
Frontend API Service (truckDeliveryApi.js)
    ↓
React Components
```

## 测试验证

### 后端测试
运行测试脚本：
```bash
cd backend && node test-groups-api.js
```

测试结果显示：
- ✅ 成功获取5个城市
- ✅ 成功获取4个区域
- ✅ 成功获取6个分组及其详细信息

### 前端访问
访问统一定价页面：
```
http://localhost:3001/management/truck-delivery/unified-pricing
```

功能验证：
- ✅ 城市列表正确显示
- ✅ 选择城市后显示区域
- ✅ 选择区域后显示分组
- ✅ 分组信息包含FSA代码和定价状态

## 数据库表结构

### truck_zone_fsa_groups 表
```sql
CREATE TABLE truck_zone_fsa_groups (
    id VARCHAR(255) PRIMARY KEY,
    zone_id UUID REFERENCES truck_delivery_zones(id),
    name VARCHAR(255) NOT NULL,
    fsa_codes TEXT,
    custom_pricing JSONB,
    display_color VARCHAR(50)
);
```

## 关键特性

1. **层级优先级**: 分组 > 区域 > 城市
2. **实时数据同步**: 从数据库实时读取，确保数据一致性
3. **错误处理**: 每个层级都有独立的错误处理，确保部分失败不影响整体
4. **调试日志**: 控制台输出详细的数据加载日志，便于问题排查

## 注意事项

1. **FSA代码格式**: 存储为逗号分隔的字符串，如 "T4B,T0M,T3Z"
2. **自定义定价**: 以JSONB格式存储在数据库中
3. **颜色显示**: 每个分组可以有独立的显示颜色
4. **API兼容性**: 保持了向后兼容，旧的API调用仍然有效

## 后续优化建议

1. **缓存机制**: 添加数据缓存，减少API调用
2. **懒加载**: 实现分组数据的按需加载
3. **批量操作**: 支持批量更新分组配置
4. **数据验证**: 加强前后端数据验证

## 总结

成功实现了从数据库 `truck_zone_fsa_groups` 表读取分组数据并在前端统一定价页面中展示的功能。系统现在支持完整的三级层级（城市-区域-分组）数据加载和管理。