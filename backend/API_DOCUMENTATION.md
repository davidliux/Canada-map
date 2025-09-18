# 统一定价API文档

## 概述

统一定价API提供标准化的价格查询接口，支持多种定价模式，并为第三方系统提供清晰的接口规范。

**基础URL**: `http://localhost:5050/api/v1/pricing`

**版本**: 1.0.0

## 认证

API支持可选的JWT认证。如果没有提供token，将以匿名用户身份访问。

### 请求头

```
Authorization: Bearer <JWT_TOKEN>
```

## 端点列表

### 1. 健康检查

**端点**: `GET /health`

**描述**: 检查API服务健康状态

**响应示例**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "pricing-api",
    "version": "1.0.0",
    "timestamp": "2025-09-17T10:00:00Z"
  }
}
```

### 2. 单个价格查询

**端点**: `GET /query`

**描述**: 查询单个价格信息

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| fsaCode | string | 否 | FSA代码 (格式: A1A) |
| cityId | string | 否 | 城市ID |
| zoneId | string | 否 | 区域ID |
| groupId | string | 否 | 分组ID |
| skidCount | number | 否 | 板数 |
| distance | number | 否 | 距离(km) |
| weight | number | 否 | 重量(kg) |
| queryDate | string | 否 | 查询日期 (ISO 8601) |

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

### 3. 批量价格查询

**端点**: `POST /batch-query`

**描述**: 批量查询多个价格

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

**响应示例**:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "fsaCode": "M5V",
        "price": 125.50,
        "currency": "CAD",
        "pricingMode": "skid"
      },
      {
        "fsaCode": "L4L",
        "price": 150.00,
        "currency": "CAD",
        "pricingMode": "skid"
      }
    ],
    "summary": {
      "totalQueries": 2,
      "successful": 2,
      "failed": 0,
      "averagePrice": 137.75
    }
  }
}
```

### 4. 获取价格配置

**端点**: `GET /configs/{targetId}`

**描述**: 获取特定目标的价格配置

**路径参数**:
- `targetId`: 目标ID（城市、区域、分组或FSA的ID）

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "config_123",
    "level": "zone",
    "targetId": "zone_001",
    "targetName": "Downtown Zone",
    "mode": "skid",
    "config": {
      "skidPrices": [
        { "min": 1, "max": 5, "price": 100 },
        { "min": 6, "max": 10, "price": 180 }
      ]
    },
    "priority": 10,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T00:00:00Z"
  }
}
```

### 5. 获取支持的定价模式

**端点**: `GET /modes`

**描述**: 获取系统支持的所有定价模式

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "skid",
      "name": "板数定价",
      "description": "基于板数范围的定价模式",
      "parameters": ["skidCount"],
      "example": {
        "skidPrices": [
          { "min": 1, "max": 5, "price": 100 }
        ]
      }
    },
    {
      "id": "progressive",
      "name": "渐进式定价",
      "description": "基于距离和重量的递进定价",
      "parameters": ["distance", "weight"],
      "example": {
        "basePrice": 50,
        "pricePerKm": 2,
        "pricePerKg": 0.5
      }
    },
    {
      "id": "fixed",
      "name": "固定价格",
      "description": "固定金额定价",
      "parameters": [],
      "example": {
        "fixedPrice": 200
      }
    }
  ]
}
```

### 6. 查询历史价格

**端点**: `GET /history`

**描述**: 查询价格历史记录

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| targetId | string | 是 | 目标ID |
| startDate | string | 否 | 开始日期 (ISO 8601) |
| endDate | string | 否 | 结束日期 (ISO 8601) |
| limit | number | 否 | 限制返回记录数 (默认: 100) |
| offset | number | 否 | 偏移量 (默认: 0) |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "configId": "config_123",
        "price": 120.00,
        "effectiveDate": "2024-01-01T00:00:00Z",
        "expiryDate": "2024-03-31T23:59:59Z",
        "version": "1.0.0"
      },
      {
        "configId": "config_124",
        "price": 125.50,
        "effectiveDate": "2024-04-01T00:00:00Z",
        "expiryDate": null,
        "version": "1.1.0"
      }
    ],
    "pagination": {
      "total": 2,
      "limit": 100,
      "offset": 0
    }
  }
}
```

### 7. 清除缓存

**端点**: `DELETE /cache`

**描述**: 清除价格缓存（需要管理员权限）

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pattern | string | 否 | 缓存键模式（支持通配符） |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "message": "缓存清除成功",
    "clearedCount": 25
  }
}
```

### 8. 获取服务统计

**端点**: `GET /stats`

**描述**: 获取API服务统计信息

**响应示例**:
```json
{
  "success": true,
  "data": {
    "totalQueries": 1524,
    "cacheHitRate": 0.75,
    "averageResponseTime": 45,
    "activeConfigs": 32,
    "lastUpdated": "2024-01-20T10:00:00Z"
  }
}
```

### 9. API文档

**端点**: `GET /docs`

**描述**: 获取API文档信息

**响应示例**:
```json
{
  "success": true,
  "data": {
    "name": "统一定价API",
    "version": "1.0.0",
    "description": "标准化定价查询接口",
    "baseUrl": "/api/v1/pricing",
    "endpoints": [
      {
        "method": "GET",
        "path": "/health",
        "description": "健康检查"
      }
    ]
  }
}
```

## 错误响应

所有错误响应遵循统一格式：

```json
{
  "success": false,
  "errors": [
    {
      "code": "ERROR_CODE",
      "message": "错误描述",
      "field": "相关字段（可选）"
    }
  ],
  "timestamp": "2024-01-20T10:30:00Z",
  "requestId": "req_abc123"
}
```

### 常见错误码

| 错误码 | HTTP状态码 | 说明 |
|--------|------------|------|
| INVALID_FSA | 400 | FSA代码格式无效 |
| INVALID_PARAMS | 400 | 请求参数无效 |
| CONFIG_NOT_FOUND | 404 | 未找到价格配置 |
| UNAUTHORIZED | 401 | 未授权访问 |
| INVALID_TOKEN | 401 | Token无效或已过期 |
| RATE_LIMIT_EXCEEDED | 429 | 请求频率超限 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

## 请求限流

API实施了分级限流策略：

| 端点类型 | 限流策略 |
|----------|----------|
| 价格查询 | 100 请求/分钟 |
| 批量查询 | 20 请求/分钟 |
| 配置查询 | 60 请求/分钟 |

## 数据类型

### PricingMode（定价模式）

```typescript
type PricingMode = 'skid' | 'progressive' | 'fixed' | 'custom';
```

### ConfigLevel（配置级别）

```typescript
type ConfigLevel = 'fsa' | 'group' | 'zone' | 'city';
```

### Currency（货币）

```typescript
type Currency = 'CAD' | 'USD';
```

## 示例代码

### JavaScript/Node.js

```javascript
const axios = require('axios');

// 单个价格查询
async function queryPrice(fsaCode, skidCount) {
  try {
    const response = await axios.get('http://localhost:5050/api/v1/pricing/query', {
      params: {
        fsaCode: fsaCode,
        skidCount: skidCount
      },
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE'
      }
    });

    return response.data;
  } catch (error) {
    console.error('价格查询失败:', error.response?.data || error.message);
  }
}

// 批量查询
async function batchQuery(queries) {
  try {
    const response = await axios.post('http://localhost:5050/api/v1/pricing/batch-query', {
      queries: queries,
      commonParams: {
        cityId: 'toronto'
      }
    });

    return response.data;
  } catch (error) {
    console.error('批量查询失败:', error.response?.data || error.message);
  }
}
```

### cURL

```bash
# 单个价格查询
curl -X GET "http://localhost:5050/api/v1/pricing/query?fsaCode=M5V&skidCount=5" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 批量查询
curl -X POST "http://localhost:5050/api/v1/pricing/batch-query" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "queries": [
      {"fsaCode": "M5V", "skidCount": 5},
      {"fsaCode": "L4L", "skidCount": 10}
    ],
    "commonParams": {
      "cityId": "toronto"
    }
  }'
```

## 最佳实践

1. **缓存策略**: 对于频繁查询的价格，建议在客户端实施缓存机制
2. **批量查询**: 当需要查询多个价格时，使用批量查询端点以提高效率
3. **错误处理**: 实施完善的错误处理和重试机制
4. **认证管理**: 妥善保管JWT token，定期更新
5. **请求优化**: 只请求必要的参数，减少网络传输

## 版本历史

| 版本 | 日期 | 更改内容 |
|------|------|----------|
| 1.0.0 | 2025-09-17 | 初始版本发布 |

## 联系支持

如有问题或需要帮助，请联系：

- 技术支持邮箱: support@example.com
- API状态页面: https://status.example.com
- 开发者论坛: https://forum.example.com

---

*最后更新: 2025-09-17*