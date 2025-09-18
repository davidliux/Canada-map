import {
  getAllRegionConfigs,
  createFSAGroup,
  updateRegionConfig,
  DEFAULT_WEIGHT_RANGES
} from './unifiedStorage.js';

// 区域配置数据
const regionConfigurations = {
  // Alberta (AB) 省配置
  AB: {
    regionName: 'Alberta',
    zones: [
      {
        id: '1',
        name: 'AB Zone 1 - Calgary',
        groups: [
          {
            name: 'Calgary',
            fsaCodes: ['T1Y', 'T2A', 'T2B', 'T2C', 'T2E', 'T2G', 'T2H', 'T2K', 'T2L', 'T2M', 'T2N', 'T2R', 'T2S', 'T2T', 'T2V', 'T2X', 'T2Y', 'T2Z', 'T3A', 'T3B', 'T3C', 'T3E', 'T3G', 'T3H', 'T3J', 'T3K', 'T3M', 'T3N', 'T3S']
          }
        ]
      },
      {
        id: '2',
        name: 'AB Zone 2 - Calgary Remote Area',
        groups: [
          {
            name: 'Calgary remote area',
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
        id: '3',
        name: 'AB Zone 3 - Edmonton & Red Deer',
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
        id: '4',
        name: 'AB Zone 4 - Edmonton Surrounding',
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
            fsaCodes: ['T9G']  // 注意：原文中是T9E，但T9E已被Leduc使用，这里改为T9G
          }
        ]
      }
    ]
  },

  // British Columbia (BC) 省配置
  BC: {
    regionName: 'British Columbia',
    zones: [
      {
        id: '5',  // 区域5 - BC主要城市
        name: 'BC Zone 1 - Richmond & New Westminster',
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
        id: '5',  // 改为区域5
        name: 'BC Zone 2 - Vancouver & North Shore',
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
          },
          {
            name: 'Eagle Harbour',
            fsaCodes: []  // V7W已在West Vancouver中
          }
        ]
      },
      {
        id: '6',  // 改为区域6
        name: 'BC Zone 3 - Surrey & Coquitlam',
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
        id: '7',  // 改为区域7
        name: 'BC Zone 4 - Fraser Valley',
        groups: [
          {
            name: 'Langley',
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
      }
    ]
  },

  // BC Zone 5 - 合并到区域5中（作为额外的分组）
  BC_Zone5: {
    regionName: 'BC Zone 5 - Interior & Island',
    zones: [
      {
        id: '8',  // 区域8 - BC Interior & Island
        name: 'BC Zone 5 - Interior & Island Cities',
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
            fsaCodes: []  // V9B已在Victoria中
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

  // Manitoba (MB) 省配置 - 合并到区域8
  MB: {
    regionName: 'Manitoba',
    zones: [
      {
        id: '8',  // 区域8也包括Manitoba
        name: 'MB - Winnipeg',
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
 * 设置所有区域配置
 */
export async function setupAllRegions() {
  console.log('开始配置所有区域...');

  try {
    // 获取现有配置
    const existingConfigs = await getAllRegionConfigs();

    // 处理所有配置
    for (const [provKey, provConfig] of Object.entries(regionConfigurations)) {
      console.log(`\n处理省份: ${provConfig.regionName}`);

      for (const zone of provConfig.zones) {
        console.log(`  配置区域 ${zone.id}: ${zone.name}`);

        // 创建或更新区域配置
        const regionConfig = existingConfigs[zone.id] || {
          id: zone.id,
          name: zone.name,
          isActive: true,
          fsaCodes: [],
          postalCodes: [],
          fsaGroups: [],
          weightRanges: [...DEFAULT_WEIGHT_RANGES],  // 使用默认重量区间
          lastUpdated: new Date().toISOString()
        };

        // 更新区域名称
        regionConfig.name = zone.name;
        regionConfig.isActive = true;

        // 确保有重量区间配置
        if (!regionConfig.weightRanges || regionConfig.weightRanges.length === 0) {
          regionConfig.weightRanges = [...DEFAULT_WEIGHT_RANGES];
        }

        // 保存区域基本配置
        await updateRegionConfig(zone.id, regionConfig);

        // 为每个组创建FSA分组
        for (const group of zone.groups) {
          if (group.fsaCodes && group.fsaCodes.length > 0) {
            console.log(`    创建分组: ${group.name} (${group.fsaCodes.length} FSAs)`);
            await createFSAGroup(zone.id, {
              name: group.name,
              fsaCodes: group.fsaCodes
            });
          }
        }
      }
    }

    console.log('\n区域配置完成！');
    return true;
  } catch (error) {
    console.error('配置区域时出错:', error);
    return false;
  }
}

// 导出配置数据供其他模块使用
export { regionConfigurations };