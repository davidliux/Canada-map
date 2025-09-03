# 加拿大快递配送区域地图系统 - 后端升级项目

## 📋 项目介绍

这是加拿大快递配送区域地图系统的企业级后端升级项目，旨在将现有的前端存储系统（LocalStorage + IndexedDB + Electron文件系统）升级为企业级后端数据库架构，提升数据安全性、多用户协作能力和系统可扩展性。

### 🎯 项目目标
- **技术转型**: 从单机应用 → 多用户协作的企业级系统
- **数据安全**: 提升数据安全性和完整性保障
- **协作能力**: 支持多用户同时操作和数据同步
- **可扩展性**: 为未来业务增长提供技术基础

## 🛠️ 技术栈

### 后端技术栈
- **数据库**: PostgreSQL 15+ (强ACID特性，JSON支持，地理数据扩展)
- **后端框架**: Node.js + Express.js (与现有前端技术栈一致)
- **ORM**: Prisma (类型安全，自动迁移，优秀开发体验)
- **缓存**: Redis 7+ (高性能缓存，复杂数据结构支持)
- **认证**: JWT + Passport.js (无状态认证，易于扩展)

### 前端技术栈
- **管理后台**: React + Ant Design (丰富组件库，快速开发)
- **地图应用**: 继承现有React + Leaflet技术栈

### 部署技术栈
- **容器化**: Docker + Docker Compose (环境一致性，易于部署)
- **反向代理**: Nginx (负载均衡，SSL终止)
- **监控**: Prometheus + Grafana (可选)

## 🏗️ 系统架构

```
前端层: React地图应用 + 管理后台
    ↓
API网关: Nginx + Express.js
    ↓  
业务层: 区域/邮编/价格管理服务
    ↓
数据层: PostgreSQL + Redis + 文件存储
    ↓
监控层: Prometheus + Grafana + ELK
```

## 📊 数据库设计

### 核心表结构
1. **users** - 用户表 (角色权限管理)
2. **delivery_regions** - 配送区域表 (8个区域配置)
3. **postal_codes** - 邮编表 (FSA代码管理)
4. **weight_ranges** - 重量区间表 (价格配置)
5. **system_configs** - 系统配置表 (灵活配置管理)
6. **audit_logs** - 操作日志表 (完整审计追踪)
7. **data_versions** - 数据版本表 (版本控制支持)
8. **api_tokens** - API令牌表 (访问控制)

## 🚀 快速开始

### 环境要求
- Node.js 18.0+
- Docker 20.0+
- Docker Compose 2.0+
- Git

### 安装指南

1. **克隆项目**
```bash
git clone <repository-url>
cd canada-postal-delivery-system
```

2. **环境配置**
```bash
# 复制环境配置文件
cp .env.example .env

# 编辑环境变量
vim .env
```

3. **启动开发环境**
```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps
```

4. **数据库初始化**
```bash
# 运行数据库迁移
npm run prisma:migrate

# 生成Prisma客户端
npm run prisma:generate
```

## 💻 开发指南

### 项目结构
```
canada-postal-delivery-system/
├── backend/                 # 后端API服务
│   ├── src/
│   │   ├── controllers/     # 控制器
│   │   ├── services/        # 业务逻辑
│   │   ├── models/          # 数据模型
│   │   ├── middleware/      # 中间件
│   │   └── utils/           # 工具函数
│   ├── prisma/              # 数据库模式
│   └── tests/               # 测试文件
├── admin-panel/             # 管理后台
├── docker/                  # Docker配置
├── docs/                    # 项目文档
└── scripts/                 # 构建脚本
```

### 开发流程

1. **创建功能分支**
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

2. **开发和测试**
```bash
# 启动开发服务器
npm run dev

# 运行测试
npm run test

# 代码检查
npm run lint
```

3. **提交代码**
```bash
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
```

4. **创建Pull Request**
- 目标分支: `develop`
- 包含详细的功能描述和测试说明

### API开发规范

- 遵循RESTful设计原则
- 使用OpenAPI 3.0规范
- 统一错误处理和响应格式
- 完整的API文档和测试用例

## 🔧 分支策略

### 分支类型
- **main**: 生产环境分支，只接受来自develop的合并
- **develop**: 开发主分支，功能集成和测试
- **feature/***: 功能开发分支，从develop创建
- **hotfix/***: 紧急修复分支，从main创建
- **release/***: 发布准备分支，从develop创建

### 分支命名规范
- `feature/user-authentication` - 用户认证功能
- `feature/postal-code-management` - 邮编管理功能
- `hotfix/security-patch` - 安全补丁
- `release/v1.0.0` - 版本发布

## 👥 团队协作

### 代码审查
- 所有代码必须经过Code Review
- 至少需要1个团队成员的批准
- 自动化测试必须通过

### 提交规范
使用Conventional Commits规范：
- `feat:` 新功能
- `fix:` 错误修复
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建过程或辅助工具的变动

## 📈 开发计划

### 12周分阶段开发
- **第1-2周**: 架构设计和环境搭建 ✅
- **第3-5周**: 后端API开发
- **第6-8周**: 管理后台开发
- **第9-10周**: 前端系统改造
- **第11周**: 数据迁移和集成测试
- **第12周**: 部署和上线

## 📞 联系方式

- **项目经理**: [项目经理联系方式]
- **技术负责人**: [技术负责人联系方式]
- **问题反馈**: [Issue Tracker链接]

## 📄 许可证

[许可证信息]

---

**项目状态**: 🚧 开发中 | **当前版本**: v0.1.0 | **最后更新**: 2024-07-22
