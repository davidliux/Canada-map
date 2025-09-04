import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import ErrorBoundary from './components/ErrorBoundary';
import { useKeyboardShortcuts, createShortcuts } from './hooks/useKeyboardShortcuts';
import { performanceMonitor } from './utils/performanceOptimizer';
import compatLayer from './utils/unifiedStorageCompat'; // 导入兼容层
import './utils/quickSetup.js'; // 加载快速启动脚本
import './utils/demoSetup.js'; // 加载演示设置脚本
import { initializeSystemData } from './utils/initializeData'; // 导入初始化函数
// import { runAllFixes } from './utils/dataFixer'; // 禁用自动数据修复，避免覆盖数据库
// import { runFullRepair } from './utils/dataRepairTool'; // 禁用数据修复工具

// 仅在开发环境加载调试工具
if (import.meta.env.DEV) {
  import('./utils/debugHelper.js').catch(() => {}); // 加载调试助手
  import('./utils/emergencyFix.js').catch(() => {}); // 紧急修复工具
  import('./utils/initializeSupabaseData').catch(() => {}); // 加载 Supabase 数据初始化工具
}

function App() {
  // 初始化存储兼容层和系统数据
  useEffect(() => {
    // 添加初始化标记，防止重复初始化
    const initKey = 'app_init_completed';
    const isInitialized = sessionStorage.getItem(initKey);
    
    if (!isInitialized) {
      // 禁用自动数据修复，避免覆盖数据库
      // const needsFix = runAllFixes();
      const needsFix = false;
      
      compatLayer.init().then(() => {
        console.log('存储兼容层初始化完成');
        
        // 禁用系统数据初始化，避免覆盖数据库
        // const initialized = initializeSystemData();
        // if (initialized) {
        //   console.log('✅ 系统数据已初始化');
        // }
        
        // 禁用数据修复，避免覆盖数据库
        // console.log('🔧 运行数据修复检查...');
        // const repairResult = runFullRepair();
        // if (repairResult.fieldsRepaired > 0 || repairResult.assignmentsRepaired > 0) {
        //   console.log('✅ 数据修复完成，修复了', repairResult.fieldsRepaired + repairResult.assignmentsRepaired, '个问题');
        // }
        const repairResult = { fieldsRepaired: 0, assignmentsRepaired: 0 };
        
        // 标记初始化完成
        sessionStorage.setItem(initKey, 'true');
        
        // 如果修复了数据，提示用户刷新
        // 但不要自动刷新，避免循环
        if (needsFix || repairResult.fieldsRepaired > 0) {
          console.log('🔄 数据已修复，如有需要可手动刷新页面');
          // 移除自动刷新，避免循环
          // setTimeout(() => {
          //   window.location.reload();
          // }, 1500);
        }
      }).catch(error => {
        console.error('存储兼容层初始化失败:', error);
        // 即使失败也标记，避免无限重试
        sessionStorage.setItem(initKey, 'error');
      });
    } else {
      console.log('应用已初始化，跳过重复初始化');
      // 禁用自动数据修复，避免覆盖数据库
      // runAllFixes();
    }
  }, []);

  // 全局键盘快捷键
  const shortcuts = createShortcuts({
    openSearch: () => {
      // 聚焦搜索框
      const searchInput = document.querySelector('input[type="text"]');
      if (searchInput) {
        searchInput.focus();
      }
    },
    
    resetMap: () => {
      // 重置地图视图
      if (window.mapControlMethods) {
        window.mapControlMethods.resetView();
      }
    },
    
    refresh: () => {
      window.location.reload();
    },
    
    toggleDebug: () => {
      // 显示性能指标
      console.table(performanceMonitor.getMetrics());
    }
  });

  useKeyboardShortcuts(shortcuts);

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}

export default App;