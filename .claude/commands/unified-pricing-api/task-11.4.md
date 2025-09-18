# unified-pricing-api - Task 11.4

Execute task 11.4 for the unified-pricing-api specification.

## Task Description
更新Docker配置

## Requirements Reference
**Requirements**: 11.2

## Usage
```
/Task:11.4-unified-pricing-api
```

## Instructions

Execute with @spec-task-executor agent the following task: "更新Docker配置"

```
Use the @spec-task-executor agent to implement task 11.4: "更新Docker配置" for the unified-pricing-api specification and include all the below context.

# Steering Context
## Steering Documents Context (Pre-loaded)

### Product Context
# Product Steering Document

## 产品愿景
加拿大快递配送区域地图系统是一个专业的物流配送管理平台，通过可视化地图技术帮助物流公司高效管理配送区域、优化定价策略，提升运营效率。

## 目标用户
- **主要用户**：物流公司运营管理人员
- **次要用户**：配送调度员、客服人员
- **管理用户**：系统管理员、价格策略制定者

## 核心功能

### 现有功能
1. **FSA区域管理**
   - 基于加拿大邮政FSA（Forward Sortation Area）的配送区域划分
   - 可视化展示1600+个FSA多边形边界
   - 区域分组管理（8个默认区域）

2. **价格配置系统**
   - 基于重量区间的阶梯定价
   - 批量导入/导出价格配置
   - 实时价格计算引擎

3. **邮编管理**
   - 完整的加拿大邮编数据库
   - FSA与邮编的映射关系
   - 邮编搜索和筛选

4. **数据管理**
   - 统一存储架构
   - 数据导入导出
   - 自动备份恢复

### 新增功能（卡车派送）
1. **城市级别管理**
   - 以城市为单位的配送区域组织
   - 城市自定义颜色主题
   - 城市下辖多个价格区域

2. **分级区域定价**
   - 每个城市包含1-4个价格区域
   - 区域按价格递增排序（1区最便宜）
   - 视觉化价格梯度（颜色深浅）

3. **增强的搜索功能**
   - 特定邮编快速定位
   - 城市/区域/邮编多级筛选
   - 实时搜索结果高亮

## 业务目标
1. **提升效率**：减少80%的配送区域配置时间
2. **降低成本**：通过优化定价策略降低15%运营成本
3. **改善体验**：提供直观的可视化界面，降低培训成本
4. **扩展性**：支持多种配送模式（标准配送、卡车派送等）

## 成功指标
- 区域配置效率提升度
- 价格策略准确率
- 用户操作错误率降低
- 系统响应时间 < 2秒
- 地图加载时间 < 5秒

## 产品路线图
### Phase 1 (已完成)
- ✅ FSA基础地图展示
- ✅ 区域管理功能
- ✅ 价格配置系统
- ✅ 数据导入导出

### Phase 2 (进行中)
- 🚀 卡车派送模块
- 🚀 城市级别管理
- 🚀 分级定价系统

### Phase 3 (计划中)
- 路线优化算法
- 实时配送追踪
- 客户自助查询
- 移动端应用

---

### Technology Context
# Technology Steering Document

## 技术栈

### 前端技术
- **框架**: React 18.2
- **构建工具**: Vite 5.0
- **路由**: React Router v7
- **样式**: 
  - Tailwind CSS 3.3
  - Cyber/Tech主题设计
- **地图引擎**: 
  - Leaflet 1.9.4
  - React Leaflet 4.2.1
- **动画**: Framer Motion 10.16
- **HTTP客户端**: Axios 1.6.0
- **图标**: Lucide React

### 数据管理
- **状态管理**: React Hooks + Context API
- **本地存储**: localStorage (统一存储架构)
- **数据格式**: JSON
- **地理数据**: GeoJSON格式的FSA边界数据

### 开发工具
- **代码规范**: ESLint
- **包管理**: npm
- **并发执行**: Concurrently
- **桌面应用**: Electron (计划中)

## 架构决策

### 统一存储架构
**决策**: 使用单一的localStorage管理系统替代分散的存储方案

**原因**:
- 简化数据同步逻辑
- 提供统一的数据访问接口
- 便于实现数据恢复和备份

**实现**:
```javascript
// 核心存储模块
src/utils/unifiedStorage.js
src/utils/dataUpdateNotifier.js
src/utils/dataRecovery.js
```

### 组件化架构
**决策**: 采用功能性组件和Hooks模式

**原因**:
- 更好的代码复用性
- 简化状态管理
- 提升开发效率

### 地图渲染策略
**决策**: 使用Leaflet配合GeoJSON渲染FSA边界

**原因**:
- Leaflet性能优秀，支持大量多边形渲染
- GeoJSON是地理数据的标准格式
- React Leaflet提供良好的React集成

## 性能要求

### 响应时间
- 页面加载: < 3秒
- 地图初始化: < 5秒
- 搜索响应: < 500ms
- 数据保存: < 1秒

### 容量限制
- FSA多边形: ~1600个
- 邮编数据: ~850,000条
- localStorage限制: 5-10MB
- 地图缩放级别: 4-18

### 优化策略
- **视口剔除**: 只渲染可见区域的FSA
- **数据分块**: 大数据批量处理时分块进行
- **防抖节流**: 搜索输入使用300ms防抖
- **懒加载**: 按需加载地图瓦片和数据

## 技术约束

### 浏览器兼容性
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### 数据限制
- localStorage大小限制 (5-10MB)
- 单次API请求限制 (100个项目)
- 地图瓦片并发请求限制 (6个)

### 安全要求
- 所有API通信使用HTTPS
- 敏感数据不存储在localStorage
- 实施CORS策略
- XSS防护

## 第三方服务

### 地图服务
- **瓦片服务器**: CartoDB Dark Matter
- **地理编码**: 内置邮编数据库
- **坐标系统**: WGS84 (EPSG:4326)

### 数据源
- **FSA边界**: Statistics Canada 2021 Census
- **邮编数据**: Canada Post官方数据
- **城市数据**: 自维护数据库

### 后端服务 (计划中)
- **数据库**: PostgreSQL + PostGIS
- **API框架**: Node.js + Express
- **ORM**: Prisma
- **缓存**: Redis

## 开发规范

### 代码风格
- ES6+语法
- 函数式编程优先
- 组件名使用PascalCase
- 文件名使用camelCase或PascalCase

### Git工作流
- 主分支: main
- 功能分支: feature/xxx
- 修复分支: fix/xxx
- 提交信息遵循conventional commits

### 测试策略
- 单元测试 (计划中): Jest + React Testing Library
- E2E测试 (计划中): Cypress
- 性能测试: Lighthouse

## 部署架构

### 当前部署
- **静态托管**: Vercel/Netlify
- **构建**: Vite production build
- **CDN**: 自动配置

### 未来架构
- **前端**: CDN + 静态托管
- **后端**: Cloud Run/AWS Lambda
- **数据库**: Cloud SQL/RDS
- **缓存**: Cloud Memorystore/ElastiCache

---

### Structure Context
# Project Structure Steering Document

## 目录结构

```
/
├── .claude/                    # Claude AI配置
│   └── steering/              # 项目指导文档
├── public/                    # 静态资源
│   └── data/                  # FSA边界数据文件
├── src/                       # 源代码
│   ├── components/            # React组件
│   ├── data/                  # 静态数据文件
│   ├── layouts/               # 布局组件
│   ├── pages/                 # 页面组件
│   ├── router/                # 路由配置
│   ├── services/              # 服务层
│   └── utils/                 # 工具函数
├── backend/                   # 后端服务 (如果存在)
└── dist/                      # 构建输出
```

## 文件组织规范

### 组件文件 (`src/components/`)
```
components/
├── maps/                      # 地图相关组件
│   ├── AccurateFSAMap.jsx    # FSA地图主组件
│   └── TruckDeliveryMap.jsx  # 卡车派送地图（新增）
├── regions/                   # 区域管理组件
│   ├── RegionManagementPanel.jsx
│   └── RegionSelector.jsx
├── cities/                    # 城市管理组件（新增）
│   ├── CityManager.jsx
│   └── CityRegionEditor.jsx
└── common/                    # 通用组件
    ├── SearchPanel.jsx
    └── ImportExportManager.jsx
```

### 页面文件 (`src/pages/`)
```
pages/
├── Dashboard/                 # 仪表板
│   └── index.jsx
├── Settings/                  # 设置页面
│   ├── index.jsx
│   ├── RegionSettings.jsx
│   ├── PriceSettings.jsx
│   └── PostalSettings.jsx
└── TruckDelivery/            # 卡车派送（新增）
    ├── index.jsx
    ├── CityView.jsx
    └── RegionDetail.jsx
```

### 工具文件 (`src/utils/`)
```
utils/
├── storage/                   # 存储相关
│   ├── unifiedStorage.js     # 统一存储
│   ├── cityStorage.js        # 城市存储（新增）
│   └── truckDeliveryStorage.js # 卡车派送存储（新增）
├── api/                       # API相关
│   └── apiClient.js
└── helpers/                   # 辅助函数
    ├── geoHelpers.js
    └── priceCalculator.js
```

## 命名规范

### 文件命名
- **组件文件**: PascalCase (如 `RegionManager.jsx`)
- **工具文件**: camelCase (如 `dataHelper.js`)
- **样式文件**: camelCase (如 `styles.module.css`)
- **常量文件**: SCREAMING_SNAKE_CASE (如 `CONSTANTS.js`)

### 变量命名
```javascript
// 组件
const RegionManager = () => { ... }

// 函数
const calculateDeliveryPrice = (weight, region) => { ... }

// 常量
const MAX_REGIONS_PER_CITY = 4;

// 状态
const [selectedCity, setSelectedCity] = useState(null);
```

### CSS类命名
```css
/* BEM风格 + Tailwind */
.city-selector__header { }
.city-selector__item--active { }

/* Tailwind优先 */
className="flex flex-col gap-4 p-6 bg-gray-900"
```

## 数据模型规范

### FSA数据结构
```javascript
{
  fsa: 'M5V',
  province: 'ON',
  city: 'Toronto',
  lat: 43.6426,
  lng: -79.3871,
  postalCodes: ['M5V 3A8', 'M5V 1A1']
}
```

### 城市数据结构（新增）
```javascript
{
  id: 'city-uuid',
  name: 'Toronto',
  province: 'ON',
  color: '#FF5733',        // 城市主题色
  regions: [
    {
      id: 'region-1',
      level: 1,            // 1-4区
      name: '市中心配送区',
      fsaCodes: ['M5V', 'M5G'],
      postalCodes: [],
      priceMultiplier: 1.0, // 价格系数
      color: '#FFE5B4'     // 浅色表示便宜
    }
  ],
  metadata: {
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
}
```

### 价格配置结构
```javascript
{
  basePrice: 15.99,
  weightRanges: [
    { min: 0, max: 10, price: 15.99 },
    { min: 10, max: 20, price: 25.99 }
  ],
  regionMultipliers: {
    '1': 1.0,  // 1区无加价
    '2': 1.2,  // 2区加价20%
    '3': 1.5,  // 3区加价50%
    '4': 2.0   // 4区加价100%
  }
}
```

## 新功能集成指南

### 添加卡车派送功能步骤

1. **创建页面路由**
```javascript
// src/router/index.jsx
{
  path: 'truck-delivery',
  element: <TruckDelivery />
}
```

2. **添加导航菜单**
```javascript
// src/layouts/MainLayout.jsx
<NavLink to="/truck-delivery">卡车派送</NavLink>
```

3. **实现数据存储**
```javascript
// src/utils/storage/cityStorage.js
export const getCities = () => { ... }
export const updateCity = (cityId, data) => { ... }
```

4. **创建UI组件**
```javascript
// src/components/cities/CityManager.jsx
const CityManager = () => {
  // 城市CRUD逻辑
}
```

5. **集成地图展示**
```javascript
// src/components/maps/TruckDeliveryMap.jsx
const TruckDeliveryMap = ({ cities, selectedCity }) => {
  // 城市和区域可视化
}
```

## 代码组织原则

### 单一职责
每个组件/模块只负责一个功能领域

### 依赖注入
通过props传递依赖，避免硬编码

### 数据流向
- 自上而下的数据流
- 通过回调函数向上传递事件
- 使用Context API共享全局状态

### 错误处理
```javascript
try {
  const data = await fetchCityData(cityId);
  return data;
} catch (error) {
  console.error('获取城市数据失败:', error);
  // 显示用户友好的错误信息
  showNotification('加载失败，请重试');
  return null;
}
```

## 测试规范

### 单元测试
- 测试文件与源文件同目录
- 命名: `ComponentName.test.jsx`
- 覆盖率目标: 80%

### 集成测试
- 测试用户操作流程
- 使用React Testing Library
- 模拟API响应

### E2E测试
- 关键用户路径
- 使用Cypress
- 定期运行回归测试

**Note**: Steering documents have been pre-loaded. Do not use get-content to fetch them again.

# Specification Context
## Specification Context (Pre-loaded): unified-pricing-api

### Requirements
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

---

### Design
# 统一定价API接口规范 - 设计文档

## 1. 架构概述

### 1.1 系统架构
```mermaid
graph TB
    subgraph "客户端层"
        FE[React前端应用]
        TP[第三方系统]
        MB[移动应用]
    end

    subgraph "API层"
        GW[API网关]
        AUTH[认证中间件]
        RL[限流中间件]
        API[定价API服务]
    end

    subgraph "业务层"
        PS[定价策略引擎]
        PC[价格计算器]
        PV[价格验证器]
        CM[缓存管理器]
    end

    subgraph "数据层"
        PG[(PostgreSQL)]
        RD[(Redis缓存)]
        TPC[truck_pricing_configs]
    end

    FE --> GW
    TP --> GW
    MB --> GW
    GW --> AUTH
    AUTH --> RL
    RL --> API
    API --> PS
    PS --> PC
    PS --> PV
    PS --> CM
    CM --> RD
    PC --> PG
    PG --> TPC
```

### 1.2 核心设计原则
- **分层架构**: 清晰的层次分离，各层职责明确
- **策略模式**: 支持多种定价策略的灵活切换
- **缓存优先**: 减少数据库访问，提升响应速度
- **向后兼容**: 版本控制确保旧版本API持续可用
- **错误友好**: 详细的错误信息便于调试

## 2. API设计

### 2.1 RESTful端点设计

#### 2.1.1 单个价格查询
```http
GET /api/v1/pricing/query
```

**请求参数**:
```typescript
{
  fsaCode?: string;      // FSA代码
  cityId?: string;       // 城市ID
  zoneId?: string;       // 区域ID
  groupId?: string;      // 分组ID
  skidCount?: number;    // 板数
  distance?: number;     // 距离
  weight?: number;       // 重量
  queryDate?: string;    // 查询日期 (ISO 8601)
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "fsaCode": "M5V",
    "price": 125.50,
    "currency": "CAD",
    "pricingMode": "skid",
    "configSource": {
      "level": "group",
      "id": "grp_downtown_01",
      "name": "Downtown Group",
      "priority": 10
    },
    "calculation": {
      "basePrice": 120.00,
      "adjustments": [
        {
          "type": "fuel_surcharge",
          "amount": 5.50,
          "reason": "Current fuel price adjustment"
        }
      ],
      "finalPrice": 125.50
    },
    "validity": {
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-12-31T23:59:59Z",
      "version": "1.0.0"
    },
    "metadata": {
      "configId": "config_1234567890",
      "lastUpdated": "2024-01-15T10:30:00Z",
      "appliedRules": ["GROUP_CUSTOM", "FUEL_SURCHARGE"]
    }
  }
}
```

#### 2.1.2 批量价格查询
```http
POST /api/v1/pricing/batch-query
```

**请求体**:
```json
{
  "queries": [
    {
      "fsaCode": "M5V",
      "skidCount": 5
    },
    {
      "fsaCode": "L4L",
      "skidCount": 10
    }
  ],
  "commonParams": {
    "cityId": "toronto",
    "queryDate": "2024-01-20"
  }
}
```

#### 2.1.3 价格配置查询
```http
GET /api/v1/pricing/configs/{targetId}
```

#### 2.1.4 支持的定价模式
```http
GET /api/v1/pricing/modes
```

### 2.2 错误响应标准
```json
{
  "success": false,
  "errors": [
    {
      "code": "INVALID_FSA",
      "message": "FSA code 'XXX' is not valid",
      "field": "fsaCode"
    }
  ],
  "timestamp": "2024-01-20T10:30:00Z",
  "requestId": "req_abc123"
}
```

## 3. 数据库设计

### 3.1 主要表结构
```sql
-- truck_pricing_configs 表已存在，添加版本控制字段
ALTER TABLE truck_pricing_configs
ADD COLUMN IF NOT EXISTS effective_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS version VARCHAR(20);

-- 创建价格查询日志表
CREATE TABLE IF NOT EXISTS pricing_query_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_params JSONB NOT NULL,
    response_data JSONB,
    query_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    client_ip VARCHAR(45),
    user_agent TEXT
);

-- 创建价格缓存表
CREATE TABLE IF NOT EXISTS pricing_cache (
    cache_key VARCHAR(255) PRIMARY KEY,
    cache_value JSONB NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 索引优化
```sql
-- 优化查询性能的索引
CREATE INDEX idx_configs_effective ON truck_pricing_configs(effective_date, expiry_date);
CREATE INDEX idx_configs_composite ON truck_pricing_configs(level, target_id, is_active, priority DESC);
CREATE INDEX idx_query_logs_time ON pricing_query_logs(created_at DESC);
CREATE INDEX idx_cache_expires ON pricing_cache(expires_at);
```

## 4. 后端实现设计

### 4.1 服务层架构
```typescript
// 价格查询服务接口
interface IPricingService {
  querySinglePrice(params: PriceQueryRequest): Promise<PriceResponse>;
  queryBatchPrices(params: BatchQueryRequest): Promise<BatchPriceResponse>;
  getPricingConfig(targetId: string): Promise<PricingConfig>;
  getPricingModes(): Promise<PricingMode[]>;
}

// 价格计算策略接口
interface IPricingStrategy {
  calculate(params: CalculationParams): PriceCalculation;
  validateParams(params: any): ValidationResult;
  getPriority(): number;
}

// 缓存服务接口
interface ICacheService {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  invalidate(pattern: string): Promise<void>;
}
```

### 4.2 价格计算流程
```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Cache
    participant Service
    participant Strategy
    participant DB

    Client->>API: 价格查询请求
    API->>API: 参数验证
    API->>Cache: 检查缓存
    alt 缓存命中
        Cache-->>API: 返回缓存数据
    else 缓存未命中
        API->>Service: 调用价格服务
        Service->>DB: 查询配置
        DB-->>Service: 返回配置
        Service->>Strategy: 选择策略
        Strategy->>Strategy: 计算价格
        Strategy-->>Service: 返回结果
        Service->>Cache: 更新缓存
        Service-->>API: 返回结果
    end
    API-->>Client: 返回响应
```

### 4.3 策略模式实现
```typescript
// backend/src/services/pricing/strategies/

// 板数定价策略
class SkidPricingStrategy implements IPricingStrategy {
  calculate(params: CalculationParams): PriceCalculation {
    const { skidCount, config } = params;
    const priceConfig = config.skidPrices;

    // 查找对应的板数区间
    const priceRange = this.findPriceRange(skidCount, priceConfig);

    return {
      basePrice: priceRange.price,
      adjustments: [],
      finalPrice: priceRange.price,
      appliedRule: `SKID_${priceRange.range}`
    };
  }
}

// 渐进式定价策略
class ProgressivePricingStrategy implements IPricingStrategy {
  calculate(params: CalculationParams): PriceCalculation {
    const { distance, weight, config } = params;
    const { basePrice, pricePerKm, pricePerKg } = config;

    const distanceCharge = distance * pricePerKm;
    const weightCharge = weight * pricePerKg;

    return {
      basePrice,
      adjustments: [
        { type: 'distance', amount: distanceCharge },
        { type: 'weight', amount: weightCharge }
      ],
      finalPrice: basePrice + distanceCharge + weightCharge,
      appliedRule: 'PROGRESSIVE'
    };
  }
}

// 固定价格策略
class FixedPricingStrategy implements IPricingStrategy {
  calculate(params: CalculationParams): PriceCalculation {
    const { config } = params;

    return {
      basePrice: config.fixedPrice,
      adjustments: [],
      finalPrice: config.fixedPrice,
      appliedRule: 'FIXED'
    };
  }
}
```

### 4.4 文件结构
```
backend/src/
├── routes/
│   └── pricing/
│       ├── index.js              # 路由定义
│       ├── validators.js         # 请求验证
│       └── middleware.js         # 中间件
├── services/
│   └── pricing/
│       ├── PricingService.js     # 主服务类
│       ├── strategies/          # 定价策略
│       │   ├── SkidPricingStrategy.js
│       │   ├── ProgressivePricingStrategy.js
│       │   ├── FixedPricingStrategy.js
│       │   └── index.js
│       ├── CacheService.js      # 缓存服务
│       └── ConfigLoader.js      # 配置加载器
├── models/
│   └── pricing/
│       ├── PricingConfig.js     # 数据模型
│       └── QueryLog.js          # 查询日志
└── utils/
    └── pricing/
        ├── calculator.js         # 计算工具
        └── validator.js          # 验证工具
```

## 5. 前端实现设计

### 5.1 数据类型定义
```typescript
// src/types/pricing.ts

export interface PriceQueryParams {
  fsaCode?: string;
  cityId?: string;
  zoneId?: string;
  groupId?: string;
  skidCount?: number;
  distance?: number;
  weight?: number;
  queryDate?: Date;
}

export interface PriceInfo {
  fsaCode: string;
  price: number;
  currency: string;
  pricingMode: 'skid' | 'progressive' | 'fixed' | 'custom';
  configSource: ConfigSource;
  calculation: PriceCalculation;
  validity: PriceValidity;
  metadata: PriceMetadata;
}

export interface ConfigSource {
  level: 'fsa' | 'group' | 'zone' | 'city';
  id: string;
  name: string;
  priority: number;
}

export interface PriceCalculation {
  basePrice: number;
  adjustments: PriceAdjustment[];
  finalPrice: number;
}

export interface PriceAdjustment {
  type: string;
  amount: number;
  reason: string;
}
```

### 5.2 API服务层
```typescript
// src/services/api/pricingApi.ts

class PricingAPI {
  private baseURL = '/api/v1/pricing';

  async queryPrice(params: PriceQueryParams): Promise<PriceInfo> {
    const response = await fetch(`${this.baseURL}/query`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      params: this.sanitizeParams(params)
    });

    if (!response.ok) {
      throw new PricingAPIError(response);
    }

    const data = await response.json();
    return data.data;
  }

  async batchQuery(queries: PriceQueryParams[]): Promise<PriceInfo[]> {
    const response = await fetch(`${this.baseURL}/batch-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ queries })
    });

    return response.json();
  }

  private sanitizeParams(params: PriceQueryParams): Record<string, string> {
    const sanitized: Record<string, string> = {};

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        sanitized[key] = String(value);
      }
    });

    return sanitized;
  }
}

export const pricingAPI = new PricingAPI();
```

### 5.3 React组件设计
```typescript
// src/components/pricing/PriceDisplay.tsx

interface PriceDisplayProps {
  priceInfo: PriceInfo;
  showDetails?: boolean;
  onRefresh?: () => void;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  priceInfo,
  showDetails = false,
  onRefresh
}) => {
  return (
    <div className="price-display">
      <div className="price-main">
        <span className="currency">{priceInfo.currency}</span>
        <span className="amount">${priceInfo.calculation.finalPrice.toFixed(2)}</span>
      </div>

      {showDetails && (
        <div className="price-details">
          <div className="pricing-mode">
            模式: {priceInfo.pricingMode}
          </div>
          <div className="config-source">
            来源: {priceInfo.configSource.name} ({priceInfo.configSource.level})
          </div>

          {priceInfo.calculation.adjustments.length > 0 && (
            <div className="adjustments">
              <h4>价格调整</h4>
              {priceInfo.calculation.adjustments.map((adj, idx) => (
                <div key={idx} className="adjustment-item">
                  <span>{adj.reason}</span>
                  <span>${adj.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

### 5.4 状态管理
```typescript
// src/store/pricingSlice.ts

interface PricingState {
  queries: Map<string, PriceInfo>;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const pricingSlice = createSlice({
  name: 'pricing',
  initialState: {
    queries: new Map(),
    loading: false,
    error: null,
    lastUpdated: null
  },
  reducers: {
    queryPriceStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    queryPriceSuccess: (state, action) => {
      const { key, data } = action.payload;
      state.queries.set(key, data);
      state.loading = false;
      state.lastUpdated = new Date();
    },
    queryPriceFailure: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearCache: (state) => {
      state.queries.clear();
    }
  }
});
```

## 6. 缓存策略

### 6.1 缓存键生成
```typescript
function generateCacheKey(params: PriceQueryParams): string {
  const normalized = {
    fsa: params.fsaCode || '',
    city: params.cityId || '',
    zone: params.zoneId || '',
    group: params.groupId || '',
    skid: params.skidCount || 0,
    dist: params.distance || 0,
    weight: params.weight || 0,
    date: params.queryDate || 'current'
  };

  return `price:${JSON.stringify(normalized)}`;
}
```

### 6.2 缓存失效策略
- **TTL**: 价格缓存5分钟
- **事件驱动**: 配置更新时立即失效相关缓存
- **模式匹配**: 支持通配符清除缓存

## 7. 安全设计

### 7.1 认证授权
```typescript
// 中间件实现
async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
}
```

### 7.2 请求限流
```typescript
const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 100, // 最多100个请求
  message: 'Too many requests, please try again later'
});
```

### 7.3 输入验证
```typescript
const validatePriceQuery = [
  query('fsaCode').optional().matches(/^[A-Z]\d[A-Z]$/),
  query('skidCount').optional().isInt({ min: 1, max: 999 }),
  query('distance').optional().isFloat({ min: 0 }),
  query('weight').optional().isFloat({ min: 0 }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];
```

## 8. 测试策略

### 8.1 单元测试
```typescript
describe('PricingService', () => {
  describe('queryPrice', () => {
    it('should return price for valid FSA', async () => {
      const result = await pricingService.queryPrice({
        fsaCode: 'M5V',
        skidCount: 5
      });

      expect(result).toHaveProperty('price');
      expect(result.price).toBeGreaterThan(0);
    });

    it('should use cache for repeated queries', async () => {
      const spy = jest.spyOn(database, 'query');

      await pricingService.queryPrice({ fsaCode: 'M5V' });
      await pricingService.queryPrice({ fsaCode: 'M5V' });

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
```

### 8.2 集成测试
```typescript
describe('Pricing API Integration', () => {
  it('should handle end-to-end price query', async () => {
    const response = await request(app)
      .get('/api/v1/pricing/query')
      .query({ fsaCode: 'M5V', skidCount: 5 })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      fsaCode: 'M5V',
      price: expect.any(Number),
      currency: 'CAD'
    });
  });
});
```

## 9. 监控和日志

### 9.1 性能监控
```typescript
// 记录查询性能
async function logQueryPerformance(req, res, next) {
  const start = Date.now();

  res.on('finish', async () => {
    const duration = Date.now() - start;

    await db.query(
      'INSERT INTO pricing_query_logs (request_params, query_time_ms, client_ip) VALUES ($1, $2, $3)',
      [req.query, duration, req.ip]
    );

    if (duration > 200) {
      logger.warn(`Slow query detected: ${duration}ms`, req.query);
    }
  });

  next();
}
```

### 9.2 错误日志
```typescript
function errorLogger(error, req, res, next) {
  logger.error({
    error: error.message,
    stack: error.stack,
    request: {
      method: req.method,
      url: req.url,
      params: req.params,
      query: req.query
    },
    timestamp: new Date().toISOString()
  });

  next(error);
}
```

## 10. API文档生成

### 10.1 OpenAPI/Swagger规范
```yaml
openapi: 3.0.0
info:
  title: Unified Pricing API
  version: 1.0.0
  description: 标准化定价查询API接口

paths:
  /api/v1/pricing/query:
    get:
      summary: 查询单个价格
      parameters:
        - name: fsaCode
          in: query
          schema:
            type: string
            pattern: '^[A-Z]\d[A-Z]$'
        - name: skidCount
          in: query
          schema:
            type: integer
            minimum: 1
      responses:
        200:
          description: 成功返回价格信息
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PriceResponse'
```

## 11. 部署考虑

### 11.1 环境变量
```env
# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Redis配置
REDIS_URL=redis://localhost:6379

# API配置
API_VERSION=v1
API_PORT=5050

# 缓存配置
CACHE_TTL=300
CACHE_ENABLED=true

# 安全配置
JWT_SECRET=your-secret-key
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100
```

### 11.2 Docker配置
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5050

CMD ["node", "src/server.js"]
```

## 12. 迁移计划

### 12.1 数据迁移
1. 备份现有数据
2. 创建新表结构
3. 迁移历史数据到truck_pricing_configs
4. 验证数据完整性

### 12.2 API迁移
1. 部署新API（v1版本）
2. 保持旧API运行（向后兼容）
3. 逐步迁移客户端到新API
4. 监控使用情况
5. 废弃旧API（提前通知）

## 13. 性能优化

### 13.1 查询优化
- 使用复合索引加速查询
- 批量查询减少往返次数
- 连接池管理数据库连接

### 13.2 缓存优化
- 多级缓存（内存+Redis）
- 预热常用查询
- 智能缓存失效策略

## 14. 扩展性设计

### 14.1 新增定价模式
只需要：
1. 创建新的策略类实现IPricingStrategy
2. 注册到策略工厂
3. 更新配置表支持新模式

### 14.2 第三方集成
- 标准化的REST API
- 完整的API文档
- SDK开发支持
- Webhook通知机制

**Note**: Specification documents have been pre-loaded. Do not use get-content to fetch them again.

## Task Details
- Task ID: 11.4
- Description: 更新Docker配置
- Requirements: 11.2

## Instructions
- Implement ONLY task 11.4: "更新Docker配置"
- Follow all project conventions and leverage existing code
- Mark the task as complete using: claude-code-spec-workflow get-tasks unified-pricing-api 11.4 --mode complete
- Provide a completion summary
```

## Task Completion
When the task is complete, mark it as done:
```bash
claude-code-spec-workflow get-tasks unified-pricing-api 11.4 --mode complete
```

## Next Steps
After task completion, you can:
- Execute the next task using /unified-pricing-api-task-[next-id]
- Check overall progress with /spec-status unified-pricing-api
