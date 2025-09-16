/**
 * FSA组管理器组件
 * 用于在卡车配送区域管理中管理FSA组
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Users, MapPin, DollarSign, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FSAGroupEditor from './FSAGroupEditor';
import {
  getRegionFSAGroups,
  createFSAGroup,
  updateFSAGroup,
  deleteFSAGroup
} from '../../utils/unifiedStorage';
import {
  validateGroupName,
  detectFSAConflicts,
  getUngroupedFSAs,
  calculateGroupStats
} from '../../utils/fsaGroupValidation';
import { dataUpdateNotifier } from '../../utils/dataUpdateNotifier';

/**
 * FSA组管理器
 * @param {Object} props - 组件属性
 * @param {Object} props.region - 区域对象
 * @param {Array} props.fsaData - FSA数据
 * @param {Function} props.onGroupsChange - 组变化回调
 * @param {boolean} props.isReadOnly - 是否只读
 */
const FSAGroupManager = ({
  region,
  fsaData = [],
  onGroupsChange,
  isReadOnly = false
}) => {
  const [groups, setGroups] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [editingGroup, setEditingGroup] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAllUngrouped, setShowAllUngrouped] = useState(false);

  // 加载组数据
  const loadGroups = async () => {
    if (!region?.id) return;

    try {
      setLoading(true);
      const fsaGroups = await getRegionFSAGroups(region.id);
      setGroups(fsaGroups || []);
      setError(null);
    } catch (err) {
      console.error('加载FSA组失败:', err);
      setError('加载FSA组失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化和监听更新
  useEffect(() => {
    loadGroups();

    const unsubscribe = dataUpdateNotifier.subscribe((updateInfo) => {
      if (updateInfo.type === 'fsaGroupUpdate' && updateInfo.regionId === region?.id) {
        loadGroups();
      }
    });

    return () => unsubscribe();
  }, [region?.id]);

  // 计算未分组的FSA
  const ungroupedFSAs = useMemo(() => {
    if (!region?.fsaCodes || !Array.isArray(region.fsaCodes)) {
      console.log('区域没有FSA代码或格式不正确:', region);
      return [];
    }
    const ungrouped = getUngroupedFSAs(region.fsaCodes, groups);
    console.log(`区域 ${region.id} 总FSA: ${region.fsaCodes.length}, 未分组: ${ungrouped.length}`);
    return ungrouped;
  }, [region?.fsaCodes, groups]);

  // 计算组统计信息
  const groupStats = useMemo(() => {
    return groups.map(group => ({
      ...group,
      stats: calculateGroupStats(group, fsaData)
    }));
  }, [groups, fsaData]);

  // 创建新组
  const handleCreateGroup = async (groupData) => {
    try {
      setLoading(true);

      // 验证组名
      const validation = validateGroupName(groupData.name, groups);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // 检测FSA冲突
      if (groupData.fsaCodes?.length > 0) {
        const conflicts = detectFSAConflicts(groupData.fsaCodes, groups);
        if (conflicts.hasConflicts) {
          throw new Error(`FSA冲突: ${conflicts.conflictSummary.join(', ')}`);
        }
      }

      const newGroup = await createFSAGroup(region.id, groupData);
      if (newGroup) {
        await loadGroups();
        setShowCreateDialog(false);
        onGroupsChange?.();
      }
    } catch (err) {
      console.error('创建组失败:', err);
      alert(err.message || '创建组失败');
    } finally {
      setLoading(false);
    }
  };

  // 更新组
  const handleUpdateGroup = async (groupId, updates) => {
    try {
      setLoading(true);

      // 验证更新
      if (updates.name) {
        const validation = validateGroupName(updates.name, groups, groupId);
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '));
        }
      }

      if (updates.fsaCodes) {
        const conflicts = detectFSAConflicts(updates.fsaCodes, groups, groupId);
        if (conflicts.hasConflicts) {
          throw new Error(`FSA冲突: ${conflicts.conflictSummary.join(', ')}`);
        }
      }

      const success = await updateFSAGroup(region.id, groupId, updates);
      if (success) {
        await loadGroups();
        setEditingGroup(null);
        onGroupsChange?.();
      }
    } catch (err) {
      console.error('更新组失败:', err);
      alert(err.message || '更新组失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除组
  const handleDeleteGroup = async (groupId) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    if (!confirm(`确定要删除组"${group.name}"吗？组内的FSA将返回到未分组状态。`)) {
      return;
    }

    try {
      setLoading(true);
      const success = await deleteFSAGroup(region.id, groupId);
      if (success) {
        await loadGroups();
        onGroupsChange?.();
      }
    } catch (err) {
      console.error('删除组失败:', err);
      alert('删除组失败');
    } finally {
      setLoading(false);
    }
  };

  // 切换组展开状态
  const toggleGroupExpansion = (groupId) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  if (loading && groups.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-200">FSA分组管理</h3>
          <span className="text-sm text-gray-400">
            ({groups.length} 个组, {ungroupedFSAs.length} 个未分组FSA)
          </span>
        </div>
        {!isReadOnly && (
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm"
            disabled={loading}
          >
            <Plus className="w-4 h-4" />
            创建组
          </button>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* 组列表 */}
      <div className="space-y-2">
        {groupStats.map((group) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden"
          >
            {/* 组头部 */}
            <div className="p-3 flex items-center justify-between hover:bg-gray-700/50 transition-colors">
              <div
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={() => toggleGroupExpansion(group.id)}
              >
                <button className="text-gray-500 hover:text-gray-300">
                  {expandedGroups.has(group.id) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: group.displayColor }}
                />

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-200">{group.name}</span>
                    <span className="text-sm text-gray-400">
                      ({group.stats.fsaCount} FSA)
                    </span>
                    {group.customPricing?.enabled && (
                      <span className="px-2 py-0.5 bg-green-900/30 text-green-400 text-xs rounded-full border border-green-700">
                        自定义价格
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              {!isReadOnly && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingGroup(group);
                    }}
                    className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-900/30 rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGroup(group.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* 组详情（展开时显示） */}
            <AnimatePresence>
              {expandedGroups.has(group.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-gray-700"
                >
                  <div className="p-3 bg-gray-900/30">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">FSA列表:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {group.fsaCodes?.map(fsa => (
                            <span
                              key={fsa}
                              className="px-2 py-0.5 bg-gray-800 border border-gray-600 rounded text-xs text-gray-300"
                            >
                              {fsa}
                            </span>
                          )) || <span className="text-gray-500">暂无FSA</span>}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-gray-500" />
                          <span className="text-gray-400">邮编数量:</span>
                          <span className="text-gray-300">{group.stats.postalCodeCount}</span>
                        </div>
                        {group.customPricing?.enabled && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-3 h-3 text-gray-500" />
                            <span className="text-gray-400">价格配置:</span>
                            <span className="text-green-400">已启用</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* 未分组FSA */}
      {ungroupedFSAs.length > 0 && (
        <div className="p-3 bg-gray-800/30 border border-gray-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-300">未分组FSA</span>
              <span className="text-sm text-gray-400">({ungroupedFSAs.length} 个)</span>
            </div>
          </div>

          {/* 简洁预览 - 只显示前几个FSA */}
          <div className="mt-2">
            {!showAllUngrouped ? (
              // 收起状态 - 显示简洁预览
              <div className="flex items-center gap-2">
                <div className="flex flex-wrap gap-1">
                  {ungroupedFSAs.slice(0, 5).map(fsa => (
                    <span
                      key={fsa}
                      className="px-2 py-0.5 bg-gray-800 border border-gray-600 rounded text-xs text-gray-300"
                    >
                      {fsa}
                    </span>
                  ))}
                  {ungroupedFSAs.length > 5 && (
                    <span className="text-xs text-gray-400 px-1">
                      +{ungroupedFSAs.length - 5} 更多
                    </span>
                  )}
                </div>

                {/* 展开按钮 */}
                {ungroupedFSAs.length > 5 && (
                  <button
                    onClick={() => setShowAllUngrouped(true)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    查看全部
                  </button>
                )}
              </div>
            ) : (
              // 展开状态 - 显示全部FSA
              <div>
                <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto p-2 bg-gray-900/20 rounded">
                  {ungroupedFSAs.map(fsa => (
                    <span
                      key={fsa}
                      className="px-2 py-0.5 bg-gray-800 border border-gray-600 rounded text-xs text-gray-300"
                    >
                      {fsa}
                    </span>
                  ))}
                </div>
                {/* 收起按钮 */}
                <button
                  onClick={() => setShowAllUngrouped(false)}
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  收起
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 创建/编辑对话框 */}
      {(showCreateDialog || editingGroup) && (
        <FSAGroupEditor
          group={editingGroup}
          region={region}
          existingGroups={groups}
          ungroupedFSAs={ungroupedFSAs}
          onSave={editingGroup ?
            (updates) => handleUpdateGroup(editingGroup.id, updates) :
            handleCreateGroup
          }
          onCancel={() => {
            setShowCreateDialog(false);
            setEditingGroup(null);
          }}
        />
      )}
    </div>
  );
};

export default FSAGroupManager;