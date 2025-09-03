-- 加拿大快递配送区域地图系统数据库设计
-- PostgreSQL 15+ 兼容

-- 创建数据库
CREATE DATABASE canada_postal_delivery;

-- 使用数据库
\c canada_postal_delivery;

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- 地理数据支持（可选）

-- 1. 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 配送区域表
CREATE TABLE delivery_regions (
    id VARCHAR(10) PRIMARY KEY, -- '1', '2', ..., '8'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    color_code VARCHAR(7), -- 十六进制颜色代码
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 邮编表（FSA - Forward Sortation Area）
CREATE TABLE postal_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region_id VARCHAR(10) REFERENCES delivery_regions(id) ON DELETE CASCADE,
    fsa_code VARCHAR(3) NOT NULL, -- 加拿大FSA代码，如 'V6B'
    province VARCHAR(2), -- 省份代码，如 'BC', 'ON'
    city VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(region_id, fsa_code)
);

-- 4. 重量区间表
CREATE TABLE weight_ranges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region_id VARCHAR(10) REFERENCES delivery_regions(id) ON DELETE CASCADE,
    range_name VARCHAR(100) NOT NULL,
    min_weight DECIMAL(8,3) NOT NULL, -- 最小重量（KG）
    max_weight DECIMAL(8,3) NOT NULL, -- 最大重量（KG）
    price DECIMAL(10,2) NOT NULL DEFAULT 0, -- 价格（CAD）
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (min_weight >= 0 AND max_weight > min_weight AND price >= 0)
);

-- 5. 系统配置表
CREATE TABLE system_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. 操作日志表（审计）
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT
    table_name VARCHAR(50),
    record_id VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. 数据版本表
CREATE TABLE data_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_number VARCHAR(20) NOT NULL,
    description TEXT,
    data_snapshot JSONB NOT NULL, -- 完整数据快照
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. API访问令牌表
CREATE TABLE api_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_name VARCHAR(100) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    permissions JSONB DEFAULT '[]', -- 权限数组
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_postal_codes_region_id ON postal_codes(region_id);
CREATE INDEX idx_postal_codes_fsa_code ON postal_codes(fsa_code);
CREATE INDEX idx_weight_ranges_region_id ON weight_ranges(region_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_regions_updated_at BEFORE UPDATE ON delivery_regions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_postal_codes_updated_at BEFORE UPDATE ON postal_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weight_ranges_updated_at BEFORE UPDATE ON weight_ranges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_configs_updated_at BEFORE UPDATE ON system_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入初始数据

-- 创建默认管理员用户
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@canadapostal.com', '$2b$10$example_hash', '系统管理员', 'admin');

-- 创建8个默认配送区域
INSERT INTO delivery_regions (id, name, description, display_order, color_code) VALUES
('1', '区域1', '配送区域1', 1, '#3B82F6'),
('2', '区域2', '配送区域2', 2, '#10B981'),
('3', '区域3', '配送区域3', 3, '#F59E0B'),
('4', '区域4', '配送区域4', 4, '#EF4444'),
('5', '区域5', '配送区域5', 5, '#8B5CF6'),
('6', '区域6', '配送区域6', 6, '#06B6D4'),
('7', '区域7', '配送区域7', 7, '#84CC16'),
('8', '区域8', '配送区域8', 8, '#F97316');

-- 插入默认重量区间（为每个区域）
INSERT INTO weight_ranges (region_id, range_name, min_weight, max_weight, price, display_order) 
SELECT 
    r.id,
    CASE 
        WHEN w.range_order = 1 THEN '0-11.000 KGS'
        WHEN w.range_order = 2 THEN '11.001-15.000 KGS'
        WHEN w.range_order = 3 THEN '15.001-20.000 KGS'
        WHEN w.range_order = 4 THEN '20.001-25.000 KGS'
        WHEN w.range_order = 5 THEN '25.001-30.000 KGS'
    END,
    CASE 
        WHEN w.range_order = 1 THEN 0.000
        WHEN w.range_order = 2 THEN 11.001
        WHEN w.range_order = 3 THEN 15.001
        WHEN w.range_order = 4 THEN 20.001
        WHEN w.range_order = 5 THEN 25.001
    END,
    CASE 
        WHEN w.range_order = 1 THEN 11.000
        WHEN w.range_order = 2 THEN 15.000
        WHEN w.range_order = 3 THEN 20.000
        WHEN w.range_order = 4 THEN 25.000
        WHEN w.range_order = 5 THEN 30.000
    END,
    0.00,
    w.range_order
FROM delivery_regions r
CROSS JOIN (
    SELECT 1 as range_order UNION ALL
    SELECT 2 UNION ALL
    SELECT 3 UNION ALL
    SELECT 4 UNION ALL
    SELECT 5
) w;

-- 插入系统配置
INSERT INTO system_configs (config_key, config_value, description) VALUES
('app_version', '"2.0.0"', '应用版本号'),
('max_postal_codes_per_region', '1000', '每个区域最大邮编数量'),
('data_backup_interval', '24', '数据备份间隔（小时）'),
('api_rate_limit', '{"requests": 1000, "window": 3600}', 'API速率限制配置');

-- 创建视图：区域统计信息
CREATE VIEW region_stats AS
SELECT 
    r.id,
    r.name,
    r.is_active,
    COUNT(DISTINCT pc.id) as postal_code_count,
    COUNT(DISTINCT wr.id) as weight_range_count,
    COUNT(DISTINCT CASE WHEN pc.is_active THEN pc.id END) as active_postal_codes,
    COUNT(DISTINCT CASE WHEN wr.is_active THEN wr.id END) as active_weight_ranges
FROM delivery_regions r
LEFT JOIN postal_codes pc ON r.id = pc.region_id
LEFT JOIN weight_ranges wr ON r.id = wr.region_id
GROUP BY r.id, r.name, r.is_active;

-- 创建函数：计算配送价格
CREATE OR REPLACE FUNCTION calculate_shipping_price(
    p_region_id VARCHAR(10),
    p_weight DECIMAL(8,3)
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    result_price DECIMAL(10,2);
BEGIN
    SELECT price INTO result_price
    FROM weight_ranges
    WHERE region_id = p_region_id
      AND is_active = true
      AND p_weight >= min_weight
      AND p_weight <= max_weight
    ORDER BY min_weight
    LIMIT 1;
    
    RETURN COALESCE(result_price, 0.00);
END;
$$ LANGUAGE plpgsql;

-- 创建函数：验证FSA代码格式
CREATE OR REPLACE FUNCTION validate_fsa_code(fsa_code VARCHAR(3)) 
RETURNS BOOLEAN AS $$
BEGIN
    -- 加拿大FSA格式：字母-数字-字母
    RETURN fsa_code ~ '^[A-Z][0-9][A-Z]$';
END;
$$ LANGUAGE plpgsql;

-- 添加FSA代码验证约束
ALTER TABLE postal_codes ADD CONSTRAINT check_fsa_format 
CHECK (validate_fsa_code(fsa_code));

COMMENT ON DATABASE canada_postal_delivery IS '加拿大快递配送区域地图系统数据库';
COMMENT ON TABLE users IS '用户表';
COMMENT ON TABLE delivery_regions IS '配送区域表';
COMMENT ON TABLE postal_codes IS '邮编表（FSA代码）';
COMMENT ON TABLE weight_ranges IS '重量区间表';
COMMENT ON TABLE audit_logs IS '操作审计日志表';
COMMENT ON TABLE data_versions IS '数据版本快照表';
