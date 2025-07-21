#!/usr/bin/env node

/**
 * 数据迁移功能监控脚本
 * 持续监控生产环境中数据迁移功能的可用性
 */

import https from 'https';

const PRODUCTION_URL = 'https://canada-map-oyu1.vercel.app';

// 监控检查项目
const monitoringChecks = [
  {
    name: '数据迁移按钮可见性',
    url: '/',
    check: (content) => {
      // 检查是否包含数据迁移相关的代码
      return content.includes('数据迁移') || 
             content.includes('setShowMigrationTool') ||
             content.includes('RefreshCw');
    },
    critical: true
  },
  {
    name: 'MigrationToolPage组件加载',
    url: '/',
    check: (content) => {
      return content.includes('MigrationToolPage') || 
             content.includes('migration-tool');
    },
    critical: true
  },
  {
    name: '环境检测功能',
    url: '/',
    check: (content) => {
      return content.includes('envConfig') || 
             content.includes('isProduction');
    },
    critical: false
  },
  {
    name: 'API端点可用性',
    url: '/api/regions',
    check: (content) => {
      try {
        const data = JSON.parse(content);
        return data.hasOwnProperty('success') || 
               data.hasOwnProperty('data') ||
               data.hasOwnProperty('error');
      } catch {
        return content.includes('regions') || content.includes('api');
      }
    },
    critical: true
  }
];

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const fullUrl = PRODUCTION_URL + url;
    
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

async function runMonitoring() {
  console.log('🔍 开始数据迁移功能监控...\n');
  console.log(`📅 时间: ${new Date().toISOString()}`);
  console.log(`🌐 目标: ${PRODUCTION_URL}\n`);
  
  const results = [];
  let criticalIssues = 0;
  
  for (const check of monitoringChecks) {
    try {
      console.log(`🔍 检查: ${check.name}...`);
      
      const response = await makeRequest(check.url);
      const isSuccess = response.statusCode === 200 && check.check(response.content);
      
      const result = {
        name: check.name,
        url: check.url,
        success: isSuccess,
        critical: check.critical,
        statusCode: response.statusCode,
        timestamp: new Date().toISOString()
      };
      
      results.push(result);
      
      if (isSuccess) {
        console.log(`✅ ${check.name}: 正常`);
      } else {
        const status = check.critical ? '❌ 严重' : '⚠️  警告';
        console.log(`${status} ${check.name}: 异常 (HTTP ${response.statusCode})`);
        
        if (check.critical) {
          criticalIssues++;
        }
      }
      
      // 添加延迟避免请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      const result = {
        name: check.name,
        url: check.url,
        success: false,
        critical: check.critical,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      results.push(result);
      
      const status = check.critical ? '❌ 严重' : '⚠️  警告';
      console.log(`${status} ${check.name}: 错误 - ${error.message}`);
      
      if (check.critical) {
        criticalIssues++;
      }
    }
  }
  
  console.log('\n📊 监控结果汇总:');
  console.log('='.repeat(50));
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`总检查项目: ${totalCount}`);
  console.log(`通过项目: ${successCount}`);
  console.log(`失败项目: ${totalCount - successCount}`);
  console.log(`严重问题: ${criticalIssues}`);
  
  console.log('\n📋 详细结果:');
  results.forEach(result => {
    const status = result.success ? '✅' : (result.critical ? '❌' : '⚠️');
    const critical = result.critical ? ' [关键]' : '';
    console.log(`${status} ${result.name}${critical}`);
  });
  
  console.log('='.repeat(50));
  
  if (criticalIssues === 0) {
    console.log('🎉 所有关键功能正常运行！');
    return 0;
  } else {
    console.log(`⚠️  发现 ${criticalIssues} 个严重问题，需要立即处理！`);
    
    // 输出修复建议
    console.log('\n🔧 修复建议:');
    console.log('1. 检查最新部署是否成功');
    console.log('2. 验证JavaScript文件是否正确加载');
    console.log('3. 检查环境变量配置');
    console.log('4. 查看Vercel部署日志');
    console.log('5. 考虑回滚到上一个稳定版本');
    
    return 1;
  }
}

// 支持持续监控模式
const args = process.argv.slice(2);
const isContinuous = args.includes('--continuous');
const interval = args.includes('--interval') ? 
  parseInt(args[args.indexOf('--interval') + 1]) || 300 : 300; // 默认5分钟

if (isContinuous) {
  console.log(`🔄 启动持续监控模式，检查间隔: ${interval}秒\n`);
  
  const runContinuousMonitoring = async () => {
    try {
      await runMonitoring();
    } catch (error) {
      console.error('❌ 监控执行失败:', error);
    }
    
    console.log(`\n⏰ 下次检查将在 ${interval} 秒后进行...\n`);
    setTimeout(runContinuousMonitoring, interval * 1000);
  };
  
  runContinuousMonitoring();
} else {
  runMonitoring().then(exitCode => {
    process.exit(exitCode);
  }).catch(error => {
    console.error('❌ 监控失败:', error);
    process.exit(1);
  });
}
