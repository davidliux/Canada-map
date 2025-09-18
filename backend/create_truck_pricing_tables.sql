-- 创建卡车配送价格配置表和相关存储过程
-- 用于支持四种定价模式的价格管理系统

-- 创建价格配置表
CREATE TABLE IF NOT EXISTS truck_pricing_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID NOT NULL,
    zone_id UUID,
    group_id UUID,
    name VARCHAR(255) NOT NULL,
    pricing_mode VARCHAR(20) NOT NULL CHECK (pricing_mode IN ('skid', 'first_cont', 'per_skid', 'full_truck')),
    pricing_data JSONB NOT NULL,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    applicable_fsas TEXT[],
    min_distance DECIMAL(10,2),
    max_distance DECIMAL(10,2),
    metadata JSONB,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_truck_pricing_city ON truck_pricing_configs(city_id);
CREATE INDEX IF NOT EXISTS idx_truck_pricing_zone ON truck_pricing_configs(zone_id);
CREATE INDEX IF NOT EXISTS idx_truck_pricing_group ON truck_pricing_configs(group_id);
CREATE INDEX IF NOT EXISTS idx_truck_pricing_mode ON truck_pricing_configs(pricing_mode);
CREATE INDEX IF NOT EXISTS idx_truck_pricing_active ON truck_pricing_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_truck_pricing_priority ON truck_pricing_configs(priority DESC);

-- 创建缓存表
CREATE TABLE IF NOT EXISTS truck_pricing_cache (
    cache_key VARCHAR(255) PRIMARY KEY,
    city_id UUID,
    zone_id UUID,
    group_id UUID,
    fsa_code VARCHAR(3),
    config_id UUID,
    pricing_mode VARCHAR(20),
    pricing_data JSONB,
    hit_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cache_expires ON truck_pricing_cache(expires_at);

-- 创建活跃配置视图
CREATE OR REPLACE VIEW v_active_pricing_configs AS
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

-- 创建获取适用价格配置的函数
CREATE OR REPLACE FUNCTION get_applicable_pricing(
    p_city_id UUID,
    p_zone_id UUID DEFAULT NULL,
    p_group_id UUID DEFAULT NULL,
    p_fsa_code VARCHAR(3) DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    pricing_mode VARCHAR(20),
    pricing_data JSONB,
    priority INTEGER,
    config_level INTEGER,
    city_id UUID,
    zone_id UUID,
    group_id UUID
) AS $$
BEGIN
    -- 首先尝试从缓存获取
    IF EXISTS (
        SELECT 1 FROM truck_pricing_cache
        WHERE cache_key = CONCAT(p_city_id, '_', COALESCE(p_zone_id::TEXT, 'null'), '_', COALESCE(p_group_id::TEXT, 'null'), '_', COALESCE(p_fsa_code, 'null'))
        AND expires_at > NOW()
    ) THEN
        UPDATE truck_pricing_cache
        SET hit_count = hit_count + 1
        WHERE cache_key = CONCAT(p_city_id, '_', COALESCE(p_zone_id::TEXT, 'null'), '_', COALESCE(p_group_id::TEXT, 'null'), '_', COALESCE(p_fsa_code, 'null'));
    END IF;

    RETURN QUERY
    SELECT
        tpc.id,
        tpc.name,
        tpc.pricing_mode,
        tpc.pricing_data,
        tpc.priority,
        CASE
            WHEN tpc.group_id IS NOT NULL THEN 3
            WHEN tpc.zone_id IS NOT NULL THEN 2
            ELSE 1
        END as config_level,
        tpc.city_id,
        tpc.zone_id,
        tpc.group_id
    FROM truck_pricing_configs tpc
    WHERE
        tpc.is_active = true
        AND tpc.city_id = p_city_id
        AND (
            -- 优先级3：分组级别
            (p_group_id IS NOT NULL AND tpc.group_id = p_group_id)
            OR
            -- 优先级2：区域级别
            (p_zone_id IS NOT NULL AND tpc.zone_id = p_zone_id AND tpc.group_id IS NULL)
            OR
            -- 优先级1：城市级别
            (tpc.zone_id IS NULL AND tpc.group_id IS NULL)
            OR
            -- FSA 特殊规则
            (p_fsa_code IS NOT NULL AND tpc.applicable_fsas @> ARRAY[p_fsa_code])
        )
    ORDER BY
        CASE
            WHEN tpc.group_id IS NOT NULL THEN 3
            WHEN tpc.zone_id IS NOT NULL THEN 2
            ELSE 1
        END DESC,
        tpc.priority DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 创建计算价格的函数
CREATE OR REPLACE FUNCTION calculate_truck_price(
    p_config_id UUID,
    p_skid_count INTEGER
)
RETURNS TABLE (
    price DECIMAL(10,2),
    breakdown JSONB,
    mode VARCHAR(20)
) AS $$
DECLARE
    v_config RECORD;
    v_price DECIMAL(10,2);
    v_breakdown JSONB;
BEGIN
    -- 获取配置
    SELECT pricing_mode, pricing_data
    INTO v_config
    FROM truck_pricing_configs
    WHERE id = p_config_id AND is_active = true;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- 根据定价模式计算价格
    CASE v_config.pricing_mode
        WHEN 'skid' THEN
            -- 板数定价
            IF p_skid_count <= 16 THEN
                v_price := (v_config.pricing_data->'prices'->>(p_skid_count::TEXT))::DECIMAL;
            ELSE
                v_price := (v_config.pricing_data->'prices'->>'16+')::DECIMAL;
            END IF;
            v_breakdown := jsonb_build_object(
                'skid_count', p_skid_count,
                'unit_price', v_price,
                'total', v_price
            );

        WHEN 'first_cont' THEN
            -- 首托续托定价
            v_price := (v_config.pricing_data->>'first_skid')::DECIMAL;
            IF p_skid_count > 1 THEN
                v_price := v_price + ((p_skid_count - 1) * (v_config.pricing_data->>'cont_skid')::DECIMAL);
            END IF;
            v_breakdown := jsonb_build_object(
                'first_skid', (v_config.pricing_data->>'first_skid')::DECIMAL,
                'cont_skid', (v_config.pricing_data->>'cont_skid')::DECIMAL,
                'skid_count', p_skid_count,
                'total', v_price
            );

        WHEN 'per_skid' THEN
            -- 每板定价
            v_price := p_skid_count * (v_config.pricing_data->>'price_per_skid')::DECIMAL;
            v_breakdown := jsonb_build_object(
                'price_per_skid', (v_config.pricing_data->>'price_per_skid')::DECIMAL,
                'skid_count', p_skid_count,
                'total', v_price
            );

        WHEN 'full_truck' THEN
            -- 整车定价
            v_price := (v_config.pricing_data->>'truck_price')::DECIMAL;
            v_breakdown := jsonb_build_object(
                'truck_price', v_price,
                'max_skids', COALESCE((v_config.pricing_data->>'max_skids')::INTEGER, 26),
                'skid_count', p_skid_count,
                'total', v_price
            );

        ELSE
            RETURN;
    END CASE;

    RETURN QUERY SELECT v_price, v_breakdown, v_config.pricing_mode;
END;
$$ LANGUAGE plpgsql;

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER truck_pricing_configs_updated_at
    BEFORE UPDATE ON truck_pricing_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- 创建清理过期缓存的函数
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM truck_pricing_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;