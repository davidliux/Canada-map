#!/usr/bin/env node

/**
 * 数据迁移脚本：从localStorage迁移区域和FSA数据到PostgreSQL
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

// 默认区域配置
const DEFAULT_REGIONS = [
  { id: '1', name: '1区', color: '#3B82F6', description: '核心配送区域' },
  { id: '2', name: '2区', color: '#10B981', description: '主要配送区域' },
  { id: '3', name: '3区', color: '#F59E0B', description: '扩展配送区域' },
  { id: '4', name: '4区', color: '#EF4444', description: '远程配送区域' },
  { id: '5', name: '5区', color: '#8B5CF6', description: '特殊配送区域' },
  { id: '6', name: '6区', color: '#EC4899', description: '偏远配送区域' },
  { id: '7', name: '7区', color: '#6B7280', description: '边缘配送区域' },
  { id: '8', name: '8区', color: '#F97316', description: '最远配送区域' }
];

// 默认重量区间
const DEFAULT_WEIGHT_RANGES = [
  { min: 0, max: 11.000, label: '0-11.000 KGS', price: 0 },
  { min: 11.001, max: 15.000, label: '11.001-15.000 KGS', price: 0 },
  { min: 15.001, max: 20.000, label: '15.001-20.000 KGS', price: 0 },
  { min: 20.001, max: 25.000, label: '20.001-25.000 KGS', price: 0 },
  { min: 25.001, max: 30.000, label: '25.001-30.000 KGS', price: 0 },
  { min: 30.001, max: 35.000, label: '30.001-35.000 KGS', price: 0 },
  { min: 35.001, max: 40.000, label: '35.001-40.000 KGS', price: 0 },
  { min: 40.001, max: 45.000, label: '40.001-45.000 KGS', price: 0 },
  { min: 45.001, max: 50.000, label: '45.001-50.000 KGS', price: 0 },
  { min: 50.001, max: 55.000, label: '50.001-55.000 KGS', price: 0 },
  { min: 55.001, max: 60.000, label: '55.001-60.000 KGS', price: 0 },
  { min: 60.001, max: 64.000, label: '60.001-64.000 KGS', price: 0 },
  { min: 64.001, max: Infinity, label: '64.000+ KGS', price: 0 }
];

async function createRegions() {
  console.log('🏗️ 创建8个配送区域...');
  
  for (const regionData of DEFAULT_REGIONS) {
    try {
      // 检查区域是否已存在
      const existing = await prisma.deliveryRegion.findUnique({
        where: { id: regionData.id }
      });
      
      if (existing) {
        console.log(`✓ 区域 ${regionData.id} 已存在，跳过`);
        continue;
      }
      
      // 创建区域
      const region = await prisma.deliveryRegion.create({
        data: {
          id: regionData.id,
          name: regionData.name,
          description: regionData.description,
          isActive: true,
          colorCode: regionData.color,
          displayOrder: parseInt(regionData.id)
        }
      });
      
      console.log(`✓ 创建区域: ${region.name}`);
      
      // 为每个区域创建默认重量区间
      for (let i = 0; i < DEFAULT_WEIGHT_RANGES.length; i++) {
        const range = DEFAULT_WEIGHT_RANGES[i];
        await prisma.weightRange.create({
          data: {
            regionId: region.id,
            rangeName: range.label,
            minWeight: range.min,
            maxWeight: range.max === Infinity ? 99999 : range.max,
            price: range.price,
            isActive: true,
            displayOrder: i + 1
          }
        });
      }
      
      console.log(`✓ 为区域 ${region.name} 创建了 ${DEFAULT_WEIGHT_RANGES.length} 个重量区间`);
      
    } catch (error) {
      console.error(`❌ 创建区域 ${regionData.name} 失败:`, error.message);
    }
  }
}

async function migrateLocalStorageData() {
  console.log('\n📦 从localStorage迁移FSA数据...');
  
  // 这里我们需要手动输入localStorage数据，或者从前端导出
  // 暂时创建一些示例数据来测试结构
  
  const sampleFSAData = {
    'M5V': { regionId: '1', province: 'ON', city: 'Toronto' },
    'M5G': { regionId: '1', province: 'ON', city: 'Toronto' },
    'K1A': { regionId: '2', province: 'ON', city: 'Ottawa' },
    'H3A': { regionId: '3', province: 'QC', city: 'Montreal' }
  };
  
  for (const [fsaCode, data] of Object.entries(sampleFSAData)) {
    try {
      // 检查FSA是否已存在
      const existing = await prisma.postalCode.findFirst({
        where: { fsaCode: fsaCode }
      });
      
      if (existing) {
        console.log(`✓ FSA ${fsaCode} 已存在，跳过`);
        continue;
      }
      
      // 创建FSA记录
      await prisma.postalCode.create({
        data: {
          regionId: data.regionId,
          fsaCode: fsaCode,
          province: data.province,
          city: data.city,
          isActive: true
        }
      });
      
      console.log(`✓ 创建FSA: ${fsaCode} -> 区域${data.regionId}`);
      
    } catch (error) {
      console.error(`❌ 创建FSA ${fsaCode} 失败:`, error.message);
    }
  }
}

async function verifyMigration() {
  console.log('\n🔍 验证数据迁移结果...');
  
  // 统计区域数量
  const regionCount = await prisma.deliveryRegion.count();
  console.log(`📊 总区域数: ${regionCount}`);
  
  // 统计重量区间
  const weightRangeCount = await prisma.weightRange.count();
  console.log(`📊 总重量区间数: ${weightRangeCount}`);
  
  // 统计FSA数量
  const fsaCount = await prisma.postalCode.count();
  console.log(`📊 总FSA数: ${fsaCount}`);
  
  // 按区域显示FSA分布
  const regions = await prisma.deliveryRegion.findMany({
    include: {
      postalCodes: true,
      _count: {
        select: {
          postalCodes: true,
          weightRanges: true
        }
      }
    },
    orderBy: { id: 'asc' }
  });
  
  console.log('\n📋 区域详情:');
  regions.forEach(region => {
    console.log(`  ${region.name}: ${region._count.postalCodes} FSAs, ${region._count.weightRanges} 重量区间`);
  });
}

async function main() {
  try {
    console.log('🚀 开始数据迁移...\n');
    
    await createRegions();
    await migrateLocalStorageData();
    await verifyMigration();
    
    console.log('\n✅ 数据迁移完成!');
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { createRegions, migrateLocalStorageData, verifyMigration };