#!/usr/bin/env node

/**
 * 修复区域1的价格区间数据
 */

const API_BASE = 'http://localhost:5050/api/v1';

async function fixPriceData() {
  console.log('🔧 修复区域1的价格区间数据...\n');

  try {
    // 定义完整的价格区间
    const completeWeightRanges = [
      { min: 0, max: 11, price: 15.99, rangeName: '0-11kg' },
      { min: 11.001, max: 15, price: 6.21, rangeName: '11-15kg' },
      { min: 15.001, max: 20, price: 8.17, rangeName: '15-20kg' },
      { min: 20.001, max: 25, price: 10.93, rangeName: '20-25kg' },
      { min: 25.001, max: 30, price: 13.8, rangeName: '25-30kg' },
      { min: 30.001, max: 35, price: 14.95, rangeName: '30-35kg' },
      { min: 35.001, max: 40, price: 17.25, rangeName: '35-40kg' },
      { min: 40.001, max: 45, price: 18.4, rangeName: '40-45kg' },
      { min: 45.001, max: 50, price: 19.55, rangeName: '45-50kg' },
      { min: 50.001, max: 55, price: 20.7, rangeName: '50-55kg' },
      { min: 55.001, max: 60, price: 23, rangeName: '55-60kg' },
      { min: 60.001, max: 64, price: 26.45, rangeName: '60-64kg' },
      { min: 64.001, max: 999, price: 28.75, rangeName: '64+kg' }
    ].map((range, index) => ({
      ...range,
      isActive: true,
      displayOrder: index,
      label: `${range.min}-${range.max} KGS`
    }));

    // 更新区域1的价格配置
    const updateRes = await fetch(`${API_BASE}/regions/1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weightRanges: completeWeightRanges
      })
    });

    if (updateRes.ok) {
      console.log('✅ 成功更新区域1的价格区间');
      console.log(`   添加了 ${completeWeightRanges.length} 个价格区间`);
      
      // 验证更新
      const verifyRes = await fetch(`${API_BASE}/regions/1/weight-ranges`);
      const verifyData = await verifyRes.json();
      console.log(`\n📊 验证结果: 区域1现在有 ${verifyData.data.length} 个价格区间`);
      
      // 显示前3个区间
      verifyData.data.slice(0, 3).forEach(range => {
        console.log(`   - ${range.rangeName}: $${range.price}`);
      });
      
    } else {
      const error = await updateRes.text();
      console.error('❌ 更新失败:', error);
    }

  } catch (error) {
    console.error('❌ 操作失败:', error.message);
  }
}

// 运行修复
fixPriceData();