const pool = require('./src/config/pgDatabase');

(async () => {
  try {
    console.log('=== Skid相关表结构和数据分析 ===\n');

    // 1. 检查表结构
    console.log('1. 表结构信息：');
    const tableInfo = await pool.query(`
      SELECT
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name IN ('group_skid_pricing', 'postal_codes', 'skid_pricing')
      ORDER BY table_name, ordinal_position
    `);

    const tables = {};
    tableInfo.rows.forEach(row => {
      if (!tables[row.table_name]) {
        tables[row.table_name] = [];
      }
      tables[row.table_name].push({
        column: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable,
        default: row.column_default
      });
    });

    for (const [tableName, columns] of Object.entries(tables)) {
      console.log(`\n表: ${tableName}`);
      console.table(columns);
    }

    // 2. postal_codes 表分析
    console.log('\n2. postal_codes 表数据统计：');
    const postalStats = await pool.query(`
      SELECT
        COUNT(*) as total_records,
        COUNT(DISTINCT fsa_code) as unique_fsas,
        COUNT(DISTINCT city) as unique_cities,
        COUNT(DISTINCT province) as unique_provinces,
        COUNT(DISTINCT region_id) as unique_regions,
        MIN(created_at) as earliest_record,
        MAX(created_at) as latest_record
      FROM postal_codes
    `);
    console.table(postalStats.rows[0]);

    // 查看一些样本数据
    console.log('\npostal_codes 表样本数据（前5条）：');
    const postalSample = await pool.query(`
      SELECT id, region_id, fsa_code, city, province, is_active
      FROM postal_codes
      LIMIT 5
    `);
    console.table(postalSample.rows);

    // 3. skid_pricing 表分析
    console.log('\n3. skid_pricing 表数据统计：');
    const skidStats = await pool.query(`
      SELECT
        COUNT(*) as total_records,
        COUNT(DISTINCT city_id) as unique_cities,
        COUNT(DISTINCT zone_id) as unique_zones,
        COUNT(DISTINCT skid_count) as unique_skid_counts,
        MIN(price) as min_price,
        MAX(price) as max_price,
        AVG(price)::numeric(10,2) as avg_price,
        MIN(created_at) as earliest_record,
        MAX(updated_at) as latest_update
      FROM skid_pricing
    `);
    console.table(skidStats.rows[0]);

    // 查看价格分布
    console.log('\nskid_pricing 价格分布（按城市）：');
    const priceDistribution = await pool.query(`
      SELECT
        sp.city_id,
        c.name as city_name,
        COUNT(*) as price_rules_count,
        MIN(sp.price) as min_price,
        MAX(sp.price) as max_price,
        AVG(sp.price)::numeric(10,2) as avg_price
      FROM skid_pricing sp
      LEFT JOIN truck_delivery_cities c ON sp.city_id = c.id
      GROUP BY sp.city_id, c.name
      ORDER BY c.name
      LIMIT 10
    `);
    console.table(priceDistribution.rows);

    // 查看一些样本数据
    console.log('\nskid_pricing 表样本数据（前5条）：');
    const skidSample = await pool.query(`
      SELECT
        sp.id,
        c.name as city_name,
        z.name as zone_name,
        sp.skid_count,
        sp.price,
        sp.currency,
        sp.is_active
      FROM skid_pricing sp
      LEFT JOIN truck_delivery_cities c ON sp.city_id = c.id
      LEFT JOIN truck_delivery_zones z ON sp.zone_id = z.id
      LIMIT 5
    `);
    console.table(skidSample.rows);

    // 4. group_skid_pricing 表分析
    console.log('\n4. group_skid_pricing 表数据统计：');
    const groupStats = await pool.query(`
      SELECT
        COUNT(*) as total_records,
        COUNT(DISTINCT city_id) as unique_cities,
        COUNT(DISTINCT zone_id) as unique_zones,
        COUNT(DISTINCT group_id) as unique_groups,
        MIN(price) as min_price,
        MAX(price) as max_price,
        AVG(price)::numeric(10,2) as avg_price,
        MIN(created_at) as earliest_record,
        MAX(updated_at) as latest_update
      FROM group_skid_pricing
    `);
    console.table(groupStats.rows[0]);

    // 查看组定价数据
    console.log('\ngroup_skid_pricing 表样本数据（前5条）：');
    const groupSample = await pool.query(`
      SELECT
        gsp.id,
        c.name as city_name,
        z.name as zone_name,
        gsp.group_id,
        gsp.skid_count,
        gsp.price,
        gsp.currency,
        gsp.is_active
      FROM group_skid_pricing gsp
      LEFT JOIN truck_delivery_cities c ON gsp.city_id = c.id
      LEFT JOIN truck_delivery_zones z ON gsp.zone_id = z.id
      LIMIT 5
    `);
    console.table(groupSample.rows);

    // 5. 分析表之间的关系
    console.log('\n5. 表关系分析：');

    // 检查postal_codes和zones的关系
    const fsaRelation = await pool.query(`
      SELECT
        'postal_codes表记录数' as description,
        COUNT(*) as count
      FROM postal_codes
      UNION ALL
      SELECT
        'skid_pricing表记录数' as description,
        COUNT(*) as count
      FROM skid_pricing
      UNION ALL
      SELECT
        'group_skid_pricing表记录数' as description,
        COUNT(*) as count
      FROM group_skid_pricing
    `);
    console.table(fsaRelation.rows);

    // 检查group_skid_pricing的分组情况
    console.log('\n6. group_skid_pricing 分组统计：');
    const groupAnalysis = await pool.query(`
      SELECT
        gsp.group_id,
        COUNT(*) as price_rules_count,
        COUNT(DISTINCT gsp.city_id) as cities_count,
        COUNT(DISTINCT gsp.zone_id) as zones_count,
        MIN(gsp.price) as min_price,
        MAX(gsp.price) as max_price,
        AVG(gsp.price)::numeric(10,2) as avg_price
      FROM group_skid_pricing gsp
      WHERE gsp.is_active = true
      GROUP BY gsp.group_id
      ORDER BY gsp.group_id
      LIMIT 10
    `);
    console.table(groupAnalysis.rows);

    // 7. 业务逻辑分析
    console.log('\n7. 业务逻辑总结：');
    console.log('----------------------------------------');
    console.log('📦 postal_codes 表：');
    console.log('  - 存储加拿大所有邮政编码的地理信息');
    console.log('  - 包含邮编、FSA、城市、省份、经纬度等信息');
    console.log('  - 用于地址验证和地理位置查询');

    console.log('\n💰 skid_pricing 表：');
    console.log('  - 存储托盘（Skid）运输的定价信息');
    console.log('  - 定义从某个城市到特定FSA区域的运输价格');
    console.log('  - 包含最小托盘数量要求等业务规则');

    console.log('\n📊 group_skid_pricing 表：');
    console.log('  - 存储基于分组的托盘定价策略');
    console.log('  - 允许将多个目的地FSA归为一组统一定价');
    console.log('  - 支持基础价格和按托盘计价两种模式');
    console.log('----------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('查询失败:', error);
    console.error('错误详情:', error.message);
    process.exit(1);
  }
})();