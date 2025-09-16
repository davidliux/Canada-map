const express = require('express');
const router = express.Router();
const pool = require('../config/pgDatabase');

/**
 * 卡车配送API路由
 */

// ==================== 城市管理 ====================

// 获取所有城市
router.get('/cities', async (req, res) => {
  try {
    const { includeStats = 'true', includeZones = 'false' } = req.query;
    
    // 如果需要包含zones数据，获取完整信息
    if (includeZones === 'true') {
      const query = `
        SELECT 
          c.*,
          COALESCE(json_agg(
            json_build_object(
              'id', z.id,
              'name', z.name,
              'level', z.level,
              'fsaCodes', z.fsa_codes,
              'color', z.color,
              'active_drivers', z.active_drivers,
              'daily_capacity', z.daily_capacity
            ) ORDER BY z.level, z.name
          ) FILTER (WHERE z.id IS NOT NULL), '[]'::json) AS regions
        FROM truck_delivery_cities c
        LEFT JOIN truck_delivery_zones z ON c.id = z.city_id AND z.is_active = true
        WHERE c.is_active = true
        GROUP BY c.id
        ORDER BY c.name
      `;
      
      const result = await pool.query(query);
      
      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } else if (includeStats === 'true') {
      // 原有的统计查询
      const query = `
        SELECT 
          c.*,
          COALESCE(COUNT(DISTINCT z.id), 0) AS total_zones,
          COALESCE(SUM(z.active_drivers), 0) AS total_drivers,
          COALESCE(SUM(z.daily_capacity), 0) AS total_capacity
        FROM truck_delivery_cities c
        LEFT JOIN truck_delivery_zones z ON c.id = z.city_id AND z.is_active = true
        WHERE c.is_active = true
        GROUP BY c.id
        ORDER BY c.name
      `;
      
      const result = await pool.query(query);
      
      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } else {
      // 基础查询
      const query = 'SELECT * FROM truck_delivery_cities WHERE is_active = true ORDER BY name';
      const result = await pool.query(query);
      
      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    }
  } catch (error) {
    console.error('获取城市列表失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: '获取城市列表失败' }
    });
  }
});

// 获取单个城市
router.get('/cities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        c.*,
        COALESCE(json_agg(
          json_build_object(
            'id', z.id,
            'name', z.name,
            'level', z.level,
            'fsa_codes', z.fsa_codes,
            'color', z.color,
            'active_drivers', z.active_drivers,
            'daily_capacity', z.daily_capacity
          ) ORDER BY z.level, z.name
        ) FILTER (WHERE z.id IS NOT NULL), '[]'::json) AS zones
      FROM truck_delivery_cities c
      LEFT JOIN truck_delivery_zones z ON c.id = z.city_id AND z.is_active = true
      WHERE c.id = $1 AND c.is_active = true
      GROUP BY c.id
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '城市不存在' }
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('获取城市详情失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: '获取城市详情失败' }
    });
  }
});

// 创建城市
router.post('/cities', async (req, res) => {
  try {
    const { id, name, province, center_lat, center_lng, theme_color, metadata } = req.body;
    
    if (!name || !province) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '城市名称和省份是必填项' }
      });
    }
    
    const query = `
      INSERT INTO truck_delivery_cities
        (id, name, province, center_lat, center_lng, theme_color, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(query, [
      id || name.toLowerCase().replace(/\s+/g, '_'),
      name, province, center_lat, center_lng, theme_color, metadata || {}
    ]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') { // 唯一约束冲突
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE', message: '城市已存在' }
      });
    }
    console.error('创建城市失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_ERROR', message: '创建城市失败' }
    });
  }
});

// 更新城市
router.put('/cities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, province, theme_color, zones, metadata, is_active, total_zones, total_fsas } = req.body;

    // 计算统计字段
    let totalRegions = total_zones || 0;
    let totalFSACount = total_fsas || 0;

    // 如果提供了zones，从中计算统计
    if (zones && Array.isArray(zones)) {
      totalRegions = zones.length;
      totalFSACount = zones.reduce((sum, zone) => {
        const fsaCount = zone.fsa_codes?.length || zone.fsaCodes?.length || 0;
        return sum + fsaCount;
      }, 0);
    }

    // 首先更新城市基本信息和统计
    const updateQuery = `
      UPDATE truck_delivery_cities
      SET
        name = COALESCE($2, name),
        province = COALESCE($3, province),
        theme_color = COALESCE($4, theme_color),
        metadata = COALESCE($5, metadata),
        is_active = COALESCE($6, is_active),
        total_regions = $7,
        total_fsas = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      id,
      name,
      province,
      theme_color,
      metadata ? JSON.stringify(metadata) : null,
      is_active,
      totalRegions,
      totalFSACount
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '城市不存在' }
      });
    }
    
    // 如果提供了zones，更新区域信息
    if (zones && Array.isArray(zones)) {
      // 删除现有区域
      await pool.query('DELETE FROM truck_delivery_zones WHERE city_id = $1', [id]);
      
      // 插入新区域
      for (const zone of zones) {
        // 生成有效的 UUID
        const { randomUUID } = require('crypto');
        const zoneId = zone.id && zone.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) 
          ? zone.id 
          : randomUUID();
        
        await pool.query(`
          INSERT INTO truck_delivery_zones (
            id, city_id, name, level, fsa_codes, 
            color, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          zoneId,
          id,
          zone.name,
          zone.level,
          zone.fsaCodes || zone.fsa_codes || [],
          zone.displayColor || zone.display_color || zone.color,
          zone.isActive !== false
        ]);
      }
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('更新城市失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: '更新城市失败' }
    });
  }
});

// 删除城市
router.delete('/cities/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 开始事务
    await pool.query('BEGIN');

    try {
      // 首先检查城市是否存在
      const checkQuery = 'SELECT id, name FROM truck_delivery_cities WHERE id = $1';
      const checkResult = await pool.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        await pool.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: '城市不存在' }
        });
      }

      const cityName = checkResult.rows[0].name;

      // 删除关联的区域
      await pool.query('DELETE FROM truck_delivery_zones WHERE city_id = $1', [id]);

      // 删除关联的价格信息（如果存在）
      // 尝试删除价格范围表
      try {
        await pool.query(`
          DELETE FROM truck_delivery_price_ranges
          WHERE price_id IN (
            SELECT id FROM truck_delivery_prices WHERE city_id = $1
          )
        `, [id]);
      } catch (e) {
        // 表可能不存在，忽略错误
        console.log('价格范围表不存在或无数据');
      }

      // 尝试删除价格主表
      try {
        await pool.query('DELETE FROM truck_delivery_prices WHERE city_id = $1', [id]);
      } catch (e) {
        // 表可能不存在，忽略错误
        console.log('价格表不存在或无数据');
      }

      // 尝试删除动态价格表（根据用户截图）
      try {
        await pool.query('DELETE FROM truck_price_tiers WHERE city_id = $1', [id]);
      } catch (e) {
        // 表可能不存在，忽略错误
        console.log('动态价格层级表不存在或无数据');
      }

      // 删除城市
      const deleteQuery = 'DELETE FROM truck_delivery_cities WHERE id = $1 RETURNING *';
      const result = await pool.query(deleteQuery, [id]);

      // 提交事务
      await pool.query('COMMIT');

      console.log(`✅ 成功删除城市: ${cityName} (${id})`);

      res.json({
        success: true,
        message: `城市 ${cityName} 已成功删除`,
        data: result.rows[0]
      });

    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('删除城市失败:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: '删除城市失败',
        details: error.message
      }
    });
  }
});

// ==================== 区域管理 ====================

// 获取城市的所有区域
router.get('/cities/:cityId/zones', async (req, res) => {
  try {
    const { cityId } = req.params;
    const { includeInactive = 'false' } = req.query;
    
    let query = `
      SELECT z.*, c.name as city_name, c.province
      FROM truck_delivery_zones z
      JOIN truck_delivery_cities c ON z.city_id = c.id
      WHERE z.city_id = $1
    `;
    
    if (includeInactive !== 'true') {
      query += ' AND z.is_active = true';
    }
    
    query += ' ORDER BY z.level, z.name';
    
    const result = await pool.query(query, [cityId]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('获取区域列表失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: '获取区域列表失败' }
    });
  }
});

// 获取单个区域
router.get('/zones/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        z.*,
        c.name as city_name,
        c.province,
        COALESCE(json_agg(
          json_build_object(
            'id', p.id,
            'min_weight', p.min_weight,
            'max_weight', p.max_weight,
            'price', p.price
          ) ORDER BY p.min_weight
        ) FILTER (WHERE p.id IS NOT NULL), '[]'::json) AS prices
      FROM truck_delivery_zones z
      JOIN truck_delivery_cities c ON z.city_id = c.id
      LEFT JOIN truck_zone_prices p ON z.id = p.zone_id
      WHERE z.id = $1
      GROUP BY z.id, z.city_id, z.name, z.level, z.fsa_codes, z.color,
               z.display_color, z.active_drivers, z.daily_capacity, z.is_active,
               z.created_at, z.updated_at, z.version, z.boundaries, z.coverage_area,
               z.coverage_population, z.avg_delivery_time, z.metadata, c.name, c.province
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '区域不存在' }
      });
    }

    // 获取FSA分组数据
    const zoneData = result.rows[0];
    const groupsResult = await pool.query(
      'SELECT * FROM truck_zone_fsa_groups WHERE zone_id = $1 ORDER BY name',
      [id]
    );
    zoneData.fsa_groups = groupsResult.rows;

    res.json({
      success: true,
      data: zoneData
    });
  } catch (error) {
    console.error('获取区域详情失败:', error);
    console.error('错误详情:', error.message);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: '获取区域详情失败',
        details: error.message // 添加错误详情
      }
    });
  }
});

// 创建区域
router.post('/zones', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      city_id,
      name,
      level = 3,
      fsa_codes = [],
      boundaries,
      coverage_area,
      coverage_population,
      avg_delivery_time = 2.5,
      daily_capacity = 100,
      active_drivers = 5,
      color = '#3B82F6'
    } = req.body;
    
    if (!city_id || !name) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '城市ID和区域名称是必填项' }
      });
    }
    
    // 创建区域
    const zoneQuery = `
      INSERT INTO truck_delivery_zones 
        (city_id, name, level, fsa_codes, boundaries, coverage_area, 
         coverage_population, avg_delivery_time, daily_capacity, active_drivers, color)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const zoneResult = await client.query(zoneQuery, [
      city_id, name, level, fsa_codes, boundaries, coverage_area,
      coverage_population, avg_delivery_time, daily_capacity, active_drivers, color
    ]);
    
    // 更新城市统计
    await client.query(`
      UPDATE truck_delivery_cities 
      SET total_regions = total_regions + 1,
          total_fsas = total_fsas + $2
      WHERE id = $1
    `, [city_id, fsa_codes.length]);
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      data: zoneResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    
    if (error.code === '23505') { // 唯一约束冲突
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE', message: '该城市已存在同名区域' }
      });
    }
    
    console.error('创建区域失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_ERROR', message: '创建区域失败' }
    });
  } finally {
    client.release();
  }
});

// 更新区域
router.put('/zones/:id', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const updates = req.body;

    // 分离fsa_groups数据
    const { fsa_groups, ...zoneUpdates } = updates;

    // 动态构建更新语句
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(zoneUpdates).forEach(key => {
      if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
        fields.push(`${key} = $${paramCount}`);
        values.push(zoneUpdates[key]);
        paramCount++;
      }
    });
    
    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '没有要更新的字段' }
      });
    }
    
    values.push(id);
    const query = `
      UPDATE truck_delivery_regions
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await client.query(query, values);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '区域不存在' }
      });
    }

    // 如果有fsa_groups数据，更新分组表
    if (fsa_groups && Array.isArray(fsa_groups)) {
      // 先删除旧的分组
      await client.query('DELETE FROM truck_zone_fsa_groups WHERE zone_id = $1', [id]);

      // 插入新的分组
      for (const group of fsa_groups) {
        await client.query(`
          INSERT INTO truck_zone_fsa_groups (id, zone_id, name, fsa_codes, custom_pricing, display_color)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          group.id,
          id,
          group.name,
          group.fsaCodes || [],
          group.customPricing || null,
          group.displayColor || null
        ]);
      }
    }

    await client.query('COMMIT');

    // 返回更新后的区域数据，包含分组信息
    const updatedZone = result.rows[0];
    const groupsResult = await client.query(
      'SELECT * FROM truck_zone_fsa_groups WHERE zone_id = $1 ORDER BY name',
      [id]
    );
    updatedZone.fsa_groups = groupsResult.rows;

    res.json({
      success: true,
      data: updatedZone
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('更新区域失败:', error);
    console.error('错误详情:', error.message);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: '更新区域失败',
        details: error.message
      }
    });
  } finally {
    client.release();
  }
});

// 删除区域
router.delete('/zones/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // 获取区域信息
    const zoneResult = await client.query(
      'SELECT city_id, fsa_codes FROM truck_delivery_zones WHERE id = $1',
      [id]
    );
    
    if (zoneResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '区域不存在' }
      });
    }
    
    const zone = zoneResult.rows[0];
    
    // 删除区域
    await client.query('DELETE FROM truck_delivery_zones WHERE id = $1', [id]);
    
    // 更新城市统计
    await client.query(`
      UPDATE truck_delivery_cities 
      SET total_regions = total_regions - 1,
          total_fsas = total_fsas - $2
      WHERE id = $1
    `, [zone.city_id, zone.fsa_codes.length]);
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: '区域已删除'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('删除区域失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_ERROR', message: '删除区域失败' }
    });
  } finally {
    client.release();
  }
});

// ==================== 价格管理 ====================

// 获取区域价格表
router.get('/zones/:zoneId/prices', async (req, res) => {
  try {
    const { zoneId } = req.params;
    
    const query = `
      SELECT * FROM truck_zone_prices
      WHERE zone_id = $1
      ORDER BY min_weight
    `;
    
    const result = await pool.query(query, [zoneId]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('获取价格表失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: '获取价格表失败' }
    });
  }
});

// 批量更新价格
router.put('/zones/:zoneId/prices', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { zoneId } = req.params;
    const { prices } = req.body;
    
    if (!Array.isArray(prices)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '价格数据必须是数组' }
      });
    }
    
    // 删除现有价格
    await client.query('DELETE FROM truck_zone_prices WHERE zone_id = $1', [zoneId]);
    
    // 插入新价格
    for (const price of prices) {
      await client.query(`
        INSERT INTO truck_zone_prices 
          (zone_id, weight_range_id, min_weight, max_weight, label, price, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        zoneId,
        price.weight_range_id,
        price.min_weight,
        price.max_weight,
        price.label,
        price.price,
        price.is_active !== false
      ]);
    }
    
    await client.query('COMMIT');
    
    // 返回更新后的价格表
    const result = await client.query(
      'SELECT * FROM truck_zone_prices WHERE zone_id = $1 ORDER BY min_weight',
      [zoneId]
    );
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('更新价格表失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: '更新价格表失败' }
    });
  } finally {
    client.release();
  }
});

// ==================== 搜索功能 ====================

// 搜索FSA
router.get('/search/fsa', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: [],
        count: 0
      });
    }
    
    const query = `
      SELECT DISTINCT
        z.id as zone_id,
        z.name as zone_name,
        z.city_id,
        c.name as city_name,
        c.province,
        unnest(z.fsa_codes) as fsa_code
      FROM truck_delivery_zones z
      JOIN truck_delivery_cities c ON z.city_id = c.id
      WHERE $1 = ANY(z.fsa_codes)
         OR z.name ILIKE $2
         OR c.name ILIKE $2
      LIMIT 20
    `;
    
    const result = await pool.query(query, [q.toUpperCase(), `%${q}%`]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('搜索失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SEARCH_ERROR', message: '搜索失败' }
    });
  }
});

// ==================== 统计功能 ====================

// 获取总体统计
router.get('/stats', async (req, res) => {
  try {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM truck_delivery_cities WHERE is_active = true) as total_cities,
        (SELECT COUNT(*) FROM truck_delivery_zones WHERE is_active = true) as total_zones,
        (SELECT SUM(active_drivers) FROM truck_delivery_zones WHERE is_active = true) as total_drivers,
        (SELECT SUM(daily_capacity) FROM truck_delivery_zones WHERE is_active = true) as total_capacity,
        (SELECT COUNT(*) FROM truck_delivery_orders WHERE status IN ('pending', 'assigned', 'in_transit')) as active_orders,
        (SELECT COUNT(*) FROM truck_delivery_orders WHERE DATE(created_at) = CURRENT_DATE) as today_orders
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'STATS_ERROR', message: '获取统计数据失败' }
    });
  }
});

module.exports = router;