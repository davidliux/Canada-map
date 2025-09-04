-- 加拿大邮政配送区域地图系统 - Supabase 数据库架构
-- 在 Supabase Dashboard > SQL Editor 中执行此脚本

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

-- 插入初始数据（8个区域）
INSERT INTO regions (id, name, fsa_codes, postal_codes, weight_ranges, is_active) VALUES
('1', '1区', '[]', '[]', '[
  {"id": "0-10", "min": 0, "max": 10, "price": 15.99, "isActive": true, "label": "0-10 KG"},
  {"id": "10-20", "min": 10, "max": 20, "price": 25.99, "isActive": true, "label": "10-20 KG"},
  {"id": "20-30", "min": 20, "max": 30, "price": 35.99, "isActive": true, "label": "20-30 KG"},
  {"id": "30-50", "min": 30, "max": 50, "price": 55.99, "isActive": true, "label": "30-50 KG"},
  {"id": "50-100", "min": 50, "max": 100, "price": 99.99, "isActive": true, "label": "50-100 KG"}
]', true),
('2', '2区', '[]', '[]', '[
  {"id": "0-10", "min": 0, "max": 10, "price": 18.99, "isActive": true, "label": "0-10 KG"},
  {"id": "10-20", "min": 10, "max": 20, "price": 29.99, "isActive": true, "label": "10-20 KG"},
  {"id": "20-30", "min": 20, "max": 30, "price": 39.99, "isActive": true, "label": "20-30 KG"},
  {"id": "30-50", "min": 30, "max": 50, "price": 59.99, "isActive": true, "label": "30-50 KG"},
  {"id": "50-100", "min": 50, "max": 100, "price": 109.99, "isActive": true, "label": "50-100 KG"}
]', true),
('3', '3区', '[]', '[]', '[
  {"id": "0-10", "min": 0, "max": 10, "price": 22.99, "isActive": true, "label": "0-10 KG"},
  {"id": "10-20", "min": 10, "max": 20, "price": 35.99, "isActive": true, "label": "10-20 KG"},
  {"id": "20-30", "min": 20, "max": 30, "price": 45.99, "isActive": true, "label": "20-30 KG"},
  {"id": "30-50", "min": 30, "max": 50, "price": 69.99, "isActive": true, "label": "30-50 KG"},
  {"id": "50-100", "min": 50, "max": 100, "price": 129.99, "isActive": true, "label": "50-100 KG"}
]', true),
('4', '4区', '[]', '[]', '[
  {"id": "0-10", "min": 0, "max": 10, "price": 24.99, "isActive": true, "label": "0-10 KG"},
  {"id": "10-20", "min": 10, "max": 20, "price": 38.99, "isActive": true, "label": "10-20 KG"},
  {"id": "20-30", "min": 20, "max": 30, "price": 48.99, "isActive": true, "label": "20-30 KG"},
  {"id": "30-50", "min": 30, "max": 50, "price": 72.99, "isActive": true, "label": "30-50 KG"},
  {"id": "50-100", "min": 50, "max": 100, "price": 139.99, "isActive": true, "label": "50-100 KG"}
]', true),
('5', '5区', '[]', '[]', '[
  {"id": "0-10", "min": 0, "max": 10, "price": 26.99, "isActive": true, "label": "0-10 KG"},
  {"id": "10-20", "min": 10, "max": 20, "price": 42.99, "isActive": true, "label": "10-20 KG"},
  {"id": "20-30", "min": 20, "max": 30, "price": 52.99, "isActive": true, "label": "20-30 KG"},
  {"id": "30-50", "min": 30, "max": 50, "price": 78.99, "isActive": true, "label": "30-50 KG"},
  {"id": "50-100", "min": 50, "max": 100, "price": 149.99, "isActive": true, "label": "50-100 KG"}
]', true),
('6', '6区', '[]', '[]', '[
  {"id": "0-10", "min": 0, "max": 10, "price": 28.99, "isActive": true, "label": "0-10 KG"},
  {"id": "10-20", "min": 10, "max": 20, "price": 45.99, "isActive": true, "label": "10-20 KG"},
  {"id": "20-30", "min": 20, "max": 30, "price": 55.99, "isActive": true, "label": "20-30 KG"},
  {"id": "30-50", "min": 30, "max": 50, "price": 82.99, "isActive": true, "label": "30-50 KG"},
  {"id": "50-100", "min": 50, "max": 100, "price": 159.99, "isActive": true, "label": "50-100 KG"}
]', true),
('7', '7区', '[]', '[]', '[
  {"id": "0-10", "min": 0, "max": 10, "price": 30.99, "isActive": true, "label": "0-10 KG"},
  {"id": "10-20", "min": 10, "max": 20, "price": 48.99, "isActive": true, "label": "10-20 KG"},
  {"id": "20-30", "min": 20, "max": 30, "price": 58.99, "isActive": true, "label": "20-30 KG"},
  {"id": "30-50", "min": 30, "max": 50, "price": 86.99, "isActive": true, "label": "30-50 KG"},
  {"id": "50-100", "min": 50, "max": 100, "price": 169.99, "isActive": true, "label": "50-100 KG"}
]', true),
('8', '8区', '[]', '[]', '[
  {"id": "0-10", "min": 0, "max": 10, "price": 32.99, "isActive": true, "label": "0-10 KG"},
  {"id": "10-20", "min": 10, "max": 20, "price": 52.99, "isActive": true, "label": "10-20 KG"},
  {"id": "20-30", "min": 20, "max": 30, "price": 62.99, "isActive": true, "label": "20-30 KG"},
  {"id": "30-50", "min": 30, "max": 50, "price": 92.99, "isActive": true, "label": "30-50 KG"},
  {"id": "50-100", "min": 50, "max": 100, "price": 179.99, "isActive": true, "label": "50-100 KG"}
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
  RAISE NOTICE '   - 每个区域包含 5 个价格区间';
  RAISE NOTICE '   - 数据已准备好使用';
END $$;