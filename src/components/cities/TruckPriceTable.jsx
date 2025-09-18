import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Download,
  Upload,
  Calculator,
  Edit3,
  Lock,
  Unlock,
  Clipboard,
  FileSpreadsheet
} from 'lucide-react';
import { DEFAULT_WEIGHT_RANGES } from '../../utils/unifiedStorage.js';
import { 
  validateWeightRangePrice,
  validateRegionPriceTable 
} from '../../types/truckDelivery.js';

/**
 * 货车配送价格表组件
 * 显示和编辑13个重量区间的价格配置
 */
const TruckPriceTable = ({ 
  regionId,
  regionName,
  priceTable,
  onChange,
  disabled = false,
  showValidation = true,
  allowBatchOperations = true,
  className = '' 
}) => {
  const [prices, setPrices] = useState([]);
  const [validationResults, setValidationResults] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [batchValue, setBatchValue] = useState('');
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [showPasteDialog, setShowPasteDialog] = useState(false);
  const [pasteData, setPasteData] = useState('');
  const [selectedRanges, setSelectedRanges] = useState(new Set());
  const [editingRange, setEditingRange] = useState(null);
  const pasteInputRef = useRef(null);

  // 初始化价格数据
  useEffect(() => {
    if (priceTable?.prices) {
      setPrices([...priceTable.prices]);
    } else {
      // 使用默认重量区间创建价格表
      const defaultPrices = DEFAULT_WEIGHT_RANGES.map(range => ({
        ...range,
        price: 0,
        isActive: true
      }));
      setPrices(defaultPrices);
    }
  }, [priceTable]);

  // 验证价格数据
  const validatePrices = useCallback((pricesData) => {
    const results = {};
    pricesData.forEach((price, index) => {
      results[price.id] = validateWeightRangePrice(price);
    });
    return results;
  }, []);

  // 验证整体价格表
  const validateTable = useCallback(() => {
    if (showValidation) {
      const tableValidation = validateRegionPriceTable({
        regionId,
        prices,
        currency: 'CAD'
      });
      
      const rangeValidation = validatePrices(prices);
      setValidationResults({ table: tableValidation, ranges: rangeValidation });
      return tableValidation.isValid;
    }
    return true;
  }, [prices, regionId, validatePrices, showValidation]);

  // 更新单个价格
  const updatePrice = (rangeId, newPrice) => {
    const updatedPrices = prices.map(price => 
      price.id === rangeId 
        ? { ...price, price: parseFloat(newPrice) || 0 }
        : price
    );
    setPrices(updatedPrices);
    setIsDirty(true);
    
    if (onChange) {
      onChange({
        regionId,
        prices: updatedPrices,
        currency: 'CAD'
      });
    }
  };

  // 切换价格区间激活状态
  const toggleRangeActive = (rangeId) => {
    const updatedPrices = prices.map(price =>
      price.id === rangeId
        ? { ...price, isActive: !price.isActive }
        : price
    );
    setPrices(updatedPrices);
    setIsDirty(true);
    
    if (onChange) {
      onChange({
        regionId,
        prices: updatedPrices,
        currency: 'CAD'
      });
    }
  };

  // 批量设置价格
  const applyBatchPrice = () => {
    if (!batchValue || selectedRanges.size === 0) return;
    
    const batchPriceValue = parseFloat(batchValue);
    if (isNaN(batchPriceValue) || batchPriceValue < 0) {
      alert('请输入有效的价格值');
      return;
    }

    const updatedPrices = prices.map(price =>
      selectedRanges.has(price.id)
        ? { ...price, price: batchPriceValue }
        : price
    );
    
    setPrices(updatedPrices);
    setIsDirty(true);
    setBatchValue('');
    setSelectedRanges(new Set());
    setShowBatchDialog(false);
    
    if (onChange) {
      onChange({
        regionId,
        prices: updatedPrices,
        currency: 'CAD'
      });
    }
  };

  // 处理粘贴的价格数据
  const handlePasteData = () => {
    if (!pasteData.trim()) {
      alert('请粘贴价格数据');
      return;
    }

    try {
      // 解析粘贴的数据
      // 支持多种格式：Tab分隔、逗号分隔、换行分隔
      const lines = pasteData.trim().split('\n');
      const parsedPrices = [];

      lines.forEach(line => {
        // 清理数据：移除空格，处理不同分隔符
        const values = line.trim()
          .split(/[\t,;|\s]+/) // 支持Tab、逗号、分号、管道符、空格
          .filter(val => val.length > 0);

        values.forEach(val => {
          // 清理数字：移除货币符号、千分符等
          const cleanValue = val
            .replace(/[$¥€£]/g, '') // 移除货币符号
            .replace(/,/g, '') // 移除千分符
            .trim();

          const price = parseFloat(cleanValue);
          if (!isNaN(price) && price >= 0) {
            parsedPrices.push(price);
          }
        });
      });

      if (parsedPrices.length === 0) {
        alert('未找到有效的价格数据');
        return;
      }

      // 将解析的价格应用到价格表
      const updatedPrices = [...prices];
      const numPrices = Math.min(parsedPrices.length, prices.length);

      for (let i = 0; i < numPrices; i++) {
        updatedPrices[i] = {
          ...updatedPrices[i],
          price: parsedPrices[i],
          isActive: true // 自动激活有价格的区间
        };
      }

      setPrices(updatedPrices);
      setIsDirty(true);
      setPasteData('');
      setShowPasteDialog(false);

      if (onChange) {
        onChange({
          regionId,
          prices: updatedPrices,
          currency: 'CAD'
        });
      }

      // 显示成功消息
      const message = numPrices < parsedPrices.length
        ? `成功导入 ${numPrices} 个价格（共提供 ${parsedPrices.length} 个）`
        : `成功导入 ${numPrices} 个价格`;

      alert(message);

    } catch (error) {
      console.error('解析粘贴数据失败:', error);
      alert('解析数据失败，请检查格式');
    }
  };

  // 重置价格
  const resetPrices = () => {
    const resetPrices = DEFAULT_WEIGHT_RANGES.map(range => ({
      ...range,
      price: 0,
      isActive: true
    }));
    setPrices(resetPrices);
    setIsDirty(true);

    if (onChange) {
      onChange({
        regionId,
        prices: resetPrices,
        currency: 'CAD'
      });
    }
  };

  // 计算统计信息
  const getStats = () => {
    const activeRanges = prices.filter(p => p.isActive);
    const pricedRanges = activeRanges.filter(p => p.price > 0);
    const totalPrice = pricedRanges.reduce((sum, p) => sum + p.price, 0);
    const avgPrice = pricedRanges.length > 0 ? totalPrice / pricedRanges.length : 0;
    
    return {
      totalRanges: prices.length,
      activeRanges: activeRanges.length,
      pricedRanges: pricedRanges.length,
      totalPrice,
      avgPrice: Math.round(avgPrice * 100) / 100
    };
  };

  const stats = getStats();
  const tableValidation = validationResults.table;

  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-700 ${className}`}>
      {/* 标题栏 */}
      <div className="border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calculator className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">价格配置表</h3>
              <p className="text-sm text-gray-400">
                {regionName || `区域 ${regionId}`} • {stats.pricedRanges}/{stats.totalRanges} 已定价
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {showValidation && tableValidation && (
              <div className="flex items-center space-x-2">
                {tableValidation.isValid ? (
                  <div className="flex items-center space-x-1 text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs">配置有效</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs">需要修正</span>
                  </div>
                )}
              </div>
            )}
            
            {allowBatchOperations && (
              <>
                <button
                  onClick={() => setShowPasteDialog(true)}
                  disabled={disabled}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600
                           text-white rounded-md transition-colors text-sm flex items-center space-x-1"
                  title="从Excel粘贴价格"
                >
                  <Clipboard className="w-4 h-4" />
                  <span>粘贴价格</span>
                </button>

                <button
                  onClick={() => setShowBatchDialog(true)}
                  disabled={disabled}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600
                           text-white rounded-md transition-colors text-sm"
                >
                  批量设置
                </button>
              </>
            )}

            <button
              onClick={resetPrices}
              disabled={disabled}
              className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500
                       text-white rounded-md transition-colors text-sm"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="mt-3 grid grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-white font-medium">{stats.activeRanges}</div>
            <div className="text-gray-400">激活区间</div>
          </div>
          <div className="text-center">
            <div className="text-white font-medium">{stats.pricedRanges}</div>
            <div className="text-gray-400">已定价</div>
          </div>
          <div className="text-center">
            <div className="text-white font-medium">${stats.avgPrice}</div>
            <div className="text-gray-400">平均价格</div>
          </div>
          <div className="text-center">
            <div className="text-white font-medium">${stats.totalPrice.toFixed(2)}</div>
            <div className="text-gray-400">总价格</div>
          </div>
        </div>
      </div>

      {/* 价格表格 */}
      <div className="p-4">
        <div className="space-y-2">
          {prices.map((priceRange, index) => {
            const validation = validationResults.ranges?.[priceRange.id];
            const hasError = validation && !validation.isValid;
            const hasWarning = validation && validation.warnings?.length > 0;
            
            return (
              <motion.div
                key={priceRange.id}
                layout
                className={`grid grid-cols-12 gap-4 p-3 rounded-lg border transition-all
                  ${priceRange.isActive 
                    ? 'bg-gray-800 border-gray-600' 
                    : 'bg-gray-700 border-gray-500 opacity-60'
                  }
                  ${hasError ? 'border-red-500 bg-red-900/20' : ''}
                  ${editingRange === priceRange.id ? 'ring-2 ring-blue-500' : ''}
                `}
              >
                {/* 激活状态切换 */}
                <div className="col-span-1 flex items-center">
                  <button
                    onClick={() => toggleRangeActive(priceRange.id)}
                    disabled={disabled}
                    className={`p-1.5 rounded transition-colors
                      ${priceRange.isActive 
                        ? 'text-green-400 hover:text-green-300' 
                        : 'text-gray-500 hover:text-gray-400'
                      }
                    `}
                  >
                    {priceRange.isActive ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </button>
                </div>

                {/* 重量区间标签 */}
                <div className="col-span-4 flex items-center">
                  <div>
                    <div className="text-white font-medium text-sm">
                      {priceRange.label}
                    </div>
                    <div className="text-xs text-gray-400">
                      区间 {index + 1}
                    </div>
                  </div>
                </div>

                {/* 价格输入 */}
                <div className="col-span-4 flex items-center">
                  <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={priceRange.price}
                      onChange={(e) => updatePrice(priceRange.id, e.target.value)}
                      onFocus={() => setEditingRange(priceRange.id)}
                      onBlur={() => setEditingRange(null)}
                      disabled={disabled || !priceRange.isActive}
                      className={`w-full pl-8 pr-3 py-2 bg-gray-700 border rounded-md 
                        text-white placeholder-gray-400 text-sm
                        focus:outline-none focus:ring-2 focus:ring-blue-500
                        disabled:bg-gray-600 disabled:text-gray-400
                        ${hasError ? 'border-red-500' : 'border-gray-600'}
                      `}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* 批量选择 */}
                {allowBatchOperations && (
                  <div className="col-span-1 flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedRanges.has(priceRange.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedRanges);
                        if (e.target.checked) {
                          newSelected.add(priceRange.id);
                        } else {
                          newSelected.delete(priceRange.id);
                        }
                        setSelectedRanges(newSelected);
                      }}
                      disabled={disabled || !priceRange.isActive}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 
                               rounded focus:ring-blue-500 focus:ring-2"
                    />
                  </div>
                )}

                {/* 状态指示器 */}
                <div className="col-span-2 flex items-center justify-end space-x-2">
                  {hasError && (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  )}
                  {hasWarning && (
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  )}
                  {priceRange.price > 0 && !hasError && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* 验证错误和警告显示 */}
        {showValidation && tableValidation && (
          <AnimatePresence>
            {(tableValidation.errors?.length > 0 || tableValidation.warnings?.length > 0) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-600"
              >
                {tableValidation.errors?.length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center space-x-2 text-red-400 font-medium mb-1">
                      <AlertTriangle className="w-4 h-4" />
                      <span>需要修正的问题:</span>
                    </div>
                    <ul className="text-sm text-red-300 space-y-1 ml-6">
                      {tableValidation.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {tableValidation.warnings?.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 text-yellow-400 font-medium mb-1">
                      <AlertTriangle className="w-4 h-4" />
                      <span>建议优化:</span>
                    </div>
                    <ul className="text-sm text-yellow-300 space-y-1 ml-6">
                      {tableValidation.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* 批量设置对话框 */}
      <AnimatePresence>
        {showBatchDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowBatchDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 rounded-lg p-6 w-96 border border-gray-700"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-4">批量设置价格</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    统一价格 (CAD)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={batchValue}
                      onChange={(e) => setBatchValue(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-gray-800 border border-gray-600 
                               rounded-md text-white placeholder-gray-400
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="输入价格"
                    />
                  </div>
                </div>

                <div className="text-sm text-gray-400">
                  将为 {selectedRanges.size} 个选中的重量区间设置相同价格
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowBatchDialog(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={applyBatchPrice}
                  disabled={!batchValue || selectedRanges.size === 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 
                           text-white rounded-md transition-colors"
                >
                  应用设置
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 粘贴价格对话框 */}
      <AnimatePresence>
        {showPasteDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowPasteDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 rounded-lg p-6 w-[600px] max-w-[90vw] border border-gray-700"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center space-x-2 mb-4">
                <FileSpreadsheet className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold text-white">从Excel粘贴价格数据</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    粘贴价格数据
                  </label>
                  <textarea
                    ref={pasteInputRef}
                    value={pasteData}
                    onChange={(e) => setPasteData(e.target.value)}
                    onPaste={(e) => {
                      e.preventDefault();
                      const text = e.clipboardData.getData('text');
                      setPasteData(text);
                    }}
                    className="w-full h-48 px-3 py-2 bg-gray-800 border border-gray-600
                             rounded-md text-white placeholder-gray-400 font-mono text-sm
                             focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="从Excel复制价格数据后粘贴到这里...

支持的格式：
• 单列：每行一个价格
• 多列：用Tab或逗号分隔
• 示例：
  90    108    126
  108   130.5  153
  126   153    180"
                  />
                </div>

                <div className="bg-gray-800 rounded-lg p-3 border border-gray-600">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-300 space-y-1">
                      <p className="font-medium text-yellow-400">使用说明：</p>
                      <ul className="space-y-1 text-gray-400">
                        <li>• 直接从Excel复制价格列或行</li>
                        <li>• 系统将按顺序填充到13个板数区间</li>
                        <li>• 支持包含货币符号的数据（会自动清理）</li>
                        <li>• 如果提供超过13个价格，多余的将被忽略</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {pasteData && (
                  <div className="text-sm text-gray-400">
                    检测到数据：{pasteData.split(/[\n\t,;|\s]+/).filter(v => v).length} 个值
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setPasteData('');
                    setShowPasteDialog(false);
                  }}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handlePasteData}
                  disabled={!pasteData.trim()}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600
                           text-white rounded-md transition-colors flex items-center space-x-2"
                >
                  <Clipboard className="w-4 h-4" />
                  <span>导入价格</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TruckPriceTable;