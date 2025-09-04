/**
 * 调试助手 - 检查和修复数据问题
 */

export function inspectRegionData() {
  console.log('🔍 检查区域数据...');
  
  // 获取所有localStorage中的区域数据
  const regionKeys = Object.keys(localStorage).filter(key => key.startsWith('region_'));
  console.log(`发现 ${regionKeys.length} 个区域`);
  
  regionKeys.forEach(key => {
    const regionId = key.replace('region_', '');
    const data = localStorage.getItem(key);
    try {
      const config = JSON.parse(data);
      console.log(`\n区域 ${regionId} (${config.name || '未命名'}):`);
      console.log(`  ID: ${config.id}`);
      console.log(`  FSA数量: ${config.fsaCodes?.length || config.fsa?.length || 0}`);
      console.log(`  邮编数量: ${config.postalCodes?.length || 0}`);
      
      // 检查weightRanges
      if (config.weightRanges) {
        if (Array.isArray(config.weightRanges)) {
          console.log(`  ✅ weightRanges是数组，包含 ${config.weightRanges.length} 个区间`);
          config.weightRanges.forEach((range, idx) => {
            console.log(`    ${idx + 1}. ${range.min}-${range.max}kg: $${range.price}`);
          });
        } else if (typeof config.weightRanges === 'object') {
          const keys = Object.keys(config.weightRanges);
          console.log(`  ⚠️ weightRanges是对象，包含 ${keys.length} 个区间`);
          keys.forEach(key => {
            const range = config.weightRanges[key];
            console.log(`    ${key}: ${range.min}-${range.max}kg: $${range.price}`);
          });
        }
      } else {
        console.log(`  ❌ 没有weightRanges`);
      }
    } catch (e) {
      console.error(`  解析错误: ${e.message}`);
    }
  });
}

export function fixWeightRangesFormat() {
  console.log('🔧 修复weightRanges格式...');
  
  const regionKeys = Object.keys(localStorage).filter(key => key.startsWith('region_'));
  let fixedCount = 0;
  
  regionKeys.forEach(key => {
    const data = localStorage.getItem(key);
    try {
      const config = JSON.parse(data);
      
      // 如果weightRanges是对象，转换为数组
      if (config.weightRanges && !Array.isArray(config.weightRanges)) {
        console.log(`  修复区域 ${config.id} (${config.name})`);
        
        const rangeArray = Object.entries(config.weightRanges).map(([id, range]) => ({
          id: id,
          min: range.min || range.minWeight || 0,
          max: range.max || range.maxWeight || 0,
          price: range.price || 0,
          isActive: range.isActive !== false
        }));
        
        config.weightRanges = rangeArray;
        localStorage.setItem(key, JSON.stringify(config));
        fixedCount++;
        console.log(`    ✅ 转换为数组格式，包含 ${rangeArray.length} 个区间`);
      }
    } catch (e) {
      console.error(`  处理 ${key} 时出错: ${e.message}`);
    }
  });
  
  console.log(`✅ 修复完成，共修复 ${fixedCount} 个区域`);
  
  if (fixedCount > 0) {
    console.log('🔄 建议刷新页面以应用更改');
  }
}

export function clearAndReinitialize() {
  console.log('⚠️ 清除所有数据并重新初始化...');
  
  if (!window.confirm('确定要清除所有数据并重新初始化吗？')) {
    console.log('取消操作');
    return;
  }
  
  // 清除所有localStorage数据
  localStorage.clear();
  sessionStorage.clear();
  
  console.log('✅ 数据已清除');
  console.log('🔄 正在刷新页面...');
  
  // 刷新页面
  setTimeout(() => {
    window.location.reload();
  }, 500);
}

// 导出到全局
if (typeof window !== 'undefined') {
  window.debugHelper = {
    inspectRegionData,
    fixWeightRangesFormat,
    clearAndReinitialize
  };
  
  console.log('🛠️ 调试助手已加载，可用命令:');
  console.log('  debugHelper.inspectRegionData() - 检查区域数据');
  console.log('  debugHelper.fixWeightRangesFormat() - 修复格式问题');
  console.log('  debugHelper.clearAndReinitialize() - 清除并重新初始化');
}

export default {
  inspectRegionData,
  fixWeightRangesFormat,
  clearAndReinitialize
};