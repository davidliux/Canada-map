/**
 * 初始化数据脚本
 * 用于在 Vercel 部署后初始化基础数据
 */

import { deliverableFSAs } from '../data/deliverableFSA';
import { saveRegionConfig } from './unifiedStorage';

// 默认的区域FSA分配
const DEFAULT_REGION_ASSIGNMENTS = {
  '1': {
    id: '1',
    name: '1区',
    fsa: deliverableFSAs.slice(0, 260), // 前260个FSA分配给1区
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
    fsa: deliverableFSAs.slice(260, 400), // 接下来140个FSA给2区
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
    fsa: deliverableFSAs.slice(400, 500),
    postalCodes: [],
    weightRanges: [
      { id: '0-10', min: 0, max: 10, price: 22.99, isActive: true },
      { id: '10-20', min: 10, max: 20, price: 35.99, isActive: true },
      { id: '20-30', min: 20, max: 30, price: 45.99, isActive: true },
      { id: '30-50', min: 30, max: 50, price: 69.99, isActive: true },
      { id: '50-100', min: 50, max: 100, price: 129.99, isActive: true }
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