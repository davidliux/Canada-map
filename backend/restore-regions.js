const pool = require('./src/config/pgDatabase');

(async () => {
  try {
    console.log('=== 恢复 truck_delivery_regions 表 ===\n');

    // 1. 创建表结构
    console.log('1. 创建表结构...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS truck_delivery_regions (
        id VARCHAR(255) PRIMARY KEY,
        city_id VARCHAR(255) NOT NULL,
        level INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        display_color VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        version INTEGER DEFAULT 0,
        active_drivers INTEGER DEFAULT 0,
        daily_capacity INTEGER DEFAULT 0,
        fsa_codes TEXT[],
        boundaries JSONB,
        coverage_area NUMERIC(10,2),
        coverage_population INTEGER,
        avg_delivery_time INTEGER,
        metadata JSONB,
        color VARCHAR(50),
        FOREIGN KEY (city_id) REFERENCES truck_delivery_cities(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ 表结构创建完成');

    // 2. 检查zones表是否有数据
    const zonesCheck = await pool.query('SELECT COUNT(*) as count FROM truck_delivery_zones');
    const zonesCount = parseInt(zonesCheck.rows[0].count);

    if (zonesCount > 0) {
      console.log(`\n2. 从 truck_delivery_zones 表复制 ${zonesCount} 条数据...`);
      await pool.query(`
        INSERT INTO truck_delivery_regions (
          id, city_id, level, name, display_color, is_active,
          created_at, updated_at, version, active_drivers, daily_capacity,
          fsa_codes, boundaries, coverage_area, coverage_population,
          avg_delivery_time, metadata, color
        )
        SELECT
          id, city_id, level, name, display_color, is_active,
          created_at, updated_at, version, active_drivers, daily_capacity,
          fsa_codes, boundaries, coverage_area, coverage_population,
          avg_delivery_time, metadata, color
        FROM truck_delivery_zones
        WHERE is_active = true
        ON CONFLICT (id) DO NOTHING
      `);
      console.log('✅ 数据复制完成');
    } else {
      console.log('\n2. zones表为空，插入示例数据...');

      // BC省的区域
      const bcRegions = [
        { id: 'bc-region-1', level: 1, name: '区域1', color: '#FF6B6B', fsas: ['V6A', 'V6B', 'V6C', 'V6E', 'V6G'] },
        { id: 'bc-region-2', level: 2, name: '区域2', color: '#4ECDC4', fsas: ['V5A', 'V5B', 'V5C', 'V5K', 'V5L', 'V5M', 'V5N'] },
        { id: 'bc-region-3', level: 3, name: '区域3', color: '#45B7D1', fsas: ['V6H', 'V6J', 'V6K', 'V6L', 'V6M', 'V6N'] },
        { id: 'bc-region-4', level: 4, name: '区域4', color: '#96CEB4', fsas: ['V5P', 'V5R', 'V5S', 'V5T', 'V5V', 'V5W'] },
        { id: 'bc-region-5', level: 5, name: '区域5', color: '#FFA07A', fsas: ['V3A', 'V3B', 'V3C', 'V3E', 'V3H', 'V3J', 'V3K', 'V3L', 'V3M', 'V3N'] }
      ];

      for (const region of bcRegions) {
        await pool.query(`
          INSERT INTO truck_delivery_regions (id, city_id, level, name, display_color, color, is_active, fsa_codes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING
        `, [region.id, 'cl2yeb1m20i', region.level, region.name, region.color, region.color, true, region.fsas]);
      }
      console.log('✅ BC省 5 个区域已创建');

      // ON省的区域
      const onRegions = [
        { id: 'on-region-1', level: 1, name: '区域1', color: '#FF6B6B', fsas: ['M4B', 'M4C', 'M4E', 'M4G', 'M4H', 'M4J', 'M4K', 'M4L', 'M4M', 'M4N', 'M4P', 'M4R', 'M4S', 'M4T', 'M4V', 'M4W', 'M4X', 'M4Y', 'M5A', 'M5B', 'M5C', 'M5E', 'M5G', 'M5H', 'M5J', 'M5K', 'M5L', 'M5M', 'M5N', 'M5P', 'M5R', 'M5S', 'M5T', 'M5V', 'M5W', 'M5X', 'M6G', 'M6H', 'M6J', 'M6K', 'M6N', 'M6P', 'M6R', 'M6S', 'M7A', 'M7R', 'M7Y'] },
        { id: 'on-region-2', level: 2, name: '区域2', color: '#4ECDC4', fsas: ['L4B', 'L4C', 'L4E', 'L4G', 'L4H', 'L4J', 'L4K', 'L4L', 'L4S', 'L4T', 'L4V', 'L4W', 'L4X', 'L4Y', 'L4Z', 'L5A', 'L5B', 'L5C', 'L5E', 'L5G', 'L5H', 'L5J', 'L5K', 'L5L', 'L5M', 'L5N', 'L5P', 'L5R', 'L5S', 'L5T', 'L5V', 'L5W', 'L6A', 'L6B', 'L6C', 'L6E', 'L6G', 'L6H', 'L6J', 'L6K', 'L6L', 'L6M', 'L6P', 'L6R', 'L6S', 'L6T', 'L6V', 'L6W', 'L6X', 'L6Y', 'L6Z', 'L7A', 'L7B', 'L7C', 'L7E', 'L7G', 'L7J', 'L7K', 'L7L'] },
        { id: 'on-region-3', level: 3, name: '区域3', color: '#45B7D1', fsas: ['M1B', 'M1C', 'M1E', 'M1G', 'M1H', 'M1J', 'M1K', 'M1L', 'M1M', 'M1N', 'M1P', 'M1R', 'M1S', 'M1T', 'M1V', 'M1W', 'M1X'] },
        { id: 'on-region-4', level: 4, name: '区域4', color: '#96CEB4', fsas: ['M2H', 'M2J', 'M2K', 'M2L', 'M2M', 'M2N', 'M2P', 'M2R', 'M3A', 'M3B', 'M3C', 'M3H', 'M3J', 'M3K', 'M3L', 'M3M', 'M3N', 'M6A', 'M6B', 'M6C', 'M6E', 'M6L', 'M6M', 'M9A', 'M9B', 'M9C', 'M9L', 'M9M', 'M9N', 'M9P', 'M9R', 'M9V', 'M9W'] },
        { id: 'on-region-5', level: 5, name: '区域5', color: '#FFA07A', fsas: ['M8V', 'M8W', 'M8X', 'M8Y', 'M8Z', 'M9A', 'M9B', 'M9C', 'M9L', 'M9M', 'M9N', 'M9P', 'M9R', 'M9V', 'M9W'] }
      ];

      for (const region of onRegions) {
        await pool.query(`
          INSERT INTO truck_delivery_regions (id, city_id, level, name, display_color, color, is_active, fsa_codes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING
        `, [region.id, 'cl2uawb1udh', region.level, region.name, region.color, region.color, true, region.fsas]);
      }
      console.log('✅ ON省 5 个区域已创建');

      // MB省的区域
      await pool.query(`
        INSERT INTO truck_delivery_regions (id, city_id, level, name, display_color, color, is_active, fsa_codes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, ['mb-region-1', 'cl2z3z1sg7q', 1, '区域1', '#FF6B6B', '#FF6B6B', true,
          ['R0A', 'R0B', 'R0C', 'R0E', 'R0G', 'R0H', 'R0J', 'R0K', 'R0L', 'R0M', 'R1A', 'R1B', 'R1C', 'R1N', 'R2C', 'R2E', 'R2G', 'R2H', 'R2J', 'R2K', 'R2L', 'R2M', 'R2N', 'R2P', 'R2R', 'R2V', 'R2W', 'R2X', 'R2Y', 'R3A', 'R3B', 'R3C', 'R3E', 'R3G', 'R3H']
      ]);
      console.log('✅ MB省 1 个区域已创建');
    }

    // 3. 同步到zones表
    console.log('\n3. 同步数据到 truck_delivery_zones 表...');
    await pool.query('DELETE FROM truck_delivery_zones');
    await pool.query(`
      INSERT INTO truck_delivery_zones (
        id, city_id, level, name, display_color, is_active,
        created_at, updated_at, version, active_drivers, daily_capacity,
        fsa_codes, boundaries, coverage_area, coverage_population,
        avg_delivery_time, metadata, color
      )
      SELECT
        id, city_id, level, name, display_color, is_active,
        created_at, updated_at, version, active_drivers, daily_capacity,
        fsa_codes, boundaries, coverage_area, coverage_population,
        avg_delivery_time, metadata, color
      FROM truck_delivery_regions
      WHERE is_active = true
    `);
    console.log('✅ 数据同步完成');

    // 4. 更新城市统计
    console.log('\n4. 更新城市统计信息...');
    await pool.query(`
      UPDATE truck_delivery_cities c
      SET
        total_regions = COALESCE(stats.region_count, 0),
        total_fsas = COALESCE(stats.fsa_count, 0),
        updated_at = NOW()
      FROM (
        SELECT
          city_id,
          COUNT(DISTINCT id) as region_count,
          SUM(array_length(fsa_codes, 1)) as fsa_count
        FROM truck_delivery_regions
        WHERE is_active = true
        GROUP BY city_id
      ) stats
      WHERE c.id = stats.city_id
    `);
    console.log('✅ 城市统计已更新');

    // 5. 显示结果
    console.log('\n5. 恢复结果：');
    const result = await pool.query(`
      SELECT
        c.name as city,
        COUNT(r.id) as regions,
        COALESCE(SUM(array_length(r.fsa_codes, 1)), 0) as fsas
      FROM truck_delivery_cities c
      LEFT JOIN truck_delivery_regions r ON c.id = r.city_id AND r.is_active = true
      GROUP BY c.id, c.name
      ORDER BY c.name
    `);
    console.table(result.rows);

    console.log('\n✅ 恢复完成！');
    process.exit(0);
  } catch (error) {
    console.error('恢复失败:', error);
    console.error('错误详情:', error.message);
    process.exit(1);
  }
})();