/**
 * Vercel Serverless Function - Supabase 集成版
 * 区域详情 API
 * GET /api/regions/[id] - 获取区域详情
 * PUT /api/regions/[id] - 更新区域
 * DELETE /api/regions/[id] - 删除区域
 */

import { handleCors } from '../utils/cors.js';
import { isSupabaseConfigured, regionOperations } from '../utils/supabase.js';
import { serverStorage } from '../utils/localStorage.js';

async function handler(req, res) {
  const { method, query } = req;
  const { id } = query;
  
  // 检查是否配置了 Supabase
  const useSupabase = isSupabaseConfigured();
  
  if (!id) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_ID',
        message: '缺少区域ID参数'
      }
    });
  }
  
  try {
    switch (method) {
      case 'GET': {
        let region;
        
        if (useSupabase) {
          try {
            region = await regionOperations.getRegion(id);
          } catch (error) {
            console.error('Supabase error, falling back to localStorage:', error);
            region = serverStorage.getRegion(id);
          }
        } else {
          region = serverStorage.getRegion(id);
        }
        
        if (!region) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: '区域不存在'
            }
          });
        }
        
        res.status(200).json({
          success: true,
          data: region,
          source: useSupabase ? 'supabase' : 'localStorage'
        });
        break;
      }
      
      case 'PUT': {
        const updates = req.body;
        
        // 验证是否有更新内容
        if (!updates || Object.keys(updates).length === 0) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'NO_UPDATES',
              message: '没有提供更新内容'
            }
          });
        }
        
        let updatedRegion;
        
        if (useSupabase) {
          try {
            // 检查区域是否存在
            const existing = await regionOperations.getRegion(id);
            if (!existing) {
              return res.status(404).json({
                success: false,
                error: {
                  code: 'NOT_FOUND',
                  message: '区域不存在'
                }
              });
            }
            
            // 标准化字段名
            const normalizedUpdates = {
              ...updates,
              postal_codes: updates.postalCodes || updates.postal_codes,
              weight_ranges: updates.weightRanges || updates.weight_ranges,
              is_active: updates.isActive !== undefined ? updates.isActive : updates.is_active
            };
            
            // 清理未定义的字段
            Object.keys(normalizedUpdates).forEach(key => {
              if (normalizedUpdates[key] === undefined) {
                delete normalizedUpdates[key];
              }
            });
            
            updatedRegion = await regionOperations.updateRegion(id, normalizedUpdates);
          } catch (error) {
            console.error('Supabase error, falling back to localStorage:', error);
            // 降级到本地存储
            const existing = serverStorage.getRegion(id);
            if (!existing) {
              return res.status(404).json({
                success: false,
                error: {
                  code: 'NOT_FOUND',
                  message: '区域不存在'
                }
              });
            }
            updatedRegion = { ...existing, ...updates };
            serverStorage.setRegion(id, updatedRegion);
          }
        } else {
          // 使用本地存储
          const existing = serverStorage.getRegion(id);
          if (!existing) {
            return res.status(404).json({
              success: false,
              error: {
                code: 'NOT_FOUND',
                message: '区域不存在'
              }
            });
          }
          
          updatedRegion = { ...existing, ...updates };
          serverStorage.setRegion(id, updatedRegion);
        }
        
        res.status(200).json({
          success: true,
          data: updatedRegion,
          source: useSupabase ? 'supabase' : 'localStorage'
        });
        break;
      }
      
      case 'PATCH': {
        // 部分更新（与 PUT 类似但更宽松）
        const updates = req.body;
        
        let updatedRegion;
        
        if (useSupabase) {
          try {
            const existing = await regionOperations.getRegion(id);
            if (!existing) {
              return res.status(404).json({
                success: false,
                error: {
                  code: 'NOT_FOUND',
                  message: '区域不存在'
                }
              });
            }
            
            // 合并更新
            const normalizedUpdates = {
              ...updates,
              postal_codes: updates.postalCodes || updates.postal_codes,
              weight_ranges: updates.weightRanges || updates.weight_ranges,
              is_active: updates.isActive !== undefined ? updates.isActive : updates.is_active
            };
            
            // 清理未定义的字段
            Object.keys(normalizedUpdates).forEach(key => {
              if (normalizedUpdates[key] === undefined) {
                delete normalizedUpdates[key];
              }
            });
            
            updatedRegion = await regionOperations.updateRegion(id, normalizedUpdates);
          } catch (error) {
            console.error('Supabase error:', error);
            const existing = serverStorage.getRegion(id);
            if (!existing) {
              return res.status(404).json({
                success: false,
                error: {
                  code: 'NOT_FOUND',
                  message: '区域不存在'
                }
              });
            }
            updatedRegion = { ...existing, ...updates };
            serverStorage.setRegion(id, updatedRegion);
          }
        } else {
          const existing = serverStorage.getRegion(id);
          if (!existing) {
            return res.status(404).json({
              success: false,
              error: {
                code: 'NOT_FOUND',
                message: '区域不存在'
              }
            });
          }
          
          updatedRegion = { ...existing, ...updates };
          serverStorage.setRegion(id, updatedRegion);
        }
        
        res.status(200).json({
          success: true,
          data: updatedRegion,
          source: useSupabase ? 'supabase' : 'localStorage'
        });
        break;
      }
      
      case 'DELETE': {
        let success = false;
        
        if (useSupabase) {
          try {
            // 检查区域是否存在
            const existing = await regionOperations.getRegion(id);
            if (!existing) {
              return res.status(404).json({
                success: false,
                error: {
                  code: 'NOT_FOUND',
                  message: '区域不存在'
                }
              });
            }
            
            success = await regionOperations.deleteRegion(id);
          } catch (error) {
            console.error('Supabase error, falling back to localStorage:', error);
            success = serverStorage.deleteRegion(id);
          }
        } else {
          success = serverStorage.deleteRegion(id);
        }
        
        if (!success) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: '区域不存在'
            }
          });
        }
        
        res.status(200).json({
          success: true,
          message: '区域已删除',
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