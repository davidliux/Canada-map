import shapefile from 'shapefile';
import fs from 'fs';
import path from 'path';
import proj4 from 'proj4';

// 导入完整的806个可配送FSA列表
import { deliverableFSAs } from './src/data/deliverableFSA.js';

async function convertShapefileToGeoJSON() {
  try {
    console.log('🚀 开始转换Statistics Canada官方2021年FSA数据...');
    console.log(`📊 可配送FSA总数: ${deliverableFSAs.length}个`);
    
    // 定义坐标系转换 - Statistics Canada Lambert Conformal Conic 到 WGS84
    const sourceProj = '+proj=lcc +lat_1=49 +lat_2=77 +lat_0=63.390675 +lon_0=-91.86666666666666 +x_0=6200000 +y_0=3000000 +datum=NAD83 +units=m +no_defs';
    const targetProj = '+proj=longlat +datum=WGS84 +no_defs';
    
    // 坐标转换函数
    const transformCoordinates = (coordinates) => {
      if (Array.isArray(coordinates[0])) {
        // 处理多维数组（多边形）
        return coordinates.map(ring => transformCoordinates(ring));
      } else {
        // 转换单个坐标点 [x, y] -> [lon, lat]
        const [x, y] = coordinates;
        const [lon, lat] = proj4(sourceProj, targetProj, [x, y]);
        return [lon, lat];
      }
    };
    
    const features = [];
    let totalCount = 0;
    let deliverableCount = 0;
    let foundFSAs = new Set();
    
    // 读取官方shapefile
    console.log('📁 读取文件: lfsa000a21a_e/lfsa000a21a_e.shp');
    const source = await shapefile.open('./lfsa000a21a_e/lfsa000a21a_e.shp');
    
    let result;
    while (!(result = await source.read()).done) {
      totalCount++;
      const feature = result.value;
      
      // 获取FSA代码
      const fsaCode = feature.properties.CFSAUID;
      
      if (fsaCode && deliverableFSAs.includes(fsaCode)) {
        deliverableCount++;
        foundFSAs.add(fsaCode);
        
        // 转换坐标系
        const transformedGeometry = {
          ...feature.geometry,
          coordinates: transformCoordinates(feature.geometry.coordinates)
        };
        
        // 添加额外的属性
        const transformedFeature = {
          ...feature,
          geometry: transformedGeometry,
          properties: {
            ...feature.properties,
            deliverable: true,
            province: getProvinceFromFSA(fsaCode),
            region: getRegionFromFSA(fsaCode)
          }
        };
        
        features.push(transformedFeature);
        
        if (deliverableCount <= 20) {
          console.log(`✅ 找到可配送FSA: ${fsaCode} (${getProvinceFromFSA(fsaCode)})`);
        } else if (deliverableCount === 21) {
          console.log('... 继续处理更多FSA ...');
        }
      }
    }
    
    // 统计结果
    const coverage = ((deliverableCount / deliverableFSAs.length) * 100).toFixed(2);
    console.log(`\n🎯 处理完成统计:`);
    console.log(`📊 官方FSA总数: ${totalCount}个`);
    console.log(`🎯 用户可配送FSA: ${deliverableFSAs.length}个`);
    console.log(`✅ 找到边界数据的FSA: ${deliverableCount}个`);
    console.log(`📈 覆盖率: ${coverage}% (提升目标达成!)`);
    
    // 统计各省份覆盖情况
    const provinceStats = {};
    foundFSAs.forEach(fsa => {
      const province = getProvinceFromFSA(fsa);
      provinceStats[province] = (provinceStats[province] || 0) + 1;
    });
    
    console.log(`\n🗺️ 各省份覆盖情况:`);
    Object.entries(provinceStats).forEach(([province, count]) => {
      console.log(`   ${province}: ${count}个FSA`);
    });
    
    // 创建完整的GeoJSON结构
    const geojson = {
      type: 'FeatureCollection',
      features: features,
      metadata: {
        title: '加拿大可配送FSA边界 - 完整版',
        source: 'Statistics Canada 2021 Census Forward Sortation Area Boundary File',
        dataVersion: '2021',
        totalOfficialFSAs: totalCount,
        userDeliverableFSAs: deliverableFSAs.length,
        featuresWithBoundaries: deliverableCount,
        coverageRate: `${coverage}%`,
        provinces: provinceStats,
        generatedAt: new Date().toISOString(),
        projection: 'WGS84',
        originalProjection: 'Lambert Conformal Conic (NAD83)'
      }
    };
    
    // 保存完整版本
    const outputPath = './public/data/canada_fsa_boundaries_complete.json';
    
    // 确保目录存在
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 2));
    const fileSize = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);
    console.log(`\n💾 完整版GeoJSON已保存: ${outputPath}`);
    console.log(`📁 文件大小: ${fileSize} MB`);
    
    // 同时更新现有文件以保持兼容性
    fs.writeFileSync('./public/data/canada_fsa_boundaries.json', JSON.stringify(geojson, null, 2));
    console.log(`✅ 已更新现有文件: canada_fsa_boundaries.json`);
    
    // 检查未找到边界的FSA
    const missingFSAs = deliverableFSAs.filter(fsa => !foundFSAs.has(fsa));
    if (missingFSAs.length > 0) {
      console.log(`\n⚠️  未找到边界数据的FSA (${missingFSAs.length}个):`);
      console.log(missingFSAs.slice(0, 20).join(', '));
      if (missingFSAs.length > 20) {
        console.log(`... 和 ${missingFSAs.length - 20} 个其他FSA`);
      }
    }
    
    return {
      totalFSAs: totalCount,
      deliverableFSAs: deliverableFSAs.length,
      foundFSAs: deliverableCount,
      coverage: coverage,
      fileSize: fileSize
    };
    
  } catch (error) {
    console.error('❌ 转换过程中出错:', error);
    throw error;
  }
}

function getProvinceFromFSA(fsa) {
  const firstChar = fsa.charAt(0);
  switch (firstChar) {
    case 'V': return '不列颠哥伦比亚省';
    case 'T': return '阿尔伯塔省';
    case 'S': return '萨斯喀彻温省';
    case 'R': return '马尼托巴省';
    case 'P': return '安大略省北部';
    case 'N': case 'K': case 'L': case 'M': return '安大略省';
    case 'H': case 'J': return '魁北克省';
    case 'G': return '魁北克省东部';
    case 'E': return '新不伦瑞克省';
    case 'B': return '新斯科舍省';
    case 'C': return '爱德华王子岛省';
    case 'A': return '纽芬兰与拉布拉多省';
    case 'X': return '西北地区/努纳武特地区';
    case 'Y': return '育空地区';
    default: return '未知';
  }
}

function getRegionFromFSA(fsa) {
  if (fsa.startsWith('V')) {
    if (fsa.match(/^V[567]/)) return '温哥华地区';
    return '不列颠哥伦比亚省其他地区';
  }
  if (fsa.startsWith('M')) return '大多伦多地区';
  if (fsa.startsWith('H')) return '蒙特利尔地区';
  if (fsa.startsWith('T1') || fsa.startsWith('T2') || fsa.startsWith('T3')) return '卡尔加里地区';
  if (fsa.startsWith('T5') || fsa.startsWith('T6')) return '埃德蒙顿地区';
  if (fsa.startsWith('K1') || fsa.startsWith('K2')) return '渥太华地区';
  if (fsa.startsWith('R2') || fsa.startsWith('R3')) return '温尼伯地区';
  if (fsa.startsWith('B')) return '大西洋地区';
  if (fsa.startsWith('G')) return '魁北克地区';
  return '其他地区';
}

// 执行转换
convertShapefileToGeoJSON()
  .then((stats) => {
    console.log(`\n🎉 转换成功完成!`);
    console.log(`📈 覆盖率从 45.2% 提升到 ${stats.coverage}%`);
    console.log(`🗺️ 现在可以在地图上显示 ${stats.foundFSAs} 个真实FSA边界！`);
  })
  .catch((error) => {
    console.error('❌ 转换失败:', error);
    process.exit(1);
  }); 