import {
  getAllRegionConfigs,
  createFSAGroup,
  updateRegionConfig,
  DEFAULT_WEIGHT_RANGES
} from './unifiedStorage.js';

// 优化后的区域配置 - 使用现有的8个区域
const optimizedRegionConfigurations = {
  // 区域1-4: Alberta省
  '1': {
    name: 'AB Zone 1 - Calgary Core',
    groups: [
      {
        name: 'Calgary Downtown & Central',
        fsaCodes: ['T1Y', 'T2A', 'T2B', 'T2C', 'T2E', 'T2G', 'T2H', 'T2K', 'T2L', 'T2M', 'T2N', 'T2R', 'T2S', 'T2T', 'T2V', 'T2X', 'T2Y', 'T2Z', 'T3A', 'T3B', 'T3C', 'T3E', 'T3G', 'T3H', 'T3J', 'T3K', 'T3M', 'T3N', 'T3S']
      }
    ]
  },
  '2': {
    name: 'AB Zone 2 - Calgary Extended & Surrounding',
    groups: [
      {
        name: 'Calgary Remote',
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
        name: 'High River',
        fsaCodes: ['T1V']
      }
    ]
  },
  '3': {
    name: 'AB Zone 3 - Edmonton & Central Alberta',
    groups: [
      {
        name: 'Edmonton Core',
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
  '4': {
    name: 'AB Zone 4 - Edmonton Region',
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
  },

  // 区域5-7: British Columbia省
  '5': {
    name: 'BC Zone 1 - Metro Vancouver Core',
    groups: [
      {
        name: 'Richmond',
        fsaCodes: ['V6V', 'V6W', 'V6X', 'V6Y', 'V7A', 'V7B', 'V7C', 'V7E']
      },
      {
        name: 'New Westminster',
        fsaCodes: ['V3M', 'V3L']
      },
      {
        name: 'Vancouver Downtown',
        fsaCodes: ['V5K', 'V5L', 'V5M', 'V5N', 'V5P', 'V5R', 'V5S', 'V5T', 'V5V', 'V5W', 'V5X', 'V5Y', 'V5Z', 'V6A', 'V6B', 'V6C', 'V6E', 'V6G', 'V6H', 'V6J', 'V6K', 'V6L', 'V6M', 'V6N', 'V6P', 'V6R', 'V6S', 'V6T', 'V6Z', 'V7Y']
      },
      {
        name: 'Delta',
        fsaCodes: ['V4C', 'V4E', 'V4G', 'V4K', 'V4L', 'V4M']
      }
    ]
  },
  '6': {
    name: 'BC Zone 2 - North Shore & Surrey',
    groups: [
      {
        name: 'North Vancouver',
        fsaCodes: ['V7G', 'V7H', 'V7J', 'V7K', 'V7L', 'V7M', 'V7N', 'V7P', 'V7R']
      },
      {
        name: 'West Vancouver',
        fsaCodes: ['V7S', 'V7T', 'V7V', 'V7W']
      },
      {
        name: 'Surrey',
        fsaCodes: ['V3R', 'V3S', 'V3T', 'V3V', 'V3W', 'V3X', 'V3Z', 'V4A', 'V4N', 'V4P']
      },
      {
        name: 'White Rock',
        fsaCodes: ['V4B']
      }
    ]
  },
  '7': {
    name: 'BC Zone 3 - Fraser Valley',
    groups: [
      {
        name: 'Coquitlam',
        fsaCodes: ['V3B', 'V3E', 'V3C', 'V3J', 'V3K']
      },
      {
        name: 'Port Moody',
        fsaCodes: ['V3H']
      },
      {
        name: 'Maple Ridge',
        fsaCodes: ['V2W', 'V2X', 'V4R']
      },
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
  },

  // 区域8: BC Interior, Vancouver Island & Manitoba
  '8': {
    name: 'Zone 8 - BC Interior/Island & Manitoba',
    groups: [
      // BC Interior
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
      // Vancouver Island
      {
        name: 'Victoria',
        fsaCodes: ['V8N', 'V8P', 'V8R', 'V8S', 'V8T', 'V8V', 'V8W', 'V8X', 'V8Y', 'V9A', 'V9B']
      },
      {
        name: 'Courtenay',
        fsaCodes: ['V9J', 'V9N']
      },
      {
        name: 'Nanaimo',
        fsaCodes: ['V9R', 'V9S', 'V9T', 'V9V']
      },
      // Manitoba
      {
        name: 'Winnipeg',
        fsaCodes: ['R2C', 'R2E', 'R2G', 'R2H', 'R2J', 'R2K', 'R2L', 'R2M', 'R2N', 'R2P', 'R2R', 'R2V', 'R2W', 'R2X', 'R2Y', 'R3A', 'R3B', 'R3C', 'R3E', 'R3G', 'R3H', 'R3J', 'R3K', 'R3L', 'R3M', 'R3N', 'R3P', 'R3R', 'R3S', 'R3T', 'R3V', 'R3W', 'R3X', 'R3Y', 'R3Z']
      }
    ]
  }
};

/**
 * 清除区域的所有FSA分组
 */
async function clearRegionGroups(regionId) {
  try {
    const config = await getRegionConfig(regionId);
    if (config && config.fsaGroups) {
      // 删除所有现有分组
      for (const group of config.fsaGroups) {
        await deleteFSAGroup(regionId, group.id);
      }
    }
  } catch (error) {
    console.log(`清除区域 ${regionId} 分组时出错:`, error);
  }
}

/**
 * 设置优化后的区域配置
 */
export async function setupOptimizedRegions() {
  console.log('开始配置优化的区域设置...');
  console.log('='.repeat(50));

  try {
    // 获取现有配置
    const existingConfigs = await getAllRegionConfigs();

    // 配置每个区域
    for (const [regionId, regionData] of Object.entries(optimizedRegionConfigurations)) {
      console.log(`\n配置区域 ${regionId}: ${regionData.name}`);
      console.log('-'.repeat(40));

      // 创建或更新区域配置
      const regionConfig = existingConfigs[regionId] || {
        id: regionId,
        name: regionData.name,
        isActive: true,
        fsaCodes: [],
        postalCodes: [],
        fsaGroups: [],
        weightRanges: [...DEFAULT_WEIGHT_RANGES],
        lastUpdated: new Date().toISOString()
      };

      // 更新区域基本信息
      regionConfig.name = regionData.name;
      regionConfig.isActive = true;

      // 确保有重量区间配置
      if (!regionConfig.weightRanges || regionConfig.weightRanges.length === 0) {
        regionConfig.weightRanges = [...DEFAULT_WEIGHT_RANGES];
      }

      // 清除现有分组（如果需要重新配置）
      regionConfig.fsaGroups = [];

      // 保存区域基本配置
      await updateRegionConfig(regionId, regionConfig);

      // 创建FSA分组
      let totalFSAs = 0;
      for (const group of regionData.groups) {
        if (group.fsaCodes && group.fsaCodes.length > 0) {
          console.log(`  ✅ 创建分组: ${group.name} (${group.fsaCodes.length} FSAs)`);
          await createFSAGroup(regionId, {
            name: group.name,
            fsaCodes: group.fsaCodes
          });
          totalFSAs += group.fsaCodes.length;
        }
      }

      console.log(`  📊 区域 ${regionId} 配置完成: ${regionData.groups.length} 个分组, 共 ${totalFSAs} 个FSA`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ 所有区域配置完成！');
    console.log('\n配置摘要:');
    console.log('- 区域 1-4: Alberta省 (Calgary, Edmonton及周边)');
    console.log('- 区域 5-7: British Columbia省 (Vancouver及Fraser Valley)');
    console.log('- 区域 8: BC Interior, Vancouver Island及Manitoba');

    return true;
  } catch (error) {
    console.error('配置区域时出错:', error);
    return false;
  }
}

// 导入必要的函数
import { getRegionConfig, deleteFSAGroup } from './unifiedStorage.js';

// 导出配置数据
export { optimizedRegionConfigurations };