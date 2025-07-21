#!/usr/bin/env node

/**
 * Vercel部署验证脚本
 * 验证生产环境是否包含最新功能
 */

import https from 'https';

const PRODUCTION_URL = 'https://canada-map-oyu1.vercel.app';

// 验证项目清单
const verificationChecks = [
  {
    name: '主页可访问性',
    url: '/',
    check: (content) => content.includes('加拿大快递配送区域地图')
  },
  {
    name: '数据迁移按钮存在',
    url: '/',
    check: (content) => content.includes('数据迁移') || content.includes('RefreshCw')
  },
  {
    name: '迁移工具路由',
    url: '/migration-tool',
    check: (content) => content.includes('加拿大快递配送区域地图') // SPA路由应该返回主页
  },
  {
    name: 'API端点测试',
    url: '/api/regions',
    check: (content) => {
      try {
        const data = JSON.parse(content);
        return data.hasOwnProperty('success') || data.hasOwnProperty('data');
      } catch {
        return false;
      }
    }
  },
  {
    name: 'JavaScript资源加载',
    url: '/',
    check: (content) => content.includes('index-') && content.includes('.js')
  }
];

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const fullUrl = PRODUCTION_URL + url;
    console.log(`🔍 检查: ${fullUrl}`);
    
    https.get(fullUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          content: data,
          headers: res.headers
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function runVerification() {
  console.log('🚀 开始Vercel部署验证...\n');
  
  const results = [];
  
  for (const check of verificationChecks) {
    try {
      const response = await makeRequest(check.url);
      const isSuccess = response.statusCode === 200 && check.check(response.content);
      
      results.push({
        name: check.name,
        url: check.url,
        success: isSuccess,
        statusCode: response.statusCode,
        details: isSuccess ? '✅ 通过' : '❌ 失败'
      });
      
      console.log(`${isSuccess ? '✅' : '❌'} ${check.name}: ${response.statusCode}`);
      
    } catch (error) {
      results.push({
        name: check.name,
        url: check.url,
        success: false,
        error: error.message,
        details: `❌ 错误: ${error.message}`
      });
      
      console.log(`❌ ${check.name}: 错误 - ${error.message}`);
    }
  }
  
  console.log('\n📊 验证结果汇总:');
  console.log('='.repeat(50));
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  results.forEach(result => {
    console.log(`${result.details} ${result.name}`);
  });
  
  console.log('='.repeat(50));
  console.log(`总计: ${successCount}/${totalCount} 项检查通过`);
  
  if (successCount === totalCount) {
    console.log('🎉 所有验证项目都通过了！部署成功！');
    process.exit(0);
  } else {
    console.log('⚠️  部分验证项目失败，可能需要等待部署完成或检查配置。');
    process.exit(1);
  }
}

// 添加延迟选项
const args = process.argv.slice(2);
const delayMinutes = args.includes('--wait') ? parseInt(args[args.indexOf('--wait') + 1]) || 2 : 0;

if (delayMinutes > 0) {
  console.log(`⏳ 等待 ${delayMinutes} 分钟后开始验证，让Vercel完成部署...`);
  setTimeout(runVerification, delayMinutes * 60 * 1000);
} else {
  runVerification();
}
