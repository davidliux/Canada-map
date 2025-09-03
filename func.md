# 项目功能清单 (func.md)

## 项目概述
**加拿大快递配送区域地图系统** - 基于React + Leaflet的现代化配送区域管理和可视化展示应用

---

### 核心组件层 (src/components)

#### 地图展示组件
- **AccurateFSAMap.jsx** - 精确FSA边界地图组件 (基于官方Statistics Canada数据的高精度FSA区域展示、交互式地图操作、区域高亮显示)
- **DeliverableFSAMap.jsx** - 可配送FSA地图组件 (配送区域可视化、FSA区域状态展示、配送范围标识)
- **DeliveryMap.jsx** - 配送地图主组件 (地图容器管理、图层控制、地图事件处理)
- **FSARegionMap.jsx** - FSA区域地图组件 (FSA区域分组显示、区域边界绘制、区域信息展示)
- **PrecisePostalMap.jsx** - 精确邮编地图组件 (具体邮编位置标记、邮编区域展示、精确位置定位)
- **RealFSABoundariesMap.jsx** - 真实FSA边界地图组件 (官方FSA边界数据展示、边界精确绘制、地理数据可视化)
- **RealPostalBoundaries.jsx** - 真实邮编边界组件 (邮编边界数据处理、边界可视化、地理信息展示)
- **SimpleMap.jsx** - 简单地图组件 (基础地图功能、简化地图展示、快速地图加载)

#### 管理面板组件
- **FSAManager.jsx** - FSA管理器组件 (FSA代码管理、FSA配置编辑、FSA数据操作、批量FSA处理)
- **FSAManagementPanel.jsx** - FSA管理面板组件 (FSA管理界面、FSA操作面板、FSA状态管理)
- **FSAAssignmentManager.jsx** - FSA分配管理器组件 (FSA区域分配、配送区域绑定、FSA归属管理)
- **RegionManagementPanel.jsx** - 区域管理面板组件 (配送区域管理、区域配置编辑、区域状态控制)
- **RegionPriceManager.jsx** - 区域价格管理器组件 (区域价格配置、价格策略管理、价格计算规则)
- **PostalCodeManager.jsx** - 邮编管理器组件 (邮编数据管理、邮编配置、邮编验证)
- **DirectPostalCodeManager.jsx** - 直接邮编管理器组件 (邮编直接操作、邮编快速编辑、邮编批量处理)

#### 搜索和筛选组件
- **EnhancedSearchPanel.jsx** - 增强搜索面板组件 (智能搜索功能、多条件筛选、搜索结果展示、搜索历史记录)
- **SearchPanel.jsx** - 搜索面板组件 (基础搜索功能、搜索输入处理、搜索结果过滤)
- **RegionSelector.jsx** - 区域选择器组件 (区域选择界面、区域筛选、多区域选择)

#### 数据展示组件
- **EnhancedStatsPanel.jsx** - 增强统计面板组件 (数据统计展示、图表可视化、统计分析、数据报表)
- **DeliveryStats.jsx** - 配送统计组件 (配送数据统计、配送效率分析、配送区域统计)
- **DeliveryAreaStatus.jsx** - 配送区域状态组件 (区域状态展示、配送能力显示、区域服务状态)
- **DeliveryRegions.jsx** - 配送区域组件 (配送区域展示、区域信息显示、区域管理界面)
- **ProvinceAnalyzer.jsx** - 省份分析器组件 (省份数据分析、省份统计、省份配送覆盖分析)

#### 价格和报价组件
- **OptimizedPriceCalculator.jsx** - 优化价格计算器组件 (智能价格计算、价格优化算法、动态价格调整、价格策略应用)
- **FixedQuotationPanel.jsx** - 固定报价面板组件 (固定价格展示、报价生成、价格配置管理)
- **BatchPriceManager.jsx** - 批量价格管理器组件 (批量价格设置、价格批量导入、价格批量更新)
- **BatchPriceImporter.jsx** - 批量价格导入器组件 (价格数据导入、Excel文件处理、价格数据验证)
- **WeightRangeManager.jsx** - 重量区间管理器组件 (重量区间配置、重量价格设置、重量规则管理)

#### 数据管理组件
- **ImportExportManager.jsx** - 导入导出管理器组件 (数据导入导出、文件格式处理、数据备份恢复、批量数据操作)
- **DataRecoveryNotification.jsx** - 数据恢复通知组件 (数据恢复提醒、数据完整性检查、恢复状态通知)

---

### 工具函数层 (src/utils)

#### 数据存储工具
- **unifiedStorage.js** - 统一存储工具 (统一数据存储架构、LocalStorage管理、数据持久化、存储优化、异步操作支持、内存缓存机制)
- **persistentStorage.js** - 持久化存储工具 (Electron文件系统持久化、IPC通信、数据备份、跨平台存储)
- **crossBrowserPersistenceFix.js** - 跨浏览器持久化修复工具 (多层存储策略、自动同步机制、环境适配、数据一致性保证)
- **dataRecovery.js** - 数据恢复工具 (数据备份恢复、数据完整性检查、历史数据迁移、数据修复)
- **dataMigration.js** - 数据迁移工具 (存储格式迁移、版本兼容性、数据升级、迁移状态管理)
- **dataValidation.js** - 数据验证工具 (数据格式验证、数据完整性校验、数据质量检查)

#### 数据处理工具
- **fsaImportExport.js** - FSA导入导出工具 (FSA数据导入导出、文件格式转换、数据格式化)
- **deliveryAreaFilter.js** - 配送区域过滤工具 (区域数据过滤、配送范围计算、区域匹配算法)
- **quotationGenerator.js** - 报价生成工具 (自动报价生成、价格计算逻辑、报价模板生成)
- **defaultPriceData.js** - 默认价格数据工具 (默认价格配置、价格模板、价格初始化)

#### 系统工具
- **dataUpdateNotifier.js** - 数据更新通知工具 (数据变更通知、实时数据同步、更新事件管理)
- **quickSetup.js** - 快速设置工具 (系统快速初始化、默认配置加载、演示数据设置)
- **demoSetup.js** - 演示设置工具 (演示数据生成、测试环境配置、示例数据加载)

#### 测试和诊断工具
- **persistenceTest.js** - 持久化测试工具 (环境检测、文件系统测试、数据持久化验证、跨浏览器一致性测试)
- **regionManagementTest.js** - 区域管理测试工具 (区域功能测试、邮编管理验证、自动问题修复、完整测试套件)

---

### 数据管理层 (src/data)

#### 核心数据文件
- **postalCodes.js** - 邮编数据管理 (邮编数据存储、邮编信息查询、邮编地理坐标)
- **deliverableFSA.js** - 可配送FSA数据管理 (可配送FSA列表、FSA配送状态、FSA服务范围)
- **fsaManagement.js** - FSA管理数据 (FSA配置管理、FSA分类数据、FSA属性信息)
- **regionManagement.js** - 区域管理数据 (配送区域配置、区域层级管理、区域关系数据)
- **fsaStats.js** - FSA统计数据 (FSA统计信息、FSA分析数据、FSA性能指标)

#### 地理数据文件
- **canada_fsa_boundaries.json** - 加拿大FSA边界数据 (官方FSA地理边界、GeoJSON格式数据、精确边界坐标)
- **canada_fsa_boundaries_preview.json** - FSA边界预览数据 (简化边界数据、快速预览、轻量级地理数据)

---

### 配置文件层 (项目根目录)

#### 构建配置
- **package.json** - 项目配置文件 (依赖管理、脚本配置、项目元信息、Electron打包配置)
- **vite.config.js** - Vite构建配置 (构建优化、开发服务器配置、插件配置)
- **tailwind.config.js** - Tailwind CSS配置 (样式配置、主题定制、响应式设计)
- **postcss.config.js** - PostCSS配置 (CSS处理配置、样式优化、兼容性处理)

#### 应用配置
- **electron.js** - Electron主进程配置 (桌面应用配置、窗口管理、系统集成)
- **index.html** - 应用入口HTML (应用容器、基础HTML结构、资源引用)

---

### 测试和调试工具 (项目根目录)

#### 测试文件
- **test-batch-price-config.js** - 批量价格配置测试 (价格配置测试、批量操作验证)
- **test-filter-sync.js** - 过滤同步测试 (数据过滤测试、同步机制验证)
- **test-fixes.js** - 修复测试 (bug修复验证、功能测试)
- **test-fsa-map-filter.js** - FSA地图过滤测试 (地图过滤功能测试、FSA显示验证)
- **test-map-optimization.js** - 地图优化测试 (地图性能测试、渲染优化验证)
- **test-quotation-panel-fix.js** - 报价面板修复测试 (报价功能测试、面板交互验证)

#### 调试工具
- **debug-data.js** - 数据调试工具 (数据状态调试、数据流追踪)
- **debug_postal_code_sync.html** - 邮编同步调试页面 (邮编同步调试、数据一致性检查)
- **debug_storage.html** - 存储调试页面 (存储状态调试、数据持久化验证)
- **data_cleanup_tool.html** - 数据清理工具页面 (数据清理、存储优化)

#### 数据工具
- **convert_fsa.js** - FSA数据转换工具 (FSA数据格式转换、数据迁移)
- **create_test_data.html** - 测试数据创建页面 (测试数据生成、演示数据创建)

---

### 构建和部署工具 (项目根目录)

#### 构建脚本
- **build_windows_app.sh** - Windows应用构建脚本 (Windows平台打包、应用构建自动化)
- **create_windows_release.sh** - Windows发布创建脚本 (发布版本创建、打包优化)
- **package_for_windows.sh** - Windows打包脚本 (Windows平台专用打包、依赖处理)
- **push_to_github.sh** - GitHub推送脚本 (代码推送自动化、版本管理)

---

## 技术架构特点

### 前端技术栈
- **React 18** - 现代化组件框架
- **Vite** - 快速构建工具
- **Tailwind CSS** - 实用优先的CSS框架
- **React Leaflet** - 地图组件库
- **Framer Motion** - 动画效果库
- **Lucide React** - 图标组件库

### 数据管理
- **后端数据库** - PostgreSQL + Prisma（集中式持久化、审计、备份、权限）
- **统一存储架构（历史）** - 基于LocalStorage 的数据持久化（逐步迁移中）
- **数据恢复机制** - 自动数据备份和恢复
- **实时数据同步** - 组件间数据状态同步

### Backend API（只读最小集 - Sprint 1）
- GET `/api/v1/health` - 健康检查
- GET `/api/v1/regions` - 区域列表（支持 `include_inactive`）
- GET `/api/v1/regions/{regionId}` - 区域详情（含统计）
- GET `/api/v1/regions/{regionId}/postal-codes` - 区域邮编（分页/搜索）
- GET `/api/v1/regions/{regionId}/weight-ranges` - 区域重量区间
- POST `/api/v1/calculate-price` - 价格计算（按重量区间）

### 地图功能
- **官方FSA边界数据** - 基于Statistics Canada官方数据
- **多层地图展示** - 支持多种地图视图模式
- **交互式地图操作** - 丰富的地图交互功能

### 业务功能
- **配送区域管理** - 完整的配送区域配置系统
- **价格计算系统** - 智能化价格计算和管理
- **数据导入导出** - 支持多种数据格式的导入导出
