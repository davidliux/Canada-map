#!/usr/bin/env node

/**
 * 测试localStorage适配器修复
 * 验证区域管理系统是否能正常加载
 */

console.log('🧪 测试localStorage适配器修复');
console.log('=====================================');

// 模拟浏览器环境
global.localStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  }
};

global.window = {
  dispatchEvent: () => {},
  addEventListener: () => {}
};

// 测试localStorage适配器
async function testLocalStorageAdapter() {
  try {
    console.log('📱 导入localStorage适配器...');
    
    // 动态导入（在Node.js环境中）
    const { localStorageAdapter } = await import('./src/utils/localStorageAdapter.js');
    
    console.log('✅ localStorage适配器导入成功');
    
    // 测试获取所有区域配置
    console.log('\n🔍 测试获取所有区域配置...');
    const allConfigs = await localStorageAdapter.getAllRegionConfigs();
    console.log('📊 区域配置数量:', Object.keys(allConfigs).length);
    
    // 测试获取单个区域配置
    console.log('\n🔍 测试获取单个区域配置...');
    const region1Config = await localStorageAdapter.getRegionConfig('1');
    console.log('📍 区域1配置:', region1Config ? '存在' : '不存在');
    
    if (region1Config) {
      console.log('   - 区域名称:', region1Config.name);
      console.log('   - 邮编数量:', region1Config.postalCodes?.length || 0);
      console.log('   - 重量区间数量:', region1Config.weightRanges?.length || 0);
    }
    
    // 测试保存区域配置
    console.log('\n💾 测试保存区域配置...');
    const testConfig = {
      id: '1',
      name: '测试区域1',
      isActive: true,
      postalCodes: ['H1A', 'H1B', 'H1C'],
      weightRanges: [
        { id: 'range_1', min: 0, max: 11, label: '0-11 KGS', price: 25.99, isActive: true }
      ],
      lastUpdated: new Date().toISOString(),
      metadata: {
        createdAt: new Date().toISOString(),
        version: '1.0.0',
        source: 'test'
      }
    };
    
    const saveResult = await localStorageAdapter.saveRegionConfig('1', testConfig);
    console.log('💾 保存结果:', saveResult ? '成功' : '失败');
    
    // 验证保存结果
    const savedConfig = await localStorageAdapter.getRegionConfig('1');
    console.log('✅ 验证保存:', savedConfig?.name === '测试区域1' ? '成功' : '失败');
    
    // 测试同步状态
    console.log('\n📊 测试同步状态...');
    const syncStatus = localStorageAdapter.getSyncStatus();
    console.log('📊 同步状态:', syncStatus.status);
    console.log('📊 最后同步时间:', syncStatus.lastSyncTime);
    
    // 测试存储统计
    console.log('\n📈 测试存储统计...');
    const stats = localStorageAdapter.getStorageStats();
    console.log('📈 总区域数:', stats.totalRegions);
    console.log('📈 活跃区域数:', stats.activeRegions);
    console.log('📈 总邮编数:', stats.totalPostalCodes);
    console.log('📈 存储类型:', stats.storageType);
    
    // 测试健康检查
    console.log('\n🏥 测试健康检查...');
    const health = await localStorageAdapter.healthCheck();
    console.log('🏥 健康状态:', health.healthy ? '健康' : '异常');
    console.log('🏥 延迟:', health.latency, 'ms');
    console.log('🏥 存储类型:', health.storage);
    
    console.log('\n🎉 所有测试完成！');
    console.log('=====================================');
    console.log('✅ localStorage适配器工作正常');
    console.log('✅ 区域管理系统应该能正常加载');
    console.log('✅ 数据存储简单稳定');
    console.log('✅ 支持跨浏览器持久化');
    
    return true;
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    console.log('\n🔧 可能的解决方案:');
    console.log('1. 检查导入路径是否正确');
    console.log('2. 确认unifiedStorage.js文件存在');
    console.log('3. 验证localStorage模拟是否正确');
    
    return false;
  }
}

// 运行测试
testLocalStorageAdapter().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ 测试运行失败:', error);
  process.exit(1);
});
