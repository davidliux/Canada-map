/**
 * 批量操作对话框组件
 * 
 * 提供多种批量操作功能，支持：
 * - 批量定价规则编辑
 * - 批量复制和应用
 * - 批量导入导出
 * - 操作进度和结果反馈
 * 
 * Tasks 33-35: 批量操作对话框功能
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Copy,
  Download,
  Upload,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  Package,
  Calculator,
  FileText,
  Target,
  Zap,
  ArrowRight,
  BarChart3,
  RefreshCw,
  Eye,
  AlertTriangle
} from 'lucide-react';

import pricingService from '../../services/pricingService.js';
import { formatCurrency } from '../../utils/formatting.js';

// 批量操作类型
const BATCH_OPERATIONS = {
  bulkEdit: {
    title: '批量编辑定价',
    description: '同时修改多个区域的定价规则',
    icon: Settings,
    color: 'orange'
  },
  copyPricing: {
    title: '复制定价规则',
    description: '将一个区域的定价复制到其他区域',
    icon: Copy,
    color: 'blue'
  },
  importExport: {
    title: '导入/导出',
    description: '批量导入或导出定价规则',
    icon: FileText,
    color: 'green'
  },
  applyTemplate: {
    title: '应用模板',
    description: '将定价模板批量应用到选中区域',
    icon: Target,
    color: 'purple'
  }
};

/**
 * 批量编辑表单组件
 */
const BulkEditForm = ({ selectedRegions, onSave, onCancel }) => {
  const [editMode, setEditMode] = useState('percentage'); // 'percentage' | 'fixed' | 'range'
  const [adjustmentValue, setAdjustmentValue] = useState(10);
  const [adjustmentType, setAdjustmentType] = useState('increase'); // 'increase' | 'decrease'
  const [targetField, setTargetField] = useState('basePrice'); // 'basePrice' | 'perKgPrice' | 'both'
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // 生成预览
  const generatePreview = useCallback(async () => {
    setLoading(true);
    try {
      const previewData = await Promise.all(
        selectedRegions.map(async (region) => {
          const currentRules = await pricingService.getRegionPricing(region.cityId, region.id);
          const adjustedRules = currentRules.map(rule => {
            const adjustment = editMode === 'percentage' 
              ? (adjustmentType === 'increase' ? 1 + adjustmentValue / 100 : 1 - adjustmentValue / 100)
              : adjustmentValue;

            return {
              ...rule,
              basePrice: targetField === 'basePrice' || targetField === 'both'
                ? editMode === 'percentage' 
                  ? rule.basePrice * adjustment
                  : rule.basePrice + (adjustmentType === 'increase' ? adjustment : -adjustment)
                : rule.basePrice,
              perKgPrice: targetField === 'perKgPrice' || targetField === 'both'
                ? editMode === 'percentage'
                  ? rule.perKgPrice * adjustment
                  : rule.perKgPrice + (adjustmentType === 'increase' ? adjustment : -adjustment)
                : rule.perKgPrice
            };
          });

          return {
            region,
            currentRules,
            adjustedRules,
            totalChange: adjustedRules.reduce((sum, rule, index) => 
              sum + (rule.basePrice - currentRules[index].basePrice), 0
            )
          };
        })
      );

      setPreview(previewData);
    } catch (error) {
      console.error('生成预览失败:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedRegions, editMode, adjustmentValue, adjustmentType, targetField]);

  useEffect(() => {
    generatePreview();
  }, [generatePreview]);

  const handleSave = useCallback(async () => {
    if (!preview) return;

    setLoading(true);
    try {
      await Promise.all(
        preview.map(({ region, adjustedRules }) =>
          pricingService.updateRegionPricing(region.cityId, region.id, adjustedRules)
        )
      );
      onSave?.();
    } catch (error) {
      console.error('批量编辑失败:', error);
    } finally {
      setLoading(false);
    }
  }, [preview, onSave]);

  return (
    <div className="space-y-6">
      {/* 编辑选项 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">调整方式</label>
          <div className="space-y-2">
            <label className="flex items-center gap-3">
              <input
                type="radio"
                value="percentage"
                checked={editMode === 'percentage'}
                onChange={(e) => setEditMode(e.target.value)}
                className="w-4 h-4 text-orange-600 bg-gray-700 border-gray-600 focus:ring-orange-500"
              />
              <span className="text-white">按百分比调整</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="radio"
                value="fixed"
                checked={editMode === 'fixed'}
                onChange={(e) => setEditMode(e.target.value)}
                className="w-4 h-4 text-orange-600 bg-gray-700 border-gray-600 focus:ring-orange-500"
              />
              <span className="text-white">按固定金额调整</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">调整对象</label>
          <select
            value={targetField}
            onChange={(e) => setTargetField(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg 
                     text-white focus:border-orange-500 focus:outline-none"
          >
            <option value="basePrice">基础价格</option>
            <option value="perKgPrice">每公斤价格</option>
            <option value="both">基础价格 + 每公斤价格</option>
          </select>
        </div>
      </div>

      {/* 调整参数 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">调整类型</label>
          <div className="flex gap-3">
            <button
              onClick={() => setAdjustmentType('increase')}
              className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                adjustmentType === 'increase'
                  ? 'bg-green-600 border-green-500 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
            >
              增加
            </button>
            <button
              onClick={() => setAdjustmentType('decrease')}
              className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                adjustmentType === 'decrease'
                  ? 'bg-red-600 border-red-500 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
            >
              减少
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            调整数值 {editMode === 'percentage' ? '(%)' : '(CAD)'}
          </label>
          <input
            type="number"
            min="0"
            step={editMode === 'percentage' ? '1' : '0.01'}
            value={adjustmentValue}
            onChange={(e) => setAdjustmentValue(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg 
                     text-white focus:border-orange-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 预览结果 */}
      {preview && (
        <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-cyan-400" />
            <h4 className="font-semibold text-white">预览效果</h4>
            <button
              onClick={generatePreview}
              className="ml-auto p-1 hover:bg-gray-600 rounded transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {preview.map(({ region, currentRules, adjustedRules, totalChange }) => (
              <div key={region.id} className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">{region.name}</span>
                  <span className={`text-sm font-semibold ${
                    totalChange > 0 ? 'text-green-400' : totalChange < 0 ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {totalChange > 0 ? '+' : ''}{formatCurrency(totalChange)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-gray-400">当前基础价格</div>
                    <div className="text-white">
                      ${currentRules[0]?.basePrice.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">调整后基础价格</div>
                    <div className="text-cyan-400">
                      ${adjustedRules[0]?.basePrice.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 
                   rounded-lg transition-colors text-white"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          disabled={loading || !preview}
          className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-500 
                   disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-white"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Settings className="w-4 h-4" />
          )}
          应用更改 ({selectedRegions.length} 个区域)
        </button>
      </div>
    </div>
  );
};

/**
 * 复制定价表单组件
 */
const CopyPricingForm = ({ selectedRegions, onSave, onCancel }) => {
  const [sourceRegion, setSourceRegion] = useState(null);
  const [targetRegions, setTargetRegions] = useState([]);
  const [copyOptions, setCopyOptions] = useState({
    copyBasePrice: true,
    copyPerKgPrice: true,
    copyAllRanges: true,
    overwriteExisting: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedRegions.length > 0) {
      setSourceRegion(selectedRegions[0]);
      setTargetRegions(selectedRegions.slice(1));
    }
  }, [selectedRegions]);

  const handleCopy = useCallback(async () => {
    if (!sourceRegion || targetRegions.length === 0) return;

    setLoading(true);
    try {
      const sourcePricing = await pricingService.getRegionPricing(sourceRegion.cityId, sourceRegion.id);
      
      await Promise.all(
        targetRegions.map(target => 
          pricingService.copyPricingRules(
            sourceRegion.cityId, 
            sourceRegion.id, 
            target.cityId, 
            target.id, 
            copyOptions
          )
        )
      );
      
      onSave?.();
    } catch (error) {
      console.error('复制定价规则失败:', error);
    } finally {
      setLoading(false);
    }
  }, [sourceRegion, targetRegions, copyOptions, onSave]);

  return (
    <div className="space-y-6">
      {/* 源区域选择 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">源区域（复制来源）</label>
        <select
          value={sourceRegion?.id || ''}
          onChange={(e) => {
            const region = selectedRegions.find(r => r.id === e.target.value);
            setSourceRegion(region);
            setTargetRegions(selectedRegions.filter(r => r.id !== e.target.value));
          }}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg 
                   text-white focus:border-blue-500 focus:outline-none"
        >
          {selectedRegions.map(region => (
            <option key={region.id} value={region.id}>
              {region.name} ({region.cityName})
            </option>
          ))}
        </select>
      </div>

      {/* 目标区域 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          目标区域 ({targetRegions.length} 个)
        </label>
        <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-600 rounded-lg p-3">
          {targetRegions.map(region => (
            <div key={region.id} className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-white">{region.name}</span>
              <span className="text-gray-400 text-sm">({region.cityName})</span>
            </div>
          ))}
        </div>
      </div>

      {/* 复制选项 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">复制选项</label>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={copyOptions.copyBasePrice}
              onChange={(e) => setCopyOptions(prev => ({ ...prev, copyBasePrice: e.target.checked }))}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="text-white">复制基础价格</span>
          </label>
          
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={copyOptions.copyPerKgPrice}
              onChange={(e) => setCopyOptions(prev => ({ ...prev, copyPerKgPrice: e.target.checked }))}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="text-white">复制每公斤价格</span>
          </label>
          
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={copyOptions.copyAllRanges}
              onChange={(e) => setCopyOptions(prev => ({ ...prev, copyAllRanges: e.target.checked }))}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="text-white">复制所有重量范围</span>
          </label>
          
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={copyOptions.overwriteExisting}
              onChange={(e) => setCopyOptions(prev => ({ ...prev, overwriteExisting: e.target.checked }))}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="text-white">覆盖现有规则</span>
          </label>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 
                   rounded-lg transition-colors text-white"
        >
          取消
        </button>
        <button
          onClick={handleCopy}
          disabled={loading || !sourceRegion || targetRegions.length === 0}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 
                   disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-white"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          复制到 {targetRegions.length} 个区域
        </button>
      </div>
    </div>
  );
};

/**
 * 导入导出表单组件
 */
const ImportExportForm = ({ selectedRegions, onSave, onCancel }) => {
  const [mode, setMode] = useState('export'); // 'import' | 'export'
  const [importFile, setImportFile] = useState(null);
  const [importData, setImportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        setImportData(data);
      } catch (error) {
        console.error('文件解析失败:', error);
        alert('文件格式错误，请选择有效的JSON文件');
      }
    };
    reader.readAsText(file);
  }, []);

  const handleExport = useCallback(async () => {
    setLoading(true);
    try {
      const exportData = await Promise.all(
        selectedRegions.map(async (region) => {
          const pricing = await pricingService.getRegionPricing(region.cityId, region.id);
          return {
            regionId: region.id,
            regionName: region.name,
            cityId: region.cityId,
            cityName: region.cityName,
            pricingRules: pricing
          };
        })
      );

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pricing-rules-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      onSave?.();
    } catch (error) {
      console.error('导出失败:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedRegions, onSave]);

  const handleImport = useCallback(async () => {
    if (!importData) return;

    setLoading(true);
    setProgress(0);
    
    try {
      const total = importData.length;
      for (let i = 0; i < total; i++) {
        const item = importData[i];
        const targetRegion = selectedRegions.find(r => 
          r.name === item.regionName || r.id === item.regionId
        );
        
        if (targetRegion && item.pricingRules) {
          await pricingService.updateRegionPricing(
            targetRegion.cityId, 
            targetRegion.id, 
            item.pricingRules
          );
        }
        
        setProgress(((i + 1) / total) * 100);
      }
      
      onSave?.();
    } catch (error) {
      console.error('导入失败:', error);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  }, [importData, selectedRegions, onSave]);

  return (
    <div className="space-y-6">
      {/* 模式切换 */}
      <div className="flex gap-3">
        <button
          onClick={() => setMode('export')}
          className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
            mode === 'export'
              ? 'bg-green-600 border-green-500 text-white'
              : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
          }`}
        >
          导出规则
        </button>
        <button
          onClick={() => setMode('import')}
          className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
            mode === 'import'
              ? 'bg-blue-600 border-blue-500 text-white'
              : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
          }`}
        >
          导入规则
        </button>
      </div>

      {mode === 'export' ? (
        <div className="text-center py-8">
          <Download className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-white mb-2">导出定价规则</h4>
          <p className="text-gray-400 mb-6">
            将选中的 {selectedRegions.length} 个区域的定价规则导出为JSON文件
          </p>
          <button
            onClick={handleExport}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 
                     disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-white mx-auto"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            开始导出
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 文件选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">选择导入文件</label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg 
                       text-white file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 
                       file:text-white file:bg-blue-600 hover:file:bg-blue-500"
            />
          </div>

          {/* 导入预览 */}
          {importData && (
            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
              <h4 className="font-semibold text-white mb-3">导入预览</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {importData.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-white">{item.regionName}</span>
                    <span className="text-gray-400">{item.pricingRules?.length || 0} 条规则</span>
                  </div>
                ))}
                {importData.length > 5 && (
                  <div className="text-center text-gray-400 text-sm">
                    还有 {importData.length - 5} 项...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 导入进度 */}
          {loading && progress > 0 && (
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm">导入进度</span>
                <span className="text-cyan-400 text-sm">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 
                   rounded-lg transition-colors text-white"
        >
          取消
        </button>
        {mode === 'import' && (
          <button
            onClick={handleImport}
            disabled={loading || !importData}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 
                     disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-white"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            开始导入
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * 批量操作对话框主组件
 */
const BatchOperationsDialog = ({
  isOpen,
  onClose,
  selectedRegions = [],
  operation = 'bulkEdit',
  onComplete
}) => {
  const [currentOperation, setCurrentOperation] = useState(operation);
  const [result, setResult] = useState(null);

  const operationConfig = BATCH_OPERATIONS[currentOperation];
  const IconComponent = operationConfig?.icon || Settings;

  // 重置状态
  useEffect(() => {
    if (isOpen) {
      setResult(null);
      setCurrentOperation(operation);
    }
  }, [isOpen, operation]);

  const handleOperationComplete = useCallback((success = true, message = '') => {
    setResult({ success, message });
    
    setTimeout(() => {
      onComplete?.(success);
      onClose();
    }, 2000);
  }, [onComplete, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          {/* 对话框头部 */}
          <div className={`p-6 border-b border-gray-700 bg-gradient-to-r from-${operationConfig?.color || 'gray'}-900/30 to-gray-900/30`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 bg-${operationConfig?.color || 'gray'}-500/20 rounded-xl`}>
                  <IconComponent className={`w-6 h-6 text-${operationConfig?.color || 'gray'}-400`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {operationConfig?.title || '批量操作'}
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">
                    {operationConfig?.description || '执行批量操作'}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    选中区域: {selectedRegions.length} 个
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 对话框内容 */}
          <div className="p-6">
            {result ? (
              <div className="text-center py-8">
                {result.success ? (
                  <div className="space-y-4">
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
                    <h3 className="text-lg font-semibold text-white">操作完成</h3>
                    <p className="text-gray-400">{result.message || '批量操作已成功完成'}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AlertTriangle className="w-16 h-16 text-red-400 mx-auto" />
                    <h3 className="text-lg font-semibold text-white">操作失败</h3>
                    <p className="text-gray-400">{result.message || '批量操作执行失败'}</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* 操作类型选择 */}
                {Object.keys(BATCH_OPERATIONS).length > 1 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">选择操作类型</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {Object.entries(BATCH_OPERATIONS).map(([key, config]) => {
                        const OpIcon = config.icon;
                        return (
                          <button
                            key={key}
                            onClick={() => setCurrentOperation(key)}
                            className={`p-4 rounded-lg border transition-colors text-left ${
                              currentOperation === key
                                ? `bg-${config.color}-600 border-${config.color}-500 text-white`
                                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                            }`}
                          >
                            <OpIcon className="w-5 h-5 mb-2" />
                            <div className="text-sm font-medium">{config.title}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 操作表单 */}
                <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
                  {currentOperation === 'bulkEdit' && (
                    <BulkEditForm
                      selectedRegions={selectedRegions}
                      onSave={() => handleOperationComplete(true, '批量编辑已完成')}
                      onCancel={onClose}
                    />
                  )}
                  
                  {currentOperation === 'copyPricing' && (
                    <CopyPricingForm
                      selectedRegions={selectedRegions}
                      onSave={() => handleOperationComplete(true, '定价规则复制已完成')}
                      onCancel={onClose}
                    />
                  )}
                  
                  {currentOperation === 'importExport' && (
                    <ImportExportForm
                      selectedRegions={selectedRegions}
                      onSave={() => handleOperationComplete(true, '导入导出操作已完成')}
                      onCancel={onClose}
                    />
                  )}
                  
                  {currentOperation === 'applyTemplate' && (
                    <div className="text-center py-8">
                      <Target className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                      <p className="text-gray-400">模板应用功能开发中...</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BatchOperationsDialog;