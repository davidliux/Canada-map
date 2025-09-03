/**
 * 演示设置脚本
 * 快速配置系统以展示FSA地图显示过滤功能
 */

import { applyDefaultPricingToAllRegions } from './defaultPriceData.js';
import { getAllRegionConfigs, setRegionPostalCodes } from './unifiedStorage.js';

/**
 * 快速设置演示数据
 * 配置一些示例FSA到不同区域，以展示过滤效果
 */
export const setupDemoData = () => {
  console.log('🎬 开始设置演示数据...');
  
  try {
    // 示例FSA数据 - 分配到不同区域
    const demoFSAAssignments = {
      '1': ['V6A', 'V6B', 'V6C', 'V6E', 'V6G', 'V6H', 'V6J', 'V6K'], // 温哥华区域
      '2': ['M5V', 'M5W', 'M5X', 'M6A', 'M6B', 'M6C', 'M6E', 'M6G'], // 多伦多区域
      '3': ['K1A', 'K1B', 'K1C', 'K1G', 'K1H', 'K1J', 'K1K', 'K1L'], // 渥太华区域
      '4': ['T2P', 'T2R', 'T2S', 'T2T', 'T2V', 'T2W', 'T2X', 'T2Y'], // 卡尔加里区域
      '5': ['H3A', 'H3B', 'H3C', 'H3E', 'H3G', 'H3H', 'H3J', 'H3K']  // 蒙特利尔区域
    };

    let totalAssigned = 0;
    const results = [];

    // 为每个区域分配FSA
    Object.entries(demoFSAAssignments).forEach(([regionId, fsaCodes]) => {
      const success = setRegionPostalCodes(regionId, fsaCodes);
      if (success) {
        results.push({
          regionId,
          regionName: `${regionId}区`,
          fsaCount: fsaCodes.length,
          fsaCodes: fsaCodes.slice(0, 3).join(', ') + (fsaCodes.length > 3 ? '...' : '')
        });
        totalAssigned += fsaCodes.length;
        console.log(`✅ 区域${regionId}: 分配 ${fsaCodes.length} 个FSA`);
      } else {
        console.error(`❌ 区域${regionId}: 分配失败`);
      }
    });

    console.log(`📊 演示数据设置完成: 总计分配 ${totalAssigned} 个FSA到 ${results.length} 个区域`);
    
    return {
      success: true,
      totalAssigned,
      regionCount: results.length,
      results
    };

  } catch (error) {
    console.error('❌ 设置演示数据失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 完整的演示环境设置
 * 包括FSA分配和价格配置
 */
export const setupCompleteDemo = () => {
  console.log('🚀 开始完整演示环境设置...');
  
  try {
    // 1. 设置FSA分配
    console.log('📍 步骤1: 设置FSA区域分配...');
    const fsaResult = setupDemoData();
    
    if (!fsaResult.success) {
      throw new Error(`FSA分配失败: ${fsaResult.error}`);
    }

    // 2. 应用默认价格配置
    console.log('💰 步骤2: 应用默认价格配置...');
    const priceResult = applyDefaultPricingToAllRegions();
    
    if (priceResult.summary.successCount === 0) {
      throw new Error('价格配置应用失败');
    }

    // 3. 验证配置
    console.log('🔍 步骤3: 验证配置完整性...');
    const regionConfigs = getAllRegionConfigs();
    const validationResults = [];

    Object.entries(regionConfigs).forEach(([regionId, config]) => {
      const hasPostalCodes = config.postalCodes && config.postalCodes.length > 0;
      const hasWeightRanges = config.weightRanges && config.weightRanges.length > 0;
      const hasActivePricing = config.weightRanges && config.weightRanges.some(r => r.isActive && r.price > 0);

      validationResults.push({
        regionId,
        regionName: `${regionId}区`,
        hasPostalCodes,
        hasWeightRanges,
        hasActivePricing,
        fsaCount: config.postalCodes ? config.postalCodes.length : 0,
        priceRangeCount: config.weightRanges ? config.weightRanges.filter(r => r.isActive).length : 0
      });
    });

    const completeRegions = validationResults.filter(r => r.hasPostalCodes && r.hasActivePricing);

    console.log('✅ 完整演示环境设置成功！');
    console.log('📋 配置摘要:');
    console.log(`  🗺️ FSA分配: ${fsaResult.totalAssigned} 个FSA分配到 ${fsaResult.regionCount} 个区域`);
    console.log(`  💰 价格配置: ${priceResult.summary.successCount} 个区域应用了价格配置`);
    console.log(`  ✅ 完整配置: ${completeRegions.length} 个区域具备完整的配送服务`);

    console.log('\n🎯 现在可以：');
    console.log('1. 在地图上查看只显示配送区域的FSA');
    console.log('2. 点击任意FSA查看价格信息');
    console.log('3. 使用区域筛选功能查看特定区域');
    console.log('4. 在右下角查看配送区域状态');

    return {
      success: true,
      fsaResult,
      priceResult,
      validationResults,
      completeRegions: completeRegions.length,
      summary: {
        totalFSAs: fsaResult.totalAssigned,
        configuredRegions: priceResult.summary.successCount,
        completeRegions: completeRegions.length
      }
    };

  } catch (error) {
    console.error('❌ 完整演示环境设置失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 重置演示环境
 * 清除所有演示数据
 */
export const resetDemoData = () => {
  console.log('🔄 重置演示环境...');
  
  try {
    const regionConfigs = getAllRegionConfigs();
    let resetCount = 0;

    // 清空所有区域的FSA分配
    Object.keys(regionConfigs).forEach(regionId => {
      const success = setRegionPostalCodes(regionId, []);
      if (success) {
        resetCount++;
        console.log(`🧹 区域${regionId}: 已清空FSA分配`);
      }
    });

    console.log(`✅ 演示环境重置完成: ${resetCount} 个区域已清空`);
    
    return {
      success: true,
      resetCount
    };

  } catch (error) {
    console.error('❌ 重置演示环境失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 获取演示状态
 * 检查当前演示环境的配置状态
 */
export const getDemoStatus = () => {
  try {
    const regionConfigs = getAllRegionConfigs();
    const status = {
      totalRegions: 0,
      configuredRegions: 0,
      totalFSAs: 0,
      regionsWithPricing: 0,
      regionDetails: []
    };

    Object.entries(regionConfigs).forEach(([regionId, config]) => {
      status.totalRegions++;
      
      const fsaCount = config.postalCodes ? config.postalCodes.length : 0;
      const hasWeightRanges = config.weightRanges && config.weightRanges.length > 0;
      const hasActivePricing = config.weightRanges && config.weightRanges.some(r => r.isActive && r.price > 0);
      
      if (fsaCount > 0) {
        status.configuredRegions++;
        status.totalFSAs += fsaCount;
      }
      
      if (hasActivePricing) {
        status.regionsWithPricing++;
      }

      status.regionDetails.push({
        regionId,
        regionName: `${regionId}区`,
        fsaCount,
        hasWeightRanges,
        hasActivePricing,
        isComplete: fsaCount > 0 && hasActivePricing
      });
    });

    return status;

  } catch (error) {
    console.error('❌ 获取演示状态失败:', error);
    return null;
  }
};

// 将函数暴露到全局作用域，方便在控制台调用
if (typeof window !== 'undefined') {
  window.setupDemoData = setupDemoData;
  window.setupCompleteDemo = setupCompleteDemo;
  window.resetDemoData = resetDemoData;
  window.getDemoStatus = getDemoStatus;
  
  // 添加帮助信息
  window.showDemoHelp = () => {
    console.log('🎬 FSA地图过滤演示帮助');
    console.log('');
    console.log('快速命令:');
    console.log('  setupCompleteDemo() - 设置完整的演示环境（推荐）');
    console.log('  setupDemoData() - 只设置FSA区域分配');
    console.log('  resetDemoData() - 重置演示环境');
    console.log('  getDemoStatus() - 查看当前演示状态');
    console.log('  showDemoHelp() - 显示此帮助信息');
    console.log('');
    console.log('演示功能:');
    console.log('1. FSA地图过滤 - 只显示配送区域的FSA');
    console.log('2. 区域选择筛选 - 查看特定区域的FSA');
    console.log('3. 配送区域状态 - 实时显示配送统计');
    console.log('4. 价格查询 - 点击FSA查看价格信息');
    console.log('5. 性能优化 - 减少地图渲染负担');
    console.log('');
    console.log('使用流程:');
    console.log('1. 运行 setupCompleteDemo() 设置演示环境');
    console.log('2. 观察地图只显示配送区域的FSA');
    console.log('3. 使用区域筛选功能测试特定区域显示');
    console.log('4. 点击FSA查看价格信息');
    console.log('5. 查看右下角的配送区域状态');
  };
  
  console.log('💡 提示: 在控制台输入 setupCompleteDemo() 设置完整演示环境');
  console.log('💡 提示: 在控制台输入 showDemoHelp() 查看演示帮助');
}

export default {
  setupDemoData,
  setupCompleteDemo,
  resetDemoData,
  getDemoStatus
};
