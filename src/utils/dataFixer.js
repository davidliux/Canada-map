/**
 * 数据修复工具
 * 用于修复存储格式错误的数据
 */

/**
 * 修复重量区间格式
 * 将对象格式转换为数组格式
 */
export function fixWeightRangesFormat() {
  console.log('🔧 开始修复重量区间格式...');
  
  try {
    // 获取所有存储的区域数据
    const regionKeys = Object.keys(localStorage).filter(key => key.startsWith('region_'));
    let fixedCount = 0;
    
    regionKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const regionConfig = JSON.parse(data);
          
          // 检查 weightRanges 是否为对象而非数组
          if (regionConfig.weightRanges && !Array.isArray(regionConfig.weightRanges)) {
            console.log(`修复区域 ${regionConfig.id || key} 的重量区间格式`);
            
            // 转换为数组格式
            const weightRangesArray = [];
            Object.entries(regionConfig.weightRanges).forEach(([rangeId, rangeData]) => {
              weightRangesArray.push({
                id: rangeId,
                ...rangeData
              });
            });
            
            // 更新配置
            regionConfig.weightRanges = weightRangesArray;
            
            // 保存修复后的数据
            localStorage.setItem(key, JSON.stringify(regionConfig));
            fixedCount++;
          }
        } catch (parseError) {
          console.error(`解析 ${key} 数据失败:`, parseError);
        }
      }
    });
    
    if (fixedCount > 0) {
      console.log(`✅ 成功修复 ${fixedCount} 个区域的重量区间格式`);
      return true;
    } else {
      console.log('ℹ️ 所有区域数据格式正确，无需修复');
      return false;
    }
    
  } catch (error) {
    console.error('❌ 修复重量区间格式失败:', error);
    return false;
  }
}

/**
 * 清理无效数据
 */
export function cleanInvalidData() {
  console.log('🧹 开始清理无效数据...');
  
  try {
    const regionKeys = Object.keys(localStorage).filter(key => key.startsWith('region_'));
    let cleanedCount = 0;
    
    regionKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const regionConfig = JSON.parse(data);
          
          // 确保必要字段存在
          let needsUpdate = false;
          
          if (!regionConfig.id) {
            regionConfig.id = key.replace('region_', '');
            needsUpdate = true;
          }
          
          if (!regionConfig.name) {
            regionConfig.name = `${regionConfig.id}区`;
            needsUpdate = true;
          }
          
          if (!Array.isArray(regionConfig.postalCodes)) {
            regionConfig.postalCodes = [];
            needsUpdate = true;
          }
          
          if (!Array.isArray(regionConfig.fsa)) {
            regionConfig.fsa = [];
            needsUpdate = true;
          }
          
          if (!Array.isArray(regionConfig.weightRanges)) {
            regionConfig.weightRanges = [];
            needsUpdate = true;
          }
          
          if (needsUpdate) {
            localStorage.setItem(key, JSON.stringify(regionConfig));
            cleanedCount++;
            console.log(`清理并修复了区域 ${regionConfig.id} 的数据`);
          }
          
        } catch (parseError) {
          console.error(`解析 ${key} 数据失败，移除无效数据:`, parseError);
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }
    });
    
    if (cleanedCount > 0) {
      console.log(`✅ 成功清理 ${cleanedCount} 个区域的数据`);
    } else {
      console.log('ℹ️ 所有数据有效，无需清理');
    }
    
    return cleanedCount > 0;
    
  } catch (error) {
    console.error('❌ 清理数据失败:', error);
    return false;
  }
}

/**
 * 运行所有数据修复
 */
export function runAllFixes() {
  console.log('🔧 开始运行所有数据修复...');
  
  const fixes = [
    { name: '重量区间格式修复', fn: fixWeightRangesFormat },
    { name: '无效数据清理', fn: cleanInvalidData }
  ];
  
  let anyFixed = false;
  
  fixes.forEach(({ name, fn }) => {
    console.log(`\n运行: ${name}`);
    const result = fn();
    if (result) anyFixed = true;
  });
  
  if (anyFixed) {
    console.log('\n✅ 数据修复完成！');
    console.log('💡 建议刷新页面以加载修复后的数据');
  } else {
    console.log('\n✅ 所有数据正常，无需修复');
  }
  
  return anyFixed;
}

// 将函数暴露到全局，方便控制台调用
if (typeof window !== 'undefined') {
  window.fixWeightRangesFormat = fixWeightRangesFormat;
  window.cleanInvalidData = cleanInvalidData;
  window.runAllFixes = runAllFixes;
  
  console.log('💡 数据修复工具已加载');
  console.log('💡 在控制台输入 runAllFixes() 运行所有修复');
}