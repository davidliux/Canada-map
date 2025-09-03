/**
 * 数据冲突解决器
 * 处理多浏览器环境下的数据冲突和合并
 */

import { getAllRegionConfigs, saveAllRegionConfigs } from './unifiedStorage.js';

/**
 * 冲突类型枚举
 */
export const CONFLICT_TYPES = {
  POSTAL_CODE_MISMATCH: 'postal_code_mismatch',
  REGION_STATUS_CONFLICT: 'region_status_conflict',
  WEIGHT_RANGE_CONFLICT: 'weight_range_conflict',
  METADATA_CONFLICT: 'metadata_conflict',
  TIMESTAMP_CONFLICT: 'timestamp_conflict'
};

/**
 * 解决策略枚举
 */
export const RESOLUTION_STRATEGIES = {
  LATEST_WINS: 'latest_wins',           // 最新数据获胜
  MERGE_UNION: 'merge_union',           // 合并（取并集）
  MERGE_INTERSECTION: 'merge_intersection', // 合并（取交集）
  USER_CHOICE: 'user_choice',           // 用户选择
  KEEP_LOCAL: 'keep_local',             // 保留本地
  KEEP_REMOTE: 'keep_remote'            // 保留远程
};

/**
 * 数据冲突解决器类
 */
export class DataConflictResolver {
  constructor() {
    this.conflictHistory = [];
    this.resolutionRules = new Map();
    this.setupDefaultRules();
  }

  /**
   * 设置默认解决规则
   */
  setupDefaultRules() {
    // 邮编冲突：合并（取并集）
    this.resolutionRules.set(CONFLICT_TYPES.POSTAL_CODE_MISMATCH, {
      strategy: RESOLUTION_STRATEGIES.MERGE_UNION,
      autoResolve: true
    });

    // 区域状态冲突：最新数据获胜
    this.resolutionRules.set(CONFLICT_TYPES.REGION_STATUS_CONFLICT, {
      strategy: RESOLUTION_STRATEGIES.LATEST_WINS,
      autoResolve: true
    });

    // 重量区间冲突：用户选择
    this.resolutionRules.set(CONFLICT_TYPES.WEIGHT_RANGE_CONFLICT, {
      strategy: RESOLUTION_STRATEGIES.USER_CHOICE,
      autoResolve: false
    });

    // 元数据冲突：最新数据获胜
    this.resolutionRules.set(CONFLICT_TYPES.METADATA_CONFLICT, {
      strategy: RESOLUTION_STRATEGIES.LATEST_WINS,
      autoResolve: true
    });

    // 时间戳冲突：最新数据获胜
    this.resolutionRules.set(CONFLICT_TYPES.TIMESTAMP_CONFLICT, {
      strategy: RESOLUTION_STRATEGIES.LATEST_WINS,
      autoResolve: true
    });
  }

  /**
   * 检测数据冲突
   * @param {Object} localData - 本地数据
   * @param {Object} remoteData - 远程数据
   * @returns {Array} 冲突列表
   */
  detectConflicts(localData, remoteData) {
    const conflicts = [];

    if (!localData || !remoteData) {
      return conflicts;
    }

    // 检查每个区域的冲突
    for (let regionId = 1; regionId <= 8; regionId++) {
      const regionKey = regionId.toString();
      const localRegion = localData[regionKey];
      const remoteRegion = remoteData[regionKey];

      if (!localRegion || !remoteRegion) continue;

      // 检测邮编冲突
      const postalCodeConflict = this.detectPostalCodeConflict(
        regionKey, localRegion, remoteRegion
      );
      if (postalCodeConflict) conflicts.push(postalCodeConflict);

      // 检测区域状态冲突
      const statusConflict = this.detectRegionStatusConflict(
        regionKey, localRegion, remoteRegion
      );
      if (statusConflict) conflicts.push(statusConflict);

      // 检测重量区间冲突
      const weightConflict = this.detectWeightRangeConflict(
        regionKey, localRegion, remoteRegion
      );
      if (weightConflict) conflicts.push(weightConflict);

      // 检测元数据冲突
      const metadataConflict = this.detectMetadataConflict(
        regionKey, localRegion, remoteRegion
      );
      if (metadataConflict) conflicts.push(metadataConflict);
    }

    return conflicts;
  }

  /**
   * 检测邮编冲突
   */
  detectPostalCodeConflict(regionId, localRegion, remoteRegion) {
    const localCodes = new Set(localRegion.postalCodes || []);
    const remoteCodes = new Set(remoteRegion.postalCodes || []);

    // 检查是否有差异
    const localOnly = [...localCodes].filter(code => !remoteCodes.has(code));
    const remoteOnly = [...remoteCodes].filter(code => !localCodes.has(code));

    if (localOnly.length > 0 || remoteOnly.length > 0) {
      return {
        type: CONFLICT_TYPES.POSTAL_CODE_MISMATCH,
        regionId,
        description: `区域${regionId}邮编数据不一致`,
        localData: [...localCodes],
        remoteData: [...remoteCodes],
        differences: {
          localOnly,
          remoteOnly,
          common: [...localCodes].filter(code => remoteCodes.has(code))
        },
        timestamp: new Date().toISOString()
      };
    }

    return null;
  }

  /**
   * 检测区域状态冲突
   */
  detectRegionStatusConflict(regionId, localRegion, remoteRegion) {
    if (localRegion.isActive !== remoteRegion.isActive) {
      return {
        type: CONFLICT_TYPES.REGION_STATUS_CONFLICT,
        regionId,
        description: `区域${regionId}状态不一致`,
        localData: localRegion.isActive,
        remoteData: remoteRegion.isActive,
        localTimestamp: localRegion.lastUpdated,
        remoteTimestamp: remoteRegion.lastUpdated,
        timestamp: new Date().toISOString()
      };
    }

    return null;
  }

  /**
   * 检测重量区间冲突
   */
  detectWeightRangeConflict(regionId, localRegion, remoteRegion) {
    const localRanges = localRegion.weightRanges || [];
    const remoteRanges = remoteRegion.weightRanges || [];

    if (JSON.stringify(localRanges) !== JSON.stringify(remoteRanges)) {
      return {
        type: CONFLICT_TYPES.WEIGHT_RANGE_CONFLICT,
        regionId,
        description: `区域${regionId}重量区间配置不一致`,
        localData: localRanges,
        remoteData: remoteRanges,
        timestamp: new Date().toISOString()
      };
    }

    return null;
  }

  /**
   * 检测元数据冲突
   */
  detectMetadataConflict(regionId, localRegion, remoteRegion) {
    const localMeta = localRegion.metadata || {};
    const remoteMeta = remoteRegion.metadata || {};

    const conflicts = [];

    // 检查版本冲突
    if (localMeta.version !== remoteMeta.version) {
      conflicts.push('version');
    }

    // 检查邮编总数冲突
    if (localMeta.totalPostalCodes !== remoteMeta.totalPostalCodes) {
      conflicts.push('totalPostalCodes');
    }

    if (conflicts.length > 0) {
      return {
        type: CONFLICT_TYPES.METADATA_CONFLICT,
        regionId,
        description: `区域${regionId}元数据不一致`,
        localData: localMeta,
        remoteData: remoteMeta,
        conflictFields: conflicts,
        timestamp: new Date().toISOString()
      };
    }

    return null;
  }

  /**
   * 解决冲突
   * @param {Array} conflicts - 冲突列表
   * @param {Object} options - 解决选项
   * @returns {Object} 解决结果
   */
  async resolveConflicts(conflicts, options = {}) {
    const resolutionResults = {
      resolved: [],
      failed: [],
      userChoiceRequired: [],
      mergedData: null
    };

    const localData = await getAllRegionConfigs();
    let mergedData = JSON.parse(JSON.stringify(localData));

    for (const conflict of conflicts) {
      try {
        const rule = this.resolutionRules.get(conflict.type);
        
        if (!rule) {
          resolutionResults.failed.push({
            conflict,
            reason: '未找到解决规则'
          });
          continue;
        }

        if (!rule.autoResolve && !options.forceResolve) {
          resolutionResults.userChoiceRequired.push(conflict);
          continue;
        }

        const resolution = await this.applyResolutionStrategy(
          conflict, rule.strategy, mergedData, options
        );

        if (resolution.success) {
          resolutionResults.resolved.push({
            conflict,
            strategy: rule.strategy,
            result: resolution.result
          });
          
          // 应用解决结果到合并数据
          this.applyResolutionToData(mergedData, conflict, resolution.result);
        } else {
          resolutionResults.failed.push({
            conflict,
            reason: resolution.error
          });
        }

      } catch (error) {
        resolutionResults.failed.push({
          conflict,
          reason: error.message
        });
      }
    }

    resolutionResults.mergedData = mergedData;

    // 记录冲突解决历史
    this.conflictHistory.push({
      timestamp: new Date().toISOString(),
      conflicts: conflicts.length,
      resolved: resolutionResults.resolved.length,
      failed: resolutionResults.failed.length,
      userChoiceRequired: resolutionResults.userChoiceRequired.length
    });

    return resolutionResults;
  }

  /**
   * 应用解决策略
   */
  async applyResolutionStrategy(conflict, strategy, mergedData, options) {
    switch (strategy) {
      case RESOLUTION_STRATEGIES.LATEST_WINS:
        return this.resolveByLatestWins(conflict);

      case RESOLUTION_STRATEGIES.MERGE_UNION:
        return this.resolveByMergeUnion(conflict);

      case RESOLUTION_STRATEGIES.MERGE_INTERSECTION:
        return this.resolveByMergeIntersection(conflict);

      case RESOLUTION_STRATEGIES.KEEP_LOCAL:
        return { success: true, result: conflict.localData };

      case RESOLUTION_STRATEGIES.KEEP_REMOTE:
        return { success: true, result: conflict.remoteData };

      case RESOLUTION_STRATEGIES.USER_CHOICE:
        if (options.userChoices && options.userChoices[conflict.regionId]) {
          return { success: true, result: options.userChoices[conflict.regionId] };
        }
        return { success: false, error: '需要用户选择' };

      default:
        return { success: false, error: '未知的解决策略' };
    }
  }

  /**
   * 最新数据获胜策略
   */
  resolveByLatestWins(conflict) {
    const localTime = new Date(conflict.localTimestamp || 0);
    const remoteTime = new Date(conflict.remoteTimestamp || 0);

    const result = localTime > remoteTime ? conflict.localData : conflict.remoteData;
    
    return {
      success: true,
      result,
      reason: `选择${localTime > remoteTime ? '本地' : '远程'}数据（更新时间：${localTime > remoteTime ? localTime : remoteTime}）`
    };
  }

  /**
   * 合并（并集）策略
   */
  resolveByMergeUnion(conflict) {
    if (conflict.type === CONFLICT_TYPES.POSTAL_CODE_MISMATCH) {
      const localCodes = new Set(conflict.localData || []);
      const remoteCodes = new Set(conflict.remoteData || []);
      const mergedCodes = [...new Set([...localCodes, ...remoteCodes])].sort();

      return {
        success: true,
        result: mergedCodes,
        reason: `合并邮编数据，本地${localCodes.size}个，远程${remoteCodes.size}个，合并后${mergedCodes.length}个`
      };
    }

    return { success: false, error: '不支持的合并类型' };
  }

  /**
   * 合并（交集）策略
   */
  resolveByMergeIntersection(conflict) {
    if (conflict.type === CONFLICT_TYPES.POSTAL_CODE_MISMATCH) {
      const localCodes = new Set(conflict.localData || []);
      const remoteCodes = new Set(conflict.remoteData || []);
      const intersectionCodes = [...localCodes].filter(code => remoteCodes.has(code)).sort();

      return {
        success: true,
        result: intersectionCodes,
        reason: `取邮编交集，本地${localCodes.size}个，远程${remoteCodes.size}个，交集${intersectionCodes.length}个`
      };
    }

    return { success: false, error: '不支持的交集类型' };
  }

  /**
   * 将解决结果应用到数据
   */
  applyResolutionToData(mergedData, conflict, result) {
    const regionData = mergedData[conflict.regionId];
    if (!regionData) return;

    switch (conflict.type) {
      case CONFLICT_TYPES.POSTAL_CODE_MISMATCH:
        regionData.postalCodes = result;
        regionData.metadata.totalPostalCodes = result.length;
        break;

      case CONFLICT_TYPES.REGION_STATUS_CONFLICT:
        regionData.isActive = result;
        break;

      case CONFLICT_TYPES.WEIGHT_RANGE_CONFLICT:
        regionData.weightRanges = result;
        break;

      case CONFLICT_TYPES.METADATA_CONFLICT:
        regionData.metadata = { ...regionData.metadata, ...result };
        break;
    }

    regionData.lastUpdated = new Date().toISOString();
  }

  /**
   * 获取冲突解决历史
   */
  getConflictHistory() {
    return this.conflictHistory;
  }

  /**
   * 设置解决规则
   */
  setResolutionRule(conflictType, strategy, autoResolve = true) {
    this.resolutionRules.set(conflictType, { strategy, autoResolve });
  }

  /**
   * 获取解决规则
   */
  getResolutionRules() {
    return Object.fromEntries(this.resolutionRules);
  }

  /**
   * 清除冲突历史
   */
  clearConflictHistory() {
    this.conflictHistory = [];
  }
}

// 创建全局实例
export const dataConflictResolver = new DataConflictResolver();

// 导出到全局对象
if (typeof window !== 'undefined') {
  window.dataConflictResolver = dataConflictResolver;
}
