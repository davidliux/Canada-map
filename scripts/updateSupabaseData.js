#!/usr/bin/env node

/**
 * 脚本：直接更新 Supabase 数据库中的区域数据
 * 使用方法：node scripts/updateSupabaseData.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 加载环境变量
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(dirname(__dirname), '.env.local') });

// Supabase 配置
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误：缺少 Supabase 配置。请检查 .env.local 文件');
  process.exit(1);
}

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseKey);

// 区域数据配置
const regionsData = [
  {
    id: '1',
    name: '1区 - 多伦多地区',
    fsa_codes: ["M1B","M1C","M1E","M1G","M1H","M1J","M1K","M1L","M1M","M1N","M1P","M1R","M1S","M1T","M1V","M1W","M1X","M2H","M2J","M2K","M2L","M2M","M2N","M2P","M2R","M3A","M3B","M3C","M3H","M3J","M3K","M3L","M3M","M3N","M4A","M4B","M4C","M4E","M4G","M4H","M4J","M4K","M4L","M4M","M4N","M4P","M4R","M4S","M4T","M4V","M4W","M4X","M4Y","M5A","M5B","M5C","M5E","M5G","M5H","M5J","M5K","M5L","M5M","M5N","M5P","M5R","M5S","M5T","M5V","M5W","M5X","M6A","M6B","M6C","M6E","M6G","M6H","M6J","M6K","M6L","M6M","M6N","M6P","M6R","M6S","M7A","M7R","M7Y","M8V","M8W","M8X","M8Y","M8Z","M9A","M9B","M9C","M9L","M9M","M9N","M9P","M9R","M9V","M9W"]
  },
  {
    id: '2',
    name: '2区 - 温哥华地区',
    fsa_codes: ["V5A","V5B","V5C","V5E","V5G","V5H","V5J","V5K","V5L","V5M","V5N","V5P","V5R","V5S","V5T","V5V","V5W","V5X","V5Y","V5Z","V6A","V6B","V6C","V6E","V6G","V6H","V6J","V6K","V6L","V6M","V6N","V6P","V6R","V6S","V6T","V6V","V6W","V6X","V6Y","V6Z","V7A","V7B","V7C","V7E","V7G","V7H","V7J","V7K","V7L","V7M","V7N","V7P","V7R","V7S","V7T","V7V","V7W","V7X","V7Y"]
  },
  {
    id: '3',
    name: '3区 - 蒙特利尔地区',
    fsa_codes: ["H1A","H1B","H1C","H1E","H1G","H1H","H1J","H1K","H1L","H1M","H1N","H1P","H1R","H1S","H1T","H1V","H1W","H1X","H1Y","H1Z","H2A","H2B","H2C","H2E","H2G","H2H","H2J","H2K","H2L","H2M","H2N","H2P","H2R","H2S","H2T","H2V","H2W","H2X","H2Y","H2Z","H3A","H3B","H3C","H3E","H3G","H3H","H3J","H3K","H3L","H3M","H3N","H3P","H3R","H3S","H3T","H3V","H3W","H3X","H3Y","H3Z","H4A","H4B","H4C","H4E","H4G","H4H","H4J","H4K","H4L","H4M","H4N","H4P","H4R","H4S","H4T","H4V","H4W","H4X","H4Y","H4Z"]
  },
  {
    id: '4',
    name: '4区 - 卡尔加里地区',
    fsa_codes: ["T1X","T1Y","T2A","T2B","T2C","T2E","T2G","T2H","T2J","T2K","T2L","T2M","T2N","T2P","T2R","T2S","T2T","T2V","T2W","T2X","T2Y","T2Z","T3A","T3B","T3C","T3E","T3G","T3H","T3J","T3K","T3L","T3M","T3N","T3P","T3R","T3S","T3Z"]
  },
  {
    id: '5',
    name: '5区 - 埃德蒙顿地区',
    fsa_codes: ["T5A","T5B","T5C","T5E","T5G","T5H","T5J","T5K","T5L","T5M","T5N","T5P","T5R","T5S","T5T","T5V","T5W","T5X","T5Y","T5Z","T6A","T6B","T6C","T6E","T6G","T6H","T6J","T6K","T6L","T6M","T6N","T6P","T6R","T6S","T6T","T6V","T6W","T6X"]
  },
  {
    id: '6',
    name: '6区 - 渥太华地区',
    fsa_codes: ["K1A","K1B","K1C","K1E","K1G","K1H","K1J","K1K","K1L","K1M","K1N","K1P","K1R","K1S","K1T","K1V","K1W","K1X","K1Y","K1Z","K2A","K2B","K2C","K2E","K2G","K2H","K2J","K2K","K2L","K2M","K2P","K2R","K2S","K2T","K2V","K2W","K4A","K4B","K4C","K4K","K4M","K4P","K4R"]
  },
  {
    id: '7',
    name: '7区 - 温尼伯地区',
    fsa_codes: ["R2C","R2E","R2G","R2H","R2J","R2K","R2L","R2M","R2N","R2P","R2R","R2V","R2W","R2X","R2Y","R3A","R3B","R3C","R3E","R3G","R3H","R3J","R3K","R3L","R3M","R3N","R3P","R3R","R3S","R3T","R3V","R3W","R3X","R3Y"]
  },
  {
    id: '8',
    name: '8区 - 哈利法克斯地区',
    fsa_codes: ["B3A","B3B","B3E","B3G","B3H","B3J","B3K","B3L","B3M","B3N","B3P","B3R","B3S","B3T","B3V","B3Z","B4A","B4B","B4C","B4E","B4G","B4H","B4N","B4P","B4R","B4V"]
  }
];

// 默认的重量区间配置（13个区间）
const defaultWeightRanges = [
  { id: "range_1", min: 0, max: 11.000, label: "0-11.000 KGS", price: 0, isActive: true },
  { id: "range_2", min: 11.001, max: 15.000, label: "11.001-15.000 KGS", price: 0, isActive: true },
  { id: "range_3", min: 15.001, max: 20.000, label: "15.001-20.000 KGS", price: 0, isActive: true },
  { id: "range_4", min: 20.001, max: 25.000, label: "20.001-25.000 KGS", price: 0, isActive: true },
  { id: "range_5", min: 25.001, max: 30.000, label: "25.001-30.000 KGS", price: 0, isActive: true },
  { id: "range_6", min: 30.001, max: 35.000, label: "30.001-35.000 KGS", price: 0, isActive: true },
  { id: "range_7", min: 35.001, max: 40.000, label: "35.001-40.000 KGS", price: 0, isActive: true },
  { id: "range_8", min: 40.001, max: 45.000, label: "40.001-45.000 KGS", price: 0, isActive: true },
  { id: "range_9", min: 45.001, max: 50.000, label: "45.001-50.000 KGS", price: 0, isActive: true },
  { id: "range_10", min: 50.001, max: 55.000, label: "50.001-55.000 KGS", price: 0, isActive: true },
  { id: "range_11", min: 55.001, max: 60.000, label: "55.001-60.000 KGS", price: 0, isActive: true },
  { id: "range_12", min: 60.001, max: 64.000, label: "60.001-64.000 KGS", price: 0, isActive: true },
  { id: "range_13", min: 64.001, max: 999999, label: "64.000+ KGS", price: 0, isActive: true }
];

/**
 * 更新所有区域数据
 */
async function updateAllRegions() {
  console.log('🚀 开始更新 Supabase 数据库...');
  console.log('📍 Supabase URL:', supabaseUrl);
  
  let successCount = 0;
  let failedCount = 0;
  
  for (const region of regionsData) {
    try {
      console.log(`\n📝 更新区域 ${region.id}: ${region.name}`);
      
      // 准备更新数据
      const updateData = {
        name: region.name,
        fsa_codes: region.fsa_codes,
        weight_ranges: defaultWeightRanges,
        is_active: true,
        metadata: {
          totalFSAs: region.fsa_codes.length,
          lastUpdated: new Date().toISOString()
        }
      };
      
      // 执行更新
      const { data, error } = await supabase
        .from('regions')
        .update(updateData)
        .eq('id', region.id)
        .select();
      
      if (error) {
        throw error;
      }
      
      console.log(`✅ 区域 ${region.id} 更新成功！`);
      console.log(`   - FSA 数量: ${region.fsa_codes.length}`);
      console.log(`   - 重量区间: ${defaultWeightRanges.length}`);
      successCount++;
      
    } catch (error) {
      console.error(`❌ 区域 ${region.id} 更新失败:`, error.message);
      failedCount++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 更新完成统计:');
  console.log(`✅ 成功: ${successCount} 个区域`);
  console.log(`❌ 失败: ${failedCount} 个区域`);
  
  // 验证数据
  console.log('\n🔍 验证数据...');
  const { data: verifyData, error: verifyError } = await supabase
    .from('regions')
    .select('id, name, fsa_codes, weight_ranges')
    .order('id');
  
  if (verifyData && !verifyError) {
    console.log('\n📋 当前数据库状态:');
    verifyData.forEach(region => {
      const fsaCount = region.fsa_codes ? region.fsa_codes.length : 0;
      const rangeCount = region.weight_ranges ? region.weight_ranges.length : 0;
      console.log(`   区域 ${region.id} (${region.name}): ${fsaCount} 个FSA, ${rangeCount} 个重量区间`);
    });
  }
  
  console.log('\n✨ 脚本执行完成！');
  process.exit(0);
}

// 执行脚本
updateAllRegions().catch(error => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});