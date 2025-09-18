-- 添加权限管理系统表
-- 此脚本用于创建权限组、用户权限、查询限制等表

-- 创建权限组表
CREATE TABLE IF NOT EXISTS permission_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建用户权限关联表
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  group_id UUID NOT NULL,
  modules JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_user_permissions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_permissions_group FOREIGN KEY (group_id) REFERENCES permission_groups(id) ON DELETE CASCADE,
  CONSTRAINT uk_user_permissions UNIQUE(user_id, group_id)
);

-- 创建用户查询限制表
CREATE TABLE IF NOT EXISTS user_query_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  query_type VARCHAR(50) NOT NULL,
  daily_limit INTEGER NOT NULL,
  monthly_limit INTEGER,
  used_today INTEGER DEFAULT 0,
  used_this_month INTEGER DEFAULT 0,
  last_reset TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_user_query_limits_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uk_user_query_limits UNIQUE(user_id, query_type)
);

-- 创建用户查询日志表
CREATE TABLE IF NOT EXISTS user_query_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  query_type VARCHAR(50) NOT NULL,
  module VARCHAR(100) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  response_time INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_user_query_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_group ON user_permissions(group_id);
CREATE INDEX IF NOT EXISTS idx_user_query_limits_user ON user_query_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_query_limits_type ON user_query_limits(query_type);
CREATE INDEX IF NOT EXISTS idx_user_query_logs_user ON user_query_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_query_logs_type ON user_query_logs(query_type);
CREATE INDEX IF NOT EXISTS idx_user_query_logs_created ON user_query_logs(created_at);

-- 插入默认权限组
INSERT INTO permission_groups (name, description, permissions) VALUES
('ADMIN_FULL', '管理员完全权限', '[
  {"module": "management", "access": true},
  {"module": "truck_delivery", "access": true},
  {"module": "fsa_boundaries", "access": true},
  {"module": "pricing", "access": true, "view": true, "edit": true},
  {"module": "users", "access": true, "view": true, "edit": true},
  {"module": "reports", "access": true}
]'::jsonb),
('VIP1_GROUP', 'VIP1用户权限组', '[
  {"module": "truck_delivery", "access": true},
  {"module": "fsa_boundaries", "access": true},
  {"module": "pricing", "access": true, "view": true, "edit": false}
]'::jsonb),
('VIP2_GROUP', 'VIP2用户权限组', '[
  {"module": "truck_delivery", "access": true},
  {"module": "fsa_boundaries", "access": true},
  {"module": "pricing", "access": true, "view": true, "edit": false}
]'::jsonb),
('BASIC_USER', '基础用户权限', '[
  {"module": "truck_delivery", "access": false},
  {"module": "fsa_boundaries", "access": true},
  {"module": "pricing", "access": true, "view": true, "edit": false}
]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 创建触发器函数更新updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表添加触发器
CREATE TRIGGER update_permission_groups_updated_at BEFORE UPDATE ON permission_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_permissions_updated_at BEFORE UPDATE ON user_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_query_limits_updated_at BEFORE UPDATE ON user_query_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();