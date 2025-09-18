import truckDeliveryApi from '../services/truckDeliveryApi.js';

/**
 * 卡车配送区域配置数据
 * 结构：省份 → Zone（区域） → Groups（分组） → FSAs
 */
const truckDeliveryConfiguration = {
  // Alberta省 - 作为一个城市实体
  AB: {
    cityName: 'Alberta',
    province: 'AB',
    center: [53.9333, -116.5765], // Alberta中心坐标
    themeColor: '#DC2626', // 红色系
    zones: [
      {
        name: 'Zone 1 - Calgary Core',
        level: 1,
        groups: [
          {
            name: 'Calgary',
            fsaCodes: ['T1Y', 'T2A', 'T2B', 'T2C', 'T2E', 'T2G', 'T2H', 'T2K', 'T2L', 'T2M', 'T2N', 'T2R', 'T2S', 'T2T', 'T2V', 'T2X', 'T2Y', 'T2Z', 'T3A', 'T3B', 'T3C', 'T3E', 'T3G', 'T3H', 'T3J', 'T3K', 'T3M', 'T3N', 'T3S']
          }
        ]
      },
      {
        name: 'Zone 2 - Calgary Extended',
        level: 2,
        groups: [
          {
            name: 'Calgary Remote Area',
            fsaCodes: ['T3Z', 'T2W', 'T2J', 'T3P', 'T3R', 'T3L', 'T1Z', 'T2P']
          },
          {
            name: 'Chestermere',
            fsaCodes: ['T1X']
          },
          {
            name: 'Balzac/Rocky View',
            fsaCodes: ['T4B', 'T0M']
          },
          {
            name: 'Airdrie',
            fsaCodes: ['T4A']
          },
          {
            name: 'Cochrane',
            fsaCodes: ['T4C']
          },
          {
            name: 'Okotoks',
            fsaCodes: ['T1S']
          },
          {
            name: 'High River/Nanton',
            fsaCodes: ['T1V']
          }
        ]
      },
      {
        name: 'Zone 3 - Edmonton & Red Deer',
        level: 3,
        groups: [
          {
            name: 'Edmonton',
            fsaCodes: ['T5A', 'T5B', 'T5C', 'T5E', 'T5G', 'T5H', 'T5J', 'T5K', 'T5L', 'T5M', 'T5N', 'T5P', 'T5R', 'T5S', 'T5T', 'T5V', 'T5W', 'T5X', 'T5Y', 'T5Z', 'T6A', 'T6B', 'T6C', 'T6E', 'T6G', 'T6H', 'T6J', 'T6K', 'T6L', 'T6M', 'T6N', 'T6P', 'T6R', 'T6S', 'T6T', 'T6V', 'T6W', 'T6X']
          },
          {
            name: 'Red Deer',
            fsaCodes: ['T4N', 'T4P', 'T4R']
          },
          {
            name: 'Leduc',
            fsaCodes: ['T9E']
          },
          {
            name: 'St. Albert',
            fsaCodes: ['T8N']
          },
          {
            name: 'Sherwood Park',
            fsaCodes: ['T8H', 'T8A']
          }
        ]
      },
      {
        name: 'Zone 4 - Edmonton Surrounding',
        level: 4,
        groups: [
          {
            name: 'Leduc County',
            fsaCodes: ['T4X']
          },
          {
            name: 'Fort Saskatchewan',
            fsaCodes: ['T8L']
          },
          {
            name: 'Spruce Grove',
            fsaCodes: ['T7X']
          },
          {
            name: 'Stony Plain',
            fsaCodes: ['T7Z', 'T7Y']
          },
          {
            name: 'Devon',
            fsaCodes: ['T9G']
          }
        ]
      }
    ]
  },

  // British Columbia省 - 作为一个城市实体
  BC: {
    cityName: 'British Columbia',
    province: 'BC',
    center: [53.7267, -127.6476], // BC中心坐标
    themeColor: '#2563EB', // 蓝色系
    zones: [
      {
        name: 'Zone 1 - Richmond & New Westminster',
        level: 1,
        groups: [
          {
            name: 'Richmond',
            fsaCodes: ['V6V', 'V6W', 'V6X', 'V6Y', 'V7A', 'V7B', 'V7C', 'V7E']
          },
          {
            name: 'New Westminster',
            fsaCodes: ['V3M', 'V3L']
          }
        ]
      },
      {
        name: 'Zone 2 - Vancouver & North Shore',
        level: 2,
        groups: [
          {
            name: 'Kingsway',
            fsaCodes: ['V5N', 'V5P', 'V5T', 'V5Y', 'V5Z']
          },
          {
            name: 'South Vancouver',
            fsaCodes: ['V5W', 'V5X', 'V6P', 'V6R', 'V6S']
          },
          {
            name: 'West Vancouver',
            fsaCodes: ['V7S', 'V7T', 'V7V', 'V7W']
          },
          {
            name: 'Delta',
            fsaCodes: ['V4C', 'V4E', 'V4G', 'V4K', 'V4L', 'V4M']
          },
          {
            name: 'North Vancouver',
            fsaCodes: ['V7G', 'V7H', 'V7J', 'V7K', 'V7L', 'V7M', 'V7N', 'V7P', 'V7R']
          },
          {
            name: 'Vancouver',
            fsaCodes: ['V5K', 'V5L', 'V5M', 'V5R', 'V5S', 'V5V', 'V6A', 'V6B', 'V6C', 'V6E', 'V6G', 'V6H', 'V6J', 'V6K', 'V6L', 'V6M', 'V6N', 'V6T', 'V6Z', 'V7Y']
          }
        ]
      },
      {
        name: 'Zone 3 - Surrey & Coquitlam',
        level: 3,
        groups: [
          {
            name: 'Surrey',
            fsaCodes: ['V3R', 'V3S', 'V3T', 'V3V', 'V3W', 'V3X', 'V3Z', 'V4A', 'V4N', 'V4P']
          },
          {
            name: 'Coquitlam',
            fsaCodes: ['V3B', 'V3E', 'V3C', 'V3J', 'V3K']
          },
          {
            name: 'Port Moody',
            fsaCodes: ['V3H']
          },
          {
            name: 'White Rock',
            fsaCodes: ['V4B']
          },
          {
            name: 'Maple Ridge',
            fsaCodes: ['V2W', 'V2X', 'V4R']
          }
        ]
      },
      {
        name: 'Zone 4 - Fraser Valley',
        level: 4,
        groups: [
          {
            name: 'Langley Twp',
            fsaCodes: ['V1M', 'V2Y', 'V2Z', 'V3A', 'V4W']
          },
          {
            name: 'Abbotsford',
            fsaCodes: ['V2S', 'V2T', 'V3G', 'V4X']
          },
          {
            name: 'Mission',
            fsaCodes: ['V2V']
          },
          {
            name: 'Chilliwack',
            fsaCodes: ['V2P', 'V2R']
          }
        ]
      },
      {
        name: 'Zone 5 - Interior & Island',
        level: 5,
        groups: [
          {
            name: 'Kamloops',
            fsaCodes: ['V2B', 'V2C', 'V2E', 'V1S']
          },
          {
            name: 'Kelowna',
            fsaCodes: ['V1V', 'V1W', 'V1X', 'V1Y', 'V4T']
          },
          {
            name: 'Vernon',
            fsaCodes: ['V1B', 'V1H']
          },
          {
            name: 'Prince George',
            fsaCodes: ['V2K', 'V2L', 'V2M', 'V2N']
          },
          {
            name: 'Victoria',
            fsaCodes: ['V8N', 'V8P', 'V8R', 'V8S', 'V8T', 'V8V', 'V8W', 'V8X', 'V8Y', 'V9A', 'V9B']
          },
          {
            name: 'Langford',
            fsaCodes: [] // V9B已包含在Victoria中
          },
          {
            name: 'Courtenay',
            fsaCodes: ['V9J', 'V9N']
          },
          {
            name: 'Nanaimo',
            fsaCodes: ['V9R', 'V9S', 'V9T', 'V9V']
          }
        ]
      }
    ]
  },

  // Manitoba省 - 作为一个城市实体
  MB: {
    cityName: 'Manitoba',
    province: 'MB',
    center: [53.7609, -98.8139], // Manitoba中心坐标
    themeColor: '#059669', // 绿色系
    zones: [
      {
        name: 'Zone 1 - Winnipeg',
        level: 1,
        groups: [
          {
            name: 'Winnipeg',
            fsaCodes: ['R2C', 'R2E', 'R2G', 'R2H', 'R2J', 'R2K', 'R2L', 'R2M', 'R2N', 'R2P', 'R2R', 'R2V', 'R2W', 'R2X', 'R2Y', 'R3A', 'R3B', 'R3C', 'R3E', 'R3G', 'R3H', 'R3J', 'R3K', 'R3L', 'R3M', 'R3N', 'R3P', 'R3R', 'R3S', 'R3T', 'R3V', 'R3W', 'R3X', 'R3Y', 'R3Z']
          }
        ]
      }
    ]
  }
};

/**
 * 创建或获取城市（省份级别）
 */
async function ensureProvinceCity(provinceData) {
  try {
    const cities = await truckDeliveryApi.cities.getAll(false);
    const existingCity = cities.find(c =>
      c.name === provinceData.cityName && c.province === provinceData.province
    );

    if (existingCity) {
      console.log(`  ✓ 省份城市已存在: ${provinceData.cityName}`);
      return existingCity;
    }

    // 创建新城市
    const cityData = {
      name: provinceData.cityName,
      province: provinceData.province,
      center_lat: provinceData.center[0],
      center_lng: provinceData.center[1],
      theme_color: provinceData.themeColor,
      metadata: {
        type: 'province_city',
        created_by: 'setup_script'
      }
    };

    const newCity = await truckDeliveryApi.cities.create(cityData);
    console.log(`  ✅ 创建省份城市: ${provinceData.cityName}`);
    return newCity;
  } catch (error) {
    console.error(`  ❌ 处理省份城市失败 ${provinceData.cityName}:`, error.message || error);
    console.error('  错误详情:', error);
    throw error;
  }
}

/**
 * 创建或更新Zone（区域）
 */
async function ensureZone(zoneData, cityId, zoneColor) {
  // 在try块外定义变量，确保catch块也能访问
  let allFSAs = [];
  let fsaGroups = [];

  try {
    // 计算Zone的所有FSA（从所有分组汇总）
    zoneData.groups.forEach(group => {
      if (group.fsaCodes && group.fsaCodes.length > 0) {
        allFSAs.push(...group.fsaCodes);
        fsaGroups.push({
          name: group.name,
          fsa_codes: group.fsaCodes
        });
      }
    });

    // 获取城市的所有区域
    const zones = await truckDeliveryApi.zones.getByCityId(cityId, true);
    const existingZone = zones.find(z => z.name === zoneData.name);

    const zonePayload = {
      city_id: cityId,
      name: zoneData.name,
      level: zoneData.level,
      fsa_codes: allFSAs,
      color: zoneColor,
      display_color: zoneColor,
      is_active: true,
      metadata: {
        fsa_groups: fsaGroups,  // 将fsa_groups放在metadata中
        groups_count: fsaGroups.length,
        total_fsas: allFSAs.length
      }
    };

    if (existingZone) {
      // 更新现有区域
      await truckDeliveryApi.zones.update(existingZone.id, zonePayload);
      console.log(`    ✓ 更新Zone: ${zoneData.name} (${fsaGroups.length}个分组, ${allFSAs.length}个FSA)`);
      return existingZone.id;
    } else {
      // 创建新区域
      const newZone = await truckDeliveryApi.zones.create(zonePayload);
      console.log(`    ✅ 创建Zone: ${zoneData.name} (${fsaGroups.length}个分组, ${allFSAs.length}个FSA)`);
      return newZone.id;
    }
  } catch (error) {
    console.error(`    ❌ 处理Zone失败 ${zoneData.name}:`, error.message || error);
    console.error('    错误详情:', JSON.stringify(error, null, 2));
    console.error('    请求数据:', JSON.stringify({
      name: zoneData.name,
      level: zoneData.level,
      groups: zoneData.groups.length,
      totalFSAs: allFSAs?.length || 0,
      fsaGroups: fsaGroups,
      allFSAs: allFSAs
    }, null, 2));
    throw error;
  }
}

/**
 * 生成区域颜色
 */
function generateZoneColor(baseColor, level) {
  // 基于基础颜色生成不同深浅的颜色
  const colors = {
    '#DC2626': ['#EF4444', '#F87171', '#FCA5A5', '#FBBF24', '#FCD34D'], // 红色系
    '#2563EB': ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE'], // 蓝色系
    '#059669': ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5']  // 绿色系
  };

  const colorPalette = colors[baseColor] || colors['#2563EB'];
  return colorPalette[Math.min(level - 1, colorPalette.length - 1)];
}

/**
 * 设置卡车配送区域主函数
 */
export async function setupTruckDeliveryRegions() {
  console.log('🚛 开始配置卡车配送区域...');
  console.log('=' .repeat(60));

  const results = {
    provinces: [],
    zones: [],
    failed: [],
    stats: {
      totalProvinces: 0,
      totalZones: 0,
      totalGroups: 0,
      totalFSAs: 0
    }
  };

  try {
    // 处理每个省份
    for (const [provinceCode, provinceData] of Object.entries(truckDeliveryConfiguration)) {
      console.log(`\n📍 处理省份: ${provinceCode} - ${provinceData.cityName}`);
      console.log('-'.repeat(50));

      try {
        // 创建或获取省份城市
        const city = await ensureProvinceCity(provinceData);
        results.stats.totalProvinces++;
        results.provinces.push({
          code: provinceCode,
          name: provinceData.cityName,
          cityId: city.id
        });

        // 处理该省份的所有Zone
        for (const zoneData of provinceData.zones) {
          try {
            const zoneColor = generateZoneColor(provinceData.themeColor, zoneData.level);
            const zoneId = await ensureZone(zoneData, city.id, zoneColor);

            // 统计信息
            const groupCount = zoneData.groups.filter(g => g.fsaCodes && g.fsaCodes.length > 0).length;
            const fsaCount = zoneData.groups.reduce((sum, g) => sum + (g.fsaCodes?.length || 0), 0);

            results.zones.push({
              province: provinceCode,
              zone: zoneData.name,
              level: zoneData.level,
              groups: groupCount,
              fsas: fsaCount
            });

            results.stats.totalZones++;
            results.stats.totalGroups += groupCount;
            results.stats.totalFSAs += fsaCount;

            // 显示分组详情
            console.log(`    📦 ${zoneData.name}:`);
            zoneData.groups.forEach(group => {
              if (group.fsaCodes && group.fsaCodes.length > 0) {
                console.log(`      - ${group.name}: ${group.fsaCodes.length} FSAs`);
              }
            });

          } catch (error) {
            results.failed.push({
              province: provinceCode,
              zone: zoneData.name,
              error: error.message
            });
          }
        }
      } catch (error) {
        results.failed.push({
          province: provinceCode,
          error: error.message
        });
      }
    }

    // 打印最终统计
    console.log('\n' + '='.repeat(60));
    console.log('✅ 配置完成！\n');
    console.log('📊 最终统计:');
    console.log(`  省份数量: ${results.stats.totalProvinces}`);
    console.log(`  Zone数量: ${results.stats.totalZones}`);
    console.log(`  分组数量: ${results.stats.totalGroups}`);
    console.log(`  FSA总数: ${results.stats.totalFSAs}`);

    if (results.zones.length > 0) {
      console.log('\n📋 Zone详情:');
      results.zones.forEach(zone => {
        console.log(`  ${zone.province} - ${zone.zone}: Level ${zone.level}, ${zone.groups}个分组, ${zone.fsas}个FSA`);
      });
    }

    if (results.failed.length > 0) {
      console.log('\n❌ 失败项目:');
      results.failed.forEach(item => {
        console.log(`  - ${item.province}${item.zone ? '/' + item.zone : ''}: ${item.error}`);
      });
    }

    return results;
  } catch (error) {
    console.error('\n❌ 严重错误:', error);
    throw error;
  }
}

// 导出配置数据
export { truckDeliveryConfiguration };