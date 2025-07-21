/**
 * 服务器同步状态显示组件
 * 显示与Vercel KV服务器的数据同步状态
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Server, 
  ServerOff, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  RefreshCw,
  Database,
  Clock
} from 'lucide-react';
import { serverStorage, SYNC_STATUS } from '../utils/serverStorage.js';

const ServerSyncStatus = ({ className = '', showDetails = false }) => {
  const [syncStatus, setSyncStatus] = useState(serverStorage.getSyncStatus());
  const [showTooltip, setShowTooltip] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // 监听服务器同步状态变化
    const handleSyncStatusChange = (event) => {
      setSyncStatus(event.detail);
    };

    window.addEventListener('serverSyncStatusChanged', handleSyncStatusChange);

    // 初始化状态
    setSyncStatus(serverStorage.getSyncStatus());

    return () => {
      window.removeEventListener('serverSyncStatusChanged', handleSyncStatusChange);
    };
  }, []);

  const getStatusConfig = () => {
    switch (syncStatus.status) {
      case SYNC_STATUS.SYNCED:
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          text: '服务器已连接',
          description: '数据已保存到Vercel KV'
        };
      case SYNC_STATUS.SYNCING:
        return {
          icon: Loader2,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          text: '同步中',
          description: '正在与服务器同步数据',
          animate: true
        };
      case SYNC_STATUS.LOADING:
        return {
          icon: Server,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          text: '连接中',
          description: '正在连接服务器',
          animate: true
        };
      case SYNC_STATUS.ERROR:
      default:
        return {
          icon: ServerOff,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          text: '服务器错误',
          description: '无法连接到服务器'
        };
    }
  };

  const handleForceRefresh = async () => {
    try {
      await serverStorage.forceRefresh();
    } catch (error) {
      console.error('强制刷新失败:', error);
    }
  };

  const formatLastSyncTime = (timestamp) => {
    if (!timestamp) return '从未同步';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}小时前`;
    return date.toLocaleDateString();
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  if (!showDetails) {
    // 简化版本 - 只显示状态图标
    return (
      <div 
        className={`relative ${className}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <motion.div
          className={`flex items-center space-x-1 px-2 py-1 rounded-md border ${statusConfig.bgColor} ${statusConfig.borderColor}`}
          whileHover={{ scale: 1.05 }}
        >
          <motion.div
            animate={statusConfig.animate ? { rotate: 360 } : {}}
            transition={statusConfig.animate ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
          >
            <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
          </motion.div>
          
          <Server className="w-3 h-3 text-blue-500" />
        </motion.div>

        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50"
            >
              <div className="font-medium">{statusConfig.text}</div>
              <div className="text-xs text-gray-300">{statusConfig.description}</div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // 详细版本 - 显示完整状态信息
  return (
    <motion.div 
      className={`bg-white rounded-lg border shadow-sm ${className}`}
      layout
    >
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <motion.div
            animate={statusConfig.animate ? { rotate: 360 } : {}}
            transition={statusConfig.animate ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
          >
            <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
          </motion.div>
          
          <div>
            <div className="font-medium text-gray-900">{statusConfig.text}</div>
            <div className="text-sm text-gray-500">{statusConfig.description}</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Server className="w-4 h-4 text-blue-500" />
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleForceRefresh();
            }}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="刷新数据"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100"
          >
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">服务器状态</div>
                  <div className={`font-medium ${
                    syncStatus.status === SYNC_STATUS.SYNCED ? 'text-green-600' : 
                    syncStatus.status === SYNC_STATUS.ERROR ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {syncStatus.status === SYNC_STATUS.SYNCED ? '正常' : 
                     syncStatus.status === SYNC_STATUS.ERROR ? '异常' : '连接中'}
                  </div>
                </div>
                
                <div>
                  <div className="text-gray-500">最后同步</div>
                  <div className="font-medium text-gray-900">
                    {formatLastSyncTime(syncStatus.lastSyncTime)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">缓存大小</div>
                  <div className="font-medium text-gray-900">
                    {syncStatus.cacheSize || 0} 项
                  </div>
                </div>
                
                <div>
                  <div className="text-gray-500">存储类型</div>
                  <div className="font-medium text-gray-900">
                    Vercel KV
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                <Database className="w-4 h-4 text-blue-500" />
                <div className="text-sm">
                  <span className="font-medium text-blue-800">
                    服务器端存储
                  </span>
                  <div className="text-blue-600">
                    数据保存在Vercel KV数据库，支持跨设备同步
                  </div>
                </div>
              </div>

              {syncStatus.status === SYNC_STATUS.ERROR && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <div className="text-sm">
                    <span className="font-medium text-red-800">
                      连接异常
                    </span>
                    <div className="text-red-600">
                      请检查网络连接或稍后重试
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ServerSyncStatus;
