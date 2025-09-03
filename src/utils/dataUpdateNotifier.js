/**
 * 数据更新通知系统
 * 用于在区域配置变更时通知所有相关组件更新数据
 */

class DataUpdateNotifier {
  constructor() {
    this.listeners = new Set();
  }

  /**
   * 添加监听器
   * @param {Function} callback - 回调函数
   */
  subscribe(callback) {
    this.listeners.add(callback);
    
    // 返回取消订阅函数
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * 通知所有监听器数据已更新
   * @param {Object} updateInfo - 更新信息
   */
  notify(updateInfo = {}) {
    console.log('🔄 数据更新通知:', updateInfo);
    
    this.listeners.forEach(callback => {
      try {
        callback(updateInfo);
      } catch (error) {
        console.error('数据更新通知回调执行失败:', error);
      }
    });
  }

  /**
   * 获取当前监听器数量
   */
  getListenerCount() {
    return this.listeners.size;
  }
}

// 创建全局实例
export const dataUpdateNotifier = new DataUpdateNotifier();

/**
 * React Hook: 监听数据更新
 * @param {Function} callback - 更新回调函数
 * @param {Array} deps - 依赖数组
 */
export const useDataUpdateListener = (callback, deps = []) => {
  // 注意：这个Hook需要在React组件中使用时导入React的useEffect
  // 使用示例：
  // import { useEffect } from 'react';
  // import { useDataUpdateListener } from './utils/dataUpdateNotifier';
  //
  // const MyComponent = () => {
  //   useEffect(() => {
  //     const unsubscribe = dataUpdateNotifier.subscribe(callback);
  //     return unsubscribe;
  //   }, deps);
  // };
};

/**
 * 通知区域配置更新
 * @param {string} regionId - 区域ID
 * @param {string} updateType - 更新类型 ('postalCodes', 'pricing', 'status')
 * @param {Object} data - 更新数据
 */
export const notifyRegionUpdate = (regionId, updateType, data = {}) => {
  dataUpdateNotifier.notify({
    type: 'regionUpdate',
    regionId,
    updateType,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * 通知数据导入/导出完成
 * @param {string} operation - 操作类型 ('import', 'export')
 * @param {Object} result - 操作结果
 */
export const notifyDataOperation = (operation, result = {}) => {
  dataUpdateNotifier.notify({
    type: 'dataOperation',
    operation,
    result,
    timestamp: new Date().toISOString()
  });
};

/**
 * 通知全局数据刷新
 */
export const notifyGlobalRefresh = () => {
  dataUpdateNotifier.notify({
    type: 'globalRefresh',
    timestamp: new Date().toISOString()
  });
};
