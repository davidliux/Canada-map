import React, { useEffect } from 'react';
import MigrationToolPage from './MigrationToolPage';

/**
 * 工具页面路由组件
 * 根据URL路径显示对应的工具页面
 */
const ToolPageRouter = ({ onClose }) => {
  const path = window.location.pathname;

  console.log('🔧 ToolPageRouter 激活，当前路径:', path);

  // 根据路径决定显示哪个工具
  const renderTool = () => {
    if (path === '/migration-tool' || path === '/migration-tool.html') {
      return <MigrationToolPage onClose={onClose} />;
    }
    
    if (path === '/data-recovery-tool' || path === '/data-recovery-tool.html') {
      return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-blue-500/30 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">数据恢复工具</h2>
              <p className="text-gray-300 mb-4">
                此工具已集成到主应用中。请使用主界面的"数据迁移"功能。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    window.history.pushState({}, '', '/');
                    onClose();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  返回主应用
                </button>
                <button
                  onClick={() => {
                    window.history.pushState({}, '', '/migration-tool');
                    window.location.reload();
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  打开迁移工具
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (path === '/test-recovery' || path === '/test-recovery.html') {
      return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-blue-500/30 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">测试恢复工具</h2>
              <p className="text-gray-300 mb-4">
                此工具已集成到主应用中。请使用主界面的功能进行测试。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    window.history.pushState({}, '', '/');
                    onClose();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  返回主应用
                </button>
                <button
                  onClick={() => {
                    window.history.pushState({}, '', '/migration-tool');
                    window.location.reload();
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  打开迁移工具
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return renderTool();
};

export default ToolPageRouter;
