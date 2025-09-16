/**
 * 卡车配送地图数据服务
 * 提供地图数据构建、FSA边界合并、性能优化等功能
 */

import { DEFAULT_REGIONS } from '../../data/regionManagement.js';
import { getRegionConfig, getAllRegionConfigs } from '../unifiedStorage.js';

/**
 * 城市定义和配置
 * 包含主要城市的地理信息和配送区域映射
 */
export const CITIES = {
  '多伦多': {
    name: '多伦多',
    province: 'ON',
    center: [43.6532, -79.3832],
    zoom: 10,
    themeColor: '#0EA5E9',
    priority: 1,
    fsaPrefix: ['M'],
    boundaries: {
      north: 43.855,
      south: 43.580,
      east: -79.115,
      west: -79.639
    }
  },
  '温哥华': {
    name: '温哥华',
    province: 'BC',
    center: [49.2827, -123.1207],
    zoom: 10,
    themeColor: '#10B981',
    priority: 2,
    fsaPrefix: ['V6', 'V5'],
    boundaries: {
      north: 49.373,
      south: 49.198,
      east: -123.022,
      west: -123.224
    }
  },
  '蒙特利尔': {
    name: '蒙特利尔',
    province: 'QC',
    center: [45.5017, -73.5673],
    zoom: 10,
    themeColor: '#8B5CF6',
    priority: 3,
    fsaPrefix: ['H'],
    boundaries: {
      north: 45.705,
      south: 45.410,
      east: -73.475,
      west: -73.974
    }
  },
  '卡尔加里': {
    name: '卡尔加里',
    province: 'AB',
    center: [51.0447, -114.0719],
    zoom: 10,
    themeColor: '#F59E0B',
    priority: 4,
    fsaPrefix: ['T2', 'T3'],
    boundaries: {
      north: 51.153,
      south: 50.842,
      east: -113.829,
      west: -114.271
    }
  },
  '埃德蒙顿': {
    name: '埃德蒙顿',
    province: 'AB',
    center: [53.5461, -113.4938],
    zoom: 10,
    themeColor: '#EF4444',
    priority: 5,
    fsaPrefix: ['T5', 'T6'],
    boundaries: {
      north: 53.694,
      south: 53.396,
      east: -113.300,
      west: -113.678
    }
  },
  '渥太华': {
    name: '渥太华',
    province: 'ON',
    center: [45.4215, -75.6972],
    zoom: 10,
    themeColor: '#EC4899',
    priority: 6,
    fsaPrefix: ['K1', 'K2'],
    boundaries: {
      north: 45.537,
      south: 45.239,
      east: -75.455,
      west: -75.930
    }
  }
};

/**
 * 区域等级配置
 * 定义不同区域的优先级和透明度
 */
export const REGION_LEVELS = {
  1: { priority: 1, opacity: 0.9, strokeWeight: 3 },
  2: { priority: 2, opacity: 0.8, strokeWeight: 2.5 },
  3: { priority: 3, opacity: 0.7, strokeWeight: 2 },
  4: { priority: 4, opacity: 0.6, strokeWeight: 1.5 },
  5: { priority: 5, opacity: 0.5, strokeWeight: 1.5 },
  6: { priority: 6, opacity: 0.4, strokeWeight: 1 },
  7: { priority: 7, opacity: 0.3, strokeWeight: 1 },
  8: { priority: 8, opacity: 0.2, strokeWeight: 1 }
};

/**
 * 地图数据服务类
 */
class TruckMapDataService {
  constructor() {
    this.cache = new Map();
    this.boundaryCache = new Map();
    this.simplifiedCache = new Map();
  }

  /**
   * 获取所有城市的配送区域数据
   * @param {Object} options - 配置选项
   * @returns {Promise<Object>} 城市区域数据
   */
  async getCityRegionData(options = {}) {
    const {
      cities = Object.keys(CITIES),
      includeRegions = [1, 2, 3, 4, 5, 6, 7, 8],
      simplify = true,
      viewport = null
    } = options;

    const cacheKey = `cityRegions_${cities.join(',')}_${includeRegions.join(',')}_${simplify}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    console.log('🏗️ 构建城市区域数据...', { cities: cities.length, regions: includeRegions.length });

    try {
      const regionConfigs = await getAllRegionConfigs();
      const cityData = {};

      // 为每个城市构建区域数据
      for (const cityName of cities) {
        if (CITIES[cityName]) {
          cityData[cityName] = await this._buildCityData(
            CITIES[cityName],
            regionConfigs,
            includeRegions,
            simplify,
            viewport
          );
        }
      }

      // 缓存结果
      this.cache.set(cacheKey, cityData);
      
      console.log('✅ 城市区域数据构建完成', {
        cities: Object.keys(cityData).length,
        totalRegions: Object.values(cityData).reduce((sum, city) => sum + city.regions.length, 0)
      });

      return cityData;
    } catch (error) {
      console.error('❌ 构建城市区域数据失败:', error);
      throw error;
    }
  }

  /**
   * 为单个城市构建区域数据
   * @private
   */
  async _buildCityData(cityInfo, regionConfigs, includeRegions, simplify, viewport) {
    const cityRegions = [];

    for (const regionId of includeRegions) {
      const regionIdStr = regionId.toString();
      const regionConfig = regionConfigs[regionIdStr];
      
      if (!regionConfig || !regionConfig.fsaCodes || regionConfig.fsaCodes.length === 0) {
        continue;
      }

      // 筛选属于该城市的FSA
      const cityFSAs = regionConfig.fsaCodes.filter(fsa => 
        this._isFSAInCity(fsa, cityInfo)
      );

      if (cityFSAs.length > 0) {
        const regionData = await this._buildRegionBoundary(
          regionIdStr,
          cityFSAs,
          regionConfig,
          simplify,
          viewport
        );
        
        if (regionData) {
          cityRegions.push(regionData);
        }
      }
    }

    return {
      ...cityInfo,
      regions: cityRegions,
      totalFSAs: cityRegions.reduce((sum, region) => sum + region.fsaCount, 0),
      bounds: this._calculateCityBounds(cityRegions)
    };
  }

  /**
   * 判断FSA是否属于指定城市
   * @private
   */
  _isFSAInCity(fsa, cityInfo) {
    // 基于FSA前缀判断
    return cityInfo.fsaPrefix.some(prefix => fsa.startsWith(prefix));
  }

  /**
   * 构建区域边界数据
   * @private
   */
  async _buildRegionBoundary(regionId, fsaCodes, regionConfig, simplify, viewport) {
    const cacheKey = `region_${regionId}_${fsaCodes.join(',')}_${simplify}`;
    
    if (this.boundaryCache.has(cacheKey)) {
      return this.boundaryCache.get(cacheKey);
    }

    try {
      console.log(`🗺️ 构建区域${regionId}边界，包含${fsaCodes.length}个FSA`);

      // 获取FSA边界数据
      const fsaBoundaries = await this._getFSABoundaries(fsaCodes);
      
      if (fsaBoundaries.length === 0) {
        return null;
      }

      // 合并FSA多边形
      const mergedBoundary = this._mergeFSAPolygons(fsaBoundaries);
      
      // 简化边界（如果需要）
      const finalBoundary = simplify ? 
        this._simplifyBoundary(mergedBoundary) : 
        mergedBoundary;

      // 应用视口剔除
      if (viewport && !this._intersectsViewport(finalBoundary, viewport)) {
        return null;
      }

      const regionData = {
        id: regionId,
        name: regionConfig.name || `${regionId}区`,
        color: this._getRegionColor(regionId),
        opacity: REGION_LEVELS[regionId]?.opacity || 0.6,
        strokeWeight: REGION_LEVELS[regionId]?.strokeWeight || 2,
        boundary: finalBoundary,
        fsaCodes: fsaCodes,
        fsaCount: fsaCodes.length,
        bounds: this._calculatePolygonBounds(finalBoundary)
      };

      // 缓存结果
      this.boundaryCache.set(cacheKey, regionData);
      
      return regionData;
    } catch (error) {
      console.error(`❌ 构建区域${regionId}边界失败:`, error);
      return null;
    }
  }

  /**
   * 获取FSA边界数据
   * @private
   */
  async _getFSABoundaries(fsaCodes) {
    try {
      // 首先尝试完整数据文件
      let response = await fetch('/data/canada_fsa_boundaries_complete.json');
      
      if (!response.ok) {
        console.log('📋 完整FSA数据文件不存在，使用演示数据...');
        // 降级到演示数据
        response = await fetch('/data/canada_fsa_boundaries_demo.json');
        
        if (!response.ok) {
          throw new Error(`演示FSA数据获取失败: ${response.status}`);
        }
      }
      
      const allFSAData = await response.json();
      
      // 筛选出需要的FSA边界
      const filteredBoundaries = allFSAData.features.filter(feature => 
        fsaCodes.includes(feature.properties.CFSAUID)
      );
      
      console.log(`✅ 获取到${filteredBoundaries.length}个FSA边界，目标${fsaCodes.length}个`);
      
      return filteredBoundaries;
    } catch (error) {
      console.error('❌ 获取FSA边界数据失败:', error);
      return [];
    }
  }

  /**
   * 合并FSA多边形为区域边界
   * @private
   */
  _mergeFSAPolygons(fsaBoundaries) {
    if (fsaBoundaries.length === 0) return null;
    
    if (fsaBoundaries.length === 1) {
      return fsaBoundaries[0].geometry;
    }

    // 简化的多边形合并算法
    // 在实际实现中，应该使用更复杂的几何算法库如turf.js
    try {
      const allCoordinates = [];
      
      fsaBoundaries.forEach(feature => {
        if (feature.geometry && feature.geometry.coordinates) {
          if (feature.geometry.type === 'Polygon') {
            allCoordinates.push(...feature.geometry.coordinates[0]);
          } else if (feature.geometry.type === 'MultiPolygon') {
            feature.geometry.coordinates.forEach(polygon => {
              allCoordinates.push(...polygon[0]);
            });
          }
        }
      });

      // 计算凸包作为简化的合并结果
      const hull = this._calculateConvexHull(allCoordinates);
      
      return {
        type: 'Polygon',
        coordinates: [hull]
      };
    } catch (error) {
      console.error('多边形合并失败:', error);
      // 降级：返回第一个多边形
      return fsaBoundaries[0].geometry;
    }
  }

  /**
   * 计算凸包
   * @private
   */
  _calculateConvexHull(points) {
    if (points.length < 3) return points;

    // 简化的Graham扫描算法实现
    // 找到最下方的点
    let start = points[0];
    for (let i = 1; i < points.length; i++) {
      if (points[i][1] < start[1] || 
          (points[i][1] === start[1] && points[i][0] < start[0])) {
        start = points[i];
      }
    }

    // 按极角排序
    const sorted = points
      .filter(p => p !== start)
      .sort((a, b) => {
        const angleA = Math.atan2(a[1] - start[1], a[0] - start[0]);
        const angleB = Math.atan2(b[1] - start[1], b[0] - start[0]);
        return angleA - angleB;
      });

    // 构建凸包
    const hull = [start];
    for (const point of sorted) {
      while (hull.length > 1 && this._crossProduct(
        hull[hull.length - 2], hull[hull.length - 1], point) <= 0) {
        hull.pop();
      }
      hull.push(point);
    }

    // 闭合多边形
    if (hull.length > 2) {
      hull.push(hull[0]);
    }

    return hull;
  }

  /**
   * 计算向量叉积
   * @private
   */
  _crossProduct(o, a, b) {
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  }

  /**
   * 简化边界多边形
   * @private
   */
  _simplifyBoundary(geometry, tolerance = 0.001) {
    if (!geometry || !geometry.coordinates) return geometry;

    const cacheKey = `simplified_${JSON.stringify(geometry)}_${tolerance}`;
    if (this.simplifiedCache.has(cacheKey)) {
      return this.simplifiedCache.get(cacheKey);
    }

    try {
      // Douglas-Peucker算法简化多边形
      const simplified = {
        ...geometry,
        coordinates: geometry.coordinates.map(ring => 
          this._simplifyRing(ring, tolerance)
        )
      };

      this.simplifiedCache.set(cacheKey, simplified);
      return simplified;
    } catch (error) {
      console.error('边界简化失败:', error);
      return geometry;
    }
  }

  /**
   * 简化多边形环
   * @private
   */
  _simplifyRing(ring, tolerance) {
    if (ring.length <= 2) return ring;

    const simplified = [ring[0]];
    
    for (let i = 1; i < ring.length - 1; i++) {
      const distance = this._perpendicularDistance(
        ring[i], ring[i-1], ring[i+1]
      );
      
      if (distance > tolerance) {
        simplified.push(ring[i]);
      }
    }
    
    simplified.push(ring[ring.length - 1]);
    return simplified;
  }

  /**
   * 计算点到线段的垂直距离
   * @private
   */
  _perpendicularDistance(point, lineStart, lineEnd) {
    const dx = lineEnd[0] - lineStart[0];
    const dy = lineEnd[1] - lineStart[1];
    
    if (dx === 0 && dy === 0) {
      return Math.sqrt(
        Math.pow(point[0] - lineStart[0], 2) + 
        Math.pow(point[1] - lineStart[1], 2)
      );
    }
    
    const t = ((point[0] - lineStart[0]) * dx + (point[1] - lineStart[1]) * dy) / (dx * dx + dy * dy);
    const projection = [
      lineStart[0] + t * dx,
      lineStart[1] + t * dy
    ];
    
    return Math.sqrt(
      Math.pow(point[0] - projection[0], 2) + 
      Math.pow(point[1] - projection[1], 2)
    );
  }

  /**
   * 检查边界是否与视口相交
   * @private
   */
  _intersectsViewport(geometry, viewport) {
    if (!geometry || !viewport) return true;

    const bounds = this._calculatePolygonBounds(geometry);
    
    return !(bounds.east < viewport.west || 
             bounds.west > viewport.east || 
             bounds.north < viewport.south || 
             bounds.south > viewport.north);
  }

  /**
   * 计算多边形边界框
   * @private
   */
  _calculatePolygonBounds(geometry) {
    if (!geometry || !geometry.coordinates) return null;

    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;

    const processCoordinates = (coords) => {
      coords.forEach(coord => {
        if (Array.isArray(coord[0])) {
          processCoordinates(coord);
        } else {
          const [lng, lat] = coord;
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
        }
      });
    };

    processCoordinates(geometry.coordinates);

    return {
      north: maxLat,
      south: minLat,
      east: maxLng,
      west: minLng,
      center: [(minLat + maxLat) / 2, (minLng + maxLng) / 2]
    };
  }

  /**
   * 计算城市边界框
   * @private
   */
  _calculateCityBounds(regions) {
    if (regions.length === 0) return null;

    const allBounds = regions.map(r => r.bounds).filter(b => b);
    if (allBounds.length === 0) return null;

    return {
      north: Math.max(...allBounds.map(b => b.north)),
      south: Math.min(...allBounds.map(b => b.south)),
      east: Math.max(...allBounds.map(b => b.east)),
      west: Math.min(...allBounds.map(b => b.west))
    };
  }

  /**
   * 获取区域颜色
   * @private
   */
  _getRegionColor(regionId) {
    const regionInfo = DEFAULT_REGIONS.find(r => r.id === regionId.toString());
    return regionInfo ? regionInfo.color : '#6B7280';
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.cache.clear();
    this.boundaryCache.clear();
    this.simplifiedCache.clear();
    console.log('🧹 地图数据服务缓存已清理');
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    return {
      mainCache: this.cache.size,
      boundaryCache: this.boundaryCache.size,
      simplifiedCache: this.simplifiedCache.size,
      total: this.cache.size + this.boundaryCache.size + this.simplifiedCache.size
    };
  }
}

// 创建单例实例
export const truckMapDataService = new TruckMapDataService();
export default truckMapDataService;