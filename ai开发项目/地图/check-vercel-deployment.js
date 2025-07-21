#!/usr/bin/env node

/**
 * Vercel部署状态检查脚本
 * 监控部署进度并验证修复是否成功
 */

import https from 'https';

const PRODUCTION_URL = 'https://canada-map-oyu1.vercel.app';
const CHECK_INTERVAL = 30000; // 30秒检查一次
const MAX_WAIT_TIME = 600000; // 最多等待10分钟

console.log('🚀 Vercel部署状态监控启动...\n');
console.log(`📅 开始时间: ${new Date().toISOString()}`);
console.log(`🌐 目标URL: ${PRODUCTION_URL}`);
console.log(`⏱️  检查间隔: ${CHECK_INTERVAL / 1000}秒`);
console.log(`⏰ 最大等待: ${MAX_WAIT_TIME / 60000}分钟\n`);

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('请求超时'));
    }, 10000);

    https.get(url, (res) => {
      clearTimeout(timeout);
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
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function checkDeploymentStatus() {
  try {
    console.log('🔍 检查部署状态...');
    
    const response = await makeRequest(PRODUCTION_URL);
    
    if (response.statusCode !== 200) {
      console.log(`❌ HTTP状态码: ${response.statusCode}`);
      return false;
    }
    
    // 检查是否包含我们的修复内容
    const checks = [
      {
        name: '基础页面加载',
        test: () => response.content.includes('加拿大快递配送区域地图'),
        critical: true
      },
      {
        name: 'React应用加载',
        test: () => response.content.includes('index-') && response.content.includes('.js'),
        critical: true
      },
      {
        name: '数据迁移功能',
        test: () => response.content.includes('数据迁移') || 
                   response.content.includes('MigrationToolPage') ||
                   response.content.includes('showMigrationTool'),
        critical: true
      },
      {
        name: '环境检测功能',
        test: () => response.content.includes('envConfig') || 
                   response.content.includes('isProduction'),
        critical: false
      },
      {
        name: 'Vite构建产物',
        test: () => response.content.includes('type="module"') &&
                   response.content.includes('/assets/'),
        critical: true
      }
    ];
    
    let passedChecks = 0;
    let criticalIssues = 0;
    
    console.log('📋 功能检查结果:');
    
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
    
    console.log(`\n📊 检查结果: ${passedChecks}/${checks.length} 通过`);
    
    if (criticalIssues === 0) {
      console.log('🎉 所有关键功能检查通过！部署成功！');
      return true;
    } else {
      console.log(`⚠️  发现 ${criticalIssues} 个关键问题，继续等待...`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ 检查失败: ${error.message}`);
    return false;
  }
}

async function waitForDeployment() {
  const startTime = Date.now();
  let attempts = 0;
  
  while (Date.now() - startTime < MAX_WAIT_TIME) {
    attempts++;
    console.log(`\n🔄 第 ${attempts} 次检查 (${new Date().toLocaleTimeString()})`);
    console.log('='.repeat(50));
    
    const success = await checkDeploymentStatus();
    
    if (success) {
      const elapsedTime = Math.round((Date.now() - startTime) / 1000);
      console.log(`\n🎯 部署验证成功！`);
      console.log(`⏱️  总耗时: ${elapsedTime}秒`);
      console.log(`🔢 检查次数: ${attempts}`);
      
      console.log('\n🎉 下一步操作:');
      console.log('1. 访问生产环境测试数据迁移功能');
      console.log('2. 检查工具栏中的蓝色边框数据迁移按钮');
      console.log('3. 测试/migration-tool路径访问');
      console.log('4. 验证自动迁移提示功能');
      
      return true;
    }
    
    console.log(`\n⏳ 等待 ${CHECK_INTERVAL / 1000} 秒后重试...`);
    await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
  }
  
  console.log('\n⏰ 等待超时！');
  console.log('可能的原因:');
  console.log('1. Vercel部署仍在进行中');
  console.log('2. 构建过程中出现错误');
  console.log('3. 网络连接问题');
  
  console.log('\n🔧 建议操作:');
  console.log('1. 访问Vercel Dashboard查看部署日志');
  console.log('2. 检查GitHub Actions是否有错误');
  console.log('3. 手动访问生产环境URL验证');
  console.log(`4. 运行: node monitor-migration-feature.js`);
  
  return false;
}

// 启动监控
waitForDeployment().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ 监控过程出错:', error);
  process.exit(1);
});
