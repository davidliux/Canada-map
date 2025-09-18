-- ==========================================
-- 修复定价模式冲突问题
-- 问题：同一层级可以有多个不同模式的激活配置
-- 解决：确保同一层级只能有一个激活的配置
-- ==========================================

-- 1. 首先备份现有数据
CREATE TABLE IF NOT EXISTS truck_pricing_configs_backup_20250917 AS
SELECT * FROM truck_pricing_configs;

-- 2. 清理冲突数据（保留优先级最高的配置）
WITH conflict_configs AS (
  SELECT city_id, zone_id, group_id, COUNT(*) as active_count
  FROM truck_pricing_configs
  WHERE is_active = true
  GROUP BY city_id, zone_id, group_id
  HAVING COUNT(*) > 1
),
configs_to_keep AS (
  SELECT DISTINCT ON (c.city_id, c.zone_id, c.group_id) t.id
  FROM conflict_configs c
  JOIN truck_pricing_configs t
    ON t.city_id = c.city_id
    AND (t.zone_id = c.zone_id OR (t.zone_id IS NULL AND c.zone_id IS NULL))
    AND (t.group_id = c.group_id OR (t.group_id IS NULL AND c.group_id IS NULL))
  WHERE t.is_active = true
  ORDER BY c.city_id, c.zone_id, c.group_id, t.priority DESC, t.updated_at DESC
)
UPDATE truck_pricing_configs
SET is_active = false,
    updated_at = CURRENT_TIMESTAMP,
    updated_by = 'system_fix_conflict'
WHERE id IN (
  SELECT t.id
  FROM truck_pricing_configs t
  JOIN conflict_configs c
    ON t.city_id = c.city_id
    AND (t.zone_id = c.zone_id OR (t.zone_id IS NULL AND c.zone_id IS NULL))
    AND (t.group_id = c.group_id OR (t.group_id IS NULL AND c.group_id IS NULL))
  WHERE t.is_active = true
    AND t.id NOT IN (SELECT id FROM configs_to_keep)
);

-- 3. 删除原有约束
ALTER TABLE truck_pricing_configs
DROP CONSTRAINT IF EXISTS unique_active_config;

-- 4. 创建触发器函数，确保同一层级只有一个激活配置
CREATE OR REPLACE FUNCTION check_single_active_pricing_per_level()
RETURNS TRIGGER AS $$
DECLARE
  v_conflict_count INTEGER;
  v_error_message TEXT;
BEGIN
  -- 只在激活配置时检查
  IF NEW.is_active = true THEN
    -- 检查是否已存在同层级的其他激活配置
    SELECT COUNT(*) INTO v_conflict_count
    FROM truck_pricing_configs
    WHERE city_id = NEW.city_id
      AND (
        (zone_id IS NULL AND NEW.zone_id IS NULL) OR
        (zone_id = NEW.zone_id)
      )
      AND (
        (group_id IS NULL AND NEW.group_id IS NULL) OR
        (group_id = NEW.group_id)
      )
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND is_active = true;

    IF v_conflict_count > 0 THEN
      -- 构建详细的错误信息
      v_error_message := FORMAT(
        '定价配置冲突：%s层级已存在激活的配置。城市:%s, 区域:%s, 分组:%s',
        CASE
          WHEN NEW.group_id IS NOT NULL THEN '分组'
          WHEN NEW.zone_id IS NOT NULL THEN '区域'
          ELSE '城市'
        END,
        NEW.city_id,
        COALESCE(NEW.zone_id, '无'),
        COALESCE(NEW.group_id, '无')
      );
      RAISE EXCEPTION '%', v_error_message;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 创建触发器
DROP TRIGGER IF EXISTS ensure_single_active_pricing ON truck_pricing_configs;
CREATE TRIGGER ensure_single_active_pricing
  BEFORE INSERT OR UPDATE ON truck_pricing_configs
  FOR EACH ROW
  EXECUTE FUNCTION check_single_active_pricing_per_level();

-- 6. 创建部分唯一索引作为额外保障
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_active_pricing
ON truck_pricing_configs(city_id, COALESCE(zone_id, ''), COALESCE(group_id, ''))
WHERE is_active = true;

-- 7. 添加注释说明
COMMENT ON FUNCTION check_single_active_pricing_per_level() IS
'确保同一层级（城市/区域/分组）只能有一个激活的定价配置，不管定价模式是什么';

COMMENT ON INDEX idx_single_active_pricing IS
'确保同一层级只有一个激活的定价配置的唯一索引';

-- 8. 验证修复结果
DO $$
DECLARE
  v_conflict_count INTEGER;
BEGIN
  -- 检查是否还有冲突
  SELECT COUNT(*) INTO v_conflict_count
  FROM (
    SELECT city_id, zone_id, group_id, COUNT(*) as active_count
    FROM truck_pricing_configs
    WHERE is_active = true
    GROUP BY city_id, zone_id, group_id
    HAVING COUNT(*) > 1
  ) conflicts;

  IF v_conflict_count > 0 THEN
    RAISE WARNING '警告：仍存在 % 组冲突的配置', v_conflict_count;
  ELSE
    RAISE NOTICE '✓ 数据清理完成，没有冲突的配置';
  END IF;

  -- 显示清理统计
  RAISE NOTICE '✓ 触发器和索引创建完成';
  RAISE NOTICE '✓ 约束修复完成，同一层级现在只能有一个激活的定价配置';
END $$;

-- 9. 创建数据一致性检查函数（供后续使用）
CREATE OR REPLACE FUNCTION check_pricing_config_consistency()
RETURNS TABLE(
  level TEXT,
  city_id VARCHAR,
  zone_id VARCHAR,
  group_id VARCHAR,
  active_configs INTEGER,
  modes TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN pc.group_id IS NOT NULL THEN '分组级'
      WHEN pc.zone_id IS NOT NULL THEN '区域级'
      ELSE '城市级'
    END as level,
    pc.city_id,
    pc.zone_id,
    pc.group_id,
    COUNT(*)::INTEGER as active_configs,
    array_agg(pc.pricing_mode ORDER BY pc.priority DESC) as modes
  FROM truck_pricing_configs pc
  WHERE pc.is_active = true
  GROUP BY pc.city_id, pc.zone_id, pc.group_id
  HAVING COUNT(*) > 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_pricing_config_consistency() IS
'检查定价配置一致性，返回存在冲突的配置';

-- 使用示例：SELECT * FROM check_pricing_config_consistency();