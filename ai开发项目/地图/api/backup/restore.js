/**
 * Vercel API: 数据恢复
 * POST /api/backup/restore - 恢复备份数据
 */

import { kvStorage } from '../../lib/kv-storage.js';

// 通用响应格式
const createResponse = (data, status = 200, message = 'Success') => {
  return new Response(JSON.stringify({
    success: status < 400,
    message,
    data,
    timestamp: new Date().toISOString()
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
};

const createErrorResponse = (message, status = 500, details = null) => {
  return createResponse({ error: message, details }, status, message);
};

export default async function handler(request) {
  // 处理CORS预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  if (request.method !== 'POST') {
    return createErrorResponse(`方法 ${request.method} 不被支持`, 405);
  }

  try {
    return await handleRestoreBackup(request);
  } catch (error) {
    console.error('恢复API错误:', error);
    return createErrorResponse('服务器内部错误', 500, error.message);
  }
}

/**
 * 恢复备份数据
 */
async function handleRestoreBackup(request) {
  try {
    const body = await request.json();
    const { backupId, backupData, restoreType = 'backup' } = body || {};

    if (restoreType === 'backup') {
      // 从备份ID恢复
      if (!backupId) {
        return createErrorResponse('备份ID不能为空', 400);
      }

      const result = await kvStorage.restoreBackup(backupId);
      return createResponse(result, 200, '备份恢复成功');
      
    } else if (restoreType === 'data') {
      // 从直接数据恢复（用于导入功能）
      if (!backupData) {
        return createErrorResponse('备份数据不能为空', 400);
      }

      const result = await restoreFromData(backupData);
      return createResponse(result, 200, '数据恢复成功');
      
    } else if (restoreType === 'default') {
      // 恢复默认演示数据
      const result = await restoreDefaultData();
      return createResponse(result, 200, '默认数据恢复成功');
      
    } else {
      return createErrorResponse('无效的恢复类型', 400);
    }
  } catch (error) {
    console.error('恢复备份失败:', error);
    return createErrorResponse('恢复备份失败', 500, error.message);
  }
}

/**
 * 从数据直接恢复
 */
async function restoreFromData(backupData) {
  try {
    let regionConfigs = {};

    // 处理不同格式的备份数据
    if (backupData.regionConfigs) {
      regionConfigs = backupData.regionConfigs;
    } else if (backupData.regions) {
      regionConfigs = backupData.regions;
    } else if (typeof backupData === 'object') {
      regionConfigs = backupData;
    } else {
      throw new Error('无效的备份数据格式');
    }

    // 验证数据格式
    if (!regionConfigs || typeof regionConfigs !== 'object') {
      throw new Error('区域配置数据格式无效');
    }

    // 保存恢复的数据
    const savedConfigs = await kvStorage.saveAllRegionConfigs(regionConfigs);
    const stats = await kvStorage.calculateStats(savedConfigs);

    // 创建恢复记录备份
    await kvStorage.createBackup(
      `恢复导入_${new Date().toISOString().split('T')[0]}`,
      'migration'
    );

    return {
      success: true,
      restoredAt: new Date().toISOString(),
      stats,
      restoredRegions: Object.keys(savedConfigs).length
    };
  } catch (error) {
    console.error('从数据恢复失败:', error);
    throw error;
  }
}

/**
 * 恢复默认演示数据
 */
async function restoreDefaultData() {
  try {
    const defaultData = {
      '1': {
        regionId: '1',
        regionName: '1区',
        isActive: true,
        postalCodes: ['V6A', 'V6B', 'V6C', 'V6E', 'V6G', 'V6H', 'V6J', 'V6K'],
        weightRanges: [
          { id: 'range_11_15', min: 11.000, max: 15.000, price: 6.21, label: '11.000-15.000 KG', isActive: true },
          { id: 'range_15_20', min: 15.000, max: 20.000, price: 8.17, label: '15.000-20.000 KG', isActive: true },
          { id: 'range_20_25', min: 20.000, max: 25.000, price: 10.93, label: '20.000-25.000 KG', isActive: true },
          { id: 'range_25_30', min: 25.000, max: 30.000, price: 13.80, label: '25.000-30.000 KG', isActive: true },
          { id: 'range_30_35', min: 30.000, max: 35.000, price: 14.95, label: '30.000-35.000 KG', isActive: true }
        ],
        lastUpdated: new Date().toISOString(),
        metadata: { version: '2.1.0', defaultPricingApplied: true, restoredAt: new Date().toISOString() }
      },
      '2': {
        regionId: '2',
        regionName: '2区',
        isActive: true,
        postalCodes: ['M5V', 'M5W', 'M5X', 'M6A', 'M6B', 'M6C', 'M6E', 'M6G'],
        weightRanges: [
          { id: 'range_11_15', min: 11.000, max: 15.000, price: 12.70, label: '11.000-15.000 KG', isActive: true },
          { id: 'range_15_20', min: 15.000, max: 20.000, price: 14.65, label: '15.000-20.000 KG', isActive: true },
          { id: 'range_20_25', min: 20.000, max: 25.000, price: 15.11, label: '20.000-25.000 KG', isActive: true },
          { id: 'range_25_30', min: 25.000, max: 30.000, price: 18.98, label: '25.000-30.000 KG', isActive: true },
          { id: 'range_30_35', min: 30.000, max: 35.000, price: 20.13, label: '30.000-35.000 KG', isActive: true }
        ],
        lastUpdated: new Date().toISOString(),
        metadata: { version: '2.1.0', defaultPricingApplied: true, restoredAt: new Date().toISOString() }
      },
      '3': {
        regionId: '3',
        regionName: '3区',
        isActive: true,
        postalCodes: ['K1A', 'K1B', 'K1C', 'K1G', 'K1H', 'K1J', 'K1K', 'K1L'],
        weightRanges: [
          { id: 'range_11_15', min: 11.000, max: 15.000, price: 12.87, label: '11.000-15.000 KG', isActive: true },
          { id: 'range_15_20', min: 15.000, max: 20.000, price: 14.82, label: '15.000-20.000 KG', isActive: true },
          { id: 'range_20_25', min: 20.000, max: 25.000, price: 15.28, label: '20.000-25.000 KG', isActive: true },
          { id: 'range_25_30', min: 25.000, max: 30.000, price: 19.90, label: '25.000-30.000 KG', isActive: true },
          { id: 'range_30_35', min: 30.000, max: 35.000, price: 21.28, label: '30.000-35.000 KG', isActive: true }
        ],
        lastUpdated: new Date().toISOString(),
        metadata: { version: '2.1.0', defaultPricingApplied: true, restoredAt: new Date().toISOString() }
      },
      '4': {
        regionId: '4',
        regionName: '4区',
        isActive: true,
        postalCodes: ['T2P', 'T2R', 'T2S', 'T2T', 'T2V', 'T2W', 'T2X', 'T2Y'],
        weightRanges: [
          { id: 'range_11_15', min: 11.000, max: 15.000, price: 7.82, label: '11.000-15.000 KG', isActive: true },
          { id: 'range_15_20', min: 15.000, max: 20.000, price: 9.09, label: '15.000-20.000 KG', isActive: true },
          { id: 'range_20_25', min: 20.000, max: 25.000, price: 12.42, label: '20.000-25.000 KG', isActive: true },
          { id: 'range_25_30', min: 25.000, max: 30.000, price: 14.95, label: '25.000-30.000 KG', isActive: true },
          { id: 'range_30_35', min: 30.000, max: 35.000, price: 16.10, label: '30.000-35.000 KG', isActive: true }
        ],
        lastUpdated: new Date().toISOString(),
        metadata: { version: '2.1.0', defaultPricingApplied: true, restoredAt: new Date().toISOString() }
      },
      '5': {
        regionId: '5',
        regionName: '5区',
        isActive: true,
        postalCodes: ['H3A', 'H3B', 'H3C', 'H3E', 'H3G', 'H3H', 'H3J', 'H3K'],
        weightRanges: [
          { id: 'range_11_15', min: 11.000, max: 15.000, price: 13.54, label: '11.000-15.000 KG', isActive: true },
          { id: 'range_15_20', min: 15.000, max: 20.000, price: 14.84, label: '15.000-20.000 KG', isActive: true },
          { id: 'range_20_25', min: 20.000, max: 25.000, price: 15.81, label: '20.000-25.000 KG', isActive: true },
          { id: 'range_25_30', min: 25.000, max: 30.000, price: 24.73, label: '25.000-30.000 KG', isActive: true },
          { id: 'range_30_35', min: 30.000, max: 35.000, price: 25.88, label: '30.000-35.000 KG', isActive: true }
        ],
        lastUpdated: new Date().toISOString(),
        metadata: { version: '2.1.0', defaultPricingApplied: true, restoredAt: new Date().toISOString() }
      }
    };

    const savedConfigs = await kvStorage.saveAllRegionConfigs(defaultData);
    const stats = await kvStorage.calculateStats(savedConfigs);

    // 创建默认数据恢复备份
    await kvStorage.createBackup(
      `默认数据恢复_${new Date().toISOString().split('T')[0]}`,
      'auto'
    );

    return {
      success: true,
      restoredAt: new Date().toISOString(),
      stats,
      restoredRegions: Object.keys(savedConfigs).length,
      type: 'default'
    };
  } catch (error) {
    console.error('恢复默认数据失败:', error);
    throw error;
  }
}
