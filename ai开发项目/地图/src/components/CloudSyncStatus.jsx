/**
 * 云端同步状态显示组件
 * 显示数据同步状态、网络连接状态和离线操作队列
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cloud, 
  CloudOff, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Clock,
  RefreshCw,
  Database
} from 'lucide-react';
import { cloudStorage, SYNC_STATUS } from '../utils/cloudFirstStorage.js';

const CloudSyncStatus = ({ className = '', showDetails = false }) => {
  const [syncStatus, setSyncStatus] = useState(cloudStorage.getSyncStatus());
  const [showTooltip, setShowTooltip] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // 监听同步状态变化
    const handleSyncStatusChange = (event) => {
      setSyncStatus(event.detail);
    };

    window.addEventListener('cloudSyncStatusChanged', handleSyncStatusChange);

    // 初始化状态
    setSyncStatus(cloudStorage.getSyncStatus());

    return () => {
      window.removeEventListener('cloudSyncStatusChanged', handleSyncStatusChange);
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
          text: '已同步',
          description: '数据已保存到云端'
        };
      case SYNC_STATUS.SYNCING:
        return {
          icon: Loader2,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          text: '同步中',
          description: '正在与云端同步数据',
          animate: true
        };
      case SYNC_STATUS.PENDING:
        return {
          icon: Clock,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          text: '等待同步',
          description: `${syncStatus.pendingOperations} 个操作等待同步`
        };
      case SYNC_STATUS.ERROR:
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          text: '同步错误',
          description: '云端同步失败，使用本地数据'
        };
      case SYNC_STATUS.OFFLINE:
      default:
        return {
          icon: CloudOff,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          text: '离线模式',
          description: '网络不可用，使用本地缓存'
        };
    }
  };

  const handleForceSync = async () => {
    if (!syncStatus.isOnline) {
      return;
    }

    try {
      await cloudStorage.forceSync();
    } catch (error) {
      console.error('强制同步失败:', error);
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
          
          {syncStatus.isOnline ? (
            <Wifi className="w-3 h-3 text-green-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-gray-400" />
          )}
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
          {syncStatus.isOnline ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-gray-400" />
          )}
          
          {syncStatus.isOnline && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleForceSync();
              }}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="强制同步"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
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
                  <div className="text-gray-500">网络状态</div>
                  <div className={`font-medium ${syncStatus.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                    {syncStatus.isOnline ? '在线' : '离线'}
                  </div>
                </div>
                
                <div>
                  <div className="text-gray-500">最后同步</div>
                  <div className="font-medium text-gray-900">
                    {formatLastSyncTime(syncStatus.lastSyncTime)}
                  </div>
                </div>
              </div>

              {syncStatus.pendingOperations > 0 && (
                <div className="flex items-center space-x-2 p-3 bg-yellow-50 rounded-lg">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  <div className="text-sm">
                    <span className="font-medium text-yellow-800">
                      {syncStatus.pendingOperations} 个操作等待同步
                    </span>
                    <div className="text-yellow-600">
                      网络恢复后将自动同步
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Database className="w-3 h-3" />
                <span>数据存储：Vercel KV + 本地缓存</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CloudSyncStatus;
