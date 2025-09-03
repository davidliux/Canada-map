#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

const DEFAULT_WEIGHT_RANGES = [
  { min: 0, max: 11.000, label: '0-11.000 KGS' },
  { min: 11.001, max: 15.000, label: '11.001-15.000 KGS' },
  { min: 15.001, max: 20.000, label: '15.001-20.000 KGS' },
  { min: 20.001, max: 25.000, label: '20.001-25.000 KGS' },
  { min: 25.001, max: 30.000, label: '25.001-30.000 KGS' },
  { min: 30.001, max: 35.000, label: '30.001-35.000 KGS' },
  { min: 35.001, max: 40.000, label: '35.001-40.000 KGS' },
  { min: 40.001, max: 45.000, label: '40.001-45.000 KGS' },
  { min: 45.001, max: 50.000, label: '45.001-50.000 KGS' },
  { min: 50.001, max: 55.000, label: '50.001-55.000 KGS' },
  { min: 55.001, max: 60.000, label: '55.001-60.000 KGS' },
  { min: 60.001, max: 64.000, label: '60.001-64.000 KGS' },
  { min: 64.001, max: 99999, label: '64.000+ KGS' }
];

async function createWeightRanges() {
  console.log('🏗️ 为所有区域创建重量区间...');
  
  // 获取所有区域
  const regions = await prisma.deliveryRegion.findMany({
    orderBy: { id: 'asc' }
  });
  
  for (const region of regions) {
    console.log(`\n📦 处理区域: ${region.name}`);
    
    // 检查是否已有重量区间
    const existingRanges = await prisma.weightRange.count({
      where: { regionId: region.id }
    });
    
    if (existingRanges >= DEFAULT_WEIGHT_RANGES.length) {
      console.log(`✓ 区域 ${region.name} 已有 ${existingRanges} 个重量区间，跳过`);
      continue;
    }
    
    // 删除现有的不完整数据
    if (existingRanges > 0) {
      await prisma.weightRange.deleteMany({
        where: { regionId: region.id }
      });
      console.log(`🗑️ 清除区域 ${region.name} 的 ${existingRanges} 个现有重量区间`);
    }
    
    // 创建完整的重量区间
    for (let i = 0; i < DEFAULT_WEIGHT_RANGES.length; i++) {
      const range = DEFAULT_WEIGHT_RANGES[i];
      
      await prisma.weightRange.create({
        data: {
          regionId: region.id,
          rangeName: range.label,
          minWeight: range.min,
          maxWeight: range.max,
          price: 0,
          isActive: true,
          displayOrder: i + 1
        }
      });
    }
    
    console.log(`✅ 为区域 ${region.name} 创建了 ${DEFAULT_WEIGHT_RANGES.length} 个重量区间`);
  }
}

async function main() {
  try {
    await createWeightRanges();
    
    // 验证结果
    const summary = await prisma.deliveryRegion.findMany({
      include: {
        _count: {
          select: {
            weightRanges: true,
            postalCodes: true
          }
        }
      },
      orderBy: { id: 'asc' }
    });
    
    console.log('\n📊 最终统计:');
    summary.forEach(region => {
      console.log(`  ${region.name}: ${region._count.postalCodes} FSAs, ${region._count.weightRanges} 重量区间`);
    });
    
    console.log('\n✅ 重量区间创建完成!');
    
  } catch (error) {
    console.error('❌ 创建失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}