# POSTAL_PRICE_API — 邮编/价格 API 设计（占位）

版本: v0.1
状态: 草稿

## 总览
- 参考 `api-specification.yaml`，在此处细化邮编、价格、区域、FSA 的端点、示例与错误码。

## 端点草案
- GET /postal-codes?code=&fsa=&page=&pageSize=
- GET /price-rules?region_id=&weight_min=&weight_max=&page=&pageSize=
- GET /regions /regions/:id
- GET /fsa?province=&code=
- POST /imports（文件上传，异步处理）
 - POST /calculate-price

### 端点细节（新增与已实现）

1) GET /regions/:regionId
- 描述：获取区域详情与统计
- 响应示例：
```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "区域1",
    "isActive": true,
    "postalCodeCount": 0,
    "weightRangeCount": 2,
    "activePostalCodes": 0,
    "activeWeightRanges": 2
  }
}
```

2) GET /regions/:regionId/weight-ranges
- 描述：获取区域重量区间（只读展示）
- 说明：已用于前端 `RegionPriceManager.jsx` 的只读展示

3) POST /calculate-price
- 描述：根据区域与重量计算价格
- 请求： `{ "regionId": "1", "weight": 12.3 }`
- 响应： `{ "success": true, "data": { "price": 0, "currency": "CAD", "weightRange": { ... } } }`

## 约束与校验
- 邮编格式：加拿大标准格式校验
- 价格规则：区间不重叠、有效期范围有效
