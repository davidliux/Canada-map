// Vercel Serverless Functions 配置
// 支持多种数据库选项：Supabase, PlanetScale, Vercel KV

import { createClient } from '@supabase/supabase-js';

// 数据库配置
const DB_CONFIG = {
  // Supabase 配置 (推荐)
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  
  // Vercel KV 配置 (备选)
  kv: {
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN
  }
};

// 创建Supabase客户端
let supabase = null;
if (DB_CONFIG.supabase.url && DB_CONFIG.supabase.key) {
  supabase = createClient(
    DB_CONFIG.supabase.url, 
    DB_CONFIG.supabase.serviceKey || DB_CONFIG.supabase.key
  );
}

// 数据库表名配置
export const TABLES = {
  DELIVERY_REGIONS: 'delivery_regions',
  POSTAL_CODES: 'postal_codes', 
  WEIGHT_RANGES: 'weight_ranges',
  SYSTEM_CONFIGS: 'system_configs',
  DATA_BACKUPS: 'data_backups',
  OPERATION_LOGS: 'operation_logs'
};

// 通用响应格式
export const createResponse = (data, status = 200, message = 'Success') => {
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

// 错误响应
export const createErrorResponse = (message, status = 500, details = null) => {
  return createResponse({ error: message, details }, status, message);
};

// 数据库操作类
export class DatabaseService {
  constructor() {
    this.client = supabase;
  }

  // 检查数据库连接
  async checkConnection() {
    if (!this.client) {
      throw new Error('数据库未配置');
    }
    
    try {
      const { data, error } = await this.client
        .from(TABLES.SYSTEM_CONFIGS)
        .select('count')
        .limit(1);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('数据库连接检查失败:', error);
      return false;
    }
  }

  // 获取所有区域配置
  async getAllRegions() {
    const { data: regions, error: regionsError } = await this.client
      .from(TABLES.DELIVERY_REGIONS)
      .select('*')
      .order('region_id');

    if (regionsError) throw regionsError;

    // 获取每个区域的邮编和价格配置
    const regionsWithDetails = await Promise.all(
      regions.map(async (region) => {
        // 获取邮编
        const { data: postalCodes } = await this.client
          .from(TABLES.POSTAL_CODES)
          .select('fsa_code')
          .eq('region_id', region.region_id)
          .eq('is_active', true);

        // 获取重量区间
        const { data: weightRanges } = await this.client
          .from(TABLES.WEIGHT_RANGES)
          .select('*')
          .eq('region_id', region.region_id)
          .order('min_weight');

        return {
          ...region,
          postalCodes: postalCodes?.map(pc => pc.fsa_code) || [],
          weightRanges: weightRanges || [],
          metadata: region.metadata ? JSON.parse(region.metadata) : {}
        };
      })
    );

    return regionsWithDetails;
  }

  // 保存区域配置
  async saveRegion(regionData) {
    const { 
      region_id, 
      region_name, 
      is_active, 
      postalCodes = [], 
      weightRanges = [],
      metadata = {}
    } = regionData;

    // 开始事务
    try {
      // 1. 保存或更新区域基本信息
      const { data: region, error: regionError } = await this.client
        .from(TABLES.DELIVERY_REGIONS)
        .upsert({
          region_id,
          region_name,
          is_active,
          metadata: JSON.stringify(metadata),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (regionError) throw regionError;

      // 2. 删除旧的邮编配置
      await this.client
        .from(TABLES.POSTAL_CODES)
        .delete()
        .eq('region_id', region_id);

      // 3. 插入新的邮编配置
      if (postalCodes.length > 0) {
        const postalCodeData = postalCodes.map(fsa => ({
          fsa_code: fsa,
          region_id,
          is_active: true
        }));

        const { error: postalError } = await this.client
          .from(TABLES.POSTAL_CODES)
          .insert(postalCodeData);

        if (postalError) throw postalError;
      }

      // 4. 删除旧的重量区间配置
      await this.client
        .from(TABLES.WEIGHT_RANGES)
        .delete()
        .eq('region_id', region_id);

      // 5. 插入新的重量区间配置
      if (weightRanges.length > 0) {
        const weightRangeData = weightRanges.map(range => ({
          region_id,
          range_id: range.id,
          min_weight: range.min,
          max_weight: range.max,
          price: range.price,
          label: range.label,
          is_active: range.isActive !== false
        }));

        const { error: weightError } = await this.client
          .from(TABLES.WEIGHT_RANGES)
          .insert(weightRangeData);

        if (weightError) throw weightError;
      }

      // 6. 记录操作日志
      await this.logOperation('update', 'delivery_regions', region_id, null, regionData);

      return region;
    } catch (error) {
      console.error('保存区域配置失败:', error);
      throw error;
    }
  }

  // 删除区域
  async deleteRegion(regionId) {
    const { error } = await this.client
      .from(TABLES.DELIVERY_REGIONS)
      .delete()
      .eq('region_id', regionId);

    if (error) throw error;

    await this.logOperation('delete', 'delivery_regions', regionId);
    return true;
  }

  // 创建数据备份
  async createBackup(backupName, backupType = 'manual') {
    const allData = await this.getAllRegions();
    
    const backupData = {
      regions: allData,
      timestamp: new Date().toISOString(),
      version: '2.1.0',
      type: backupType
    };

    const { data, error } = await this.client
      .from(TABLES.DATA_BACKUPS)
      .insert({
        backup_name: backupName,
        backup_type: backupType,
        backup_data: JSON.stringify(backupData),
        file_size: JSON.stringify(backupData).length
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 恢复数据备份
  async restoreBackup(backupId) {
    const { data: backup, error } = await this.client
      .from(TABLES.DATA_BACKUPS)
      .select('backup_data')
      .eq('id', backupId)
      .single();

    if (error) throw error;

    const backupData = JSON.parse(backup.backup_data);
    
    // 清除现有数据
    await this.client.from(TABLES.WEIGHT_RANGES).delete().neq('id', 0);
    await this.client.from(TABLES.POSTAL_CODES).delete().neq('id', 0);
    await this.client.from(TABLES.DELIVERY_REGIONS).delete().neq('id', 0);

    // 恢复数据
    for (const region of backupData.regions) {
      await this.saveRegion(region);
    }

    await this.logOperation('restore', 'data_backups', backupId);
    return true;
  }

  // 记录操作日志
  async logOperation(operationType, tableName, recordId, oldData = null, newData = null) {
    try {
      await this.client
        .from(TABLES.OPERATION_LOGS)
        .insert({
          operation_type: operationType,
          table_name: tableName,
          record_id: recordId,
          old_data: oldData ? JSON.stringify(oldData) : null,
          new_data: newData ? JSON.stringify(newData) : null
        });
    } catch (error) {
      console.error('记录操作日志失败:', error);
      // 不抛出错误，避免影响主要操作
    }
  }
}

export default DatabaseService;
