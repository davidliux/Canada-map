# 🚀 Vercel部署指南

本文档详细说明如何将加拿大地图配送系统部署到Vercel平台，并配置Vercel KV存储。

## 📋 部署前准备

### 1. 环境要求
- Node.js 18+
- Vercel账户
- Git仓库

### 2. 项目结构检查
确保项目包含以下关键文件：
```
ai开发项目/地图/
├── api/                    # Vercel Serverless Functions
│   ├── regions/
│   │   ├── index.js       # 区域配置API
│   │   └── [regionId].js  # 单个区域API
│   └── backup/
│       ├── index.js       # 备份API
│       └── restore.js     # 恢复API
├── lib/
│   └── kv-storage.js      # KV存储服务
├── src/
│   └── utils/
│       ├── apiClient.js   # API客户端
│       ├── storageAdapter.js  # 存储适配器
│       └── dataMigration.js   # 数据迁移工具
├── vercel.json            # Vercel配置
├── package.json           # 依赖配置
└── .env.example           # 环境变量示例
```

## 🔧 Vercel KV设置

### 1. 创建KV数据库
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入项目设置 → Storage
3. 点击 "Create Database" → 选择 "KV"
4. 输入数据库名称（如：`canada-map-delivery-kv`）
5. 选择区域（推荐：`us-east-1`）
6. 点击 "Create"

### 2. 获取连接信息
创建完成后，Vercel会自动生成环境变量：
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

这些变量会自动添加到项目的环境变量中。

## 🚀 部署步骤

### 方法1：通过Vercel Dashboard部署

1. **连接Git仓库**
   ```bash
   # 确保代码已推送到Git仓库
   git add .
   git commit -m "准备Vercel部署"
   git push origin main
   ```

2. **在Vercel中导入项目**
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 点击 "New Project"
   - 选择你的Git仓库
   - 选择 `ai开发项目/地图` 作为根目录

3. **配置构建设置**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **配置环境变量**
   在项目设置中添加：
   ```
   NODE_ENV=production
   REACT_APP_USE_API=true
   ```

5. **部署**
   点击 "Deploy" 开始部署

### 方法2：通过Vercel CLI部署

1. **安装Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   ```bash
   cd "ai开发项目/地图"
   vercel
   ```

4. **配置项目**
   按提示配置：
   - Set up and deploy? `Y`
   - Which scope? 选择你的账户
   - Link to existing project? `N`
   - Project name: `canada-map-delivery-system`
   - Directory: `./` (当前目录)

5. **设置环境变量**
   ```bash
   vercel env add NODE_ENV
   # 输入: production
   
   vercel env add REACT_APP_USE_API  
   # 输入: true
   ```

6. **重新部署**
   ```bash
   vercel --prod
   ```

## 📊 数据迁移

### 1. 自动迁移
部署完成后，访问：
```
https://your-app.vercel.app/migration-tool.html
```

按照界面提示进行数据迁移。

### 2. 手动迁移
如果有现有的localStorage数据：

1. **导出现有数据**
   ```javascript
   // 在浏览器控制台执行
   const data = localStorage.getItem('regionConfigs');
   console.log(data);
   // 复制输出的JSON数据
   ```

2. **使用恢复工具导入**
   - 访问 `https://your-app.vercel.app/data-recovery-tool.html`
   - 点击 "从文件恢复"
   - 上传包含数据的JSON文件

## 🔍 验证部署

### 1. 检查API端点
访问以下URL验证API是否正常：
```
https://your-app.vercel.app/api/regions
```

应该返回JSON格式的响应。

### 2. 检查KV存储
```bash
# 使用Vercel CLI检查
vercel env ls
```

确保KV相关的环境变量已正确设置。

### 3. 功能测试
1. 访问主应用：`https://your-app.vercel.app`
2. 测试区域配置功能
3. 测试数据备份/恢复功能
4. 检查数据持久化是否正常

## 🛠️ 故障排除

### 常见问题

1. **API调用失败**
   - 检查环境变量是否正确设置
   - 确认KV数据库已创建并连接
   - 查看Vercel Functions日志

2. **数据迁移失败**
   - 检查localStorage中是否有数据
   - 确认API端点可访问
   - 使用迁移工具的详细日志

3. **构建失败**
   - 检查package.json中的依赖
   - 确认所有必要文件已提交
   - 查看构建日志

### 调试命令

```bash
# 查看部署日志
vercel logs

# 查看函数日志
vercel logs --follow

# 本地开发测试
vercel dev
```

## 📈 性能优化

### 1. KV存储优化
- 使用合适的键名结构
- 设置适当的过期时间
- 批量操作减少API调用

### 2. API优化
- 启用响应缓存
- 使用压缩
- 优化数据结构

### 3. 前端优化
- 启用代码分割
- 优化图片资源
- 使用CDN

## 🔒 安全配置

### 1. 环境变量安全
- 不要在代码中硬编码敏感信息
- 使用Vercel的环境变量管理
- 定期轮换API密钥

### 2. API安全
- 实现适当的CORS策略
- 添加请求频率限制
- 验证输入数据

## 📞 支持

如果遇到问题：

1. 查看 [Vercel文档](https://vercel.com/docs)
2. 检查 [Vercel KV文档](https://vercel.com/docs/storage/vercel-kv)
3. 查看项目的GitHub Issues
4. 联系技术支持

## 🎯 下一步

部署完成后，建议：

1. 设置自定义域名
2. 配置监控和告警
3. 设置自动备份策略
4. 优化性能和用户体验
5. 添加更多功能特性

---

**注意**: 确保在生产环境中定期备份数据，并测试恢复流程。
