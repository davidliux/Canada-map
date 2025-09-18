/**
 * FSA选择器组件
 * 
 * 用于在创建或编辑区域时选择FSA代码的组件，包含：
 * - FSA多选复选框
 * - 搜索和过滤功能
 * - FSA冲突检测和提示
 * - 按省份分组显示
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, AlertTriangle, Check, X, Filter, MapPin, FileText, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { completeFSAData, getFSAsByProvince } from '../../data/canadaFSAData.js';
import { cityStorageService } from '../../utils/storage/cityStorage.js';

/**
 * FSA选择器组件
 * @param {Object} props - 组件属性
 * @param {string[]} props.selectedFSAs - 当前选中的FSA列表
 * @param {function} props.onSelectionChange - 选择变化回调
 * @param {string} [props.currentCityId] - 当前城市ID（用于冲突检测）
 * @param {string} [props.currentRegionId] - 当前区域ID（用于冲突检测）
 * @param {string} [props.className] - 自定义样式类
 */
const FSASelector = ({
  selectedFSAs = [],
  onSelectionChange,
  currentCityId = null,
  currentRegionId = null,
  usedFSAs = [], // 其他区域已使用的FSA
  className = ''
}) => {
  // 状态管理
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [fsaConflicts, setFsaConflicts] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [expandedProvinces, setExpandedProvinces] = useState(new Set(['ON'])); // 默认展开安省
  const [batchInput, setBatchInput] = useState(''); // 批量输入
  const [showBatchInput, setShowBatchInput] = useState(true); // 默认显示批量输入

  // 使用完整的FSA数据
  const allFSAs = useMemo(() => getAllFSACodes(), []);

  // 获取按省份分组的FSA数据（使用完整数据）
  const fsasByProvince = useMemo(() => {
    const grouped = {};
    completeFSAData.forEach(item => {
      if (!grouped[item.province]) {
        grouped[item.province] = [];
      }
      grouped[item.province].push(item.fsa);
    });
    return grouped;
  }, []);

  // 省份选项（使用完整数据）
  const provinceOptions = useMemo(() => [
    { value: 'all', label: '所有省份', count: allFSAs.length },
    { value: 'ON', label: '安大略省 (Ontario)', count: fsasByProvince.ON?.length || 0 },
    { value: 'QC', label: '魁北克省 (Quebec)', count: fsasByProvince.QC?.length || 0 },
    { value: 'BC', label: '不列颠哥伦比亚省 (BC)', count: fsasByProvince.BC?.length || 0 },
    { value: 'AB', label: '阿尔伯塔省 (Alberta)', count: fsasByProvince.AB?.length || 0 },
    { value: 'MB', label: '马尼托巴省 (Manitoba)', count: fsasByProvince.MB?.length || 0 },
    { value: 'SK', label: '萨斯喀彻温省 (Saskatchewan)', count: fsasByProvince.SK?.length || 0 },
    { value: 'NS', label: '新斯科舍省 (Nova Scotia)', count: fsasByProvince.NS?.length || 0 },
    { value: 'NB', label: '新不伦瑞克省 (New Brunswick)', count: fsasByProvince.NB?.length || 0 },
    { value: 'NL', label: '纽芬兰与拉布拉多省 (NL)', count: fsasByProvince.NL?.length || 0 },
    { value: 'PE', label: '爱德华王子岛省 (PEI)', count: fsasByProvince.PE?.length || 0 },
    { value: 'NT', label: '西北地区 (NT)', count: fsasByProvince.NT?.length || 0 },
    { value: 'YT', label: '育空地区 (Yukon)', count: fsasByProvince.YT?.length || 0 },
    { value: 'NU', label: '努纳武特地区 (Nunavut)', count: fsasByProvince.NU?.length || 0 }
  ].filter(option => option.count > 0), [fsasByProvince, allFSAs]);

  // 检测FSA冲突
  const checkFSAConflicts = useCallback(async () => {
    if (!selectedFSAs.length) {
      setFsaConflicts({});
      return;
    }

    setIsLoading(true);
    try {
      const conflicts = {};
      
      // 检查每个选中的FSA是否已被其他城市使用
      for (const fsa of selectedFSAs) {
        const cityId = cityStorageService.getCityByFSA(fsa);
        if (cityId && cityId !== currentCityId) {
          const city = await cityStorageService.getCity(cityId);
          if (city) {
            conflicts[fsa] = {
              cityId,
              cityName: city.name,
              province: city.province
            };
          }
        }
      }

      setFsaConflicts(conflicts);
    } catch (error) {
      console.error('检测FSA冲突失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFSAs, currentCityId]);

  // 当选中的FSA变化时检测冲突
  useEffect(() => {
    checkFSAConflicts();
  }, [checkFSAConflicts]);

  // 过滤FSA列表（使用完整的FSA数据）
  const filteredFSAs = useMemo(() => {
    let fsasToShow = [];

    // 按省份筛选
    if (selectedProvince === 'all') {
      fsasToShow = allFSAs;
    } else {
      fsasToShow = fsasByProvince[selectedProvince] || [];
    }

    // 按搜索词筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      fsasToShow = fsasToShow.filter(fsa =>
        fsa.toLowerCase().includes(query)
      );
    }

    return fsasToShow.sort();
  }, [selectedProvince, searchQuery, fsasByProvince, allFSAs]);

  // 按省份分组显示的FSA列表（使用完整数据的省份信息）
  const groupedFSAs = useMemo(() => {
    if (selectedProvince !== 'all') {
      return { [selectedProvince]: filteredFSAs };
    }

    const grouped = {};
    filteredFSAs.forEach(fsa => {
      // 从完整数据中获取FSA的省份信息
      const fsaInfo = completeFSAData.find(item => item.fsa === fsa);
      const province = fsaInfo ? fsaInfo.province : 'Unknown';

      if (!grouped[province]) {
        grouped[province] = [];
      }
      grouped[province].push(fsa);
    });

    return grouped;
  }, [filteredFSAs, selectedProvince]);

  // 处理FSA选择
  const handleFSAToggle = useCallback((fsa) => {
    const newSelection = selectedFSAs.includes(fsa)
      ? selectedFSAs.filter(f => f !== fsa)
      : [...selectedFSAs, fsa];
    
    onSelectionChange(newSelection);
  }, [selectedFSAs, onSelectionChange]);

  // 处理全选/取消全选
  const handleSelectAll = useCallback((fsaList) => {
    const allSelected = fsaList.every(fsa => selectedFSAs.includes(fsa));
    
    if (allSelected) {
      // 取消选择这些FSA
      const newSelection = selectedFSAs.filter(fsa => !fsaList.includes(fsa));
      onSelectionChange(newSelection);
    } else {
      // 选择这些FSA
      const newSelection = [...new Set([...selectedFSAs, ...fsaList])];
      onSelectionChange(newSelection);
    }
  }, [selectedFSAs, onSelectionChange]);

  // 切换省份展开状态
  const toggleProvinceExpand = useCallback((province) => {
    setExpandedProvinces(prev => {
      const newSet = new Set(prev);
      if (newSet.has(province)) {
        newSet.delete(province);
      } else {
        newSet.add(province);
      }
      return newSet;
    });
  }, []);

  // 获取省份显示名称
  const getProvinceName = (code) => {
    const names = {
      'ON': '安大略省',
      'QC': '魁北克省',
      'BC': '不列颠哥伦比亚省',
      'AB': '阿尔伯塔省',
      'MB': '马尼托巴省',
      'SK': '萨斯喀彻温省',
      'NS': '新斯科舍省',
      'NB': '新不伦瑞克省',
      'NL': '纽芬兰省',
      'PE': '爱德华王子岛省',
      'YT': '育空地区',
      'NT': '西北地区',
      'NU': '努纳武特地区'
    };
    return names[code] || code;
  };

  // 处理批量输入
  const handleBatchInput = useCallback(() => {
    if (!batchInput.trim()) {
      alert('请输入FSA代码');
      return;
    }

    // 解析输入的FSA列表（支持逗号、空格、分号分隔）
    const inputFSAs = batchInput
      .toUpperCase()
      .split(/[,，;；\s\n]+/) // 支持中英文逗号、分号、空格、换行
      .map(fsa => fsa.trim())
      .filter(fsa => fsa.length > 0);

    // 验证FSA格式（加拿大FSA格式：字母-数字-字母）
    const validFSAs = [];
    const invalidFSAs = [];
    const fsaPattern = /^[A-Z]\d[A-Z]$/;

    inputFSAs.forEach(fsa => {
      if (fsaPattern.test(fsa)) {
        // 检查是否在可用的FSA列表中
        if (completeFSAData.includes(fsa)) {
          validFSAs.push(fsa);
        } else {
          invalidFSAs.push(`${fsa} (不在配送范围内)`);
        }
      } else {
        invalidFSAs.push(`${fsa} (格式错误)`);
      }
    });

    // 显示验证结果
    if (invalidFSAs.length > 0) {
      alert(`以下FSA代码无效：\n${invalidFSAs.join('\n')}`);
    }

    if (validFSAs.length > 0) {
      // 合并现有选择和新的FSA
      const newSelection = [...new Set([...selectedFSAs, ...validFSAs])];
      onSelectionChange(newSelection);

      // 清空输入框
      setBatchInput('');
      setShowBatchInput(false);

      // 提示成功
      const addedCount = newSelection.length - selectedFSAs.length;
      if (addedCount > 0) {
        console.log(`成功添加 ${addedCount} 个FSA代码`);
      }
    }
  }, [batchInput, selectedFSAs, onSelectionChange]);

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 ${className}`}>
      {/* 头部控制区域 */}
      <div className="p-4 border-b border-gray-700">
        {/* 批量输入/单选切换按钮 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBatchInput(true)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                showBatchInput
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-1" />
              批量输入
            </button>
            <button
              onClick={() => setShowBatchInput(false)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                !showBatchInput
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Check className="w-4 h-4 inline mr-1" />
              单个选择
            </button>
          </div>
        </div>

        {/* 批量输入界面 */}
        {showBatchInput ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                批量输入FSA代码（支持逗号、空格、换行分隔）
              </label>
              <textarea
                value={batchInput}
                onChange={(e) => setBatchInput(e.target.value)}
                placeholder="例如：M5V, M5G, M5H 或 M5V M5G M5H 或每行一个"
                className="w-full h-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  text-white placeholder-gray-400 font-mono resize-none"
              />
              <div className="mt-2 text-xs text-gray-400">
                提示：可以直接粘贴从Excel或其他地方复制的FSA列表
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleBatchInput}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Copy className="w-4 h-4 inline mr-2" />
                添加到选择
              </button>
              <button
                onClick={() => {
                  setBatchInput('');
                  setShowBatchInput(false);
                }}
                className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-md transition-colors"
              >
                取消
              </button>
              <span className="text-sm text-gray-400">
                已选择 {selectedFSAs.length} 个FSA
              </span>
            </div>
          </div>
        ) : (
          // 原有的搜索界面
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                搜索FSA代码
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="输入FSA代码，如 M5V"
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    text-white placeholder-gray-400"
                />
              </div>
            </div>

            <div className="min-w-48">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                省份筛选
              </label>
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  text-white"
              >
                {provinceOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* 选择状态提示 - 只在单选模式显示 */}
        {!showBatchInput && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-400">
              已选择 {selectedFSAs.length} 个FSA
              {Object.keys(fsaConflicts).length > 0 && (
                <span className="ml-2 text-red-600 dark:text-red-400">
                  （{Object.keys(fsaConflicts).length} 个冲突）
                </span>
              )}
            </div>

            {filteredFSAs.length > 0 && (
              <button
                onClick={() => handleSelectAll(filteredFSAs)}
                className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
              >
                {filteredFSAs.every(fsa => selectedFSAs.includes(fsa)) ? '取消全选' : '全选'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* FSA列表区域 - 只在单选模式显示 */}
      {!showBatchInput && (
        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">检测冲突中...</p>
          </div>
        ) : filteredFSAs.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>没有找到匹配的FSA代码</p>
            {searchQuery && (
              <p className="text-sm mt-2">
                尝试搜索其他关键词，如 "M5V" 或 "V6B"
              </p>
            )}
          </div>
        ) : (
          <div className="p-4">
            {Object.entries(groupedFSAs).map(([province, fsaList]) => (
              <div key={province} className="mb-6 last:mb-0">
                {/* 省份标题 */}
                <div 
                  className="flex items-center justify-between py-2 mb-3 cursor-pointer
                    hover:bg-gray-700 rounded-md px-2 transition-colors"
                  onClick={() => toggleProvinceExpand(province)}
                >
                  <h4 className="text-sm font-medium text-gray-300">
                    {getProvinceName(province)} ({fsaList.length})
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectAll(fsaList);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-500 transition-colors"
                    >
                      {fsaList.every(fsa => selectedFSAs.includes(fsa)) ? '取消' : '全选'}
                    </button>
                    <motion.div
                      animate={{ rotate: expandedProvinces.has(province) ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Filter className="w-4 h-4 text-gray-400" />
                    </motion.div>
                  </div>
                </div>

                {/* FSA网格 */}
                <AnimatePresence>
                  {expandedProvinces.has(province) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2"
                    >
                      {fsaList.map((fsa) => {
                        const isSelected = selectedFSAs.includes(fsa);
                        const hasConflict = fsaConflicts[fsa];
                        const isUsedInOtherRegion = usedFSAs.includes(fsa);
                        const isDisabled = isUsedInOtherRegion && !isSelected;

                        return (
                          <motion.div
                            key={fsa}
                            whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                            whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                            className={`
                              relative p-2 border rounded-md transition-all duration-200
                              ${isDisabled
                                ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                                : isSelected
                                  ? hasConflict
                                    ? 'bg-red-900/30 border-red-700 text-red-300 cursor-pointer'
                                    : 'bg-blue-900/30 border-blue-700 text-blue-300 cursor-pointer'
                                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500 cursor-pointer'
                              }
                            `}
                            onClick={() => !isDisabled && handleFSAToggle(fsa)}
                            title={
                              isDisabled 
                                ? `已被其他区域使用` 
                                : hasConflict 
                                  ? `冲突：已被${hasConflict.cityName}使用` 
                                  : fsa
                            }
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-mono font-medium">{fsa}</span>
                              <div className="flex items-center">
                                {(hasConflict || isDisabled) && (
                                  <AlertTriangle className="w-3 h-3 text-red-500 mr-1" />
                                )}
                                {isSelected ? (
                                  <Check className="w-4 h-4 text-current" />
                                ) : isDisabled ? (
                                  <X className="w-4 h-4 text-gray-500" />
                                ) : (
                                  <div className="w-4 h-4 border border-current rounded opacity-50" />
                                )}
                              </div>
                            </div>
                            
                            {/* 冲突提示 */}
                            {hasConflict && (
                              <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                                {hasConflict.cityName}
                              </div>
                            )}
                            {isDisabled && (
                              <div className="mt-1 text-xs text-gray-500">
                                已使用
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
        </div>
      )}

      {/* 冲突汇总 */}
      {Object.keys(fsaConflicts).length > 0 && (
        <div className="p-4 border-t border-gray-700 bg-red-900/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-400 mb-2">
                FSA冲突警告
              </h4>
              <div className="text-xs text-red-400 space-y-1">
                {Object.entries(fsaConflicts).map(([fsa, conflict]) => (
                  <div key={fsa}>
                    <span className="font-mono font-medium">{fsa}</span> 已被 
                    <span className="font-medium"> {conflict.cityName}</span> 使用
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FSASelector;