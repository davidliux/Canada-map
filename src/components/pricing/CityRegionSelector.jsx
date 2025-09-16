/**
 * 城市区域选择器组件
 * 
 * 提供城市和区域选择的交互界面，支持：
 * - 城市选择下拉框
 * - 区域选择网格布局
 * - 实时数据加载和状态管理
 * - 响应式设计和动效支持
 * 
 * Story 6 - City-region selection UI
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle,
  Building2,
  Hash,
  Package,
  RefreshCw,
  Search,
  Filter,
  Square,
  CheckSquare,
  Copy,
  Trash2,
  Edit3
} from 'lucide-react';
import cityStorageService from '../../utils/storage/cityStorage.js';
import { getCityStats, getRegionStats, generateRegionColor } from '../../types/truckDelivery.js';

/**
 * 城市区域选择器组件
 * @param {Object} props - 组件属性
 * @param {string} [props.selectedCityId] - 选中的城市ID
 * @param {string|string[]} [props.selectedRegionId] - 选中的区域ID（单选或多选）
 * @param {function} props.onCitySelect - 城市选择回调
 * @param {function} props.onRegionSelect - 区域选择回调
 * @param {boolean} [props.allowEmpty=false] - 是否允许空选择
 * @param {boolean} [props.multiSelect=false] - 是否允许多选区域
 * @param {boolean} [props.showBatchOperations=false] - 是否显示批量操作
 * @param {function} [props.onBatchOperation] - 批量操作回调
 * @param {string} [props.className] - 自定义样式类
 */
const CityRegionSelector = ({
  selectedCityId,
  selectedRegionId,
  onCitySelect,
  onRegionSelect,
  allowEmpty = false,
  multiSelect = false,
  showBatchOperations = false,
  onBatchOperation,
  className = ''
}) => {
  // 状态管理
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingCityData, setLoadingCityData] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  
  // 多选相关状态
  const [selectedRegionIds, setSelectedRegionIds] = useState(new Set());
  const [selectAllMode, setSelectAllMode] = useState(false);

  // 计算过滤后的城市列表
  const filteredCities = useMemo(() => {
    if (!cities || cities.length === 0) {
      return [];
    }
    
    return cities.filter(city => {
      const cityName = city.name || '';
      const cityProvince = city.province || '';
      
      const matchesSearch = searchTerm === '' || 
                          cityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cityProvince.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = !showOnlyActive || city.isActive !== false;
      
      return matchesSearch && matchesFilter;
    });
  }, [cities, searchTerm, showOnlyActive]);

  // 获取选中区域的统计信息
  const selectedRegionStats = useMemo(() => {
    if (!selectedCity) return null;
    
    if (multiSelect) {
      // 多选模式下计算所有选中区域的统计
      const selectedRegions = selectedCity.regions?.filter(r => selectedRegionIds.has(r.id)) || [];
      if (selectedRegions.length === 0) return null;
      
      return selectedRegions.reduce((acc, region) => {
        const stats = getRegionStats(region);
        return {
          fsaCount: acc.fsaCount + stats.fsaCount,
          activePriceRanges: acc.activePriceRanges + stats.activePriceRanges,
          regionCount: acc.regionCount + 1
        };
      }, { fsaCount: 0, activePriceRanges: 0, regionCount: 0 });
    } else {
      // 单选模式
      if (!selectedRegionId) return null;
      const region = selectedCity.regions?.find(r => r.id === selectedRegionId);
      return region ? getRegionStats(region) : null;
    }
  }, [selectedCity, selectedRegionId, selectedRegionIds, multiSelect]);

  // 加载城市列表
  const loadCities = useCallback(async () => {
    setLoadingCities(true);
    setError(null);
    
    try {
      console.log('CityRegionSelector - 开始加载城市列表...');
      const cityList = await cityStorageService.getAllCities();
      console.log('CityRegionSelector - 收到城市数据:', cityList);
      
      // 调试：详细打印第一个城市的数据结构
      if (cityList && cityList.length > 0) {
        console.log('CityRegionSelector - 第一个城市详情:', {
          ...cityList[0],
          regions: cityList[0].regions
        });
        console.log('CityRegionSelector - getCityStats结果:', getCityStats(cityList[0]));
      }
      
      if (!cityList || cityList.length === 0) {
        console.warn('CityRegionSelector - 城市列表为空');
        setCities([]);
      } else {
        setCities(cityList);
        console.log(`CityRegionSelector - 成功加载 ${cityList.length} 个城市`);
      }
    } catch (err) {
      console.error('CityRegionSelector - 加载城市列表失败:', err);
      setError('加载城市列表失败，请重试');
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  }, []);

  // 加载选中城市的完整数据
  const loadSelectedCityData = useCallback(async (cityId) => {
    if (!cityId) {
      setSelectedCity(null);
      return;
    }

    setLoadingCityData(true);
    setError(null);

    try {
      console.log(`加载城市数据: ${cityId}`);
      const cityData = await cityStorageService.getCity(cityId);
      if (cityData) {
        setSelectedCity(cityData);
        console.log(`城市数据加载完成: ${cityData.name}`);
      } else {
        setError('城市数据加载失败');
        setSelectedCity(null);
      }
    } catch (err) {
      console.error('加载城市数据失败:', err);
      setError('加载城市数据失败，请重试');
      setSelectedCity(null);
    } finally {
      setLoadingCityData(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadCities();
  }, [loadCities]);

  // 当选中的城市ID变化时，加载城市数据
  useEffect(() => {
    if (selectedCityId) {
      loadSelectedCityData(selectedCityId);
    } else {
      setSelectedCity(null);
    }
  }, [selectedCityId, loadSelectedCityData]);

  // 处理城市选择
  const handleCitySelect = useCallback((cityId) => {
    console.log('选择城市:', cityId);
    
    // 如果选择同一个城市，不做处理
    if (cityId === selectedCityId) return;

    // 清空区域选择
    if (onRegionSelect) {
      onRegionSelect(null);
    }

    // 通知父组件
    if (onCitySelect) {
      onCitySelect(cityId);
    }
  }, [selectedCityId, onCitySelect, onRegionSelect]);

  // 处理区域选择
  const handleRegionSelect = useCallback((regionId) => {
    console.log('选择区域:', regionId);
    
    if (multiSelect) {
      const newSelectedIds = new Set(selectedRegionIds);
      if (newSelectedIds.has(regionId)) {
        newSelectedIds.delete(regionId);
      } else {
        newSelectedIds.add(regionId);
      }
      setSelectedRegionIds(newSelectedIds);
      
      if (onRegionSelect) {
        onRegionSelect(Array.from(newSelectedIds));
      }
    } else {
      if (onRegionSelect) {
        onRegionSelect(regionId);
      }
    }
  }, [onRegionSelect, multiSelect, selectedRegionIds]);

  // 处理全选/取消全选
  const handleSelectAll = useCallback(() => {
    if (!selectedCity?.regions) return;
    
    const allRegionIds = selectedCity.regions.map(r => r.id);
    const newSelectedIds = selectAllMode ? new Set() : new Set(allRegionIds);
    
    setSelectedRegionIds(newSelectedIds);
    setSelectAllMode(!selectAllMode);
    
    if (onRegionSelect && multiSelect) {
      onRegionSelect(Array.from(newSelectedIds));
    }
  }, [selectedCity, selectAllMode, onRegionSelect, multiSelect]);

  // 处理批量操作
  const handleBatchOperation = useCallback((operation, data) => {
    if (onBatchOperation && selectedRegionIds.size > 0) {
      onBatchOperation(operation, {
        regionIds: Array.from(selectedRegionIds),
        cityId: selectedCityId,
        ...data
      });
    }
  }, [onBatchOperation, selectedRegionIds, selectedCityId]);

  // 获取区域显示颜色
  const getRegionDisplayColor = useCallback((region) => {
    if (region.displayColor) {
      return region.displayColor;
    }
    
    const cityThemeColor = selectedCity?.themeColor || '#2196F3';
    const maxLevel = selectedCity?.regions?.length || 10;
    return generateRegionColor(region.level, cityThemeColor, maxLevel);
  }, [selectedCity]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 标题 */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-xl opacity-50" />
          <div className="relative p-3.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl border border-cyan-500/30">
            <MapPin className="w-7 h-7 text-cyan-400" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            城市区域选择
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            选择配送城市和对应的区域
          </p>
        </div>
      </div>

      {/* 城市选择区域 */}
      <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 rounded-2xl border border-gray-700/30 p-6 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-white">选择城市</h4>
          <button
            onClick={loadCities}
            disabled={loadingCities}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 
                     border border-gray-700 rounded-xl transition-all text-sm text-gray-300
                     hover:text-white hover:border-gray-600 transform hover:scale-105"
          >
            <RefreshCw className={`w-4 h-4 ${loadingCities ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>

        {/* 搜索和过滤 */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-cyan-400 transition-colors" />
            <input
              type="text"
              placeholder="搜索城市名称或省份..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl
                       text-white placeholder-gray-500 focus:border-cyan-500 focus:bg-gray-800/70
                       focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={() => setShowOnlyActive(!showOnlyActive)}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all transform hover:scale-105 ${
              showOnlyActive
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                : 'bg-gray-800/50 border border-gray-700 text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>仅活跃</span>
          </button>
        </div>

        {/* 城市下拉选择 */}
        {loadingCities ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <span className="text-gray-400 mt-3">加载城市列表...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8 text-red-400">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        ) : (
          <div>
            {allowEmpty && (
              <button
                onClick={() => handleCitySelect(null)}
                className={`w-full text-left p-3 rounded-lg border transition-all mb-4 ${
                  !selectedCityId
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                }`}
              >
                <div className="text-gray-400 text-sm">未选择</div>
              </button>
            )}
            
            {filteredCities.length === 0 ? (
              <div className="text-center py-12">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-xl" />
                  <Building2 className="w-16 h-16 text-gray-500 relative" />
                </div>
                <p className="text-gray-300 mt-4 text-base font-medium">没有找到城市</p>
                <p className="text-gray-500 text-sm mt-2">请点击刷新按钮或检查网络连接</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredCities.map((city) => {
                  const isSelected = city.id === selectedCityId;
                  const stats = getCityStats(city);
                  
                  return (
                    <motion.button
                      key={city.id}
                      onClick={() => handleCitySelect(city.id)}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full relative rounded-xl border-2 transition-all duration-200 overflow-hidden group ${
                        isSelected
                          ? 'border-cyan-400 bg-gradient-to-r from-cyan-500/20 to-blue-500/10 shadow-lg shadow-cyan-500/15'
                          : 'border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between p-3">
                        {/* 左侧：城市信息 */}
                        <div className="flex items-center gap-3">
                          {/* 城市色标 */}
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: city.themeColor || '#6B7280' }}
                          />
                          
                          {/* 城市名称 */}
                          <div className="text-left">
                            <h5 className={`font-semibold text-sm ${
                              isSelected ? 'text-cyan-300' : 'text-white'
                            }`}>
                              {city.name}
                            </h5>
                            <p className="text-xs text-gray-500">
                              {city.province}
                            </p>
                          </div>
                        </div>
                        
                        {/* 右侧：统计信息 */}
                        <div className="flex items-center gap-4">
                          <div className="flex gap-3 text-xs">
                            <div className="text-center">
                              <div className={`font-bold ${
                                isSelected ? 'text-cyan-400' : 'text-gray-300'
                              }`}>
                                {stats.regionCount || 0}
                              </div>
                              <div className="text-gray-600 text-[10px]">区域</div>
                            </div>
                            <div className="text-center">
                              <div className={`font-bold ${
                                isSelected ? 'text-blue-400' : 'text-gray-300'
                              }`}>
                                {stats.totalFSAs || 0}
                              </div>
                              <div className="text-gray-600 text-[10px]">FSA</div>
                            </div>
                            <div className="text-center">
                              <div className={`font-bold ${
                                isSelected ? 'text-orange-400' : 'text-gray-300'
                              }`}>
                                0
                              </div>
                              <div className="text-gray-600 text-[10px]">价格</div>
                            </div>
                          </div>
                          
                          {/* 状态指示 */}
                          {isSelected ? (
                            <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                          ) : (
                            <div className={`w-2 h-2 rounded-full ${
                              city.isActive ? 'bg-green-400' : 'bg-gray-500'
                            }`} />
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {filteredCities.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>没有找到匹配的城市</p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-2 text-cyan-400 hover:text-cyan-300 text-sm"
                  >
                    清除搜索条件
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 区域选择区域 */}
      <AnimatePresence>
        {selectedCityId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 rounded-2xl border border-gray-700/30 p-6 backdrop-blur-xl shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h4 className="text-lg font-semibold text-white">选择区域</h4>
                {multiSelect && selectedCity?.regions?.length > 0 && (
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 
                             border border-gray-600 rounded-lg transition-colors text-sm text-gray-300"
                  >
                    <CheckSquare className="w-4 h-4" />
                    {selectAllMode ? '取消全选' : '全选'}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {loadingCityData && (
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                )}
                {multiSelect && selectedRegionIds.size > 0 && (
                  <span className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-xs text-cyan-300">
                    已选择 {selectedRegionIds.size} 个区域
                  </span>
                )}
              </div>
            </div>

            {/* 批量操作工具栏 */}
            {multiSelect && showBatchOperations && selectedRegionIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-gray-700/50 rounded-lg border border-gray-600/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">
                    批量操作 ({selectedRegionIds.size} 个区域):
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleBatchOperation('copy')}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 
                               rounded-lg transition-colors text-xs text-white"
                    >
                      <Copy className="w-3 h-3" />
                      复制定价
                    </button>
                    <button
                      onClick={() => handleBatchOperation('edit')}
                      className="flex items-center gap-1 px-3 py-1 bg-orange-600 hover:bg-orange-500 
                               rounded-lg transition-colors text-xs text-white"
                    >
                      <Edit3 className="w-3 h-3" />
                      批量编辑
                    </button>
                    <button
                      onClick={() => handleBatchOperation('delete')}
                      className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-500 
                               rounded-lg transition-colors text-xs text-white"
                    >
                      <Trash2 className="w-3 h-3" />
                      删除定价
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {loadingCityData ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mr-3" />
                <span className="text-gray-300">加载区域数据...</span>
              </div>
            ) : selectedCity?.regions?.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {selectedCity.regions
                  .sort((a, b) => a.level - b.level)
                  .map((region) => {
                    const isSelected = multiSelect 
                      ? selectedRegionIds.has(region.id)
                      : region.id === selectedRegionId;
                    const stats = getRegionStats(region);
                    const displayColor = getRegionDisplayColor(region);
                    
                    return (
                      <motion.button
                        key={region.id}
                        onClick={() => handleRegionSelect(region.id)}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full relative rounded-xl border-2 transition-all backdrop-blur-sm overflow-hidden group ${
                          isSelected
                            ? 'border-cyan-500 bg-gradient-to-r from-cyan-500/20 to-blue-500/10 shadow-lg shadow-cyan-500/15'
                            : 'border-gray-600 bg-gradient-to-r from-gray-800/50 to-gray-900/50 hover:border-gray-500'
                        }`}
                      >
                        {/* 左侧颜色指示条 */}
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-1"
                          style={{ backgroundColor: displayColor }}
                        />
                        
                        <div className="flex items-center justify-between p-3 pl-4">
                          {/* 左侧：区域信息 */}
                          <div className="flex items-center gap-3">
                            {/* 区域编号 */}
                            <div className="flex items-center gap-1 text-gray-500">
                              <Hash className="w-3 h-3" />
                              <span className="text-xs font-medium">{region.level}</span>
                            </div>
                            
                            {/* 区域名称 */}
                            <div className="text-left">
                              <h5 className={`font-semibold text-sm ${
                                isSelected ? 'text-cyan-300' : 'text-white'
                              }`}>
                                {region.name}
                              </h5>
                              <p className="text-xs text-gray-600">配送区域</p>
                            </div>
                          </div>
                          
                          {/* 右侧：统计信息和选择状态 */}
                          <div className="flex items-center gap-4">
                            <div className="flex gap-3 text-xs">
                              <div className="text-center">
                                <div className={`font-bold ${
                                  isSelected ? 'text-purple-400' : 'text-gray-300'
                                }`}>
                                  {stats.fsaCount}
                                </div>
                                <div className="text-gray-600 text-[10px]">FSA</div>
                              </div>
                              <div className="text-center">
                                <div className={`font-bold ${
                                  isSelected ? 'text-orange-400' : 'text-gray-300'
                                }`}>
                                  {stats.activePriceRanges}
                                </div>
                                <div className="text-gray-600 text-[10px]">价格</div>
                              </div>
                            </div>
                            
                            {/* 选择指示器 */}
                            {multiSelect ? (
                              isSelected ? (
                                <CheckSquare className="w-5 h-5 text-cyan-400" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-500 group-hover:text-gray-400" />
                              )
                            ) : (
                              isSelected && (
                                <CheckCircle className="w-5 h-5 text-cyan-400" />
                              )
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h5 className="text-lg font-medium text-white mb-2">
                  暂无区域配置
                </h5>
                <p className="text-gray-400">
                  {selectedCity?.name} 还没有配置任何区域
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 选择状态汇总 */}
      <AnimatePresence>
        {(selectedCityId || selectedRegionId) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 rounded-2xl p-5 border border-cyan-500/20 backdrop-blur-xl"
          >
            <h5 className="text-sm font-medium text-white mb-3">当前选择</h5>
            <div className="space-y-2">
              {selectedCity && (
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: selectedCity.themeColor }}
                  />
                  <span className="text-white font-medium">{selectedCity.name}</span>
                  <span className="text-gray-400 text-sm">({selectedCity.province})</span>
                </div>
              )}
              
              {/* 区域选择显示 */}
              {((!multiSelect && selectedRegionId) || (multiSelect && selectedRegionIds.size > 0)) && selectedCity && (
                <div className="ml-7 space-y-2">
                  {multiSelect ? (
                    // 多选模式显示
                    <>
                      <div className="flex items-center gap-3">
                        <span className="text-cyan-300 font-medium">
                          {selectedRegionIds.size} 个区域已选中
                        </span>
                        {selectedRegionStats && (
                          <span className="text-gray-400 text-sm">
                            (总计 {selectedRegionStats.fsaCount} FSA, {selectedRegionStats.activePriceRanges} 价格配置)
                          </span>
                        )}
                      </div>
                      {/* 显示前3个选中的区域名称 */}
                      <div className="flex flex-wrap gap-2">
                        {Array.from(selectedRegionIds).slice(0, 3).map(regionId => {
                          const region = selectedCity.regions?.find(r => r.id === regionId);
                          if (!region) return null;
                          return (
                            <div key={regionId} className="flex items-center gap-1">
                              <div 
                                className="w-3 h-3 rounded-full border border-white shadow-sm"
                                style={{ backgroundColor: getRegionDisplayColor(region) }}
                              />
                              <span className="text-cyan-300 text-sm">{region.name}</span>
                            </div>
                          );
                        })}
                        {selectedRegionIds.size > 3 && (
                          <span className="text-gray-400 text-sm">
                            +{selectedRegionIds.size - 3} 个更多...
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    // 单选模式显示
                    (() => {
                      const region = selectedCity.regions?.find(r => r.id === selectedRegionId);
                      if (!region) return null;
                      
                      return (
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full border border-white shadow-sm"
                            style={{ backgroundColor: getRegionDisplayColor(region) }}
                          />
                          <span className="text-cyan-300 font-medium">{region.name}</span>
                          {selectedRegionStats && (
                            <span className="text-gray-400 text-sm">
                              ({selectedRegionStats.fsaCount} FSA, {selectedRegionStats.activePriceRanges} 价格配置)
                            </span>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CityRegionSelector;