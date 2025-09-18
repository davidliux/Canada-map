import truckDeliveryApi from '../services/truckDeliveryApi.js';

// 卡车配送区域配置数据
const truckDeliveryRegionsConfig = {
  // Alberta省配置
  AB: {
    cities: [
      {
        name: 'Calgary',
        province: 'AB',
        center: [51.0447, -114.0719],
        themeColor: '#FF6B6B',
        zones: [
          {
            name: 'Calgary Downtown & Central',
            level: 1,
            fsaCodes: ['T1Y', 'T2A', 'T2B', 'T2C', 'T2E', 'T2G', 'T2H', 'T2K', 'T2L', 'T2M', 'T2N', 'T2R', 'T2S', 'T2T', 'T2V', 'T2X', 'T2Y', 'T2Z', 'T3A', 'T3B', 'T3C', 'T3E', 'T3G', 'T3H', 'T3J', 'T3K', 'T3M', 'T3N', 'T3S'],
            color: '#FF8C8C',
            fsaGroups: [
              {
                name: 'Calgary Core',
                fsa_codes: ['T1Y', 'T2A', 'T2B', 'T2C', 'T2E', 'T2G', 'T2H', 'T2K', 'T2L', 'T2M', 'T2N', 'T2R', 'T2S', 'T2T', 'T2V', 'T2X', 'T2Y', 'T2Z', 'T3A', 'T3B', 'T3C', 'T3E', 'T3G', 'T3H', 'T3J', 'T3K', 'T3M', 'T3N', 'T3S']
              }
            ]
          },
          {
            name: 'Calgary Remote & Surrounding',
            level: 2,
            fsaCodes: ['T3Z', 'T2W', 'T2J', 'T3P', 'T3R', 'T3L', 'T1Z', 'T2P', 'T1X', 'T4B', 'T0M', 'T4A', 'T4C', 'T1S', 'T1V'],
            color: '#FFB3B3',
            fsaGroups: [
              {
                name: 'Calgary Remote',
                fsa_codes: ['T3Z', 'T2W', 'T2J', 'T3P', 'T3R', 'T3L', 'T1Z', 'T2P']
              },
              {
                name: 'Chestermere',
                fsa_codes: ['T1X']
              },
              {
                name: 'Balzac/Rocky View',
                fsa_codes: ['T4B', 'T0M']
              },
              {
                name: 'Airdrie',
                fsa_codes: ['T4A']
              },
              {
                name: 'Cochrane',
                fsa_codes: ['T4C']
              },
              {
                name: 'Okotoks',
                fsa_codes: ['T1S']
              },
              {
                name: 'High River',
                fsa_codes: ['T1V']
              }
            ]
          }
        ]
      },
      {
        name: 'Edmonton',
        province: 'AB',
        center: [53.5461, -113.4938],
        themeColor: '#4ECDC4',
        zones: [
          {
            name: 'Edmonton Core & Central Alberta',
            level: 1,
            fsaCodes: ['T5A', 'T5B', 'T5C', 'T5E', 'T5G', 'T5H', 'T5J', 'T5K', 'T5L', 'T5M', 'T5N', 'T5P', 'T5R', 'T5S', 'T5T', 'T5V', 'T5W', 'T5X', 'T5Y', 'T5Z', 'T6A', 'T6B', 'T6C', 'T6E', 'T6G', 'T6H', 'T6J', 'T6K', 'T6L', 'T6M', 'T6N', 'T6P', 'T6R', 'T6S', 'T6T', 'T6V', 'T6W', 'T6X', 'T4N', 'T4P', 'T4R', 'T9E', 'T8N', 'T8H', 'T8A'],
            color: '#6FE0D9',
            fsaGroups: [
              {
                name: 'Edmonton Downtown',
                fsa_codes: ['T5A', 'T5B', 'T5C', 'T5E', 'T5G', 'T5H', 'T5J', 'T5K', 'T5L', 'T5M', 'T5N', 'T5P', 'T5R', 'T5S', 'T5T', 'T5V', 'T5W', 'T5X', 'T5Y', 'T5Z', 'T6A', 'T6B', 'T6C', 'T6E', 'T6G', 'T6H', 'T6J', 'T6K', 'T6L', 'T6M', 'T6N', 'T6P', 'T6R', 'T6S', 'T6T', 'T6V', 'T6W', 'T6X']
              },
              {
                name: 'Red Deer',
                fsa_codes: ['T4N', 'T4P', 'T4R']
              },
              {
                name: 'Leduc',
                fsa_codes: ['T9E']
              },
              {
                name: 'St. Albert',
                fsa_codes: ['T8N']
              },
              {
                name: 'Sherwood Park',
                fsa_codes: ['T8H', 'T8A']
              }
            ]
          },
          {
            name: 'Edmonton Region',
            level: 2,
            fsaCodes: ['T4X', 'T8L', 'T7X', 'T7Z', 'T7Y', 'T9G'],
            color: '#95E6E0',
            fsaGroups: [
              {
                name: 'Leduc County',
                fsa_codes: ['T4X']
              },
              {
                name: 'Fort Saskatchewan',
                fsa_codes: ['T8L']
              },
              {
                name: 'Spruce Grove',
                fsa_codes: ['T7X']
              },
              {
                name: 'Stony Plain',
                fsa_codes: ['T7Z', 'T7Y']
              },
              {
                name: 'Devon',
                fsa_codes: ['T9G']
              }
            ]
          }
        ]
      }
    ]
  },

  // British Columbia省配置
  BC: {
    cities: [
      {
        name: 'Vancouver',
        province: 'BC',
        center: [49.2827, -123.1207],
        themeColor: '#6366F1',
        zones: [
          {
            name: 'Metro Vancouver Core',
            level: 1,
            fsaCodes: ['V6V', 'V6W', 'V6X', 'V6Y', 'V7A', 'V7B', 'V7C', 'V7E', 'V3M', 'V3L', 'V5K', 'V5L', 'V5M', 'V5N', 'V5P', 'V5R', 'V5S', 'V5T', 'V5V', 'V5W', 'V5X', 'V5Y', 'V5Z', 'V6A', 'V6B', 'V6C', 'V6E', 'V6G', 'V6H', 'V6J', 'V6K', 'V6L', 'V6M', 'V6N', 'V6P', 'V6R', 'V6S', 'V6T', 'V6Z', 'V7Y', 'V4C', 'V4E', 'V4G', 'V4K', 'V4L', 'V4M'],
            color: '#818CF8',
            fsaGroups: [
              {
                name: 'Richmond',
                fsa_codes: ['V6V', 'V6W', 'V6X', 'V6Y', 'V7A', 'V7B', 'V7C', 'V7E']
              },
              {
                name: 'New Westminster',
                fsa_codes: ['V3M', 'V3L']
              },
              {
                name: 'Vancouver Downtown',
                fsa_codes: ['V5K', 'V5L', 'V5M', 'V5N', 'V5P', 'V5R', 'V5S', 'V5T', 'V5V', 'V5W', 'V5X', 'V5Y', 'V5Z', 'V6A', 'V6B', 'V6C', 'V6E', 'V6G', 'V6H', 'V6J', 'V6K', 'V6L', 'V6M', 'V6N', 'V6P', 'V6R', 'V6S', 'V6T', 'V6Z', 'V7Y']
              },
              {
                name: 'Delta',
                fsa_codes: ['V4C', 'V4E', 'V4G', 'V4K', 'V4L', 'V4M']
              }
            ]
          },
          {
            name: 'North Shore & Surrey',
            level: 2,
            fsaCodes: ['V7G', 'V7H', 'V7J', 'V7K', 'V7L', 'V7M', 'V7N', 'V7P', 'V7R', 'V7S', 'V7T', 'V7V', 'V7W', 'V3R', 'V3S', 'V3T', 'V3V', 'V3W', 'V3X', 'V3Z', 'V4A', 'V4N', 'V4P', 'V4B'],
            color: '#A5B4FC',
            fsaGroups: [
              {
                name: 'North Vancouver',
                fsa_codes: ['V7G', 'V7H', 'V7J', 'V7K', 'V7L', 'V7M', 'V7N', 'V7P', 'V7R']
              },
              {
                name: 'West Vancouver',
                fsa_codes: ['V7S', 'V7T', 'V7V', 'V7W']
              },
              {
                name: 'Surrey',
                fsa_codes: ['V3R', 'V3S', 'V3T', 'V3V', 'V3W', 'V3X', 'V3Z', 'V4A', 'V4N', 'V4P']
              },
              {
                name: 'White Rock',
                fsa_codes: ['V4B']
              }
            ]
          },
          {
            name: 'Fraser Valley',
            level: 3,
            fsaCodes: ['V3B', 'V3E', 'V3C', 'V3J', 'V3K', 'V3H', 'V2W', 'V2X', 'V4R', 'V1M', 'V2Y', 'V2Z', 'V3A', 'V4W', 'V2S', 'V2T', 'V3G', 'V4X', 'V2V', 'V2P', 'V2R'],
            color: '#C7D2FE',
            fsaGroups: [
              {
                name: 'Coquitlam',
                fsa_codes: ['V3B', 'V3E', 'V3C', 'V3J', 'V3K']
              },
              {
                name: 'Port Moody',
                fsa_codes: ['V3H']
              },
              {
                name: 'Maple Ridge',
                fsa_codes: ['V2W', 'V2X', 'V4R']
              },
              {
                name: 'Langley',
                fsa_codes: ['V1M', 'V2Y', 'V2Z', 'V3A', 'V4W']
              },
              {
                name: 'Abbotsford',
                fsa_codes: ['V2S', 'V2T', 'V3G', 'V4X']
              },
              {
                name: 'Mission',
                fsa_codes: ['V2V']
              },
              {
                name: 'Chilliwack',
                fsa_codes: ['V2P', 'V2R']
              }
            ]
          }
        ]
      },
      {
        name: 'Victoria & Interior',
        province: 'BC',
        center: [48.4284, -123.3656],
        themeColor: '#F97316',
        zones: [
          {
            name: 'BC Interior & Island',
            level: 1,
            fsaCodes: ['V2B', 'V2C', 'V2E', 'V1S', 'V1V', 'V1W', 'V1X', 'V1Y', 'V4T', 'V1B', 'V1H', 'V2K', 'V2L', 'V2M', 'V2N', 'V8N', 'V8P', 'V8R', 'V8S', 'V8T', 'V8V', 'V8W', 'V8X', 'V8Y', 'V9A', 'V9B', 'V9J', 'V9N', 'V9R', 'V9S', 'V9T', 'V9V'],
            color: '#FB923C',
            fsaGroups: [
              {
                name: 'Kamloops',
                fsa_codes: ['V2B', 'V2C', 'V2E', 'V1S']
              },
              {
                name: 'Kelowna',
                fsa_codes: ['V1V', 'V1W', 'V1X', 'V1Y', 'V4T']
              },
              {
                name: 'Vernon',
                fsa_codes: ['V1B', 'V1H']
              },
              {
                name: 'Prince George',
                fsa_codes: ['V2K', 'V2L', 'V2M', 'V2N']
              },
              {
                name: 'Victoria',
                fsa_codes: ['V8N', 'V8P', 'V8R', 'V8S', 'V8T', 'V8V', 'V8W', 'V8X', 'V8Y', 'V9A', 'V9B']
              },
              {
                name: 'Courtenay',
                fsa_codes: ['V9J', 'V9N']
              },
              {
                name: 'Nanaimo',
                fsa_codes: ['V9R', 'V9S', 'V9T', 'V9V']
              }
            ]
          }
        ]
      }
    ]
  },

  // Manitoba省配置
  MB: {
    cities: [
      {
        name: 'Winnipeg',
        province: 'MB',
        center: [49.8951, -97.1384],
        themeColor: '#10B981',
        zones: [
          {
            name: 'Winnipeg Metropolitan',
            level: 1,
            fsaCodes: ['R2C', 'R2E', 'R2G', 'R2H', 'R2J', 'R2K', 'R2L', 'R2M', 'R2N', 'R2P', 'R2R', 'R2V', 'R2W', 'R2X', 'R2Y', 'R3A', 'R3B', 'R3C', 'R3E', 'R3G', 'R3H', 'R3J', 'R3K', 'R3L', 'R3M', 'R3N', 'R3P', 'R3R', 'R3S', 'R3T', 'R3V', 'R3W', 'R3X', 'R3Y', 'R3Z'],
            color: '#34D399',
            fsaGroups: [
              {
                name: 'Winnipeg',
                fsa_codes: ['R2C', 'R2E', 'R2G', 'R2H', 'R2J', 'R2K', 'R2L', 'R2M', 'R2N', 'R2P', 'R2R', 'R2V', 'R2W', 'R2X', 'R2Y', 'R3A', 'R3B', 'R3C', 'R3E', 'R3G', 'R3H', 'R3J', 'R3K', 'R3L', 'R3M', 'R3N', 'R3P', 'R3R', 'R3S', 'R3T', 'R3V', 'R3W', 'R3X', 'R3Y', 'R3Z']
              }
            ]
          }
        ]
      }
    ]
  }
};

/**
 * 创建或获取城市
 */
async function ensureCity(cityData) {
  try {
    // 先搜索是否已存在
    const cities = await truckDeliveryApi.cities.getAll(false);
    const existingCity = cities.find(c =>
      c.name === cityData.name && c.province === cityData.province
    );

    if (existingCity) {
      console.log(`  ✓ 城市已存在: ${cityData.name}, ${cityData.province}`);
      return existingCity;
    }

    // 创建新城市
    const preparedCity = truckDeliveryApi.transform.prepareCityForBackend(cityData);
    const newCity = await truckDeliveryApi.cities.create(preparedCity);
    console.log(`  ✅ 创建新城市: ${cityData.name}, ${cityData.province}`);
    return newCity;
  } catch (error) {
    console.error(`  ❌ 处理城市失败 ${cityData.name}:`, error.message);
    throw error;
  }
}

/**
 * 创建或更新区域
 */
async function ensureZone(zoneData, cityId) {
  try {
    // 获取城市的所有区域
    const zones = await truckDeliveryApi.zones.getByCityId(cityId, true);
    const existingZone = zones.find(z => z.name === zoneData.name);

    const preparedZone = {
      city_id: cityId,
      name: zoneData.name,
      level: zoneData.level,
      fsa_codes: zoneData.fsaCodes || [],
      fsa_groups: zoneData.fsaGroups || [],
      color: zoneData.color,
      display_color: zoneData.color,
      is_active: true
    };

    if (existingZone) {
      // 更新现有区域
      await truckDeliveryApi.zones.update(existingZone.id, preparedZone);
      console.log(`    ✓ 更新区域: ${zoneData.name} (${zoneData.fsaCodes.length} FSAs)`);
      return existingZone.id;
    } else {
      // 创建新区域
      const newZone = await truckDeliveryApi.zones.create(preparedZone);
      console.log(`    ✅ 创建区域: ${zoneData.name} (${zoneData.fsaCodes.length} FSAs)`);
      return newZone.id;
    }
  } catch (error) {
    console.error(`    ❌ 处理区域失败 ${zoneData.name}:`, error.message);
    throw error;
  }
}

/**
 * 设置卡车配送区域
 */
export async function setupTruckDeliveryRegions() {
  console.log('开始配置卡车配送区域...');
  console.log('='.repeat(60));

  const results = {
    success: [],
    failed: [],
    stats: {
      totalCities: 0,
      totalZones: 0,
      totalFSAs: 0
    }
  };

  try {
    // 处理每个省份
    for (const [province, provinceConfig] of Object.entries(truckDeliveryRegionsConfig)) {
      console.log(`\n处理省份: ${province}`);
      console.log('-'.repeat(50));

      // 处理每个城市
      for (const cityData of provinceConfig.cities) {
        console.log(`\n处理城市: ${cityData.name}`);

        try {
          // 创建或获取城市
          const city = await ensureCity(cityData);
          results.stats.totalCities++;

          // 处理城市的所有区域
          for (const zoneData of cityData.zones) {
            try {
              await ensureZone(zoneData, city.id);
              results.stats.totalZones++;
              results.stats.totalFSAs += zoneData.fsaCodes.length;
              results.success.push({
                city: cityData.name,
                zone: zoneData.name,
                fsaCount: zoneData.fsaCodes.length
              });
            } catch (error) {
              results.failed.push({
                city: cityData.name,
                zone: zoneData.name,
                error: error.message
              });
            }
          }
        } catch (error) {
          results.failed.push({
            city: cityData.name,
            error: error.message
          });
        }
      }
    }

    // 打印统计结果
    console.log('\n' + '='.repeat(60));
    console.log('配置完成！');
    console.log('\n📊 统计结果:');
    console.log(`  - 城市数量: ${results.stats.totalCities}`);
    console.log(`  - 区域数量: ${results.stats.totalZones}`);
    console.log(`  - FSA总数: ${results.stats.totalFSAs}`);

    if (results.success.length > 0) {
      console.log('\n✅ 成功配置:');
      results.success.forEach(item => {
        console.log(`  - ${item.city} / ${item.zone}: ${item.fsaCount} FSAs`);
      });
    }

    if (results.failed.length > 0) {
      console.log('\n❌ 配置失败:');
      results.failed.forEach(item => {
        console.log(`  - ${item.city}${item.zone ? '/' + item.zone : ''}: ${item.error}`);
      });
    }

    return results;
  } catch (error) {
    console.error('\n严重错误:', error);
    throw error;
  }
}

// 导出配置数据
export { truckDeliveryRegionsConfig };