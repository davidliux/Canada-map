/**
 * 紧急数据修复
 * 修复weightRanges格式问题，确保是数组而不是对象
 */

export function emergencyFixWeightRanges() {
  console.log('🚨 紧急修复weightRanges格式...');
  
  const regionKeys = Object.keys(localStorage).filter(key => key.startsWith('region_'));
  let fixedCount = 0;
  
  regionKeys.forEach(key => {
    const data = localStorage.getItem(key);
    try {
      const config = JSON.parse(data);
      let needsFix = false;
      
      // 1. 修复weightRanges格式（对象转数组）
      if (config.weightRanges && !Array.isArray(config.weightRanges)) {
        console.log(`  修复区域 ${config.id} 的weightRanges格式`);
        
        if (typeof config.weightRanges === 'object') {
          // 对象格式转数组
          const rangeArray = Object.entries(config.weightRanges).map(([id, range]) => ({
            id: id,
            min: Number(range.min || range.minWeight || 0),
            max: Number(range.max || range.maxWeight || 0),
            price: Number(range.price || 0),
            isActive: range.isActive !== false,
            label: range.label || range.rangeName || `${range.min || 0}-${range.max || 0} KG`
          }));
          
          config.weightRanges = rangeArray;
          needsFix = true;
        }
      }
      
      // 2. 确保weightRanges存在且是数组
      if (!config.weightRanges) {
        console.log(`  为区域 ${config.id} 添加默认weightRanges`);
        config.weightRanges = getDefaultWeightRanges(config.id);
        needsFix = true;
      }
      
      // 3. 确保每个range都有正确的字段
      if (Array.isArray(config.weightRanges)) {
        config.weightRanges = config.weightRanges.map((range, index) => ({
          id: range.id || `range-${index}`,
          min: Number(range.min || range.minWeight || 0),
          max: Number(range.max || range.maxWeight || 0),
          price: Number(range.price || 0),
          isActive: range.isActive !== false,
          label: range.label || range.rangeName || `${range.min || 0}-${range.max || 0} KG`
        }));
        needsFix = true;
      }
      
      // 4. 确保区域有isActive字段
      if (typeof config.isActive !== 'boolean') {
        config.isActive = true;
        needsFix = true;
      }
      
      if (needsFix) {
        localStorage.setItem(key, JSON.stringify(config));
        fixedCount++;
        console.log(`  ✅ 修复完成，区域 ${config.id} 现有 ${config.weightRanges.length} 个价格区间`);
      }
    } catch (e) {
      console.error(`  ❌ 处理 ${key} 时出错:`, e);
    }
  });
  
  console.log(`✅ 紧急修复完成，共修复 ${fixedCount} 个区域`);
  
  if (fixedCount > 0) {
    console.log('✅ 数据已修复，请手动刷新页面以应用更改');
    // 禁用自动刷新，避免循环
    // setTimeout(() => window.location.reload(), 1000);
  }
  
  return fixedCount;
}

// 获取默认的重量区间
function getDefaultWeightRanges(regionId) {
  const basePrice = {
    '1': 15.99,
    '2': 18.99,
    '3': 22.99,
    '4': 24.99,
    '5': 26.99,
    '6': 28.99,
    '7': 30.99,
    '8': 32.99
  }[regionId] || 20.99;
  
  return [
    { id: '0-10', min: 0, max: 10, price: basePrice, isActive: true, label: '0-10 KG' },
    { id: '10-20', min: 10, max: 20, price: basePrice + 10, isActive: true, label: '10-20 KG' },
    { id: '20-30', min: 20, max: 30, price: basePrice + 20, isActive: true, label: '20-30 KG' },
    { id: '30-50', min: 30, max: 50, price: basePrice + 40, isActive: true, label: '30-50 KG' },
    { id: '50-100', min: 50, max: 100, price: basePrice + 80, isActive: true, label: '50-100 KG' }
  ];
}

// 检查并显示当前数据状态
export function checkDataStatus() {
  console.log('📊 当前数据状态:');
  
  const regionKeys = Object.keys(localStorage).filter(key => key.startsWith('region_'));
  
  regionKeys.forEach(key => {
    const data = localStorage.getItem(key);
    try {
      const config = JSON.parse(data);
      const isArrayFormat = Array.isArray(config.weightRanges);
      const rangeCount = isArrayFormat 
        ? config.weightRanges.length 
        : (config.weightRanges ? Object.keys(config.weightRanges).length : 0);
      
      console.log(`区域 ${config.id} (${config.name}):`);
      console.log(`  - FSA数量: ${config.fsaCodes?.length || 0}`);
      console.log(`  - 价格区间: ${rangeCount} 个`);
      console.log(`  - 格式: ${isArrayFormat ? '✅ 数组' : '❌ 对象'}`);
      console.log(`  - 状态: ${config.isActive ? '✅ 激活' : '❌ 未激活'}`);
      
      if (isArrayFormat && config.weightRanges.length > 0) {
        const sample = config.weightRanges[0];
        console.log(`  - 示例: ${sample.label || sample.id} = $${sample.price}`);
      }
    } catch (e) {
      console.error(`  ❌ ${key} 解析失败`);
    }
  });
}

// 立即执行修复
if (typeof window !== 'undefined') {
  // 等待页面加载完成后自动执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // 禁用自动执行，避免循环刷新
      console.log('💡 紧急修复工具已加载，如需修复请运行: window.emergencyFix.fix()');
    });
  } else {
    // 禁用自动执行，避免循环刷新
    // 用户可以手动运行 window.emergencyFix.fix() 来修复
    console.log('💡 紧急修复工具已加载，如需修复请运行: window.emergencyFix.fix()');
  }
  
  // 导出到全局
  window.emergencyFix = {
    fix: emergencyFixWeightRanges,
    check: checkDataStatus
  };
}

export default {
  emergencyFixWeightRanges,
  checkDataStatus
};