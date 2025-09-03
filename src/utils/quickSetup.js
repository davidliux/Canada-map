/**
 * 快速启动脚本
 * 为演示和测试目的快速配置默认价格数据
 */

import { applyDefaultPricingToAllRegions } from './defaultPriceData.js';

/**
 * 快速设置默认价格配置
 * 可在浏览器控制台中调用
 */
export const quickSetupDefaultPricing = () => {
  console.log('🚀 开始快速设置默认价格配置...');
  
  try {
    const result = applyDefaultPricingToAllRegions();
    
    if (result.summary.successCount > 0) {
      console.log('✅ 快速设置完成！');
      console.log(`📊 成功配置 ${result.summary.successCount} 个区域`);
      console.log('📋 配置详情:');
      
      result.success.forEach(region => {
        console.log(`  • ${region.regionName}: ${region.rangeCount} 个重量区间`);
      });
      
      if (result.failed.length > 0) {
        console.log('⚠️ 部分区域配置失败:');
        result.failed.forEach(region => {
          console.log(`  • ${region.regionName}: ${region.error}`);
        });
      }
      
      console.log('\n🎯 现在可以：');
      console.log('1. 在地图上点击任意FSA查看价格');
      console.log('2. 使用自定义重量查询功能');
      console.log('3. 在区域管理面板中查看配置');
      console.log('4. 使用批量导入功能导入新的价格表');
      
      return result;
    } else {
      console.error('❌ 快速设置失败');
      return null;
    }
  } catch (error) {
    console.error('❌ 快速设置过程中出错:', error);
    return null;
  }
};

// 将函数暴露到全局作用域，方便在控制台调用
if (typeof window !== 'undefined') {
  window.quickSetupDefaultPricing = quickSetupDefaultPricing;
  
  // 添加帮助信息
  window.showPricingHelp = () => {
    console.log('🔧 价格配置系统帮助');
    console.log('');
    console.log('快速命令:');
    console.log('  quickSetupDefaultPricing() - 应用默认价格配置到所有区域');
    console.log('  showPricingHelp() - 显示此帮助信息');
    console.log('');
    console.log('功能说明:');
    console.log('1. 批量价格导入 - 从表格数据导入价格配置');
    console.log('2. 默认价格应用 - 一键应用预设的价格表');
    console.log('3. 区域映射配置 - 将价格列映射到配送区域');
    console.log('4. 数据导出功能 - 导出价格表为CSV格式');
    console.log('5. 实时价格查询 - 在地图上查看FSA价格');
    console.log('');
    console.log('使用流程:');
    console.log('1. 打开区域管理面板');
    console.log('2. 切换到"批量管理"标签');
    console.log('3. 选择"应用默认配置"或"批量导入"');
    console.log('4. 在地图上点击FSA查看价格');
  };
  
  console.log('💡 提示: 在控制台输入 quickSetupDefaultPricing() 快速设置默认价格');
  console.log('💡 提示: 在控制台输入 showPricingHelp() 查看帮助信息');
}

export default {
  quickSetupDefaultPricing
};
