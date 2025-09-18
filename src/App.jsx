import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { useKeyboardShortcuts, createShortcuts } from './hooks/useKeyboardShortcuts';
import { performanceMonitor } from './utils/performanceOptimizer';
import compatLayer from './utils/unifiedStorageCompat'; // 导入兼容层
import './setupRegionsRunner'; // 导入区域配置脚本

function App() {
  // 初始化存储兼容层（仅在FSA系统页面）
  useEffect(() => {
    const pathname = window.location.pathname;
    const isFSASystem = pathname === '/dashboard' || 
                        pathname.startsWith('/settings/regions') || 
                        pathname.startsWith('/settings/prices') || 
                        pathname.startsWith('/settings/postal');
    
    if (isFSASystem) {
      compatLayer.init().then(() => {
        console.log('存储兼容层初始化完成');
      }).catch(error => {
        console.error('存储兼容层初始化失败:', error);
      });
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
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;