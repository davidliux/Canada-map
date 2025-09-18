# 统一定价API接口规范 - 任务分解

## 任务清单

### 阶段1：数据库和模型层 (Database & Models)

- [x] 1.1 更新数据库表结构
  - 创建文件: `backend/migrations/add_pricing_tables.sql`
  - 添加pricing_query_logs和pricing_cache表，更新truck_pricing_configs表字段
  - _Requirements: 2.1, 2.5_

- [x] 1.2 创建价格配置数据模型
  - 创建文件: `backend/src/models/pricing/PricingConfig.js`
  - 创建PricingConfig模型类，包含CRUD操作方法
  - _Requirements: 4.1, 4.3_

- [ ] 1.3 创建查询日志数据模型
  - 创建文件: `backend/src/models/pricing/QueryLog.js`
  - 创建QueryLog模型用于记录查询历史和性能数据
  - _Requirements: 2.5, 9.1_

### 阶段2：业务逻辑层 - 定价策略 (Pricing Strategies)

- [ ] 2.1 创建定价策略接口
  - 创建文件: `backend/src/services/pricing/strategies/IPricingStrategy.js`
  - 定义策略接口，包含calculate和validateParams方法
  - _Requirements: 2.2_

- [ ] 2.2 实现板数定价策略
  - 创建文件: `backend/src/services/pricing/strategies/SkidPricingStrategy.js`
  - 实现基于板数范围的价格计算逻辑
  - _Requirements: 2.2_
  - _Leverage: backend/src/routes/skidPricing.js_

- [ ] 2.3 实现渐进式定价策略
  - 创建文件: `backend/src/services/pricing/strategies/ProgressivePricingStrategy.js`
  - 实现基于距离和重量的递进价格计算
  - _Requirements: 2.2_

- [ ] 2.4 实现固定价格策略
  - 创建文件: `backend/src/services/pricing/strategies/FixedPricingStrategy.js`
  - 实现固定金额返回逻辑
  - _Requirements: 2.2_

- [ ] 2.5 创建策略工厂
  - 创建文件: `backend/src/services/pricing/strategies/StrategyFactory.js`
  - 根据配置模式选择对应策略实现
  - _Requirements: 2.2, 3.5_

### 阶段3：业务逻辑层 - 核心服务 (Core Services)

- [ ] 3.1 实现配置加载器
  - 创建文件: `backend/src/services/pricing/ConfigLoader.js`
  - 从数据库加载配置，处理优先级逻辑
  - _Requirements: 2.3_
  - _Leverage: backend/src/routes/truckDelivery.js_

- [ ] 3.2 实现缓存服务
  - 创建文件: `backend/src/services/pricing/CacheService.js`
  - 实现Redis缓存的get/set/invalidate方法
  - _Requirements: 3.1, 3.2_

- [ ] 3.3 实现主价格服务
  - 创建文件: `backend/src/services/pricing/PricingService.js`
  - 整合策略、缓存、配置，实现价格查询主逻辑
  - _Requirements: 2.1, 2.3, 2.4_
  - _Leverage: src/services/pricingService.js_

- [ ] 3.4 实现价格计算工具
  - 创建文件: `backend/src/utils/pricing/calculator.js`
  - 提供价格计算的辅助函数
  - _Requirements: 2.2_
  - _Leverage: backend/src/routes/priceCalculationHelper.js_

- [ ] 3.5 实现参数验证工具
  - 创建文件: `backend/src/utils/pricing/validator.js`
  - 验证请求参数，防止SQL注入
  - _Requirements: 3.3, 3.4_

### 阶段4：API路由层 (API Routes)

- [ ] 4.1 创建价格查询路由
  - 创建文件: `backend/src/routes/pricing/index.js`
  - 实现GET /api/v1/pricing/query端点
  - _Requirements: 2.1, 5.1_

- [ ] 4.2 创建批量查询路由
  - 创建文件: `backend/src/routes/pricing/batch.js`
  - 实现POST /api/v1/pricing/batch-query端点
  - _Requirements: 2.4, 5.1_

- [ ] 4.3 创建配置查询路由
  - 创建文件: `backend/src/routes/pricing/configs.js`
  - 实现GET /api/v1/pricing/configs/:targetId端点
  - _Requirements: 5.1_

- [ ] 4.4 创建请求验证中间件
  - 创建文件: `backend/src/routes/pricing/validators.js`
  - 使用express-validator验证请求参数
  - _Requirements: 3.4, 5.2_

- [ ] 4.5 创建认证限流中间件
  - 创建文件: `backend/src/routes/pricing/middleware.js`
  - 实现JWT认证和请求频率限制
  - _Requirements: 3.4_

### 阶段5：前端类型定义 (Frontend Types)

- [ ] 5.1 创建TypeScript类型定义
  - 创建文件: `src/types/pricing.ts`
  - 定义所有价格相关的TypeScript接口
  - _Requirements: 4.1, 4.2_

- [ ] 5.2 创建API常量定义
  - 创建文件: `src/constants/pricing.ts`
  - 定义API端点URL和配置常量
  - _Requirements: 5.1_

### 阶段6：前端API服务层 (Frontend API Service)

- [ ] 6.1 创建价格API服务类
  - 创建文件: `src/services/api/pricingApi.ts`
  - 封装价格查询相关的API调用
  - _Requirements: 2.1, 2.4_

- [ ] 6.2 创建API错误处理器
  - 创建文件: `src/services/api/pricingErrorHandler.ts`
  - 统一处理API错误响应
  - _Requirements: 5.2_

- [ ] 6.3 创建请求拦截器
  - 创建文件: `src/services/api/pricingInterceptor.ts`
  - 添加认证token和请求日志
  - _Requirements: 3.4_

### 阶段7：前端组件开发 (Frontend Components)

- [x] 7.1 创建价格显示组件
  - 创建文件: `src/components/pricing/PriceDisplay.tsx`
  - 展示价格信息和计算详情
  - _Requirements: 4.2_

- [ ] 7.2 创建价格查询表单组件
  - 创建文件: `src/components/pricing/PriceQueryForm.tsx`
  - 提供价格查询参数输入界面
  - _Requirements: 4.1_

- [ ] 7.3 创建价格对比组件
  - 创建文件: `src/components/pricing/PriceComparison.tsx`
  - 展示多个FSA的价格对比
  - _Requirements: 2.4_

- [ ] 7.4 创建价格历史组件
  - 创建文件: `src/components/pricing/PriceHistory.tsx`
  - 展示价格变化趋势图表
  - _Requirements: 2.5_

### 阶段8：前端状态管理 (State Management)

- [ ] 8.1 创建价格状态管理
  - 创建文件: `src/store/slices/pricingSlice.ts`
  - 使用Redux管理价格查询状态
  - _Requirements: 4.2_

- [ ] 8.2 创建价格缓存逻辑
  - 创建文件: `src/store/middleware/pricingCache.ts`
  - 实现前端价格数据缓存
  - _Requirements: 3.1_

### 阶段9：前端页面集成 (Page Integration)

- [ ] 9.1 更新FSA价格查询面板
  - 修改文件: `src/components/FSAPricingPanel.jsx`
  - 集成新的价格API到现有面板
  - _Requirements: 2.1_
  - _Leverage: src/components/FSAPricingPanel.jsx_

- [ ] 9.2 更新价格服务调用
  - 修改文件: `src/services/pricingService.js`
  - 替换现有API调用为新接口
  - _Requirements: 2.1, 2.4_
  - _Leverage: src/services/pricingService.js_

- [ ] 9.3 更新卡车派送大屏
  - 修改文件: `src/pages/TruckDelivery/Dashboard.jsx`
  - 集成新的价格显示组件
  - _Requirements: 2.1_
  - _Leverage: src/pages/TruckDelivery/Dashboard.jsx_

### 阶段10：测试开发 (Testing)

- [ ] 10.1 创建后端单元测试
  - 创建文件: `backend/tests/services/pricing/PricingService.test.js`
  - 测试各个策略和服务类
  - _Requirements: 8.1_

- [ ] 10.2 创建API集成测试
  - 创建文件: `backend/tests/routes/pricing/api.test.js`
  - 测试API端点的端到端流程
  - _Requirements: 8.2_

- [ ] 10.3 创建前端组件测试
  - 创建文件: `src/components/pricing/__tests__/PriceDisplay.test.tsx`
  - 测试React组件渲染和交互
  - _Requirements: 8.1_

### 阶段11：文档和配置 (Documentation & Configuration)

- [ ] 11.1 创建API文档
  - 创建文件: `docs/api/pricing-api.yaml`
  - 编写OpenAPI/Swagger规范文档
  - _Requirements: 10.1_

- [ ] 11.2 创建集成指南
  - 创建文件: `docs/integration/pricing-integration-guide.md`
  - 编写第三方系统集成指南
  - _Requirements: 3.5_

- [ ] 11.3 创建环境配置模板
  - 修改文件: `.env.example`
  - 添加价格服务相关的环境变量
  - _Requirements: 11.1_

- [ ] 11.4 更新Docker配置
  - 修改文件: `docker-compose.yml`
  - 添加Redis服务和相关配置
  - _Requirements: 11.2_

### 阶段12：数据迁移和部署 (Migration & Deployment)

- [ ] 12.1 创建数据迁移脚本
  - 创建文件: `backend/migrations/migrate_pricing_data.js`
  - 迁移现有价格数据到新表结构
  - _Requirements: 12.1_

- [ ] 12.2 创建部署脚本
  - 创建文件: `scripts/deploy-pricing-api.sh`
  - 自动化部署流程脚本
  - _Requirements: 12.2_

- [ ] 12.3 创建监控配置
  - 创建文件: `backend/src/monitoring/pricing-metrics.js`
  - 配置性能监控和错误追踪
  - _Requirements: 9.1, 9.2_