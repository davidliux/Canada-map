/**
 * 增强版卡车配送价格表组件
 * 支持批量导入和复制粘贴功能
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  Save, 
  Upload,
  Download,
  Copy,
  Clipboard,
  CheckCircle,
  AlertCircle,
  Grid3x3,
  FileSpreadsheet
} from 'lucide-react';
import { DEFAULT_WEIGHT_RANGES } from '../../utils/unifiedStorage.js';
import cityStorageService from '../../utils/storage/cityStorage';

const EnhancedTruckPriceTable = ({ 
  cityId, 
  zones = [],
  onUpdate
}) => {
  const [selectedZone, setSelectedZone] = useState(null);
  const [prices, setPrices] = useState({});
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkData, setBulkData] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const textareaRef = useRef(null);

  // 初始化价格数据
  useEffect(() => {
    if (zones.length > 0) {
      const initialPrices = {};
      zones.forEach(zone => {
        initialPrices[zone.id] = zone.priceTable?.prices || DEFAULT_WEIGHT_RANGES.map(range => ({
          ...range,
          price: 0
        }));
      });
      setPrices(initialPrices);
      
      // 默认选择第一个区域
      if (!selectedZone && zones[0]) {
        setSelectedZone(zones[0]);
      }
    }
  }, [zones]);

  // 处理批量导入
  const handleBulkImport = () => {
    try {
      // 支持多种格式：逗号分隔、制表符分隔、换行分隔
      const values = bulkData
        .replace(/[￥$]/g, '') // 移除货币符号
        .split(/[\n\t,;]+/) // 支持多种分隔符
        .map(v => v.trim())
        .filter(v => v !== '')
        .map(v => parseFloat(v));

      if (values.length === 0) {
        setMessage({ type: 'error', text: '没有找到有效的价格数据' });
        return;
      }

      // 如果输入的价格数量与重量区间数量匹配，直接应用
      if (values.length === DEFAULT_WEIGHT_RANGES.length) {
        const updatedPrices = DEFAULT_WEIGHT_RANGES.map((range, index) => ({
          ...range,
          price: values[index] || 0
        }));
        
        setPrices({
          ...prices,
          [selectedZone.id]: updatedPrices
        });
        
        setMessage({ type: 'success', text: '批量导入成功！' });
        setShowBulkImport(false);
        setBulkData('');
      } else {
        setMessage({ 
          type: 'error', 
          text: `价格数量不匹配。需要 ${DEFAULT_WEIGHT_RANGES.length} 个价格，但只找到 ${values.length} 个` 
        });
      }
    } catch (error) {
      console.error('批量导入失败:', error);
      setMessage({ type: 'error', text: '导入格式错误，请检查数据' });
    }
  };

  // 复制价格到剪贴板
  const copyPricesToClipboard = () => {
    if (!selectedZone || !prices[selectedZone.id]) return;
    
    const priceValues = prices[selectedZone.id].map(p => p.price).join('\t');
    navigator.clipboard.writeText(priceValues).then(() => {
      setMessage({ type: 'success', text: '价格已复制到剪贴板' });
    });
  };

  // 从剪贴板粘贴
  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setBulkData(text);
      setMessage({ type: 'success', text: '已从剪贴板粘贴' });
    } catch (error) {
      setMessage({ type: 'error', text: '无法访问剪贴板' });
    }
  };

  // 生成示例数据
  const generateSampleData = () => {
    const samplePrices = [
      15.99, 25.99, 35.99, 45.99, 55.99, 65.99,
      75.99, 85.99, 95.99, 105.99, 115.99, 125.99, 149.99
    ];
    setBulkData(samplePrices.join('\n'));
  };

  // 更新单个价格
  const updatePrice = (zoneId, rangeIndex, value) => {
    const zonePrices = [...(prices[zoneId] || [])];
    zonePrices[rangeIndex] = {
      ...zonePrices[rangeIndex],
      price: parseFloat(value) || 0
    };
    setPrices({
      ...prices,
      [zoneId]: zonePrices
    });
  };

  // 保存价格配置
  const saveAllPrices = async () => {
    setIsSaving(true);
    try {
      // 获取完整的城市数据
      const cityData = await cityStorageService.getCity(cityId);
      
      // 更新每个区域的价格
      const updatedRegions = cityData.regions.map(region => {
        if (prices[region.id]) {
          return {
            ...region,
            priceTable: {
              ...region.priceTable,
              prices: prices[region.id],
              currency: 'CAD',
              updatedAt: new Date().toISOString()
            }
          };
        }
        return region;
      });

      // 保存更新后的城市数据
      const updatedCity = {
        ...cityData,
        regions: updatedRegions
      };

      await cityStorageService.saveCity(updatedCity);
      setMessage({ type: 'success', text: '价格配置已保存' });
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('保存价格失败:', error);
      setMessage({ type: 'error', text: '保存失败，请重试' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            价格配置表
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBulkImport(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
                       transition-colors flex items-center gap-2 text-sm"
            >
              <Upload className="w-4 h-4" />
              批量导入
            </button>
            <button
              onClick={copyPricesToClipboard}
              className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg 
                       transition-colors flex items-center gap-2 text-sm"
            >
              <Copy className="w-4 h-4" />
              复制价格
            </button>
            <button
              onClick={saveAllPrices}
              disabled={isSaving}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 
                       text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>保存中...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>保存</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 区域选择 */}
        {zones.length > 0 && (
          <div className="flex gap-2">
            {zones.map(zone => (
              <button
                key={zone.id}
                onClick={() => setSelectedZone(zone)}
                className={`px-3 py-1.5 rounded-lg transition-colors text-sm ${
                  selectedZone?.id === zone.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {zone.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 消息提示 */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mx-4 mt-4 p-3 rounded-lg flex items-center gap-2 ${
              message.type === 'success' 
                ? 'bg-green-900/30 border border-green-700 text-green-400'
                : 'bg-red-900/30 border border-red-700 text-red-400'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span className="text-sm">{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 价格表格 */}
      {selectedZone && prices[selectedZone.id] && (
        <div className="p-4">
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    重量区间
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    价格 (CAD)
                  </th>
                </tr>
              </thead>
              <tbody>
                {prices[selectedZone.id].map((priceRange, index) => (
                  <tr key={priceRange.id} className="border-b border-gray-700">
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {priceRange.label}
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={priceRange.price}
                          onChange={(e) => updatePrice(selectedZone.id, index, e.target.value)}
                          className="w-full pl-8 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg 
                                   text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 批量导入模态框 */}
      <AnimatePresence>
        {showBulkImport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-2xl w-full"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                批量导入价格
              </h3>

              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">
                  请输入或粘贴13个价格值，可以使用以下分隔符：逗号、制表符、换行
                </p>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={pasteFromClipboard}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm 
                             flex items-center gap-1"
                  >
                    <Clipboard className="w-3 h-3" />
                    粘贴
                  </button>
                  <button
                    onClick={generateSampleData}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm 
                             flex items-center gap-1"
                  >
                    <Grid3x3 className="w-3 h-3" />
                    示例数据
                  </button>
                </div>
                <textarea
                  ref={textareaRef}
                  value={bulkData}
                  onChange={(e) => setBulkData(e.target.value)}
                  className="w-full h-48 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg 
                           text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 
                           focus:border-transparent"
                  placeholder="15.99&#10;25.99&#10;35.99&#10;..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowBulkImport(false);
                    setBulkData('');
                    setMessage(null);
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg 
                           transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleBulkImport}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
                           transition-colors flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  导入
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedTruckPriceTable;