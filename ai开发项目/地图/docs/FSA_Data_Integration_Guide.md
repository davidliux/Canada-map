# 加拿大FSA边界数据集成指南

## 概述

本指南详细说明如何获取和集成真实的加拿大前向分拣区(FSA)边界数据，实现像您图片中展示的精确邮编切块效果。

## 技术架构推荐

根据您的建议，**Leaflet + PostGIS** 是处理大规模地理数据的最佳方案：

### 前端层 (当前实现)
- **React + Leaflet**: 地图渲染和交互
- **GeoJSON**: 轻量级地理数据格式
- **实时筛选**: 客户端搜索和省份筛选

### 后端层 (推荐扩展)
- **PostGIS + PostgreSQL**: 地理数据库存储和查询
- **Node.js/Express**: API服务层
- **空间索引**: 高性能地理查询

## 数据源获取

### 1. 官方数据源 (推荐)

**加拿大统计局 2021年FSA边界文件**
- 数据URL: `https://www12.statcan.gc.ca/census-recensement/2021/geo/sip-pis/boundary-limites/index2021-eng.cfm`
- 格式: Shapefile (.shp) 和 GML
- 包含: 1600+ 个FSA的精确边界
- 更新频率: 每次人口普查 (5年)

### 2. 开源简化版本

**GitHub开源项目**
```bash
# 简化的GeoJSON版本 (推荐用于Web前端)
curl -L "https://github.com/sachijay/canada_maps/raw/main/exported_files/forward_sortation_areas_simplified.geojson" -o canada_fsa_boundaries.geojson

# 完整版本 (PostGIS使用)
curl -L "https://github.com/sachijay/canada_maps/raw/main/exported_files/forward_sortation_areas.geojson" -o canada_fsa_full.geojson
```

## 数据集成步骤

### 步骤1: 下载和准备数据

```bash
# 创建数据目录
mkdir -p public/data

# 下载FSA边界数据
cd public/data
curl -L "https://github.com/sachijay/canada_maps/raw/main/exported_files/forward_sortation_areas_simplified.geojson" -o canada_fsa_boundaries.geojson

# 验证数据格式
head -20 canada_fsa_boundaries.geojson
```

### 步骤2: 更新React组件

```javascript
// src/components/RealPostalBoundaries.jsx
useEffect(() => {
  const loadFSAData = async () => {
    try {
      const response = await fetch('/data/canada_fsa_boundaries.geojson');
      const fsaData = await response.json();
      
      // 标记可配送的FSA
      const deliverableFSAs = new Set();
      deliverablePostalCodes.forEach(postal => {
        const fsa = postal.postalCode.substring(0, 3);
        deliverableFSAs.add(fsa);
      });

      // 更新特性属性
      fsaData.features = fsaData.features.map(feature => ({
        ...feature,
        properties: {
          ...feature.properties,
          isDeliverable: deliverableFSAs.has(feature.properties.CFSAUID)
        }
      }));

      setMapData(fsaData);
    } catch (error) {
      console.error('加载FSA数据失败:', error);
      // 使用备用数据或示例数据
    }
  };

  loadFSAData();
}, []);
```

### 步骤3: 性能优化 (大数据集)

```javascript
// 分层加载策略
const loadFSAByZoomLevel = (zoom) => {
  if (zoom < 6) {
    // 显示省份边界
    return loadProvinceData();
  } else if (zoom < 10) {
    // 显示简化的FSA边界
    return loadSimplifiedFSAData();
  } else {
    // 显示完整的FSA边界
    return loadFullFSAData();
  }
};

// 视野内数据过滤
const filterFSAByBounds = (bounds, fsaData) => {
  return fsaData.features.filter(feature => {
    // 检查FSA是否在当前视野内
    return bounds.intersects(L.geoJSON(feature).getBounds());
  });
};
```

## PostGIS架构 (生产环境推荐)

### 数据库设计

```sql
-- 创建FSA表
CREATE TABLE fsa_boundaries (
    id SERIAL PRIMARY KEY,
    fsa_code VARCHAR(3) NOT NULL,
    province VARCHAR(50),
    name VARCHAR(200),
    is_deliverable BOOLEAN DEFAULT FALSE,
    geometry GEOMETRY(POLYGON, 4326),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建空间索引
CREATE INDEX idx_fsa_geometry ON fsa_boundaries USING GIST (geometry);
CREATE INDEX idx_fsa_code ON fsa_boundaries (fsa_code);
CREATE INDEX idx_deliverable ON fsa_boundaries (is_deliverable);
```

### API端点设计

```javascript
// Express.js API示例
app.get('/api/fsa/bounds/:bounds', async (req, res) => {
  const { bounds } = req.params;
  const [west, south, east, north] = bounds.split(',').map(Number);
  
  const query = `
    SELECT fsa_code, province, name, is_deliverable,
           ST_AsGeoJSON(ST_Simplify(geometry, $1)) as geometry
    FROM fsa_boundaries 
    WHERE ST_Intersects(
      geometry, 
      ST_MakeEnvelope($2, $3, $4, $5, 4326)
    )
  `;
  
  const simplification = req.query.zoom < 8 ? 0.01 : 0.001;
  const results = await db.query(query, [simplification, west, south, east, north]);
  
  res.json({
    type: "FeatureCollection",
    features: results.rows.map(row => ({
      type: "Feature",
      properties: {
        fsa_code: row.fsa_code,
        province: row.province,
        name: row.name,
        is_deliverable: row.is_deliverable
      },
      geometry: JSON.parse(row.geometry)
    }))
  });
});
```

## 当前示例效果

当前系统已包含**温哥华地区15个FSA**的真实边界示例：

- **V5A**: Vancouver (Hastings-Sunrise)
- **V5B**: Burnaby (Central)  
- **V5C**: Burnaby (North)
- **V5H**: Burnaby (South)
- **V5J**: Burnaby (Southwest)
- **V5K**: Vancouver (North Hastings-Sunrise) ✅ 可配送
- **V5L**: Vancouver (Grandview-Woodland)
- **V5M**: Burnaby (East)
- **V5N**: Vancouver (Renfrew-Collingwood)
- **V5P**: Vancouver (Victoria-Fraserview)
- **V6A**: Vancouver (Downtown Eastside)
- **V6B**: Vancouver (Downtown)
- **V6C**: Vancouver (Downtown)
- **V6E**: Vancouver (West End)
- **V6G**: Vancouver (Kitsilano)

## 部署建议

### 开发环境
- 使用简化的GeoJSON文件 (< 10MB)
- 客户端渲染和筛选
- 适合中小规模数据 (< 500个FSA)

### 生产环境  
- PostGIS + PostgreSQL 数据库
- 服务端空间查询和优化
- 支持全加拿大1600+个FSA
- 实时数据更新和备份

## 预期效果

实现后您将获得：

✅ **精确边界**: 基于官方统计数据的真实FSA形状  
✅ **智能切块**: 如图片所示的精确邮编区域划分  
✅ **颜色编码**: 可配送区域彩色显示，不可配送区域灰色  
✅ **高性能**: 支持大规模数据和流畅用户体验  
✅ **可扩展**: 易于添加新的配送区域和更新边界

立即在浏览器中查看温哥华地区的真实边界效果: `http://localhost:3000`