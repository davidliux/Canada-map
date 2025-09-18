/**
 * 运行数据库迁移脚本
 */

const fs = require('fs');
const path = require('path');
const pool = require('./src/config/pgDatabase');

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('🚀 开始运行价格配置V2迁移脚本...\n');

    // 读取SQL文件
    const sqlFile = path.join(__dirname, 'migrations', 'create_truck_pricing_configs_v2.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // 分割SQL语句（以分号和换行符分割）
    const statements = sql
      .split(/;\s*\n/)
      .filter(stmt => stmt.trim())
      .map(stmt => stmt.trim() + ';');

    console.log(`📝 找到 ${statements.length} 条SQL语句\n`);

    // 开始事务
    await client.query('BEGIN');

    let successCount = 0;
    let errorCount = 0;

    // 执行每条语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // 跳过注释
      if (statement.startsWith('--') || statement.trim() === ';') {
        continue;
      }

      try {
        // 获取语句类型
        const stmtType = statement.substring(0, 50).replace(/\n/g, ' ');
        console.log(`执行 [${i + 1}/${statements.length}]: ${stmtType}...`);

        await client.query(statement);
        successCount++;

        // 特殊处理：显示创建的表
        if (statement.includes('CREATE TABLE')) {
          const tableMatch = statement.match(/CREATE TABLE[^(]*\(?\s*([^\s(]+)/i);
          if (tableMatch) {
            console.log(`  ✅ 创建表: ${tableMatch[1]}`);
          }
        }

        // 特殊处理：显示创建的函数
        if (statement.includes('CREATE FUNCTION') || statement.includes('CREATE OR REPLACE FUNCTION')) {
          const funcMatch = statement.match(/FUNCTION\s+([^\s(]+)/i);
          if (funcMatch) {
            console.log(`  ✅ 创建函数: ${funcMatch[1]}`);
          }
        }

        // 特殊处理：显示插入的示例数据
        if (statement.includes('INSERT INTO')) {
          const insertMatch = statement.match(/INSERT INTO\s+([^\s(]+)/i);
          if (insertMatch) {
            console.log(`  ✅ 插入数据到: ${insertMatch[1]}`);
          }
        }

      } catch (error) {
        errorCount++;
        console.error(`  ❌ 错误: ${error.message}`);

        // 如果是关键表创建失败，则回滚
        if (statement.includes('CREATE TABLE truck_pricing_configs')) {
          throw error;
        }

        // 其他错误继续执行（可能是已存在的对象）
      }
    }

    // 提交事务
    await client.query('COMMIT');

    console.log('\n' + '='.repeat(60));
    console.log(`✅ 迁移完成！成功: ${successCount}, 失败: ${errorCount}`);
    console.log('='.repeat(60));

    // 验证表是否创建成功
    console.log('\n📊 验证创建的表...\n');

    const tables = [
      'truck_pricing_configs',
      'truck_pricing_history',
      'truck_pricing_cache'
    ];

    for (const table of tables) {
      const result = await client.query(
        `SELECT COUNT(*) FROM information_schema.tables
         WHERE table_name = $1`,
        [table]
      );

      if (result.rows[0].count > 0) {
        // 获取表的列数
        const columns = await client.query(
          `SELECT COUNT(*) FROM information_schema.columns
           WHERE table_name = $1`,
          [table]
        );
        console.log(`  ✅ 表 ${table} 存在 (${columns.rows[0].count} 列)`);
      } else {
        console.log(`  ❌ 表 ${table} 不存在`);
      }
    }

    // 检查示例数据
    console.log('\n📊 检查示例数据...\n');

    const sampleData = await client.query(
      `SELECT pricing_mode, COUNT(*) as count
       FROM truck_pricing_configs
       GROUP BY pricing_mode`
    );

    if (sampleData.rows.length > 0) {
      console.log('  示例数据已插入:');
      sampleData.rows.forEach(row => {
        console.log(`    - ${row.pricing_mode}: ${row.count} 条配置`);
      });
    } else {
      console.log('  暂无示例数据');
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ 迁移失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// 运行迁移
runMigration().catch(console.error);