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

function App() {
  // 初始化存储兼容层和系统数据
  useEffect(() => {
    compatLayer.init().then(() => {
      console.log('存储兼容层初始化完成');
      
      // 初始化系统数据（如果需要）
      const initialized = initializeSystemData();
      if (initialized) {
        console.log('✅ 系统数据已初始化');
        setTimeout(() => window.location.reload(), 1000); // 1秒后重新加载
      }
    }).catch(error => {
      console.error('存储兼容层初始化失败:', error);
    });
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