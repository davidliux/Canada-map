# 卡车定价增强功能任务分解文档

## 概述

本文档将卡车定价增强功能分解为可执行的原子任务。每个任务都是独立的、可测试的，并且可以在15-30分钟内完成。

## 任务清单

- [ ] 1. 创建 PricingModes 表结构
  - 在 backend/prisma/schema.prisma 中添加 pricing_modes 表定义
  - 包含 city_id, zone_id, mode_type, config, is_active 等字段
  - _Requirements: 1, 4_
  - _Leverage: backend/prisma/schema.prisma_

- [ ] 2. 创建 PricingRules 表结构
  - 在 backend/prisma/schema.prisma 中添加 pricing_rules 表定义
  - 包含 mode_id, rule_type, min_quantity, price 等字段
  - _Requirements: 2, 3_
  - _Leverage: backend/prisma/schema.prisma_

- [ ] 3. 生成并运行数据库迁移
  - 执行 npx prisma migrate dev 创建新表
  - _Requirements: 1_
  - _Leverage: backend/package.json_

- [ ] 4. 创建定价模式路由文件
  - 创建 backend/src/routes/pricingModes.js
  - 设置 Express 路由器和基础结构
  - _Requirements: 1, 4_
  - _Leverage: backend/src/routes/skidPricing.js_

- [ ] 5. 实现获取定价模式API
  - 在 pricingModes.js 中实现 GET /api/v1/truck-delivery/pricing-modes/:cityId/:zoneId
  - 从数据库查询并返回定价模式配置
  - _Requirements: 1_
  - _Leverage: backend/src/routes/skidPricing.js_

- [ ] 6. 实现保存定价模式API
  - 在 pricingModes.js 中实现 POST /api/v1/truck-delivery/pricing-modes/:cityId/:zoneId
  - 使用事务保存定价模式配置
  - _Requirements: 1, 2, 3_
  - _Leverage: backend/src/routes/skidPricing.js_

- [ ] 7. 创建价格计算服务
  - 创建 backend/src/services/calculationService.js
  - 实现首续托价格计算函数 calculatePalletBased()
  - _Requirements: 5_
  - _Leverage: backend/src/routes/skidPricing.js_

- [ ] 8. 实现批量折扣计算
  - 在 calculationService.js 中添加 calculateBulkDiscount() 函数
  - 支持阶梯定价逻辑
  - _Requirements: 2_
  - _Leverage: backend/src/services/calculationService.js_

- [ ] 9. 实现整车价格计算
  - 在 calculationService.js 中添加 calculateFullTruck() 函数
  - 判断是否满足整车条件并返回固定价格
  - _Requirements: 3_
  - _Leverage: backend/src/services/calculationService.js_

- [ ] 10. 创建价格计算API端点
  - 在 pricingModes.js 中实现 POST /api/v1/truck-delivery/calculate-price
  - 调用计算服务并返回价格明细
  - _Requirements: 5_
  - _Leverage: backend/src/routes/pricingModes.js_

- [ ] 11. 创建价格验证中间件
  - 创建 backend/src/middleware/priceValidation.js
  - 实现价格范围和格式验证
  - _Requirements: 1, 2_
  - _Leverage: backend/src/middleware/_

- [ ] 12. 扩展前端 pricingService
  - 在 src/services/pricingService.js 中添加 getPricingModes() 方法
  - 调用后端获取定价模式API
  - _Requirements: 1_
  - _Leverage: src/services/pricingService.js_

- [ ] 13. 添加保存定价模式方法
  - 在 pricingService.js 中添加 savePricingMode() 方法
  - 调用后端保存API
  - _Requirements: 1, 4_
  - _Leverage: src/services/pricingService.js_

- [ ] 14. 添加价格计算方法
  - 在 pricingService.js 中添加 calculatePrice() 方法
  - 调用后端计算API
  - _Requirements: 5_
  - _Leverage: src/services/pricingService.js_

- [ ] 15. 创建价格计算缓存
  - 创建 src/services/priceCalculationCache.js
  - 实现基于 Map 的缓存类
  - _Requirements: 5_
  - _Leverage: src/utils/dashboardCache.js_

- [ ] 16. 扩展 unifiedStorage 添加定价模式支持
  - 在 src/utils/unifiedStorage.js 中添加 getPricingMode() 方法
  - _Requirements: 1, 4_
  - _Leverage: src/utils/unifiedStorage.js_

- [ ] 17. 添加定价模式存储键
  - 在 unifiedStorage.js 中定义 PRICING_MODES_V2 常量
  - _Requirements: 1_
  - _Leverage: src/utils/unifiedStorage.js_

- [ ] 18. 创建数据迁移工具
  - 创建 src/utils/migratePricingData.js
  - 实现从旧格式到新格式的转换函数
  - _Requirements: 4_
  - _Leverage: src/utils/dataRecovery.js_

- [ ] 19. 扩展事件通知系统
  - 在 src/utils/dataUpdateNotifier.js 中添加 PRICING_MODE_CHANGED 事件
  - _Requirements: 1, 4_
  - _Leverage: src/utils/dataUpdateNotifier.js_

- [ ] 20. 创建 PricingModeSelector 组件
  - 创建 src/components/pricing/PricingModeSelector.jsx
  - 实现组件基础结构和 props 接口
  - _Requirements: 1, 4_
  - _Leverage: src/components/pricing/skid/SkidPricingMatrix.jsx_

- [ ] 21. 实现模式选项卡UI
  - 在 PricingModeSelector.jsx 中添加选项卡切换界面
  - 使用 Framer Motion 添加切换动画
  - _Requirements: 4_
  - _Leverage: src/components/pricing/PricingModeSelector.jsx_

- [ ] 22. 创建托盘定价编辑器
  - 创建 src/components/pricing/editors/PalletBasedEditor.jsx
  - 实现首托和续托价格输入框
  - _Requirements: 1_
  - _Leverage: src/components/pricing/skid/SkidPricingMatrix.jsx_

- [ ] 23. 创建批量折扣编辑器
  - 创建 src/components/pricing/editors/BulkDiscountEditor.jsx
  - 实现阶梯价格配置表格
  - _Requirements: 2_
  - _Leverage: src/components/pricing/skid/SkidPricingMatrix.jsx_

- [ ] 24. 创建整车定价编辑器
  - 创建 src/components/pricing/editors/FullTruckEditor.jsx
  - 实现整车价格和最小数量配置
  - _Requirements: 3_
  - _Leverage: src/components/pricing/skid/SkidPricingMatrix.jsx_

- [ ] 25. 创建混合模式编辑器
  - 创建 src/components/pricing/editors/HybridModeEditor.jsx
  - 组合其他编辑器组件
  - _Requirements: 1, 2, 3_
  - _Leverage: src/components/pricing/editors/_

- [ ] 26. 创建 PriceCalculator 组件
  - 创建 src/components/pricing/PriceCalculator.jsx
  - 实现组件框架和状态管理
  - _Requirements: 5_
  - _Leverage: src/components/EnhancedStatsPanel.jsx_

- [ ] 27. 实现数量输入功能
  - 在 PriceCalculator.jsx 中添加数量输入和验证
  - _Requirements: 5_
  - _Leverage: src/components/pricing/PriceCalculator.jsx_

- [ ] 28. 实现价格明细显示
  - 在 PriceCalculator.jsx 中添加价格分解显示
  - _Requirements: 5_
  - _Leverage: src/components/pricing/PriceCalculator.jsx_

- [ ] 29. 实现价格对比图表
  - 在 PriceCalculator.jsx 中添加不同模式对比
  - _Requirements: 5_
  - _Leverage: src/components/pricing/PriceCalculator.jsx_

- [ ] 30. 扩展 SkidPricingMatrix 组件
  - 在 src/components/pricing/skid/SkidPricingMatrix.jsx 中添加模式切换支持
  - _Requirements: 1_
  - _Leverage: src/components/pricing/skid/SkidPricingMatrix.jsx_

- [ ] 31. 更新 FSAGroupPricingPanel
  - 在 src/components/pricing/skid/FSAGroupPricingPanel.jsx 中添加新定价模式支持
  - _Requirements: 1, 2_
  - _Leverage: src/components/pricing/skid/FSAGroupPricingPanel.jsx_

- [ ] 32. 集成到定价页面
  - 在 src/pages/TruckDelivery/SkidPricing.jsx 中集成 PricingModeSelector
  - _Requirements: 1, 4_
  - _Leverage: src/pages/TruckDelivery/Dashboard.jsx_

- [ ] 33. 添加到管理中心
  - 在 src/pages/Management/ManagementHub.jsx 中添加价格计算器入口
  - _Requirements: 5_
  - _Leverage: src/pages/Management/ManagementHub.jsx_

- [ ] 34. 更新路由配置
  - 在 src/router/index.jsx 中添加新路由
  - _Requirements: 1_
  - _Leverage: src/router/index.jsx_

- [ ] 35. 创建 usePricingMode Hook
  - 创建 src/hooks/usePricingMode.js
  - 实现定价模式状态管理
  - _Requirements: 4_
  - _Leverage: src/hooks/useDashboard.js_

- [ ] 36. 实现价格缓存同步
  - 创建 src/utils/priceCacheSync.js
  - 实现前后端缓存同步逻辑
  - _Requirements: 5_
  - _Leverage: src/utils/dashboardCache.js_

- [ ] 37. 创建导出功能
  - 创建 src/utils/pricingExport.js
  - 实现导出为 Excel/CSV 格式
  - _Requirements: 6_
  - _Leverage: src/utils/_

- [ ] 38. 创建导入功能
  - 创建 src/utils/pricingImport.js
  - 实现从 Excel/CSV 导入
  - _Requirements: 6_
  - _Leverage: src/components/pricing/skid/SkidPricingMatrix.jsx_

- [ ] 39. 创建导入导出UI
  - 创建 src/components/pricing/ImportExportPanel.jsx
  - 实现文件上传和下载界面
  - _Requirements: 6_
  - _Leverage: src/components/_

- [ ] 40. 实现批量更新API
  - 在 backend/src/routes/pricingModes.js 中添加批量导入端点
  - _Requirements: 6_
  - _Leverage: backend/src/routes/skidPricing.js_

- [ ] 41. 编写价格计算测试
  - 创建 src/services/__tests__/calculationService.test.js
  - 测试各种定价模式计算逻辑
  - _Requirements: 5_
  - _Leverage: src/services/__tests__/_

- [ ] 42. 编写API集成测试
  - 创建 backend/src/routes/__tests__/pricingModes.test.js
  - 测试所有API端点
  - _Requirements: 1, 5_
  - _Leverage: backend/src/routes/__tests__/_

- [ ] 43. 编写组件测试
  - 创建 src/components/pricing/__tests__/PricingModeSelector.test.jsx
  - 测试组件交互和状态
  - _Requirements: 1, 4_
  - _Leverage: src/components/__tests__/_

- [ ] 44. 实现性能监控
  - 创建 src/utils/performanceMonitor.js
  - 添加价格计算时间监控
  - _Requirements: 5_
  - _Leverage: src/utils/_

- [ ] 45. 添加错误跟踪
  - 创建 src/utils/errorTracking.js
  - 实现定价错误收集和上报
  - _Requirements: 1_
  - _Leverage: src/utils/_