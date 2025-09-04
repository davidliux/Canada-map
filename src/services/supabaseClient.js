/**
 * Supabase 客户端配置
 * 提供数据持久化存储服务
 */

import { createClient } from '@supabase/supabase-js';

// 从环境变量获取配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 创建 Supabase 客户端（如果配置存在）
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// 检查 Supabase 是否已配置
export const isSupabaseConfigured = () => {
  return supabase !== null;
};

/**
 * 区域数据操作
 */
export const regionService = {
  /**
   * 获取所有区域
   */
  async getAllRegions() {
    if (!supabase) return null;
    
    try {
      const { data, error } = await supabase
        .from('regions')
        .select('*')
        .order('id');
      
      if (error) throw error;
      
      // 转换为兼容的格式
      const regions = {};
      data?.forEach(region => {
        regions[region.id] = {
          ...region,
          fsaCodes: region.fsa_codes || [],
          postalCodes: region.postal_codes || [],
          weightRanges: region.weight_ranges || [],
          isActive: region.is_active
        };
      });
      
      return regions;
    } catch (error) {
      console.error('获取区域数据失败:', error);
      return null;
    }
  },

  /**
   * 获取单个区域
   */
  async getRegion(id) {
    if (!supabase) return null;
    
    try {
      const { data, error } = await supabase
        .from('regions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return {
        ...data,
        fsaCodes: data.fsa_codes || [],
        postalCodes: data.postal_codes || [],
        weightRanges: data.weight_ranges || [],
        isActive: data.is_active
      };
    } catch (error) {
      console.error(`获取区域 ${id} 失败:`, error);
      return null;
    }
  },

  /**
   * 创建或更新区域
   */
  async upsertRegion(regionData) {
    if (!supabase) return null;
    
    try {
      // 转换格式
      const dbData = {
        id: regionData.id,
        name: regionData.name,
        fsa_codes: regionData.fsaCodes || regionData.fsa_codes || [],
        postal_codes: regionData.postalCodes || regionData.postal_codes || [],
        weight_ranges: regionData.weightRanges || regionData.weight_ranges || [],
        is_active: regionData.isActive !== undefined ? regionData.isActive : true,
        metadata: regionData.metadata || {}
      };
      
      const { data, error } = await supabase
        .from('regions')
        .upsert(dbData)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        ...data,
        fsaCodes: data.fsa_codes,
        postalCodes: data.postal_codes,
        weightRanges: data.weight_ranges,
        isActive: data.is_active
      };
    } catch (error) {
      console.error('保存区域数据失败:', error);
      return null;
    }
  },

  /**
   * 删除区域
   */
  async deleteRegion(id) {
    if (!supabase) return null;
    
    try {
      const { error } = await supabase
        .from('regions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`删除区域 ${id} 失败:`, error);
      return false;
    }
  },

  /**
   * 批量更新区域FSA
   */
  async updateRegionFSAs(regionId, fsaCodes) {
    if (!supabase) return null;
    
    try {
      const { data, error } = await supabase
        .from('regions')
        .update({ fsa_codes: fsaCodes })
        .eq('id', regionId)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        ...data,
        fsaCodes: data.fsa_codes,
        postalCodes: data.postal_codes,
        weightRanges: data.weight_ranges,
        isActive: data.is_active
      };
    } catch (error) {
      console.error(`更新区域 ${regionId} FSA失败:`, error);
      return null;
    }
  },

  /**
   * 订阅区域变化（实时更新）
   */
  subscribeToChanges(callback) {
    if (!supabase) return null;
    
    const subscription = supabase
      .channel('regions_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'regions' },
        (payload) => {
          console.log('区域数据变化:', payload);
          callback(payload);
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }
};

/**
 * 数据迁移工具
 */
export const migrationService = {
  /**
   * 从 localStorage 迁移到 Supabase
   */
  async migrateFromLocalStorage() {
    if (!supabase) {
      console.error('Supabase 未配置');
      return false;
    }
    
    console.log('🚀 开始迁移数据到 Supabase...');
    
    try {
      // 获取所有 localStorage 中的区域数据
      const regionKeys = Object.keys(localStorage).filter(key => key.startsWith('region_'));
      const regions = [];
      
      for (const key of regionKeys) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const region = JSON.parse(data);
            regions.push({
              id: region.id,
              name: region.name,
              fsa_codes: region.fsaCodes || [],
              postal_codes: region.postalCodes || [],
              weight_ranges: Array.isArray(region.weightRanges) ? region.weightRanges : [],
              is_active: region.isActive !== undefined ? region.isActive : true,
              metadata: region.metadata || {}
            });
          } catch (e) {
            console.error(`解析 ${key} 失败:`, e);
          }
        }
      }
      
      if (regions.length === 0) {
        console.log('没有找到需要迁移的数据');
        return false;
      }
      
      // 批量插入到 Supabase
      const { error } = await supabase
        .from('regions')
        .upsert(regions);
      
      if (error) throw error;
      
      console.log(`✅ 成功迁移 ${regions.length} 个区域到 Supabase`);
      
      // 可选：清理 localStorage
      if (window.confirm('数据已成功迁移到云端。是否清理本地存储？')) {
        regionKeys.forEach(key => localStorage.removeItem(key));
        console.log('✅ 本地存储已清理');
      }
      
      return true;
    } catch (error) {
      console.error('数据迁移失败:', error);
      return false;
    }
  },

  /**
   * 从 Supabase 同步到 localStorage（备份）
   */
  async syncToLocalStorage() {
    if (!supabase) return false;
    
    try {
      const regions = await regionService.getAllRegions();
      
      if (regions) {
        Object.entries(regions).forEach(([id, region]) => {
          localStorage.setItem(`region_${id}`, JSON.stringify(region));
        });
        
        console.log('✅ 数据已同步到本地存储');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('同步到本地存储失败:', error);
      return false;
    }
  }
};

// 导出到全局（用于调试）
if (typeof window !== 'undefined') {
  window.supabaseService = {
    isConfigured: isSupabaseConfigured(),
    client: supabase,
    regions: regionService,
    migration: migrationService
  };
  
  if (isSupabaseConfigured()) {
    console.log('✅ Supabase 已配置并连接');
    console.log('  - 使用 supabaseService.regions 访问区域数据');
    console.log('  - 使用 supabaseService.migration.migrateFromLocalStorage() 迁移数据');
  } else {
    console.log('⚠️ Supabase 未配置，使用本地存储');
    console.log('  - 请在 .env.local 中配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
  }
}

export default {
  supabase,
  isSupabaseConfigured,
  regionService,
  migrationService
};