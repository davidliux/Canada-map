-- ==========================================
-- 修改现有的 truck_pricing_configs 表
-- 适配四种定价模式
-- ==========================================

-- 1. 添加缺失的列
ALTER TABLE truck_pricing_configs
ADD COLUMN IF NOT EXISTS zone_id VARCHAR,
ADD COLUMN IF NOT EXISTS group_id VARCHAR,
ADD COLUMN IF NOT EXISTS name VARCHAR,
ADD COLUMN IF NOT EXISTS pricing_mode VARCHAR CHECK (pricing_mode IN ('skid', 'first_cont', 'per_skid', 'full_truck')),
ADD COLUMN IF NOT EXISTS pricing_data JSONB,
ADD COLUMN IF NOT EXISTS applicable_fsas TEXT[],
ADD COLUMN IF NOT EXISTS min_distance DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS max_distance DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR;

-- 2. 迁移现有数据
UPDATE truck_pricing_configs
SET
  pricing_mode = COALESCE(mode, 'skid'),
  pricing_data = COALESCE(config, '{"mode": "skid", "prices": {}}'::jsonb),
  name = COALESCE(target_name, 'Legacy Config')
WHERE pricing_mode IS NULL;

-- 3. 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_pricing_lookup ON truck_pricing_configs(city_id, zone_id, group_id, is_active);
CREATE INDEX IF NOT EXISTS idx_pricing_priority ON truck_pricing_configs(priority DESC, is_active);
CREATE INDEX IF NOT EXISTS idx_pricing_mode_new ON truck_pricing_configs(pricing_mode, is_active);

-- 4. 创建价格历史记录表（如果不存在）
CREATE TABLE IF NOT EXISTS truck_pricing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id VARCHAR REFERENCES truck_pricing_configs(id) ON DELETE CASCADE,
  old_pricing_data JSONB,
  new_pricing_data JSONB,
  action VARCHAR NOT NULL CHECK (action IN ('create', 'update', 'delete', 'activate', 'deactivate')),
  changed_by VARCHAR,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  change_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_history_config ON truck_pricing_history(config_id);
CREATE INDEX IF NOT EXISTS idx_history_time ON truck_pricing_history(changed_at DESC);

-- 5. 创建价格缓存表（如果不存在）
CREATE TABLE IF NOT EXISTS truck_pricing_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR NOT NULL UNIQUE,
  city_id VARCHAR NOT NULL,
  zone_id VARCHAR,
  group_id VARCHAR,
  fsa_code VARCHAR,
  config_id VARCHAR REFERENCES truck_pricing_configs(id) ON DELETE CASCADE,
  pricing_mode VARCHAR NOT NULL,
  pricing_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  hit_count INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_cache_key ON truck_pricing_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON truck_pricing_cache(expires_at);

-- 6. 插入示例数据（四种定价模式）
-- 删除旧的示例数据
DELETE FROM truck_pricing_configs WHERE name LIKE 'Sample%';

-- Toronto 板数定价示例
INSERT INTO truck_pricing_configs (
  id, city_id, zone_id, group_id,
  name, pricing_mode, pricing_data,
  priority, is_active
) VALUES
('sample_toronto_skid', 'toronto', NULL, NULL,
  'Toronto 板数定价示例', 'skid',
  '{"mode": "skid", "prices": {"1": 90, "2": 108, "3": 126, "4": 144, "5": 162, "6": 180, "7": 198, "8": 216, "9": 234, "10": 252, "11": 270, "12": 288, "13": 306, "14": 324, "15": 342, "16": 360, "16+": 378}}'::jsonb,
  1, true),

-- Calgary 首托+续托示例
('sample_calgary_firstcont', 'calgary', NULL, NULL,
  'Calgary 首托续托示例', 'first_cont',
  '{"mode": "first_cont", "first_skid": 100, "cont_skid": 20, "max_skids": 16}'::jsonb,
  1, true),

-- Vancouver Zone1 每板定价示例
('sample_vancouver_perskid', 'vancouver', 'zone1', NULL,
  'Vancouver Zone1 每板定价', 'per_skid',
  '{"mode": "per_skid", "price_per_skid": 15, "min_skids": 4}'::jsonb,
  2, true),

-- Vancouver Zone5 整车定价示例
('sample_vancouver_truck', 'vancouver', 'zone5', NULL,
  'Vancouver Zone5 整车定价', 'full_truck',
  '{"mode": "full_truck", "truck_price": 900, "max_skids": 16}'::jsonb,
  2, true)
ON CONFLICT (id) DO UPDATE
SET
  pricing_data = EXCLUDED.pricing_data,
  name = EXCLUDED.name,
  updated_at = CURRENT_TIMESTAMP;

-- 7. 创建或替换获取适用价格的函数（简化版）
CREATE OR REPLACE FUNCTION get_applicable_pricing_simple(
  p_city_id VARCHAR,
  p_zone_id VARCHAR DEFAULT NULL,
  p_group_id VARCHAR DEFAULT NULL
) RETURNS TABLE (
  id VARCHAR,
  city_id VARCHAR,
  zone_id VARCHAR,
  group_id VARCHAR,
  name VARCHAR,
  pricing_mode VARCHAR,
  pricing_data JSONB,
  priority INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc.id,
    pc.city_id,
    pc.zone_id,
    pc.group_id,
    pc.name,
    pc.pricing_mode,
    pc.pricing_data,
    pc.priority
  FROM truck_pricing_configs pc
  WHERE pc.is_active = true
    AND pc.city_id = p_city_id
    AND (
      (pc.group_id = p_group_id AND p_group_id IS NOT NULL) OR
      (pc.zone_id = p_zone_id AND pc.group_id IS NULL AND p_zone_id IS NOT NULL) OR
      (pc.zone_id IS NULL AND pc.group_id IS NULL)
    )
  ORDER BY
    CASE
      WHEN pc.group_id IS NOT NULL THEN 3
      WHEN pc.zone_id IS NOT NULL THEN 2
      ELSE 1
    END DESC,
    pc.priority DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 8. 显示结果
SELECT
  'Migration Complete' as status,
  COUNT(*) as total_configs,
  COUNT(DISTINCT pricing_mode) as unique_modes
FROM truck_pricing_configs
WHERE is_active = true;