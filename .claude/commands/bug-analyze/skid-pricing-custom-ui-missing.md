# Bug Analysis: 板数定价缺少自定义价格界面

## Bug Information
- **Bug ID**: skid-pricing-custom-ui-missing
- **Severity**: Medium
- **Category**: UI/UX - Missing Feature
- **Component**: Skid Pricing (板数定价)
- **Reported Date**: 2025-09-15

## Summary
用户报告在板数定价页面中看到"自定义价格"选项的提示，但实际界面中没有找到自定义价格的配置功能。

## Current Behavior
1. 在FSA组管理界面(`FSAGroupManager.jsx`)中显示"自定义价格"标签
2. FSA组编辑器(`FSAGroupEditor.jsx`)中有启用自定义价格的选项
3. 但在板数定价页面(`SkidPricingPage.jsx`)中只有固定价格矩阵输入
4. 自定义价格和板数定价是两个独立的系统，没有集成

## Expected Behavior
板数定价页面应该提供自定义价格规则配置功能，允许用户：
- 设置基于条件的动态定价
- 配置价格范围和规则
- 实现与FSA组自定义价格的集成

## Root Cause Analysis

### 1. 系统设计分离
- **板数定价系统**: 位于`/src/pages/TruckDelivery/SkidPricingPage.jsx`，使用简单的固定价格矩阵
- **动态定价系统**: 位于`/src/pages/TruckDelivery/PricingConfig.jsx`，支持复杂的定价规则
- **FSA组定价**: 在`FSAGroupEditor.jsx`中有`enableCustomPricing`选项，但未与板数定价集成

### 2. UI混淆
- FSA组管理界面显示"自定义价格"标签（`FSAGroupManager.jsx:271`）
- 用户期望在板数定价中找到相同的功能
- 实际自定义功能在"动态定价"按钮后面，需要跳转到另一个页面

### 3. 功能缺失
- `SkidPricingMatrix.jsx`组件只支持固定价格输入
- 没有实现条件定价、价格规则等高级功能
- 缺少与FSA组自定义价格配置的数据关联

## Technical Details

### 相关文件
1. **板数定价组件**:
   - `/src/pages/TruckDelivery/SkidPricingPage.jsx` - 主页面
   - `/src/components/pricing/skid/SkidPricingMatrix.jsx` - 价格矩阵组件

2. **自定义价格相关**:
   - `/src/components/regions/FSAGroupEditor.jsx` - FSA组编辑器，包含自定义价格选项
   - `/src/services/groupAwarePricingService.js` - 处理组定价逻辑
   - `/src/pages/TruckDelivery/PricingConfig.jsx` - 动态定价配置页面

### 数据流
```
FSA组 -> customPricing.enabled -> 但不影响板数定价界面
板数定价 -> 独立的价格矩阵 -> 与自定义价格无关
动态定价 -> 完全独立的规则系统
```

## Impact Assessment
- **用户体验**: 用户无法找到期望的功能，造成困惑
- **功能完整性**: 缺少高级定价功能，限制了系统的灵活性
- **数据一致性**: FSA组的自定义价格设置与板数定价不同步

## Solution Design

### 方案1：集成自定义价格到板数定价界面（推荐）
1. 在`SkidPricingMatrix.jsx`中添加"自定义价格"模式切换
2. 支持两种模式：
   - 固定价格模式（现有功能）
   - 自定义规则模式（新增）
3. 集成FSA组的自定义价格配置

### 方案2：改进UI引导
1. 在板数定价页面添加明确的引导
2. 将"动态定价"按钮改为"自定义价格规则"
3. 添加提示说明两种定价方式的区别

### 方案3：统一定价系统
1. 合并板数定价和动态定价
2. 创建统一的定价配置界面
3. 支持多种定价策略

## Implementation Plan

### 短期修复（快速解决）
1. 在`SkidPricingPage.jsx`中添加自定义价格切换按钮
2. 创建自定义价格配置面板
3. 集成现有的`PricingRuleList`组件

### 长期优化
1. 重构定价系统架构
2. 统一所有定价相关功能
3. 提供更直观的用户界面

## Files to Modify
1. `/src/pages/TruckDelivery/SkidPricingPage.jsx` - 添加自定义价格模式
2. `/src/components/pricing/skid/SkidPricingMatrix.jsx` - 支持规则配置
3. `/src/services/pricingService.js` - 扩展定价服务功能

## Testing Requirements
1. 验证自定义价格模式切换
2. 测试价格规则的创建和编辑
3. 确认FSA组自定义价格与板数定价的集成
4. 验证价格计算的准确性

## Risks and Mitigation
- **风险**: 改动可能影响现有的定价功能
- **缓解**: 保持向后兼容，使用特性开关逐步推出

## Additional Notes
- 用户截图显示的是FSA管理界面，不是板数定价界面
- 需要明确区分不同类型的定价功能
- 考虑添加用户引导和帮助文档