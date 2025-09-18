# Bug Report: FSA鼠标悬停时颜色异常变化

## Bug Summary
当用户选中城市、区域或分组后，鼠标悬停在高亮的FSA区块上时，FSA的颜色会发生不期望的变化。有时颜色会消失，有时会变浅。用户期望鼠标悬停时不应有任何颜色变化。

## Environment
- **Component**: TruckDeliveryMap.jsx (卡车配送地图组件)
- **Framework**: React + Leaflet
- **Browser**: All modern browsers
- **Map Library**: React Leaflet

## Reproduction Steps
1. 打开地图应用
2. 选择一个城市（如Toronto）
3. 选择区域或分组进行筛选
4. 鼠标移到高亮显示的FSA色块上
5. 观察到颜色发生变化（变浅或消失）
6. 鼠标离开后颜色可能无法恢复

## Expected Behavior
- 鼠标悬停时FSA色块颜色应保持不变
- 鼠标离开时FSA色块颜色应保持不变
- 只有点击或其他交互操作才应该改变颜色

## Actual Behavior
- 鼠标悬停时FSA色块颜色变化
- 鼠标离开后颜色状态不一致
- 颜色变化包括：
  - 完全消失（透明）
  - 颜色变浅
  - 边框样式改变

## Visual Evidence
用户描述的问题：
- 选中城市/区域/分组后的FSA处于高亮状态
- 鼠标交互导致意外的视觉反馈
- 破坏了地图的视觉一致性

## Impact Assessment
- **Severity**: Medium
- **Frequency**: Always reproducible
- **User Impact**: 影响地图使用体验，造成视觉干扰
- **Business Impact**: 降低产品专业性

## Initial Investigation Notes
需要检查：
1. Leaflet的mouseover/mouseout事件处理
2. FSA样式的动态设置逻辑
3. 高亮状态与鼠标悬停状态的冲突
4. 样式恢复机制的问题

## Related Issues
- 可能与地图缩放、平移时的样式重置有关
- 可能与多个状态管理逻辑冲突有关

## Reporter
用户通过 /bug-analyze 命令报告

## Date Reported
2025-09-17

## Status
Under Investigation