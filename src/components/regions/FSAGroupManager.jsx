/**
 * FSA组管理器组件
 * 用于在卡车配送区域管理中管理FSA组
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Users, MapPin, DollarSign, ChevronDown, ChevronRight, Package, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FSAGroupEditor from './FSAGroupEditor';
import BatchFSAGroupCreator from './BatchFSAGroupCreator';
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
import { completeFSAData } from '../../data/canadaFSAData';

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
  isReadOnly = false,
  regionColor // 新增：传入区域颜色
}) => {
  const [groups, setGroups] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [editingGroup, setEditingGroup] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBatchCreate, setShowBatchCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // const [showAllUngrouped, setShowAllUngrouped] = useState(false); // 不再需要，已移除未分组FSA显示

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

  // 计算未分组的FSA（从完整的FSA数据中选择）
  const ungroupedFSAs = useMemo(() => {
    // 获取所有已分组的FSA
    const groupedFSAs = new Set();
    groups.forEach(group => {
      if (group.fsaCodes && Array.isArray(group.fsaCodes)) {
        group.fsaCodes.forEach(fsa => groupedFSAs.add(fsa));
      }
    });

    // 从完整的FSA数据中提取所有FSA代码
    const allFSAs = completeFSAData.map(item => item.fsa);

    // 找出未分组的FSA
    const ungrouped = allFSAs.filter(fsa => !groupedFSAs.has(fsa));
    console.log(`完整FSA总数: ${allFSAs.length}, 已分组: ${groupedFSAs.size}, 未分组: ${ungrouped.length}`);
    return ungrouped;
  }, [groups]);

  // 计算组统计信息
  const groupStats = useMemo(() => {
    return groups.map(group => {
      // 确保 fsaCodes 是一个数组
      const validatedGroup = {
        ...group,
        fsaCodes: Array.isArray(group.fsaCodes) ? group.fsaCodes : []
      };
      return {
        ...validatedGroup,
        stats: calculateGroupStats(validatedGroup, fsaData)
      };
    });
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

      // 确保新组包含区域颜色
      const groupWithColor = {
        ...groupData,
        displayColor: regionColor || groupData.displayColor || '#3B82F6'
      };
      const newGroup = await createFSAGroup(region.id, groupWithColor);
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

  // 批量创建组
  const handleBatchCreateGroups = async (groupsData) => {
    try {
      setLoading(true);
      let successCount = 0;
      const errors = [];
      const warnings = []; // 添加警告信息数组
      const currentGroups = [...groups]; // 使用当前组列表进行验证

      for (const groupData of groupsData) {
        try {
          // 验证组名
          const validation = validateGroupName(groupData.name, currentGroups);
          if (!validation.isValid) {
            errors.push(`${groupData.name}: ${validation.errors.join(', ')}`);
            continue;
          }

          // 检测FSA冲突并过滤
          let finalFSACodes = groupData.fsaCodes || [];
          let skippedFSAs = [];

          if (groupData.fsaCodes?.length > 0) {
            const conflicts = detectFSAConflicts(groupData.fsaCodes, currentGroups);
            if (conflicts.hasConflicts) {
              // 过滤出非冲突的 FSA
              const nonConflictingFSAs = groupData.fsaCodes.filter(
                fsa => !conflicts.conflicts.some(c => c.fsa === fsa)
              );

              skippedFSAs = conflicts.conflicts.map(c => c.fsa);

              if (nonConflictingFSAs.length > 0) {
                // 使用非冲突的 FSA
                finalFSACodes = nonConflictingFSAs;
                // 记录警告信息
                warnings.push(`${groupData.name}: 跳过了 ${skippedFSAs.length} 个已分配的FSA (${skippedFSAs.join(', ')}), 保存了 ${nonConflictingFSAs.length} 个FSA`);
                console.log(`${groupData.name}: 将跳过冲突的FSA: ${skippedFSAs.join(', ')}, 保存非冲突的FSA: ${nonConflictingFSAs.join(', ')}`);
              } else {
                // 如果所有 FSA 都冲突，跳过创建
                errors.push(`${groupData.name}: 所有FSA都已被分配到其他分组 (${skippedFSAs.join(', ')})`);
                continue;
              }
            }
          }

          // 确保新组包含区域颜色
          const groupWithColor = {
            ...groupData,
            fsaCodes: finalFSACodes, // 使用过滤后的FSA列表
            displayColor: regionColor || groupData.color || '#3B82F6'
          };

          const newGroup = await createFSAGroup(region.id, groupWithColor);
          if (newGroup) {
            successCount++;
            // 将新创建的组添加到当前组列表，以便后续验证
            currentGroups.push({
              ...groupWithColor,
              id: newGroup.id || newGroup,
              name: groupData.name,
              fsaCodes: finalFSACodes // 使用过滤后的FSA列表
            });
          }
        } catch (err) {
          errors.push(`${groupData.name}: ${err.message}`);
        }
      }

      // 显示结果
      let resultMessage = '';

      if (successCount > 0) {
        await loadGroups(); // 重新加载所有组
        resultMessage = `✅ 成功创建 ${successCount} 个分组\n`;
        onGroupsChange?.();
      }

      if (warnings.length > 0) {
        resultMessage += `\n⚠️ 警告信息:\n${warnings.join('\n')}\n`;
      }

      if (errors.length > 0) {
        resultMessage += `\n❌ 失败信息:\n${errors.join('\n')}`;
      }

      // 显示综合结果
      if (resultMessage) {
        alert(resultMessage.trim());
      }

      // 如果有成功创建的分组，关闭对话框
      if (successCount > 0) {
        setShowBatchCreate(false);
      }

    } catch (err) {
      console.error('批量创建失败:', err);
      alert(err.message || '批量创建失败');
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
            ({groups.length} 个组, {region?.fsaCodes?.length || 0} 个FSA, 可选{ungroupedFSAs.length}个FSA)
          </span>
        </div>
        {!isReadOnly && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm"
              disabled={loading}
            >
              <Plus className="w-4 h-4" />
              创建组
            </button>
            <button
              onClick={() => setShowBatchCreate(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all text-sm"
              disabled={loading}
            >
              <Layers className="w-4 h-4" />
              批量创建
            </button>
          </div>
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
                  style={{ backgroundColor: group.displayColor || regionColor || '#3B82F6' }}
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

      {/* 未分组FSA - 已移除显示 */}

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

      {/* 批量创建对话框 */}
      {showBatchCreate && (
        <BatchFSAGroupCreator
          region={region}
          existingGroups={groups}
          onSave={handleBatchCreateGroups}
          onCancel={() => setShowBatchCreate(false)}
        />
      )}
    </div>
  );
};

export default FSAGroupManager;