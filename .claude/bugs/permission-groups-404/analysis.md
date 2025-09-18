# Bug Analysis: 权限组API 404错误

## 问题概述

前端在访问权限组API时收到404错误，服务器返回HTML而不是预期的JSON响应。

## 错误信息

```
Failed to load resource: the server responded with a status of 404 (Not Found)
PermissionGroups.jsx:39 获取权限组失败: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

## 根本原因

**API路径不匹配**：前端和后端使用的API路径版本不一致。

- **前端使用路径**：`/api/permissions/groups`
- **后端实际路径**：`/api/v1/permissions/groups`

前端缺少了API版本号 `/v1` 部分。

## 详细分析

### 1. 前端代码位置

文件：`src/components/permissions/PermissionGroups.jsx`

涉及的代码行：
- 第24行：获取权限组列表
- 第54行：创建权限组
- 第81行：更新权限组
- 第111行：删除权限组

```javascript
// 当前错误的URL
const response = await fetch('http://localhost:5001/api/permissions/groups', {
```

### 2. 后端路由配置

文件：`backend/src/server.js`（第45行）

```javascript
app.use('/api/v1/permissions', permissionsRoutes);
```

后端正确注册了权限路由在 `/api/v1/permissions` 路径下。

### 3. 影响范围

仅影响权限组管理功能，包括：
- 权限组列表显示
- 权限组创建
- 权限组编辑
- 权限组删除

## 解决方案

### 修复方法

将前端`PermissionGroups.jsx`文件中所有权限API调用的URL从：
```javascript
'http://localhost:5001/api/permissions/groups'
```

改为：
```javascript
'http://localhost:5001/api/v1/permissions/groups'
```

### 需要修改的具体位置

1. **第24行**：`fetchGroups` 函数
2. **第54行**：`handleCreate` 函数
3. **第81行**：`handleUpdate` 函数（包含动态ID）
4. **第111行**：`handleDelete` 函数（包含动态ID）

## 测试验证

修复后需要验证的功能：
1. 权限组列表能正常加载
2. 能创建新的权限组
3. 能编辑现有权限组
4. 能删除权限组
5. 错误处理机制正常工作

## 预防措施建议

1. **统一API基础路径配置**：建议创建统一的API配置文件，避免硬编码URL
2. **环境变量管理**：使用环境变量管理API端点
3. **API版本管理策略**：确保前后端对API版本的理解一致

## 风险评估

- **风险级别**：低
- **影响范围**：仅影响权限管理模块
- **向后兼容性**：无影响，这是一个简单的路径修正

## 相关文件

- 前端：`src/components/permissions/PermissionGroups.jsx`
- 后端路由：`backend/src/routes/permissions.js`
- 服务器配置：`backend/src/server.js`