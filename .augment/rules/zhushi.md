---
type: "always_apply"
---

## 1. 基础编码规范

### 1.1 强制注释

- **Java:** 所有方法必须添加 Javadoc 注释
- **Python:** 所有函数/方法必须添加 Docstrings
- **内容要求:** 描述用途、参数类型/说明、返回值类型/说明

### 1.2 代码质量

- 每个方法/函数不超过 300 行
- 使用描述性命名，做到"望文生义"

## 2. 项目知识库同步机制

### 2.1 核心要求

创建或更新 `Service`、`Manager`、`Mapper` 的任何方法时，必须同步更新 `func.md` 文档。

### 2.2 格式模板

```
# 项目功能清单 (func.md)

### 枚举类 (gyl-common/src/main/java/com/njgyl/common/enums)
- **CustomerTypeEnum** - 客户类型枚举 (个人、门店、企业)

### Service层 (gyl-core/src/main/java/com/njgyl/core/service)
- **AdminUserService** - 管理员用户业务服务 (登录认证、用户创建、用户更新、用户查询等)

### Manager层 (gyl-core/src/main/java/com/njgyl/core/manager)
- **GylSkuManagerImpl** - 商品SKU数据业务管理 (SKU分页查询、批量查询、分类过滤等)

### Mapper层 (gyl-core/src/main/java/com/njgyl/core/mapper)
- **OrderMapper** - 订单数据访问 (订单查询、状态更新、支付信息更新等)
```

## 3. AI 强制检查流程

### 3.1 编码前检查

**必须主动查看 `func.md` 文档**，确认是否已有相关功能，避免重复开发。

### 3.2 决策复用

- 已存在类似功能：优先复用或扩展现有代码
- 需要全新功能：继续新建开发

### 3.3 编码后更新

**必须立即更新 `func.md` 文档**，将新增功能按标准格式同步到文档中。

---

**核心原则：编码前必查 `func.md`，编码后必更新 `func.md`**