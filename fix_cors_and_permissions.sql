-- 1. 首先确保 regions 表存在
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

-- 2. 确保 RLS 已启用
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

-- 3. 删除旧的策略（如果存在）
DROP POLICY IF EXISTS "Enable read access for all users" ON regions;
DROP POLICY IF EXISTS "Enable insert for all users" ON regions;
DROP POLICY IF EXISTS "Enable update for all users" ON regions;
DROP POLICY IF EXISTS "Enable delete for all users" ON regions;

-- 4. 创建新的公开访问策略（用于测试）
CREATE POLICY "Public read access" ON regions
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public insert access" ON regions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public update access" ON regions
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete access" ON regions
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- 5. 插入测试数据
INSERT INTO regions (id, name, fsa_codes, weight_ranges, is_active)
VALUES 
  ('test-region', 'Test Region', ARRAY['M5V'], '[]'::JSONB, true)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      updated_at = NOW();

-- 6. 验证表和数据
SELECT * FROM regions;

-- 7. 确保 PostgREST 可以访问表
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 8. 刷新权限
NOTIFY pgrst, 'reload schema';