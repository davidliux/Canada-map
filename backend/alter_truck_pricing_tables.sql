-- 添加缺失的列到 truck_pricing_configs 表
ALTER TABLE truck_pricing_configs
ADD COLUMN IF NOT EXISTS applicable_fsas TEXT[];

ALTER TABLE truck_pricing_configs
ADD COLUMN IF NOT EXISTS min_distance DECIMAL(10,2);

ALTER TABLE truck_pricing_configs
ADD COLUMN IF NOT EXISTS max_distance DECIMAL(10,2);

ALTER TABLE truck_pricing_configs
ADD COLUMN IF NOT EXISTS metadata JSONB;

ALTER TABLE truck_pricing_configs
ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);

ALTER TABLE truck_pricing_configs
ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

-- 重新创建视图
DROP VIEW IF EXISTS v_active_pricing_configs;

CREATE VIEW v_active_pricing_configs AS
SELECT
    id,
    city_id,
    zone_id,
    group_id,
    name,
    pricing_mode,
    pricing_data,
    priority,
    CASE
        WHEN group_id IS NOT NULL THEN 3
        WHEN zone_id IS NOT NULL THEN 2
        ELSE 1
    END as config_level,
    applicable_fsas,
    created_at,
    updated_at
FROM truck_pricing_configs
WHERE is_active = true
ORDER BY priority DESC, config_level DESC;