/**
 * 数据健康监控组件
 * 显示数据一致性状态和修复选项
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Info,
  Wrench,
  Trash2
} from 'lucide-react';
import { getAllRegionConfigs } from '../utils/unifiedStorage';
import { validateDataConsistency, runFullRepair } from '../utils/dataRepairTool';
import { resetSystemData } from '../utils/initializeData';

const DataHealthMonitor = ({ onDataChange }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [healthStatus, setHealthStatus] = useState({
    healthy: true,
    issues: [],
    stats: {
      totalRegions: 0,
      totalFSAs: 0,
      totalPostalCodes: 0,
      emptyRegions: 0
    }
  });
  const [showDetails, setShowDetails] = useState(false);

  // 检查数据健康状态
  const checkDataHealth = async () => {
    setIsChecking(true);
    try {
      // 验证数据一致性
      const issues = validateDataConsistency();
      
      // 获取统计信息
      const configs = getAllRegionConfigs();
      const regionArray = Object.values(configs || {});
      
      const stats = {
        totalRegions: regionArray.length,
        totalFSAs: regionArray.reduce((sum, r) => sum + (r.fsaCodes?.length || 0), 0),
        totalPostalCodes: regionArray.reduce((sum, r) => sum + (r.postalCodes?.length || 0), 0),
        emptyRegions: regionArray.filter(r => !r.fsaCodes || r.fsaCodes.length === 0).length
      };
      
      setHealthStatus({
        healthy: issues.length === 0 && stats.emptyRegions === 0,
        issues,
        stats
      });
    } catch (error) {
      console.error('数据健康检查失败:', error);
      setHealthStatus({
        healthy: false,
        issues: ['检查失败: ' + error.message],
        stats: healthStatus.stats
      });
    } finally {
      setIsChecking(false);
    }
  };

  // 修复数据
  const handleRepair = async () => {
    if (!window.confirm('确定要修复数据吗？这将自动修正字段名称和数据结构。')) {
      return;
    }
    
    setIsRepairing(true);
    try {
      const result = runFullRepair();
      console.log('数据修复结果:', result);
      
      // 重新检查健康状态
      await checkDataHealth();
      
      if (result.fieldsRepaired > 0 || result.assignmentsRepaired > 0) {
        alert(`数据修复成功！\n修复字段: ${result.fieldsRepaired} 个\n重新分配: ${result.assignmentsRepaired} 个`);
        
        // 通知父组件数据已更改
        if (onDataChange) {
          onDataChange();
        }
        
        // 1秒后刷新页面
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        alert('没有需要修复的问题');
      }
    } catch (error) {
      console.error('数据修复失败:', error);
      alert('数据修复失败: ' + error.message);
    } finally {
      setIsRepairing(false);
    }
  };

  // 重置数据
  const handleReset = () => {
    resetSystemData();
  };

  // 初始化时检查一次
  useEffect(() => {
    checkDataHealth();
  }, []);

  // 获取状态颜色
  const getStatusColor = () => {
    if (isChecking) return 'text-blue-400';
    if (healthStatus.healthy) return 'text-green-400';
    if (healthStatus.issues.length > 5) return 'text-red-400';
    return 'text-yellow-400';
  };

  // 获取状态图标
  const StatusIcon = () => {
    if (isChecking) return <RefreshCw className="w-5 h-5 animate-spin" />;
    if (healthStatus.healthy) return <CheckCircle className="w-5 h-5" />;
    if (healthStatus.issues.length > 5) return <XCircle className="w-5 h-5" />;
    return <AlertTriangle className="w-5 h-5" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700"
    >
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-blue-500" />
          <span className="text-white font-medium">数据健康状态</span>
        </div>
        <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
          <StatusIcon />
          <span className="text-sm">
            {isChecking ? '检查中...' : 
             healthStatus.healthy ? '健康' : 
             `${healthStatus.issues.length} 个问题`}
          </span>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">区域总数:</span>
          <span className="text-white">{healthStatus.stats.totalRegions}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">FSA总数:</span>
          <span className="text-white">{healthStatus.stats.totalFSAs}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">邮编总数:</span>
          <span className="text-white">{healthStatus.stats.totalPostalCodes}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">空区域:</span>
          <span className={healthStatus.stats.emptyRegions > 0 ? 'text-yellow-400' : 'text-white'}>
            {healthStatus.stats.emptyRegions}
          </span>
        </div>
      </div>

      {/* 问题详情 */}
      {healthStatus.issues.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-1 text-yellow-400 hover:text-yellow-300 text-sm"
          >
            <Info className="w-4 h-4" />
            <span>{showDetails ? '隐藏' : '显示'}问题详情</span>
          </button>
          
          {showDetails && (
            <div className="mt-2 max-h-32 overflow-y-auto bg-gray-900/50 rounded p-2">
              {healthStatus.issues.map((issue, index) => (
                <div key={index} className="text-xs text-gray-400 py-1">
                  • {issue}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex space-x-2">
        <button
          onClick={checkDataHealth}
          disabled={isChecking}
          className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          <span className="text-sm">检查</span>
        </button>

        {!healthStatus.healthy && (
          <button
            onClick={handleRepair}
            disabled={isRepairing}
            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-600/20 text-green-400 rounded hover:bg-green-600/30 transition-colors disabled:opacity-50"
          >
            <Wrench className={`w-4 h-4 ${isRepairing ? 'animate-pulse' : ''}`} />
            <span className="text-sm">修复</span>
          </button>
        )}

        <button
          onClick={handleReset}
          className="flex items-center justify-center px-3 py-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* 提示信息 */}
      {!healthStatus.healthy && (
        <div className="mt-3 text-xs text-gray-400">
          💡 点击"修复"按钮自动修正数据问题
        </div>
      )}
    </motion.div>
  );
};

export default DataHealthMonitor;