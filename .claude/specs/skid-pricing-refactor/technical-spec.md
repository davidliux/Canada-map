# 板数定价系统重构 - 技术规格文档

## 1. 系统架构

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         前端应用层                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React Components                                    │  │
│  │  ├── HierarchicalSelector (层级选择器)              │  │
│  │  ├── PricingModePanel (定价模式面板)                │  │
│  │  ├── PriceCalculator (价格计算器)                   │  │
│  │  └── BatchOperations (批量操作)                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                              ↓                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  State Management (Zustand/Context)                  │  │
│  │  ├── PricingStore (定价数据状态)                    │  │
│  │  ├── SelectionStore (选择状态)                      │  │
│  │  └── UIStore (界面状态)                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                              ↓                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Service Layer                                       │  │
│  │  ├── PricingService (定价服务)                      │  │
│  │  ├── CalculationEngine (计算引擎)                   │  │
│  │  └── DataSyncService (数据同步)                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────┐
│                         后端API层                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  RESTful API Endpoints                               │  │
│  │  ├── /api/pricing/cities                            │  │
│  │  ├── /api/pricing/zones                             │  │
│  │  ├── /api/pricing/groups                            │  │
│  │  └── /api/pricing/calculate                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈

| 层级 | 技术选型 | 版本 | 说明 |
|------|---------|------|------|
| 前端框架 | React | 18.2.0 | 主框架 |
| 路由 | React Router | 6.x | 路由管理 |
| 状态管理 | Zustand | 4.x | 轻量级状态管理 |
| UI组件库 | Tailwind CSS | 3.x | 样式框架 |
| 构建工具 | Vite | 5.x | 开发构建 |
| 类型检查 | TypeScript | 5.x | 类型安全 |
| 数据请求 | Axios | 1.x | HTTP客户端 |
| 表单处理 | React Hook Form | 7.x | 表单管理 |
| 数据验证 | Zod | 3.x | Schema验证 |

## 2. 数据模型设计

### 2.1 核心数据结构

```typescript
// 定价配置主体
interface PricingConfiguration {
  id: string;
  level: PricingLevel;
  targetId: string;
  targetName: string;
  mode: PricingMode;
  config: PricingModeConfig;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  version: number;
}

// 层级枚举
enum PricingLevel {
  CITY = 'city',
  ZONE = 'zone',
  GROUP = 'group'
}

// 定价模式枚举
enum PricingMode {
  FIXED = 'fixed',
  PROGRESSIVE = 'progressive',
  TIERED = 'tiered',
  TRUCKLOAD = 'truckload'
}

// 定价模式配置联合类型
type PricingModeConfig =
  | FixedPricingConfig
  | ProgressivePricingConfig
  | TieredPricingConfig
  | TruckloadPricingConfig;

// 固定价格配置
interface FixedPricingConfig {
  type: 'fixed';
  pricePerSkid: number;
}

// 首续托配置
interface ProgressivePricingConfig {
  type: 'progressive';
  firstSkidPrice: number;
  additionalSkidPrice: number;
  firstSkidCount: number;
}

// 阶梯定价配置
interface TieredPricingConfig {
  type: 'tiered';
  tiers: Array<{
    id: string;
    minQuantity: number;
    maxQuantity: number | null;
    pricePerSkid: number;
  }>;
}

// 整车定价配置
interface TruckloadPricingConfig {
  type: 'truckload';
  minSkidsForTruckload: number;
  truckloadPrice: number;
  belowTruckloadMode: PricingMode;
  belowTruckloadConfig: PricingModeConfig;
}
```

### 2.2 选择状态模型

```typescript
interface SelectionState {
  selectedCity: City | null;
  selectedZones: Zone[];
  selectedGroups: Group[];
  selectionLevel: PricingLevel;
}

interface City {
  id: string;
  name: string;
  province: string;
  zones: Zone[];
  hasCustomPricing: boolean;
}

interface Zone {
  id: string;
  cityId: string;
  name: string;
  groups: Group[];
  fsaCodes: string[];
  hasCustomPricing: boolean;
}

interface Group {
  id: string;
  zoneId: string;
  name: string;
  fsaCodes: string[];
  postalCodes: string[];
  currentPricing?: PricingConfiguration;
}
```

### 2.3 计算结果模型

```typescript
interface PriceCalculationResult {
  requestId: string;
  skidCount: number;
  appliedRule: {
    level: PricingLevel;
    targetId: string;
    targetName: string;
    mode: PricingMode;
  };
  breakdown: {
    unitPrice: number;
    quantity: number;
    subtotal: number;
    discounts: Array<{
      type: string;
      amount: number;
      reason: string;
    }>;
  };
  totalPrice: number;
  currency: string;
  calculatedAt: Date;
}
```

## 3. 组件设计

### 3.1 层级选择器组件

```typescript
interface HierarchicalSelectorProps {
  cities: City[];
  onSelectionChange: (selection: SelectionState) => void;
  initialSelection?: SelectionState;
}

const HierarchicalSelector: React.FC<HierarchicalSelectorProps> = ({
  cities,
  onSelectionChange,
  initialSelection
}) => {
  // 组件实现
  return (
    <div className="hierarchical-selector">
      <CitySelector />
      <ZoneSelector />
      <GroupSelector />
    </div>
  );
};
```

### 3.2 定价模式面板组件

```typescript
interface PricingModePanelProps {
  selection: SelectionState;
  currentConfig?: PricingConfiguration;
  onSave: (config: PricingConfiguration) => Promise<void>;
  onCancel: () => void;
}

const PricingModePanel: React.FC<PricingModePanelProps> = ({
  selection,
  currentConfig,
  onSave,
  onCancel
}) => {
  const [mode, setMode] = useState<PricingMode>(
    currentConfig?.mode || PricingMode.FIXED
  );
  const [config, setConfig] = useState<PricingModeConfig>(
    currentConfig?.config || getDefaultConfig(mode)
  );

  // 渲染不同模式的配置表单
  const renderConfigForm = () => {
    switch (mode) {
      case PricingMode.FIXED:
        return <FixedPricingForm />;
      case PricingMode.PROGRESSIVE:
        return <ProgressivePricingForm />;
      case PricingMode.TIERED:
        return <TieredPricingForm />;
      case PricingMode.TRUCKLOAD:
        return <TruckloadPricingForm />;
    }
  };

  return (
    <div className="pricing-mode-panel">
      <ModeSwitcher mode={mode} onChange={setMode} />
      {renderConfigForm()}
      <ActionButtons onSave={handleSave} onCancel={onCancel} />
    </div>
  );
};
```

## 4. 状态管理设计

### 4.1 Zustand Store

```typescript
interface PricingStore {
  // 状态
  configurations: Map<string, PricingConfiguration>;
  selection: SelectionState;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadConfigurations: (cityId: string) => Promise<void>;
  saveConfiguration: (config: PricingConfiguration) => Promise<void>;
  deleteConfiguration: (id: string) => Promise<void>;
  setSelection: (selection: SelectionState) => void;
  calculatePrice: (params: CalculationParams) => Promise<PriceCalculationResult>;
  batchUpdate: (configs: PricingConfiguration[]) => Promise<void>;
}

const usePricingStore = create<PricingStore>((set, get) => ({
  configurations: new Map(),
  selection: {
    selectedCity: null,
    selectedZones: [],
    selectedGroups: [],
    selectionLevel: PricingLevel.CITY
  },
  isLoading: false,
  error: null,

  loadConfigurations: async (cityId) => {
    set({ isLoading: true, error: null });
    try {
      const configs = await PricingService.getConfigurations(cityId);
      const configMap = new Map(configs.map(c => [c.id, c]));
      set({ configurations: configMap, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  saveConfiguration: async (config) => {
    set({ isLoading: true });
    try {
      const saved = await PricingService.saveConfiguration(config);
      const { configurations } = get();
      configurations.set(saved.id, saved);
      set({ configurations: new Map(configurations), isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // 其他方法实现...
}));
```

## 5. 价格计算引擎

### 5.1 计算流程

```typescript
class PricingCalculationEngine {
  private configurations: Map<string, PricingConfiguration>;

  constructor(configurations: Map<string, PricingConfiguration>) {
    this.configurations = configurations;
  }

  calculate(params: {
    cityId: string;
    zoneId?: string;
    groupId?: string;
    skidCount: number;
  }): PriceCalculationResult {
    // 1. 查找适用的定价配置
    const applicableConfig = this.findApplicableConfig(params);

    if (!applicableConfig) {
      throw new Error('No pricing configuration found');
    }

    // 2. 根据定价模式计算价格
    const price = this.calculateByMode(
      applicableConfig.config,
      params.skidCount
    );

    // 3. 构建计算结果
    return this.buildResult(applicableConfig, params, price);
  }

  private findApplicableConfig(params: any): PricingConfiguration | null {
    // 优先级: Group > Zone > City
    if (params.groupId) {
      const groupConfig = this.findConfigByTarget(
        PricingLevel.GROUP,
        params.groupId
      );
      if (groupConfig) return groupConfig;
    }

    if (params.zoneId) {
      const zoneConfig = this.findConfigByTarget(
        PricingLevel.ZONE,
        params.zoneId
      );
      if (zoneConfig) return zoneConfig;
    }

    return this.findConfigByTarget(PricingLevel.CITY, params.cityId);
  }

  private calculateByMode(
    config: PricingModeConfig,
    skidCount: number
  ): number {
    switch (config.type) {
      case 'fixed':
        return this.calculateFixed(config, skidCount);
      case 'progressive':
        return this.calculateProgressive(config, skidCount);
      case 'tiered':
        return this.calculateTiered(config, skidCount);
      case 'truckload':
        return this.calculateTruckload(config, skidCount);
      default:
        throw new Error(`Unknown pricing mode: ${config.type}`);
    }
  }

  private calculateFixed(
    config: FixedPricingConfig,
    skidCount: number
  ): number {
    return config.pricePerSkid * skidCount;
  }

  private calculateProgressive(
    config: ProgressivePricingConfig,
    skidCount: number
  ): number {
    if (skidCount <= config.firstSkidCount) {
      return config.firstSkidPrice * skidCount;
    }

    const firstPartPrice = config.firstSkidPrice * config.firstSkidCount;
    const additionalSkids = skidCount - config.firstSkidCount;
    const additionalPrice = config.additionalSkidPrice * additionalSkids;

    return firstPartPrice + additionalPrice;
  }

  private calculateTiered(
    config: TieredPricingConfig,
    skidCount: number
  ): number {
    const applicableTier = config.tiers.find(tier =>
      skidCount >= tier.minQuantity &&
      (tier.maxQuantity === null || skidCount <= tier.maxQuantity)
    );

    if (!applicableTier) {
      throw new Error(`No tier found for quantity: ${skidCount}`);
    }

    return applicableTier.pricePerSkid * skidCount;
  }

  private calculateTruckload(
    config: TruckloadPricingConfig,
    skidCount: number
  ): number {
    if (skidCount >= config.minSkidsForTruckload) {
      return config.truckloadPrice;
    }

    // 低于整车数量时，使用备用定价模式
    return this.calculateByMode(
      config.belowTruckloadConfig,
      skidCount
    );
  }
}
```

## 6. API设计

### 6.1 RESTful端点

```typescript
// 获取城市列表
GET /api/pricing/cities
Response: City[]

// 获取特定城市的区域
GET /api/pricing/cities/:cityId/zones
Response: Zone[]

// 获取特定区域的分组
GET /api/pricing/zones/:zoneId/groups
Response: Group[]

// 获取定价配置
GET /api/pricing/configurations
Query: { cityId?: string, zoneId?: string, groupId?: string }
Response: PricingConfiguration[]

// 保存定价配置
POST /api/pricing/configurations
Body: PricingConfiguration
Response: PricingConfiguration

// 更新定价配置
PUT /api/pricing/configurations/:id
Body: PricingConfiguration
Response: PricingConfiguration

// 删除定价配置
DELETE /api/pricing/configurations/:id
Response: { success: boolean }

// 批量更新定价
POST /api/pricing/configurations/batch
Body: PricingConfiguration[]
Response: { success: boolean, updated: number }

// 计算价格
POST /api/pricing/calculate
Body: {
  cityId: string;
  zoneId?: string;
  groupId?: string;
  skidCount: number;
}
Response: PriceCalculationResult

// 导出配置
GET /api/pricing/export
Query: { format: 'excel' | 'csv' | 'json', scope: string }
Response: Blob

// 导入配置
POST /api/pricing/import
Body: FormData (file)
Response: { success: boolean, imported: number, errors: string[] }
```

## 7. 性能优化策略

### 7.1 前端优化

```typescript
// 1. 虚拟滚动实现
import { FixedSizeList } from 'react-window';

const VirtualGroupList = ({ groups, onSelect }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <GroupItem group={groups[index]} onSelect={onSelect} />
    </div>
  );

  return (
    <FixedSizeList
      height={400}
      itemCount={groups.length}
      itemSize={36}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};

// 2. 防抖处理
const useDebouncedValue = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// 3. 缓存策略
const pricingCache = new Map<string, PriceCalculationResult>();

const getCachedPrice = (key: string): PriceCalculationResult | null => {
  const cached = pricingCache.get(key);
  if (cached && Date.now() - cached.calculatedAt.getTime() < 300000) {
    return cached;
  }
  return null;
};
```

### 7.2 后端优化

```javascript
// 1. 数据库索引
CREATE INDEX idx_pricing_level_target ON pricing_configurations(level, target_id);
CREATE INDEX idx_pricing_priority ON pricing_configurations(priority DESC);
CREATE INDEX idx_pricing_active ON pricing_configurations(is_active);

// 2. Redis缓存
class PricingCacheService {
  private redis: RedisClient;

  async getCachedConfig(key: string): Promise<PricingConfiguration | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async setCachedConfig(
    key: string,
    config: PricingConfiguration,
    ttl = 3600
  ): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(config));
  }

  async invalidateCache(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// 3. 批量查询优化
const batchLoadConfigurations = async (ids: string[]) => {
  const query = `
    SELECT * FROM pricing_configurations
    WHERE id = ANY($1)
    AND is_active = true
    ORDER BY priority DESC
  `;
  return db.query(query, [ids]);
};
```

## 8. 错误处理

### 8.1 错误类型定义

```typescript
enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

class PricingError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PricingError';
  }
}
```

### 8.2 错误处理中间件

```typescript
const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof PricingError) {
    return res.status(getStatusCode(error.code)).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
  }

  console.error('Unhandled error:', error);
  return res.status(500).json({
    success: false,
    error: {
      code: ErrorCode.SERVER_ERROR,
      message: 'Internal server error'
    }
  });
};
```

## 9. 测试策略

### 9.1 单元测试

```typescript
describe('PricingCalculationEngine', () => {
  let engine: PricingCalculationEngine;

  beforeEach(() => {
    const configurations = new Map([
      ['config1', createMockConfig(PricingMode.FIXED)],
      ['config2', createMockConfig(PricingMode.TIERED)]
    ]);
    engine = new PricingCalculationEngine(configurations);
  });

  describe('Fixed pricing', () => {
    it('should calculate correct price for fixed mode', () => {
      const result = engine.calculate({
        cityId: 'toronto',
        skidCount: 10
      });
      expect(result.totalPrice).toBe(150);
    });
  });

  describe('Tiered pricing', () => {
    it('should apply correct tier based on quantity', () => {
      const result = engine.calculate({
        cityId: 'toronto',
        skidCount: 15
      });
      expect(result.totalPrice).toBe(210);
    });
  });
});
```

### 9.2 集成测试

```typescript
describe('Pricing API Integration', () => {
  it('should save and retrieve pricing configuration', async () => {
    const config = {
      level: PricingLevel.CITY,
      targetId: 'toronto',
      mode: PricingMode.FIXED,
      config: { type: 'fixed', pricePerSkid: 15 }
    };

    const response = await request(app)
      .post('/api/pricing/configurations')
      .send(config)
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.mode).toBe(PricingMode.FIXED);
  });
});
```

## 10. 部署配置

### 10.1 Docker配置

```dockerfile
# Frontend Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 10.2 环境变量

```bash
# .env.production
VITE_API_BASE_URL=https://api.pricing.example.com
VITE_ENABLE_ANALYTICS=true
VITE_CACHE_TTL=300000
VITE_MAX_BATCH_SIZE=100
```

## 11. 监控与日志

### 11.1 性能监控

```typescript
// 使用 Performance Observer API
const performanceObserver = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach((entry) => {
    if (entry.entryType === 'measure') {
      analytics.track('Performance', {
        name: entry.name,
        duration: entry.duration,
        timestamp: entry.startTime
      });
    }
  });
});

performanceObserver.observe({ entryTypes: ['measure'] });

// 测量关键操作
performance.mark('pricing-calculation-start');
const result = await calculatePrice(params);
performance.mark('pricing-calculation-end');
performance.measure(
  'pricing-calculation',
  'pricing-calculation-start',
  'pricing-calculation-end'
);
```

### 11.2 错误日志

```typescript
// 前端错误收集
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);

  // 发送到日志服务
  logService.error({
    type: 'unhandled_rejection',
    error: event.reason,
    url: window.location.href,
    timestamp: new Date().toISOString()
  });
});

// React Error Boundary
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logService.error({
      type: 'react_error',
      error: error.message,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
  }
}
```

## 12. 安全考虑

### 12.1 权限控制

```typescript
// 权限中间件
const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }
    next();
  };
};

// 应用权限控制
router.post(
  '/api/pricing/configurations',
  requirePermission('pricing.write'),
  savePricingConfiguration
);
```

### 12.2 数据验证

```typescript
// 使用 Zod 进行数据验证
const PricingConfigSchema = z.object({
  level: z.enum(['city', 'zone', 'group']),
  targetId: z.string().uuid(),
  mode: z.enum(['fixed', 'progressive', 'tiered', 'truckload']),
  config: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('fixed'),
      pricePerSkid: z.number().positive()
    }),
    z.object({
      type: z.literal('progressive'),
      firstSkidPrice: z.number().positive(),
      additionalSkidPrice: z.number().positive(),
      firstSkidCount: z.number().int().positive()
    }),
    // ... 其他模式的验证
  ])
});

const validatePricingConfig = (data: unknown) => {
  return PricingConfigSchema.parse(data);
};
```

## 附录

### A. 数据库Schema

```sql
-- 定价配置表
CREATE TABLE pricing_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level VARCHAR(10) NOT NULL,
  target_id UUID NOT NULL,
  target_name VARCHAR(255) NOT NULL,
  mode VARCHAR(20) NOT NULL,
  config JSONB NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL,
  version INTEGER DEFAULT 1,
  CONSTRAINT unique_target_mode UNIQUE(level, target_id, mode)
);

-- 审计日志表
CREATE TABLE pricing_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id UUID REFERENCES pricing_configurations(id),
  action VARCHAR(20) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  user_id UUID NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### B. 迁移策略

```typescript
// 数据迁移脚本
async function migratePricingData() {
  const oldConfigs = await getOldPricingConfigurations();

  const newConfigs = oldConfigs.map(old => ({
    level: mapOldLevel(old.type),
    targetId: old.id,
    mode: mapOldMode(old.pricingType),
    config: transformOldConfig(old.pricing),
    priority: calculatePriority(old),
    isActive: true,
    createdAt: old.created_date,
    createdBy: old.user_id
  }));

  await batchInsertConfigurations(newConfigs);
}
```