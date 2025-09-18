# Bug Report: 城市选中后边框高亮不一致

## Bug Summary
选中城市后，地图上只有部分FSA区域有高亮的白色边框，而同属于该城市的其他FSA区域没有高亮边框。

## Environment
- **项目**: 加拿大快递配送区域地图系统
- **组件**: TruckDeliveryMap.jsx
- **页面**: /dashboards/truck-delivery
- **相关改动**: 刚刚修复了城市颜色覆盖问题

## Steps to Reproduce
1. 访问卡车派送数据大屏页面
2. 点击左侧城市列表选择一个城市（如AB）
3. 观察地图上该城市的FSA区域
4. 部分FSA有白色高亮边框，部分没有

## Expected Behavior
- 选中城市的所有FSA区域都应该有一致的高亮效果
- 所有属于该城市的FSA应该有白色边框和稍高的透明度

## Actual Behavior
- 只有部分FSA区域显示白色边框
- 同一城市的FSA显示效果不一致
- 影响视觉的整体性和用户理解

## Visual Evidence
- 用户提供的截图显示选中城市后，部分地图块有高亮边缘，部分没有

## Impact
- **严重性**: 中等
- **影响范围**: 视觉一致性和用户体验
- **业务影响**: 用户难以准确识别选中城市的完整覆盖范围

## Related Changes
此问题出现在修复城市颜色覆盖问题之后，可能与新增的 `isSelected` 标记逻辑有关。