-- 插入初始区域数据
INSERT INTO delivery_regions (id, name, description, color_code, display_order) VALUES
('1', '1区', '核心配送区域', '#3B82F6', 1),
('2', '2区', '主要配送区域', '#10B981', 2),
('3', '3区', '扩展配送区域', '#F59E0B', 3),
('4', '4区', '远程配送区域', '#EF4444', 4),
('5', '5区', '特殊配送区域', '#8B5CF6', 5),
('6', '6区', '偏远配送区域', '#EC4899', 6),
('7', '7区', '边缘配送区域', '#6B7280', 7),
('8', '8区', '最远配送区域', '#F97316', 8);

-- 为每个区域插入重量区间价格配置
-- 1区
INSERT INTO weight_ranges (id, region_id, range_name, min_weight, max_weight, price, display_order) VALUES
(gen_random_uuid(), '1', '0-10kg', 0, 10, 15.99, 1),
(gen_random_uuid(), '1', '10-20kg', 10, 20, 25.99, 2),
(gen_random_uuid(), '1', '20-30kg', 20, 30, 35.99, 3),
(gen_random_uuid(), '1', '30-50kg', 30, 50, 55.99, 4),
(gen_random_uuid(), '1', '50-100kg', 50, 100, 99.99, 5);

-- 2区
INSERT INTO weight_ranges (id, region_id, range_name, min_weight, max_weight, price, display_order) VALUES
(gen_random_uuid(), '2', '0-10kg', 0, 10, 18.99, 1),
(gen_random_uuid(), '2', '10-20kg', 10, 20, 29.99, 2),
(gen_random_uuid(), '2', '20-30kg', 20, 30, 39.99, 3),
(gen_random_uuid(), '2', '30-50kg', 30, 50, 59.99, 4),
(gen_random_uuid(), '2', '50-100kg', 50, 100, 109.99, 5);

-- 3区
INSERT INTO weight_ranges (id, region_id, range_name, min_weight, max_weight, price, display_order) VALUES
(gen_random_uuid(), '3', '0-10kg', 0, 10, 22.99, 1),
(gen_random_uuid(), '3', '10-20kg', 10, 20, 35.99, 2),
(gen_random_uuid(), '3', '20-30kg', 20, 30, 45.99, 3),
(gen_random_uuid(), '3', '30-50kg', 30, 50, 69.99, 4),
(gen_random_uuid(), '3', '50-100kg', 50, 100, 129.99, 5);

-- 4区
INSERT INTO weight_ranges (id, region_id, range_name, min_weight, max_weight, price, display_order) VALUES
(gen_random_uuid(), '4', '0-10kg', 0, 10, 28.99, 1),
(gen_random_uuid(), '4', '10-20kg', 10, 20, 42.99, 2),
(gen_random_uuid(), '4', '20-30kg', 20, 30, 55.99, 3),
(gen_random_uuid(), '4', '30-50kg', 30, 50, 85.99, 4),
(gen_random_uuid(), '4', '50-100kg', 50, 100, 159.99, 5);

-- 插入一些示例FSA数据（1区）
INSERT INTO postal_codes (id, region_id, fsa_code, province, city) VALUES
(gen_random_uuid(), '1', 'M5V', 'ON', 'Toronto'),
(gen_random_uuid(), '1', 'M5G', 'ON', 'Toronto'),
(gen_random_uuid(), '1', 'M4Y', 'ON', 'Toronto'),
(gen_random_uuid(), '1', 'V6B', 'BC', 'Vancouver'),
(gen_random_uuid(), '1', 'V6C', 'BC', 'Vancouver'),
(gen_random_uuid(), '1', 'V6E', 'BC', 'Vancouver');

-- 插入一些示例FSA数据（2区）
INSERT INTO postal_codes (id, region_id, fsa_code, province, city) VALUES
(gen_random_uuid(), '2', 'L5B', 'ON', 'Mississauga'),
(gen_random_uuid(), '2', 'L5A', 'ON', 'Mississauga'),
(gen_random_uuid(), '2', 'L4W', 'ON', 'Mississauga'),
(gen_random_uuid(), '2', 'K1A', 'ON', 'Ottawa'),
(gen_random_uuid(), '2', 'K1P', 'ON', 'Ottawa');

-- 插入系统配置
INSERT INTO system_configs (id, config_key, config_value, description) VALUES
(gen_random_uuid(), 'system_version', '"1.0.0"', '系统版本'),
(gen_random_uuid(), 'default_currency', '"CAD"', '默认货币'),
(gen_random_uuid(), 'max_package_weight', '100', '最大包裹重量（kg）');