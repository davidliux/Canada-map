/**
 * 卡车配送价格配置API V2
 * 支持四种定价模式和三级优先级
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/pgDatabase');
const { v4: uuidv4 } = require('uuid');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { checkQueryLimit, checkModuleAccess } = require('../middleware/queryLimit');

// ==================== 价格查询 API ====================

/**
 * 查询适用的价格配置
 * GET /api/v1/truck-pricing/query
 *
 * Query参数:
 * - city_id: 城市ID（必填）
 * - zone_id: 区域ID（可选）
 * - group_id: 分组ID（可选）
 * - fsa_code: FSA代码（可选）
 */
router.get('/query', optionalAuth, checkQueryLimit('PRICE_QUERY'), async (req, res) => {
  const { city_id, zone_id, group_id, fsa_code } = req.query;

  if (!city_id) {
    return res.status(400).json({
      success: false,
      error: '缺少必填参数: city_id'
    });
  }

  try {
    // 使用存储过程获取适用的价格配置
    const query = `
      SELECT * FROM get_applicable_pricing($1, $2, $3, $4)
    `;

    const result = await pool.query(query, [city_id, zone_id, group_id, fsa_code]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到适用的价格配置',
        fallback: {
          mode: 'default',
          message: '请联系管理员配置价格'
        }
      });
    }

    const config = result.rows[0];

    // 记录缓存（提升下次查询性能）
    const cacheKey = `${city_id}_${zone_id || 'null'}_${group_id || 'null'}_${fsa_code || 'null'}_${config.pricing_mode}`;
    await pool.query(
      `INSERT INTO truck_pricing_cache (cache_key, city_id, zone_id, group_id, fsa_code, config_id, pricing_mode, pricing_data, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() + INTERVAL '1 hour')
       ON CONFLICT (cache_key) DO UPDATE
       SET config_id = $6, pricing_data = $8, expires_at = NOW() + INTERVAL '1 hour', hit_count = truck_pricing_cache.hit_count + 1`,
      [cacheKey, city_id, zone_id, group_id, fsa_code, config.id, config.pricing_mode, config.pricing_data]
    );

    res.json({
      success: true,
      data: {
        config_id: config.id,
        name: config.name,
        pricing_mode: config.pricing_mode,
        pricing_data: config.pricing_data,
        priority: config.priority,
        level: config.config_level,
        city_id: config.city_id,
        zone_id: config.zone_id,
        group_id: config.group_id
      }
    });

  } catch (error) {
    console.error('查询价格配置失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 计算价格
 * POST /api/v1/truck-pricing/calculate
 *
 * Body参数:
 * - config_id: 配置ID（可选，如果不提供则自动查询）
 * - city_id, zone_id, group_id, fsa_code: 查询参数（config_id为空时使用）
 * - skid_count: 托盘数量
 */
router.post('/calculate', optionalAuth, checkQueryLimit('PRICE_QUERY'), async (req, res) => {
  const { config_id, city_id, zone_id, group_id, fsa_code, skid_count } = req.body;

  if (!skid_count || skid_count < 1) {
    return res.status(400).json({
      success: false,
      error: '托盘数量必须大于0'
    });
  }

  try {
    let configId = config_id;

    // 如果没有提供config_id，先查询适用的配置
    if (!configId) {
      if (!city_id) {
        return res.status(400).json({
          success: false,
          error: '缺少必填参数: config_id 或 city_id'
        });
      }

      const configResult = await pool.query(
        'SELECT * FROM get_applicable_pricing($1, $2, $3, $4)',
        [city_id, zone_id, group_id, fsa_code]
      );

      if (configResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '未找到适用的价格配置'
        });
      }

      configId = configResult.rows[0].id;
    }

    // 使用存储过程计算价格
    const result = await pool.query(
      'SELECT * FROM calculate_truck_price($1, $2)',
      [configId, skid_count]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '无法计算价格'
      });
    }

    const calculation = result.rows[0];

    res.json({
      success: true,
      data: {
        price: parseFloat(calculation.price),
        breakdown: calculation.breakdown,
        mode: calculation.mode,
        skid_count: skid_count,
        config_id: configId
      }
    });

  } catch (error) {
    console.error('计算价格失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== 配置管理 API ====================

/**
 * 获取所有价格配置
 * GET /api/v1/truck-pricing/configs
 */
router.get('/configs', async (req, res) => {
  const { city_id, zone_id, group_id, pricing_mode, is_active } = req.query;

  try {
    let query = 'SELECT * FROM v_active_pricing_configs WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (city_id) {
      query += ` AND city_id = $${paramIndex++}`;
      params.push(city_id);
    }

    if (zone_id) {
      query += ` AND zone_id = $${paramIndex++}`;
      params.push(zone_id);
    }

    if (group_id) {
      query += ` AND group_id = $${paramIndex++}`;
      params.push(group_id);
    }

    if (pricing_mode) {
      query += ` AND pricing_mode = $${paramIndex++}`;
      params.push(pricing_mode);
    }

    if (is_active !== undefined) {
      query = query.replace('v_active_pricing_configs', 'truck_pricing_configs');
      query += ` AND is_active = $${paramIndex++}`;
      params.push(is_active === 'true');
    }

    query += ' ORDER BY priority DESC, created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('获取价格配置列表失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 创建价格配置
 * POST /api/v1/truck-pricing/configs
 */
router.post('/configs', async (req, res) => {
  const {
    city_id, zone_id, group_id,
    name, pricing_mode, pricing_data,
    priority = 0, is_active = true,
    applicable_fsas, min_distance, max_distance,
    metadata, created_by
  } = req.body;

  // 验证必填字段
  if (!city_id || !name || !pricing_mode || !pricing_data) {
    return res.status(400).json({
      success: false,
      error: '缺少必填字段: city_id, name, pricing_mode, pricing_data'
    });
  }

  // 验证定价模式
  const validModes = ['skid', 'first_cont', 'per_skid', 'full_truck'];
  if (!validModes.includes(pricing_mode)) {
    return res.status(400).json({
      success: false,
      error: `无效的定价模式，必须是: ${validModes.join(', ')}`
    });
  }

  // 验证价格数据格式
  try {
    validatePricingData(pricing_mode, pricing_data);
  } catch (validationError) {
    return res.status(400).json({
      success: false,
      error: `价格数据格式错误: ${validationError.message}`
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 如果要激活新配置，先停用同级别的所有配置（不限定pricing_mode）
    if (is_active) {
      await client.query(
        `UPDATE truck_pricing_configs
         SET is_active = false
         WHERE city_id = $1
           AND (zone_id = $2 OR (zone_id IS NULL AND $2 IS NULL))
           AND (group_id = $3 OR (group_id IS NULL AND $3 IS NULL))
           AND is_active = true`,
        [city_id, zone_id, group_id]  // 移除 pricing_mode，确保同层级只有一个激活配置
      );
    }

    // 插入新配置
    const insertQuery = `
      INSERT INTO truck_pricing_configs (
        city_id, zone_id, group_id,
        name, pricing_mode, pricing_data,
        priority, is_active,
        applicable_fsas, min_distance, max_distance,
        metadata, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const result = await client.query(insertQuery, [
      city_id, zone_id, group_id,
      name, pricing_mode, pricing_data,
      priority, is_active,
      applicable_fsas, min_distance, max_distance,
      metadata, created_by
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: '价格配置创建成功'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('创建价格配置失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * 更新价格配置
 * PUT /api/v1/truck-pricing/configs/:id
 */
router.put('/configs/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: '缺少配置ID'
    });
  }

  // 如果更新价格数据，验证格式
  if (updates.pricing_data && updates.pricing_mode) {
    try {
      validatePricingData(updates.pricing_mode, updates.pricing_data);
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        error: `价格数据格式错误: ${validationError.message}`
      });
    }
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 获取当前配置
    const currentResult = await client.query(
      'SELECT * FROM truck_pricing_configs WHERE id = $1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: '配置不存在'
      });
    }

    const current = currentResult.rows[0];

    // 如果要激活配置，先停用同级别的所有其他配置（不限定pricing_mode）
    if (updates.is_active === true && !current.is_active) {
      await client.query(
        `UPDATE truck_pricing_configs
         SET is_active = false
         WHERE city_id = $1
           AND (zone_id = $2 OR (zone_id IS NULL AND $2 IS NULL))
           AND (group_id = $3 OR (group_id IS NULL AND $3 IS NULL))
           AND id != $4
           AND is_active = true`,
        [current.city_id, current.zone_id, current.group_id, id]  // 移除 pricing_mode，确保同层级只有一个激活配置
      );
    }

    // 构建更新语句
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    const allowedFields = [
      'name', 'pricing_data', 'priority', 'is_active',
      'applicable_fsas', 'min_distance', 'max_distance',
      'metadata', 'updated_by'
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex++}`);
        updateValues.push(updates[field]);
      }
    }

    if (updateFields.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: '没有要更新的字段'
      });
    }

    updateValues.push(id);
    const updateQuery = `
      UPDATE truck_pricing_configs
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await client.query(updateQuery, updateValues);

    await client.query('COMMIT');

    res.json({
      success: true,
      data: result.rows[0],
      message: '价格配置更新成功'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('更新价格配置失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * 删除价格配置
 * DELETE /api/v1/truck-pricing/configs/:id
 */
router.delete('/configs/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: '缺少配置ID'
    });
  }

  try {
    const result = await pool.query(
      'DELETE FROM truck_pricing_configs WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '配置不存在'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: '价格配置删除成功'
    });

  } catch (error) {
    console.error('删除价格配置失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== 批量操作 API ====================

/**
 * 批量导入价格配置
 * POST /api/v1/truck-pricing/import
 */
router.post('/import', async (req, res) => {
  const { configs, replace = false } = req.body;

  if (!configs || !Array.isArray(configs)) {
    return res.status(400).json({
      success: false,
      error: '请提供配置数组'
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const results = [];
    const errors = [];

    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];

      try {
        // 验证每个配置
        if (!config.city_id || !config.name || !config.pricing_mode || !config.pricing_data) {
          throw new Error(`配置${i + 1}缺少必填字段`);
        }

        validatePricingData(config.pricing_mode, config.pricing_data);

        // 如果replace为true，先删除现有配置
        if (replace) {
          await client.query(
            `DELETE FROM truck_pricing_configs
             WHERE city_id = $1
               AND (zone_id = $2 OR (zone_id IS NULL AND $2 IS NULL))
               AND (group_id = $3 OR (group_id IS NULL AND $3 IS NULL))
               AND pricing_mode = $4`,
            [config.city_id, config.zone_id, config.group_id, config.pricing_mode]
          );
        }

        // 插入新配置
        const result = await client.query(
          `INSERT INTO truck_pricing_configs (
            city_id, zone_id, group_id,
            name, pricing_mode, pricing_data,
            priority, is_active,
            applicable_fsas, metadata, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING id, name`,
          [
            config.city_id, config.zone_id, config.group_id,
            config.name, config.pricing_mode, config.pricing_data,
            config.priority || 0, config.is_active !== false,
            config.applicable_fsas, config.metadata, config.created_by
          ]
        );

        results.push(result.rows[0]);

      } catch (error) {
        errors.push({
          index: i,
          config: config.name || `配置${i + 1}`,
          error: error.message
        });
      }
    }

    if (errors.length > 0 && results.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        errors: errors
      });
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      imported: results.length,
      failed: errors.length,
      results: results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('批量导入失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

// ==================== 工具函数 ====================

/**
 * 验证价格数据格式
 */
function validatePricingData(mode, data) {
  switch (mode) {
    case 'skid':
      if (!data.prices || typeof data.prices !== 'object') {
        throw new Error('板数定价需要prices对象');
      }
      const requiredSkids = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '16+'];
      for (const skid of requiredSkids) {
        if (data.prices[skid] === undefined || data.prices[skid] < 0) {
          throw new Error(`缺少或无效的板数价格: ${skid}`);
        }
      }
      break;

    case 'first_cont':
      if (data.first_skid === undefined || data.first_skid < 0) {
        throw new Error('首托价格必须大于等于0');
      }
      if (data.cont_skid === undefined || data.cont_skid < 0) {
        throw new Error('续托价格必须大于等于0');
      }
      if (data.max_skids && data.max_skids < 1) {
        throw new Error('最大板数必须大于0');
      }
      break;

    case 'per_skid':
      if (data.price_per_skid === undefined || data.price_per_skid < 0) {
        throw new Error('每板单价必须大于等于0');
      }
      if (data.min_skids === undefined || data.min_skids < 1) {
        throw new Error('最低起送板数必须大于0');
      }
      break;

    case 'full_truck':
      if (data.truck_price === undefined || data.truck_price < 0) {
        throw new Error('整车价格必须大于等于0');
      }
      if (data.max_skids && data.max_skids < 1) {
        throw new Error('整车最大板数必须大于0');
      }
      break;

    default:
      throw new Error(`未知的定价模式: ${mode}`);
  }
}

module.exports = router;