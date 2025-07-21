import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Download, 
  Settings, 
  Zap, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Database
} from 'lucide-react';
import BatchPriceImporter from './BatchPriceImporter';
import { 
  applyDefaultPricingToAllRegions,
  getDefaultPriceTableStats,
  hasDefaultPricingApplied,
  resetRegionPricing,
  exportDefaultPriceTableAsCSV
} from '../utils/defaultPriceData.js';
import { getAllRegionConfigs } from '../utils/unifiedStorage.js';
import { getRegionDisplayInfo } from '../data/regionManagement.js';

/**
 * 批量价格管理面板
 * 提供批量导入、默认配置应用、数据导出等功能
 */
const BatchPriceManager = ({ onConfigChange, className = '' }) => {
  const [showImporter, setShowImporter] = useState(false);
  const [regionStatus, setRegionStatus] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [operationResult, setOperationResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 加载区域状态
  useEffect(() => {
    loadRegionStatus();
  }, []);

  const loadRegionStatus = () => {
    setIsLoading(true);
    try {
      const regionConfigs = getAllRegionConfigs();
      const status = {};

      // 检查每个区域的配置状态
      [1, 2, 3, 4, 5, 6, 7, 8].forEach(regionNum => {
        const regionId = regionNum.toString();
        const config = regionConfigs[regionId];
        const regionInfo = getRegionDisplayInfo(regionId);
        
        status[regionId] = {
          ...regionInfo,
          hasConfig: !!config,
          hasDefaultPricing: hasDefaultPricingApplied(regionId),
          activeRanges: config?.weightRanges?.filter(r => r.isActive).length || 0,
          totalRanges: config?.weightRanges?.length || 0,
          lastUpdated: config?.lastUpdated,
          postalCodeCount: config?.postalCodes?.length || 0
        };
      });

      setRegionStatus(status);
    } catch (error) {
      console.error('加载区域状态失败:', error);
      setOperationResult({
        type: 'error',
        message: `加载区域状态失败: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 应用默认价格配置
  const handleApplyDefaultPricing = async () => {
    setIsProcessing(true);
    setOperationResult(null);

    try {
      const result = applyDefaultPricingToAllRegions();
      
      if (result.summary.successCount > 0) {
        setOperationResult({
          type: 'success',
          message: `成功应用默认价格配置到 ${result.summary.successCount} 个区域`,
          details: result
        });
        
        // 重新加载区域状态
        loadRegionStatus();
        
        // 通知父组件
        onConfigChange?.();
      } else {
        setOperationResult({
          type: 'error',
          message: '默认价格配置应用失败',
          details: result
        });
      }
    } catch (error) {
      setOperationResult({
        type: 'error',
        message: `应用默认配置失败: ${error.message}`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 重置所有区域价格
  const handleResetAllPricing = async () => {
    if (!confirm('确定要重置所有区域的价格配置吗？此操作不可撤销。')) {
      return;
    }

    setIsProcessing(true);
    setOperationResult(null);

    try {
      const results = { success: [], failed: [] };
      
      Object.keys(regionStatus).forEach(regionId => {
        const success = resetRegionPricing(regionId);
        if (success) {
          results.success.push(regionId);
        } else {
          results.failed.push(regionId);
        }
      });

      if (results.success.length > 0) {
        setOperationResult({
          type: 'success',
          message: `成功重置 ${results.success.length} 个区域的价格配置`
        });
        
        // 重新加载区域状态
        loadRegionStatus();
        
        // 通知父组件
        onConfigChange?.();
      } else {
        setOperationResult({
          type: 'error',
          message: '价格配置重置失败'
        });
      }
    } catch (error) {
      setOperationResult({
        type: 'error',
        message: `重置配置失败: ${error.message}`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 导出价格表
  const handleExportPriceTable = () => {
    try {
      const csvData = exportDefaultPriceTableAsCSV();
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `price_table_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setOperationResult({
        type: 'success',
        message: '价格表导出成功'
      });
    } catch (error) {
      setOperationResult({
        type: 'error',
        message: `导出失败: ${error.message}`
      });
    }
  };

  // 处理导入完成
  const handleImportComplete = (importResult) => {
    setOperationResult({
      type: 'success',
      message: `批量导入完成，成功配置 ${importResult.summary.totalRegions} 个区域`,
      details: importResult
    });
    
    // 重新加载区域状态
    loadRegionStatus();
    
    // 通知父组件
    onConfigChange?.();
  };

  const defaultStats = getDefaultPriceTableStats();

  if (isLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-400">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 标题区域 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">批量价格管理</h2>
          <p className="text-gray-400 text-sm mt-1">批量配置和管理配送区域价格</p>
        </div>
        
        <button
          onClick={loadRegionStatus}
          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          title="刷新状态"
        >
          <RefreshCw className="w-4 h-4 text-gray-300" />
        </button>
      </div>

      {/* 操作结果显示 */}
      <AnimatePresence>
        {operationResult && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-lg border ${
              operationResult.type === 'success'
                ? 'bg-green-900/20 border-green-500/30'
                : 'bg-red-900/20 border-red-500/30'
            }`}
          >
            <div className="flex items-center gap-2">
              {operationResult.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-400" />
              )}
              <span className={`font-medium ${
                operationResult.type === 'success' ? 'text-green-400' : 'text-red-400'
              }`}>
                {operationResult.message}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 快速操作区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 批量导入 */}
        <button
          onClick={() => setShowImporter(true)}
          className="p-4 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg transition-all text-left group"
        >
          <Upload className="w-6 h-6 text-white mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="text-white font-semibold">批量导入</h3>
          <p className="text-blue-100 text-sm">从表格数据导入价格</p>
        </button>

        {/* 应用默认配置 */}
        <button
          onClick={handleApplyDefaultPricing}
          disabled={isProcessing}
          className="p-4 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 rounded-lg transition-all text-left group"
        >
          <Zap className="w-6 h-6 text-white mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="text-white font-semibold">应用默认配置</h3>
          <p className="text-green-100 text-sm">使用预设价格表</p>
        </button>

        {/* 导出价格表 */}
        <button
          onClick={handleExportPriceTable}
          className="p-4 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg transition-all text-left group"
        >
          <Download className="w-6 h-6 text-white mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="text-white font-semibold">导出价格表</h3>
          <p className="text-purple-100 text-sm">下载CSV格式</p>
        </button>

        {/* 重置配置 */}
        <button
          onClick={handleResetAllPricing}
          disabled={isProcessing}
          className="p-4 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 rounded-lg transition-all text-left group"
        >
          <Settings className="w-6 h-6 text-white mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="text-white font-semibold">重置配置</h3>
          <p className="text-red-100 text-sm">清除所有价格</p>
        </button>
      </div>

      {/* 默认价格表统计 */}
      <div className="bg-gray-800/50 border border-gray-600/50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold">默认价格表信息</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-400">重量区间：</span>
            <span className="text-white ml-1">{defaultStats.totalRanges} 个</span>
          </div>
          <div>
            <span className="text-gray-400">重量范围：</span>
            <span className="text-white ml-1">{defaultStats.weightRange.min}-{defaultStats.weightRange.max} KG</span>
          </div>
          <div>
            <span className="text-gray-400">价格区域：</span>
            <span className="text-white ml-1">5 个区域</span>
          </div>
          <div>
            <span className="text-gray-400">价格范围：</span>
            <span className="text-white ml-1">
              ${Math.min(...Object.values(defaultStats.priceRanges).map(r => r.min)).toFixed(2)} - 
              ${Math.max(...Object.values(defaultStats.priceRanges).map(r => r.max)).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* 区域配置状态 */}
      <div className="bg-gray-800/50 border border-gray-600/50 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-600/50">
          <h3 className="text-white font-semibold">区域配置状态</h3>
        </div>
        
        <div className="divide-y divide-gray-600/50">
          {Object.entries(regionStatus).map(([regionId, status]) => (
            <div key={regionId} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: status.color }}
                ></div>
                <div>
                  <span className="text-white font-medium">{status.name}</span>
                  <div className="text-sm text-gray-400">
                    {status.postalCodeCount} FSA • {status.activeRanges}/{status.totalRanges} 活跃区间
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {status.hasDefaultPricing && (
                  <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded">
                    默认配置
                  </span>
                )}
                {status.activeRanges > 0 ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 批量导入器 */}
      <AnimatePresence>
        {showImporter && (
          <BatchPriceImporter
            onImportComplete={handleImportComplete}
            onClose={() => setShowImporter(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BatchPriceManager;
