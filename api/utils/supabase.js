/**
 * Supabase 客户端配置
 * 用于 Vercel Serverless Functions
 */

import { createClient } from '@supabase/supabase-js';

// 从环境变量获取 Supabase 配置
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 创建 Supabase 客户端
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// 检查 Supabase 是否可用
export const isSupabaseConfigured = () => {
  return supabase !== null;
};

/**
 * 区域数据操作辅助函数
 */
export const regionOperations = {
  // 获取所有区域
  async getAllRegions(includeInactive = false) {
    if (!supabase) return null;
    
    let query = supabase
      .from('delivery_regions')
      .select('*');
    
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    // 转换为对象格式（兼容现有前端）
    const regions = {};
    data?.forEach(region => {
      regions[region.id] = region;
    });
    
    return regions;
  },
  
  // 获取单个区域
  async getRegion(id) {
    if (!supabase) return null;
    
    const { data, error } = await supabase
      .from('delivery_regions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // 未找到
      throw error;
    }
    
    return data;
  },
  
  // 创建区域
  async createRegion(regionData) {
    if (!supabase) return null;
    
    const { data, error } = await supabase
      .from('delivery_regions')
      .insert([regionData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // 更新区域
  async updateRegion(id, updates) {
    if (!supabase) return null;
    
    const { data, error } = await supabase
      .from('delivery_regions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // 删除区域
  async deleteRegion(id) {
    if (!supabase) return null;
    
    const { error } = await supabase
      .from('delivery_regions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};

/**
 * 创建 Supabase 表的 SQL（供参考）
 * 
 * -- 创建区域表
 * CREATE TABLE delivery_regions (
 *   id VARCHAR(10) PRIMARY KEY,
 *   name VARCHAR(100) NOT NULL,
 *   fsa JSONB DEFAULT '[]',
 *   postal_codes JSONB DEFAULT '[]',
 *   weight_ranges JSONB DEFAULT '[]',
 *   is_active BOOLEAN DEFAULT true,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * -- 创建更新时间触发器
 * CREATE OR REPLACE FUNCTION update_updated_at()
 * RETURNS TRIGGER AS $$
 * BEGIN
 *   NEW.updated_at = NOW();
 *   RETURN NEW;
 * END;
 * $$ LANGUAGE plpgsql;
 * 
 * CREATE TRIGGER update_delivery_regions_updated_at
 * BEFORE UPDATE ON delivery_regions
 * FOR EACH ROW
 * EXECUTE FUNCTION update_updated_at();
 */