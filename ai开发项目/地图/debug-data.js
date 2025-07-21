// 调试脚本：检查数据状态
const fs = require('fs');
const path = require('path');

// 模拟localStorage
const mockLocalStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  }
};

// 检查是否有旧数据
console.log('=== 数据状态检查 ===');

// 检查统一存储数据
try {
  const unifiedData = mockLocalStorage.getItem('unified_region_data');
  if (unifiedData) {
    console.log('统一存储数据存在:', JSON.parse(unifiedData));
  } else {
    console.log('统一存储数据不存在，需要初始化');
  }
} catch (error) {
  console.error('读取统一存储数据失败:', error);
}

// 检查旧的FSA配置数据
try {
  const fsaConfigs = mockLocalStorage.getItem('fsa_configurations');
  if (fsaConfigs) {
    console.log('旧FSA配置数据存在:', JSON.parse(fsaConfigs));
  } else {
    console.log('旧FSA配置数据不存在');
  }
} catch (error) {
  console.error('读取旧FSA配置数据失败:', error);
}

// 检查区域邮编数据
for (let i = 1; i <= 8; i++) {
  try {
    const regionData = mockLocalStorage.getItem(`region_${i}_postal_codes`);
    if (regionData) {
      console.log(`区域${i}邮编数据存在:`, JSON.parse(regionData));
    }
  } catch (error) {
    console.error(`读取区域${i}邮编数据失败:`, error);
  }
}

console.log('=== 检查完成 ===');
