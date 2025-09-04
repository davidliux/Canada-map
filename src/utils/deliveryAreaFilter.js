/**
 * 配送区域FSA筛选工具
 * 用于过滤和管理配送区域内的FSA显示
 */

import { getAllRegionConfigs, getRegionFSAs } from './unifiedStorage.js';

/**
 * 获取所有配送区域的FSA集合
 * @returns {Set<string>} 所有配送区域的FSA集合
 */
export const getAllDeliveryFSAs = async () => {
  try {
    const regionConfigs = await getAllRegionConfigs();
    const deliveryFSAs = new Set();
    
    // 遍历所有区域配置
    Object.keys(regionConfigs).forEach(regionId => {
      const config = regionConfigs[regionId];
      
      // 只包含活跃区域的FSA (支持多种字段名)
      const fsaCodes = config?.fsaCodes || config?.fsa_codes || config?.postalCodes || [];
      if (config && config.isActive && fsaCodes.length > 0) {
        fsaCodes.forEach(fsa => {
          if (fsa && fsa.trim()) {
            deliveryFSAs.add(fsa.trim().toUpperCase());
          }
        });
      }
    });
    
    console.log(`📦 配送区域FSA统计: ${deliveryFSAs.size} 个FSA`);
    return deliveryFSAs;
    
  } catch (error) {
    console.error('❌ 获取配送区域FSA失败:', error);
    return new Set();
  }
};

/**
 * 获取指定区域的FSA集合
 * @param {string[]} regionIds - 区域ID数组
 * @returns {Set<string>} 指定区域的FSA集合
 */
export const getRegionsFSAs = async (regionIds) => {
  try {
    const regionFSAs = new Set();
    
    for (const regionId of regionIds) {
      const fsaCodes = await getRegionFSAs(regionId);
      if (Array.isArray(fsaCodes)) {
        fsaCodes.forEach(fsa => {
          if (fsa && fsa.trim()) {
            regionFSAs.add(fsa.trim().toUpperCase());
          }
        });
      }
    }
    
    console.log(`🎯 指定区域FSA统计: ${regionFSAs.size} 个FSA (区域: ${regionIds.join(', ')})`);
    return regionFSAs;
    
  } catch (error) {
    console.error('❌ 获取指定区域FSA失败:', error);
    return new Set();
  }
};

/**
 * 检查FSA是否在配送区域内
 * @param {string} fsaCode - FSA代码
 * @returns {boolean} 是否在配送区域内
 */
export const isDeliveryFSA = async (fsaCode) => {
  if (!fsaCode) return false;
  
  const deliveryFSAs = await getAllDeliveryFSAs();
  return deliveryFSAs.has(fsaCode.trim().toUpperCase());
};

/**
 * 过滤地图数据，只保留配送区域的FSA
 * @param {Object} mapData - 原始地图数据
 * @param {string[]} selectedRegions - 选中的区域ID数组（可选）
 * @returns {Object} 过滤后的地图数据
 */
export const filterMapDataByDeliveryArea = async (mapData, selectedRegions = []) => {
  if (!mapData || !mapData.features) {
    return { type: 'FeatureCollection', features: [] };
  }
  
  try {
    let targetFSAs;
    
    // 如果有选中的区域，只显示这些区域的FSA
    if (selectedRegions.length > 0) {
      targetFSAs = await getRegionsFSAs(selectedRegions);
      console.log(`🎯 使用区域筛选: ${selectedRegions.join(', ')}`);
    } else {
      // 否则显示所有配送区域的FSA
      targetFSAs = await getAllDeliveryFSAs();
      console.log('📦 使用全部配送区域筛选');
    }
    
    const originalCount = mapData.features.length;
    
    // 过滤特征
    const filteredFeatures = mapData.features.filter(feature => {
      const fsaCode = feature.properties.CFSAUID;
      return fsaCode && targetFSAs.has(fsaCode.trim().toUpperCase());
    });
    
    const filteredCount = filteredFeatures.length;
    
    console.log(`🔍 地图数据筛选结果: ${originalCount} -> ${filteredCount} 个FSA`);
    
    return {
      ...mapData,
      features: filteredFeatures,
      metadata: {
        ...mapData.metadata,
        originalCount,
        filteredCount,
        filterType: selectedRegions.length > 0 ? 'region' : 'delivery',
        selectedRegions: selectedRegions.length > 0 ? selectedRegions : null
      }
    };
    
  } catch (error) {
    console.error('❌ 过滤地图数据失败:', error);
    return { type: 'FeatureCollection', features: [] };
  }
};

/**
 * 获取配送区域统计信息
 * @returns {Object} 统计信息
 */
export const getDeliveryAreaStats = async () => {
  try {
    const regionConfigs = await getAllRegionConfigs();
    const stats = {
      totalRegions: 0,
      activeRegions: 0,
      totalFSAs: 0,
      regionDetails: {}
    };
    
    Object.entries(regionConfigs).forEach(([regionId, config]) => {
      stats.totalRegions++;
      
      if (config.isActive) {
        stats.activeRegions++;
      }
      
      // 支持多种字段名格式
      const fsaCodes = config.fsaCodes || config.fsa_codes || config.postalCodes || [];
      const fsaCount = fsaCodes.length;
      stats.totalFSAs += fsaCount;
      
      stats.regionDetails[regionId] = {
        name: `${regionId}区`,
        isActive: config.isActive,
        fsaCount,
        hasWeightRanges: config.weightRanges && config.weightRanges.length > 0,
        activeWeightRanges: config.weightRanges ? config.weightRanges.filter(r => r.isActive).length : 0
      };
    });
    
    return stats;
    
  } catch (error) {
    console.error('❌ 获取配送区域统计失败:', error);
    return {
      totalRegions: 0,
      activeRegions: 0,
      totalFSAs: 0,
      regionDetails: {}
    };
  }
};

/**
 * 验证FSA是否属于指定区域
 * @param {string} fsaCode - FSA代码
 * @param {string} regionId - 区域ID
 * @returns {boolean} 是否属于指定区域
 */
export const isFSAInRegion = async (fsaCode, regionId) => {
  if (!fsaCode || !regionId) return false;
  
  try {
    const fsaCodes = await getRegionFSAs(regionId);
    if (!Array.isArray(fsaCodes)) return false;
    
    const normalizedFSA = fsaCode.trim().toUpperCase();
    return fsaCodes.includes(normalizedFSA);
  } catch (error) {
    console.error(`❌ 检查FSA ${fsaCode} 是否属于区域 ${regionId} 失败:`, error);
    return false;
  }
};

/**
 * 获取FSA所属的区域ID
 * @param {string} fsaCode - FSA代码
 * @returns {string|null} 区域ID或null
 */
export const getFSARegion = async (fsaCode) => {
  if (!fsaCode) return null;
  
  try {
    const regionConfigs = await getAllRegionConfigs();
    const normalizedFSA = fsaCode.trim().toUpperCase();
    
    for (const [regionId, config] of Object.entries(regionConfigs)) {
      if (config.postalCodes && Array.isArray(config.postalCodes)) {
        if (config.postalCodes.includes(normalizedFSA)) {
          return regionId;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`❌ 获取FSA ${fsaCode} 所属区域失败:`, error);
    return null;
  }
};

/**
 * 批量检查FSA列表的配送状态
 * @param {string[]} fsaCodes - FSA代码数组
 * @returns {Object} 检查结果
 */
export const batchCheckDeliveryStatus = async (fsaCodes) => {
  if (!Array.isArray(fsaCodes)) {
    return { deliverable: [], undeliverable: [], total: 0 };
  }
  
  try {
    const deliveryFSAs = await getAllDeliveryFSAs();
    const deliverable = [];
    const undeliverable = [];
    
    fsaCodes.forEach(fsa => {
      if (fsa && fsa.trim()) {
        const normalizedFSA = fsa.trim().toUpperCase();
        if (deliveryFSAs.has(normalizedFSA)) {
          deliverable.push(normalizedFSA);
        } else {
          undeliverable.push(normalizedFSA);
        }
      }
    });
    
    console.log(`📊 批量检查结果: ${deliverable.length} 可配送, ${undeliverable.length} 不可配送`);
    
    return {
      deliverable,
      undeliverable,
      total: fsaCodes.length,
      deliveryRate: fsaCodes.length > 0 ? (deliverable.length / fsaCodes.length * 100).toFixed(1) : 0
    };
    
  } catch (error) {
    console.error('❌ 批量检查配送状态失败:', error);
    return { deliverable: [], undeliverable: [], total: 0 };
  }
};

/**
 * 获取未分配到任何区域的FSA（从原始地图数据中）
 * @param {Object} originalMapData - 原始地图数据
 * @returns {string[]} 未分配的FSA列表
 */
export const getUnassignedFSAs = async (originalMapData) => {
  if (!originalMapData || !originalMapData.features) {
    return [];
  }
  
  try {
    const deliveryFSAs = await getAllDeliveryFSAs();
    const unassigned = [];
    
    originalMapData.features.forEach(feature => {
      const fsaCode = feature.properties.CFSAUID;
      if (fsaCode && !deliveryFSAs.has(fsaCode.trim().toUpperCase())) {
        unassigned.push(fsaCode);
      }
    });
    
    console.log(`📋 未分配FSA统计: ${unassigned.length} 个`);
    return unassigned;
    
  } catch (error) {
    console.error('❌ 获取未分配FSA失败:', error);
    return [];
  }
};

export default {
  getAllDeliveryFSAs,
  getRegionsFSAs,
  isDeliveryFSA,
  filterMapDataByDeliveryArea,
  getDeliveryAreaStats,
  isFSAInRegion,
  getFSARegion,
  batchCheckDeliveryStatus,
  getUnassignedFSAs
};
