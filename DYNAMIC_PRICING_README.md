# 动态定价系统文档

## 项目概述

本项目为加拿大快递配送系统新增了完整的动态定价功能，支持基于区域和城市的灵活定价策略管理。

## 🚀 新功能特性

### 核心功能
- **城市区域选择器** - 支持单选和多选模式的城市区域选择
- **地图可视化** - 交互式地图显示区域边界和定价信息
- **增强定价规则编辑器** - 支持多重量范围、实时预览和模板应用
- **定价规则列表管理** - 完整的CRUD操作和批量管理功能
- **批量操作对话框** - 支持批量编辑、复制和导入导出
- **定价仪表板** - 综合管理界面集成所有功能
- **数据迁移工具** - 从旧系统平滑迁移数据

### 技术特性
- **错误处理和容量管理** - 统一的错误处理、重试机制和请求限流
- **性能优化** - 虚拟化列表、防抖节流、内存泄漏检测
- **测试覆盖** - 完整的测试工具和集成测试场景

## 📁 项目结构

```
src/
├── components/pricing/           # 定价相关组件
│   ├── CityRegionSelector.jsx    # 城市区域选择器
│   ├── RegionMapView.jsx         # 区域地图视图
│   ├── EnhancedPricingRuleEditor.jsx  # 增强定价规则编辑器
│   ├── PricingRuleList.jsx       # 定价规则列表
│   └── BatchOperationsDialog.jsx # 批量操作对话框
├── contexts/                     # React上下文
│   └── PricingContext.jsx        # 定价状态管理上下文
├── pages/TruckDelivery/         # 页面组件
│   ├── PricingDashboard.jsx     # 定价仪表板
│   └── DataMigrationTool.jsx    # 数据迁移工具
├── services/                     # API服务
│   └── pricingService.js         # 定价服务API客户端
└── utils/                        # 工具函数
    ├── errorHandling.js          # 错误处理工具
    ├── performance.js            # 性能优化工具
    ├── testUtils.js             # 测试工具
    └── formatting.js            # 格式化工具
```

## 🛠️ 安装和使用

### 前提条件
- Node.js 16+
- React 18+
- 现有的卡车配送系统

### 安装步骤

1. **依赖安装**
```bash
npm install
```

2. **启动开发服务器**
```bash
npm run dev
```

3. **访问新功能**
   - 导航至 `/management/truck-delivery/dynamic-pricing` 使用定价仪表板
   - 导航至 `/management/truck-delivery/migration` 使用数据迁移工具

## 🔧 配置

### 环境变量
```env
VITE_API_URL=http://localhost:5050/api/v1  # 后端API地址
```

### API配置
确保后端API支持以下端点：
- `GET /truck-delivery/pricing-rules/city/{cityId}` - 获取城市定价规则
- `GET /truck-delivery/pricing-rules/region/{cityId}/{regionId}` - 获取区域定价规则
- `PUT /truck-delivery/pricing-rules/region/{cityId}/{regionId}` - 更新区域定价
- `POST /truck-delivery/pricing-rules/copy` - 复制定价规则
- `POST /truck-delivery/pricing-rules/bulk-update` - 批量更新

## 📊 使用指南

### 1. 城市区域选择

```jsx
<CityRegionSelector
  selectedCityId={cityId}
  selectedRegionId={regionId}
  onCitySelect={handleCitySelect}
  onRegionSelect={handleRegionSelect}
  multiSelect={false}           // 是否支持多选
  showBatchOperations={false}   // 是否显示批量操作
/>
```

### 2. 定价规则编辑

```jsx
<EnhancedPricingRuleEditor
  cityId={cityId}
  regionId={regionId}
  onSave={handleSave}
  onCancel={handleCancel}
  showTemplates={true}          // 显示模板选项
  enableBatchEdit={false}       // 启用批量编辑
/>
```

### 3. 地图可视化

```jsx
<RegionMapView
  selectedCityId={cityId}
  selectedRegionIds={regionIds}
  onRegionClick={handleRegionClick}
  showPriceInfo={true}          // 显示价格信息
  showRegionBoundaries={true}   // 显示区域边界
/>
```

### 4. 使用定价上下文

```jsx
import { PricingProvider, usePricing } from './contexts/PricingContext';

function App() {
  return (
    <PricingProvider>
      <PricingComponent />
    </PricingProvider>
  );
}

function PricingComponent() {
  const {
    selectedCityId,
    selectedRegionIds,
    pricingRules,
    selectCity,
    selectRegion,
    addRule,
    updateRule
  } = usePricing();

  // 使用定价功能...
}
```

## 🧪 测试

### 运行测试

```bash
# 运行集成测试
import { runAllTests } from './src/utils/testUtils';
runAllTests().then(results => console.log(results));
```

### 测试覆盖
- **单元测试** - 组件功能测试
- **集成测试** - 完整工作流程测试
- **性能测试** - 组件渲染和数据处理性能
- **错误处理测试** - 异常情况处理验证

### 创建模拟数据

```jsx
import { createMockCity, createMockPricingRule } from './src/utils/testUtils';

const mockCity = createMockCity({
  name: '测试城市',
  regions: [/* 自定义区域 */]
});

const mockRule = createMockPricingRule({
  weightRanges: [/* 自定义重量范围 */]
});
```

## 🚀 性能优化

### 组件优化
- **虚拟化列表** - 处理大量定价规则
- **防抖搜索** - 优化搜索体验
- **批量状态更新** - 减少不必要的重渲染

### 数据处理优化
- **分块处理** - 大数据集分批处理
- **缓存机制** - 智能缓存频繁访问的数据
- **内存管理** - 自动检测和清理内存泄漏

### 使用性能工具

```jsx
import { usePerformanceMonitor, componentProfiler } from './src/utils/performance';

function MyComponent() {
  usePerformanceMonitor('MyComponent');
  
  useEffect(() => {
    // 查看性能统计
    console.log(componentProfiler.getStats('MyComponent'));
  }, []);
}
```

## 🔒 错误处理

### 统一错误处理

```jsx
import { withErrorHandling, AppError } from './src/utils/errorHandling';

const safePricingOperation = withErrorHandling(
  async () => {
    // 定价操作
  },
  {
    useRetry: { maxAttempts: 3 },
    useCapacityManagement: { priority: 'high' }
  }
);
```

### 错误监控

```jsx
import { errorCollector } from './src/utils/errorHandling';

// 监听错误
errorCollector.addListener((error) => {
  console.log('捕获到错误:', error);
});

// 获取错误报告
const errors = errorCollector.getErrors({ level: 'critical' });
```

## 📈 监控和分析

### 组件性能分析
- 渲染时间追踪
- 更新频率监控
- 内存使用情况分析

### 用户体验监控
- 操作响应时间
- 错误率统计
- 功能使用情况

## 🔄 数据迁移

### 从旧系统迁移

1. **使用数据迁移工具**
   - 访问 `/management/truck-delivery/migration`
   - 选择数据源（本地存储或JSON文件）
   - 执行分析和迁移

2. **手动迁移API**
```jsx
import { pricingService } from './src/services/pricingService';

// 批量更新城市定价
await pricingService.batchUpdateCityRules(cityId, ruleUpdates);

// 复制定价规则
await pricingService.copyPricingRules(sourceCityId, sourceRegionId, targetCityId, targetRegionId);
```

## 🤝 贡献指南

### 开发流程
1. 创建功能分支
2. 实现新功能或修复
3. 编写或更新测试
4. 确保性能基准达标
5. 提交代码审查

### 代码规范
- 使用 ESLint 和 Prettier
- 组件必须包含 PropTypes 或 TypeScript 类型
- 所有公共方法需要 JSDoc 注释
- 性能敏感组件需要性能测试

## 📝 更新日志

### v2.0.0 (当前版本)
- ✨ 新增完整的动态定价系统
- 🎨 现代化的用户界面设计
- 🚀 性能优化和错误处理机制
- 🧪 完整的测试覆盖
- 📚 详细的文档和使用指南

### 已知问题
- 地图组件在某些浏览器中可能加载较慢
- 大量数据时批量操作可能需要优化

### 未来计划
- 支持实时协作编辑
- 移动端响应式优化
- 更多定价策略模板
- 高级分析和报告功能

## 📞 支持

如有问题或建议，请通过以下方式联系：
- 在项目中创建 Issue
- 查看项目 Wiki 获取更多信息
- 参考现有的测试用例和示例代码

---

**注意**: 本系统是现有加拿大快递配送系统的重要扩展，请确保在生产环境中充分测试所有功能。