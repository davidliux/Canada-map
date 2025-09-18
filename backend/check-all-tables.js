const pool = require('./src/config/pgDatabase');

(async () => {
  try {
    console.log('=== 数据库表结构和数据检查 ===\n');

    // 1. 检查所有相关表的结构
    console.log('1. 表结构信息：');
    const tableInfo = await pool.query(`
      SELECT
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name IN ('truck_delivery_cities', 'truck_delivery_zones', 'truck_delivery_regions', 'truck_zone_fsa_groups', 'truck_zone_prices')
      ORDER BY table_name, ordinal_position
    `);

    const tables = {};
    tableInfo.rows.forEach(row => {
      if (!tables[row.table_name]) {
        tables[row.table_name] = [];
      }
      tables[row.table_name].push(`${row.column_name} (${row.data_type})`);
    });

    for (const [tableName, columns] of Object.entries(tables)) {
      console.log(`\n表: ${tableName}`);
      console.log(`字段: ${columns.join(', ')}`);
    }

    // 2. 检查 truck_delivery_cities 表
    console.log('\n\n2. truck_delivery_cities 表数据：');
    const cities = await pool.query(`
      SELECT id, name, province, is_active, created_at
      FROM truck_delivery_cities
      ORDER BY name
    `);
    console.table(cities.rows);

    // 3. 检查 truck_delivery_zones 表
    console.log('\n3. truck_delivery_zones 表数据统计：');
    const zones = await pool.query(`
      SELECT
        c.name as city_name,
        COUNT(z.id) as zone_count,
        array_agg(z.name || ' (level=' || z.level || ')' ORDER BY z.level) as zones
      FROM truck_delivery_cities c
      LEFT JOIN truck_delivery_zones z ON c.id = z.city_id
      WHERE z.is_active = true OR z.is_active IS NULL
      GROUP BY c.id, c.name
      ORDER BY c.name
    `);
    console.table(zones.rows.map(row => ({
      城市: row.city_name,
      区域数: row.zone_count,
      区域列表: row.zones ? row.zones.join(', ') : 'NULL'
    })));

    // 4. 检查 truck_delivery_regions 表（如果存在）
    console.log('\n4. truck_delivery_regions 表数据：');
    try {
      const regions = await pool.query(`
        SELECT
          c.name as city_name,
          COUNT(r.id) as region_count,
          array_agg(r.name ORDER BY r.name) as regions
        FROM truck_delivery_cities c
        LEFT JOIN truck_delivery_regions r ON c.id = r.city_id
        GROUP BY c.id, c.name
        ORDER BY c.name
      `);
      console.table(regions.rows.map(row => ({
        城市: row.city_name,
        区域数: row.region_count,
        区域列表: row.regions ? row.regions.filter(r => r).join(', ') : 'NULL'
      })));
    } catch (error) {
      console.log('truck_delivery_regions 表不存在或查询失败:', error.message);
    }

    // 5. 检查 truck_zone_fsa_groups 表
    console.log('\n5. truck_zone_fsa_groups 表数据统计：');
    const fsaGroups = await pool.query(`
      SELECT
        z.city_id,
        c.name as city_name,
        z.name as zone_name,
        COUNT(g.id) as group_count,
        SUM(array_length(g.fsa_codes, 1)) as total_fsas
      FROM truck_delivery_zones z
      LEFT JOIN truck_delivery_cities c ON z.city_id = c.id
      LEFT JOIN truck_zone_fsa_groups g ON z.id = g.zone_id
      GROUP BY z.city_id, c.name, z.id, z.name
      ORDER BY c.name, z.name
    `);
    console.table(fsaGroups.rows.map(row => ({
      城市: row.city_name,
      区域: row.zone_name,
      FSA组数: row.group_count || 0,
      FSA总数: row.total_fsas || 0
    })));

    // 6. 检查 truck_zone_prices 表
    console.log('\n6. truck_zone_prices 表数据统计：');
    const prices = await pool.query(`
      SELECT
        z.city_id,
        c.name as city_name,
        z.name as zone_name,
        COUNT(p.id) as price_count,
        MIN(p.price) as min_price,
        MAX(p.price) as max_price
      FROM truck_delivery_zones z
      LEFT JOIN truck_delivery_cities c ON z.city_id = c.id
      LEFT JOIN truck_zone_prices p ON z.id = p.zone_id
      GROUP BY z.city_id, c.name, z.id, z.name
      ORDER BY c.name, z.name
    `);
    console.table(prices.rows.map(row => ({
      城市: row.city_name,
      区域: row.zone_name,
      价格配置数: row.price_count || 0,
      最低价: row.min_price || 'N/A',
      最高价: row.max_price || 'N/A'
    })));

    // 7. 特别检查 AB 城市的完整数据链
    console.log('\n7. AB 城市详细检查：');
    const abDetail = await pool.query(`
      SELECT
        'Cities' as table_name,
        COUNT(*) as count
      FROM truck_delivery_cities
      WHERE name = 'AB'
      UNION ALL
      SELECT
        'Zones' as table_name,
        COUNT(*) as count
      FROM truck_delivery_zones z
      JOIN truck_delivery_cities c ON z.city_id = c.id
      WHERE c.name = 'AB'
      UNION ALL
      SELECT
        'FSA Groups' as table_name,
        COUNT(*) as count
      FROM truck_zone_fsa_groups g
      JOIN truck_delivery_zones z ON g.zone_id = z.id
      JOIN truck_delivery_cities c ON z.city_id = c.id
      WHERE c.name = 'AB'
      UNION ALL
      SELECT
        'Prices' as table_name,
        COUNT(*) as count
      FROM truck_zone_prices p
      JOIN truck_delivery_zones z ON p.zone_id = z.id
      JOIN truck_delivery_cities c ON z.city_id = c.id
      WHERE c.name = 'AB'
    `);
    console.table(abDetail.rows);

    // 8. 检查其他城市是否有相同的问题
    console.log('\n8. 所有城市的数据完整性检查：');
    const integrity = await pool.query(`
      SELECT
        c.name as city_name,
        c.id as city_id,
        COUNT(DISTINCT z.id) as zones,
        COUNT(DISTINCT g.id) as fsa_groups,
        COUNT(DISTINCT p.id) as prices,
        CASE
          WHEN COUNT(DISTINCT z.id) = 0 THEN '无区域'
          WHEN COUNT(DISTINCT g.id) = 0 AND COUNT(DISTINCT z.id) > 0 THEN '有区域但无FSA'
          WHEN COUNT(DISTINCT p.id) = 0 AND COUNT(DISTINCT z.id) > 0 THEN '有区域但无价格'
          ELSE '数据完整'
        END as status
      FROM truck_delivery_cities c
      LEFT JOIN truck_delivery_zones z ON c.id = z.city_id AND z.is_active = true
      LEFT JOIN truck_zone_fsa_groups g ON z.id = g.zone_id
      LEFT JOIN truck_zone_prices p ON z.id = p.zone_id
      WHERE c.is_active = true
      GROUP BY c.id, c.name
      ORDER BY c.name
    `);
    console.table(integrity.rows);

    process.exit(0);
  } catch (error) {
    console.error('查询失败:', error);
    console.error('错误详情:', error.message);
    process.exit(1);
  }
})();