# 服务商管理系统需求文档

## 1. 概述

### 1.1 背景
当前系统的动态定价配置仅支持基于板数的阶梯定价，无法满足多服务商的不同定价模式需求。每个服务商有独特的定价结构、服务区域和附加费用，需要一个灵活的服务商管理系统来支持。

### 1.2 目标
- 支持多服务商独立管理
- 支持多种定价模式（重量区间、首续模式、固定价格表、线性定价）
- 灵活的服务区域配置
- 附加费用管理
- 便于服务商的添加、修改和移除

## 2. 功能需求

### 2.1 服务商管理

#### 用户故事
作为系统管理员，我需要管理多个物流服务商，以便为不同区域和需求选择合适的服务商。

#### 验收标准
- WHEN 添加新服务商 THEN 系统应保存服务商基本信息（名称、代码、联系方式、状态）
- WHEN 修改服务商信息 THEN 系统应记录修改历史
- WHEN 停用服务商 THEN 系统应保留历史数据但不再显示在可选列表中
- IF 服务商有未完成订单 THEN 不允许删除该服务商

### 2.2 定价模式配置

#### 用户故事
作为定价管理员，我需要为每个服务商配置不同的定价模式，以适应各服务商的计费规则。

#### 验收标准
- WHEN 配置重量区间定价 THEN 系统应支持按Skids数量和Zone矩阵定价
- WHEN 配置首续模式 THEN 系统应支持首托价格+续托价格的计算
- WHEN 配置固定价格表 THEN 系统应支持导入Excel/CSV价格表
- WHEN 配置线性定价 THEN 系统应支持每单位固定价格计算
- IF 定价配置有冲突 THEN 系统应提示并阻止保存

### 2.3 服务区域管理

#### 用户故事
作为运营人员，我需要为每个服务商配置独立的服务区域，以确定订单分配。

#### 验收标准
- WHEN 配置服务区域 THEN 系统应支持按城市、FSA、邮政编码范围设置
- WHEN 服务商有多个Zone THEN 系统应支持独立的Zone划分和命名
- IF 多个服务商覆盖同一区域 THEN 系统应支持优先级设置
- WHEN 查询某地址的服务商 THEN 系统应返回所有可用服务商列表

### 2.4 附加费用管理

#### 用户故事
作为财务人员，我需要配置各种附加费用，以准确计算总运费。

#### 验收标准
- WHEN 配置附加费用 THEN 系统应支持固定金额和百分比两种方式
- WHEN 设置费用条件 THEN 系统应支持基于订单属性的条件判断
- IF 多个附加费用适用 THEN 系统应支持叠加或选择最高值
- WHEN 计算总价 THEN 系统应明确显示各项附加费用明细

### 2.5 价格计算引擎

#### 用户故事
作为系统用户，我需要根据订单信息自动计算最优运费方案。

#### 验收标准
- WHEN 输入订单信息 THEN 系统应返回所有可用服务商的报价
- WHEN 计算价格 THEN 系统应根据服务商的定价模式准确计算
- IF 有多个服务商可选 THEN 系统应排序显示（价格/时效/服务质量）
- WHEN 选择服务商 THEN 系统应锁定该订单的服务商和价格

## 3. 非功能需求

### 3.1 性能要求
- 价格计算响应时间 < 500ms
- 支持同时管理 50+ 个服务商
- 每个服务商支持 1000+ 个区域配置

### 3.2 可用性要求
- 提供批量导入/导出功能
- 支持配置模板和复制功能
- 提供价格预览和测试功能

### 3.3 可维护性要求
- 服务商配置版本控制
- 配置变更审计日志
- 支持配置回滚

### 3.4 兼容性要求
- 兼容现有的区域管理系统
- 支持逐步迁移现有定价规则
- API向后兼容

## 4. 数据需求

### 4.1 服务商数据模型
```javascript
{
  id: "provider_001",
  code: "PDN",
  name: "Provider Delivery Network",
  status: "active", // active, inactive, suspended
  contactInfo: {},
  serviceAreas: [],
  pricingModels: [],
  surcharges: [],
  metadata: {
    createdAt: "",
    updatedAt: "",
    createdBy: "",
    version: 1
  }
}
```

### 4.2 定价模型数据结构
```javascript
{
  id: "pricing_model_001",
  providerId: "provider_001",
  type: "weight_zone", // weight_zone, first_cont, fixed_table, linear
  unit: "skids", // skids, pallets, plates, kg
  configuration: {
    // 根据type不同而不同
  },
  effectiveDate: "",
  expiryDate: "",
  priority: 1
}
```

### 4.3 附加费用数据结构
```javascript
{
  id: "surcharge_001",
  providerId: "provider_001",
  name: "住宅送货费",
  code: "RESIDENTIAL",
  type: "fixed", // fixed, percentage
  value: 50,
  conditions: [
    {
      field: "deliveryType",
      operator: "equals",
      value: "residential"
    }
  ],
  stackable: true,
  priority: 1
}
```

## 5. 接口需求

### 5.1 服务商管理API
- GET /api/providers - 获取服务商列表
- GET /api/providers/{id} - 获取服务商详情
- POST /api/providers - 创建服务商
- PUT /api/providers/{id} - 更新服务商
- DELETE /api/providers/{id} - 删除服务商
- POST /api/providers/{id}/activate - 激活服务商
- POST /api/providers/{id}/deactivate - 停用服务商

### 5.2 定价配置API
- GET /api/providers/{id}/pricing-models - 获取定价模型
- POST /api/providers/{id}/pricing-models - 创建定价模型
- PUT /api/pricing-models/{id} - 更新定价模型
- DELETE /api/pricing-models/{id} - 删除定价模型
- POST /api/pricing-models/import - 批量导入价格表
- GET /api/pricing-models/{id}/export - 导出价格配置

### 5.3 价格计算API
- POST /api/pricing/calculate - 计算运费
- POST /api/pricing/compare - 比较多个服务商价格
- GET /api/pricing/preview - 预览价格表
- POST /api/pricing/test - 测试定价配置

## 6. UI/UX需求

### 6.1 服务商管理界面
- 服务商列表页面（支持搜索、筛选、排序）
- 服务商详情页面（基本信息、服务区域、定价配置）
- 服务商配置向导（引导式配置流程）

### 6.2 定价配置界面
- 可视化价格配置（表格、图表）
- 价格模拟器（输入测试数据查看计算结果）
- 批量操作工具（导入、导出、复制）

### 6.3 报价比较界面
- 多服务商报价对比表
- 价格明细展开视图
- 推荐理由说明

## 7. 迁移需求

### 7.1 数据迁移
- 现有定价规则映射到新系统
- 保留历史订单的价格计算记录
- 支持分阶段迁移

### 7.2 兼容性保证
- 提供旧API到新API的适配层
- 支持新旧系统并行运行
- 提供回滚机制

## 8. 测试需求

### 8.1 单元测试
- 价格计算引擎的各种模式测试
- 附加费用叠加逻辑测试
- 区域匹配算法测试

### 8.2 集成测试
- 多服务商场景测试
- API接口测试
- 数据一致性测试

### 8.3 性能测试
- 大批量价格计算性能测试
- 并发请求处理测试
- 数据库查询优化测试

## 9. 风险和约束

### 9.1 技术风险
- 复杂定价逻辑可能影响性能
- 多服务商数据同步挑战
- 价格计算准确性保证

### 9.2 业务风险
- 服务商定价规则频繁变更
- 新旧系统切换期间的订单处理
- 价格配置错误导致的财务损失

### 9.3 约束条件
- 需要与现有系统集成
- 保持API向后兼容
- 符合现有技术栈（React + Node.js）

## 10. 实施计划

### 阶段1：基础架构（2周）
- 服务商管理基础功能
- 数据模型设计和实现
- 基础API开发

### 阶段2：定价引擎（3周）
- 多种定价模式实现
- 价格计算引擎开发
- 附加费用管理

### 阶段3：UI开发（2周）
- 管理界面开发
- 配置工具开发
- 测试工具开发

### 阶段4：集成测试（1周）
- 系统集成测试
- 性能优化
- 文档完善

### 阶段5：上线部署（1周）
- 数据迁移
- 灰度发布
- 监控和优化