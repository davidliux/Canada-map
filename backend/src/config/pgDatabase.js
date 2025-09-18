const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL连接池配置
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,  // 使用默认5432端口
  database: process.env.DB_NAME || 'canada_postal_system',
  user: process.env.DB_USER || process.env.USER,
  password: process.env.DB_PASSWORD || '',
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 测试连接
pool.on('connect', () => {
  console.log('✅ PostgreSQL数据库连接成功');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL数据库错误:', err);
});

// 初始化连接测试
(async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('📅 数据库时间:', result.rows[0].now);
    client.release();
  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error.message);
  }
})();

module.exports = pool;