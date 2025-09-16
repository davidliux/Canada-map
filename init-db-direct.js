#!/usr/bin/env node

/**
 * 直接初始化数据库区域配置
 * 使用方法: node init-db-direct.js
 */

const API_BASE = 'http://localhost:5050/api/v1';

// 默认重量区间配置
const DEFAULT_WEIGHT_RANGES = [
  { min: 0, max: 10, label: '0-10 KGS', price: 15, isActive: true },
  { min: 10.001, max: 20, label: '10-20 KGS', price: 25, isActive: true },
  { min: 20.001, max: 30, label: '20-30 KGS', price: 35, isActive: true },
  { min: 30.001, max: 40, label: '30-40 KGS', price: 45, isActive: true },
  { min: 40.001, max: 50, label: '40-50 KGS', price: 55, isActive: true },
  { min: 50.001, max: Infinity, label: '50+ KGS', price: 65, isActive: true }
];

async function createRegion(regionId, regionName) {
  try {
    // 先尝试更新
    let response = await fetch(`${API_BASE}/regions/${regionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: regionName,
        isActive: false,
        postalCodes: [],
        weightRanges: DEFAULT_WEIGHT_RANGES
      })
    });

    if (response.status === 404) {
      // 不存在则创建
      response = await fetch(`${API_BASE}/regions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: regionId,
          name: regionName,
          isActive: false,
          postalCodes: [],
          weightRanges: DEFAULT_WEIGHT_RANGES
        })
      });
    }

    if (response.ok) {
      console.log(`✅ 区域 ${regionId} (${regionName}) 创建成功`);
      return true;
    } else {
      const error = await response.text();
      console.error(`❌ 区域 ${regionId} 创建失败:`, error);
      return false;
    }
  } catch (error) {
    console.error(`❌ 区域 ${regionId} 错误:`, error.message);
    return false;
  }
}

async function checkDatabase() {
  try {
    const response = await fetch(`${API_BASE}/regions?include_inactive=true`);
    const data = await response.json();

    if (data.success) {
      console.log(`\n📊 数据库当前有 ${data.data.length} 个区域`);

      if (data.data.length > 0) {
        console.log('\n已存在的区域：');
        data.data.forEach(region => {
          console.log(`  - 区域 ${region.id}: ${region.name} (${region.isActive ? '激活' : '未激活'})`);
          console.log(`    邮编数: ${region.postalCodes ? region.postalCodes.length : 0}`);
        });
      }

      return data.data;
    }
  } catch (error) {
    console.error('❌ 检查数据库失败:', error.message);
    return [];
  }
}

async function main() {
  console.log('🚀 开始初始化数据库区域配置...\n');

  // 先检查当前状态
  console.log('📊 检查数据库当前状态...');
  const existingRegions = await checkDatabase();

  if (existingRegions.length >= 8) {
    console.log('\n✅ 数据库已有8个或更多区域，无需初始化');
    return;
  }

  console.log('\n🔧 开始创建默认区域...\n');

  let successCount = 0;
  let errorCount = 0;

  // 创建8个默认区域
  for (let i = 1; i <= 8; i++) {
    const success = await createRegion(i.toString(), `区域 ${i}`);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
  }

  console.log(`\n📈 初始化完成！成功: ${successCount}, 失败: ${errorCount}`);

  // 再次检查数据库状态
  console.log('\n📊 最终数据库状态：');
  await checkDatabase();
}

// 运行主函数
main().catch(console.error);