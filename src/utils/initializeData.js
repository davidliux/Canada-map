/**
 * 初始化数据脚本
 * 用于在 Vercel 部署后初始化基础数据
 */

import { completeFSAData } from '../data/canadaFSAData';
import { saveRegionConfig } from './unifiedStorage';

// 默认的区域FSA分配
const DEFAULT_REGION_ASSIGNMENTS = {
  '1': {
    id: '1',
    name: '1区',
    fsaCodes: completeFSAData.slice(0, 260), // 前260个FSA分配给1区
    postalCodes: [],
    weightRanges: [
      { id: '0-10', min: 0, max: 10, price: 15.99, isActive: true },
      { id: '10-20', min: 10, max: 20, price: 25.99, isActive: true },
      { id: '20-30', min: 20, max: 30, price: 35.99, isActive: true },
      { id: '30-50', min: 30, max: 50, price: 55.99, isActive: true },
      { id: '50-100', min: 50, max: 100, price: 99.99, isActive: true }
    ]
  },
  '2': {
    id: '2',
    name: '2区',
    fsaCodes: completeFSAData.slice(260, 400), // 接下来140个FSA给2区
    postalCodes: [],
    weightRanges: [
      { id: '0-10', min: 0, max: 10, price: 18.99, isActive: true },
      { id: '10-20', min: 10, max: 20, price: 29.99, isActive: true },
      { id: '20-30', min: 20, max: 30, price: 39.99, isActive: true },
      { id: '30-50', min: 30, max: 50, price: 59.99, isActive: true },
      { id: '50-100', min: 50, max: 100, price: 109.99, isActive: true }
    ]
  },
  '3': {
    id: '3',
    name: '3区',
    fsaCodes: completeFSAData.slice(400, 500),
    postalCodes: [],
    weightRanges: [
      { id: '0-10', min: 0, max: 10, price: 22.99, isActive: true },
      { id: '10-20', min: 10, max: 20, price: 35.99, isActive: true },
      { id: '20-30', min: 20, max: 30, price: 45.99, isActive: true },
      { id: '30-50', min: 30, max: 50, price: 69.99, isActive: true },
      { id: '50-100', min: 50, max: 100, price: 129.99, isActive: true }
    ]
  },
  '4': {
    id: '4',
    name: '4区',
    fsaCodes: completeFSAData.slice(500, 646), // 分配146个FSA给4区
    postalCodes: [],
    weightRanges: [
      { id: '0-10', min: 0, max: 10, price: 24.99, isActive: true },
      { id: '10-20', min: 10, max: 20, price: 38.99, isActive: true },
      { id: '20-30', min: 20, max: 30, price: 48.99, isActive: true },
      { id: '30-50', min: 30, max: 50, price: 72.99, isActive: true },
      { id: '50-100', min: 50, max: 100, price: 139.99, isActive: true }
    ]
  },
  '5': {
    id: '5',
    name: '5区',
    fsaCodes: completeFSAData.slice(646, 678), // 分配32个FSA给5区
    postalCodes: [],
    weightRanges: [
      { id: '0-10', min: 0, max: 10, price: 26.99, isActive: true },
      { id: '10-20', min: 10, max: 20, price: 42.99, isActive: true },
      { id: '20-30', min: 20, max: 30, price: 52.99, isActive: true },
      { id: '30-50', min: 30, max: 50, price: 78.99, isActive: true },
      { id: '50-100', min: 50, max: 100, price: 149.99, isActive: true }
    ]
  },
  '6': {
    id: '6',
    name: '6区',
    fsaCodes: completeFSAData.slice(678, 678), // 暂时没有分配FSA
    postalCodes: [],
    weightRanges: [
      { id: '0-10', min: 0, max: 10, price: 28.99, isActive: true },
      { id: '10-20', min: 10, max: 20, price: 45.99, isActive: true },
      { id: '20-30', min: 20, max: 30, price: 55.99, isActive: true },
      { id: '30-50', min: 30, max: 50, price: 82.99, isActive: true },
      { id: '50-100', min: 50, max: 100, price: 159.99, isActive: true }
    ]
  },
  '7': {
    id: '7',
    name: '7区',
    fsaCodes: completeFSAData.slice(678, 678), // 暂时没有分配FSA
    postalCodes: [],
    weightRanges: [
      { id: '0-10', min: 0, max: 10, price: 30.99, isActive: true },
      { id: '10-20', min: 10, max: 20, price: 48.99, isActive: true },
      { id: '20-30', min: 20, max: 30, price: 58.99, isActive: true },
      { id: '30-50', min: 30, max: 50, price: 86.99, isActive: true },
      { id: '50-100', min: 50, max: 100, price: 169.99, isActive: true }
    ]
  },
  '8': {
    id: '8',
    name: '8区',
    fsaCodes: completeFSAData.slice(678, 678), // 暂时没有分配FSA
    postalCodes: [],
    weightRanges: [
      { id: '0-10', min: 0, max: 10, price: 32.99, isActive: true },
      { id: '10-20', min: 10, max: 20, price: 52.99, isActive: true },
      { id: '20-30', min: 20, max: 30, price: 62.99, isActive: true },
      { id: '30-50', min: 30, max: 50, price: 92.99, isActive: true },
      { id: '50-100', min: 50, max: 100, price: 179.99, isActive: true }
    ]
  }
};

/**
 * 初始化系统数据
 */
export function initializeSystemData() {
  try {
    // 检查是否已有数据
    const existingData = localStorage.getItem('region_1');
    
    if (!existingData) {
      console.log('🚀 初始化系统数据...');
      
      // 保存默认区域配置
      Object.entries(DEFAULT_REGION_ASSIGNMENTS).forEach(([regionId, config]) => {
        saveRegionConfig(regionId, config);
        console.log(`✅ 初始化${config.name}完成`);
      });
      
      // 保存初始化标记
      localStorage.setItem('system_initialized', 'true');
      localStorage.setItem('initialization_date', new Date().toISOString());
      
      console.log('✅ 系统数据初始化完成！');
      return true;
    } else {
      console.log('ℹ️ 系统已有数据，跳过初始化');
      return false;
    }
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    return false;
  }
}

/**
 * 重置系统数据
 */
export function resetSystemData() {
  if (window.confirm('确定要重置所有数据吗？这将清除所有配置。')) {
    localStorage.clear();
    sessionStorage.clear(); // 清除会话存储
    initializeSystemData();
    // 延迟刷新，确保数据保存完成
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }
}