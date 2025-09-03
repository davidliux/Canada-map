/**
 * Vercel Serverless Function - Supabase 集成版
 * 区域列表 API
 * GET /api/regions - 获取所有区域
 * POST /api/regions - 创建新区域
 */

import { handleCors } from '../utils/cors.js';
import { isSupabaseConfigured, regionOperations } from '../utils/supabase.js';
import { serverStorage } from '../utils/localStorage.js';

async function handler(req, res) {
  const { method } = req;
  
  // 检查是否配置了 Supabase
  const useSupabase = isSupabaseConfigured();
  
  try {
    switch (method) {
      case 'GET': {
        // 获取查询参数
        const { includeInactive, includeStats } = req.query;
        
        let regions;
        
        if (useSupabase) {
          // 优先使用 Supabase
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
        
        // 过滤非活跃区域（如果需要）
        let filteredRegions = regions;
        if (includeInactive !== 'true') {
          filteredRegions = Object.fromEntries(
            Object.entries(regions).filter(([_, region]) => region.isActive !== false)
          );
        }
        
        // 添加统计信息（如果需要）
        if (includeStats === 'true') {
          Object.keys(filteredRegions).forEach(id => {
            const region = filteredRegions[id];
            filteredRegions[id] = {
              ...region,
              stats: {
                totalFSAs: region.fsa?.length || 0,
                totalPostalCodes: region.postalCodes?.length || 0,
                activeWeightRanges: region.weightRanges?.filter(r => r.isActive).length || 0
              }
            };
          });
        }
        
        res.status(200).json({
          success: true,
          data: filteredRegions
        });
        break;
      }
      
      case 'POST': {
        // 创建新区域
        const { id, name, fsa, postalCodes, weightRanges } = req.body;
        
        // 验证必填字段
        if (!id || !name) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '区域ID和名称是必填字段'
            }
          });
        }
        
        // 检查区域是否已存在
        const existingRegion = serverStorage.getRegion(id);
        if (existingRegion) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'CONFLICT',
              message: '区域已存在'
            }
          });
        }
        
        // 创建新区域
        const newRegion = {
          id,
          name,
          fsa: fsa || [],
          postalCodes: postalCodes || [],
          weightRanges: weightRanges || [],
          isActive: true,
          createdAt: new Date().toISOString()
        };
        
        serverStorage.setRegion(id, newRegion);
        
        res.status(201).json({
          success: true,
          data: newRegion
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