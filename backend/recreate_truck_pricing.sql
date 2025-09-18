-- 删除旧表并重新创建
DROP TABLE IF EXISTS truck_pricing_configs CASCADE;
DROP TABLE IF EXISTS truck_pricing_cache CASCADE;

-- 创建正确的价格配置表
CREATE TABLE truck_pricing_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id VARCHAR(255) NOT NULL,
    zone_id VARCHAR(255),
    group_id VARCHAR(255),
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
CREATE INDEX idx_truck_pricing_city ON truck_pricing_configs(city_id);
CREATE INDEX idx_truck_pricing_zone ON truck_pricing_configs(zone_id);
CREATE INDEX idx_truck_pricing_group ON truck_pricing_configs(group_id);
CREATE INDEX idx_truck_pricing_mode ON truck_pricing_configs(pricing_mode);
CREATE INDEX idx_truck_pricing_active ON truck_pricing_configs(is_active);
CREATE INDEX idx_truck_pricing_priority ON truck_pricing_configs(priority DESC);