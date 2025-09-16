// 测试用的区域FSA分配数据
// 这是临时测试数据，用于验证颜色显示功能

export const testRegionFSAs = {
  // 区域1 - Calgary核心区
  '1': [
    'T2P', 'T2R', 'T2S', 'T2T', 'T2G', 'T2M', 'T2N', 'T2L', 'T2K', 'T2J'
  ],

  // 区域2 - Calgary外围
  '2': [
    'T3A', 'T3B', 'T3C', 'T3E', 'T3G', 'T3H', 'T3J', 'T3K', 'T3L', 'T3M'
  ],

  // 区域3 - Edmonton
  '3': [
    'T5A', 'T5B', 'T5C', 'T5E', 'T5G', 'T5H', 'T5J', 'T5K', 'T5L', 'T5M',
    'T6A', 'T6B', 'T6C', 'T6E', 'T6G'
  ],

  // 区域4 - Vancouver核心
  '4': [
    'V6A', 'V6B', 'V6C', 'V6E', 'V6G', 'V6H', 'V6J', 'V6K', 'V6L', 'V6M',
    'V5A', 'V5B', 'V5C', 'V5E', 'V5G'
  ],

  // 区域5 - Toronto核心
  '5': [
    'M5V', 'M5G', 'M5H', 'M5J', 'M5K', 'M5L', 'M5S', 'M5T', 'M5A', 'M5B',
    'M4W', 'M4X', 'M4Y', 'M4V', 'M4T'
  ],

  // 区域6 - Montreal核心
  '6': [
    'H3A', 'H3B', 'H3C', 'H3G', 'H3H', 'H2X', 'H2Y', 'H2Z', 'H4A', 'H4B'
  ],

  // 区域7 - Ottawa
  '7': [
    'K1A', 'K1B', 'K1C', 'K1P', 'K1R', 'K1S', 'K1N', 'K1M', 'K1L', 'K1K'
  ],

  // 区域8 - 其他主要城市
  '8': [
    'R3B', 'R3C', 'R3G', 'R3M', // Winnipeg
    'S7K', 'S7L', 'S7M', 'S7N', // Saskatoon
    'B3H', 'B3J', 'B3K', 'B3L'  // Halifax
  ]
};

// 获取测试区域的FSA列表
export const getTestRegionFSAs = (regionId) => {
  return testRegionFSAs[regionId] || [];
};

// 根据FSA查找所属测试区域
export const findTestRegionByFSA = (fsa) => {
  for (const [regionId, fsaList] of Object.entries(testRegionFSAs)) {
    if (fsaList.includes(fsa)) {
      return regionId;
    }
  }
  return null;
};