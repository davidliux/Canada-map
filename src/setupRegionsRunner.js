import { setupOptimizedRegions } from './utils/setupRegionsOptimized.js';

// 执行区域配置
async function run() {
  console.log('=================================');
  console.log('开始配置加拿大配送区域');
  console.log('=================================');

  const success = await setupOptimizedRegions();

  if (success) {
    console.log('\n✅ 所有区域配置成功完成！');
    console.log('包括以下省份:');
    console.log('- Alberta (AB): 4个区域');
    console.log('- British Columbia (BC): 5个区域');
    console.log('- Manitoba (MB): 1个区域');
    console.log('\n请刷新页面查看配置结果。');
  } else {
    console.log('\n❌ 区域配置过程中出现错误，请检查控制台日志。');
  }
}

// 在浏览器环境中执行
if (typeof window !== 'undefined') {
  // 将函数暴露到全局作用域，以便在控制台中调用
  window.setupRegions = run;
  console.log('区域配置函数已准备就绪。');
  console.log('请在浏览器控制台中运行: setupRegions()');

  // 自动执行（可选）
  // 如果您希望页面加载时自动配置，请取消下面这行的注释
  // run();
}