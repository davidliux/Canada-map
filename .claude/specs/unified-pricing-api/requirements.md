# 统一定价API接口规范 - 需求文档

## 1. 项目概述

### 1.1 背景
当前的价格查询系统使用多个数据表和接口，缺乏统一标准。需要建立一个标准化的定价API接口，支持多种定价模式，并为未来接入第三方系统提供清晰的接口规范。

### 1.2 目标
- 建立统一的价格查询API接口
- 标准化数据类型和响应格式
- 支持多种定价模式（板数定价、渐进式定价、固定价格等）
- 提供清晰的API文档供第三方系统对接
- 基于新的truck_pricing_configs表进行查询

### 1.3 范围
- 后端API接口重构
- 前端数据类型定义
- 价格展示界面重构
- API文档生成
- 数据库查询优化

## 2. 功能需求

### 2.1 价格查询API
**作为** 前端应用或第三方系统
**我想要** 通过统一的API接口查询价格
**以便** 获得标准化的价格信息

#### 接受标准
- WHEN 调用价格查询API
- THEN 返回标准化的价格数据结构
- AND 包含定价模式信息
- AND 包含适用条件信息

### 2.2 多模式价格计算
**作为** 业务系统
**我想要** 支持不同的定价模式计算
**以便** 灵活配置价格策略

#### 接受标准
- IF 配置为板数定价模式
- THEN 根据板数范围返回对应价格
- IF 配置为渐进式定价模式
- THEN 根据距离或重量计算递进价格
- IF 配置为固定价格模式
- THEN 返回固定金额

### 2.3 价格优先级处理
**作为** 价格计算系统
**我想要** 按优先级返回最适用的价格
**以便** 实现灵活的定价策略

#### 接受标准
- WHEN 存在多个价格配置
- THEN 按以下优先级返回：
  1. FSA特定价格
  2. 分组自定义价格
  3. 区域通用价格
  4. 城市默认价格

### 2.4 批量价格查询
**作为** 前端应用
**我想要** 一次查询多个FSA的价格
**以便** 提高查询效率

#### 接受标准
- WHEN 提供多个FSA代码
- THEN 返回每个FSA的价格信息
- AND 单次请求处理时间小于500ms

### 2.5 价格历史查询
**作为** 业务分析系统
**我想要** 查询价格的历史版本
**以便** 进行价格变化分析

#### 接受标准
- WHEN 指定日期范围
- THEN 返回该时期的价格配置
- AND 包含版本信息和修改记录

## 3. 非功能性需求

### 3.1 性能要求
- 单次查询响应时间 < 200ms
- 批量查询（最多50个FSA）响应时间 < 500ms
- 支持并发请求数 >= 100/秒

### 3.2 数据一致性
- 价格数据必须与truck_pricing_configs表保持一致
- 缓存更新延迟 < 5秒
- 支持事务性操作确保数据完整性

### 3.3 接口标准
- RESTful API设计
- JSON格式响应
- 支持版本控制(v1, v2等)
- 标准HTTP状态码
- 详细的错误信息

### 3.4 安全性
- API认证机制（可选JWT token）
- 请求频率限制
- 输入参数验证
- SQL注入防护

### 3.5 可扩展性
- 支持新增定价模式
- 支持自定义价格规则
- 支持第三方系统集成
- 向后兼容性

## 4. 数据需求

### 4.1 输入数据
```typescript
interface PriceQueryRequest {
  fsaCode?: string;           // FSA代码
  fsaCodes?: string[];        // 批量FSA代码
  cityId?: string;           // 城市ID
  zoneId?: string;           // 区域ID
  groupId?: string;          // 分组ID
  skidCount?: number;        // 板数
  distance?: number;         // 距离(km)
  weight?: number;           // 重量(kg)
  queryDate?: Date;          // 查询日期（用于历史价格）
}
```

### 4.2 输出数据
```typescript
interface PriceResponse {
  success: boolean;
  data: {
    fsaCode: string;
    price: number;
    currency: string;
    pricingMode: 'skid' | 'progressive' | 'fixed' | 'custom';
    configSource: {
      level: 'fsa' | 'group' | 'zone' | 'city';
      id: string;
      name: string;
      priority: number;
    };
    calculation: {
      basePrice: number;
      adjustments: Array<{
        type: string;
        amount: number;
        reason: string;
      }>;
      finalPrice: number;
    };
    validity: {
      startDate: string;
      endDate?: string;
      version: string;
    };
    metadata: {
      configId: string;
      lastUpdated: string;
      appliedRules: string[];
    };
  };
  errors?: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
}
```

### 4.3 数据库表结构
基于truck_pricing_configs表：
- id: 配置ID
- level: 配置级别（city/zone/group/fsa）
- target_id: 目标ID
- target_name: 目标名称
- mode: 定价模式
- config: JSONB配置数据
- priority: 优先级
- is_active: 是否激活
- created_at: 创建时间
- updated_at: 更新时间
- version: 版本号

## 5. 接口规范

### 5.1 API端点
- GET `/api/v1/pricing/query` - 单个价格查询
- POST `/api/v1/pricing/batch-query` - 批量价格查询
- GET `/api/v1/pricing/history` - 历史价格查询
- GET `/api/v1/pricing/configs` - 获取价格配置
- GET `/api/v1/pricing/modes` - 获取支持的定价模式

### 5.2 响应标准
- 200: 成功
- 400: 请求参数错误
- 401: 未授权
- 404: 未找到价格配置
- 429: 请求过于频繁
- 500: 服务器错误

## 6. 约束条件

### 6.1 技术约束
- 必须兼容现有的PostgreSQL数据库
- 必须支持现有的React前端框架
- 必须保持与现有系统的向后兼容

### 6.2 业务约束
- 价格查询必须实时反映最新配置
- 必须保留价格变更的审计日志
- 支持多币种（CAD为主）

## 7. 验收标准

### 7.1 功能验收
- [ ] 统一API接口可正常查询价格
- [ ] 支持所有定价模式的计算
- [ ] 价格优先级逻辑正确
- [ ] 批量查询功能正常
- [ ] 历史价格查询准确

### 7.2 性能验收
- [ ] 单次查询响应时间符合要求
- [ ] 批量查询性能达标
- [ ] 并发处理能力满足需求

### 7.3 文档验收
- [ ] API文档完整清晰
- [ ] 包含所有接口说明
- [ ] 提供调用示例
- [ ] 错误码说明完整

### 7.4 集成验收
- [ ] 前端成功对接新API
- [ ] 数据展示正确
- [ ] 错误处理完善
- [ ] 向后兼容性验证

## 8. 风险与缓解

### 8.1 技术风险
- **风险**: 数据迁移可能导致数据不一致
- **缓解**: 实施数据验证和回滚机制

### 8.2 性能风险
- **风险**: 复杂查询可能影响响应时间
- **缓解**: 实施缓存策略和查询优化

### 8.3 兼容性风险
- **风险**: 新接口可能破坏现有集成
- **缓解**: 版本控制和渐进式迁移

## 9. 依赖关系

- PostgreSQL数据库
- truck_pricing_configs表结构
- 现有的认证系统
- Redis缓存（可选）
- 前端React应用

## 10. 时间线建议

- 阶段1：API设计和后端实现（2天）
- 阶段2：前端集成和数据类型定义（2天）
- 阶段3：测试和优化（1天）
- 阶段4：文档编写和部署（1天）