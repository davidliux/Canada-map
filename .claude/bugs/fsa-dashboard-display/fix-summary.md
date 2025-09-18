# FSA数据显示问题修复总结

## 问题描述
前端大屏没有能正确读取FSA数据，区域显示0个FSA，尽管实际上有很多FSA编码。

## 根本原因
后端API返回的数据使用snake_case格式（`fsa_codes`），而前端组件期望camelCase格式（`fsaCodes`）。这导致了数据字段名不匹配，使得RegionTabs组件无法正确显示FSA数量。

## 修复方案
在Dashboard.jsx中添加数据规范化逻辑，将所有从后端获取的区域数据的字段名从snake_case转换为camelCase。

### 修改的文件
- `/src/pages/TruckDelivery/Dashboard.jsx`

### 具体修改

1. **loadData函数中的数据规范化**（第85-95行）
   - 在获取城市数据后，对所有区域的字段进行规范化
   - 将`fsa_codes`转换为`fsaCodes`，同时保留原字段以保持兼容性

2. **handleCitySelect函数中的数据处理**（第150-193行）
   - 对从API直接获取的区域数据进行同样的规范化处理
   - 确保所有FSA数据使用统一的camelCase格式

3. **handleRegionClick函数**（第250-251行）
   - 使用规范化后的`fsaCodes`字段

4. **handleFSAClick函数**（第291-322行）
   - 在查找FSA所属区域时，使用规范化后的`fsaCodes`字段

## 验证要点
1. 城市选择后，区域标签应正确显示FSA数量
2. 点击区域标签，应能正确展开显示所有FSA
3. FSA分组功能应正常工作
4. 地图上的FSA高亮显示应正常

## 影响范围
- 仅影响Dashboard组件的数据处理逻辑
- 不影响后端API或其他组件
- 保持了向后兼容性（同时支持snake_case和camelCase）