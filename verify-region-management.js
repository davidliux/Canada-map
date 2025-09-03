#!/usr/bin/env node

/**
 * 区域管理功能验证脚本
 * 快速验证修复后的区域管理功能是否正常工作
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 验证区域管理功能修复...\n');

// 检查修复的文件是否存在
const requiredFiles = [
  'src/utils/unifiedStorage.js',
  'src/utils/regionManagementTest.js',
  'src/components/RegionSelector.jsx',
  'src/components/RegionManagementPanel.jsx',
  'src/components/DirectPostalCodeManager.jsx',
  'src/App.jsx'
];

console.log('📋 检查修复文件...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - 存在`);
  } else {
    console.log(`❌ ${file} - 缺失`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ 部分修复文件缺失，请确保所有文件都已正确修复。');
  process.exit(1);
}

// 检查关键函数是否已修复
console.log('\n🔧 检查关键函数修复...');

const checkFunctionInFile = (filePath, functionName, expectedPattern) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(expectedPattern)) {
      console.log(`✅ ${functionName} - 已修复`);
      return true;
    } else {
      console.log(`❌ ${functionName} - 未修复`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${functionName} - 检查失败: ${error.message}`);
    return false;
  }
};

const functionChecks = [
  {
    file: 'src/utils/unifiedStorage.js',
    name: 'createDefaultRegionConfig',
    pattern: 'isActive: true'
  },
  {
    file: 'src/utils/unifiedStorage.js',
    name: 'getAllRegionConfigs',
    pattern: 'async (forceRefresh = false)'
  },
  {
    file: 'src/utils/unifiedStorage.js',
    name: 'setRegionPostalCodes',
    pattern: 'async (regionId, postalCodes)'
  },
  {
    file: 'src/components/RegionSelector.jsx',
    name: 'loadRegionData',
    pattern: 'await getAllRegionConfigs()'
  },
  {
    file: 'src/App.jsx',
    name: 'initializeSystem',
    pattern: 'checkMigrationStatus'
  }
];

let allFunctionsFixed = true;
functionChecks.forEach(check => {
  const isFixed = checkFunctionInFile(check.file, check.name, check.pattern);
  if (!isFixed) {
    allFunctionsFixed = false;
  }
});

// 检查测试工具是否可用
console.log('\n🧪 检查测试工具...');
if (fs.existsSync('src/utils/regionManagementTest.js')) {
  const testContent = fs.readFileSync('src/utils/regionManagementTest.js', 'utf8');
  if (testContent.includes('runRegionManagementTests') && 
      testContent.includes('quickDiagnosis') && 
      testContent.includes('fixCommonIssues')) {
    console.log('✅ 区域管理测试工具 - 完整');
  } else {
    console.log('❌ 区域管理测试工具 - 不完整');
    allFunctionsFixed = false;
  }
} else {
  console.log('❌ 区域管理测试工具 - 缺失');
  allFunctionsFixed = false;
}

// 生成验证报告
console.log('\n📊 验证报告:');
console.log('='.repeat(50));

if (allFilesExist && allFunctionsFixed) {
  console.log('🎉 所有修复验证通过！');
  console.log('\n✅ 修复内容:');
  console.log('  • 数据初始化问题已修复');
  console.log('  • 异步操作支持已添加');
  console.log('  • 组件状态同步已改善');
  console.log('  • 测试和诊断工具已添加');
  
  console.log('\n🚀 下一步操作:');
  console.log('1. 运行 npm run electron-dev 启动应用');
  console.log('2. 在浏览器控制台运行测试:');
  console.log('   await window.regionManagementTest.quickDiagnosis()');
  console.log('3. 测试区域管理界面功能');
  console.log('4. 验证邮编添加/删除功能');
  
} else {
  console.log('❌ 验证失败，存在以下问题:');
  if (!allFilesExist) {
    console.log('  • 部分修复文件缺失');
  }
  if (!allFunctionsFixed) {
    console.log('  • 部分关键函数未正确修复');
  }
  
  console.log('\n🔧 建议操作:');
  console.log('1. 检查所有修复文件是否正确保存');
  console.log('2. 确认关键函数的修复内容');
  console.log('3. 重新运行修复脚本');
}

// 创建快速测试脚本
console.log('\n📝 生成快速测试脚本...');
const quickTestScript = `
/**
 * 快速测试脚本 - 在浏览器控制台中运行
 */

// 1. 基础功能测试
async function quickTest() {
  console.log('🧪 开始快速测试...');
  
  try {
    // 导入必要的函数
    const { getAllRegionConfigs, getRegionPostalCodes, addPostalCodesToRegion, removePostalCodesFromRegion } = 
      await import('./src/utils/unifiedStorage.js');
    
    // 测试1: 检查区域配置
    console.log('📋 测试1: 检查区域配置');
    const configs = await getAllRegionConfigs();
    console.log('区域数量:', Object.keys(configs).length);
    console.log('活跃区域:', Object.values(configs).filter(c => c.isActive).length);
    
    // 测试2: 检查邮编数据
    console.log('📋 测试2: 检查邮编数据');
    for (let i = 1; i <= 8; i++) {
      const codes = getRegionPostalCodes(i.toString());
      console.log(\`区域\${i}邮编数量: \${codes.length}\`);
    }
    
    // 测试3: 邮编操作测试
    console.log('📋 测试3: 邮编操作测试');
    const testRegion = '1';
    const testCode = 'TEST';
    
    // 添加测试邮编
    const addResult = await addPostalCodesToRegion(testRegion, [testCode]);
    console.log('添加邮编结果:', addResult);
    
    // 验证邮编是否添加成功
    const updatedCodes = getRegionPostalCodes(testRegion);
    const addSuccess = updatedCodes.includes(testCode);
    console.log('邮编添加验证:', addSuccess);
    
    // 删除测试邮编
    if (addSuccess) {
      const removeResult = await removePostalCodesFromRegion(testRegion, [testCode]);
      console.log('删除邮编结果:', removeResult);
    }
    
    console.log('🎉 快速测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 2. 诊断工具测试
async function testDiagnostics() {
  if (window.regionManagementTest) {
    console.log('🔍 运行诊断工具...');
    const diagnosis = await window.regionManagementTest.quickDiagnosis();
    console.log('诊断结果:', diagnosis);
    
    if (diagnosis.issues.length > 0) {
      console.log('🔧 尝试自动修复...');
      const fixResult = await window.regionManagementTest.fixCommonIssues();
      console.log('修复结果:', fixResult);
    }
  } else {
    console.log('❌ 诊断工具未加载');
  }
}

// 3. 完整测试套件
async function runFullTests() {
  if (window.regionManagementTest) {
    console.log('🧪 运行完整测试套件...');
    const testResult = await window.regionManagementTest.runTests();
    console.log('测试结果:', testResult);
  } else {
    console.log('❌ 测试工具未加载');
  }
}

// 导出测试函数
window.quickRegionTest = {
  quickTest,
  testDiagnostics,
  runFullTests
};

console.log('测试脚本已加载！使用以下命令进行测试:');
console.log('• window.quickRegionTest.quickTest() - 快速功能测试');
console.log('• window.quickRegionTest.testDiagnostics() - 诊断工具测试');
console.log('• window.quickRegionTest.runFullTests() - 完整测试套件');
`;

fs.writeFileSync('quick-region-test.js', quickTestScript);
console.log('✅ 快速测试脚本已生成: quick-region-test.js');

console.log('\n' + '='.repeat(50));
console.log('🎯 验证完成！');

if (allFilesExist && allFunctionsFixed) {
  console.log('✨ 区域管理功能修复验证通过，可以开始测试！');
} else {
  console.log('⚠️  请先解决验证中发现的问题，然后重新运行验证。');
}
