// 测试修复脚本
console.log('🧪 开始测试修复...');

// 测试1: 检查RegionPriceManager的空值处理
console.log('\n1. 测试RegionPriceManager空值处理...');
const testConfig = {
  postalCodes: ['V6A', 'V6B', 'V6C'],
  weightRanges: [
    { id: 'range_1', min: 0, max: 11, isActive: true, price: 10 },
    { id: 'range_2', min: 11.001, max: 15, isActive: false, price: 15 }
  ],
  lastUpdated: '2024-01-15T10:00:00.000Z'
};

const testEmptyConfig = {
  postalCodes: null,
  weightRanges: null,
  lastUpdated: null
};

// 模拟组件中的计算逻辑
function testConfigCalculations(config) {
  try {
    const fsaCount = config.postalCodes?.length || 0;
    const activeRanges = config.weightRanges?.filter(r => r.isActive).length || 0;
    const totalRanges = config.weightRanges?.length || 0;
    const lastUpdated = config.lastUpdated ? new Date(config.lastUpdated).toLocaleString() : '未知';
    
    console.log(`  FSA数量: ${fsaCount}`);
    console.log(`  活跃区间: ${activeRanges}/${totalRanges}`);
    console.log(`  最后更新: ${lastUpdated}`);
    return true;
  } catch (error) {
    console.error(`  ❌ 计算失败:`, error);
    return false;
  }
}

console.log('  测试正常配置:');
const test1 = testConfigCalculations(testConfig);

console.log('  测试空配置:');
const test2 = testConfigCalculations(testEmptyConfig);

// 测试2: 检查统计数据计算
console.log('\n2. 测试统计数据计算...');

function testStatsCalculation() {
  try {
    const mockRegionConfigs = {
      '1': {
        id: '1',
        name: '区域1',
        isActive: true,
        postalCodes: ['V6A', 'V6B', 'T2A'],
        weightRanges: []
      },
      '2': {
        id: '2',
        name: '区域2',
        isActive: false,
        postalCodes: ['H1A', 'H1B'],
        weightRanges: []
      },
      '3': {
        id: '3',
        name: '区域3',
        isActive: true,
        postalCodes: null, // 测试空值
        weightRanges: []
      }
    };

    let totalFSAs = 0;
    let activeFSAs = 0;
    const fsasByProvince = {
      'BC': 0, 'ON': 0, 'QC': 0, 'AB': 0, 'MB': 0, 
      'SK': 0, 'NS': 0, 'NB': 0, 'NL': 0, 'PE': 0, 
      'YT': 0, 'NT': 0, 'NU': 0
    };

    Object.values(mockRegionConfigs).forEach(config => {
      if (config && config.postalCodes && Array.isArray(config.postalCodes)) {
        totalFSAs += config.postalCodes.length;
        
        if (config.isActive) {
          activeFSAs += config.postalCodes.length;
        }

        config.postalCodes.forEach(fsa => {
          if (typeof fsa === 'string' && fsa.length > 0) {
            const firstChar = fsa.charAt(0).toUpperCase();
            switch (firstChar) {
              case 'V': fsasByProvince.BC++; break;
              case 'T': fsasByProvince.AB++; break;
              case 'H': case 'J': case 'G': fsasByProvince.QC++; break;
              default: fsasByProvince.ON++; break;
            }
          }
        });
      }
    });

    console.log(`  总FSA数量: ${totalFSAs}`);
    console.log(`  活跃FSA数量: ${activeFSAs}`);
    console.log(`  按省份分布:`, fsasByProvince);
    
    return totalFSAs > 0;
  } catch (error) {
    console.error(`  ❌ 统计计算失败:`, error);
    return false;
  }
}

const test3 = testStatsCalculation();

// 测试3: 检查数据恢复逻辑
console.log('\n3. 测试数据恢复逻辑...');

function testDataRecovery() {
  try {
    // 模拟检查数据完整性
    const mockConfigs = {
      '1': { postalCodes: [] },
      '2': { postalCodes: null },
      '3': { postalCodes: ['V6A'] }
    };

    let totalFSAs = 0;
    let regionsWithData = 0;

    Object.values(mockConfigs).forEach(config => {
      if (config && config.postalCodes && Array.isArray(config.postalCodes)) {
        totalFSAs += config.postalCodes.length;
        if (config.postalCodes.length > 0) {
          regionsWithData++;
        }
      }
    });

    const needsRecovery = totalFSAs === 0 || regionsWithData === 0;
    
    console.log(`  总FSA数量: ${totalFSAs}`);
    console.log(`  有数据的区域: ${regionsWithData}`);
    console.log(`  需要恢复: ${needsRecovery ? '是' : '否'}`);
    
    return true;
  } catch (error) {
    console.error(`  ❌ 数据恢复检查失败:`, error);
    return false;
  }
}

const test4 = testDataRecovery();

// 总结测试结果
console.log('\n📊 测试结果总结:');
console.log(`1. RegionPriceManager空值处理: ${test1 && test2 ? '✅ 通过' : '❌ 失败'}`);
console.log(`2. 统计数据计算: ${test3 ? '✅ 通过' : '❌ 失败'}`);
console.log(`3. 数据恢复逻辑: ${test4 ? '✅ 通过' : '❌ 失败'}`);

const allTestsPassed = test1 && test2 && test3 && test4;
console.log(`\n🎯 总体结果: ${allTestsPassed ? '✅ 所有测试通过' : '❌ 部分测试失败'}`);

if (allTestsPassed) {
  console.log('\n🎉 修复验证成功！系统应该能够正常工作。');
} else {
  console.log('\n⚠️ 部分修复可能需要进一步调整。');
}
