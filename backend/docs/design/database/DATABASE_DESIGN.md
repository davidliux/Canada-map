# 数据库设计文档

版本: v0.1  
状态: 草稿（初始化占位）

## 1. 目标
描述与地图、区域、价格、邮编等业务相关的数据结构与关系。

## 2. 概念模型（草案）
- 区域（Region）
- FSA 边界（FSA Boundary）
- 邮编（PostalCode）
- 价格规则（PriceRule）

## 3. 逻辑模型（待完善）
与 `backend/prisma/schema.prisma` 对齐（当前已有模型）：

- User(id, username, email, passwordHash, role, isActive, lastLoginAt, createdAt, updatedAt)
- DeliveryRegion(id, name, description, isActive, displayOrder, colorCode, createdBy, createdAt, updatedAt)
- PostalCode(id, regionId, fsaCode, province, city, isActive, createdBy, createdAt, updatedAt)
  - 约束：`@@unique([regionId, fsaCode])`
- WeightRange(id, regionId, rangeName, minWeight, maxWeight, price, isActive, displayOrder, createdBy, createdAt, updatedAt)
- SystemConfig(id, configKey, configValue, ...)
- AuditLog(id, userId, action, tableName, recordId, oldValues, newValues, ipAddress, userAgent, createdAt)
- DataVersion(id, versionNumber, description, dataSnapshot, createdBy, createdAt)
- ApiToken(id, userId, tokenName, tokenHash, permissions, expiresAt, lastUsedAt, isActive, createdAt)

后续将根据价格规则与邮编迁移的实际需求，评估是否新增 `PriceRule`（与 `WeightRange` 的关系/替换策略）。

## 4. 变更记录
- 初始化文档骨架。
- 增补与 Prisma 模型对齐的字段清单与关键约束（v0.2）。


