# 卡车派送数据大屏布局重构 - 任务分解

## 任务概述
将卡车派送数据大屏的布局进行重构，实现更紧凑的城市列表、动态的区域展示和FSA分组联动功能。

## 任务列表

### Phase 1: 基础组件创建

- [ ] 1. 创建精简版城市卡片组件
  - 文件: `src/components/dashboard/CompactCityCard.jsx`
  - 创建新的紧凑城市卡片组件
  - 高度限制在80px，显示城市名、省份缩写、区域数、FSA数
  - 实现选中状态样式
  - _Requirements: FR-005, FR-006_

- [ ] 2. 创建动态内容区容器组件
  - 文件: `src/components/dashboard/DynamicContentArea.jsx`
  - 创建动态内容区组件，根据是否选中城市切换显示内容
  - 未选中时显示StatsOverview，选中时显示RegionGrid
  - _Requirements: FR-009, FR-010_

- [ ] 3. 创建统计概览组件
  - 文件: `src/components/dashboard/StatsOverview.jsx`
  - 创建统计摘要视图组件
  - 显示总体统计信息（城市数、区域数、FSA覆盖等）
  - _Requirements: FR-009_

- [ ] 4. 创建区域网格容器组件
  - 文件: `src/components/dashboard/RegionGrid.jsx`
  - 创建区域网格布局组件
  - 实现响应式网格布局，自适应列数
  - _Requirements: FR-011_

### Phase 2: 区域卡片和FSA分组

- [ ] 5. 创建区域卡片组件
  - 文件: `src/components/dashboard/RegionCard.jsx`
  - 创建区域卡片组件，显示区域名称、等级、FSA数量
  - 实现展开/收起功能的基础结构
  - _Requirements: FR-012, FR-013_

- [ ] 6. 实现区域卡片展开动画
  - 文件: `src/components/dashboard/RegionCard.jsx`
  - 使用Framer Motion添加展开/收起动画
  - 动画时长控制在300ms内
  - _Requirements: NFR-002_

- [ ] 7. 创建FSA分组列表组件
  - 文件: `src/components/dashboard/FSAGroupList.jsx`
  - 创建FSA分组列表组件
  - 显示分组名称和包含的FSA代码
  - _Requirements: FR-014, FR-015_

- [ ] 8. 创建FSA代码芯片组件
  - 文件: `src/components/dashboard/FSAChip.jsx`
  - 创建FSA代码显示组件
  - 支持点击高亮功能
  - _Requirements: FR-015_

### Phase 3: 城市列表面板重构

- [ ] 9. 创建新的城市列表面板组件
  - 文件: `src/components/dashboard/CityListPanel.jsx`
  - 创建宽度为w-64的城市列表面板
  - 集成搜索功能和城市列表
  - _Requirements: FR-001, FR-007_

- [ ] 10. 集成虚拟滚动到城市列表
  - 文件: `src/components/dashboard/VirtualCityList.jsx`
  - 使用react-window实现虚拟滚动
  - 支持100+城市的流畅滚动
  - _Requirements: NFR-001, NFR-004_

- [ ] 11. 迁移搜索功能到新面板
  - 文件: `src/components/dashboard/CityListPanel.jsx`
  - 集成现有的TruckDeliverySearch组件
  - 保持搜索功能不变
  - _Requirements: FR-008_
  - _Leverage: src/components/cities/TruckDeliverySearch.jsx_

### Phase 4: 状态管理重构

- [ ] 12. 创建Dashboard Context
  - 文件: `src/contexts/DashboardContext.jsx`
  - 创建Context和Provider组件
  - 定义城市、区域、FSA相关状态
  - _Requirements: 设计2.2.1_

- [ ] 13. 创建Dashboard Reducer
  - 文件: `src/reducers/dashboardReducer.js`
  - 实现SELECT_CITY、TOGGLE_REGION、HIGHLIGHT_FSA_GROUP等action
  - 处理状态更新逻辑
  - _Requirements: 设计2.2.2_

- [ ] 14. 创建自定义Hooks
  - 文件: `src/hooks/useDashboard.js`
  - 创建useRegionData等自定义hooks
  - 封装数据获取逻辑
  - _Requirements: 设计2.5.2_

### Phase 5: 地图联动功能

- [ ] 15. 实现城市选择地图缩放
  - 文件: `src/pages/TruckDelivery/Dashboard.jsx`
  - 修改handleCitySelect函数
  - 触发地图缩放到城市范围
  - _Requirements: FR-017_
  - _Leverage: src/components/TruckDeliveryMap.jsx_

- [ ] 16. 实现区域点击FSA高亮
  - 文件: `src/components/dashboard/RegionCard.jsx`
  - 添加区域点击事件处理
  - 更新highlightedFSAs状态
  - _Requirements: FR-018_

- [ ] 17. 实现FSA分组点击高亮
  - 文件: `src/components/dashboard/FSAGroupList.jsx`
  - 添加分组点击事件处理
  - 触发地图高亮对应FSA
  - _Requirements: FR-019, FR-016_

### Phase 6: 主组件集成

- [ ] 18. 重构Dashboard主组件布局
  - 文件: `src/pages/TruckDelivery/Dashboard.jsx`
  - 移除固定的8个统计卡片
  - 集成新的组件结构
  - _Requirements: FR-002, FR-003, FR-004_

- [ ] 19. 集成Context Provider
  - 文件: `src/pages/TruckDelivery/Dashboard.jsx`
  - 包装组件在DashboardProvider中
  - 连接状态管理
  - _Requirements: 设计2.2.1_

- [ ] 20. 迁移现有数据获取逻辑
  - 文件: `src/pages/TruckDelivery/Dashboard.jsx`
  - 保留现有的API调用逻辑
  - 适配新的状态管理结构
  - _Requirements: 设计2.3.1_
  - _Leverage: src/services/truckDeliveryApi.js_

### Phase 7: 样式和响应式

- [ ] 21. 实现响应式布局
  - 文件: `src/components/dashboard/RegionGrid.jsx`
  - 添加响应式断点类
  - 实现自适应列数布局
  - _Requirements: FR-012, NFR-010_

- [ ] 22. 添加暗色主题样式
  - 文件: 多个组件文件
  - 统一使用gray-800/900色系
  - 确保对比度符合标准
  - _Requirements: NFR-007_

- [ ] 23. 实现移动端适配
  - 文件: `src/components/dashboard/CityListPanel.jsx`
  - 添加移动端收起/展开功能
  - 实现浮动面板模式
  - _Requirements: NFR-011_

### Phase 8: 性能优化

- [ ] 24. 实现数据缓存机制
  - 文件: `src/utils/dashboardCache.js`
  - 创建缓存管理类
  - 实现5分钟缓存策略
  - _Requirements: 设计2.5.3_

- [ ] 25. 添加防抖搜索
  - 文件: `src/components/dashboard/CityListPanel.jsx`
  - 为搜索输入添加300ms防抖
  - 减少API调用频率
  - _Requirements: NFR-003_

- [ ] 26. 优化组件渲染
  - 文件: 多个组件文件
  - 添加React.memo优化
  - 使用useMemo/useCallback优化
  - _Requirements: NFR-003_

### Phase 9: 错误处理和加载状态

- [ ] 27. 创建错误边界组件
  - 文件: `src/components/dashboard/DashboardErrorBoundary.jsx`
  - 创建错误边界组件
  - 处理组件崩溃情况
  - _Requirements: 设计4.1_

- [ ] 28. 创建加载和空状态组件
  - 文件: `src/components/dashboard/LoadingState.jsx`, `EmptyState.jsx`
  - 创建加载状态组件
  - 创建空数据状态组件
  - _Requirements: 设计4.2_

- [ ] 29. 集成错误处理
  - 文件: `src/pages/TruckDelivery/Dashboard.jsx`
  - 添加错误边界包装
  - 处理API错误情况
  - _Requirements: NFR-008_

### Phase 10: 测试和清理

- [ ] 30. 编写单元测试
  - 文件: `src/components/dashboard/__tests__/*.test.jsx`
  - 为新组件编写单元测试
  - 确保核心功能覆盖
  - _Requirements: 设计5.1_

- [ ] 31. 功能集成测试
  - 文件: `src/pages/TruckDelivery/__tests__/Dashboard.test.jsx`
  - 编写端到端集成测试
  - 验证完整流程
  - _Requirements: 设计5.2_

- [ ] 32. 清理旧代码
  - 文件: `src/pages/TruckDelivery/Dashboard.jsx`
  - 移除旧的统计卡片代码
  - 清理未使用的导入和变量
  - _Requirements: FR-002_

- [ ] 33. 添加功能开关
  - 文件: `src/utils/featureFlags.js`
  - 实现新旧版本切换机制
  - 支持灰度发布
  - _Requirements: 设计7.2_

## 实施顺序建议

1. **Phase 1-2** (Task 1-8): 创建基础组件
2. **Phase 3** (Task 9-11): 重构城市列表
3. **Phase 4** (Task 12-14): 状态管理
4. **Phase 5-6** (Task 15-20): 功能集成
5. **Phase 7** (Task 21-23): 样式优化
6. **Phase 8** (Task 24-26): 性能优化
7. **Phase 9** (Task 27-29): 错误处理
8. **Phase 10** (Task 30-33): 测试和发布

## 风险点

1. **Task 10**: react-window集成可能影响现有搜索功能
2. **Task 18**: 主组件重构风险较高，需要充分测试
3. **Task 24**: 缓存机制可能导致数据不一致

## 依赖关系

- Task 2 依赖 Task 3, 4
- Task 5 依赖 Task 6, 7, 8
- Task 18 依赖 Task 1-17
- Task 30-31 依赖所有功能任务完成

## 完成标准

每个任务完成需满足：
1. 代码实现完成
2. 功能测试通过
3. 无控制台错误
4. 符合设计规范
5. 代码审查通过