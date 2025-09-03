// 加拿大可配送邮编数据
// 用户可以在此文件中维护邮编信息
// 格式: { postalCode: '邮编', city: '城市', province: '省份', lat: 纬度, lng: 经度 }

export const deliverablePostalCodes = [
  // 示例数据 - 请用您的实际邮编数据替换
  { postalCode: 'M5V 3A8', city: 'Toronto', province: 'ON', lat: 43.6426, lng: -79.3871 },
  { postalCode: 'H3B 1A0', city: 'Montreal', province: 'QC', lat: 45.5017, lng: -73.5673 },
  { postalCode: 'V6B 1A1', city: 'Vancouver', province: 'BC', lat: 49.2827, lng: -123.1207 },
  { postalCode: 'T2P 1J9', city: 'Calgary', province: 'AB', lat: 51.0447, lng: -114.0719 },
  { postalCode: 'S7K 3J5', city: 'Saskatoon', province: 'SK', lat: 52.1332, lng: -106.6700 },
  { postalCode: 'R3C 4A2', city: 'Winnipeg', province: 'MB', lat: 49.8951, lng: -97.1384 },
  { postalCode: 'K1A 0A2', city: 'Ottawa', province: 'ON', lat: 45.4215, lng: -75.6972 },
  { postalCode: 'B3H 1A1', city: 'Halifax', province: 'NS', lat: 44.6488, lng: -63.5752 },
  
  // 更多邮编数据将在此处添加...
  // 用户可以通过以下方式维护:
  // 1. 直接编辑此文件
  // 2. 通过管理界面添加/删除
  // 3. 导入CSV文件
];

// 邮编验证函数
export const validatePostalCode = (postalCode) => {
  const canadianPostalCodeRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
  return canadianPostalCodeRegex.test(postalCode);
};

// 按省份分组邮编
export const getPostalCodesByProvince = () => {
  return deliverablePostalCodes.reduce((acc, item) => {
    if (!acc[item.province]) {
      acc[item.province] = [];
    }
    acc[item.province].push(item);
    return acc;
  }, {});
};

// 搜索邮编
export const searchPostalCodes = (query) => {
  const lowerQuery = query.toLowerCase();
  return deliverablePostalCodes.filter(item => 
    item.postalCode.toLowerCase().includes(lowerQuery) ||
    item.city.toLowerCase().includes(lowerQuery) ||
    item.province.toLowerCase().includes(lowerQuery)
  );
}; 