import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Database, RefreshCw, Info } from 'lucide-react';
import { getEnvironmentConfig, setForceAPI, logEnvironmentConfig } from '../utils/envConfig.js';

/**
 * 开发工具组件
 * 仅在开发环境显示，用于调试和配置
 */
const DevTools = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [envConfig, setEnvConfig] = useState(null);
  const [forceAPI, setForceAPIState] = useState(false);

  useEffect(() => {
    const config = getEnvironmentConfig();
    setEnvConfig(config);
    setForceAPIState(config.shouldForceAPI);
  }, []);

  // 只在开发环境显示
  if (!envConfig || envConfig.isProduction) {
    return null;
  }

  const toggleForceAPI = () => {
    const newValue = !forceAPI;
    setForceAPI(newValue);
    setForceAPIState(newValue);
    
    // 提示用户刷新页面
    if (newValue) {
      alert('已启用API模式，请刷新页面生效');
    } else {
      alert('已切换到localStorage模式，请刷新页面生效');
    }
  };

  const refreshConfig = () => {
    const config = getEnvironmentConfig();
    setEnvConfig(config);
    logEnvironmentConfig();
  };

  return (
    <>
      {/* 开发工具按钮 */}
      <div className="fixed bottom-4 right-4 z-[9998]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-all"
          title="开发工具"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* 开发工具面板 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed bottom-20 right-4 z-[9999] w-80 bg-gray-900 border border-purple-500/30 rounded-lg shadow-xl"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  开发工具
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* 环境信息 */}
              <div className="mb-4">
                <h4 className="text-purple-300 text-sm font-semibold mb-2 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  环境信息
                </h4>
                <div className="bg-gray-800 rounded p-2 text-xs text-gray-300 space-y-1">
                  <div>模式: {envConfig?.viteMode}</div>
                  <div>主机: {envConfig?.hostname}:{envConfig?.port}</div>
                  <div>开发环境: {envConfig?.isDevelopment ? '是' : '否'}</div>
                  <div>生产环境: {envConfig?.isProduction ? '是' : '否'}</div>
                </div>
              </div>

              {/* 存储配置 */}
              <div className="mb-4">
                <h4 className="text-purple-300 text-sm font-semibold mb-2 flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  存储配置
                </h4>
                <div className="bg-gray-800 rounded p-2 text-xs text-gray-300 space-y-1">
                  <div>当前模式: {envConfig?.shouldUseAPIStorage ? 'API存储' : 'localStorage'}</div>
                  <div>强制API: {envConfig?.shouldForceAPI ? '是' : '否'}</div>
                  <div>API地址: {envConfig?.apiBaseURL}</div>
                </div>
              </div>

              {/* 控制按钮 */}
              <div className="space-y-2">
                <button
                  onClick={toggleForceAPI}
                  className={`w-full p-2 rounded text-sm font-medium transition-colors ${
                    forceAPI
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {forceAPI ? '禁用API模式' : '启用API模式'}
                </button>

                <button
                  onClick={refreshConfig}
                  className="w-full p-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  刷新配置
                </button>

                <button
                  onClick={() => {
                    console.log('=== 环境配置详情 ===');
                    logEnvironmentConfig();
                    console.log('=== localStorage数据 ===');
                    const regionConfigs = localStorage.getItem('regionConfigs');
                    console.log('regionConfigs:', regionConfigs ? JSON.parse(regionConfigs) : '无数据');
                  }}
                  className="w-full p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm font-medium transition-colors"
                >
                  输出调试信息
                </button>
              </div>

              {/* 说明 */}
              <div className="mt-4 p-2 bg-blue-900/20 border border-blue-500/20 rounded text-xs text-blue-300">
                <div className="font-semibold mb-1">💡 说明:</div>
                <ul className="space-y-1 opacity-90">
                  <li>• 开发环境默认使用localStorage</li>
                  <li>• 可以强制启用API模式测试</li>
                  <li>• 生产环境自动使用API存储</li>
                  <li>• 切换模式后需要刷新页面</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DevTools;
