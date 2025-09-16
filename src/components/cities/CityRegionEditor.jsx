/**
 * 城市区域编辑器组件
 * 
 * 用于管理城市的1-10个区域配置，包含：
 * - 动态区域列表管理
 * - 区域等级选择器(1-10)
 * - 区域名称编辑
 * - FSA代码分配
 * - 区域颜色自动计算和预览
 * - 数据验证和冲突检测
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2, Edit3, Save, X, AlertTriangle, Check, MapPin, Hash, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FSASelector from './FSASelector.jsx';
import FSAGroupManager from '../regions/FSAGroupManager.jsx';
import {
  createDefaultTruckRegion,
  generateRegionColor,
  validateTruckDeliveryRegion,
  REGION_LEVEL
} from '../../types/truckDelivery.js';
import { cityStorageService } from '../../utils/storage/cityStorage.js';

/**
 * 城市区域编辑器组件
 * @param {Object} props - 组件属性
 * @param {Object} props.cityData - 城市数据
 * @param {function} props.onCityChange - 城市数据变化回调
 * @param {boolean} [props.isReadOnly] - 是否只读模式
 * @param {string} [props.className] - 自定义样式类
 */
const CityRegionEditor = ({ 
  cityData, 
  onCityChange, 
  isReadOnly = false,
  className = '' 
}) => {
  // 状态管理
  const [regions, setRegions] = useState(cityData?.regions || []);
  const [editingRegionId, setEditingRegionId] = useState(null);
  const [showFSASelector, setShowFSASelector] = useState(null); // 显示FSA选择器的区域ID
  const [showFSAGroups, setShowFSAGroups] = useState(null); // 显示FSA组管理的区域ID
  const [validationErrors, setValidationErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  
  // 计算当前最大等级数，用于颜色分布
  const maxLevel = useMemo(() => {
    if (regions.length === 0) return 10;
    return Math.max(...regions.map(r => r.level), 4); // 至少使用4级颜色分布
  }, [regions]);

  // 同步外部数据变化
  useEffect(() => {
    const initialRegions = cityData?.regions || [];
    // 确保每个区域都有displayColor
    const regionsWithColors = initialRegions.map(region => {
      if (!region.displayColor) {
        return {
          ...region,
          displayColor: generateRegionColor(
            region.level,
            cityData?.themeColor || '#2196F3',
            Math.max(initialRegions.length, 4)
          )
        };
      }
      return region;
    });
    setRegions(regionsWithColors);
    setIsDirty(false);
  }, [cityData?.regions, cityData?.themeColor]);

  // 可用的区域等级选项
  const availableLevels = useMemo(() => {
    const usedLevels = new Set(regions.map(r => r.level));
    const levels = [];
    
    for (let i = REGION_LEVEL.MIN; i <= REGION_LEVEL.MAX; i++) {
      levels.push({
        value: i,
        label: `区域${i}`,
        isAvailable: !usedLevels.has(i) || editingRegionId
      });
    }
    
    return levels;
  }, [regions, editingRegionId]);

  // 添加新区域
  const addRegion = useCallback(() => {
    if (regions.length >= 10) {
      alert('每个城市最多只能有10个区域');
      return;
    }

    // 找到下一个可用等级
    const usedLevels = new Set(regions.map(r => r.level));
    let nextLevel = REGION_LEVEL.MIN;
    while (usedLevels.has(nextLevel) && nextLevel <= REGION_LEVEL.MAX) {
      nextLevel++;
    }

    if (nextLevel > REGION_LEVEL.MAX) {
      alert('所有区域等级已被使用');
      return;
    }

    const newRegion = createDefaultTruckRegion(
      cityData.id,
      nextLevel,
      `区域${nextLevel}`
    );
    
    // 使用城市主题色生成区域颜色
    newRegion.displayColor = generateRegionColor(
      nextLevel, 
      cityData.themeColor || '#2196F3',
      Math.max(regions.length + 1, 4) // 使用实际区域数计算颜色分布
    );

    const updatedRegions = [...regions, newRegion];
    setRegions(updatedRegions);
    setIsDirty(true);
    setEditingRegionId(newRegion.id);

    // 注意：这里不立即通知父组件，等用户完成配置后保存时再通知
    // 这样可以避免界面刷新导致的用户体验问题
  }, [regions, cityData, onCityChange, maxLevel]);

  // 删除区域
  const deleteRegion = useCallback((regionId) => {
    if (!confirm('确定要删除这个区域吗？此操作不可恢复。')) {
      return;
    }

    const updatedRegions = regions.filter(r => r.id !== regionId);
    setRegions(updatedRegions);
    setIsDirty(true);
    
    if (editingRegionId === regionId) {
      setEditingRegionId(null);
    }
    
    if (showFSASelector === regionId) {
      setShowFSASelector(null);
    }

    // 通知父组件
    if (onCityChange) {
      onCityChange({
        ...cityData,
        regions: updatedRegions
      });
    }
  }, [regions, cityData, onCityChange, editingRegionId, showFSASelector]);

  // 更新区域数据
  const updateRegion = useCallback((regionId, updates) => {
    const updatedRegions = regions.map(region => 
      region.id === regionId 
        ? { 
            ...region, 
            ...updates,
            displayColor: updates.level 
              ? generateRegionColor(
                  updates.level, 
                  cityData?.themeColor || '#2196F3',
                  Math.max(regions.length, 4) // 使用实际区域数计算颜色分布
                ) 
              : region.displayColor,
            metadata: {
              ...(region.metadata || {}),
              updatedAt: new Date().toISOString(),
              version: ((region.metadata?.version) || 0) + 1
            }
          }
        : region
    );

    setRegions(updatedRegions);
    setIsDirty(true);

    // 通知父组件
    if (onCityChange) {
      onCityChange({
        ...cityData,
        regions: updatedRegions
      });
    }
  }, [regions, cityData, onCityChange, maxLevel]);

  // 处理FSA选择变化 - 只更新本地状态，不立即通知父组件
  const handleFSASelectionChange = useCallback((regionId, selectedFSAs) => {
    // 只更新本地状态
    const updatedRegions = regions.map(region =>
      region.id === regionId
        ? {
            ...region,
            fsaCodes: selectedFSAs,
            metadata: {
              ...(region.metadata || {}),
              updatedAt: new Date().toISOString(),
              version: ((region.metadata?.version) || 0) + 1
            }
          }
        : region
    );

    setRegions(updatedRegions);
    setIsDirty(true);
    // 不调用 onCityChange，让用户继续选择
  }, [regions]);

  // 验证区域数据
  const validateRegion = useCallback(async (region) => {
    try {
      const validation = validateTruckDeliveryRegion(region);
      
      // 额外检查FSA冲突
      if (region.fsaCodes && region.fsaCodes.length > 0) {
        const cityId = cityData?.id;
        const conflicts = await cityStorageService.validateFSAConflicts({
          id: cityId,
          regions: [region]
        });
        
        if (conflicts.hasConflicts) {
          validation.warnings.push(`FSA冲突：${conflicts.conflicts.length} 个冲突`);
        }
      }

      return validation;
    } catch (error) {
      console.error('验证区域数据失败:', error);
      return {
        isValid: false,
        errors: ['验证过程出错'],
        warnings: []
      };
    }
  }, [cityData?.id]);

  // 批量验证所有区域
  const validateAllRegions = useCallback(async () => {
    console.log('开始验证所有区域...');
    const errors = {};
    
    if (regions.length === 0) {
      alert('没有区域需要验证');
      return false;
    }
    
    for (const region of regions) {
      const validation = await validateRegion(region);
      if (!validation.isValid || validation.warnings.length > 0) {
        errors[region.id] = validation;
      }
    }
    
    setValidationErrors(errors);
    const hasErrors = Object.keys(errors).length > 0;
    
    if (hasErrors) {
      alert(`验证发现 ${Object.keys(errors).length} 个区域存在问题，请检查标记的区域`);
    } else {
      alert('所有区域验证通过！');

      // 验证成功后，通知父组件保存更改
      if (onCityChange) {
        onCityChange({
          ...cityData,
          regions: regions
        });
      }
      setIsDirty(false);
    }

    return !hasErrors;
  }, [regions, validateRegion, onCityChange, cityData]);

  // 开始编辑区域
  const startEditing = useCallback((regionId) => {
    setEditingRegionId(regionId);
  }, []);

  // 完成编辑区域
  const finishEditing = useCallback(async () => {
    if (editingRegionId) {
      const region = regions.find(r => r.id === editingRegionId);
      if (region) {
        const validation = await validateRegion(region);
        if (!validation.isValid) {
          alert(`区域验证失败：${validation.errors.join(', ')}`);
          return;
        }
      }
    }
    
    setEditingRegionId(null);
  }, [editingRegionId, regions, validateRegion]);

  // 取消编辑
  const cancelEditing = useCallback(() => {
    setEditingRegionId(null);
    // 恢复原始数据
    setRegions(cityData?.regions || []);
    setIsDirty(false);
  }, [cityData?.regions]);

  // 获取区域统计信息
  const getRegionStats = useCallback((region) => {
    return {
      fsaCount: region.fsaCodes?.length || 0,
      activePrices: region.priceTable?.prices?.filter(p => p.isActive).length || 0
    };
  }, []);

  return (
    <div className={`bg-gray-800 rounded-lg h-full flex flex-col ${className}`}>
      {/* 头部控制区域 */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-white">
              区域配置
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              管理城市的配送区域（最多10个）
            </p>
          </div>
          
          {!isReadOnly && (
            <div className="flex items-center gap-3">
              {isDirty && (
                <span className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  有未保存的更改
                </span>
              )}

              {isDirty && (
                <button
                  onClick={() => {
                    // 保存所有更改
                    if (onCityChange) {
                      onCityChange({
                        ...cityData,
                        regions: regions
                      });
                      setIsDirty(false);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md
                    hover:bg-green-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  保存更改
                </button>
              )}

              <button
                onClick={addRegion}
                disabled={regions.length >= 10}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md
                  hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
                添加区域
              </button>
            </div>
          )}
        </div>

        {/* 区域数量统计 */}
        <div className="mt-4 flex items-center gap-6 text-sm text-gray-400">
          <span>区域数量: {regions.length}/10</span>
          <span>
            总FSA数: {regions.reduce((sum, r) => sum + (r.fsaCodes?.length || 0), 0)}
          </span>
          <span>
            已配置价格: {regions.filter(r => 
              r.priceTable?.prices?.some(p => p.isActive && p.price > 0)
            ).length}
          </span>
        </div>
      </div>

      {/* 区域列表 */}
      <div className="flex-1 p-6 overflow-y-auto">
        {regions.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-white mb-2">
              暂无区域配置
            </h4>
            <p className="text-gray-400 mb-6">
              点击"添加区域"开始配置城市的配送区域
            </p>
            {!isReadOnly && (
              <button
                onClick={addRegion}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg
                  hover:bg-blue-700 transition-colors mx-auto"
              >
                <Plus className="w-5 h-5" />
                添加第一个区域
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {regions
                .sort((a, b) => a.level - b.level)
                .map((region) => {
                const isEditing = editingRegionId === region.id;
                const stats = getRegionStats(region);
                const validation = validationErrors[region.id];

                return (
                  <motion.div
                    key={region.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`
                      border rounded-lg transition-all duration-200
                      ${isEditing 
                        ? 'border-blue-500 ring-2 ring-blue-500/20' 
                        : 'border-gray-700 hover:border-gray-600'
                      }
                    `}
                  >
                    {/* 区域头部 */}
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* 区域颜色指示器 */}
                          <div 
                            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                            style={{ 
                              backgroundColor: region.displayColor || generateRegionColor(
                                region.level,
                                cityData?.themeColor || '#2196F3',
                                Math.max(regions.length, 4)
                              )
                            }}
                            title={`区域${region.level}颜色`}
                          />
                          
                          <div className="flex-1">
                            {isEditing ? (
                              <div className="flex items-center gap-3">
                                {/* 等级选择 */}
                                <select
                                  value={region.level}
                                  onChange={(e) => updateRegion(region.id, { level: parseInt(e.target.value) })}
                                  className="px-2 py-1 bg-gray-700 border border-gray-600 rounded-md
                                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                    text-white text-sm"
                                  disabled={isReadOnly}
                                >
                                  {availableLevels
                                    .filter(level => level.isAvailable || level.value === region.level)
                                    .map(level => (
                                    <option key={level.value} value={level.value}>
                                      等级 {level.value}
                                    </option>
                                  ))}
                                </select>

                                {/* 名称编辑 */}
                                <input
                                  type="text"
                                  value={region.name}
                                  onChange={(e) => updateRegion(region.id, { name: e.target.value })}
                                  placeholder="区域名称"
                                  className="flex-1 px-3 py-1 bg-gray-700 border border-gray-600 rounded-md
                                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                    text-white placeholder-gray-400"
                                  disabled={isReadOnly}
                                />
                              </div>
                            ) : (
                              <div>
                                <h4 className="text-lg font-medium text-white">
                                  {region.name}
                                </h4>
                                <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                  <span className="flex items-center gap-1">
                                    <Hash className="w-3 h-3" />
                                    等级 {region.level}
                                  </span>
                                  <span>{stats.fsaCount} 个FSA</span>
                                  <span>{stats.activePrices} 个价格配置</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex items-center gap-2">
                          {validation && (
                            <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                          )}
                          
                          {!isReadOnly && (
                            <>
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={finishEditing}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                    title="完成编辑"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-md transition-colors"
                                    title="取消编辑"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEditing(region.id)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                    title="编辑区域"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteRegion(region.id)}
                                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-md transition-colors"
                                    title="删除区域"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* FSA代码管理 */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-300">
                            FSA代码配置
                          </label>

                          {!isReadOnly && (
                            <div className="flex items-center gap-2">
                              {region.fsaCodes.length === 0 && (
                                <button
                                  onClick={() => setShowFSASelector(
                                    showFSASelector === region.id ? null : region.id
                                  )}
                                  className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
                                >
                                  {showFSASelector === region.id ? '收起选择器' : '选择FSA'}
                                </button>
                              )}

                              {/* FSA组管理按钮 */}
                              {region.fsaCodes.length > 0 && (
                                <button
                                  onClick={() => setShowFSAGroups(
                                    showFSAGroups === region.id ? null : region.id
                                  )}
                                  className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                  <Users className="w-3 h-3" />
                                  {showFSAGroups === region.id ? '收起分组' : 'FSA分组'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 当前选中的FSA - 简洁预览 */}
                        {region.fsaCodes && region.fsaCodes.length > 0 ? (
                          <div className="flex items-center gap-2">
                            {/* 显示前3个FSA作为样本 */}
                            <div className="flex flex-wrap gap-1">
                              {region.fsaCodes.slice(0, 3).map(fsa => (
                                <span
                                  key={fsa}
                                  className="inline-flex items-center px-2 py-0.5 bg-blue-900/30
                                    text-blue-300 text-xs font-mono rounded border border-blue-700"
                                >
                                  {fsa}
                                </span>
                              ))}
                              {region.fsaCodes.length > 3 && (
                                <span className="text-xs text-gray-400 px-1">
                                  +{region.fsaCodes.length - 3}
                                </span>
                              )}
                            </div>
                            
                            {/* 查看更多/编辑按钮 */}
                            {!isReadOnly && (
                              <button
                                onClick={() => setShowFSASelector(
                                  showFSASelector === region.id ? null : region.id
                                )}
                                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                {showFSASelector === region.id ? '收起' : '查看全部'}
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400 italic">
                            未配置FSA代码
                          </div>
                        )}

                        {/* FSA选择器和完整列表 */}
                        <AnimatePresence>
                          {showFSASelector === region.id && !isReadOnly && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="mt-3"
                            >
                              {/* 当前已选择的FSA完整列表（可删除） */}
                              {region.fsaCodes && region.fsaCodes.length > 0 && (
                                <div className="mb-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
                                  <div className="text-xs text-gray-400 mb-2">已选择的FSA代码（点击删除）：</div>
                                  <div className="flex flex-wrap gap-1">
                                    {region.fsaCodes.map(fsa => (
                                      <span
                                        key={fsa}
                                        className="inline-flex items-center px-2 py-0.5 bg-blue-900/30
                                          text-blue-300 text-xs font-mono rounded border border-blue-700
                                          hover:bg-red-900/30 hover:border-red-700 hover:text-red-300
                                          cursor-pointer transition-colors"
                                        onClick={() => handleFSASelectionChange(
                                          region.id,
                                          region.fsaCodes.filter(f => f !== fsa)
                                        )}
                                        title="点击删除"
                                      >
                                        {fsa}
                                        <X className="w-3 h-3 ml-1" />
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* FSA选择器 */}
                              <FSASelector
                                selectedFSAs={region.fsaCodes || []}
                                onSelectionChange={(selectedFSAs) => 
                                  handleFSASelectionChange(region.id, selectedFSAs)
                                }
                                currentCityId={cityData?.id}
                                currentRegionId={region.id}
                                usedFSAs={regions
                                  .filter(r => r.id !== region.id)
                                  .flatMap(r => r.fsaCodes || [])}
                                className=""
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* FSA组管理 */}
                        <AnimatePresence>
                          {showFSAGroups === region.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3"
                            >
                              <FSAGroupManager
                                region={{
                                  ...region,
                                  id: region.id,
                                  fsaCodes: region.fsaCodes || []
                                }}
                                fsaData={[]} // 如果有FSA详细数据可以传入
                                onGroupsChange={() => {
                                  // 组变化后的处理
                                  console.log('FSA组已更新');
                                }}
                                isReadOnly={isReadOnly}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* 验证错误显示 */}
                      {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md">
                          {validation.errors.length > 0 && (
                            <div className="mb-2">
                              <h5 className="text-sm font-medium text-red-900 dark:text-red-300 mb-1">错误:</h5>
                              <ul className="text-sm text-red-700 dark:text-red-400 list-disc list-inside">
                                {validation.errors.map((error, index) => (
                                  <li key={index}>{error}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {validation.warnings.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-yellow-900 dark:text-yellow-300 mb-1">警告:</h5>
                              <ul className="text-sm text-yellow-700 dark:text-yellow-400 list-disc list-inside">
                                {validation.warnings.map((warning, index) => (
                                  <li key={index}>{warning}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 底部操作区域 */}
      {!isReadOnly && (
        <div className="px-6 py-4 border-t border-gray-700 bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {isDirty ? '有未保存的更改' : '配置已保存'}
            </div>
            <div className="flex gap-3">
              {isDirty && (
                <button
                  onClick={cancelEditing}
                  className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-md transition-colors"
                >
                  撤销更改
                </button>
              )}
              <button
                onClick={validateAllRegions}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                验证配置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CityRegionEditor;