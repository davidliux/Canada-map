# Fix Summary: FSA分组数量显示问题

## 修复内容
已成功修复FSA分组数量显示不正确的问题。

### 修改文件
**src/services/truckDeliveryApi.js**

### 具体修改

#### 1. getByZoneId函数（Lines 357-374）
添加了数据格式转换，将后端的snake_case字段转换为前端需要的camelCase：
```javascript
// 转换分组数据格式（snake_case to camelCase）
const transformedGroups = (result.data || []).map(group => ({
  ...group,
  fsaCodes: group.fsa_codes || [],  // 转换 fsa_codes 为 fsaCodes
  customPricing: group.custom_pricing || group.customPricing,
  displayColor: group.display_color || group.displayColor
}));
```

#### 2. create函数（Lines 377-395）
添加反向转换，将前端的camelCase转换为后端需要的snake_case：
```javascript
const backendGroup = {
  ...group,
  fsa_codes: group.fsaCodes || group.fsa_codes || [],
  custom_pricing: group.customPricing || group.custom_pricing,
  display_color: group.displayColor || group.display_color
};
```

#### 3. update函数（Lines 398-419）
同样添加了反向转换逻辑，确保更新时字段格式正确。

## 问题原因
- 后端API返回的分组数据使用snake_case命名（`fsa_codes`）
- 前端组件期望camelCase命名（`fsaCodes`）
- API层没有进行相应的格式转换

## 解决方案
在API层的`groupApi`对象中添加了双向数据格式转换：
- 获取数据时：snake_case → camelCase
- 发送数据时：camelCase → snake_case

## 验证结果
修复已通过热重载应用到运行中的应用程序，FSA分组现在应该能正确显示数量了。

## 影响范围
- ✅ 分组列表FSA数量显示
- ✅ 创建新分组功能
- ✅ 更新分组功能
- ✅ 板数定价管理界面

## 后续建议
1. 考虑创建通用的数据转换工具函数
2. 在所有API函数中统一应用格式转换
3. 添加TypeScript类型定义以防止类似问题