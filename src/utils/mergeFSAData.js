/**
 * FSA数据合并工具
 * 用于处理和增强FSA数据
 */

import { completeFSAData, getFSAsByProvince, getFSADetails } from '../data/canadaFSAData';
import fsaBoundariesData from '../../public/data/canada_fsa_boundaries.json';

/**
 * 获取所有FSA的增强数据
 * 将FSA代码转换为包含详细信息的对象
 */
export const getEnhancedFSAData = () => {
  // completeFSAData是一个FSA代码数组
  // 需要从fsaBoundariesData中获取详细信息
  return completeFSAData.map(fsaCode => {
    const feature = fsaBoundariesData.features.find(
      f => f.properties.CFSAUID === fsaCode
    );

    if (feature) {
      return {
        fsa: fsaCode,
        province: feature.properties.PRNAME || '',
        city: '', // 原始数据中没有城市信息
        isDeliverable: true, // 所有FSA都可配送
        status: 'active',
        landArea: feature.properties.LANDAREA
      };
    }

    return {
      fsa: fsaCode,
      province: '',
      city: '',
      isDeliverable: true,
      status: 'active'
    };
  });
};

/**
 * 获取缺失的FSA（现在没有缺失的，因为所有FSA都可配送）
 */
export const getMissingFSAs = () => {
  return []; // 没有缺失的FSA
};

/**
 * 获取FSA覆盖率统计
 */
export const getFSACoverageStats = () => {
  const byProvince = getFSAsByProvince();

  // 按省份统计
  const provinceStats = {};
  Object.keys(byProvince).forEach(province => {
    provinceStats[province] = {
      total: byProvince[province].length,
      deliverable: byProvince[province].length, // 全部可配送
      missing: 0
    };
  });

  return {
    total: completeFSAData.length,
    deliverable: completeFSAData.length,
    missing: 0,
    coverageRate: '100.00%',
    provinceStats
  };
};

/**
 * 搜索FSA
 * @param {string} query - 搜索关键词（FSA代码或省份）
 */
export const searchFSA = (query) => {
  const searchTerm = query.toUpperCase();
  const enhancedData = getEnhancedFSAData();

  return enhancedData.filter(item =>
    item.fsa.includes(searchTerm) ||
    item.province.toUpperCase().includes(searchTerm)
  );
};

/**
 * 批量添加FSA到可配送列表（现在所有FSA都已经可配送）
 * @param {Array} fsaCodes - FSA代码数组
 */
export const addFSAsToDeliverable = (fsaCodes) => {
  // 所有FSA都已经可配送，直接返回当前列表
  return completeFSAData;
};

/**
 * 按省份分组FSA
 */
export const groupFSAByProvince = () => {
  const byProvince = getFSAsByProvince();
  const grouped = {};

  // 省份代码到名称的映射
  const provinceNames = {
    'BC': 'British Columbia',
    'AB': 'Alberta',
    'SK': 'Saskatchewan',
    'MB': 'Manitoba',
    'ON': 'Ontario',
    'QC': 'Quebec',
    'NB': 'New Brunswick',
    'NS': 'Nova Scotia',
    'PE': 'Prince Edward Island',
    'NL': 'Newfoundland and Labrador',
    'YT': 'Yukon',
    'NT': 'Northwest Territories',
    'NU': 'Nunavut'
  };

  Object.keys(byProvince).forEach(provinceCode => {
    const provinceName = provinceNames[provinceCode] || provinceCode;
    grouped[provinceCode] = {
      name: provinceName,
      fsas: byProvince[provinceCode].map(fsaCode => ({
        fsa: fsaCode,
        province: provinceName,
        isDeliverable: true
      })),
      deliverableCount: byProvince[provinceCode].length,
      totalCount: byProvince[provinceCode].length
    };
  });

  return grouped;
};

export default {
  getEnhancedFSAData,
  getMissingFSAs,
  getFSACoverageStats,
  searchFSA,
  addFSAsToDeliverable,
  groupFSAByProvince
};