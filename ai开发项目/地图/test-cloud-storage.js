#!/usr/bin/env node

/**
 * 云端存储功能测试脚本
 * 验证Vercel KV存储和API端点是否正常工作
 */

import https from 'https';

const PRODUCTION_URL = 'https://canada-map-oyu1.vercel.app';
const API_ENDPOINTS = [
  '/api/regions',
  '/api/regions/1',
  '/api/backup'
];

console.log('🧪 云端存储功能测试启动...\n');
console.log(`📅 测试时间: ${new Date().toISOString()}`);
console.log(`🌐 目标URL: ${PRODUCTION_URL}\n`);

function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('请求超时'));
    }, 15000);

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CloudStorageTest/1.0'
      }
    };

    const req = https.request(url, options, (res) => {
      clearTimeout(timeout);
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = responseData ? JSON.parse(responseData) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsed,
            raw: responseData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            raw: responseData,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testEndpoint(endpoint, method = 'GET', testData = null) {
  const url = `${PRODUCTION_URL}${endpoint}`;
  console.log(`🔍 测试 ${method} ${endpoint}`);
  
  try {
    const response = await makeRequest(url, method, testData);
    
    if (response.statusCode === 200) {
      console.log(`✅ ${endpoint} - 状态码: ${response.statusCode}`);
      
      if (response.data) {
        if (response.data.success) {
          console.log(`   📊 响应: 成功 - ${response.data.message || '无消息'}`);
          if (response.data.data) {
            if (typeof response.data.data === 'object') {
              const keys = Object.keys(response.data.data);
              console.log(`   📋 数据键: ${keys.length > 0 ? keys.join(', ') : '无数据'}`);
            }
          }
        } else {
          console.log(`   ⚠️  响应: 失败 - ${response.data.message || '未知错误'}`);
        }
      } else {
        console.log(`   📄 原始响应: ${response.raw.substring(0, 100)}...`);
      }
    } else {
      console.log(`❌ ${endpoint} - 状态码: ${response.statusCode}`);
      console.log(`   📄 响应: ${response.raw.substring(0, 200)}`);
    }
    
    return response.statusCode === 200 && response.data?.success;
  } catch (error) {
    console.log(`❌ ${endpoint} - 错误: ${error.message}`);
    return false;
  }
}

async function testCloudStorageFeatures() {
  console.log('🔧 开始API端点测试...\n');
  
  const results = [];
  
  // 测试获取所有区域配置
  console.log('1️⃣ 测试获取所有区域配置');
  const getAllResult = await testEndpoint('/api/regions');
  results.push({ endpoint: '/api/regions', method: 'GET', success: getAllResult });
  console.log('');
  
  // 测试获取单个区域配置
  console.log('2️⃣ 测试获取单个区域配置');
  const getSingleResult = await testEndpoint('/api/regions/1');
  results.push({ endpoint: '/api/regions/1', method: 'GET', success: getSingleResult });
  console.log('');
  
  // 测试保存区域配置
  console.log('3️⃣ 测试保存区域配置');
  const testRegionData = {
    regionId: 'test',
    name: '测试区域',
    isActive: true,
    postalCodes: ['T1A', 'T1B'],
    weightRanges: [
      { id: 'range_1', min: 0, max: 11, label: '0-11 KGS', price: 25, isActive: true }
    ],
    metadata: {
      version: '3.0.0',
      testData: true
    }
  };
  
  const saveResult = await testEndpoint('/api/regions', 'POST', testRegionData);
  results.push({ endpoint: '/api/regions', method: 'POST', success: saveResult });
  console.log('');
  
  // 测试备份端点
  console.log('4️⃣ 测试备份端点');
  const backupResult = await testEndpoint('/api/backup');
  results.push({ endpoint: '/api/backup', method: 'GET', success: backupResult });
  console.log('');
  
  // 汇总结果
  console.log('📊 测试结果汇总:');
  console.log('='.repeat(50));
  
  let passedTests = 0;
  results.forEach((result, index) => {
    const status = result.success ? '✅ 通过' : '❌ 失败';
    console.log(`${index + 1}. ${result.method} ${result.endpoint} - ${status}`);
    if (result.success) passedTests++;
  });
  
  console.log('='.repeat(50));
  console.log(`📈 总体结果: ${passedTests}/${results.length} 个测试通过`);
  
  if (passedTests === results.length) {
    console.log('🎉 所有云端存储功能测试通过！');
    console.log('✨ 应用程序已成功升级为云端优先存储模式');
  } else {
    console.log('⚠️  部分测试失败，请检查：');
    console.log('1. Vercel KV数据库配置');
    console.log('2. API端点实现');
    console.log('3. 网络连接状态');
  }
  
  return passedTests === results.length;
}

async function testWebAppFeatures() {
  console.log('\n🌐 测试Web应用功能...\n');
  
  try {
    const response = await makeRequest(PRODUCTION_URL);
    
    if (response.statusCode === 200) {
      const content = response.raw;
      
      const checks = [
        {
          name: '基础页面加载',
          test: () => content.includes('加拿大快递配送区域地图'),
          critical: true
        },
        {
          name: 'React应用加载',
          test: () => content.includes('index-') && content.includes('.js'),
          critical: true
        },
        {
          name: '云端存储功能',
          test: () => content.includes('cloudStorage') || 
                     content.includes('CloudSyncStatus') ||
                     content.includes('云端同步'),
          critical: true
        },
        {
          name: 'Vite构建产物',
          test: () => content.includes('type="module"') &&
                     content.includes('/assets/'),
          critical: true
        }
      ];
      
      let passedChecks = 0;
      let criticalIssues = 0;
      
      console.log('📋 Web应用功能检查:');
      
      for (const check of checks) {
        const passed = check.test();
        const status = passed ? '✅' : (check.critical ? '❌' : '⚠️');
        const critical = check.critical ? ' [关键]' : '';
        
        console.log(`   ${status} ${check.name}${critical}`);
        
        if (passed) {
          passedChecks++;
        } else if (check.critical) {
          criticalIssues++;
        }
      }
      
      console.log(`\n📊 Web应用检查结果: ${passedChecks}/${checks.length} 通过`);
      
      return criticalIssues === 0;
    } else {
      console.log(`❌ Web应用访问失败 - 状态码: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Web应用测试失败: ${error.message}`);
    return false;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('🚀 开始完整的云端存储功能测试\n');
  
  const webAppSuccess = await testWebAppFeatures();
  const apiSuccess = await testCloudStorageFeatures();
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 最终测试结果:');
  console.log(`   🌐 Web应用功能: ${webAppSuccess ? '✅ 正常' : '❌ 异常'}`);
  console.log(`   ☁️  云端存储API: ${apiSuccess ? '✅ 正常' : '❌ 异常'}`);
  
  if (webAppSuccess && apiSuccess) {
    console.log('\n🎉 恭喜！云端优先存储系统部署成功！');
    console.log('📱 用户现在可以享受跨设备数据同步功能');
    console.log('☁️  所有数据将自动保存到云端，永不丢失');
  } else {
    console.log('\n⚠️  部分功能存在问题，建议进一步检查');
  }
  
  process.exit(webAppSuccess && apiSuccess ? 0 : 1);
}

runAllTests().catch(error => {
  console.error('❌ 测试过程出错:', error);
  process.exit(1);
});
