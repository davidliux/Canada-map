/**
 * 模拟Vercel KV存储
 * 用于本地开发环境
 */

class MockKV {
  constructor() {
    this.storage = new Map();
    console.log('🔧 使用模拟KV存储（本地开发模式）');
  }

  async get(key) {
    const value = this.storage.get(key);
    console.log(`📖 KV GET ${key}:`, value ? '有数据' : '无数据');
    return value || null;
  }

  async set(key, value, options = {}) {
    this.storage.set(key, value);
    console.log(`💾 KV SET ${key}:`, typeof value === 'object' ? '对象数据' : value);
    return 'OK';
  }

  async del(key) {
    const existed = this.storage.has(key);
    this.storage.delete(key);
    console.log(`🗑️ KV DEL ${key}:`, existed ? '已删除' : '不存在');
    return existed ? 1 : 0;
  }

  async exists(key) {
    const exists = this.storage.has(key);
    console.log(`❓ KV EXISTS ${key}:`, exists);
    return exists ? 1 : 0;
  }

  async keys(pattern = '*') {
    const keys = Array.from(this.storage.keys());
    console.log(`🔑 KV KEYS ${pattern}:`, keys.length, '个键');
    return keys;
  }

  async flushall() {
    this.storage.clear();
    console.log('🧹 KV FLUSHALL: 已清空所有数据');
    return 'OK';
  }
}

// 检查是否在Vercel环境中
const isVercelEnvironment = typeof process !== 'undefined' && 
                           (process.env.VERCEL || process.env.VERCEL_ENV);

let kv;

if (isVercelEnvironment) {
  // 在Vercel环境中使用真实的KV
  try {
    const { kv: vercelKV } = await import('@vercel/kv');
    kv = vercelKV;
    console.log('☁️ 使用Vercel KV存储');
  } catch (error) {
    console.warn('⚠️ Vercel KV导入失败，使用模拟存储:', error.message);
    kv = new MockKV();
  }
} else {
  // 在本地开发环境中使用模拟KV
  kv = new MockKV();
}

export { kv };
export default kv;
