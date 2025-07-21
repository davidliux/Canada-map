#!/usr/bin/env node

/**
 * 强制Vercel重新部署脚本
 * 用于确保Vercel使用最新的代码版本进行部署
 */

import https from 'https';
import { execSync } from 'child_process';

const GITHUB_REPO = 'davidliux/Canada-map';
const VERCEL_PROJECT_URL = 'https://canada-map-oyu1.vercel.app';

console.log('🔍 Vercel部署配置检查和强制重新部署\n');

// 1. 检查本地Git状态
console.log('📋 1. 检查本地Git状态...');
try {
  const currentCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  const remoteCommit = execSync('git ls-remote origin main', { encoding: 'utf8' }).split('\t')[0];
  
  console.log(`   当前分支: ${currentBranch}`);
  console.log(`   本地提交: ${currentCommit.substring(0, 8)}`);
  console.log(`   远程提交: ${remoteCommit.substring(0, 8)}`);
  
  if (currentCommit === remoteCommit) {
    console.log('   ✅ 本地和远程代码同步');
  } else {
    console.log('   ⚠️  本地和远程代码不同步');
    console.log('   建议运行: git push origin main');
  }
} catch (error) {
  console.log('   ❌ Git状态检查失败:', error.message);
}

// 2. 检查最新提交内容
console.log('\n📋 2. 检查最新提交内容...');
try {
  const latestCommit = execSync('git log -1 --oneline', { encoding: 'utf8' }).trim();
  console.log(`   最新提交: ${latestCommit}`);
  
  // 检查是否包含数据迁移相关的修复
  const commitMessage = execSync('git log -1 --pretty=format:"%s"', { encoding: 'utf8' });
  if (commitMessage.includes('数据迁移') || commitMessage.includes('migration')) {
    console.log('   ✅ 包含数据迁移功能修复');
  } else {
    console.log('   ⚠️  最新提交不包含数据迁移修复');
  }
} catch (error) {
  console.log('   ❌ 提交内容检查失败:', error.message);
}

// 3. 检查关键文件是否存在修复内容
console.log('\n📋 3. 检查关键文件修复内容...');
const filesToCheck = [
  { file: 'src/App.jsx', pattern: 'showMigrationPrompt', description: '迁移提示功能' },
  { file: 'src/components/MigrationToolPage.jsx', pattern: 'MigrationToolPage', description: '迁移工具页面' },
  { file: 'src/utils/envConfig.js', pattern: 'isProduction', description: '环境检测功能' }
];

filesToCheck.forEach(({ file, pattern, description }) => {
  try {
    const content = execSync(`grep -l "${pattern}" ${file}`, { encoding: 'utf8' });
    if (content.trim()) {
      console.log(`   ✅ ${description}: ${file}`);
    }
  } catch (error) {
    console.log(`   ❌ ${description}: ${file} - 未找到相关代码`);
  }
});

// 4. 强制触发重新部署
console.log('\n📋 4. 强制触发Vercel重新部署...');

// 方法1: 创建一个空的提交来触发部署
try {
  console.log('   方法1: 创建触发部署的提交...');
  
  // 创建一个部署时间戳文件
  const timestamp = new Date().toISOString();
  const deployTrigger = `// 部署触发器 - ${timestamp}\nexport const DEPLOY_TIMESTAMP = '${timestamp}';\n`;
  
  require('fs').writeFileSync('.vercel-deploy-trigger.js', deployTrigger);
  
  execSync('git add .vercel-deploy-trigger.js');
  execSync(`git commit -m "deploy: 强制触发Vercel重新部署 - ${timestamp}"`);
  execSync('git push origin main');
  
  console.log('   ✅ 部署触发提交已推送');
  
} catch (error) {
  console.log('   ⚠️  自动触发失败:', error.message);
  console.log('   请手动执行以下命令:');
  console.log('   git commit --allow-empty -m "deploy: 强制重新部署"');
  console.log('   git push origin main');
}

// 5. 验证部署配置建议
console.log('\n📋 5. Vercel部署配置验证建议...');
console.log('   请在Vercel Dashboard中检查以下配置:');
console.log('   ');
console.log('   🔗 项目设置:');
console.log(`   - Repository: ${GITHUB_REPO}`);
console.log('   - Branch: main');
console.log('   - Framework Preset: Vite');
console.log('   - Root Directory: ./');
console.log('   ');
console.log('   ⚙️  构建设置:');
console.log('   - Build Command: npm run build');
console.log('   - Output Directory: dist');
console.log('   - Install Command: npm install');
console.log('   ');
console.log('   🌍 环境变量:');
console.log('   - NODE_ENV: production');
console.log('   - 其他必要的环境变量');

// 6. 部署验证步骤
console.log('\n📋 6. 部署后验证步骤...');
console.log('   1. 等待Vercel部署完成 (通常2-5分钟)');
console.log('   2. 访问生产环境URL检查功能');
console.log('   3. 运行验证脚本: node monitor-migration-feature.js');
console.log('   4. 检查浏览器控制台是否有错误');
console.log('   5. 测试数据迁移功能是否正常工作');

// 7. 常见问题解决方案
console.log('\n📋 7. 常见问题解决方案...');
console.log('   如果部署后仍然看不到修复:');
console.log('   ');
console.log('   🔄 缓存问题:');
console.log('   - 清除浏览器缓存 (Ctrl+Shift+R / Cmd+Shift+R)');
console.log('   - 使用无痕模式访问');
console.log('   - 等待CDN缓存更新 (最多15分钟)');
console.log('   ');
console.log('   ⚙️  配置问题:');
console.log('   - 检查Vercel项目是否连接到正确的GitHub仓库');
console.log('   - 确认部署分支设置为main');
console.log('   - 验证构建命令和输出目录设置');
console.log('   ');
console.log('   🐛 代码问题:');
console.log('   - 检查构建日志是否有错误');
console.log('   - 验证所有依赖是否正确安装');
console.log('   - 确认环境变量配置正确');

console.log('\n🎯 下一步操作:');
console.log('1. 访问 Vercel Dashboard 检查部署状态');
console.log('2. 等待部署完成后测试功能');
console.log('3. 如有问题，查看部署日志排查');
console.log(`4. 验证生产环境: ${VERCEL_PROJECT_URL}`);

console.log('\n✅ 脚本执行完成！');
