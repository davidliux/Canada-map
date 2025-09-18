/**
 * 集成式价格配置矩阵组件
 *
 * 将分组定价功能融合到固定价格和高级定价模式中
 * - 支持选择特定分组进行单独定价
 * - 未选中分组时批量设置价格
 * - 统一的价格配置界面
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid,
  Package,
  DollarSign,
  Save,
  Layers,
  CheckSquare,
  Square,
  Info,
  AlertCircle,
  Settings,
  Edit3,
  Copy,
  Trash2,
  Sliders
} from 'lucide-react';
import pricingService from '../../../services/pricingService';
import { getRegionFSAGroups } from '../../../utils/unifiedStorage';
import { dataUpdateNotifier } from '../../../utils/dataUpdateNotifier';
import PricingModeSelector from '../PricingModeSelector';

// 板数范围
const SKID_RANGES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, '16+'];

/**
 * 分组选择器组件
 */
const GroupSelector = ({ groups, selectedGroups, onGroupToggle, onSelectAll }) => {
  const allSelected = groups.length > 0 && selectedGroups.size === groups.length;
  const someSelected = selectedGroups.size > 0 && selectedGroups.size < groups.length;

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
      {/* 全选控制 */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-300">选择分组</h4>
        <button
          onClick={onSelectAll}
          className="flex items-center gap-2 px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600
                   text-gray-300 rounded transition-colors"
        >
          {allSelected ? (
            <>
              <CheckSquare className="w-3 h-3" />
              <span>取消全选</span>
            </>
          ) : (
            <>
              <Square className="w-3 h-3" />
              <span>全选</span>
            </>
          )}
        </button>
      </div>

      {/* 分组列表 */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {groups.map(group => {
          const isSelected = selectedGroups.has(group.id);
          return (
            <button
              key={group.id}
              onClick={() => onGroupToggle(group.id)}
              className={`w-full flex items-center justify-between p-2 rounded-lg transition-all
                ${isSelected
                  ? 'bg-cyan-500/20 border border-cyan-500/30'
                  : 'bg-gray-700/50 border border-gray-600 hover:bg-gray-700'}`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded flex items-center justify-center
                  ${isSelected ? 'bg-cyan-500 text-white' : 'bg-gray-600'}`}>
                  {isSelected && <CheckSquare className="w-3 h-3" />}
                </div>
                <span className={`text-sm ${isSelected ? 'text-cyan-300' : 'text-gray-300'}`}>
                  {group.name}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {group.fsaCodes?.length || 0} FSA
              </span>
            </button>
          );
        })}
      </div>

      {/* 提示信息 */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-400 mt-0.5" />
          <p className="text-xs text-blue-300">
            {selectedGroups.size === 0
              ? '未选择分组时，价格将应用到所有分组'
              : `已选择 ${selectedGroups.size} 个分组，价格将仅应用到选中的分组`}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * 价格编辑表格组件
 */
const PriceEditTable = ({
  prices,
  onPriceChange,
  selectedGroups,
  groupPrices,
  isGroupMode
}) => {
  return (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-300 mb-3">
        {isGroupMode && selectedGroups.size > 0
          ? `为选中的 ${selectedGroups.size} 个分组设置价格`
          : '设置区域默认价格'}
      </h4>

      <div className="grid grid-cols-4 gap-3">
        {SKID_RANGES.map(skidCount => (
          <div key={skidCount} className="bg-gray-700/50 rounded-lg p-3">
            <label className="text-xs text-gray-400 block mb-1">
              {skidCount === '16+' ? '16+板' : `${skidCount}板`}
            </label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                $
              </span>
              <input
                type="number"
                value={prices[skidCount] || ''}
                onChange={(e) => onPriceChange(skidCount, e.target.value)}
                placeholder="0.00"
                className="w-full pl-6 pr-2 py-1.5 bg-gray-800 border border-gray-600 rounded
                         text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none
                         focus:ring-2 focus:ring-cyan-500/20 transition-all"
                step="0.01"
                min="0"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 分组价格预览组件
 */
const GroupPricePreview = ({ groups, groupPrices, defaultPrices }) => {
  return (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-300 mb-3">分组价格预览</h4>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {groups.map(group => {
          const hasCustomPrice = groupPrices[group.id] && Object.keys(groupPrices[group.id]).length > 0;
          return (
            <div
              key={group.id}
              className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Layers className={`w-4 h-4 ${hasCustomPrice ? 'text-cyan-400' : 'text-gray-500'}`} />
                <span className="text-sm text-gray-300">{group.name}</span>
              </div>
              <span className={`text-xs ${hasCustomPrice ? 'text-cyan-400' : 'text-gray-500'}`}>
                {hasCustomPrice ? '自定义价格' : '使用默认价格'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 主组件：集成式价格配置矩阵
 */
const IntegratedPricingMatrix = ({
  cityId,
  zone,
  mode = 'fixed', // 'fixed' | 'advanced'
  onSave,
  onChange
}) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState(new Set());
  const [defaultPrices, setDefaultPrices] = useState({});
  const [groupPrices, setGroupPrices] = useState({});
  const [editingPrices, setEditingPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null);
  const [showGroupSelector, setShowGroupSelector] = useState(false);

  // 加载FSA分组
  useEffect(() => {
    loadGroups();
  }, [zone?.id]);

  const loadGroups = async () => {
    if (!zone?.id) return;

    try {
      setLoading(true);
      // 加载分组
      const regionGroups = await getRegionFSAGroups(zone.id);
      const groupsArray = Array.isArray(regionGroups) ? regionGroups : [];

      // 加载每个分组的价格
      const pricesData = {};
      for (const group of groupsArray) {
        try {
          const pricing = await pricingService.getGroupSkidPricing(
            cityId,
            zone.id,
            group.name || group.id
          );
          if (pricing && pricing.prices) {
            pricesData[group.id] = pricing.prices;
          }
        } catch (error) {
          console.log(`未找到分组 ${group.name} 的价格`);
        }
      }

      setGroups(groupsArray);
      setGroupPrices(pricesData);

      // 加载区域默认价格
      try {
        const zonePricing = await pricingService.getZoneSkidPricing(cityId, zone.id);
        if (zonePricing) {
          setDefaultPrices(zonePricing);
          setEditingPrices(zonePricing);
        }
      } catch (error) {
        console.log('未找到区域默认价格');
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 切换分组选择
  const handleGroupToggle = (groupId) => {
    const newSelected = new Set(selectedGroups);
    if (newSelected.has(groupId)) {
      newSelected.delete(groupId);
    } else {
      newSelected.add(groupId);
    }
    setSelectedGroups(newSelected);

    // 如果选中了分组，加载该分组的价格
    if (newSelected.size === 1) {
      const selectedGroupId = Array.from(newSelected)[0];
      const groupPrice = groupPrices[selectedGroupId];
      if (groupPrice) {
        setEditingPrices(groupPrice);
      } else {
        setEditingPrices(defaultPrices);
      }
    } else {
      setEditingPrices(defaultPrices);
    }
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedGroups.size === groups.length) {
      setSelectedGroups(new Set());
      setEditingPrices(defaultPrices);
    } else {
      setSelectedGroups(new Set(groups.map(g => g.id)));
      setEditingPrices(defaultPrices);
    }
  };

  // 价格更改
  const handlePriceChange = (skidCount, value) => {
    const newPrices = {
      ...editingPrices,
      [skidCount]: parseFloat(value) || 0
    };
    setEditingPrices(newPrices);

    if (onChange) {
      onChange(newPrices);
    }
  };

  // 保存价格
  const handleSave = async () => {
    try {
      setSaveStatus('saving');

      if (selectedGroups.size > 0) {
        // 保存到选中的分组
        for (const groupId of selectedGroups) {
          const group = groups.find(g => g.id === groupId);
          if (group) {
            await pricingService.saveGroupSkidPricing(
              cityId,
              zone.id,
              group.name || group.id,
              editingPrices
            );

            // 更新本地状态
            setGroupPrices(prev => ({
              ...prev,
              [groupId]: editingPrices
            }));
          }
        }
      } else {
        // 保存为区域默认价格
        await pricingService.saveZoneSkidPricing(cityId, zone.id, editingPrices);
        setDefaultPrices(editingPrices);
      }

      if (onSave) {
        onSave({
          type: selectedGroups.size > 0 ? 'group' : 'default',
          groups: Array.from(selectedGroups),
          prices: editingPrices
        });
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);

      // 通知更新
      dataUpdateNotifier.notify({
        type: 'PRICING_UPDATED',
        zoneId: zone.id,
        groups: Array.from(selectedGroups)
      });
    } catch (error) {
      console.error('保存失败:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // 批量操作：复制价格到其他分组
  const handleCopyToGroups = async (sourceGroupId, targetGroupIds) => {
    const sourcePrices = groupPrices[sourceGroupId] || defaultPrices;

    for (const targetId of targetGroupIds) {
      const group = groups.find(g => g.id === targetId);
      if (group) {
        await pricingService.saveGroupSkidPricing(
          cityId,
          zone.id,
          group.name || group.id,
          sourcePrices
        );
      }
    }

    // 重新加载价格
    await loadGroups();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 标题栏 */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-850 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              mode === 'advanced'
                ? 'bg-purple-500/10'
                : 'bg-cyan-500/10'
            }`}>
              {mode === 'advanced' ? (
                <Sliders className="w-5 h-5 text-purple-400" />
              ) : (
                <Grid className="w-5 h-5 text-cyan-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {mode === 'advanced' ? '高级定价配置' : '固定价格配置'}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {zone?.name || '未选择区域'}
                {mode === 'advanced' && ' - 支持首续托、批量折扣、整车等多种定价方式'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 分组模式切换 */}
            <button
              onClick={() => setShowGroupSelector(!showGroupSelector)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                ${showGroupSelector
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              <Layers className="w-4 h-4" />
              <span className="text-sm">分组定价</span>
              {selectedGroups.size > 0 && (
                <span className="px-1.5 py-0.5 bg-cyan-500/30 rounded text-xs">
                  {selectedGroups.size}
                </span>
              )}
            </button>

            {/* 保存按钮 */}
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500
                       text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>保存</span>
            </button>
          </div>
        </div>
      </div>

      {/* 根据模式显示不同的配置界面 */}
      {mode === 'advanced' ? (
        // 高级定价模式：显示定价模式选择器
        <div className="space-y-6">
          {/* 分组选择器（高级模式也可以有分组） */}
          {showGroupSelector && (
            <GroupSelector
              groups={groups}
              selectedGroups={selectedGroups}
              onGroupToggle={handleGroupToggle}
              onSelectAll={handleSelectAll}
            />
          )}

          {/* 高级定价配置 */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="w-5 h-5 text-purple-400" />
              <h4 className="text-sm font-medium text-gray-300">
                {selectedGroups.size > 0
                  ? `为选中的 ${selectedGroups.size} 个分组配置高级定价`
                  : '配置区域高级定价规则'}
              </h4>
            </div>
            <PricingModeSelector
              cityId={cityId}
              zoneId={zone?.id}
              onModeChange={(mode, config) => {
                if (onChange) {
                  onChange({ mode, config, groups: Array.from(selectedGroups) });
                }
              }}
            />
          </div>
        </div>
      ) : (
        // 固定价格模式：显示价格表格
        <div className={`grid ${showGroupSelector ? 'grid-cols-3' : 'grid-cols-1'} gap-6`}>
          {/* 分组选择器 */}
          {showGroupSelector && (
            <div>
              <GroupSelector
                groups={groups}
                selectedGroups={selectedGroups}
                onGroupToggle={handleGroupToggle}
                onSelectAll={handleSelectAll}
              />
            </div>
          )}

          {/* 价格编辑表格 */}
          <div className={showGroupSelector ? 'col-span-2' : ''}>
            <PriceEditTable
              prices={editingPrices}
              onPriceChange={handlePriceChange}
              selectedGroups={selectedGroups}
              groupPrices={groupPrices}
              isGroupMode={showGroupSelector}
            />
          </div>
        </div>
      )}

      {/* 分组价格预览 */}
      {showGroupSelector && groups.length > 0 && (
        <GroupPricePreview
          groups={groups}
          groupPrices={groupPrices}
          defaultPrices={defaultPrices}
        />
      )}

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
              {saveStatus === 'success' && '价格已保存'}
              {saveStatus === 'error' && '保存失败'}
              {saveStatus === 'saving' && '保存中...'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IntegratedPricingMatrix;