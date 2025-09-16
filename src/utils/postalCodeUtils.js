/**
 * 邮编工具函数
 * 
 * 提供邮编相关的工具函数
 */

import { deliverablePostalCodes } from '../data/postalCodes.js';

/**
 * 根据FSA代码获取邮编列表
 * @param {string} fsaCode - FSA代码（如 M5V）
 * @returns {string[]} 邮编列表
 */
export const getPostalCodesByFSA = (fsaCode) => {
  if (!fsaCode || typeof fsaCode !== 'string') {
    return [];
  }
  
  const upperFSA = fsaCode.toUpperCase();
  
  // 从邮编数据中筛选匹配的邮编
  const postalCodes = deliverablePostalCodes
    .filter(item => {
      // 提取邮编的前3个字符（FSA部分）
      const itemFSA = item.postalCode.replace(/\s+/g, '').substring(0, 3).toUpperCase();
      return itemFSA === upperFSA;
    })
    .map(item => item.postalCode);
  
  // 如果没有真实数据，生成示例邮编
  if (postalCodes.length === 0) {
    // 生成一些示例邮编用于演示
    const samples = [];
    const letters = 'ABCDEFGHJKLMNPRSTUVWXY';
    const digits = '0123456789';
    
    // 生成5-10个示例邮编
    const count = Math.floor(Math.random() * 6) + 5;
    for (let i = 0; i < count; i++) {
      const l1 = letters[Math.floor(Math.random() * letters.length)];
      const d1 = digits[Math.floor(Math.random() * digits.length)];
      const l2 = letters[Math.floor(Math.random() * letters.length)];
      samples.push(`${fsaCode} ${d1}${l1}${d1}`);
    }
    return samples;
  }
  
  return [...new Set(postalCodes)]; // 去重
};

/**
 * 批量获取多个FSA的邮编
 * @param {string[]} fsaCodes - FSA代码列表
 * @returns {Object} FSA到邮编列表的映射
 */
export const getPostalCodesForMultipleFSAs = (fsaCodes) => {
  const result = {};
  
  if (!Array.isArray(fsaCodes)) {
    return result;
  }
  
  fsaCodes.forEach(fsa => {
    result[fsa] = getPostalCodesByFSA(fsa);
  });
  
  return result;
};

/**
 * 获取FSA的邮编统计信息
 * @param {string} fsaCode - FSA代码
 * @returns {Object} 统计信息
 */
export const getFSAPostalCodeStats = (fsaCode) => {
  const postalCodes = getPostalCodesByFSA(fsaCode);
  
  return {
    fsa: fsaCode,
    totalCount: postalCodes.length,
    samples: postalCodes.slice(0, 3),
    hasMore: postalCodes.length > 3
  };
};

/**
 * 验证加拿大邮编格式
 * @param {string} postalCode - 邮编
 * @returns {boolean} 是否有效
 */
export const validateCanadianPostalCode = (postalCode) => {
  // 加拿大邮编格式: A1A 1A1 或 A1A1A1
  const regex = /^[A-Za-z]\d[A-Za-z][\s-]?\d[A-Za-z]\d$/;
  return regex.test(postalCode);
};

/**
 * 从邮编提取FSA代码
 * @param {string} postalCode - 完整邮编
 * @returns {string|null} FSA代码
 */
export const extractFSAFromPostalCode = (postalCode) => {
  if (!postalCode || typeof postalCode !== 'string') {
    return null;
  }
  
  // 移除空格和连字符
  const cleaned = postalCode.replace(/[\s-]/g, '').toUpperCase();
  
  if (cleaned.length < 3) {
    return null;
  }
  
  return cleaned.substring(0, 3);
};

export default {
  getPostalCodesByFSA,
  getPostalCodesForMultipleFSAs,
  getFSAPostalCodeStats,
  validateCanadianPostalCode,
  extractFSAFromPostalCode
};