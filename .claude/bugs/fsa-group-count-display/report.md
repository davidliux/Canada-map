# Bug Report: FSA分组数量显示不正确

## Bug Summary
在板数定价管理页面，分组列表中的每个分组都显示"(无FSA)"，即使这些分组实际上包含FSA代码。

## Environment
- **Application**: 加拿大快递配送区域地图系统
- **Module**: 板数定价管理 - 分组列表
- **Browser**: Not specified
- **Date Reported**: 2025-09-17

## Expected Behavior
每个分组应该显示其包含的FSA数量，例如：
- Balzac (3 FSA)
- Calgary remote area (5 FSA)

## Actual Behavior
所有分组都显示"(无FSA)"，无论实际包含多少个FSA代码。

## Steps to Reproduce
1. 进入卡车配送系统
2. 导航到板数定价管理页面
3. 选择一个城市（如AB区域）
4. 查看分组列表部分

## Visual Evidence
- 截图显示了6个分组：Balzac、Calgary remote area、Chestermere、Cochrane、High River、Okotoks
- 每个分组都显示"(无FSA)"标签
- 分组有正确的选中状态（Balzac被选中）

## Impact
- 用户无法了解每个分组包含的FSA数量
- 影响用户对分组配置的理解
- 可能误导用户认为分组没有配置FSA

## Previous Fix Attempts
之前尝试修复了以下内容：
1. 在FSAGroupManager中添加了数组验证
2. 在calculateGroupStats函数中确保fsaCodes是数组
3. 在unifiedStorage中验证数据格式

但问题仍然存在，说明根本原因可能在其他地方。

## Additional Context
- 页面其他部分功能正常（定价配置、区域选择等）
- 选中状态和清空功能看起来正常工作
- 单价设置为$150.00，板数为10