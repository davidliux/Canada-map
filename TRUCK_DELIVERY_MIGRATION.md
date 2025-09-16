# 卡车配送系统数据库迁移指南

## 概述

本指南将帮助你将卡车配送系统从localStorage存储迁移到PostgreSQL数据库存储。

## 迁移步骤

### 1. 准备数据库

#### 1.1 创建数据库表

```bash
# 进入backend目录
cd backend

# 执行SQL迁移脚本
psql -U your_username -d your_database -f migrations/001_create_truck_delivery_tables.sql
```

或者如果你使用Prisma：

```bash
# 更新Prisma schema
cp prisma/schema-truck-delivery.prisma prisma/schema.prisma

# 生成Prisma客户端
npx prisma generate

# 执行数据库迁移
npx prisma migrate dev --name truck_delivery_init
```

### 2. 更新后端服务

#### 2.1 注册新的API路由

编辑 `backend/src/server.js`，添加新的路由：

```javascript
// 导入卡车配送路由
const truckDeliveryRoutes = require('./routes/truckDeliveryComplete');

// 注册路由
app.use('/api/v1/truck-delivery', truckDeliveryRoutes);
```

#### 2.2 重启后端服务

```bash
# 停止现有服务
# 找到进程ID
lsof -i:5050
# 终止进程
kill -9 [PID]

# 重新启动
cd backend
npm start
```

### 3. 迁移现有数据

#### 3.1 使用Web迁移工具

1. 打开浏览器访问：http://localhost:5001/migrate-to-database.html
2. 按照界面提示执行以下步骤：
   - 检查本地数据
   - 测试数据库连接
   - 预览数据
   - 执行迁移
   - （可选）清除本地数据

#### 3.2 使用命令行迁移（可选）

```javascript
// 在浏览器控制台执行
import { cityStorageServiceDB } from './src/utils/storage/cityStorageServiceDB.js';

// 执行迁移
const result = await cityStorageServiceDB.migrateFromLocalStorage();
console.log('迁移结果:', result);
```

### 4. 更新前端代码

#### 4.1 替换存储服务

将所有使用 `cityStorageService` 的地方替换为 `cityStorageServiceDB`：

```javascript
// 旧代码
import { cityStorageService } from '../../utils/storage/cityStorage.js';

// 新代码
import { cityStorageServiceDB as cityStorageService } from '../../utils/storage/cityStorageServiceDB.js';
```

受影响的文件：
- `src/pages/TruckDelivery/CityView.jsx`
- `src/pages/TruckDelivery/CityManager.jsx`
- `src/components/cities/CityEditDialog.jsx`
- `src/components/cities/CityRegionEditor.jsx`
- 其他使用cityStorageService的组件

#### 4.2 全局替换（推荐）

在 `src/utils/storage/cityStorage.js` 文件末尾，导出数据库版本：

```javascript
// 导出数据库版本作为默认
export { cityStorageServiceDB as cityStorageService } from './cityStorageServiceDB.js';
export default cityStorageServiceDB;
```

这样无需修改其他文件的导入语句。

### 5. 验证迁移

#### 5.1 功能测试清单

- [ ] 城市列表加载正常
- [ ] 创建新城市
- [ ] 编辑城市信息
- [ ] 删除城市
- [ ] 添加/编辑区域
- [ ] 配置FSA代码
- [ ] 设置价格表
- [ ] FSA搜索功能
- [ ] 数据刷新后保持

#### 5.2 性能测试

```javascript
// 在控制台测试API响应时间
console.time('获取城市列表');
await fetch('http://localhost:5050/api/v1/truck-delivery/cities');
console.timeEnd('获取城市列表');
```

### 6. 回滚方案

如果需要回滚到localStorage版本：

1. 恢复原始的cityStorageService
2. 从备份恢复localStorage数据
3. 移除数据库相关代码

## API端点列表

### 城市管理

- `GET /api/v1/truck-delivery/cities` - 获取所有城市
- `GET /api/v1/truck-delivery/cities/:cityId` - 获取单个城市
- `POST /api/v1/truck-delivery/cities` - 创建新城市
- `PUT /api/v1/truck-delivery/cities/:cityId` - 更新城市
- `DELETE /api/v1/truck-delivery/cities/:cityId` - 删除城市

### FSA查询

- `GET /api/v1/truck-delivery/fsa/:fsaCode` - 根据FSA查找城市
- `POST /api/v1/truck-delivery/fsa/batch` - 批量查询FSA

### 数据迁移

- `POST /api/v1/truck-delivery/import` - 批量导入城市数据

## 数据库架构

### 主要表结构

1. **truck_delivery_cities** - 城市表
   - id (VARCHAR 50) - 主键
   - name - 城市名称
   - province - 省份代码
   - theme_color - 主题颜色

2. **truck_delivery_regions** - 区域表
   - id (VARCHAR 50) - 主键
   - city_id - 关联城市
   - level - 区域等级(1-10)
   - name - 区域名称

3. **truck_delivery_fsa** - FSA代码表
   - region_id - 关联区域
   - fsa_code - FSA代码

4. **truck_delivery_prices** - 价格表
   - region_id - 关联区域
   - currency - 货币类型

5. **truck_delivery_price_ranges** - 价格区间表
   - price_id - 关联价格表
   - min_weight/max_weight - 重量范围
   - price - 价格

6. **truck_delivery_fsa_index** - FSA索引表（快速查询）
   - fsa_code - FSA代码(主键)
   - city_id - 城市ID
   - region_id - 区域ID

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查PostgreSQL服务是否运行
   - 验证DATABASE_URL环境变量
   - 确认数据库用户权限

2. **API端点404错误**
   - 确认路由已注册
   - 检查URL路径是否正确
   - 重启后端服务

3. **数据迁移失败**
   - 检查数据格式是否正确
   - 查看后端日志错误信息
   - 确认数据库表已创建

4. **前端无法加载数据**
   - 检查API端点是否正常
   - 查看浏览器控制台错误
   - 确认CORS设置正确

## 性能优化建议

1. **数据库索引**
   - 已为常用查询字段创建索引
   - 监控慢查询并优化

2. **前端缓存**
   - cityStorageServiceDB包含5分钟内存缓存
   - 可根据需要调整缓存时间

3. **批量操作**
   - 使用批量导入API减少请求次数
   - 事务处理确保数据一致性

## 安全考虑

1. **输入验证**
   - 所有API端点都包含输入验证
   - 使用Prisma防止SQL注入

2. **权限控制**
   - 可添加用户认证中间件
   - 实现基于角色的访问控制

3. **数据备份**
   - 定期备份数据库
   - 保留localStorage备份选项

## 完成标志

✅ 数据库表创建成功
✅ API端点全部实现
✅ 前端服务更新完成
✅ 数据迁移工具可用
✅ 所有功能测试通过

---

**注意**: 在生产环境部署前，请确保：
- 数据库有适当的备份策略
- API端点有认证保护
- 错误处理和日志记录完善
- 性能测试满足要求