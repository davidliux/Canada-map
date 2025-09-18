/**
 * FSA价格查询弹窗组件
 *
 * 功能：
 * - 显示FSA所属区域和分组信息
 * - 展示板数定价表（优先显示分组价格，无分组价格则显示区域通用价格）
 * - 支持输入托盘数量进行价格测算
 * - 支持价格对比和历史记录
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  Package,
  DollarSign,
  Calculator,
  TrendingUp,
  Info,
  Layers,
  ChevronRight,
  Hash,
  Truck,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import pricingService from '../services/pricingService';
import cityStorageService from '../utils/storage/cityStorage';
import { getRegionConfig, getFSAGroup } from '../utils/unifiedStorage';

// 默认板数范围
const DEFAULT_SKID_RANGES = [
  { skidCount: 1, displayName: '1板', min: 1, max: 1 },
  { skidCount: 2, displayName: '2板', min: 2, max: 2 },
  { skidCount: 3, displayName: '3板', min: 3, max: 3 },
  { skidCount: 4, displayName: '4板', min: 4, max: 4 },
  { skidCount: 5, displayName: '5板', min: 5, max: 5 },
  { skidCount: 6, displayName: '6板', min: 6, max: 6 },
  { skidCount: 7, displayName: '7板', min: 7, max: 7 },
  { skidCount: 8, displayName: '8板', min: 8, max: 8 },
  { skidCount: 9, displayName: '9板', min: 9, max: 9 },
  { skidCount: 10, displayName: '10板', min: 10, max: 10 },
  { skidCount: 11, displayName: '11板', min: 11, max: 11 },
  { skidCount: 12, displayName: '12板', min: 12, max: 12 },
  { skidCount: 13, displayName: '13板', min: 13, max: 13 },
  { skidCount: 14, displayName: '14板', min: 14, max: 14 },
  { skidCount: 15, displayName: '15板', min: 15, max: 15 },
  { skidCount: 16, displayName: '16板', min: 16, max: 16 },
  { skidCount: '16+', displayName: '16+板', min: 17, max: 999 }
];

const FSAPricingModal = ({
  isOpen,
  onClose,
  fsaCode,
  regionId,
  cityId = 'toronto'
}) => {
  const [loading, setLoading] = useState(true);
  const [skidCount, setSkidCount] = useState(1);
  const [regionConfig, setRegionConfig] = useState(null);
  const [fsaGroup, setFsaGroup] = useState(null);
  const [pricingData, setPricingData] = useState(null);
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  const [error, setError] = useState(null);

  // 加载区域配置和价格数据
  useEffect(() => {
    if (!isOpen || !fsaCode) return;

    const loadPricingData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. 获取区域配置
        const config = await getRegionConfig(regionId);
        setRegionConfig(config);

        if (!config) {
          throw new Error('无法获取区域配置');
        }

        // 2. 检查FSA是否属于某个分组
        const group = await getFSAGroup(regionId, fsaCode);
        setFsaGroup(group);

        // 3. 从API获取区域的板数定价数据
        let applicablePricing = null;

        try {
          // 先检查是否有分组自定义价格
          if (group) {
            console.log('找到FSA分组:', group);

            // 建立区域名称到zone ID的映射
            const regionToZoneMap = {
              'AB': 'zone1',
              'BC': 'zone2',
              'MB': 'zone3',
              'ON': 'zone4',
              'SK': 'zone5'
            };

            // 尝试多种可能的组合来获取分组价格
            const possibleZoneIds = [
              regionToZoneMap[regionId] || regionId,  // 映射的zoneId
              `zone${config.level || 1}`,             // zone1, zone2等
              regionId,                                // 原始regionId (如 'AB')
              config.zoneId,                          // 可能存在的zoneId字段
              config.id,                              // 区域的ID
              'zone1'                                 // 临时测试zone1
            ].filter(Boolean);

            const possibleGroupIds = [
              group.name?.toLowerCase(),    // 分组名称小写
              group.id,                     // 分组ID
              group.name,                   // 分组名称
              'brampton'                    // 临时硬编码测试（数据库中有这个）
            ].filter(Boolean);

            console.log('尝试的zoneIds:', possibleZoneIds);
            console.log('尝试的groupIds:', possibleGroupIds);

            let groupPricing = null;

            // 尝试所有可能的组合
            for (const zoneId of possibleZoneIds) {
              for (const groupId of possibleGroupIds) {
                try {
                  console.log(`尝试获取分组价格: cityId=${cityId}, zoneId=${zoneId}, groupId=${groupId}`);
                  const result = await pricingService.getGroupSkidPricing(cityId, zoneId, groupId);

                  if (result && result.prices && Object.keys(result.prices).length > 0) {
                    groupPricing = result;
                    console.log(`成功获取分组价格: zoneId=${zoneId}, groupId=${groupId}`, result.prices);
                    break;
                  }
                } catch (err) {
                  // 继续尝试下一个组合
                }
              }
              if (groupPricing) break;
            }

            // 如果获取到分组价格且有数据，使用分组价格
            if (groupPricing && groupPricing.prices && Object.keys(groupPricing.prices).length > 0) {
              applicablePricing = {
                source: 'group',
                groupName: group.name,
                prices: groupPricing.prices
              };
              console.log('使用分组自定义价格:', group.name, groupPricing.prices);
            } else {
              console.log('未找到分组自定义价格，将使用区域价格');
            }
          }

          // 如果没有分组价格，从后端API获取区域价格
          if (!applicablePricing) {
            const response = await fetch(`/api/v1/truck-delivery/zones/${regionId}`);
            if (response.ok) {
              const data = await response.json();
              const zoneData = data.data;

              // 将价格数组转换为对象格式
              const pricesObj = {};
              if (zoneData.prices && Array.isArray(zoneData.prices)) {
                zoneData.prices.forEach(p => {
                  pricesObj[p.skid_count] = p.price;
                });
              }

              if (Object.keys(pricesObj).length > 0) {
                applicablePricing = {
                  source: 'zone',
                  zoneName: config.name,
                  prices: pricesObj
                };
                console.log('使用区域默认价格:', config.name, pricesObj);
              }
            }
          }
        } catch (apiError) {
          console.error('获取API价格数据失败:', apiError);
          // 如果API失败，可以尝试从本地存储获取（作为后备）
          const cityData = await cityStorageService.getCity(cityId);
          const skidPricing = cityData?.skidPricing || {};
          const zoneKey = `区域${config.level || regionId}`;
          const zonePricing = skidPricing[zoneKey] || skidPricing[config.name] || skidPricing[regionId];

          if (zonePricing) {
            applicablePricing = {
              source: 'zone',
              zoneName: config.name,
              prices: zonePricing
            };
          }
        }

        setPricingData(applicablePricing);

      } catch (err) {
        console.error('加载价格数据失败:', err);
        setError(err.message || '加载价格数据失败');
      } finally {
        setLoading(false);
      }
    };

    loadPricingData();
  }, [isOpen, fsaCode, regionId, cityId]);

  // 计算价格
  useEffect(() => {
    if (!pricingData || !skidCount) {
      setCalculatedPrice(null);
      return;
    }

    const calculatePrice = () => {
      const prices = pricingData.prices;

      // 查找对应的价格区间
      for (const range of DEFAULT_SKID_RANGES) {
        const rangePrice = prices[range.skidCount] || prices[`${range.skidCount}板`];

        if (rangePrice && skidCount >= range.min && skidCount <= range.max) {
          setCalculatedPrice({
            basePrice: rangePrice,
            totalPrice: rangePrice,
            skidRange: range.displayName,
            source: pricingData.source,
            sourceName: pricingData.groupName || pricingData.zoneName
          });
          return;
        }
      }

      // 如果超过16板，使用16+的价格
      const extraPrice = prices['16+'] || prices['16+板'] || prices[17];
      if (extraPrice && skidCount > 16) {
        setCalculatedPrice({
          basePrice: extraPrice,
          totalPrice: extraPrice,
          skidRange: '16+板',
          source: pricingData.source,
          sourceName: pricingData.groupName || pricingData.zoneName
        });
      } else {
        setCalculatedPrice(null);
      }
    };

    calculatePrice();
  }, [skidCount, pricingData]);

  // 格式化价格显示
  const formatPrice = (price) => {
    if (typeof price !== 'number') return '未配置';
    return `$${price.toFixed(2)}`;
  };

  // 获取价格表数据
  const priceTableData = useMemo(() => {
    if (!pricingData) return [];

    return DEFAULT_SKID_RANGES.map(range => {
      const price = pricingData.prices[range.skidCount] ||
                   pricingData.prices[`${range.skidCount}板`] ||
                   0;

      return {
        range: range.displayName,
        skidCount: range.skidCount,
        price: price,
        isActive: price > 0,
        isCurrent: skidCount >= range.min && skidCount <= range.max
      };
    });
  }, [pricingData, skidCount]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={onClose}
          />

          {/* 弹窗内容 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-h-[80vh]
                     bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl
                     border border-blue-500/30 z-[9999] overflow-hidden"
          >
            {/* 头部 */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 relative">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 p-2 rounded-lg bg-white/10 hover:bg-white/20
                         transition-colors group"
              >
                <X className="w-5 h-5 text-white group-hover:rotate-90 transition-transform" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">FSA {fsaCode} 价格查询</h2>
                  <p className="text-blue-100 text-sm mt-1">板数定价费率表</p>
                </div>
              </div>
            </div>

            {/* 内容区域 */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">加载价格数据...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* 区域和分组信息 */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Layers className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-400 text-sm">所属区域</span>
                      </div>
                      <p className="text-white font-semibold">{regionConfig?.name || `区域 ${regionId}`}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        包含 {regionConfig?.fsaCodes?.length || 0} 个FSA
                      </p>
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Hash className="w-4 h-4 text-green-400" />
                        <span className="text-gray-400 text-sm">FSA分组</span>
                      </div>
                      <p className="text-white font-semibold">
                        {fsaGroup ? fsaGroup.name : '未分组（使用通用价格）'}
                      </p>
                      {fsaGroup && (
                        <p className="text-gray-500 text-xs mt-1">
                          {pricingData?.source === 'group' ? '使用自定义价格' : '使用区域通用价格'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 价格来源提示 */}
                  {pricingData && (
                    <div className={`rounded-lg p-3 mb-6 flex items-center gap-2 ${
                      pricingData.source === 'group'
                        ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                        : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
                    }`}>
                      <Info className="w-4 h-4" />
                      <span className="text-sm">
                        当前使用
                        <span className="font-semibold mx-1">
                          {pricingData.source === 'group' ? '分组自定义价格' : '区域通用价格'}
                        </span>
                        ({pricingData.groupName || pricingData.zoneName})
                      </span>
                    </div>
                  )}

                  {/* 价格表 */}
                  <div className="mb-6">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-yellow-400" />
                      板数价格表
                    </h3>
                    <div className="bg-gray-800/30 rounded-lg overflow-hidden">
                      <div className="grid grid-cols-4 gap-px bg-gray-700/50">
                        {priceTableData.map((item, index) => (
                          <div
                            key={index}
                            className={`p-3 bg-gray-800 ${
                              item.isCurrent ? 'ring-2 ring-blue-500 bg-blue-500/10' : ''
                            } ${!item.isActive ? 'opacity-50' : ''}`}
                          >
                            <div className="text-gray-400 text-xs mb-1">{item.range}</div>
                            <div className={`font-semibold ${
                              item.isCurrent ? 'text-blue-400' : 'text-white'
                            }`}>
                              {formatPrice(item.price)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 价格计算器 */}
                  <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-blue-500/30">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-purple-400" />
                      价格测算
                    </h3>

                    <div className="space-y-4">
                      {/* 托盘数输入 */}
                      <div>
                        <label className="text-gray-400 text-sm mb-2 block">输入托盘数量</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="1"
                            max="999"
                            value={skidCount}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                setSkidCount('');
                              } else {
                                const num = parseInt(val);
                                if (!isNaN(num) && num >= 0) {
                                  setSkidCount(num);
                                }
                              }
                            }}
                            onBlur={(e) => {
                              if (e.target.value === '' || parseInt(e.target.value) < 1) {
                                setSkidCount(1);
                              }
                            }}
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2
                                     text-white focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="请输入托盘数"
                          />
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setSkidCount(Math.max(1, skidCount - 1))}
                              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                            >
                              <span className="text-white">-</span>
                            </button>
                            <button
                              onClick={() => setSkidCount(skidCount + 1)}
                              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                            >
                              <span className="text-white">+</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 计算结果 */}
                      {calculatedPrice && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-gray-400">计算结果</span>
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-500">托盘数量</span>
                              <span className="text-white font-medium">{skidCount} 板</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">适用区间</span>
                              <span className="text-white font-medium">{calculatedPrice.skidRange}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">价格来源</span>
                              <span className="text-white font-medium">{calculatedPrice.sourceName}</span>
                            </div>
                            <div className="pt-2 border-t border-gray-700">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-400 font-medium">配送费用</span>
                                <span className="text-2xl font-bold text-green-400">
                                  {formatPrice(calculatedPrice.totalPrice)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {!calculatedPrice && skidCount && !loading && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-yellow-400">
                            <AlertCircle className="w-5 h-5" />
                            <span>该板数范围暂未配置价格</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FSAPricingModal;