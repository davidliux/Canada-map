-- 创建 regions 表
CREATE TABLE IF NOT EXISTS regions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  fsa_codes TEXT[] DEFAULT '{}',
  postal_codes TEXT[] DEFAULT '{}',
  weight_ranges JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_regions_name ON regions(name);
CREATE INDEX IF NOT EXISTS idx_regions_is_active ON regions(is_active);
CREATE INDEX IF NOT EXISTS idx_regions_fsa_codes ON regions USING GIN(fsa_codes);

-- 启用 RLS (Row Level Security)
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

-- 创建策略允许所有人读取
CREATE POLICY "Enable read access for all users" ON regions
  FOR SELECT USING (true);

-- 创建策略允许认证用户写入（可选）
CREATE POLICY "Enable insert for authenticated users only" ON regions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON regions
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON regions
  FOR DELETE USING (auth.role() = 'authenticated');

-- 如果您希望允许匿名用户也能写入，使用下面的策略替代上面的
-- CREATE POLICY "Enable write access for all users" ON regions
--   FOR ALL USING (true) WITH CHECK (true);

-- 创建更新时间的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_regions_updated_at
  BEFORE UPDATE ON regions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 插入一些示例数据（可选）
INSERT INTO regions (id, name, fsa_codes, postal_codes, weight_ranges, is_active)
VALUES 
  ('toronto-downtown', 'Toronto Downtown', ARRAY['M5V', 'M5G', 'M5H'], ARRAY[]::TEXT[], 
   '[{"id": "0-10", "min": 0, "max": 10, "price": 15.99}, {"id": "10-20", "min": 10, "max": 20, "price": 25.99}]'::JSONB, 
   true),
  ('vancouver-metro', 'Vancouver Metro', ARRAY['V6B', 'V6Z', 'V5Y'], ARRAY[]::TEXT[],
   '[{"id": "0-10", "min": 0, "max": 10, "price": 18.99}]'::JSONB,
   true)
ON CONFLICT (id) DO NOTHING;