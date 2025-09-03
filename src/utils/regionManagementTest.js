/**
 * 区域管理功能测试工具
 * 用于验证区域管理功能的完整性和正确性
 */

import {
  getAllRegionConfigs,
  getAllRegionConfigsSync,
  saveAllRegionConfigs,
  getRegionConfig,
  setRegionPostalCodes,
  getRegionPostalCodes,
  addPostalCodesToRegion,
  removePostalCodesFromRegion,
  getRegionStats,
  getStorageStats
} from './unifiedStorage.js';

/**
 * 运行完整的区域管理功能测试
 */
export const runRegionManagementTests = async () => {
  console.log('🧪 开始区域管理功能测试...');
  
  const testResults = {
    passed: 0,
    failed: 0,
    errors: []
  };

  // 测试1: 数据初始化测试
  try {
    console.log('📋 测试1: 数据初始化');
    const configs = await getAllRegionConfigs(true); // 强制刷新
    
    if (Object.keys(configs).length === 8) {
      console.log('✅ 8个区域初始化成功');
      testResults.passed++;
    } else {
      throw new Error(`期望8个区域，实际${Object.keys(configs).length}个`);
    }
    
    // 检查每个区域是否有测试数据
    for (let i = 1; i <= 8; i++) {
      const regionId = i.toString();
      const config = configs[regionId];
      if (config && config.postalCodes && config.postalCodes.length > 0) {
        console.log(`✅ 区域${regionId}有${config.postalCodes.length}个邮编`);
      } else {
        console.log(`⚠️  区域${regionId}没有邮编数据`);
      }
    }
    
  } catch (error) {
    console.error('❌ 测试1失败:', error);
    testResults.failed++;
    testResults.errors.push(`数据初始化: ${error.message}`);
  }

  // 测试2: 邮编管理测试
  try {
    console.log('📋 测试2: 邮编管理');
    const testRegionId = '1';
    
    // 获取当前邮编
    const currentCodes = getRegionPostalCodes(testRegionId);
    console.log(`区域${testRegionId}当前邮编:`, currentCodes);
    
    // 添加新邮编
    const testCode = 'V6Z';
    const addResult = await addPostalCodesToRegion(testRegionId, [testCode]);
    if (addResult) {
      console.log('✅ 邮编添加成功');
      
      // 验证邮编是否添加成功
      const updatedCodes = getRegionPostalCodes(testRegionId);
      if (updatedCodes.includes(testCode)) {
        console.log('✅ 邮编验证成功');
        testResults.passed++;
      } else {
        throw new Error('邮编添加后验证失败');
      }
      
      // 删除测试邮编
      const removeResult = await removePostalCodesFromRegion(testRegionId, [testCode]);
      if (removeResult) {
        console.log('✅ 邮编删除成功');
      }
    } else {
      throw new Error('邮编添加失败');
    }
    
  } catch (error) {
    console.error('❌ 测试2失败:', error);
    testResults.failed++;
    testResults.errors.push(`邮编管理: ${error.message}`);
  }

  // 测试3: 区域状态切换测试
  try {
    console.log('📋 测试3: 区域状态切换');
    const testRegionId = '2';
    
    const config = await getRegionConfig(testRegionId);
    if (config) {
      const originalStatus = config.isActive;
      
      // 切换状态
      const updatedConfig = {
        ...config,
        isActive: !originalStatus,
        lastUpdated: new Date().toISOString()
      };
      
      // 保存配置
      const allConfigs = await getAllRegionConfigs();
      allConfigs[testRegionId] = updatedConfig;
      const saveResult = await saveAllRegionConfigs(allConfigs);
      
      if (saveResult) {
        // 验证状态是否更新
        const verifyConfig = await getRegionConfig(testRegionId);
        if (verifyConfig.isActive === !originalStatus) {
          console.log('✅ 区域状态切换成功');
          testResults.passed++;
          
          // 恢复原状态
          verifyConfig.isActive = originalStatus;
          allConfigs[testRegionId] = verifyConfig;
          await saveAllRegionConfigs(allConfigs);
        } else {
          throw new Error('状态切换验证失败');
        }
      } else {
        throw new Error('配置保存失败');
      }
    } else {
      throw new Error('获取区域配置失败');
    }
    
  } catch (error) {
    console.error('❌ 测试3失败:', error);
    testResults.failed++;
    testResults.errors.push(`区域状态切换: ${error.message}`);
  }

  // 测试4: 统计信息测试
  try {
    console.log('📋 测试4: 统计信息');
    
    // 测试区域统计
    const regionStats = getRegionStats('1');
    if (regionStats && typeof regionStats.totalPostalCodes === 'number') {
      console.log('✅ 区域统计信息正常');
    } else {
      throw new Error('区域统计信息异常');
    }
    
    // 测试存储统计
    const storageStats = getStorageStats();
    if (storageStats && typeof storageStats.regionCount === 'number') {
      console.log('✅ 存储统计信息正常');
      testResults.passed++;
    } else {
      throw new Error('存储统计信息异常');
    }
    
  } catch (error) {
    console.error('❌ 测试4失败:', error);
    testResults.failed++;
    testResults.errors.push(`统计信息: ${error.message}`);
  }

  // 测试5: 数据持久化测试
  try {
    console.log('📋 测试5: 数据持久化');
    
    // 清除内存缓存
    delete window._regionConfigsCache;
    
    // 重新加载数据
    const reloadedConfigs = await getAllRegionConfigs();
    
    if (Object.keys(reloadedConfigs).length === 8) {
      console.log('✅ 数据持久化正常');
      testResults.passed++;
    } else {
      throw new Error('数据持久化失败');
    }
    
  } catch (error) {
    console.error('❌ 测试5失败:', error);
    testResults.failed++;
    testResults.errors.push(`数据持久化: ${error.message}`);
  }

  // 输出测试结果
  console.log('\n🎯 测试结果汇总:');
  console.log(`✅ 通过: ${testResults.passed}`);
  console.log(`❌ 失败: ${testResults.failed}`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ 错误详情:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  const success = testResults.failed === 0;
  console.log(`\n${success ? '🎉' : '💥'} 测试${success ? '全部通过' : '存在失败'}!`);
  
  return {
    success,
    passed: testResults.passed,
    failed: testResults.failed,
    errors: testResults.errors
  };
};

/**
 * 快速诊断区域管理功能
 */
export const quickDiagnosis = async () => {
  console.log('🔍 快速诊断区域管理功能...');
  
  const diagnosis = {
    dataInitialized: false,
    regionsActive: 0,
    totalPostalCodes: 0,
    persistenceWorking: false,
    issues: []
  };

  try {
    // 检查数据初始化
    const configs = await getAllRegionConfigs();
    diagnosis.dataInitialized = Object.keys(configs).length === 8;
    
    if (!diagnosis.dataInitialized) {
      diagnosis.issues.push('区域数据未正确初始化');
    }
    
    // 统计活跃区域和邮编数量
    for (let i = 1; i <= 8; i++) {
      const regionId = i.toString();
      const config = configs[regionId];
      if (config) {
        if (config.isActive) {
          diagnosis.regionsActive++;
        }
        diagnosis.totalPostalCodes += (config.postalCodes || []).length;
      }
    }
    
    // 检查数据持久化
    try {
      delete window._regionConfigsCache;
      const reloadedConfigs = await getAllRegionConfigs();
      diagnosis.persistenceWorking = Object.keys(reloadedConfigs).length === 8;
    } catch (error) {
      diagnosis.issues.push('数据持久化异常');
    }
    
    if (diagnosis.regionsActive === 0) {
      diagnosis.issues.push('没有活跃的区域');
    }
    
    if (diagnosis.totalPostalCodes === 0) {
      diagnosis.issues.push('没有邮编数据');
    }
    
  } catch (error) {
    diagnosis.issues.push(`诊断过程出错: ${error.message}`);
  }

  // 输出诊断结果
  console.log('\n📊 诊断结果:');
  console.log(`数据初始化: ${diagnosis.dataInitialized ? '✅' : '❌'}`);
  console.log(`活跃区域: ${diagnosis.regionsActive}/8`);
  console.log(`邮编总数: ${diagnosis.totalPostalCodes}`);
  console.log(`数据持久化: ${diagnosis.persistenceWorking ? '✅' : '❌'}`);
  
  if (diagnosis.issues.length > 0) {
    console.log('\n⚠️  发现问题:');
    diagnosis.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  } else {
    console.log('\n🎉 所有功能正常!');
  }

  return diagnosis;
};

/**
 * 修复常见问题
 */
export const fixCommonIssues = async () => {
  console.log('🔧 开始修复常见问题...');
  
  try {
    // 强制重新初始化数据
    console.log('重新初始化区域数据...');
    const configs = await getAllRegionConfigs(true);
    
    // 确保所有区域都是活跃的
    let needsSave = false;
    for (let i = 1; i <= 8; i++) {
      const regionId = i.toString();
      if (configs[regionId] && !configs[regionId].isActive) {
        configs[regionId].isActive = true;
        needsSave = true;
        console.log(`激活区域${regionId}`);
      }
    }
    
    if (needsSave) {
      await saveAllRegionConfigs(configs);
      console.log('✅ 区域状态修复完成');
    }
    
    console.log('🎉 修复完成!');
    return true;
    
  } catch (error) {
    console.error('❌ 修复失败:', error);
    return false;
  }
};

// 导出到全局对象以便在控制台使用
if (typeof window !== 'undefined') {
  window.regionManagementTest = {
    runTests: runRegionManagementTests,
    quickDiagnosis,
    fixCommonIssues
  };
}
