/**
 * FSA组验证和冲突检测工具
 * 提供FSA组管理的验证、冲突检测和辅助功能
 */

/**
 * 验证组名称
 * @param {string} name - 组名称
 * @param {Array} existingGroups - 现有组列表
 * @param {string} excludeGroupId - 排除的组ID（用于编辑时）
 * @returns {Object} 验证结果
 */
export const validateGroupName = (name, existingGroups = [], excludeGroupId = null) => {
  const errors = [];

  // 检查名称是否为空
  if (!name || name.trim() === '') {
    errors.push('组名称不能为空');
    return { isValid: false, errors };
  }

  // 检查名称长度
  if (name.length < 1 || name.length > 50) {
    errors.push('组名称长度必须在1-50字符之间');
    return { isValid: false, errors };
  }

  // 检查名称是否包含非法字符
  const invalidChars = /[<>:"\/\\|?*]/;
  if (invalidChars.test(name)) {
    errors.push('组名称不能包含特殊字符: < > : " / \\ | ? *');
    return { isValid: false, errors };
  }

  // 检查名称唯一性
  const duplicateGroup = existingGroups.find(g =>
    g.name === name && g.id !== excludeGroupId
  );
  if (duplicateGroup) {
    errors.push(`组名称"${name}"已存在`);
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
};

/**
 * 检测FSA分配冲突
 * @param {Array} fsaCodes - 要分配的FSA代码列表
 * @param {Array} existingGroups - 现有组列表
 * @param {string} excludeGroupId - 排除的组ID（用于编辑时）
 * @returns {Object} 冲突检测结果
 */
export const detectFSAConflicts = (fsaCodes, existingGroups = [], excludeGroupId = null) => {
  const conflicts = [];
  const conflictMap = new Map();

  fsaCodes.forEach(fsa => {
    const conflictingGroup = existingGroups.find(g =>
      g.id !== excludeGroupId && g.fsaCodes && g.fsaCodes.includes(fsa)
    );

    if (conflictingGroup) {
      conflicts.push({
        fsa,
        groupId: conflictingGroup.id,
        groupName: conflictingGroup.name
      });

      if (!conflictMap.has(conflictingGroup.name)) {
        conflictMap.set(conflictingGroup.name, []);
      }
      conflictMap.get(conflictingGroup.name).push(fsa);
    }
  });

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    conflictMap,
    conflictSummary: Array.from(conflictMap.entries()).map(([groupName, fsas]) =>
      `${fsas.join(', ')} 已在组"${groupName}"中`
    )
  };
};

/**
 * 验证FSA代码属于区域
 * @param {Array} fsaCodes - FSA代码列表
 * @param {Array} regionFSAs - 区域的FSA列表
 * @returns {Object} 验证结果
 */
export const validateFSABelongsToRegion = (fsaCodes, regionFSAs) => {
  const invalidFSAs = fsaCodes.filter(fsa => !regionFSAs.includes(fsa));

  return {
    isValid: invalidFSAs.length === 0,
    invalidFSAs,
    errorMessage: invalidFSAs.length > 0
      ? `以下FSA不属于该区域: ${invalidFSAs.join(', ')}`
      : null
  };
};

/**
 * 获取未分组的FSA列表
 * @param {Array} allFSAs - 区域的所有FSA
 * @param {Array} groups - 现有组列表
 * @returns {Array} 未分组的FSA列表
 */
export const getUngroupedFSAs = (allFSAs, groups = []) => {
  const groupedFSAs = new Set();

  groups.forEach(group => {
    if (group.fsaCodes) {
      group.fsaCodes.forEach(fsa => groupedFSAs.add(fsa));
    }
  });

  return allFSAs.filter(fsa => !groupedFSAs.has(fsa));
};

/**
 * 验证组数量限制
 * @param {Array} existingGroups - 现有组列表
 * @param {number} maxGroups - 最大组数量（默认20）
 * @returns {Object} 验证结果
 */
export const validateGroupLimit = (existingGroups = [], maxGroups = 20) => {
  const currentCount = existingGroups.length;

  return {
    isValid: currentCount < maxGroups,
    currentCount,
    maxGroups,
    canAddMore: currentCount < maxGroups,
    errorMessage: currentCount >= maxGroups
      ? `已达到最大组数量限制（${maxGroups}个）`
      : null
  };
};

/**
 * 验证价格配置
 * @param {Object} pricingConfig - 价格配置
 * @returns {Object} 验证结果
 */
export const validateGroupPricing = (pricingConfig) => {
  const errors = [];

  if (!pricingConfig) {
    return { isValid: true, errors: [] }; // 价格配置是可选的
  }

  if (pricingConfig.enabled && !Array.isArray(pricingConfig.weightRanges)) {
    errors.push('启用自定义价格时必须提供重量区间配置');
  }

  if (pricingConfig.weightRanges) {
    // 验证重量区间
    const ranges = pricingConfig.weightRanges;

    // 检查是否有重叠
    for (let i = 0; i < ranges.length - 1; i++) {
      const current = ranges[i];
      const next = ranges[i + 1];

      if (current.max >= next.min) {
        errors.push(`重量区间重叠: ${current.label} 和 ${next.label}`);
      }
    }

    // 检查价格是否为有效数字
    ranges.forEach(range => {
      if (range.price !== undefined && (isNaN(range.price) || range.price < 0)) {
        errors.push(`无效的价格值: ${range.label}`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 批量移动FSA到组
 * @param {Array} fsaCodes - 要移动的FSA代码列表
 * @param {string} targetGroupId - 目标组ID（null表示移到未分组）
 * @param {Array} groups - 现有组列表
 * @returns {Object} 移动结果和更新后的组列表
 */
export const batchMoveFSAs = (fsaCodes, targetGroupId, groups) => {
  const updatedGroups = JSON.parse(JSON.stringify(groups)); // 深拷贝
  const movedFSAs = [];
  const failedFSAs = [];

  fsaCodes.forEach(fsa => {
    // 从所有组中移除该FSA
    updatedGroups.forEach(group => {
      if (group.fsaCodes) {
        const index = group.fsaCodes.indexOf(fsa);
        if (index > -1) {
          group.fsaCodes.splice(index, 1);
        }
      }
    });

    // 添加到目标组
    if (targetGroupId) {
      const targetGroup = updatedGroups.find(g => g.id === targetGroupId);
      if (targetGroup) {
        if (!targetGroup.fsaCodes) {
          targetGroup.fsaCodes = [];
        }
        targetGroup.fsaCodes.push(fsa);
        movedFSAs.push(fsa);
      } else {
        failedFSAs.push(fsa);
      }
    } else {
      // 移到未分组（已经从所有组中移除）
      movedFSAs.push(fsa);
    }
  });

  return {
    success: failedFSAs.length === 0,
    updatedGroups,
    movedFSAs,
    failedFSAs,
    summary: `成功移动 ${movedFSAs.length} 个FSA${failedFSAs.length > 0 ? `，失败 ${failedFSAs.length} 个` : ''}`
  };
};

/**
 * 获取组的建议名称
 * @param {Array} existingGroups - 现有组列表
 * @param {string} baseName - 基础名称
 * @returns {string} 建议的唯一名称
 */
export const suggestGroupName = (existingGroups = [], baseName = '新组') => {
  const existingNames = new Set(existingGroups.map(g => g.name));

  if (!existingNames.has(baseName)) {
    return baseName;
  }

  // 尝试添加数字后缀
  let counter = 1;
  let suggestedName;

  do {
    suggestedName = `${baseName} ${counter}`;
    counter++;
  } while (existingNames.has(suggestedName) && counter < 100);

  return suggestedName;
};

/**
 * 计算组的统计信息
 * @param {Object} group - 组对象
 * @param {Object} fsaData - FSA数据（包含邮编数量等信息）
 * @returns {Object} 统计信息
 */
export const calculateGroupStats = (group, fsaData = {}) => {
  const stats = {
    fsaCount: group.fsaCodes ? group.fsaCodes.length : 0,
    postalCodeCount: 0,
    hasPricing: group.customPricing && group.customPricing.enabled,
    createdAt: group.metadata?.createdAt,
    updatedAt: group.metadata?.updatedAt
  };

  // 计算邮编总数
  if (group.fsaCodes && fsaData) {
    group.fsaCodes.forEach(fsa => {
      if (fsaData[fsa] && fsaData[fsa].postalCodes) {
        stats.postalCodeCount += fsaData[fsa].postalCodes.length;
      }
    });
  }

  return stats;
};

/**
 * 合并多个组
 * @param {Array} groupIds - 要合并的组ID列表
 * @param {Array} groups - 所有组列表
 * @param {string} newName - 新组名称
 * @returns {Object} 合并结果
 */
export const mergeGroups = (groupIds, groups, newName) => {
  const groupsToMerge = groups.filter(g => groupIds.includes(g.id));

  if (groupsToMerge.length < 2) {
    return {
      success: false,
      error: '至少需要选择2个组进行合并'
    };
  }

  // 收集所有FSA
  const mergedFSAs = new Set();
  let hasCustomPricing = false;

  groupsToMerge.forEach(group => {
    if (group.fsaCodes) {
      group.fsaCodes.forEach(fsa => mergedFSAs.add(fsa));
    }
    if (group.customPricing && group.customPricing.enabled) {
      hasCustomPricing = true;
    }
  });

  // 创建新组
  const mergedGroup = {
    id: 'group-' + Date.now() + '-merged',
    name: newName,
    fsaCodes: Array.from(mergedFSAs),
    customPricing: {
      enabled: false,
      weightRanges: []
    },
    displayColor: groupsToMerge[0].displayColor, // 使用第一个组的颜色
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mergedFrom: groupIds
    }
  };

  // 更新组列表（移除旧组，添加新组）
  const updatedGroups = groups.filter(g => !groupIds.includes(g.id));
  updatedGroups.push(mergedGroup);

  return {
    success: true,
    mergedGroup,
    updatedGroups,
    mergedCount: groupsToMerge.length,
    fsaCount: mergedGroup.fsaCodes.length,
    warning: hasCustomPricing ? '合并的组中有自定义价格配置，需要重新配置新组的价格' : null
  };
};

/**
 * 导出组配置
 * @param {Array} groups - 组列表
 * @param {string} regionId - 区域ID
 * @param {string} regionName - 区域名称
 * @returns {Object} 导出数据
 */
export const exportGroupConfiguration = (groups, regionId, regionName) => {
  return {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    region: {
      id: regionId,
      name: regionName
    },
    groups: groups.map(group => ({
      id: group.id,
      name: group.name,
      fsaCodes: group.fsaCodes,
      customPricing: group.customPricing,
      displayColor: group.displayColor,
      metadata: group.metadata
    })),
    statistics: {
      totalGroups: groups.length,
      totalFSAs: groups.reduce((sum, g) => sum + (g.fsaCodes ? g.fsaCodes.length : 0), 0),
      groupsWithPricing: groups.filter(g => g.customPricing && g.customPricing.enabled).length
    }
  };
};

/**
 * 导入组配置验证
 * @param {Object} importData - 导入的数据
 * @param {Array} regionFSAs - 区域的FSA列表
 * @param {Array} existingGroups - 现有组列表
 * @returns {Object} 验证结果
 */
export const validateGroupImport = (importData, regionFSAs, existingGroups = []) => {
  const errors = [];
  const warnings = [];
  const validGroups = [];

  if (!importData.groups || !Array.isArray(importData.groups)) {
    errors.push('导入数据格式错误：缺少groups数组');
    return { isValid: false, errors, warnings, validGroups };
  }

  importData.groups.forEach((group, index) => {
    const groupErrors = [];
    const groupWarnings = [];

    // 验证必填字段
    if (!group.name) {
      groupErrors.push(`组 ${index + 1}: 缺少名称`);
    }

    if (!group.fsaCodes || !Array.isArray(group.fsaCodes)) {
      groupErrors.push(`组 "${group.name || index + 1}": 缺少FSA列表`);
    } else {
      // 验证FSA属于区域
      const invalidFSAs = group.fsaCodes.filter(fsa => !regionFSAs.includes(fsa));
      if (invalidFSAs.length > 0) {
        groupWarnings.push(`组 "${group.name}": ${invalidFSAs.join(', ')} 不属于当前区域，将被忽略`);
        group.fsaCodes = group.fsaCodes.filter(fsa => regionFSAs.includes(fsa));
      }
    }

    // 检查名称冲突
    if (existingGroups.some(g => g.name === group.name)) {
      groupWarnings.push(`组名称 "${group.name}" 已存在，将自动重命名`);
      group.name = suggestGroupName(existingGroups, group.name);
    }

    if (groupErrors.length === 0) {
      validGroups.push(group);
      warnings.push(...groupWarnings);
    } else {
      errors.push(...groupErrors);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    validGroups,
    summary: {
      totalGroups: importData.groups.length,
      validGroups: validGroups.length,
      invalidGroups: importData.groups.length - validGroups.length
    }
  };
};