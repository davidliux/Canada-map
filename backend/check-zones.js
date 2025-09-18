const pool = require('./src/config/pgDatabase');

(async () => {
  try {
    const result = await pool.query(`
      SELECT
        c.name as city,
        COUNT(DISTINCT z.id) FILTER (WHERE z.is_active = true) as active_zones,
        COUNT(DISTINCT z.id) FILTER (WHERE z.is_active = false) as inactive_zones,
        COUNT(DISTINCT z.id) as total_zones,
        array_agg(DISTINCT z.name || ' (active=' || z.is_active || ')') as zone_details
      FROM truck_delivery_cities c
      LEFT JOIN truck_delivery_zones z ON c.id = z.city_id
      WHERE c.name IN ('AB', 'BC', 'MB', 'ON', 'SK')
      GROUP BY c.id, c.name
      ORDER BY c.name
    `);

    console.log('城市区域统计：');
    console.table(result.rows.map(row => ({
      城市: row.city,
      活跃区域: row.active_zones,
      非活跃区域: row.inactive_zones,
      总计: row.total_zones
    })));

    console.log('\n详细信息：');
    result.rows.forEach(row => {
      if (row.zone_details && row.zone_details[0] !== null) {
        console.log(`${row.city}: ${row.zone_details.join(', ')}`);
      }
    });

    process.exit(0);
  } catch (error) {
    console.error('查询失败:', error.message);
    process.exit(1);
  }
})();