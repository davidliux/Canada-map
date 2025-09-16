-- 卡车配送系统数据库表创建脚本
-- PostgreSQL Database Migration for Truck Delivery System

-- 删除旧表（如果存在）
DROP TABLE IF EXISTS truck_delivery_price_ranges CASCADE;
DROP TABLE IF EXISTS truck_delivery_prices CASCADE;
DROP TABLE IF EXISTS truck_delivery_fsa CASCADE;
DROP TABLE IF EXISTS truck_delivery_fsa_index CASCADE;
DROP TABLE IF EXISTS truck_delivery_regions CASCADE;
DROP TABLE IF EXISTS truck_delivery_cities CASCADE;

-- 创建城市表
CREATE TABLE truck_delivery_cities (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    province VARCHAR(2) NOT NULL,
    theme_color VARCHAR(7) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1
);

-- 创建索引
CREATE INDEX idx_truck_cities_province ON truck_delivery_cities(province);
CREATE INDEX idx_truck_cities_active ON truck_delivery_cities(is_active);

-- 创建区域表
CREATE TABLE truck_delivery_regions (
    id VARCHAR(50) PRIMARY KEY,
    city_id VARCHAR(50) NOT NULL,
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 10),
    name VARCHAR(100) NOT NULL,
    display_color VARCHAR(7),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1,
    FOREIGN KEY (city_id) REFERENCES truck_delivery_cities(id) ON DELETE CASCADE,
    UNIQUE(city_id, level)
);

-- 创建索引
CREATE INDEX idx_truck_regions_city ON truck_delivery_regions(city_id);
CREATE INDEX idx_truck_regions_active ON truck_delivery_regions(is_active);

-- 创建FSA表
CREATE TABLE truck_delivery_fsa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id VARCHAR(50) NOT NULL,
    fsa_code VARCHAR(3) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (region_id) REFERENCES truck_delivery_regions(id) ON DELETE CASCADE,
    UNIQUE(region_id, fsa_code)
);

-- 创建索引
CREATE INDEX idx_truck_fsa_region ON truck_delivery_fsa(region_id);
CREATE INDEX idx_truck_fsa_code ON truck_delivery_fsa(fsa_code);

-- 创建FSA索引表（用于快速查找）
CREATE TABLE truck_delivery_fsa_index (
    fsa_code VARCHAR(3) PRIMARY KEY,
    city_id VARCHAR(50) NOT NULL,
    region_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_truck_fsa_index_city ON truck_delivery_fsa_index(city_id);

-- 创建价格表
CREATE TABLE truck_delivery_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id VARCHAR(50) UNIQUE NOT NULL,
    currency VARCHAR(3) DEFAULT 'CAD',
    effective_date DATE,
    expiry_date DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (region_id) REFERENCES truck_delivery_regions(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_truck_prices_region ON truck_delivery_prices(region_id);

-- 创建价格区间表
CREATE TABLE truck_delivery_price_ranges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    price_id UUID NOT NULL,
    range_id VARCHAR(20) NOT NULL,
    min_weight DECIMAL(8,2) NOT NULL,
    max_weight DECIMAL(8,2) NOT NULL,
    label VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (price_id) REFERENCES truck_delivery_prices(id) ON DELETE CASCADE,
    UNIQUE(price_id, range_id)
);

-- 创建索引
CREATE INDEX idx_truck_price_ranges_price ON truck_delivery_price_ranges(price_id);
CREATE INDEX idx_truck_price_ranges_active ON truck_delivery_price_ranges(is_active);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 应用触发器到所有表
CREATE TRIGGER update_truck_cities_updated_at BEFORE UPDATE ON truck_delivery_cities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_truck_regions_updated_at BEFORE UPDATE ON truck_delivery_regions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_truck_fsa_index_updated_at BEFORE UPDATE ON truck_delivery_fsa_index
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_truck_prices_updated_at BEFORE UPDATE ON truck_delivery_prices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_truck_price_ranges_updated_at BEFORE UPDATE ON truck_delivery_price_ranges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入示例数据（可选）
-- INSERT INTO truck_delivery_cities (id, name, province, theme_color)
-- VALUES 
--     ('city_demo_toronto', 'Toronto', 'ON', '#FF6B6B'),
--     ('city_demo_montreal', 'Montreal', 'QC', '#4ECDC4'),
--     ('city_demo_vancouver', 'Vancouver', 'BC', '#45B7D1');

-- 查询验证
SELECT 'Truck Delivery tables created successfully!' as message;