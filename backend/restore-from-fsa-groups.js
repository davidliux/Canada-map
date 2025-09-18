const pool = require('./src/config/pgDatabase');

(async () => {
  try {
    console.log('=== 从FSA分组表恢复区域数据 ===\n');

    // 1. 首先清理现有的测试数据
    console.log('1. 清理现有的测试数据...');
    await pool.query('DELETE FROM truck_delivery_zones');
    await pool.query('DELETE FROM truck_delivery_regions');
    console.log('✅ 清理完成');

    // 2. 从FSA分组表分析并恢复区域
    console.log('\n2. 从FSA分组表恢复区域...');

    // 获取所有唯一的zone_id和对应的FSA
    const zones = await pool.query(`
      SELECT
        zone_id,
        array_agg(DISTINCT name ORDER BY name) as group_names,
        array_agg(DISTINCT unnest_fsa ORDER BY unnest_fsa) as all_fsas,
        COUNT(DISTINCT id) as group_count
      FROM (
        SELECT
          g.id,
          g.zone_id,
          g.name,
          unnest(g.fsa_codes) as unnest_fsa
        FROM truck_zone_fsa_groups g
      ) expanded
      GROUP BY zone_id
      ORDER BY zone_id
    `);

    console.log(`找到 ${zones.rows.length} 个区域\n`);

    // 3. 为每个zone创建区域记录
    let bcCount = 0, onCount = 0, mbCount = 0, abCount = 0, skCount = 0;

    for (const zone of zones.rows) {
      // 根据FSA判断省份
      let cityId, province, level = 1, regionName;
      const firstFsa = zone.all_fsas[0];

      // 判断省份
      if (firstFsa && firstFsa.startsWith('V')) {
        cityId = 'cl2yeb1m20i'; // BC
        province = 'BC';
        bcCount++;
        level = bcCount;
        regionName = `区域${bcCount}`;
      } else if (firstFsa && (firstFsa.startsWith('M') || firstFsa.startsWith('L'))) {
        cityId = 'cl2uawb1udh'; // ON
        province = 'ON';
        onCount++;
        level = onCount;
        regionName = `区域${onCount}`;
      } else if (firstFsa && firstFsa.startsWith('R')) {
        cityId = 'cl2z3z1sg7q'; // MB
        province = 'MB';
        mbCount++;
        level = mbCount;
        regionName = `区域${mbCount}`;
      } else if (firstFsa && firstFsa.startsWith('T')) {
        cityId = 'cl2uxuh8saq'; // AB
        province = 'AB';
        abCount++;
        level = abCount;
        regionName = `区域${abCount}`;
      } else if (firstFsa && firstFsa.startsWith('S')) {
        cityId = 'cl2yrwxzrw1'; // SK
        province = 'SK';
        skCount++;
        level = skCount;
        regionName = `区域${skCount}`;
      } else {
        console.log(`跳过未知省份的区域: ${zone.zone_id}, FSA: ${firstFsa}`);
        continue;
      }

      // 生成颜色
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFA07A', '#DDA0DD', '#98D8C8', '#FFD93D'];
      const color = colors[(level - 1) % colors.length];

      // 先检查是否已存在
      const existingRegion = await pool.query(
        'SELECT id FROM truck_delivery_regions WHERE id = $1',
        [zone.zone_id]
      );

      if (existingRegion.rows.length === 0) {
        // 插入到regions表
        await pool.query(`
          INSERT INTO truck_delivery_regions (
            id, city_id, level, name, color, display_color,
            is_active, fsa_codes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        `, [
          zone.zone_id,
          cityId,
          level,
          regionName,
          color,
          color,
          true,
          zone.all_fsas
        ]);
      }

      const existingZone = await pool.query(
        'SELECT id FROM truck_delivery_zones WHERE id = $1',
        [zone.zone_id]
      );

      if (existingZone.rows.length === 0) {
        // 同时插入到zones表
        await pool.query(`
          INSERT INTO truck_delivery_zones (
            id, city_id, level, name, color, display_color,
            is_active, fsa_codes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        `, [
          zone.zone_id,
          cityId,
          level,
          regionName,
          color,
          color,
          true,
          zone.all_fsas
        ]);
      }

      console.log(`✅ ${province} - ${regionName}: ${zone.all_fsas.length} 个FSA, ${zone.group_count} 个分组`);
    }

    // 4. 更新城市统计
    console.log('\n3. 更新城市统计...');
    await pool.query(`
      UPDATE truck_delivery_cities c
      SET
        total_regions = stats.region_count,
        total_fsas = stats.fsa_count,
        updated_at = NOW()
      FROM (
        SELECT
          city_id,
          COUNT(DISTINCT id) as region_count,
          COALESCE(SUM(array_length(fsa_codes, 1)), 0) as fsa_count
        FROM truck_delivery_regions
        WHERE is_active = true
        GROUP BY city_id
      ) stats
      WHERE c.id = stats.city_id
    `);

    // 5. 显示最终结果
    console.log('\n4. 恢复结果：');
    const result = await pool.query(`
      SELECT
        c.name as city,
        COUNT(DISTINCT r.id) as regions,
        COALESCE(SUM(array_length(r.fsa_codes, 1)), 0) as fsas
      FROM truck_delivery_cities c
      LEFT JOIN truck_delivery_regions r ON c.id = r.city_id AND r.is_active = true
      GROUP BY c.id, c.name
      ORDER BY c.name
    `);
    console.table(result.rows);

    // 6. 显示详细的区域信息
    console.log('\n5. 各城市区域详情：');
    const details = await pool.query(`
      SELECT
        c.name as city,
        r.name as region,
        r.level,
        array_length(r.fsa_codes, 1) as fsa_count,
        substring(array_to_string(r.fsa_codes, ','), 1, 50) ||
          CASE WHEN array_length(r.fsa_codes, 1) > 5 THEN '...' ELSE '' END as sample_fsas
      FROM truck_delivery_regions r
      JOIN truck_delivery_cities c ON r.city_id = c.id
      WHERE r.is_active = true
      ORDER BY c.name, r.level
    `);
    console.table(details.rows);

    console.log('\n✅ 恢复完成！');
    process.exit(0);
  } catch (error) {
    console.error('恢复失败:', error);
    console.error('错误详情:', error.message);
    process.exit(1);
  }
})();