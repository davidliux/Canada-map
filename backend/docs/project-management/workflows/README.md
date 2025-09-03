# 项目流程与工作流（占位）

版本: v0.1  
状态: 草稿

## 初始约定
- 采用 BMad 9 步精简流程
- 关键节点需进入 `quality-reviews/` 留痕
- 文档与实现双向追踪（API ↔ 组件需求 ↔ 数据模型）

## DB 初始化快速开始（Sprint 0）

1) 复制环境变量模板为 `backend/.env`：

```
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/canada_postal_delivery
PORT=3000
JWT_SECRET=replace-me-in-production
JWT_EXPIRES_IN=24h
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:5173
REDIS_URL=redis://localhost:6379
```

2) 初始化数据库与种子数据（在 `backend/`）：

```
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
# 或一键：
npm run db:setup
```

3) 校验：
- 运行 `npx prisma studio` 检查 `delivery_regions` 与 `weight_ranges`
- 确认 docker Postgres 正常（若使用 docker-compose）


