# Bug分析报告：卡车派送价格查询界面未同步高级定价模式

## 问题描述
卡车派送数据大屏中的价格查询界面（TOM区域）无法同步显示新增的板数定价（高级定价模式）价格。用户在配置管理界面设置了分组的自定义价格，但在价格查询弹窗中仍显示区域默认价格。

## 调查时间
2025-09-17

## 影响范围
- **影响功能**：卡车派送价格查询功能
- **影响用户**：所有使用高级定价模式（分组板数定价）的用户
- **严重程度**：高 - 价格显示错误可能导致报价错误

## 根本原因分析

### 1. 数据流断层
经过代码调查，发现存在以下数据流问题：

#### 1.1 价格保存流程（正常）
```
用户配置界面(FSAGroupPricingPanel)
→ pricingService.saveGroupSkidPricing()
→ API: POST /zones/:zoneId/groups/:groupId/skid-pricing
→ 数据库: GroupSkidPricing表
```

#### 1.2 价格查询流程（问题所在）
```
价格查询弹窗(FSAPricingModal)
→ getFSAGroup() 从localStorage获取分组信息
→ 检查 group.customPricing.enabled 和 group.customPricing.skidRanges（错误的字段）
→ 未找到价格，使用区域默认价格
```

### 2. 核心问题
1. **数据结构不一致**：
   - 保存时：价格数据存储在数据库的`GroupSkidPricing`表中
   - 查询时：从localStorage中的`group.customPricing`字段查找（该字段不存在或未同步）

2. **字段名不匹配**：
   - FSAPricingModal组件（第94行）查找：`group.customPricing?.enabled` 和 `group.customPricing?.skidRanges`
   - FSAGroupPricingPanel组件使用：`group.customSkidPricing`
   - 实际数据库字段：`prices`

3. **缺少数据同步机制**：
   - 分组价格保存到数据库后，未同步更新localStorage中的分组信息
   - FSAPricingModal依赖localStorage中的过期数据

### 3. 价格优先级逻辑
根据FSAPricingModal.jsx的实现，价格查询优先级为：
1. 分组自定义价格（group.customPricing）- 但字段名错误
2. 区域API价格（从/api/v1/truck-delivery/zones/:zoneId获取）
3. localStorage备用价格

## 具体代码位置

### 问题代码位置
1. **FSAPricingModal.jsx:93-100** - 错误的价格获取逻辑
```javascript
// 错误：使用了不存在的字段
if (group && group.customPricing?.enabled && group.customPricing?.skidRanges) {
  applicablePricing = {
    source: 'group',
    groupName: group.name,
    prices: group.customPricing.skidRanges // 应该是 customSkidPricing 或从API获取
  };
}
```

2. **unifiedStorage.js:816-824** - getFSAGroup函数未加载价格数据
```javascript
export const getFSAGroup = async (regionId, fsaCode) => {
  const groups = await getRegionFSAGroups(regionId);
  return groups.find(g => g.fsaCodes.includes(fsaCode)) || null;
  // 缺少：未从数据库加载分组的板数定价数据
};
```

## 修复方案

### 方案一：修正字段名并加载价格数据（推荐）
1. 修改FSAPricingModal.jsx，正确加载分组价格：
```javascript
// 在第86-101行之间
const group = await getFSAGroup(regionId, fsaCode);
if (group) {
  // 从API获取分组的板数定价
  try {
    const groupPricing = await pricingService.getGroupSkidPricing(
      cityId,
      regionId,
      group.name || group.id
    );
    if (groupPricing && groupPricing.prices) {
      applicablePricing = {
        source: 'group',
        groupName: group.name,
        prices: groupPricing.prices
      };
    }
  } catch (error) {
    console.log('获取分组价格失败，使用区域价格');
  }
}
```

### 方案二：统一数据结构
1. 在保存分组价格时，同步更新localStorage中的分组信息
2. 确保字段名一致：统一使用`customSkidPricing`而非`customPricing`

### 方案三：完全依赖API（最可靠）
1. 不依赖localStorage缓存
2. 每次查询价格时直接调用API获取最新数据

## 测试建议

### 测试用例
1. **保存分组价格**：
   - 在价格配置管理界面为FSA分组设置自定义价格
   - 验证数据是否正确保存到GroupSkidPricing表

2. **查询分组价格**：
   - 点击地图上属于已配置分组的FSA
   - 验证价格查询弹窗是否显示正确的分组自定义价格
   - 验证价格来源提示是否显示"分组自定义价格"

3. **价格优先级测试**：
   - 配置分组价格和区域价格
   - 验证分组价格优先于区域价格显示

4. **清除缓存测试**：
   - 清除localStorage
   - 验证价格查询仍能正常工作

## 影响评估

### 需要修改的文件
1. `src/components/FSAPricingModal.jsx` - 修正价格获取逻辑
2. `src/utils/unifiedStorage.js` - 可选：增强getFSAGroup函数
3. `src/components/pricing/skid/FSAGroupPricingPanel.jsx` - 可选：保存时同步更新缓存

### 风险评估
- **低风险**：修复只涉及前端价格查询逻辑
- **不影响**：价格保存功能（已正常工作）
- **需注意**：确保修复后的性能（避免过多API调用）

## 建议优先级
**P0 - 紧急修复**
- 价格显示错误直接影响业务报价准确性
- 建议立即修复并部署

## 后续优化建议
1. 实现价格数据缓存策略，减少API调用
2. 添加价格数据版本控制，确保缓存一致性
3. 增加价格查询的错误处理和降级策略
4. 考虑使用WebSocket实时同步价格更新
