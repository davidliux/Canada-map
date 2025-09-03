# STORY-REFAC-DB-MIGRATION — 浏览器存储 → 数据库重构（邮编/费用）

版本: v0.1
状态: 草稿（Self-contained Context 就绪）

## 1. 背景与动机
- 现有数据（邮编、FSA、价格/重量规则等）主要存放在浏览器/本地存储中，难以满足多端一致、权限、审计与备份需求。
- 目标是迁移至数据库（推荐 Postgres；离线可选 SQLite），通过后端 API 统一读写，保证可扩展与可靠性。

## 2. 范围与对象
- 实体：PostalCode、FSA、Region、PriceRule、WeightRange、ImportJob、AuditLog。
- 前端模块涉及：`DeliveryMap`、`FSARegionMap`、`PostalCodeManager`、`RegionPriceManager`、`OptimizedPriceCalculator`、`BatchPriceImporter` 等。

## 3. 依赖文档（强制引用）
- 数据库设计：`../../design/database/DATABASE_DESIGN.md`
- API 设计：`../../design/api/POSTAL_PRICE_API.md`（并引用根目录 `api-specification.yaml`）
- Prisma 模型：`../../../prisma/schema.prisma`

## 4. 成功标准（验收）
- 只读切换完成：前端查询改为从 API/DB 获取，关键页面表现与旧数据源一致。
- 双写稳定：新增/更新价格和邮编时，同时写入 DB 与旧存储（用于回退）。
- 全量回填：历史 LocalStorage/JSON 导入 DB，抽样一致率 ≥ 99.9%。
- 回滚可用：一键切回只读旧源；导出回滚包可重现。

## 5. TDD 测试要点
- 模型与约束：唯一键/索引、价格规则重叠校验、邮编格式校验。
- 服务层：分页/搜索正确性、边界条件（空/极端输入）。
- 控制器：请求参数校验/鉴权/错误码一致性。
- 迁移脚本：导入校验报告、失败重试、坏数据隔离。
- 前端回归：地图加载、筛选、报价计算、批量导入。

## 6. 任务拆解（分阶段）
- Sprint 0：DB 初始化 + Prisma 迁移 + .env 配置 + 回滚策略（快照/功能开关）。
- Sprint 1：只读 API（FSA/邮编/价格）+ 前端按模块切换只读来源。
- Sprint 2：写 API（增删改）+ 后端开启双写 + 导入/导出能力。
- Sprint 3：全量回填 + 灰度切换（关闭旧读）+ 性能优化（索引/缓存）。
- Sprint 4：移除旧写路径 + 审计/监控/备份固化。

### Sprint 0 执行指令与环境

- 环境变量模板（复制为 `backend/.env` 使用）：

```
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/canada_postal_delivery
PORT=3000
JWT_SECRET=replace-me-in-production
JWT_EXPIRES_IN=24h
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:5173
REDIS_URL=redis://localhost:6379
```

- 初始化命令（在 `backend/` 下）：

```
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
# 或一键：
npm run db:setup
```

- 验证：
  - 运行 `npx prisma studio` 打开可视化，检查 `delivery_regions` 与 `weight_ranges` 是否存在基础数据
  - 若使用 docker-compose：确保 `docker-compose.yml` 中的 Postgres 服务已启动并健康

### 前端联调说明

- 在前端 `.env` 或 `.env.local` 配置：
```
VITE_API_BASE_URL=http://localhost:3000/api/v1
```
- 现已接入：`RegionPriceManager.jsx` 读取 `/regions/{id}/weight-ranges`（只读展示，失败回退本地存储）。

## 7. 接口骨架（详见 API 文档）
- GET /fsa?province=&code=
- GET /postal-codes?code=&fsa=
- GET /regions /regions/:id
- GET /price-rules?region_id= /regions/:id/price-rules
- POST/PUT/DELETE /postal-codes, /price-rules, /regions
- POST /imports（异步）/imports/:id（状态/报告）
- GET /stats

## 8. 功能开关（灰度）
- FF_DB_READ：开启后前端只读从 DB 获取。
- FF_DB_DUAL_WRITE：开启后后端写入 DB + 旧存储双写。
- FF_DB_ONLY：最终态，读写仅 DB，旧存储仅保留只读回退。

## 9. 风险与回滚
- 数据质量风险：严格校验 + 错误报表 + 修复工具；回填前做全量校验。
- 边界数据体积大：边界 JSON 静态化/切片 + CDN/缓存，DB 存元数据与引用。
- 规则复杂：规则引擎单测+快照，保护回归。
- 回滚策略：关闭 FF_DB_ONLY→退至 FF_DB_READ；读取回旧源；使用导出回滚包恢复。

## 10. 交付物
- 数据库迁移脚本与校验报告
- API 契约与示例（`api-specification.yaml`）
- 运维文档：备份/恢复/监控/告警
- 质量评审记录：`../../quality-reviews/story-reviews/QUALITY_REVIEW_STORY_REFAC_DB_MIGRATION.md`
