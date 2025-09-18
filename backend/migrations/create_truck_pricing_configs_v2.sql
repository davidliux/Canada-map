-- ==========================================
-- 卡车配送价格配置系统V2 - 数据库迁移脚本
-- ==========================================
-- 支持四种定价模式：
-- 1. skid - 板数定价（每个板数独立定价）
-- 2. first_cont - 首托+续托定价
-- 3. per_skid - 每板单价+起送板数
-- 4. full_truck - 整车定价
-- ==========================================

-- 1. 创建新的价格配置表
CREATE TABLE IF NOT EXISTS truck_pricing_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 层级关系（实现分组>区域>城市的优先级）
  city_id VARCHAR NOT NULL,        -- 必填：城市ID
  zone_id VARCHAR,                 -- 可选：区域ID（为空表示城市级配置）
  group_id VARCHAR,                -- 可选：分组ID（为空表示区域或城市级配置）

  -- 配置信息
  name VARCHAR NOT NULL,            -- 配置名称
  pricing_mode VARCHAR NOT NULL CHECK (pricing_mode IN ('skid', 'first_cont', 'per_skid', 'full_truck')),
  priority INT DEFAULT 0,           -- 优先级（数字越大优先级越高）
  is_active BOOLEAN DEFAULT true,   -- 是否激活

  -- 价格数据（JSON格式存储不同模式的配置）
  pricing_data JSONB NOT NULL,

  -- 适用条件
  applicable_fsas TEXT[],           -- 适用的FSA列表（可选）
  min_distance DECIMAL(10,2),      -- 最小距离限制（可选）
  max_distance DECIMAL(10,2),      -- 最大距离限制（可选）

  -- 元数据
  metadata JSONB,                   -- 额外元数据
  created_by VARCHAR,               -- 创建者
  updated_by VARCHAR,               -- 更新者
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 版本控制
  version INT DEFAULT 1,

  -- 约束：同一层级同一模式只能有一个激活的配置
  CONSTRAINT unique_active_config UNIQUE(city_id, zone_id, group_id, pricing_mode)
    DEFERRABLE INITIALLY DEFERRED
);

-- 2. 创建索引优化查询性能
CREATE INDEX idx_pricing_lookup ON truck_pricing_configs(city_id, zone_id, group_id, is_active);
CREATE INDEX idx_pricing_priority ON truck_pricing_configs(priority DESC, is_active);
CREATE INDEX idx_pricing_mode ON truck_pricing_configs(pricing_mode, is_active);
CREATE INDEX idx_pricing_fsas ON truck_pricing_configs USING GIN (applicable_fsas);

-- 3. 创建价格历史记录表（用于审计）
CREATE TABLE IF NOT EXISTS truck_pricing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES truck_pricing_configs(id) ON DELETE CASCADE,

  -- 记录变更前的值
  old_pricing_data JSONB,
  new_pricing_data JSONB,

  -- 变更信息
  action VARCHAR NOT NULL CHECK (action IN ('create', 'update', 'delete', 'activate', 'deactivate')),
  changed_by VARCHAR,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  change_reason TEXT,

  -- 索引
  INDEX idx_history_config (config_id),
  INDEX idx_history_time (changed_at DESC)
);

-- 4. 创建价格计算缓存表（提升性能）
CREATE TABLE IF NOT EXISTS truck_pricing_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 查询键
  cache_key VARCHAR NOT NULL UNIQUE,  -- 格式：city_zone_group_fsa_mode
  city_id VARCHAR NOT NULL,
  zone_id VARCHAR,
  group_id VARCHAR,
  fsa_code VARCHAR,

  -- 缓存的配置
  config_id UUID REFERENCES truck_pricing_configs(id) ON DELETE CASCADE,
  pricing_mode VARCHAR NOT NULL,
  pricing_data JSONB NOT NULL,

  -- 缓存管理
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  hit_count INT DEFAULT 0,

  -- 索引
  INDEX idx_cache_key (cache_key),
  INDEX idx_cache_expires (expires_at)
);

-- 5. 创建更新时间戳的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_truck_pricing_configs_updated_at
  BEFORE UPDATE ON truck_pricing_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. 创建价格历史记录触发器
CREATE OR REPLACE FUNCTION record_pricing_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO truck_pricing_history (
      config_id,
      old_pricing_data,
      new_pricing_data,
      action,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.pricing_data,
      NEW.pricing_data,
      'update',
      NEW.updated_by
    );
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO truck_pricing_history (
      config_id,
      new_pricing_data,
      action,
      changed_by
    ) VALUES (
      NEW.id,
      NEW.pricing_data,
      'create',
      NEW.created_by
    );
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER record_pricing_changes
  AFTER INSERT OR UPDATE ON truck_pricing_configs
  FOR EACH ROW EXECUTE FUNCTION record_pricing_history();

-- 7. 创建获取适用价格配置的函数
CREATE OR REPLACE FUNCTION get_applicable_pricing(
  p_city_id VARCHAR,
  p_zone_id VARCHAR,
  p_group_id VARCHAR,
  p_fsa_code VARCHAR DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  city_id VARCHAR,
  zone_id VARCHAR,
  group_id VARCHAR,
  name VARCHAR,
  pricing_mode VARCHAR,
  pricing_data JSONB,
  priority INT,
  config_level VARCHAR  -- 'group' | 'zone' | 'city'
) AS $$
BEGIN
  RETURN QUERY
  WITH priority_configs AS (
    SELECT
      pc.*,
      CASE
        WHEN pc.group_id IS NOT NULL THEN 'group'
        WHEN pc.zone_id IS NOT NULL THEN 'zone'
        ELSE 'city'
      END as config_level,
      CASE
        WHEN pc.group_id IS NOT NULL THEN 3
        WHEN pc.zone_id IS NOT NULL THEN 2
        ELSE 1
      END as level_priority
    FROM truck_pricing_configs pc
    WHERE pc.is_active = true
      AND pc.city_id = p_city_id
      AND (
        -- 分组级配置
        (pc.zone_id = p_zone_id AND pc.group_id = p_group_id AND p_group_id IS NOT NULL) OR
        -- 区域级配置
        (pc.zone_id = p_zone_id AND pc.group_id IS NULL AND p_zone_id IS NOT NULL) OR
        -- 城市级配置
        (pc.zone_id IS NULL AND pc.group_id IS NULL)
      )
      AND (
        -- 检查FSA适用性（如果指定了FSA）
        p_fsa_code IS NULL OR
        pc.applicable_fsas IS NULL OR
        p_fsa_code = ANY(pc.applicable_fsas)
      )
  )
  SELECT
    pc.id,
    pc.city_id,
    pc.zone_id,
    pc.group_id,
    pc.name,
    pc.pricing_mode,
    pc.pricing_data,
    pc.priority,
    pc.config_level
  FROM priority_configs pc
  ORDER BY pc.level_priority DESC, pc.priority DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 8. 创建计算价格的存储过程
CREATE OR REPLACE FUNCTION calculate_truck_price(
  p_config_id UUID,
  p_skid_count INT
) RETURNS TABLE (
  price DECIMAL(10,2),
  breakdown TEXT,
  mode VARCHAR
) AS $$
DECLARE
  v_config RECORD;
  v_price DECIMAL(10,2);
  v_breakdown TEXT;
BEGIN
  -- 获取配置
  SELECT pricing_mode, pricing_data INTO v_config
  FROM truck_pricing_configs
  WHERE id = p_config_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- 根据不同模式计算价格
  CASE v_config.pricing_mode
    WHEN 'skid' THEN
      -- 板数定价
      IF p_skid_count > 16 THEN
        v_price := (v_config.pricing_data->'prices'->>'16+')::DECIMAL;
        v_breakdown := FORMAT('%s板定价', p_skid_count);
      ELSE
        v_price := (v_config.pricing_data->'prices'->>p_skid_count::TEXT)::DECIMAL;
        v_breakdown := FORMAT('%s板定价', p_skid_count);
      END IF;

    WHEN 'first_cont' THEN
      -- 首托+续托
      v_price := (v_config.pricing_data->>'first_skid')::DECIMAL +
                 ((v_config.pricing_data->>'cont_skid')::DECIMAL * (p_skid_count - 1));
      v_breakdown := FORMAT('首托$%s + 续托%s×$%s',
        v_config.pricing_data->>'first_skid',
        p_skid_count - 1,
        v_config.pricing_data->>'cont_skid'
      );

    WHEN 'per_skid' THEN
      -- 每板单价
      IF p_skid_count < (v_config.pricing_data->>'min_skids')::INT THEN
        v_price := (v_config.pricing_data->>'price_per_skid')::DECIMAL *
                   (v_config.pricing_data->>'min_skids')::INT;
        v_breakdown := FORMAT('最低起送%s板×$%s',
          v_config.pricing_data->>'min_skids',
          v_config.pricing_data->>'price_per_skid'
        );
      ELSE
        v_price := (v_config.pricing_data->>'price_per_skid')::DECIMAL * p_skid_count;
        v_breakdown := FORMAT('%s板×$%s',
          p_skid_count,
          v_config.pricing_data->>'price_per_skid'
        );
      END IF;

    WHEN 'full_truck' THEN
      -- 整车定价
      v_price := (v_config.pricing_data->>'truck_price')::DECIMAL;
      v_breakdown := FORMAT('整车价格（最多%s板）',
        v_config.pricing_data->>'max_skids'
      );

  END CASE;

  RETURN QUERY SELECT v_price, v_breakdown, v_config.pricing_mode;
END;
$$ LANGUAGE plpgsql;

-- 9. 插入示例数据
INSERT INTO truck_pricing_configs (
  city_id, zone_id, group_id, name, pricing_mode, priority, pricing_data
) VALUES
-- Toronto城市级板数定价
('toronto', NULL, NULL, 'Toronto默认板数定价', 'skid', 1,
  '{"mode": "skid", "prices": {"1": 90, "2": 108, "3": 126, "4": 144, "5": 162, "6": 180, "7": 198, "8": 216, "9": 234, "10": 252, "11": 270, "12": 288, "13": 306, "14": 324, "15": 342, "16": 360, "16+": 378}}'::jsonb),

-- Calgary城市级首托+续托定价
('calgary', NULL, NULL, 'Calgary首托续托定价', 'first_cont', 1,
  '{"mode": "first_cont", "first_skid": 100, "cont_skid": 20, "max_skids": 16}'::jsonb),

-- Vancouver区域级每板定价
('vancouver', 'zone1', NULL, 'Richmond每板定价', 'per_skid', 2,
  '{"mode": "per_skid", "price_per_skid": 15, "min_skids": 4}'::jsonb),

-- Vancouver区域级整车定价
('vancouver', 'zone5', NULL, 'Kamloops整车定价', 'full_truck', 2,
  '{"mode": "full_truck", "truck_price": 900, "max_skids": 16}'::jsonb);

-- 10. 创建视图方便查询
CREATE OR REPLACE VIEW v_active_pricing_configs AS
SELECT
  pc.*,
  c.name as city_name,
  z.name as zone_name,
  g.name as group_name,
  CASE
    WHEN pc.group_id IS NOT NULL THEN 'Group Level'
    WHEN pc.zone_id IS NOT NULL THEN 'Zone Level'
    ELSE 'City Level'
  END as config_level
FROM truck_pricing_configs pc
LEFT JOIN truck_delivery_cities c ON pc.city_id = c.id
LEFT JOIN truck_delivery_zones z ON pc.zone_id = z.id
LEFT JOIN truck_zone_fsa_groups g ON pc.group_id = g.id
WHERE pc.is_active = true
ORDER BY pc.priority DESC;

-- 结束
COMMENT ON TABLE truck_pricing_configs IS '卡车配送价格配置表V2 - 支持多种定价模式和三级优先级';
COMMENT ON COLUMN truck_pricing_configs.pricing_mode IS '定价模式: skid(板数定价) | first_cont(首托+续托) | per_skid(每板单价) | full_truck(整车)';
COMMENT ON COLUMN truck_pricing_configs.priority IS '优先级：数值越大优先级越高，同级别内按此排序';
COMMENT ON COLUMN truck_pricing_configs.pricing_data IS 'JSON格式的价格配置数据，根据pricing_mode有不同的结构';