-- 添加城市统计列
ALTER TABLE truck_delivery_cities
ADD COLUMN IF NOT EXISTS total_regions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_fsas INTEGER DEFAULT 0;

-- 更新现有城市的统计数据
UPDATE truck_delivery_cities c
SET
  total_regions = (
    SELECT COUNT(DISTINCT id)
    FROM truck_delivery_zones
    WHERE city_id = c.id
  ),
  total_fsas = (
    SELECT COUNT(DISTINCT fsa)
    FROM (
      SELECT unnest(fsa_codes) as fsa
      FROM truck_delivery_zones
      WHERE city_id = c.id
    ) fsas
  );

-- 添加注释
COMMENT ON COLUMN truck_delivery_cities.total_regions IS '城市包含的区域总数';
COMMENT ON COLUMN truck_delivery_cities.total_fsas IS '城市覆盖的FSA总数';