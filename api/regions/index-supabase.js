/**
 * Vercel Serverless Function - Supabase 版本
 * 区域列表 API
 * GET /api/regions - 获取所有区域
 * POST /api/regions - 创建新区域
 */

import { handleCors } from '../utils/cors.js';
import { isSupabaseConfigured, regionOperations } from '../utils/supabase.js';
import { serverStorage } from '../utils/localStorage.js';

async function handler(req, res) {
  const { method } = req;
  
  // 检查是否使用 Supabase 或本地存储
  const useSupabase = isSupabaseConfigured();
  
  try {
    switch (method) {
      case 'GET': {
        const { includeInactive, includeStats } = req.query;
        
        let regions;
        
        if (useSupabase) {
          // 使用 Supabase
          try {
            regions = await regionOperations.getAllRegions(includeInactive === 'true');
          } catch (error) {
            console.error('Supabase error, falling back to localStorage:', error);
            regions = serverStorage.getAllRegions();
          }
        } else {
          // 使用本地存储
          regions = serverStorage.getAllRegions();
        }
        
        // 过滤非活跃区域（本地存储模式）
        if (!useSupabase && includeInactive !== 'true') {
          regions = Object.fromEntries(
            Object.entries(regions).filter(([_, region]) => region.isActive !== false)
          );
        }
        
        // 添加统计信息
        if (includeStats === 'true') {
          Object.keys(regions).forEach(id => {
            const region = regions[id];
            regions[id] = {
              ...region,
              stats: {
                totalFSAs: region.fsa?.length || 0,
                totalPostalCodes: region.postal_codes?.length || region.postalCodes?.length || 0,
                activeWeightRanges: (region.weight_ranges || region.weightRanges)?.filter(r => r.isActive).length || 0
              }
            };
          });
        }
        
        res.status(200).json({
          success: true,
          data: regions,
          source: useSupabase ? 'supabase' : 'localStorage'
        });
        break;
      }
      
      case 'POST': {
        const regionData = req.body;
        
        // 验证必填字段
        if (!regionData.id || !regionData.name) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '区域ID和名称是必填字段'
            }
          });
        }
        
        // 标准化字段名（兼容两种格式）
        const normalizedData = {
          id: regionData.id,
          name: regionData.name,
          fsa: regionData.fsa || [],
          postal_codes: regionData.postalCodes || regionData.postal_codes || [],
          weight_ranges: regionData.weightRanges || regionData.weight_ranges || [],
          is_active: regionData.isActive !== false
        };
        
        let newRegion;
        
        if (useSupabase) {
          // 使用 Supabase
          try {
            // 检查是否已存在
            const existing = await regionOperations.getRegion(normalizedData.id);
            if (existing) {
              return res.status(409).json({
                success: false,
                error: {
                  code: 'CONFLICT',
                  message: '区域已存在'
                }
              });
            }
            
            newRegion = await regionOperations.createRegion(normalizedData);
          } catch (error) {
            console.error('Supabase error:', error);
            // 降级到本地存储
            serverStorage.setRegion(normalizedData.id, normalizedData);
            newRegion = normalizedData;
          }
        } else {
          // 使用本地存储
          const existing = serverStorage.getRegion(normalizedData.id);
          if (existing) {
            return res.status(409).json({
              success: false,
              error: {
                code: 'CONFLICT',
                message: '区域已存在'
              }
            });
          }
          
          serverStorage.setRegion(normalizedData.id, normalizedData);
          newRegion = normalizedData;
        }
        
        res.status(201).json({
          success: true,
          data: newRegion,
          source: useSupabase ? 'supabase' : 'localStorage'
        });
        break;
      }
      
      default:
        res.status(405).json({
          success: false,
          error: {
            code: 'METHOD_NOT_ALLOWED',
            message: `Method ${method} not allowed`
          }
        });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Internal server error'
      }
    });
  }
}

export default handleCors(handler);