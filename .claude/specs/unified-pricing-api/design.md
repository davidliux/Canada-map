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