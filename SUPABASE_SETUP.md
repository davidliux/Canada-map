# Supabase 数据库设置指南

## 为什么需要 Supabase？

当前系统使用 localStorage 存储数据，存在以下问题：
- 数据只存在浏览器本地，清除缓存就丢失
- 无法跨设备同步
- 线上部署后每个用户数据独立
- 无法实现团队协作

Supabase 提供：
- ✅ 永久数据存储
- ✅ 跨设备同步
- ✅ 实时数据更新
- ✅ 免费套餐（500MB 存储）
- ✅ 简单易用的 API

## 快速设置步骤

### 1. 创建 Supabase 账号

1. 访问 [https://supabase.com](https://supabase.com)
2. 点击 "Start your project" 注册账号（可用 GitHub 登录）
3. 创建新项目：
   - Project name: `canada-postal-map`
   - Database Password: 设置一个强密码
   - Region: 选择最近的区域

### 2. 创建数据表

在 Supabase Dashboard 中，进入 SQL Editor，执行以下 SQL：

```sql
-- 创建区域配置表
CREATE TABLE regions (
  id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  fsa_codes JSONB DEFAULT '[]',
  postal_codes JSONB DEFAULT '[]',
  weight_ranges JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
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

-- 插入初始数据
INSERT INTO regions (id, name, fsa_codes, postal_codes, weight_ranges, is_active) VALUES
('1', '1区', '[]', '[]', '[
  {"id": "0-10", "min": 0, "max": 10, "price": 15.99, "isActive": true},
  {"id": "10-20", "min": 10, "max": 20, "price": 25.99, "isActive": true},
  {"id": "20-30", "min": 20, "max": 30, "price": 35.99, "isActive": true},
  {"id": "30-50", "min": 30, "max": 50, "price": 55.99, "isActive": true},
  {"id": "50-100", "min": 50, "max": 100, "price": 99.99, "isActive": true}
]', true),
('2', '2区', '[]', '[]', '[
  {"id": "0-10", "min": 0, "max": 10, "price": 18.99, "isActive": true},
  {"id": "10-20", "min": 10, "max": 20, "price": 29.99, "isActive": true},
  {"id": "20-30", "min": 20, "max": 30, "price": 39.99, "isActive": true},
  {"id": "30-50", "min": 30, "max": 50, "price": 59.99, "isActive": true},
  {"id": "50-100", "min": 50, "max": 100, "price": 109.99, "isActive": true}
]', true),
('3', '3区', '[]', '[]', '[
  {"id": "0-10", "min": 0, "max": 10, "price": 22.99, "isActive": true},
  {"id": "10-20", "min": 10, "max": 20, "price": 35.99, "isActive": true},
  {"id": "20-30", "min": 20, "max": 30, "price": 45.99, "isActive": true},
  {"id": "30-50", "min": 30, "max": 50, "price": 69.99, "isActive": true},
  {"id": "50-100", "min": 50, "max": 100, "price": 129.99, "isActive": true}
]', true),
('4', '4区', '[]', '[]', '[
  {"id": "0-10", "min": 0, "max": 10, "price": 24.99, "isActive": true},
  {"id": "10-20", "min": 10, "max": 20, "price": 38.99, "isActive": true},
  {"id": "20-30", "min": 20, "max": 30, "price": 48.99, "isActive": true},
  {"id": "30-50", "min": 30, "max": 50, "price": 72.99, "isActive": true},
  {"id": "50-100", "min": 50, "max": 100, "price": 139.99, "isActive": true}
]', true),
('5', '5区', '[]', '[]', '[
  {"id": "0-10", "min": 0, "max": 10, "price": 26.99, "isActive": true},
  {"id": "10-20", "min": 10, "max": 20, "price": 42.99, "isActive": true},
  {"id": "20-30", "min": 20, "max": 30, "price": 52.99, "isActive": true},
  {"id": "30-50", "min": 30, "max": 50, "price": 78.99, "isActive": true},
  {"id": "50-100", "min": 50, "max": 100, "price": 149.99, "isActive": true}
]', true),
('6', '6区', '[]', '[]', '[
  {"id": "0-10", "min": 0, "max": 10, "price": 28.99, "isActive": true},
  {"id": "10-20", "min": 10, "max": 20, "price": 45.99, "isActive": true},
  {"id": "20-30", "min": 20, "max": 30, "price": 55.99, "isActive": true},
  {"id": "30-50", "min": 30, "max": 50, "price": 82.99, "isActive": true},
  {"id": "50-100", "min": 50, "max": 100, "price": 159.99, "isActive": true}
]', true),
('7', '7区', '[]', '[]', '[
  {"id": "0-10", "min": 0, "max": 10, "price": 30.99, "isActive": true},
  {"id": "10-20", "min": 10, "max": 20, "price": 48.99, "isActive": true},
  {"id": "20-30", "min": 20, "max": 30, "price": 58.99, "isActive": true},
  {"id": "30-50", "min": 30, "max": 50, "price": 86.99, "isActive": true},
  {"id": "50-100", "min": 50, "max": 100, "price": 169.99, "isActive": true}
]', true),
('8', '8区', '[]', '[]', '[
  {"id": "0-10", "min": 0, "max": 10, "price": 32.99, "isActive": true},
  {"id": "10-20", "min": 10, "max": 20, "price": 52.99, "isActive": true},
  {"id": "20-30", "min": 20, "max": 30, "price": 62.99, "isActive": true},
  {"id": "30-50", "min": 30, "max": 50, "price": 92.99, "isActive": true},
  {"id": "50-100", "min": 50, "max": 100, "price": 179.99, "isActive": true}
]', true);

-- 启用 RLS (Row Level Security)
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

-- 创建公共访问策略（开发阶段）
CREATE POLICY "Enable all access for regions" ON regions
FOR ALL USING (true) WITH CHECK (true);
```

### 3. 获取 API 密钥

1. 在 Supabase Dashboard 中，进入 Settings > API
2. 复制以下信息：
   - `Project URL`: https://xxxxx.supabase.co
   - `anon public` key: eyJhbGciOiJIUzI1NiIsInR5cCI6...

### 4. 配置环境变量

创建 `.env.local` 文件：

```bash
# Supabase 配置
VITE_SUPABASE_URL=你的_Project_URL
VITE_SUPABASE_ANON_KEY=你的_anon_public_key

# API 模式设置为 auto
VITE_API_MODE=auto
```

### 5. 安装 Supabase 客户端

```bash
npm install @supabase/supabase-js
```

## 使用说明

配置完成后，系统会自动：
1. 检测 Supabase 配置
2. 如果配置存在，使用云端数据库
3. 如果不存在，降级到 localStorage
4. 支持离线使用，在线时自动同步

## 数据迁移

如果你有现有的 localStorage 数据，可以使用迁移工具：

```javascript
// 在浏览器控制台运行
window.migrateToSupabase && window.migrateToSupabase()
```

## 常见问题

### Q: 数据会丢失吗？
A: 不会。Supabase 提供持久化存储，数据保存在云端数据库。

### Q: 免费套餐够用吗？
A: 够用。免费套餐提供：
- 500MB 数据库存储
- 2GB 文件存储
- 50,000 月活用户
- 无限 API 请求

### Q: 可以导出数据吗？
A: 可以。Supabase 支持 SQL 导出、CSV 导出等多种格式。

### Q: 安全吗？
A: 安全。Supabase 提供：
- SSL 加密传输
- Row Level Security (RLS)
- API 密钥认证
- 备份恢复功能

## 下一步

1. 完成 Supabase 设置
2. 添加环境变量
3. 重启应用
4. 享受真正的数据持久化！

---

需要帮助？查看 [Supabase 文档](https://supabase.com/docs) 或联系技术支持。