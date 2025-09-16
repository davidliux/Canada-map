/**
 * FSA分组价格配置面板
 *
 * 为每个FSA分组提供独立的板数定价配置
 * 未配置的分组使用区域默认价格
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  DollarSign,
  Edit3,
  Save,
  X,
  Check,
  AlertCircle,
  Package,
  Settings,
  Copy,
  Trash2,
  Info
} from 'lucide-react';
import pricingService from '../../../services/pricingService';
import { getRegionFSAGroups } from '../../../utils/unifiedStorage';

/**
 * FSA分组项组件
 */
const FSAGroupItem = ({
  group,
  zonePrice,
  onEdit,
  onSave,
  onDelete,
  isExpanded,
  onToggle
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [prices, setPrices] = useState({});
  const [hasCustomPrice, setHasCustomPrice] = useState(false);

  useEffect(() => {
    // 加载分组的自定义价格
    if (group.customSkidPricing) {
      setPrices(group.customSkidPricing);
      setHasCustomPrice(true);
    }
  }, [group]);

  const handleEdit = () => {
    setIsEditing(true);
    onToggle(group.id);
  };

  const handleSave = async () => {
    try {
      await onSave(group.id, prices);
      setIsEditing(false);
      setHasCustomPrice(true);
    } catch (error) {
      console.error('保存分组价格失败:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (group.customSkidPricing) {
      setPrices(group.customSkidPricing);
    }
  };

  const handleRemoveCustomPrice = async () => {
    if (window.confirm(`确定要删除 ${group.name} 的自定义价格吗？删除后将使用区域默认价格。`)) {
      await onDelete(group.id);
      setPrices({});
      setHasCustomPrice(false);
    }
  };

  const handlePriceChange = (skidCount, value) => {
    setPrices(prev => ({
      ...prev,
      [skidCount]: value
    }));
  };

  // 板数范围
  const skidRanges = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden"
    >
      {/* 分组标题栏 */}
      <div
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-700/50 transition-colors"
        onClick={() => !isEditing && onToggle(group.id)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${hasCustomPrice ? 'bg-cyan-500/20' : 'bg-gray-700'}`}>
            <Layers className={`w-4 h-4 ${hasCustomPrice ? 'text-cyan-400' : 'text-gray-400'}`} />
          </div>
          <div>
            <h4 className="text-white font-medium">{group.name}</h4>
            <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
              <span>{group.fsaCodes?.length || 0} 个FSA</span>
              {hasCustomPrice ? (
                <span className="text-cyan-400">已配置自定义价格</span>
              ) : (
                <span>使用区域默认价格</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              {hasCustomPrice && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveCustomPrice();
                  }}
                  className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit();
                }}
                className="p-2 text-gray-400 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 展开的价格配置区域 */}
      <AnimatePresence>
        {(isExpanded || isEditing) && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="border-t border-gray-700"
          >
            <div className="p-4">
              {/* FSA代码列表 */}
              <div className="mb-4">
                <div className="text-xs text-gray-400 mb-2">包含FSA代码:</div>
                <div className="flex flex-wrap gap-1">
                  {group.fsaCodes?.map(fsa => (
                    <span
                      key={fsa}
                      className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                    >
                      {fsa}
                    </span>
                  ))}
                </div>
              </div>

              {/* 价格配置表格 */}
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium text-white">配置板数价格</h5>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSave}
                        className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded-lg
                                 transition-colors flex items-center gap-1"
                      >
                        <Save className="w-3 h-3" />
                        保存
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg
                                 transition-colors flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        取消
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {skidRanges.map(skidCount => (
                      <div key={skidCount} className="bg-gray-700/50 rounded-lg p-2">
                        <label className="text-xs text-gray-400 block mb-1">
                          {skidCount}板
                        </label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                            $
                          </span>
                          <input
                            type="number"
                            value={prices[skidCount] || ''}
                            onChange={(e) => handlePriceChange(skidCount, e.target.value)}
                            placeholder={zonePrice?.[skidCount] || '0.00'}
                            className="w-full pl-6 pr-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm
                                     text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </div>
                    ))}
                    <div className="bg-gray-700/50 rounded-lg p-2">
                      <label className="text-xs text-gray-400 block mb-1">
                        16+板
                      </label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          $
                        </span>
                        <input
                          type="number"
                          value={prices['16+'] || ''}
                          onChange={(e) => handlePriceChange('16+', e.target.value)}
                          placeholder={zonePrice?.['16+'] || '0.00'}
                          className="w-full pl-6 pr-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm
                                   text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 mt-3">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-400 mt-0.5" />
                      <p className="text-xs text-blue-300">
                        留空的板数将使用区域默认价格。输入价格后，该分组的FSA将使用自定义价格。
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-white mb-2">
                    {hasCustomPrice ? '自定义价格' : '区域默认价格'}
                  </h5>
                  <div className="grid grid-cols-4 gap-2">
                    {skidRanges.map(skidCount => {
                      const price = hasCustomPrice ? prices[skidCount] : zonePrice?.[skidCount];
                      return (
                        <div key={skidCount} className="bg-gray-700/30 rounded-lg p-2 text-center">
                          <div className="text-xs text-gray-400">{skidCount}板</div>
                          <div className={`text-sm font-medium ${hasCustomPrice && prices[skidCount] ? 'text-cyan-400' : 'text-gray-300'}`}>
                            ${price || zonePrice?.[skidCount] || '-'}
                          </div>
                        </div>
                      );
                    })}
                    <div className="bg-gray-700/30 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-400">16+板</div>
                      <div className={`text-sm font-medium ${hasCustomPrice && prices['16+'] ? 'text-cyan-400' : 'text-gray-300'}`}>
                        ${prices['16+'] || zonePrice?.['16+'] || '-'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * FSA分组价格配置面板主组件
 */
const FSAGroupPricingPanel = ({
  cityId,
  zone,
  zonePrice,
  onSave,
  onChange
}) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [saveStatus, setSaveStatus] = useState(null);

  // 加载FSA分组
  useEffect(() => {
    loadGroups();
  }, [zone?.id]);

  const loadGroups = async () => {
    if (!zone?.id) return;

    try {
      setLoading(true);
      const regionGroups = await getRegionFSAGroups(zone.id);

      // 确保regionGroups是数组
      const groups = Array.isArray(regionGroups) ? regionGroups : [];

      // 加载每个分组的自定义价格
      const groupsWithPricing = await Promise.all(
        groups.map(async (group) => {
          try {
            const pricing = await pricingService.getGroupSkidPricing(cityId, zone.id, group.id);
            return {
              ...group,
              customSkidPricing: pricing
            };
          } catch (error) {
            return group;
          }
        })
      );

      setGroups(groupsWithPricing);
    } catch (error) {
      console.error('加载FSA分组失败:', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  // 保存分组价格
  const handleSaveGroupPrice = async (groupId, prices) => {
    try {
      setSaveStatus('saving');
      await pricingService.saveGroupSkidPricing(cityId, zone.id, groupId, prices);

      // 更新本地状态
      setGroups(prev => prev.map(group =>
        group.id === groupId
          ? { ...group, customSkidPricing: prices }
          : group
      ));

      if (onSave) {
        onSave({ groupId, prices });
      }

      if (onChange) {
        onChange({ groupPricing: { [groupId]: prices } });
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('保存分组价格失败:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
      throw error;
    }
  };

  // 删除分组自定义价格
  const handleDeleteGroupPrice = async (groupId) => {
    try {
      await pricingService.deleteGroupSkidPricing(cityId, zone.id, groupId);

      // 更新本地状态
      setGroups(prev => prev.map(group =>
        group.id === groupId
          ? { ...group, customSkidPricing: null }
          : group
      ));

      if (onChange) {
        onChange({ groupPricing: { [groupId]: null } });
      }
    } catch (error) {
      console.error('删除分组价格失败:', error);
    }
  };

  // 切换分组展开状态
  const handleToggleGroup = (groupId) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!zone) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-12 text-center">
        <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">请先选择一个区域</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 标题栏 */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-850 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <Layers className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">分组价格配置</h3>
              <p className="text-xs text-gray-400 mt-1">
                为 {zone.name} 的每个FSA分组设置独立价格
              </p>
            </div>
          </div>

          <div className="text-sm text-gray-400">
            {groups.filter(g => g.customSkidPricing).length} / {groups.length} 已配置
          </div>
        </div>

        {/* 帮助提示 */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-4 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p>点击分组可查看或编辑价格。未配置自定义价格的分组将使用区域默认价格。</p>
          </div>
        </div>
      </div>

      {/* 分组列表 */}
      <div className="space-y-3">
        {groups.length > 0 ? (
          groups.map(group => (
            <FSAGroupItem
              key={group.id}
              group={group}
              zonePrice={zonePrice}
              onEdit={() => {}}
              onSave={handleSaveGroupPrice}
              onDelete={handleDeleteGroupPrice}
              isExpanded={expandedGroups.has(group.id)}
              onToggle={handleToggleGroup}
            />
          ))
        ) : (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center">
            <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">该区域暂无FSA分组</p>
            <p className="text-gray-500 text-sm mt-1">请先在区域管理中创建FSA分组</p>
          </div>
        )}
      </div>

      {/* 保存状态提示 */}
      <AnimatePresence>
        {saveStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg
              ${saveStatus === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                saveStatus === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'}`}
          >
            <div className="flex items-center gap-2">
              {saveStatus === 'success' && <Check className="w-4 h-4" />}
              {saveStatus === 'error' && <AlertCircle className="w-4 h-4" />}
              {saveStatus === 'saving' && (
                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              )}
              <span className="text-sm">
                {saveStatus === 'success' && '分组价格已保存'}
                {saveStatus === 'error' && '保存失败'}
                {saveStatus === 'saving' && '保存中...'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FSAGroupPricingPanel;