const pool = require('./src/config/pgDatabase');

(async () => {
  try {
    console.log('=== 修复城市统计字段 ===\n');

    // 1. 先查看当前的不一致情况
    console.log('1. 当前数据不一致情况：');
    const inconsistency = await pool.query(`
      SELECT
        c.id,
        c.name,
        c.total_regions as stored_regions,
        c.total_fsas as stored_fsas,
        COUNT(DISTINCT z.id) as actual_regions,
        COALESCE(SUM(array_length(z.fsa_codes, 1)), 0) as actual_fsas
      FROM truck_delivery_cities c
      LEFT JOIN truck_delivery_zones z ON c.id = z.city_id AND z.is_active = true
      GROUP BY c.id, c.name, c.total_regions, c.total_fsas
      HAVING c.total_regions != COUNT(DISTINCT z.id)
         OR c.total_fsas != COALESCE(SUM(array_length(z.fsa_codes, 1)), 0)
      ORDER BY c.name
    `);

    if (inconsistency.rows.length === 0) {
      console.log('所有城市的统计字段都是正确的！');
    } else {
      console.table(inconsistency.rows);

      console.log('\n2. 准备修复这些不一致的数据...');

      // 2. 修复统计字段
      for (const city of inconsistency.rows) {
        console.log(`\n修复城市 ${city.name}:`);
        console.log(`  - 存储的区域数: ${city.stored_regions} → 实际: ${city.actual_regions}`);
        console.log(`  - 存储的FSA数: ${city.stored_fsas} → 实际: ${city.actual_fsas}`);

        const updateResult = await pool.query(`
          UPDATE truck_delivery_cities
          SET
            total_regions = $1,
            total_fsas = $2,
            updated_at = NOW()
          WHERE id = $3
          RETURNING name, total_regions, total_fsas
        `, [city.actual_regions, city.actual_fsas, city.id]);

        console.log(`  ✅ 已更新: ${updateResult.rows[0].name} - 区域: ${updateResult.rows[0].total_regions}, FSA: ${updateResult.rows[0].total_fsas}`);
      }

      console.log('\n3. 验证修复结果：');
      const verification = await pool.query(`
        SELECT
          c.name,
          c.total_regions as stored_regions,
          c.total_fsas as stored_fsas,
          COUNT(DISTINCT z.id) as actual_regions,
          COALESCE(SUM(array_length(z.fsa_codes, 1)), 0) as actual_fsas,
          CASE
            WHEN c.total_regions = COUNT(DISTINCT z.id)
             AND c.total_fsas = COALESCE(SUM(array_length(z.fsa_codes, 1)), 0)
            THEN '✅ 一致'
            ELSE '❌ 不一致'
          END as status
        FROM truck_delivery_cities c
        LEFT JOIN truck_delivery_zones z ON c.id = z.city_id AND z.is_active = true
        GROUP BY c.id, c.name, c.total_regions, c.total_fsas
        ORDER BY c.name
      `);

      console.table(verification.rows);
    }

    process.exit(0);
  } catch (error) {
    console.error('修复失败:', error);
    console.error('错误详情:', error.message);
    process.exit(1);
  }
})();