/**
 * 数据修复工具
 * 用于修复现有系统中的数据不一致问题
 */

import { getAllRegionConfigs, saveRegionConfig } from './unifiedStorage';
import { deliverableFSAs } from '../data/deliverableFSA';

/**
 * 修复字段名称问题
 * 将 fsa 字段改为 fsaCodes
 */
export function repairFieldNames() {
  console.log('🔧 开始修复字段名称...');
  const configs = getAllRegionConfigs();
  let repaired = 0;
  
  Object.keys(configs).forEach(regionId => {
    const config = configs[regionId];
    let needsRepair = false;
    
    // 修复 fsa -> fsaCodes
    if (config.fsa && !config.fsaCodes) {
      config.fsaCodes = config.fsa;
      delete config.fsa;
      needsRepair = true;
      console.log(`  ✅ 修复区域 ${regionId}: fsa -> fsaCodes`);
    }
    
    // 确保 fsaCodes 存在
    if (!config.fsaCodes) {
      config.fsaCodes = [];
      needsRepair = true;
      console.log(`  ✅ 修复区域 ${regionId}: 添加空 fsaCodes`);
    }
    
    // 确保 postalCodes 存在
    if (!config.postalCodes) {
      config.postalCodes = [];
      needsRepair = true;
    }
    
    // 确保有名称
    if (!config.name) {
      config.name = `${regionId}区`;
      needsRepair = true;
    }
    
    if (needsRepair) {
      saveRegionConfig(regionId, config);
      repaired++;
    }
  });
  
  console.log(`✅ 字段修复完成，修复了 ${repaired} 个区域`);
  return repaired;
}

/**
 * 修复区域数据分配
 * 确保每个区域都有合理的FSA分配
 */
export function repairRegionAssignments() {
  console.log('🔧 开始修复区域FSA分配...');
  
  // 获取所有已分配的FSA
  const configs = getAllRegionConfigs();
  const assignedFSAs = new Set();
  
  Object.values(configs).forEach(config => {
    if (config.fsaCodes && Array.isArray(config.fsaCodes)) {
      config.fsaCodes.forEach(fsa => assignedFSAs.add(fsa));
    }
  });
  
  console.log(`  📊 当前已分配 ${assignedFSAs.size} 个FSA`);
  
  // 找出未分配的FSA
  const unassignedFSAs = deliverableFSAs.filter(fsa => !assignedFSAs.has(fsa));
  console.log(`  📊 发现 ${unassignedFSAs.length} 个未分配FSA`);
  
  // 如果有区域没有FSA，分配一些未分配的FSA
  let redistributed = 0;
  Object.keys(configs).forEach(regionId => {
    const config = configs[regionId];
    if (!config.fsaCodes || config.fsaCodes.length === 0) {
      // 根据区域ID分配不同数量的FSA
      let assignCount = 0;
      switch(regionId) {
        case '6':
        case '7':
        case '8':
          assignCount = Math.min(50, unassignedFSAs.length);
          break;
        default:
          assignCount = 0;
      }
      
      if (assignCount > 0 && unassignedFSAs.length > 0) {
        config.fsaCodes = unassignedFSAs.splice(0, assignCount);
        saveRegionConfig(regionId, config);
        redistributed++;
        console.log(`  ✅ 为区域 ${regionId} 分配了 ${config.fsaCodes.length} 个FSA`);
      }
    }
  });
  
  console.log(`✅ FSA分配修复完成，重新分配了 ${redistributed} 个区域`);
  return redistributed;
}

/**
 * 验证数据一致性
 */
export function validateDataConsistency() {
  console.log('🔍 验证数据一致性...');
  const configs = getAllRegionConfigs();
  const issues = [];
  
  // 检查FSA重复
  const fsaMap = new Map();
  Object.entries(configs).forEach(([regionId, config]) => {
    if (config.fsaCodes && Array.isArray(config.fsaCodes)) {
      config.fsaCodes.forEach(fsa => {
        if (fsaMap.has(fsa)) {
          issues.push(`FSA ${fsa} 重复分配给区域 ${fsaMap.get(fsa)} 和 ${regionId}`);
        } else {
          fsaMap.set(fsa, regionId);
        }
      });
    }
  });
  
  // 检查必需字段
  Object.entries(configs).forEach(([regionId, config]) => {
    if (!config.id) issues.push(`区域 ${regionId} 缺少 id 字段`);
    if (!config.name) issues.push(`区域 ${regionId} 缺少 name 字段`);
    if (!config.fsaCodes) issues.push(`区域 ${regionId} 缺少 fsaCodes 字段`);
    if (!config.postalCodes) issues.push(`区域 ${regionId} 缺少 postalCodes 字段`);
    if (!config.weightRanges) issues.push(`区域 ${regionId} 缺少 weightRanges 字段`);
  });
  
  if (issues.length > 0) {
    console.warn('❌ 发现数据一致性问题:');
    issues.forEach(issue => console.warn(`  - ${issue}`));
  } else {
    console.log('✅ 数据一致性验证通过');
  }
  
  // 统计信息
  const totalFSAs = fsaMap.size;
  const totalRegions = Object.keys(configs).length;
  const avgFSAsPerRegion = Math.round(totalFSAs / totalRegions);
  
  console.log('📊 数据统计:');
  console.log(`  - 总区域数: ${totalRegions}`);
  console.log(`  - 总FSA数: ${totalFSAs}`);
  console.log(`  - 平均每区域FSA数: ${avgFSAsPerRegion}`);
  
  Object.entries(configs).forEach(([regionId, config]) => {
    const fsaCount = config.fsaCodes?.length || 0;
    const postalCount = config.postalCodes?.length || 0;
    console.log(`  - ${config.name || regionId}: ${fsaCount} FSA, ${postalCount} 邮编`);
  });
  
  return issues;
}

/**
 * 执行完整的数据修复
 */
export function runFullRepair() {
  console.log('🚀 开始执行完整数据修复...');
  console.log('================================');
  
  // 1. 修复字段名称
  const fieldsRepaired = repairFieldNames();
  
  // 2. 修复区域分配
  const assignmentsRepaired = repairRegionAssignments();
  
  // 3. 验证数据一致性
  const issues = validateDataConsistency();
  
  console.log('================================');
  console.log('✅ 数据修复完成！');
  console.log(`  - 修复字段: ${fieldsRepaired} 个区域`);
  console.log(`  - 重新分配: ${assignmentsRepaired} 个区域`);
  console.log(`  - 剩余问题: ${issues.length} 个`);
  
  return {
    fieldsRepaired,
    assignmentsRepaired,
    remainingIssues: issues
  };
}

// 导出到全局以便在控制台使用
if (typeof window !== 'undefined') {
  window.dataRepairTool = {
    repairFieldNames,
    repairRegionAssignments,
    validateDataConsistency,
    runFullRepair
  };
  
  console.log('💡 数据修复工具已加载，可在控制台使用:');
  console.log('  - dataRepairTool.runFullRepair() - 执行完整修复');
  console.log('  - dataRepairTool.validateDataConsistency() - 验证数据');
}

export default {
  repairFieldNames,
  repairRegionAssignments,
  validateDataConsistency,
  runFullRepair
};