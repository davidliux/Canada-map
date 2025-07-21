import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calculator, Package, DollarSign, MapPin } from 'lucide-react';
import { getAllRegionConfigs } from '../utils/unifiedStorage.js';
import { getRegionByFSA, getRegionDisplayInfo } from '../data/regionManagement.js';

/**
 * 固定位置的报价单面板组件
 * 解决弹窗重叠问题，统一在地图右侧显示
 */
const FixedQuotationPanel = ({ selectedFSA, onClose }) => {
  const [quotationData, setQuotationData] = useState(null);
  const [customWeight, setCustomWeight] = useState('');
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  const [selectedRange, setSelectedRange] = useState(null);

  // ESC键关闭功能
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && selectedFSA) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [selectedFSA, onClose]);

  // 生成报价数据
  useEffect(() => {
    if (!selectedFSA) {
      setQuotationData(null);
      return;
    }

    try {
      const { fsaCode, province, region } = selectedFSA;
      
      // 查找FSA属于哪个区域
      const assignedRegionId = getRegionByFSA(fsaCode);
      
      if (!assignedRegionId) {
        setQuotationData({
          type: 'unavailable',
          fsaCode,
          province,
          region
        });
        return;
      }

      // 获取区域配置
      const regionConfigs = getAllRegionConfigs();
      const regionConfig = regionConfigs[assignedRegionId];
      const regionInfo = getRegionDisplayInfo(assignedRegionId);

      if (!regionConfig || !regionConfig.isActive) {
        setQuotationData({
          type: 'basic',
          fsaCode,
          province,
          region,
          regionInfo,
          regionId: assignedRegionId
        });
        return;
      }

      setQuotationData({
        type: 'available',
        fsaCode,
        province,
        region,
        regionInfo,
        regionConfig
      });

    } catch (error) {
      console.error('生成报价数据失败:', error);
      setQuotationData({
        type: 'error',
        fsaCode: selectedFSA.fsaCode,
        province: selectedFSA.province,
        region: selectedFSA.region
      });
    }
  }, [selectedFSA]);

  // 计算自定义重量价格
  const handleWeightChange = (value) => {
    setCustomWeight(value);
    
    if (!value.trim() || !quotationData || quotationData.type !== 'available') {
      setCalculatedPrice(null);
      setSelectedRange(null);
      return;
    }

    const weightNum = parseFloat(value);
    if (isNaN(weightNum) || weightNum <= 0) {
      setCalculatedPrice(null);
      setSelectedRange(null);
      return;
    }

    // 找到匹配的重量区间
    const matchingRange = quotationData.regionConfig.weightRanges
      .filter(range => range.isActive)
      .find(range => weightNum >= range.min && weightNum <= range.max);

    if (matchingRange) {
      setCalculatedPrice(matchingRange.price);
      setSelectedRange(matchingRange);
    } else {
      setCalculatedPrice(null);
      setSelectedRange(null);
    }
  };

  // 获取前3个活跃的重量区间
  const getTopThreeRanges = () => {
    if (!quotationData || quotationData.type !== 'available') return [];
    
    return quotationData.regionConfig.weightRanges
      .filter(range => range.isActive)
      .sort((a, b) => a.min - b.min)
      .slice(0, 3);
  };

  if (!selectedFSA) return null;

  const topRanges = getTopThreeRanges();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed z-[2000] max-h-[calc(100vh-2rem)] overflow-y-auto
                   top-4 right-4 w-80 max-w-[calc(100vw-2rem)]
                   sm:w-96 sm:max-w-none
                   md:w-96 md:right-4
                   lg:w-96"
      >
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-blue-500/30 rounded-xl shadow-2xl">
          {/* 标题栏 */}
          <div className="flex items-center justify-between p-4 border-b border-blue-500/20">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="text-white font-bold text-lg">{quotationData?.fsaCode}</h3>
                <p className="text-blue-300 text-sm">{quotationData?.province} • {quotationData?.region}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* 内容区域 */}
          <div className="p-4 space-y-4">
            {/* 可配送区域 */}
            {quotationData?.type === 'available' && (
              <>
                {/* 区域信息 */}
                <div 
                  className="p-3 rounded-lg border"
                  style={{ 
                    background: `linear-gradient(135deg, ${quotationData.regionInfo.color}20, ${quotationData.regionInfo.color}10)`,
                    borderColor: `${quotationData.regionInfo.color}40`
                  }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: quotationData.regionInfo.color }}
                    ></div>
                    <span className="text-white font-semibold">{quotationData.regionInfo.name}</span>
                  </div>
                </div>

                {/* 常用价格 */}
                {topRanges.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="w-4 h-4 text-blue-400" />
                      <h4 className="text-white font-medium">常用重量区间</h4>
                      {quotationData.regionConfig.weightRanges.filter(r => r.isActive).length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{quotationData.regionConfig.weightRanges.filter(r => r.isActive).length - 3} 更多
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {topRanges.map((range, index) => (
                        <div
                          key={range.id || index}
                          className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
                        >
                          <span className="text-gray-300 text-sm">{range.label}</span>
                          <span className="text-green-400 font-semibold">
                            ${range.price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 自定义重量查询 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="w-4 h-4 text-green-400" />
                    <h4 className="text-white font-medium">自定义重量查询</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="number"
                        value={customWeight}
                        onChange={(e) => handleWeightChange(e.target.value)}
                        placeholder="输入包裹重量"
                        min="0"
                        step="0.1"
                        className="w-full px-3 py-2 bg-gray-800/70 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
                      />
                      <span className="absolute right-3 top-2 text-gray-400 text-sm">KG</span>
                    </div>
                    
                    {/* 计算结果 */}
                    {customWeight && (
                      <div className="p-3 bg-gradient-to-r from-blue-900/30 to-green-900/30 border border-blue-500/30 rounded-lg">
                        {calculatedPrice !== null ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-blue-300 text-sm">计算结果:</span>
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4 text-green-400" />
                                <span className="text-green-400 font-bold text-lg">
                                  {calculatedPrice.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            
                            {selectedRange && (
                              <div className="text-xs text-gray-300">
                                <span className="text-gray-400">适用区间:</span> {selectedRange.label}
                              </div>
                            )}
                            
                            <div className="text-xs text-gray-400">
                              重量: {customWeight} KG • FSA: {quotationData.fsaCode}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <span className="text-yellow-400 text-sm">⚠️ 超出配送重量范围</span>
                            <p className="text-xs text-gray-400 mt-1">请联系客服获取报价</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => window.openFSAManagement?.(quotationData.fsaCode, quotationData.province, quotationData.region)}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all"
                  >
                    🔧 管理配置
                  </button>
                  <button
                    onClick={() => window.printQuotation?.(quotationData.fsaCode)}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all"
                  >
                    📄 打印报价单
                  </button>
                </div>
              </>
            )}

            {/* 基础可配送区域 */}
            {quotationData?.type === 'basic' && (
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-green-900/30 to-green-800/30 border border-green-500/30 rounded-lg text-center">
                  <div className="text-2xl mb-2">✅</div>
                  <h4 className="text-green-400 font-semibold mb-2">可配送区域</h4>
                  <p className="text-green-300 text-sm">配送区域: {quotationData.regionInfo?.name}</p>
                </div>
                
                <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg text-center">
                  <div className="text-lg mb-2">⚙️</div>
                  <p className="text-blue-300 text-sm">价格配置待完善</p>
                  <p className="text-gray-400 text-xs mt-1">请联系客服获取具体价格</p>
                </div>

                <button
                  onClick={() => window.openFSAManagement?.(quotationData.fsaCode, quotationData.province, quotationData.region)}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                  🔧 配置价格
                </button>
              </div>
            )}

            {/* 不可配送区域 */}
            {quotationData?.type === 'unavailable' && (
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-red-900/30 to-red-800/30 border border-red-500/30 rounded-lg text-center">
                  <div className="text-3xl mb-2">⚠️</div>
                  <h4 className="text-red-400 font-semibold mb-2">暂不支持配送</h4>
                  <p className="text-red-300 text-sm">此区域尚未分配到任何配送区域</p>
                </div>
                
                <div className="p-3 bg-blue-900/20 border border-blue-500/20 rounded-lg text-center">
                  <p className="text-blue-300 text-sm font-medium mb-1">需要配送服务？</p>
                  <p className="text-gray-400 text-xs">请联系客服了解更多信息</p>
                </div>

                <button
                  onClick={() => window.openFSAManagement?.(quotationData.fsaCode, quotationData.province, quotationData.region)}
                  className="w-full px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg font-medium hover:from-gray-700 hover:to-gray-800 transition-all"
                >
                  🔧 配置此区域
                </button>
              </div>
            )}

            {/* 错误状态 */}
            {quotationData?.type === 'error' && (
              <div className="space-y-4">
                <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg text-center">
                  <div className="text-3xl mb-2">❌</div>
                  <p className="text-red-400 text-sm">加载报价信息失败</p>
                </div>
                
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg font-medium hover:from-gray-700 hover:to-gray-800 transition-all"
                >
                  🔄 重新加载
                </button>
              </div>
            )}

            {/* 底部信息 */}
            <div className="pt-3 border-t border-gray-700/50 text-center">
              <p className="text-xs text-gray-400">
                最后更新: {quotationData?.regionConfig ? new Date(quotationData.regionConfig.lastUpdated).toLocaleDateString() : '未知'}
              </p>
              <p className="text-xs text-gray-500 mt-1">价格仅供参考，最终价格以实际报价为准</p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FixedQuotationPanel;
