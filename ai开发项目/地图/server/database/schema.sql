-- 加拿大配送系统数据库架构
-- 支持区域配置、FSA管理、价格配置等功能

-- 配送区域表
CREATE TABLE IF NOT EXISTS delivery_regions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    region_id VARCHAR(10) NOT NULL UNIQUE,
    region_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT -- JSON格式存储额外信息
);

-- FSA邮编表
CREATE TABLE IF NOT EXISTS postal_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fsa_code VARCHAR(3) NOT NULL,
    region_id VARCHAR(10) NOT NULL,
    province VARCHAR(50),
    city VARCHAR(100),
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (region_id) REFERENCES delivery_regions(region_id) ON DELETE CASCADE,
    UNIQUE(fsa_code, region_id)
);

-- 重量区间配置表
CREATE TABLE IF NOT EXISTS weight_ranges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    region_id VARCHAR(10) NOT NULL,
    range_id VARCHAR(50) NOT NULL,
    min_weight DECIMAL(10,3) NOT NULL,
    max_weight DECIMAL(10,3) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    label VARCHAR(100),
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (region_id) REFERENCES delivery_regions(region_id) ON DELETE CASCADE,
    UNIQUE(region_id, range_id)
);

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 数据备份表
CREATE TABLE IF NOT EXISTS data_backups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    backup_name VARCHAR(200) NOT NULL,
    backup_type VARCHAR(50) NOT NULL, -- manual, auto, migration
    backup_data TEXT NOT NULL, -- JSON格式的完整数据
    file_size INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'system'
);

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation_type VARCHAR(50) NOT NULL, -- create, update, delete, backup, restore
    table_name VARCHAR(50),
    record_id VARCHAR(50),
    old_data TEXT, -- JSON格式
    new_data TEXT, -- JSON格式
    user_id VARCHAR(100) DEFAULT 'system',
    ip_address VARCHAR(45),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_postal_codes_fsa ON postal_codes(fsa_code);
CREATE INDEX IF NOT EXISTS idx_postal_codes_region ON postal_codes(region_id);
CREATE INDEX IF NOT EXISTS idx_weight_ranges_region ON weight_ranges(region_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_type ON operation_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_operation_logs_created ON operation_logs(created_at);

-- 插入默认系统配置
INSERT OR IGNORE INTO system_configs (config_key, config_value, description) VALUES
('system_version', '2.1.0', '系统版本号'),
('auto_backup_enabled', 'true', '是否启用自动备份'),
('auto_backup_interval', '30', '自动备份间隔（分钟）'),
('max_backup_count', '50', '最大备份数量'),
('data_retention_days', '365', '数据保留天数');

-- 创建触发器自动更新 updated_at 字段
CREATE TRIGGER IF NOT EXISTS update_delivery_regions_timestamp 
    AFTER UPDATE ON delivery_regions
BEGIN
    UPDATE delivery_regions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_postal_codes_timestamp 
    AFTER UPDATE ON postal_codes
BEGIN
    UPDATE postal_codes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_weight_ranges_timestamp 
    AFTER UPDATE ON weight_ranges
BEGIN
    UPDATE weight_ranges SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_system_configs_timestamp 
    AFTER UPDATE ON system_configs
BEGIN
    UPDATE system_configs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
