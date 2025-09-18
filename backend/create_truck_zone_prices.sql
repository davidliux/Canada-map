-- 创建 truck_zone_prices 表
CREATE TABLE IF NOT EXISTS truck_zone_prices (
  id SERIAL PRIMARY KEY,
  zone_id VARCHAR(50),
  min_weight DECIMAL(10, 2),
  max_weight DECIMAL(10, 2),
  price DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 添加索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_truck_zone_prices_zone_id ON truck_zone_prices(zone_id);
