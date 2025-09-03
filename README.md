# 加拿大快递配送区域地图系统

基于 Statistics Canada 官方 FSA 边界数据的可视化配送区域管理系统。

## 功能特点

- 🗺️ **真实 FSA 边界展示** - 使用加拿大统计局 2021 年人口普查 FSA 边界数据
- 🎨 **区域颜色标识** - 1-8 区域配送范围可视化展示
- 🔍 **智能搜索** - 支持邮编、FSA、城市快速定位
- 💰 **价格配置** - 区域重量区间价格管理
- 📊 **数据管理** - 区域、FSA、邮编统一管理

## 技术栈

- **前端框架**: React 18 + Vite
- **地图引擎**: Leaflet + React Leaflet  
- **样式方案**: Tailwind CSS
- **动画效果**: Framer Motion
- **数据存储**: LocalStorage 统一存储架构

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5001

### 构建生产版本

```bash
npm run build
```

## 部署到 Vercel

1. Fork 或 Clone 本仓库到 GitHub
2. 登录 [Vercel](https://vercel.com)
3. 导入 GitHub 仓库
4. 使用以下配置:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. 点击 Deploy

## 项目结构

```
src/
├── components/          # React 组件
│   ├── AccurateFSAMap.jsx      # 地图主组件
│   ├── RegionManagementPanel.jsx # 区域管理
│   └── RegionPriceManager.jsx   # 价格配置
├── data/               # 静态数据
│   ├── deliverableFSA.js       # FSA 边界数据
│   └── postalCodes.js          # 邮编数据库
├── utils/              # 工具函数
│   └── unifiedStorage.js       # 统一存储管理
└── pages/              # 页面组件
    ├── Dashboard/              # 地图展示页
    └── Settings/              # 配置管理页
```

## 环境要求

- Node.js >= 16
- npm >= 8

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题，请提交 [Issue](https://github.com/your-username/your-repo/issues)