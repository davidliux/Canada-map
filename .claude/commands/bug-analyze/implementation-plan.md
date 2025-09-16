# 实现方案：区域1-5价格批量配置功能

## 实现目标
1. 恢复价格编辑功能，支持写入数据库
2. 添加区域1-5批量初始化功能
3. 提供快捷的价格配置模板

## 具体实现步骤

### 步骤1：修改RegionPriceManager组件

#### 1.1 添加数据库保存功能
```javascript
// 在RegionPriceManager.jsx中添加
import { apiPut } from '../utils/apiClient';

const handleSaveToDatabase = async (weightRanges) => {
  if (!selectedRegion) return;

  try {
    // 调用PUT API更新数据库
    await apiPut(`/regions/${selectedRegion}`, {
      weightRanges: weightRanges.map(range => ({
        rangeName: range.label,
        minWeight: range.min,
        maxWeight: range.max,
        price: range.price,
        isActive: range.isActive
      }))
    });

    setOperationResult({
      type: 'success',
      message: '价格配置已保存到数据库'
    });
  } catch (error) {
    setOperationResult({
      type: 'error',
      message: `保存失败: ${error.message}`
    });
  }
};
```

#### 1.2 添加编辑模式切换
```javascript
// 添加编辑模式开关
const [editMode, setEditMode] = useState(false);

// 修改只读判断
const isReadOnly = apiModeEnabled && !editMode;
```

### 步骤2：创建批量初始化组件

#### 2.1 创建QuickRegionSetup组件
```javascript
// 新建 src/components/QuickRegionSetup.jsx
import React, { useState } from 'react';
import { apiPost, apiPut } from '../utils/apiClient';

const QuickRegionSetup = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);

  // 默认价格配置模板
  const defaultPriceTemplate = [
    { rangeName: '0-10 KGS', minWeight: 0, maxWeight: 10, price: 15.99 },
    { rangeName: '10-20 KGS', minWeight: 10, maxWeight: 20, price: 25.99 },
    { rangeName: '20-50 KGS', minWeight: 20, maxWeight: 50, price: 45.99 },
    { rangeName: '50-100 KGS', minWeight: 50, maxWeight: 100, price: 85.99 },
    { rangeName: '100+ KGS', minWeight: 100, maxWeight: 9999, price: 150.99 }
  ];

  // 区域定义
  const regions = [
    { id: 'region1', name: '区域1 - Calgary核心', color: '#3B82F6' },
    { id: 'region2', name: '区域2 - Calgary外围', color: '#10B981' },
    { id: 'region3', name: '区域3 - Edmonton', color: '#F59E0B' },
    { id: 'region4', name: '区域4 - Vancouver核心', color: '#EF4444' },
    { id: 'region5', name: '区域5 - Toronto核心', color: '#8B5CF6' }
  ];

  const handleQuickSetup = async () => {
    setLoading(true);
    try {
      for (const region of regions) {
        // 检查区域是否存在
        try {
          await apiPut(`/regions/${region.id}`, {
            name: region.name,
            weightRanges: defaultPriceTemplate,
            isActive: true
          });
        } catch (error) {
          // 如果更新失败，尝试创建
          await apiPost('/regions', {
            id: region.id,
            name: region.name,
            weightRanges: defaultPriceTemplate,
            isActive: true
          });
        }
      }
      onComplete?.();
    } catch (error) {
      console.error('批量设置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-cyber-gray/30 border border-cyber-blue/30 rounded-lg">
      <h3 className="text-lg font-semibold text-white mb-4">快速配置区域1-5</h3>
      <button
        onClick={handleQuickSetup}
        disabled={loading}
        className="px-4 py-2 bg-cyber-blue hover:bg-cyber-blue/80 text-white rounded-lg disabled:opacity-50"
      >
        {loading ? '配置中...' : '一键初始化区域1-5价格'}
      </button>
    </div>
  );
};
```

### 步骤3：集成到价格设置页面

#### 3.1 修改PriceSettings.jsx
```javascript
import QuickRegionSetup from '../../components/QuickRegionSetup';

// 在组件中添加
<QuickRegionSetup onComplete={loadRegions} />
```

### 步骤4：添加FSA分配功能

#### 4.1 创建FSA批量分配
```javascript
// 在QuickRegionSetup中添加FSA分配
import { testRegionFSAs } from '../utils/testRegionData';

const handleQuickSetup = async () => {
  // ... 现有代码

  // 添加FSA分配
  for (const [regionId, fsaList] of Object.entries(testRegionFSAs)) {
    if (regionId <= 5) { // 只处理区域1-5
      await apiPut(`/regions/region${regionId}`, {
        postalCodes: fsaList
      });
    }
  }
};
```

## 数据结构

### 区域价格配置格式
```javascript
{
  id: 'region1',
  name: '区域1 - Calgary核心',
  isActive: true,
  postalCodes: ['T2P', 'T2R', 'T2S', ...],
  weightRanges: [
    {
      rangeName: '0-10 KGS',
      minWeight: 0,
      maxWeight: 10,
      price: 15.99,
      isActive: true
    },
    // ...更多区间
  ]
}
```

## UI改进建议

### 1. 添加操作按钮组
- "编辑模式" 开关
- "保存到数据库" 按钮
- "从数据库刷新" 按钮
- "批量初始化" 按钮

### 2. 状态指示器
- 显示当前模式（只读/编辑）
- 显示数据来源（数据库/本地）
- 显示保存状态

### 3. 批量操作面板
- 快速配置区域1-5
- 批量价格调整
- 导入/导出功能

## 测试计划

### 单元测试
1. API调用测试
2. 数据转换测试
3. 错误处理测试

### 集成测试
1. 创建新区域并配置价格
2. 更新现有区域价格
3. 批量初始化5个区域
4. 数据同步验证

### 用户验收测试
1. 编辑单个区域价格
2. 使用批量初始化
3. 验证数据持久化
4. 测试错误恢复

## 时间估算

- 修改RegionPriceManager：2小时
- 创建QuickRegionSetup组件：2小时
- 集成和测试：2小时
- 总计：6小时

## 注意事项

1. 保持向后兼容性
2. 添加适当的错误处理
3. 实现乐观更新提升用户体验
4. 考虑并发编辑冲突处理
5. 添加操作日志记录