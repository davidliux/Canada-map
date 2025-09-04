/**
 * 初始化 Supabase 数据库中的 FSA 数据
 * 可以在浏览器控制台中运行或通过按钮触发
 */

import { regionService } from '../services/supabaseClient';

// FSA 数据配置
const FSA_DATA_CONFIG = {
  '1': {
    name: '1区 - 多伦多地区',
    fsaCodes: ["M1B","M1C","M1E","M1G","M1H","M1J","M1K","M1L","M1M","M1N","M1P","M1R","M1S","M1T","M1V","M1W","M1X","M2H","M2J","M2K","M2L","M2M","M2N","M2P","M2R","M3A","M3B","M3C","M3H","M3J","M3K","M3L","M3M","M3N","M4A","M4B","M4C","M4E","M4G","M4H","M4J","M4K","M4L","M4M","M4N","M4P","M4R","M4S","M4T","M4V","M4W","M4X","M4Y","M5A","M5B","M5C","M5E","M5G","M5H","M5J","M5K","M5L","M5M","M5N","M5P","M5R","M5S","M5T","M5V","M5W","M5X","M6A","M6B","M6C","M6E","M6G","M6H","M6J","M6K","M6L","M6M","M6N","M6P","M6R","M6S","M7A","M7R","M7Y","M8V","M8W","M8X","M8Y","M8Z","M9A","M9B","M9C","M9L","M9M","M9N","M9P","M9R","M9V","M9W"]
  },
  '2': {
    name: '2区 - 温哥华地区',
    fsaCodes: ["V5A","V5B","V5C","V5E","V5G","V5H","V5J","V5K","V5L","V5M","V5N","V5P","V5R","V5S","V5T","V5V","V5W","V5X","V5Y","V5Z","V6A","V6B","V6C","V6E","V6G","V6H","V6J","V6K","V6L","V6M","V6N","V6P","V6R","V6S","V6T","V6V","V6W","V6X","V6Y","V6Z","V7A","V7B","V7C","V7E","V7G","V7H","V7J","V7K","V7L","V7M","V7N","V7P","V7R","V7S","V7T","V7V","V7W","V7X","V7Y"]
  },
  '3': {
    name: '3区 - 蒙特利尔地区',
    fsaCodes: ["H1A","H1B","H1C","H1E","H1G","H1H","H1J","H1K","H1L","H1M","H1N","H1P","H1R","H1S","H1T","H1V","H1W","H1X","H1Y","H1Z","H2A","H2B","H2C","H2E","H2G","H2H","H2J","H2K","H2L","H2M","H2N","H2P","H2R","H2S","H2T","H2V","H2W","H2X","H2Y","H2Z","H3A","H3B","H3C","H3E","H3G","H3H","H3J","H3K","H3L","H3M","H3N","H3P","H3R","H3S","H3T","H3V","H3W","H3X","H3Y","H3Z","H4A","H4B","H4C","H4E","H4G","H4H","H4J","H4K","H4L","H4M","H4N","H4P","H4R","H4S","H4T","H4V","H4W","H4X","H4Y","H4Z"]
  },
  '4': {
    name: '4区 - 卡尔加里地区',
    fsaCodes: ["T1X","T1Y","T2A","T2B","T2C","T2E","T2G","T2H","T2J","T2K","T2L","T2M","T2N","T2P","T2R","T2S","T2T","T2V","T2W","T2X","T2Y","T2Z","T3A","T3B","T3C","T3E","T3G","T3H","T3J","T3K","T3L","T3M","T3N","T3P","T3R","T3S","T3Z"]
  },
  '5': {
    name: '5区 - 埃德蒙顿地区',
    fsaCodes: ["T5A","T5B","T5C","T5E","T5G","T5H","T5J","T5K","T5L","T5M","T5N","T5P","T5R","T5S","T5T","T5V","T5W","T5X","T5Y","T5Z","T6A","T6B","T6C","T6E","T6G","T6H","T6J","T6K","T6L","T6M","T6N","T6P","T6R","T6S","T6T","T6V","T6W","T6X"]
  },
  '6': {
    name: '6区 - 渥太华地区',
    fsaCodes: ["K1A","K1B","K1C","K1E","K1G","K1H","K1J","K1K","K1L","K1M","K1N","K1P","K1R","K1S","K1T","K1V","K1W","K1X","K1Y","K1Z","K2A","K2B","K2C","K2E","K2G","K2H","K2J","K2K","K2L","K2M","K2P","K2R","K2S","K2T","K2V","K2W","K4A","K4B","K4C","K4K","K4M","K4P","K4R"]
  },
  '7': {
    name: '7区 - 温尼伯地区',
    fsaCodes: ["R2C","R2E","R2G","R2H","R2J","R2K","R2L","R2M","R2N","R2P","R2R","R2V","R2W","R2X","R2Y","R3A","R3B","R3C","R3E","R3G","R3H","R3J","R3K","R3L","R3M","R3N","R3P","R3R","R3S","R3T","R3V","R3W","R3X","R3Y"]
  },
  '8': {
    name: '8区 - 哈利法克斯地区',
    fsaCodes: ["B3A","B3B","B3E","B3G","B3H","B3J","B3K","B3L","B3M","B3N","B3P","B3R","B3S","B3T","B3V","B3Z","B4A","B4B","B4C","B4E","B4G","B4H","B4N","B4P","B4R","B4V"]
  }
};

/**
 * 初始化所有区域的 FSA 数据
 */
export async function initializeAllRegionsFSA() {
  console.log('🚀 开始初始化 Supabase FSA 数据...');
  
  const results = {
    success: [],
    failed: []
  };
  
  for (const [regionId, config] of Object.entries(FSA_DATA_CONFIG)) {
    try {
      console.log(`📝 更新区域 ${regionId}: ${config.name}`);
      
      // 获取当前区域数据
      const currentRegion = await regionService.getRegion(regionId);
      if (!currentRegion) {
        console.error(`❌ 区域 ${regionId} 不存在`);
        results.failed.push(regionId);
        continue;
      }
      
      // 更新 FSA 数据
      const updated = await regionService.upsertRegion({
        ...currentRegion,
        id: regionId,
        name: config.name,
        fsaCodes: config.fsaCodes,
        fsa_codes: config.fsaCodes, // 兼容两种格式
        metadata: {
          ...currentRegion.metadata,
          totalFSAs: config.fsaCodes.length,
          lastUpdated: new Date().toISOString()
        }
      });
      
      if (updated) {
        console.log(`✅ 区域 ${regionId} 更新成功，添加了 ${config.fsaCodes.length} 个FSA`);
        results.success.push(regionId);
      } else {
        console.error(`❌ 区域 ${regionId} 更新失败`);
        results.failed.push(regionId);
      }
    } catch (error) {
      console.error(`❌ 处理区域 ${regionId} 时出错:`, error);
      results.failed.push(regionId);
    }
  }
  
  console.log('\n📊 初始化完成:');
  console.log(`✅ 成功: ${results.success.length} 个区域`);
  console.log(`❌ 失败: ${results.failed.length} 个区域`);
  
  if (results.success.length > 0) {
    console.log('成功的区域:', results.success.join(', '));
  }
  if (results.failed.length > 0) {
    console.log('失败的区域:', results.failed.join(', '));
  }
  
  return results;
}

/**
 * 初始化单个区域的 FSA 数据
 */
export async function initializeRegionFSA(regionId) {
  const config = FSA_DATA_CONFIG[regionId];
  if (!config) {
    console.error(`区域 ${regionId} 的配置不存在`);
    return false;
  }
  
  try {
    console.log(`📝 更新区域 ${regionId}: ${config.name}`);
    
    // 获取当前区域数据
    const currentRegion = await regionService.getRegion(regionId);
    if (!currentRegion) {
      console.error(`区域 ${regionId} 不存在`);
      return false;
    }
    
    // 更新 FSA 数据
    const updated = await regionService.upsertRegion({
      ...currentRegion,
      id: regionId,
      name: config.name,
      fsaCodes: config.fsaCodes,
      fsa_codes: config.fsaCodes, // 兼容两种格式
      metadata: {
        ...currentRegion.metadata,
        totalFSAs: config.fsaCodes.length,
        lastUpdated: new Date().toISOString()
      }
    });
    
    if (updated) {
      console.log(`✅ 区域 ${regionId} 更新成功，添加了 ${config.fsaCodes.length} 个FSA`);
      return true;
    } else {
      console.error(`❌ 区域 ${regionId} 更新失败`);
      return false;
    }
  } catch (error) {
    console.error(`处理区域 ${regionId} 时出错:`, error);
    return false;
  }
}

/**
 * 验证所有区域的 FSA 数据
 */
export async function verifyRegionsFSA() {
  console.log('🔍 验证 Supabase 中的 FSA 数据...');
  
  try {
    const regions = await regionService.getAllRegions();
    
    if (!regions) {
      console.error('无法获取区域数据');
      return;
    }
    
    console.log('\n📊 当前区域 FSA 统计:');
    console.log('─'.repeat(50));
    
    for (const [id, region] of Object.entries(regions)) {
      const fsaCount = region.fsaCodes ? region.fsaCodes.length : 0;
      const status = fsaCount > 0 ? '✅' : '⚠️';
      console.log(`${status} 区域 ${id} (${region.name}): ${fsaCount} 个FSA`);
    }
    
    console.log('─'.repeat(50));
    
    const totalFSAs = Object.values(regions).reduce((sum, r) => {
      return sum + (r.fsaCodes ? r.fsaCodes.length : 0);
    }, 0);
    
    console.log(`总计: ${totalFSAs} 个FSA`);
  } catch (error) {
    console.error('验证失败:', error);
  }
}

// 导出到全局以便在控制台使用
if (typeof window !== 'undefined') {
  window.initSupabaseData = {
    initializeAll: initializeAllRegionsFSA,
    initializeRegion: initializeRegionFSA,
    verify: verifyRegionsFSA
  };
  
  console.log('🎯 Supabase 数据初始化工具已加载');
  console.log('使用方法:');
  console.log('  - window.initSupabaseData.initializeAll() - 初始化所有区域');
  console.log('  - window.initSupabaseData.initializeRegion("1") - 初始化单个区域');
  console.log('  - window.initSupabaseData.verify() - 验证数据');
}

export default {
  initializeAllRegionsFSA,
  initializeRegionFSA,
  verifyRegionsFSA
};