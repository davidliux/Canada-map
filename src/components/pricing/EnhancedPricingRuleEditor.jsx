/**
 * 增强定价规则编辑器组件
 * 
 * 提供完整的定价规则编辑功能，支持：
 * - 区域上下文感知编辑
 * - 多重量范围配置
 * - 实时价格预览
 * - 规则验证和提示
 * - 模板和批量编辑
 * 
 * Tasks 26-29: 增强定价规则编辑器功能
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit3,
  Plus,
  Trash2,
  Copy,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Info,
  Calculator,
  Package,
  DollarSign,
  Percent,
  Settings,
  LayoutTemplate,
  Zap,
  TrendingUp,
  Target
} from 'lucide-react';

import pricingService from '../../services/pricingService.js';
import cityStorageService from '../../utils/storage/cityStorage.js';

// 默认重量范围配置
const DEFAULT_WEIGHT_RANGES = [
  { min: 0, max: 5, basePrice: 15.99, perKgPrice: 2.50 },
  { min: 5, max: 10, basePrice: 25.99, perKgPrice: 2.00 },
  { min: 10, max: 20, basePrice: 45.99, perKgPrice: 1.80 },
  { min: 20, max: 50, basePrice: 85.99, perKgPrice: 1.50 },
  { min: 50, max: -1, basePrice: 150.99, perKgPrice: 1.20 } // -1 表示无上限
];

// 定价模板
const PRICING_TEMPLATES = {
  standard: {
    name: '标准定价',
    description: '适用于大部分城市区域的标准定价策略',
    ranges: DEFAULT_WEIGHT_RANGES
  },
  premium: {
    name: '高端定价',
    description: '适用于核心商业区域的高端定价策略',
    ranges: DEFAULT_WEIGHT_RANGES.map(range => ({
      ...range,
      basePrice: range.basePrice * 1.3,
      perKgPrice: range.perKgPrice * 1.2
    }))
  },
  economy: {
    name: '经济定价',
    description: '适用于郊区或低成本区域的经济定价策略',
    ranges: DEFAULT_WEIGHT_RANGES.map(range => ({
      ...range,
      basePrice: range.basePrice * 0.8,
      perKgPrice: range.perKgPrice * 0.9
    }))
  }
};

/**
 * 重量范围编辑器组件
 */
const WeightRangeEditor = ({ 
  range, 
  index, 
  onUpdate, 
  onDelete, 
  canDelete = true,
  showCalculator = false 
}) => {
  const [localRange, setLocalRange] = useState(range);
  const [showPreview, setShowPreview] = useState(false);

  // 更新本地状态
  const updateLocalRange = useCallback((field, value) => {
    const newRange = { ...localRange, [field]: value };
    setLocalRange(newRange);
    onUpdate(index, newRange);
  }, [localRange, index, onUpdate]);

  // 计算价格预览
  const calculatePreview = useCallback((weight) => {
    if (weight < localRange.min || (localRange.max !== -1 && weight > localRange.max)) {
      return null;
    }
    return localRange.basePrice + (weight * localRange.perKgPrice);
  }, [localRange]);

  const previewWeights = [1, 3, 5, 10, 15, 25].filter(w => 
    w >= localRange.min && (localRange.max === -1 || w <= localRange.max)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gray-800/50 border border-gray-700 rounded-xl p-6"
    >
      {/* 范围标题 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Package className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h4 className="font-semibold text-white">
              {localRange.min}kg - {localRange.max === -1 ? '无上限' : `${localRange.max}kg`}
            </h4>
            <p className="text-gray-400 text-sm">重量范围 #{index + 1}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {showCalculator && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
              title="价格预览"
            >
              <Calculator className="w-4 h-4 text-white" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(index)}
              className="p-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
              title="删除范围"
            >
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* 重量范围输入 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            最小重量 (kg)
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={localRange.min}
            onChange={(e) => updateLocalRange('min', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg 
                     text-white focus:border-purple-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            最大重量 (kg)
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.1"
              value={localRange.max === -1 ? '' : localRange.max}
              onChange={(e) => updateLocalRange('max', e.target.value === '' ? -1 : parseFloat(e.target.value))}
              placeholder="无上限"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg 
                       text-white focus:border-purple-500 focus:outline-none"
            />
            {localRange.max === -1 && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded">
                  无上限
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 价格配置 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <DollarSign className="w-4 h-4 inline mr-1" />
            基础价格 (CAD)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={localRange.basePrice}
            onChange={(e) => updateLocalRange('basePrice', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg 
                     text-white focus:border-green-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Percent className="w-4 h-4 inline mr-1" />
            每公斤加价 (CAD)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={localRange.perKgPrice}
            onChange={(e) => updateLocalRange('perKgPrice', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg 
                     text-white focus:border-orange-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 价格预览 */}
      <AnimatePresence>
        {showPreview && previewWeights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600"
          >
            <h5 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              价格预览
            </h5>
            <div className="grid grid-cols-3 gap-3">
              {previewWeights.map(weight => (
                <div key={weight} className="text-center">
                  <div className="text-xs text-gray-400">{weight}kg</div>
                  <div className="text-sm font-semibold text-cyan-400">
                    ${calculatePreview(weight)?.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * 增强定价规则编辑器主组件
 */
const EnhancedPricingRuleEditor = ({
  cityId,
  regionId,
  regionIds = [], // 多区域支持
  initialRules = null,
  onSave,
  onCancel,
  onValidationChange,
  showTemplates = true,
  enableBatchEdit = false,
  className = ''
}) => {
  // 状态管理
  const [pricingRules, setPricingRules] = useState(initialRules || DEFAULT_WEIGHT_RANGES);
  const [cityData, setCityData] = useState(null);
  const [regionData, setRegionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [showTemplatesPanel, setShowTemplatesPanel] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // 是否为多区域模式
  const isMultiRegionMode = regionIds.length > 1;
  const targetRegionCount = isMultiRegionMode ? regionIds.length : 1;

  // 加载区域数据
  const loadRegionData = useCallback(async () => {
    if (!cityId) return;

    setLoading(true);
    try {
      const city = await cityStorageService.getCity(cityId);
      setCityData(city);

      if (regionId && city?.regions) {
        const region = city.regions.find(r => r.id === regionId);
        setRegionData(region);
        
        // 如果有现有定价规则，加载它们
        if (region?.pricingRules) {
          setPricingRules(region.pricingRules);
        }
      }
    } catch (error) {
      console.error('加载区域数据失败:', error);
      setErrors([{ type: 'load', message: '加载区域数据失败' }]);
    } finally {
      setLoading(false);
    }
  }, [cityId, regionId]);

  useEffect(() => {
    loadRegionData();
  }, [loadRegionData]);

  // 验证定价规则
  const validateRules = useCallback((rules) => {
    const newErrors = [];
    const newWarnings = [];

    // 检查重量范围是否有重叠
    for (let i = 0; i < rules.length - 1; i++) {
      const current = rules[i];
      const next = rules[i + 1];
      
      if (current.max !== -1 && next.min < current.max) {
        newErrors.push({
          type: 'overlap',
          message: `重量范围 ${i + 1} 和 ${i + 2} 存在重叠`,
          rangeIndex: i
        });
      }
    }

    // 检查价格合理性
    rules.forEach((rule, index) => {
      if (rule.basePrice <= 0) {
        newErrors.push({
          type: 'price',
          message: `范围 ${index + 1} 的基础价格必须大于0`,
          rangeIndex: index
        });
      }
      
      if (rule.perKgPrice < 0) {
        newErrors.push({
          type: 'price',
          message: `范围 ${index + 1} 的每公斤价格不能为负`,
          rangeIndex: index
        });
      }

      // 警告：价格可能过高或过低
      if (rule.basePrice > 200) {
        newWarnings.push({
          type: 'price',
          message: `范围 ${index + 1} 的基础价格可能过高`,
          rangeIndex: index
        });
      }

      if (rule.basePrice < 5) {
        newWarnings.push({
          type: 'price',
          message: `范围 ${index + 1} 的基础价格可能过低`,
          rangeIndex: index
        });
      }
    });

    setErrors(newErrors);
    setWarnings(newWarnings);

    // 通知父组件验证状态
    if (onValidationChange) {
      onValidationChange({
        isValid: newErrors.length === 0,
        errors: newErrors,
        warnings: newWarnings
      });
    }

    return newErrors.length === 0;
  }, [onValidationChange]);

  // 更新定价规则
  const updatePricingRule = useCallback((index, updatedRule) => {
    const newRules = [...pricingRules];
    newRules[index] = updatedRule;
    setPricingRules(newRules);
    setIsDirty(true);
    
    // 延迟验证以避免输入时频繁验证
    setTimeout(() => validateRules(newRules), 300);
  }, [pricingRules, validateRules]);

  // 添加新的重量范围
  const addWeightRange = useCallback(() => {
    const lastRange = pricingRules[pricingRules.length - 1];
    const newRange = {
      min: lastRange.max === -1 ? lastRange.min + 10 : lastRange.max,
      max: -1,
      basePrice: lastRange.basePrice * 1.5,
      perKgPrice: lastRange.perKgPrice * 0.9
    };
    
    const newRules = [...pricingRules, newRange];
    setPricingRules(newRules);
    setIsDirty(true);
    validateRules(newRules);
  }, [pricingRules, validateRules]);

  // 删除重量范围
  const deleteWeightRange = useCallback((index) => {
    if (pricingRules.length <= 1) return;
    
    const newRules = pricingRules.filter((_, i) => i !== index);
    setPricingRules(newRules);
    setIsDirty(true);
    validateRules(newRules);
  }, [pricingRules, validateRules]);

  // 应用定价模板
  const applyTemplate = useCallback((templateKey) => {
    const template = PRICING_TEMPLATES[templateKey];
    if (template) {
      setPricingRules([...template.ranges]);
      setIsDirty(true);
      setShowTemplatesPanel(false);
      validateRules(template.ranges);
    }
  }, [validateRules]);

  // 保存定价规则
  const handleSave = useCallback(async () => {
    if (!validateRules(pricingRules)) {
      return;
    }

    setLoading(true);
    try {
      if (isMultiRegionMode) {
        // 批量保存到多个区域
        await Promise.all(regionIds.map(rId => 
          pricingService.updateRegionPricing(cityId, rId, pricingRules)
        ));
      } else {
        // 保存到单个区域
        await pricingService.updateRegionPricing(cityId, regionId, pricingRules);
      }

      setIsDirty(false);
      if (onSave) {
        onSave(pricingRules);
      }
    } catch (error) {
      console.error('保存定价规则失败:', error);
      setErrors([{ type: 'save', message: '保存定价规则失败，请重试' }]);
    } finally {
      setLoading(false);
    }
  }, [pricingRules, validateRules, isMultiRegionMode, regionIds, cityId, regionId, onSave]);

  // 计算价格统计
  const priceStats = useMemo(() => {
    if (pricingRules.length === 0) return null;

    const stats = {
      minBasePrice: Math.min(...pricingRules.map(r => r.basePrice)),
      maxBasePrice: Math.max(...pricingRules.map(r => r.basePrice)),
      avgPerKgPrice: pricingRules.reduce((sum, r) => sum + r.perKgPrice, 0) / pricingRules.length,
      totalRanges: pricingRules.length
    };

    return stats;
  }, [pricingRules]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 头部信息 */}
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-6 border border-purple-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Edit3 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                定价规则编辑器
              </h3>
              <p className="text-gray-300 text-sm mt-1">
                {isMultiRegionMode 
                  ? `编辑 ${targetRegionCount} 个区域的定价规则`
                  : `编辑 ${regionData?.name || '选中区域'} 的定价规则`
                }
              </p>
              {cityData && (
                <p className="text-gray-400 text-xs mt-1">
                  城市: {cityData.name} ({cityData.province})
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {showTemplates && (
              <button
                onClick={() => setShowTemplatesPanel(!showTemplatesPanel)}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 
                         border border-cyan-500 rounded-lg transition-colors text-white"
              >
                <LayoutTemplate className="w-4 h-4" />
                模板
              </button>
            )}
            
            {priceStats && (
              <div className="hidden lg:flex items-center gap-4 text-sm">
                <div className="text-center">
                  <div className="text-gray-400">价格范围</div>
                  <div className="text-green-400 font-semibold">
                    ${priceStats.minBasePrice.toFixed(2)} - ${priceStats.maxBasePrice.toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400">平均每公斤</div>
                  <div className="text-orange-400 font-semibold">
                    ${priceStats.avgPerKgPrice.toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 错误和警告显示 */}
        {(errors.length > 0 || warnings.length > 0) && (
          <div className="mt-4 space-y-2">
            {errors.map((error, index) => (
              <div key={`error-${index}`} className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error.message}
              </div>
            ))}
            {warnings.map((warning, index) => (
              <div key={`warning-${index}`} className="flex items-center gap-2 text-yellow-400 text-sm">
                <Info className="w-4 h-4" />
                {warning.message}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 模板选择面板 */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-800/50 border border-gray-700 rounded-xl p-6"
          >
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-cyan-400" />
              定价模板
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(PRICING_TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => applyTemplate(key)}
                  className="p-4 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 
                           rounded-lg text-left transition-colors"
                >
                  <h5 className="font-semibold text-white mb-2">{template.name}</h5>
                  <p className="text-gray-400 text-sm mb-3">{template.description}</p>
                  <div className="text-xs text-cyan-400">
                    {template.ranges.length} 个重量范围
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 重量范围编辑区域 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-white">重量范围配置</h4>
          <button
            onClick={addWeightRange}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 
                     rounded-lg transition-colors text-white"
          >
            <Plus className="w-4 h-4" />
            添加范围
          </button>
        </div>

        <AnimatePresence>
          {pricingRules.map((range, index) => (
            <WeightRangeEditor
              key={`range-${index}`}
              range={range}
              index={index}
              onUpdate={updatePricingRule}
              onDelete={deleteWeightRange}
              canDelete={pricingRules.length > 1}
              showCalculator={true}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-700">
        <div className="flex items-center gap-3 text-sm text-gray-400">
          {isDirty && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full" />
              有未保存的更改
            </div>
          )}
          {errors.length === 0 && pricingRules.length > 0 && (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-4 h-4" />
              配置有效
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 
                       rounded-lg transition-colors text-white"
            >
              取消
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={loading || errors.length > 0}
            className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-500 
                     disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-white"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            保存规则 {isMultiRegionMode && `(${targetRegionCount} 个区域)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPricingRuleEditor;