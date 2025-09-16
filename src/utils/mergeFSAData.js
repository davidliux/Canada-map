/**
 * FSA数据合并工具
 * 用于合并现有的可配送FSA和完整的FSA数据
 */

import { deliverableFSAs } from '../data/deliverableFSA';
import { completeFSAData, getAllFSACodes } from '../data/completeFSAData';

/**
 * 获取所有FSA的增强数据
 * 合并可配送状态和详细信息
 */
export const getEnhancedFSAData = () => {
  const deliverableSet = new Set(deliverableFSAs);

  return completeFSAData.map(fsa => ({
    ...fsa,
    isDeliverable: deliverableSet.has(fsa.fsa),
    status: deliverableSet.has(fsa.fsa) ? 'active' : 'available'
  }));
};

/**
 * 获取缺失的FSA（在完整列表中但不在可配送列表中）
 */
export const getMissingFSAs = () => {
  const deliverableSet = new Set(deliverableFSAs);
  const allFSAs = getAllFSACodes();

  return allFSAs.filter(fsa => !deliverableSet.has(fsa));
};

/**
 * 获取FSA覆盖率统计
 */
export const getFSACoverageStats = () => {
  const deliverableSet = new Set(deliverableFSAs);
  const allFSAs = getAllFSACodes();
  const missingFSAs = getMissingFSAs();

  // 按省份统计
  const provinceStats = {};
  completeFSAData.forEach(item => {
    if (!provinceStats[item.province]) {
      provinceStats[item.province] = {
        total: 0,
        deliverable: 0,
        missing: 0
      };
    }
    provinceStats[item.province].total++;
    if (deliverableSet.has(item.fsa)) {
      provinceStats[item.province].deliverable++;
    } else {
      provinceStats[item.province].missing++;
    }
  });

  return {
    total: allFSAs.length,
    deliverable: deliverableFSAs.length,
    missing: missingFSAs.length,
    coverageRate: ((deliverableFSAs.length / allFSAs.length) * 100).toFixed(2) + '%',
    provinceStats
  };
};

/**
 * 搜索FSA
 * @param {string} query - 搜索关键词（FSA代码、城市名或省份）
 */
export const searchFSA = (query) => {
  const searchTerm = query.toLowerCase();
  const deliverableSet = new Set(deliverableFSAs);

  return completeFSAData.filter(item =>
    item.fsa.toLowerCase().includes(searchTerm) ||
    item.city.toLowerCase().includes(searchTerm) ||
    item.province.toLowerCase().includes(searchTerm)
  ).map(item => ({
    ...item,
    isDeliverable: deliverableSet.has(item.fsa)
  }));
};

/**
 * 批量添加FSA到可配送列表
 * @param {Array} fsaCodes - FSA代码数组
 */
export const addFSAsToDeliverable = (fsaCodes) => {
  const currentSet = new Set(deliverableFSAs);
  fsaCodes.forEach(fsa => currentSet.add(fsa));

  // 返回更新后的数组（按字母排序）
  return Array.from(currentSet).sort();
};

/**
 * 按省份分组FSA
 */
export const groupFSAByProvince = () => {
  const grouped = {};
  const deliverableSet = new Set(deliverableFSAs);

  completeFSAData.forEach(item => {
    if (!grouped[item.province]) {
      grouped[item.province] = {
        name: item.province,
        fsas: [],
        deliverableCount: 0,
        totalCount: 0
      };
    }

    grouped[item.province].fsas.push({
      ...item,
      isDeliverable: deliverableSet.has(item.fsa)
    });

    grouped[item.province].totalCount++;
    if (deliverableSet.has(item.fsa)) {
      grouped[item.province].deliverableCount++;
    }
  });

  // 对每个省份的FSA列表排序
  Object.values(grouped).forEach(province => {
    province.fsas.sort((a, b) => a.fsa.localeCompare(b.fsa));
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