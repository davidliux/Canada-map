# 🚀 快速访问指南

## ✅ 系统状态
- **前端服务**: 运行在端口 5001 ✅
- **后端API**: 运行在端口 5050 ✅

## 📍 主要页面访问地址

### 1. 统一定价管理系统
```
http://localhost:5001/management/truck-delivery/unified-pricing
```
**路径**: 管理中心 → 卡车配送管理 → 统一定价

### 2. 测试页面
- **数据加载测试**: http://localhost:5001/test-data-loading
- **板数定价测试**: http://localhost:5001/test-skid-pricing
- **分组测试**: http://localhost:5001/test-fsa-groups

### 3. 主要功能页面
- **仪表板中心**: http://localhost:5001/dashboards
- **管理中心**: http://localhost:5001/management
- **卡车配送仪表板**: http://localhost:5001/dashboards/truck-delivery
- **FSA仪表板**: http://localhost:5001/dashboards/fsa

## 🎯 统一定价系统使用步骤

1. **访问页面**
   ```
   http://localhost:5001/management/truck-delivery/unified-pricing
   ```

2. **选择层级**
   - 选择城市（如：AB）
   - 选择区域（如：区域1）
   - 选择分组（如：Balzac）

3. **配置定价**
   - 选择定价模式（固定/首续托/阶梯/整车）
   - 设置价格参数
   - 使用价格计算器预览

4. **保存配置**
   - 点击"保存配置"按钮
   - 等待成功提示

## 🔧 问题排查

### 如果页面无法访问
1. 确认前端服务运行：
   ```bash
   lsof -i :5001
   ```

2. 确认后端服务运行：
   ```bash
   lsof -i :5050
   ```

3. 重启服务：
   ```bash
   # 前端
   npm run dev

   # 后端
   cd backend && npm start
   ```

## 📊 数据验证

### 测试API响应
```bash
# 测试城市API
curl http://localhost:5050/api/v1/truck-delivery/cities

# 测试分组API
curl http://localhost:5050/api/v1/truck-delivery/zones/3f621b81-a530-46c7-a8ec-a863894686bf/groups
```

### 查看控制台日志
在浏览器中按 F12 打开开发者工具，查看 Console 面板中的数据加载日志。

## ✨ 核心功能

- **三级层级选择**: 城市 → 区域 → 分组
- **四种定价模式**: 固定、首续托、阶梯、整车
- **价格优先级**: 分组 > 区域 > 城市
- **数据持久化**: 所有配置保存到PostgreSQL数据库

## 📝 注意事项

1. 确保PostgreSQL数据库正在运行
2. 确保端口5001和5050未被其他程序占用
3. 首次访问可能需要等待数据加载

---
系统已完全就绪，可以正常使用！ 🎉