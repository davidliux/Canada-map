/**
 * 统一导出工具函数
 * 使用云端优先存储系统替代原有的localStorage存储
 */

// 导出云端优先存储系统
export { 
  cloudStorage, 
  CLOUD_STORAGE_KEYS, 
  SYNC_STATUS 
} from './cloudFirstStorage';

// 导出原有的统一存储系统（仅用于兼容）
export { 
  DEFAULT_WEIGHT_RANGES,
  createDefaultRegionConfig,
  validateRegionConfig
} from './unifiedStorage';

// 导出数据更新通知器
export { 
  dataUpdateNotifier,
  notifyRegionUpdate,
  notifyGlobalRefresh
} from './dataUpdateNotifier';

// 导出数据恢复工具
export {
  recoverLegacyData,
  checkDataIntegrity
} from './dataRecovery';

// 导出数据持久化工具
export {
  createDataBackup,
  restoreDataBackup,
  startAutoBackup
} from './dataPersistence';

// 导出配送区域过滤器
export {
  filterByProvince,
  filterByRegion,
  filterBySearchQuery
} from './deliveryAreaFilter';

// 导出报价生成器
export {
  generateQuotationHTML,
  printQuotation
} from './quotationGenerator';

// 导出环境配置
export const envConfig = {
  isProduction: typeof window !== 'undefined' && (
    window.location.hostname.includes('vercel.app') ||
    window.location.hostname.includes('canada-map')
  ),
  useApi: true,
  apiBaseUrl: '/api',
  version: '3.0.0',
  buildDate: new Date().toISOString()
};
