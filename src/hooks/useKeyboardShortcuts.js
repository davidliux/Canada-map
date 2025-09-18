import { useEffect, useCallback } from 'react';

/**
 * 键盘快捷键Hook
 * @param {Object} shortcuts - 快捷键配置对象
 * @param {boolean} enabled - 是否启用快捷键
 */
export const useKeyboardShortcuts = (shortcuts = {}, enabled = true) => {
  const handleKeyDown = useCallback((event) => {
    if (!enabled || !event.key) return;

    // 构建快捷键字符串
    const key = event.key.toLowerCase();
    const modifiers = [];
    
    if (event.ctrlKey || event.metaKey) modifiers.push('ctrl');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');
    
    const shortcutKey = modifiers.length > 0 
      ? `${modifiers.join('+')}+${key}`
      : key;

    // 查找匹配的快捷键
    const handler = shortcuts[shortcutKey];
    if (handler && typeof handler === 'function') {
      event.preventDefault();
      event.stopPropagation();
      handler(event);
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleKeyDown, enabled]);

  return handleKeyDown;
};

/**
 * 预定义的快捷键配置
 */
export const createShortcuts = (handlers = {}) => ({
  // 搜索相关
  'ctrl+k': handlers.openSearch || (() => {}),
  'escape': handlers.closeModal || handlers.clearSearch || (() => {}),
  
  // 地图操作
  'ctrl+r': handlers.resetMap || (() => {}),
  'ctrl+=': handlers.zoomIn || (() => {}),
  'ctrl+-': handlers.zoomOut || (() => {}),
  
  // 数据操作
  'ctrl+s': handlers.saveData || (() => {}),
  'ctrl+e': handlers.exportData || (() => {}),
  'ctrl+i': handlers.importData || (() => {}),
  
  // 导航
  'ctrl+1': handlers.goToDashboard || (() => {}),
  'ctrl+2': handlers.goToSettings || (() => {}),
  
  // 筛选相关
  'ctrl+f': handlers.openFilter || (() => {}),
  'ctrl+shift+c': handlers.clearFilters || (() => {}),
  
  // 开发者工具
  'ctrl+shift+d': handlers.toggleDebug || (() => {}),
  'f5': handlers.refresh || (() => {}),
});

export default useKeyboardShortcuts;