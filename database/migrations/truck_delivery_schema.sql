-- 卡车配送数据库架构
-- 创建时间: 2025-01-11
-- 描述: 支持卡车配送功能的完整数据库架构

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 创建基础表（如果不存在）
-- 区域表
CREATE TABLE IF NOT EXISTS regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    fsa_list TEXT[], -- FSA代码数组
    postal_codes TEXT[], -- 邮政编码数组
    price_config JSONB, -- 价格配置
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建卡车配送城市表
CREATE TABLE IF NOT EXISTS truck_delivery_cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    province VARCHAR(50) NOT NULL,
    center_lat DECIMAL(10, 6),
    center_lng DECIMAL(10, 6),
    theme_color VARCHAR(7), -- 十六进制颜色
    total_regions INTEGER DEFAULT 0,
    total_fsas INTEGER DEFAULT 0,
    total_population INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建卡车配送区域表
CREATE TABLE IF NOT EXISTS truck_delivery_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID NOT NULL REFERENCES truck_delivery_cities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    level INTEGER CHECK (level >= 1 AND level <= 5) DEFAULT 3,
    fsa_codes TEXT[], -- FSA代码数组
    boundaries JSONB, -- GeoJSON边界数据
    coverage_area DECIMAL(10, 2), -- 覆盖面积（平方公里）
    coverage_population INTEGER, -- 覆盖人口
    avg_delivery_time DECIMAL(4, 2), -- 平均配送时间（小时）
    daily_capacity INTEGER, -- 日配送能力
    active_drivers INTEGER, -- 活跃司机数
    color VARCHAR(7), -- 显示颜色
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(city_id, name)
);

-- 创建卡车配送价格表
CREATE TABLE IF NOT EXISTS truck_zone_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id UUID NOT NULL REFERENCES truck_delivery_zones(id) ON DELETE CASCADE,
    weight_range_id VARCHAR(20) NOT NULL, -- range_1 to range_13
    min_weight DECIMAL(10, 2) NOT NULL,
    max_weight DECIMAL(10, 2) NOT NULL,
    label VARCHAR(50) NOT NULL, -- 如 "0-11 KGS"
    price DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    effective_date DATE,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(zone_id, weight_range_id)
);

-- 创建卡车配送司机表
CREATE TABLE IF NOT EXISTS truck_drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id UUID REFERENCES truck_delivery_zones(id) ON DELETE SET NULL,
    driver_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    vehicle_type VARCHAR(50),
    vehicle_number VARCHAR(50),
    max_capacity DECIMAL(10, 2), -- 最大载重（公斤）
    is_active BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'available', -- available, busy, offline
    last_location_lat DECIMAL(10, 6),
    last_location_lng DECIMAL(10, 6),
    last_location_update TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建卡车配送订单表
CREATE TABLE IF NOT EXISTS truck_delivery_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    zone_id UUID REFERENCES truck_delivery_zones(id),
    driver_id UUID REFERENCES truck_drivers(id),
    sender_postal_code VARCHAR(10),
    receiver_postal_code VARCHAR(10),
    weight DECIMAL(10, 2),
    price DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'pending', -- pending, assigned, in_transit, delivered, cancelled
    pickup_time TIMESTAMP WITH TIME ZONE,
    delivery_time TIMESTAMP WITH TIME ZONE,
    actual_delivery_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    tracking_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX idx_truck_zones_city_id ON truck_delivery_zones(city_id);
CREATE INDEX idx_truck_zones_level ON truck_delivery_zones(level);
CREATE INDEX idx_truck_zones_active ON truck_delivery_zones(is_active);
CREATE INDEX idx_truck_zone_prices_zone_id ON truck_zone_prices(zone_id);
CREATE INDEX idx_truck_drivers_zone_id ON truck_drivers(zone_id);
CREATE INDEX idx_truck_drivers_status ON truck_drivers(status);
CREATE INDEX idx_truck_orders_zone_id ON truck_delivery_orders(zone_id);
CREATE INDEX idx_truck_orders_driver_id ON truck_delivery_orders(driver_id);
CREATE INDEX idx_truck_orders_status ON truck_delivery_orders(status);
CREATE INDEX idx_truck_orders_created ON truck_delivery_orders(created_at DESC);

-- FSA代码的GIN索引（用于数组搜索）
CREATE INDEX idx_truck_zones_fsa_codes ON truck_delivery_zones USING GIN (fsa_codes);

-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为各表添加更新时间戳触发器
CREATE TRIGGER update_truck_cities_updated_at BEFORE UPDATE
    ON truck_delivery_cities FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_truck_zones_updated_at BEFORE UPDATE
    ON truck_delivery_zones FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_truck_prices_updated_at BEFORE UPDATE
    ON truck_zone_prices FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_truck_drivers_updated_at BEFORE UPDATE
    ON truck_drivers FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_truck_orders_updated_at BEFORE UPDATE
    ON truck_delivery_orders FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 创建视图：城市区域统计
CREATE OR REPLACE VIEW truck_city_zone_stats AS
SELECT 
    c.id AS city_id,
    c.name AS city_name,
    c.province,
    COUNT(z.id) AS total_zones,
    COUNT(DISTINCT z.level) AS zone_levels,
    SUM(CASE WHEN z.is_active THEN 1 ELSE 0 END) AS active_zones,
    SUM(z.active_drivers) AS total_drivers,
    AVG(z.avg_delivery_time) AS avg_delivery_time,
    SUM(z.daily_capacity) AS total_daily_capacity
FROM truck_delivery_cities c
LEFT JOIN truck_delivery_zones z ON c.id = z.city_id
GROUP BY c.id, c.name, c.province;

-- 创建视图：区域价格摘要
CREATE OR REPLACE VIEW truck_zone_price_summary AS
SELECT 
    z.id AS zone_id,
    z.name AS zone_name,
    z.city_id,
    COUNT(p.id) AS price_ranges,
    MIN(p.price) AS min_price,
    MAX(p.price) AS max_price,
    AVG(p.price) AS avg_price
FROM truck_delivery_zones z
LEFT JOIN truck_zone_prices p ON z.id = p.zone_id AND p.is_active = true
GROUP BY z.id, z.name, z.city_id;

-- 插入初始数据（示例城市）
INSERT INTO truck_delivery_cities (name, province, center_lat, center_lng, theme_color) VALUES
    ('Toronto', 'ON', 43.6532, -79.3832, '#FF5733'),
    ('Vancouver', 'BC', 49.2827, -123.1207, '#3366CC'),
    ('Montreal', 'QC', 45.5017, -73.5673, '#109618'),
    ('Calgary', 'AB', 51.0447, -114.0719, '#DC3912'),
    ('Ottawa', 'ON', 45.4215, -75.6972, '#990099')
ON CONFLICT (name) DO NOTHING;

-- 为Toronto创建示例区域
INSERT INTO truck_delivery_zones (
    city_id, 
    name, 
    level, 
    fsa_codes, 
    coverage_area, 
    coverage_population,
    avg_delivery_time,
    daily_capacity,
    active_drivers,
    color
)
SELECT 
    id,
    'Downtown Core',
    1,
    ARRAY['M5V', 'M5G', 'M5H'],
    25.5,
    150000,
    1.5,
    500,
    15,
    '#10B981'
FROM truck_delivery_cities WHERE name = 'Toronto'
ON CONFLICT (city_id, name) DO NOTHING;

-- 授权（如果需要特定用户）
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;

-- 输出成功消息
DO $$
BEGIN
    RAISE NOTICE '✅ 卡车配送数据库架构创建成功！';
    RAISE NOTICE '📊 已创建表: truck_delivery_cities, truck_delivery_zones, truck_zone_prices, truck_drivers, truck_delivery_orders';
    RAISE NOTICE '🔍 已创建索引和触发器';
    RAISE NOTICE '📈 已创建统计视图';
    RAISE NOTICE '🌱 已插入示例数据';
END $$;