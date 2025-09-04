/**
 * 初始化 Supabase 数据库中的 FSA 数据
 * 可以在浏览器控制台中运行或通过按钮触发
 */

import { regionService } from '../services/supabaseClient';
import { deliverableFSAs } from '../data/deliverableFSA.js';

// 根据FSA前缀判断省份
const getProvinceFromFSA = (fsa) => {
  const firstChar = fsa.charAt(0);
  switch (firstChar) {
    case 'V': return 'BC';
    case 'T': return 'AB';
    case 'S': return 'SK';
    case 'R': return 'MB';
    case 'P': case 'N': case 'K': case 'L': case 'M': return 'ON';
    case 'H': case 'J': case 'G': return 'QC';
    case 'E': return 'NB';
    case 'B': return 'NS';
    case 'C': return 'PE';
    case 'A': return 'NL';
    default: return 'OTHER';
  }
};

// 基于可配送FSA列表自动分配到区域
const FSA_DATA_CONFIG = {
  '1': {
    name: '1区 - 多伦多地区',
    fsaCodes: deliverableFSAs.filter(fsa => fsa.startsWith('M')).sort()
  },
  '2': {
    name: '2区 - 温哥华地区',
    fsaCodes: deliverableFSAs.filter(fsa => fsa.startsWith('V')).sort()
  },
  '3': {
    name: '3区 - 蒙特利尔地区',
    fsaCodes: deliverableFSAs.filter(fsa => fsa.startsWith('H')).sort()
  },
  '4': {
    name: '4区 - 卡尔加里地区',
    fsaCodes: deliverableFSAs.filter(fsa => fsa.startsWith('T') && ['T1','T2','T3'].some(prefix => fsa.startsWith(prefix))).sort()
  },
  '5': {
    name: '5区 - 埃德蒙顿地区',
    fsaCodes: deliverableFSAs.filter(fsa => fsa.startsWith('T') && ['T5','T6'].some(prefix => fsa.startsWith(prefix))).sort()
  },
  '6': {
    name: '6区 - 渥太华地区',
    fsaCodes: deliverableFSAs.filter(fsa => fsa.startsWith('K')).sort()
  },
  '7': {
    name: '7区 - 安大略其他地区',
    fsaCodes: deliverableFSAs.filter(fsa => fsa.startsWith('L') || fsa.startsWith('N')).sort()
  },
  '8': {
    name: '8区 - 其他省份',
    fsaCodes: deliverableFSAs.filter(fsa => ['R','J','T'].some(char => fsa.startsWith(char)) && !['T1','T2','T3','T5','T6'].some(prefix => fsa.startsWith(prefix))).sort()
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