-- 加拿大邮政配送区域地图系统 - Supabase 数据库初始化
-- 请在 Supabase SQL Editor 中执行此脚本

-- 删除旧表（如果存在）
DROP TABLE IF EXISTS regions CASCADE;

-- 创建区域配置表
CREATE TABLE regions (
  id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  fsa_codes JSONB DEFAULT '[]'::jsonb,
  postal_codes JSONB DEFAULT '[]'::jsonb,
  weight_ranges JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_regions_updated_at
BEFORE UPDATE ON regions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- 创建索引提高查询性能
CREATE INDEX idx_regions_fsa ON regions USING GIN (fsa_codes);
CREATE INDEX idx_regions_active ON regions (is_active);

-- 插入初始数据（8个区域）- 使用你之前配置的默认重量区间
INSERT INTO regions (id, name, fsa_codes, postal_codes, weight_ranges, is_active) VALUES
('1', '1区', '[]', '[]', '[
  {"id": "range_1", "min": 0, "max": 11.000, "label": "0-11.000 KGS", "price": 0, "isActive": true},
  {"id": "range_2", "min": 11.001, "max": 15.000, "label": "11.001-15.000 KGS", "price": 0, "isActive": true},
  {"id": "range_3", "min": 15.001, "max": 20.000, "label": "15.001-20.000 KGS", "price": 0, "isActive": true},
  {"id": "range_4", "min": 20.001, "max": 25.000, "label": "20.001-25.000 KGS", "price": 0, "isActive": true},
  {"id": "range_5", "min": 25.001, "max": 30.000, "label": "25.001-30.000 KGS", "price": 0, "isActive": true},
  {"id": "range_6", "min": 30.001, "max": 35.000, "label": "30.001-35.000 KGS", "price": 0, "isActive": true},
  {"id": "range_7", "min": 35.001, "max": 40.000, "label": "35.001-40.000 KGS", "price": 0, "isActive": true},
  {"id": "range_8", "min": 40.001, "max": 45.000, "label": "40.001-45.000 KGS", "price": 0, "isActive": true},
  {"id": "range_9", "min": 45.001, "max": 50.000, "label": "45.001-50.000 KGS", "price": 0, "isActive": true},
  {"id": "range_10", "min": 50.001, "max": 55.000, "label": "50.001-55.000 KGS", "price": 0, "isActive": true},
  {"id": "range_11", "min": 55.001, "max": 60.000, "label": "55.001-60.000 KGS", "price": 0, "isActive": true},
  {"id": "range_12", "min": 60.001, "max": 64.000, "label": "60.001-64.000 KGS", "price": 0, "isActive": true},
  {"id": "range_13", "min": 64.001, "max": 999999, "label": "64.000+ KGS", "price": 0, "isActive": true}
]', true),
('2', '2区', '[]', '[]', '[
  {"id": "range_1", "min": 0, "max": 11.000, "label": "0-11.000 KGS", "price": 0, "isActive": true},
  {"id": "range_2", "min": 11.001, "max": 15.000, "label": "11.001-15.000 KGS", "price": 0, "isActive": true},
  {"id": "range_3", "min": 15.001, "max": 20.000, "label": "15.001-20.000 KGS", "price": 0, "isActive": true},
  {"id": "range_4", "min": 20.001, "max": 25.000, "label": "20.001-25.000 KGS", "price": 0, "isActive": true},
  {"id": "range_5", "min": 25.001, "max": 30.000, "label": "25.001-30.000 KGS", "price": 0, "isActive": true},
  {"id": "range_6", "min": 30.001, "max": 35.000, "label": "30.001-35.000 KGS", "price": 0, "isActive": true},
  {"id": "range_7", "min": 35.001, "max": 40.000, "label": "35.001-40.000 KGS", "price": 0, "isActive": true},
  {"id": "range_8", "min": 40.001, "max": 45.000, "label": "40.001-45.000 KGS", "price": 0, "isActive": true},
  {"id": "range_9", "min": 45.001, "max": 50.000, "label": "45.001-50.000 KGS", "price": 0, "isActive": true},
  {"id": "range_10", "min": 50.001, "max": 55.000, "label": "50.001-55.000 KGS", "price": 0, "isActive": true},
  {"id": "range_11", "min": 55.001, "max": 60.000, "label": "55.001-60.000 KGS", "price": 0, "isActive": true},
  {"id": "range_12", "min": 60.001, "max": 64.000, "label": "60.001-64.000 KGS", "price": 0, "isActive": true},
  {"id": "range_13", "min": 64.001, "max": 999999, "label": "64.000+ KGS", "price": 0, "isActive": true}
]', true),
('3', '3区', '[]', '[]', '[
  {"id": "range_1", "min": 0, "max": 11.000, "label": "0-11.000 KGS", "price": 0, "isActive": true},
  {"id": "range_2", "min": 11.001, "max": 15.000, "label": "11.001-15.000 KGS", "price": 0, "isActive": true},
  {"id": "range_3", "min": 15.001, "max": 20.000, "label": "15.001-20.000 KGS", "price": 0, "isActive": true},
  {"id": "range_4", "min": 20.001, "max": 25.000, "label": "20.001-25.000 KGS", "price": 0, "isActive": true},
  {"id": "range_5", "min": 25.001, "max": 30.000, "label": "25.001-30.000 KGS", "price": 0, "isActive": true},
  {"id": "range_6", "min": 30.001, "max": 35.000, "label": "30.001-35.000 KGS", "price": 0, "isActive": true},
  {"id": "range_7", "min": 35.001, "max": 40.000, "label": "35.001-40.000 KGS", "price": 0, "isActive": true},
  {"id": "range_8", "min": 40.001, "max": 45.000, "label": "40.001-45.000 KGS", "price": 0, "isActive": true},
  {"id": "range_9", "min": 45.001, "max": 50.000, "label": "45.001-50.000 KGS", "price": 0, "isActive": true},
  {"id": "range_10", "min": 50.001, "max": 55.000, "label": "50.001-55.000 KGS", "price": 0, "isActive": true},
  {"id": "range_11", "min": 55.001, "max": 60.000, "label": "55.001-60.000 KGS", "price": 0, "isActive": true},
  {"id": "range_12", "min": 60.001, "max": 64.000, "label": "60.001-64.000 KGS", "price": 0, "isActive": true},
  {"id": "range_13", "min": 64.001, "max": 999999, "label": "64.000+ KGS", "price": 0, "isActive": true}
]', true),
('4', '4区', '[]', '[]', '[
  {"id": "range_1", "min": 0, "max": 11.000, "label": "0-11.000 KGS", "price": 0, "isActive": true},
  {"id": "range_2", "min": 11.001, "max": 15.000, "label": "11.001-15.000 KGS", "price": 0, "isActive": true},
  {"id": "range_3", "min": 15.001, "max": 20.000, "label": "15.001-20.000 KGS", "price": 0, "isActive": true},
  {"id": "range_4", "min": 20.001, "max": 25.000, "label": "20.001-25.000 KGS", "price": 0, "isActive": true},
  {"id": "range_5", "min": 25.001, "max": 30.000, "label": "25.001-30.000 KGS", "price": 0, "isActive": true},
  {"id": "range_6", "min": 30.001, "max": 35.000, "label": "30.001-35.000 KGS", "price": 0, "isActive": true},
  {"id": "range_7", "min": 35.001, "max": 40.000, "label": "35.001-40.000 KGS", "price": 0, "isActive": true},
  {"id": "range_8", "min": 40.001, "max": 45.000, "label": "40.001-45.000 KGS", "price": 0, "isActive": true},
  {"id": "range_9", "min": 45.001, "max": 50.000, "label": "45.001-50.000 KGS", "price": 0, "isActive": true},
  {"id": "range_10", "min": 50.001, "max": 55.000, "label": "50.001-55.000 KGS", "price": 0, "isActive": true},
  {"id": "range_11", "min": 55.001, "max": 60.000, "label": "55.001-60.000 KGS", "price": 0, "isActive": true},
  {"id": "range_12", "min": 60.001, "max": 64.000, "label": "60.001-64.000 KGS", "price": 0, "isActive": true},
  {"id": "range_13", "min": 64.001, "max": 999999, "label": "64.000+ KGS", "price": 0, "isActive": true}
]', true),
('5', '5区', '[]', '[]', '[
  {"id": "range_1", "min": 0, "max": 11.000, "label": "0-11.000 KGS", "price": 0, "isActive": true},
  {"id": "range_2", "min": 11.001, "max": 15.000, "label": "11.001-15.000 KGS", "price": 0, "isActive": true},
  {"id": "range_3", "min": 15.001, "max": 20.000, "label": "15.001-20.000 KGS", "price": 0, "isActive": true},
  {"id": "range_4", "min": 20.001, "max": 25.000, "label": "20.001-25.000 KGS", "price": 0, "isActive": true},
  {"id": "range_5", "min": 25.001, "max": 30.000, "label": "25.001-30.000 KGS", "price": 0, "isActive": true},
  {"id": "range_6", "min": 30.001, "max": 35.000, "label": "30.001-35.000 KGS", "price": 0, "isActive": true},
  {"id": "range_7", "min": 35.001, "max": 40.000, "label": "35.001-40.000 KGS", "price": 0, "isActive": true},
  {"id": "range_8", "min": 40.001, "max": 45.000, "label": "40.001-45.000 KGS", "price": 0, "isActive": true},
  {"id": "range_9", "min": 45.001, "max": 50.000, "label": "45.001-50.000 KGS", "price": 0, "isActive": true},
  {"id": "range_10", "min": 50.001, "max": 55.000, "label": "50.001-55.000 KGS", "price": 0, "isActive": true},
  {"id": "range_11", "min": 55.001, "max": 60.000, "label": "55.001-60.000 KGS", "price": 0, "isActive": true},
  {"id": "range_12", "min": 60.001, "max": 64.000, "label": "60.001-64.000 KGS", "price": 0, "isActive": true},
  {"id": "range_13", "min": 64.001, "max": 999999, "label": "64.000+ KGS", "price": 0, "isActive": true}
]', true),
('6', '6区', '[]', '[]', '[
  {"id": "range_1", "min": 0, "max": 11.000, "label": "0-11.000 KGS", "price": 0, "isActive": true},
  {"id": "range_2", "min": 11.001, "max": 15.000, "label": "11.001-15.000 KGS", "price": 0, "isActive": true},
  {"id": "range_3", "min": 15.001, "max": 20.000, "label": "15.001-20.000 KGS", "price": 0, "isActive": true},
  {"id": "range_4", "min": 20.001, "max": 25.000, "label": "20.001-25.000 KGS", "price": 0, "isActive": true},
  {"id": "range_5", "min": 25.001, "max": 30.000, "label": "25.001-30.000 KGS", "price": 0, "isActive": true},
  {"id": "range_6", "min": 30.001, "max": 35.000, "label": "30.001-35.000 KGS", "price": 0, "isActive": true},
  {"id": "range_7", "min": 35.001, "max": 40.000, "label": "35.001-40.000 KGS", "price": 0, "isActive": true},
  {"id": "range_8", "min": 40.001, "max": 45.000, "label": "40.001-45.000 KGS", "price": 0, "isActive": true},
  {"id": "range_9", "min": 45.001, "max": 50.000, "label": "45.001-50.000 KGS", "price": 0, "isActive": true},
  {"id": "range_10", "min": 50.001, "max": 55.000, "label": "50.001-55.000 KGS", "price": 0, "isActive": true},
  {"id": "range_11", "min": 55.001, "max": 60.000, "label": "55.001-60.000 KGS", "price": 0, "isActive": true},
  {"id": "range_12", "min": 60.001, "max": 64.000, "label": "60.001-64.000 KGS", "price": 0, "isActive": true},
  {"id": "range_13", "min": 64.001, "max": 999999, "label": "64.000+ KGS", "price": 0, "isActive": true}
]', true),
('7', '7区', '[]', '[]', '[
  {"id": "range_1", "min": 0, "max": 11.000, "label": "0-11.000 KGS", "price": 0, "isActive": true},
  {"id": "range_2", "min": 11.001, "max": 15.000, "label": "11.001-15.000 KGS", "price": 0, "isActive": true},
  {"id": "range_3", "min": 15.001, "max": 20.000, "label": "15.001-20.000 KGS", "price": 0, "isActive": true},
  {"id": "range_4", "min": 20.001, "max": 25.000, "label": "20.001-25.000 KGS", "price": 0, "isActive": true},
  {"id": "range_5", "min": 25.001, "max": 30.000, "label": "25.001-30.000 KGS", "price": 0, "isActive": true},
  {"id": "range_6", "min": 30.001, "max": 35.000, "label": "30.001-35.000 KGS", "price": 0, "isActive": true},
  {"id": "range_7", "min": 35.001, "max": 40.000, "label": "35.001-40.000 KGS", "price": 0, "isActive": true},
  {"id": "range_8", "min": 40.001, "max": 45.000, "label": "40.001-45.000 KGS", "price": 0, "isActive": true},
  {"id": "range_9", "min": 45.001, "max": 50.000, "label": "45.001-50.000 KGS", "price": 0, "isActive": true},
  {"id": "range_10", "min": 50.001, "max": 55.000, "label": "50.001-55.000 KGS", "price": 0, "isActive": true},
  {"id": "range_11", "min": 55.001, "max": 60.000, "label": "55.001-60.000 KGS", "price": 0, "isActive": true},
  {"id": "range_12", "min": 60.001, "max": 64.000, "label": "60.001-64.000 KGS", "price": 0, "isActive": true},
  {"id": "range_13", "min": 64.001, "max": 999999, "label": "64.000+ KGS", "price": 0, "isActive": true}
]', true),
('8', '8区', '[]', '[]', '[
  {"id": "range_1", "min": 0, "max": 11.000, "label": "0-11.000 KGS", "price": 0, "isActive": true},
  {"id": "range_2", "min": 11.001, "max": 15.000, "label": "11.001-15.000 KGS", "price": 0, "isActive": true},
  {"id": "range_3", "min": 15.001, "max": 20.000, "label": "15.001-20.000 KGS", "price": 0, "isActive": true},
  {"id": "range_4", "min": 20.001, "max": 25.000, "label": "20.001-25.000 KGS", "price": 0, "isActive": true},
  {"id": "range_5", "min": 25.001, "max": 30.000, "label": "25.001-30.000 KGS", "price": 0, "isActive": true},
  {"id": "range_6", "min": 30.001, "max": 35.000, "label": "30.001-35.000 KGS", "price": 0, "isActive": true},
  {"id": "range_7", "min": 35.001, "max": 40.000, "label": "35.001-40.000 KGS", "price": 0, "isActive": true},
  {"id": "range_8", "min": 40.001, "max": 45.000, "label": "40.001-45.000 KGS", "price": 0, "isActive": true},
  {"id": "range_9", "min": 45.001, "max": 50.000, "label": "45.001-50.000 KGS", "price": 0, "isActive": true},
  {"id": "range_10", "min": 50.001, "max": 55.000, "label": "50.001-55.000 KGS", "price": 0, "isActive": true},
  {"id": "range_11", "min": 55.001, "max": 60.000, "label": "55.001-60.000 KGS", "price": 0, "isActive": true},
  {"id": "range_12", "min": 60.001, "max": 64.000, "label": "60.001-64.000 KGS", "price": 0, "isActive": true},
  {"id": "range_13", "min": 64.001, "max": 999999, "label": "64.000+ KGS", "price": 0, "isActive": true}
]', true);

-- 启用 RLS (Row Level Security)
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

-- 创建公共访问策略
-- 允许所有人读取
CREATE POLICY "Allow public read access" ON regions
FOR SELECT USING (true);

-- 允许所有人插入、更新、删除（开发阶段，生产环境应限制）
CREATE POLICY "Allow public write access" ON regions
FOR ALL USING (true) WITH CHECK (true);

-- 查询验证
SELECT id, name, 
       jsonb_array_length(fsa_codes) as fsa_count,
       jsonb_array_length(weight_ranges) as price_ranges,
       is_active
FROM regions
ORDER BY id;

-- 成功消息
DO $$
BEGIN
  RAISE NOTICE '✅ Supabase 数据库初始化成功！';
  RAISE NOTICE '   - 创建了 8 个区域';
  RAISE NOTICE '   - 每个区域包含 13 个重量区间';
  RAISE NOTICE '   - 数据已准备好使用';
END $$;