import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { MapPin, Package, Shield, Search } from 'lucide-react';
import { deliverablePostalCodes } from '../data/postalCodes';

// 修复Leaflet默认图标问题
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// 加拿大邮编前缀到地理区域的映射
const canadianFSARegions = {
  // 纽芬兰与拉布拉多 (A)
  'A0': { lat: 53.2734, lng: -57.5211, province: 'NL', name: '纽芬兰拉布拉多北部' },
  'A1': { lat: 47.5615, lng: -52.7126, province: 'NL', name: '圣约翰斯' },
  'A2': { lat: 49.2827, lng: -57.8333, province: 'NL', name: '纽芬兰中部' },
  
  // 新斯科舍省 (B)
  'B0': { lat: 45.0293, lng: -63.2301, province: 'NS', name: '新斯科舍农村' },
  'B1': { lat: 46.2014, lng: -60.1618, province: 'NS', name: '悉尼' },
  'B2': { lat: 44.6488, lng: -63.5752, province: 'NS', name: '哈利法克斯东' },
  'B3': { lat: 44.6488, lng: -63.5752, province: 'NS', name: '哈利法克斯' },
  'B4': { lat: 45.3731, lng: -63.2961, province: 'NS', name: '特鲁罗' },
  
  // 爱德华王子岛 (C)
  'C0': { lat: 46.2382, lng: -63.1311, province: 'PE', name: '爱德华王子岛农村' },
  'C1': { lat: 46.2382, lng: -63.1311, province: 'PE', name: '夏洛特敦' },
  
  // 新不伦瑞克省 (E)
  'E0': { lat: 46.8566, lng: -64.9969, province: 'NB', name: '新不伦瑞克农村' },
  'E1': { lat: 46.0878, lng: -64.7782, province: 'NB', name: '蒙克顿' },
  'E2': { lat: 45.9636, lng: -66.6431, province: 'NB', name: '圣约翰' },
  'E3': { lat: 47.0681, lng: -66.7847, province: 'NB', name: '弗雷德里克顿' },
  'E4': { lat: 47.0218, lng: -65.1107, province: 'NB', name: '米拉米奇' },
  
  // 魁北克省 (G, H, J)
  'G0': { lat: 47.8211, lng: -69.4851, province: 'QC', name: '魁北克农村' },
  'G1': { lat: 46.8139, lng: -71.2080, province: 'QC', name: '魁北克市' },
  'G2': { lat: 46.8139, lng: -71.2080, province: 'QC', name: '魁北克市郊' },
  'G3': { lat: 46.8139, lng: -71.2080, province: 'QC', name: '魁北克市区' },
  'G4': { lat: 46.8139, lng: -71.2080, province: 'QC', name: '魁北克市周边' },
  'G5': { lat: 46.8139, lng: -71.2080, province: 'QC', name: '魁北克市东' },
  'G6': { lat: 45.4697, lng: -71.9370, province: 'QC', name: '舍布鲁克' },
  'G7': { lat: 48.4284, lng: -71.0678, province: 'QC', name: '奇库蒂米' },
  'G8': { lat: 49.2827, lng: -68.1278, province: 'QC', name: '里穆斯基' },
  'G9': { lat: 46.3494, lng: -72.5492, province: 'QC', name: '三河市' },
  
  'H0': { lat: 45.5017, lng: -73.5673, province: 'QC', name: '蒙特利尔农村' },
  'H1': { lat: 45.5017, lng: -73.5673, province: 'QC', name: '蒙特利尔东' },
  'H2': { lat: 45.5017, lng: -73.5673, province: 'QC', name: '蒙特利尔中' },
  'H3': { lat: 45.5017, lng: -73.5673, province: 'QC', name: '蒙特利尔市中心' },
  'H4': { lat: 45.5017, lng: -73.5673, province: 'QC', name: '蒙特利尔西' },
  'H5': { lat: 45.5017, lng: -73.5673, province: 'QC', name: '蒙特利尔北' },
  'H6': { lat: 45.5017, lng: -73.5673, province: 'QC', name: '蒙特利尔西岛' },
  'H7': { lat: 45.4995, lng: -73.6496, province: 'QC', name: '拉瓦尔' },
  'H8': { lat: 45.4642, lng: -73.6855, province: 'QC', name: '南岸' },
  'H9': { lat: 45.4215, lng: -73.8240, province: 'QC', name: '西岛' },
  
  'J0': { lat: 45.8406, lng: -73.9479, province: 'QC', name: '魁北克农村南' },
  'J1': { lat: 45.3781, lng: -71.9264, province: 'QC', name: '舍布鲁克地区' },
  'J2': { lat: 45.4042, lng: -73.1709, province: 'QC', name: '格兰比' },
  'J3': { lat: 45.3139, lng: -73.2493, province: 'QC', name: '圣让' },
  'J4': { lat: 45.5312, lng: -73.1681, province: 'QC', name: '朗格伊' },
  'J5': { lat: 45.6066, lng: -73.7124, province: 'QC', name: '圣杰罗姆' },
  'J6': { lat: 45.7716, lng: -73.3475, province: 'QC', name: '乔利耶特' },
  'J7': { lat: 45.7541, lng: -74.0067, province: 'QC', name: '圣欧斯塔什' },
  'J8': { lat: 46.0720, lng: -77.1090, province: 'QC', name: '加蒂诺' },
  'J9': { lat: 47.4417, lng: -79.0186, province: 'QC', name: '罗恩-诺兰达' },
  
  // 安大略省 (K, L, M, N, P)
  'K0': { lat: 45.3211, lng: -75.8897, province: 'ON', name: '安大略东部农村' },
  'K1': { lat: 45.4215, lng: -75.6972, province: 'ON', name: '渥太华' },
  'K2': { lat: 45.4215, lng: -75.6972, province: 'ON', name: '渥太华西' },
  'K4': { lat: 44.3091, lng: -76.4951, province: 'ON', name: '金斯顿' },
  'K6': { lat: 45.3466, lng: -74.7317, province: 'ON', name: '康沃尔' },
  'K7': { lat: 44.2253, lng: -76.5422, province: 'ON', name: '金斯顿地区' },
  'K8': { lat: 46.3091, lng: -78.2932, province: 'ON', name: '彭布罗克' },
  
  'L0': { lat: 43.9089, lng: -78.9429, province: 'ON', name: '安大略中部农村' },
  'L1': { lat: 43.8828, lng: -79.2697, province: 'ON', name: '奥沙瓦' },
  'L2': { lat: 43.1594, lng: -79.2469, province: 'ON', name: '圣凯瑟琳斯' },
  'L3': { lat: 43.5890, lng: -79.6441, province: 'ON', name: '奥罗拉' },
  'L4': { lat: 44.3894, lng: -79.6903, province: 'ON', name: '巴里' },
  'L5': { lat: 43.5890, lng: -79.6441, province: 'ON', name: '密西沙加北' },
  'L6': { lat: 43.5890, lng: -79.6441, province: 'ON', name: '密西沙加' },
  'L7': { lat: 43.5890, lng: -79.6441, province: 'ON', name: '密西沙加西' },
  'L8': { lat: 43.2557, lng: -79.8711, province: 'ON', name: '哈密尔顿' },
  'L9': { lat: 43.2557, lng: -79.8711, province: 'ON', name: '哈密尔顿地区' },
  
  'M1': { lat: 43.7731, lng: -79.2578, province: 'ON', name: '多伦多东' },
  'M2': { lat: 43.7731, lng: -79.4103, province: 'ON', name: '多伦多北约克' },
  'M3': { lat: 43.7731, lng: -79.4103, province: 'ON', name: '多伦多北' },
  'M4': { lat: 43.6532, lng: -79.3832, province: 'ON', name: '多伦多中' },
  'M5': { lat: 43.6532, lng: -79.3832, province: 'ON', name: '多伦多市中心' },
  'M6': { lat: 43.6532, lng: -79.4103, province: 'ON', name: '多伦多西' },
  'M7': { lat: 43.6532, lng: -79.4103, province: 'ON', name: '多伦多西北' },
  'M8': { lat: 43.6532, lng: -79.4482, province: 'ON', name: '多伦多怡陶碧谷' },
  'M9': { lat: 43.6532, lng: -79.4482, province: 'ON', name: '多伦多怡陶碧谷西' },
  
  'N0': { lat: 43.4643, lng: -80.5204, province: 'ON', name: '安大略西南农村' },
  'N1': { lat: 43.2441, lng: -79.7624, province: 'ON', name: '圣凯瑟琳斯地区' },
  'N2': { lat: 43.4643, lng: -80.5204, province: 'ON', name: '基奇纳' },
  'N3': { lat: 43.4643, lng: -80.5204, province: 'ON', name: '剑桥' },
  'N4': { lat: 42.3831, lng: -81.2496, province: 'ON', name: '伦敦地区' },
  'N5': { lat: 42.3831, lng: -81.2496, province: 'ON', name: '伦敦' },
  'N6': { lat: 42.3831, lng: -81.2496, province: 'ON', name: '伦敦西' },
  'N7': { lat: 42.2998, lng: -82.9677, province: 'ON', name: '萨尼亚' },
  'N8': { lat: 42.2998, lng: -82.9677, province: 'ON', name: '萨尼亚地区' },
  'N9': { lat: 42.3168, lng: -83.0365, province: 'ON', name: '温莎' },
  
  'P0': { lat: 46.4917, lng: -84.3357, province: 'ON', name: '安大略北部农村' },
  'P1': { lat: 46.4917, lng: -80.9930, province: 'ON', name: '萨德伯里' },
  'P2': { lat: 46.4917, lng: -80.9930, province: 'ON', name: '萨德伯里地区' },
  'P3': { lat: 46.4917, lng: -80.9930, province: 'ON', name: '萨德伯里北' },
  'P4': { lat: 45.3211, lng: -79.4631, province: 'ON', name: '帕里桑德' },
  'P5': { lat: 46.2014, lng: -82.6543, province: 'ON', name: '埃利奥特莱克' },
  'P6': { lat: 46.5197, lng: -84.3421, province: 'ON', name: '苏圣玛丽' },
  'P7': { lat: 48.3809, lng: -89.2477, province: 'ON', name: '桑德贝' },
  'P8': { lat: 48.7164, lng: -86.7181, province: 'ON', name: '杰拉尔顿' },
  'P9': { lat: 49.7833, lng: -92.1167, province: 'ON', name: '德莱顿' },
  
  // 马尼托巴省 (R)
  'R0': { lat: 49.8951, lng: -97.1384, province: 'MB', name: '马尼托巴农村' },
  'R1': { lat: 49.8951, lng: -97.1384, province: 'MB', name: '温尼伯南' },
  'R2': { lat: 49.8951, lng: -97.1384, province: 'MB', name: '温尼伯' },
  'R3': { lat: 49.8951, lng: -97.1384, province: 'MB', name: '温尼伯中' },
  'R4': { lat: 49.8951, lng: -97.1384, province: 'MB', name: '温尼伯西' },
  'R5': { lat: 49.8951, lng: -97.1384, province: 'MB', name: '温尼伯北' },
  'R6': { lat: 49.8951, lng: -97.1384, province: 'MB', name: '温尼伯东' },
  'R7': { lat: 49.8483, lng: -99.9513, province: 'MB', name: '布兰登' },
  'R8': { lat: 53.7609, lng: -101.302, province: 'MB', name: '芬弗隆' },
  'R9': { lat: 55.7617, lng: -97.8517, province: 'MB', name: '汤普森' },
  
  // 萨斯喀彻温省 (S)
  'S0': { lat: 52.1579, lng: -106.6702, province: 'SK', name: '萨斯喀彻温农村' },
  'S2': { lat: 52.1579, lng: -106.6702, province: 'SK', name: '萨斯卡通' },
  'S3': { lat: 52.1579, lng: -106.6702, province: 'SK', name: '萨斯卡通北' },
  'S4': { lat: 50.4452, lng: -104.6189, province: 'SK', name: '里贾纳' },
  'S6': { lat: 52.1579, lng: -106.6702, province: 'SK', name: '萨斯卡通市中心' },
  'S7': { lat: 52.1579, lng: -106.6702, province: 'SK', name: '萨斯卡通东' },
  'S9': { lat: 53.2040, lng: -105.7529, province: 'SK', name: '梅尔福特' },
  
  // 阿尔伯塔省 (T)
  'T0': { lat: 53.9333, lng: -116.5765, province: 'AB', name: '阿尔伯塔农村' },
  'T1': { lat: 51.0447, lng: -114.0719, province: 'AB', name: '卡尔加里东南' },
  'T2': { lat: 51.0447, lng: -114.0719, province: 'AB', name: '卡尔加里南' },
  'T3': { lat: 51.0447, lng: -114.0719, province: 'AB', name: '卡尔加里西南' },
  'T4': { lat: 51.0447, lng: -114.0719, province: 'AB', name: '卡尔加里东北' },
  'T5': { lat: 53.5461, lng: -113.4938, province: 'AB', name: '埃德蒙顿' },
  'T6': { lat: 53.5461, lng: -113.4938, province: 'AB', name: '埃德蒙顿南' },
  'T7': { lat: 53.5461, lng: -113.4938, province: 'AB', name: '埃德蒙顿北' },
  'T8': { lat: 53.5461, lng: -113.4938, province: 'AB', name: '埃德蒙顿东' },
  'T9': { lat: 56.2467, lng: -120.8533, province: 'AB', name: '和平河地区' },
  
  // 不列颠哥伦比亚省 (V)
  'V0': { lat: 50.1163, lng: -122.9574, province: 'BC', name: '不列颠哥伦比亚农村' },
  'V1': { lat: 49.8880, lng: -119.4960, province: 'BC', name: '弗农' },
  'V2': { lat: 50.1163, lng: -122.9574, province: 'BC', name: '坎卢普斯' },
  'V3': { lat: 49.1666, lng: -122.7167, province: 'BC', name: '新威斯敏斯特' },
  'V4': { lat: 49.1666, lng: -122.7167, province: 'BC', name: '本拿比' },
  'V5': { lat: 49.2827, lng: -123.1207, province: 'BC', name: '温哥华' },
  'V6': { lat: 49.2827, lng: -123.1207, province: 'BC', name: '温哥华市中心' },
  'V7': { lat: 49.2827, lng: -123.1207, province: 'BC', name: '北温哥华' },
  'V8': { lat: 48.4284, lng: -123.3656, province: 'BC', name: '维多利亚' },
  'V9': { lat: 48.4284, lng: -123.3656, province: 'BC', name: '维多利亚地区' },
  
  // 育空地区、西北地区、努纳武特地区 (X, Y)
  'X0': { lat: 60.7211, lng: -135.0568, province: 'YT', name: '育空' },
  'X1': { lat: 60.7211, lng: -135.0568, province: 'YT', name: '怀特霍斯' },
  'Y0': { lat: 62.4540, lng: -114.3718, province: 'NT', name: '西北地区' },
  'Y1': { lat: 62.4540, lng: -114.3718, province: 'NT', name: '黄刀镇' }
};

// 生成FSA多边形（基于中心点创建合理大小的矩形区域）
const generateFSAPolygon = (fsa, region) => {
  const { lat, lng } = region;
  // 根据人口密度调整大小 - 城市区域较小，农村区域较大
  const size = fsa.endsWith('0') ? 0.8 : 0.3; // 农村区域较大
  
  const coordinates = [
    [lng - size, lat - size],
    [lng + size, lat - size],
    [lng + size, lat + size],
    [lng - size, lat + size],
    [lng - size, lat - size]
  ];
  
  return {
    type: "Feature",
    properties: {
      fsa: fsa,
      name: region.name,
      province: region.province,
      isDeliverable: false // 默认不可配送
    },
    geometry: {
      type: "Polygon",
      coordinates: [coordinates]
    }
  };
};

// 省份颜色配置
const provinceColors = {
  'NL': '#e31a1c', // 红色
  'PE': '#ff7f00', // 橙色  
  'NS': '#1f78b4', // 蓝色
  'NB': '#33a02c', // 绿色
  'QC': '#6a3d9a', // 紫色
  'ON': '#a6cee3', // 浅蓝色
  'MB': '#b2df8a', // 浅绿色
  'SK': '#fb9a99', // 粉色
  'AB': '#fdbf6f', // 浅橙色
  'BC': '#cab2d6', // 淡紫色
  'YT': '#ffff99', // 黄色
  'NT': '#b15928', // 棕色
  'NU': '#999999'  // 灰色
};

const PrecisePostalMap = ({ searchQuery, selectedProvince }) => {
  const [mapData, setMapData] = useState(null);
  const [filteredData, setFilteredData] = useState(null);

  useEffect(() => {
    // 生成所有FSA区域
    const fsaFeatures = Object.entries(canadianFSARegions).map(([fsa, region]) => {
      return generateFSAPolygon(fsa, region);
    });

    // 标记可配送的FSA
    const deliverableFSAs = new Set();
    deliverablePostalCodes.forEach(postal => {
      const fsa = postal.postalCode.substring(0, 2);
      deliverableFSAs.add(fsa);
    });

    // 更新可配送状态
    fsaFeatures.forEach(feature => {
      feature.properties.isDeliverable = deliverableFSAs.has(feature.properties.fsa);
    });

    const geoJsonData = {
      type: "FeatureCollection",
      features: fsaFeatures
    };

    setMapData(geoJsonData);
  }, []);

  useEffect(() => {
    if (!mapData) return;

    let filtered = { ...mapData };

    // 省份筛选
    if (selectedProvince && selectedProvince !== 'all') {
      filtered.features = filtered.features.filter(feature => 
        feature.properties.province === selectedProvince
      );
    }

    // 搜索筛选
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered.features = filtered.features.filter(feature => {
        return (
          feature.properties.fsa.toLowerCase().includes(query) ||
          feature.properties.name.toLowerCase().includes(query) ||
          feature.properties.province.toLowerCase().includes(query)
        );
      });
    }

    setFilteredData(filtered);
  }, [mapData, searchQuery, selectedProvince]);

  const getFeatureStyle = (feature) => {
    const { isDeliverable, province } = feature.properties;
    const baseColor = provinceColors[province] || '#999999';
    
    return {
      fillColor: isDeliverable ? baseColor : '#e0e0e0',
      weight: 1,
      opacity: 0.8,
      color: '#ffffff',
      fillOpacity: isDeliverable ? 0.7 : 0.3
    };
  };

  const onEachFeature = (feature, layer) => {
    const { fsa, name, province, isDeliverable } = feature.properties;
    
    layer.bindPopup(`
      <div class="text-sm">
        <div class="font-bold text-cyber-blue text-lg">${fsa}</div>
        <div class="text-gray-300">${name}</div>
        <div class="text-gray-400">省份: ${province}</div>
        <div class="mt-2">
          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            isDeliverable 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }">
            ${isDeliverable ? '✓ 可配送' : '✗ 不可配送'}
          </span>
        </div>
      </div>
    `);

    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 3,
          color: '#00f5ff',
          fillOpacity: 0.9
        });
      },
      mouseout: (e) => {
        const layer = e.target;
        layer.setStyle(getFeatureStyle(feature));
      }
    });
  };

  const deliverableCount = filteredData ? 
    filteredData.features.filter(f => f.properties.isDeliverable).length : 0;
  const totalCount = filteredData ? filteredData.features.length : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-cyber-gray rounded-2xl shadow-2xl overflow-hidden border border-cyber-blue/30"
    >
      {/* 地图标题和统计 */}
      <div className="bg-gradient-to-r from-cyber-dark to-cyber-gray p-4 border-b border-cyber-blue/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-cyber-blue/20 p-2 rounded-lg">
              <MapPin className="w-6 h-6 text-cyber-blue" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">精确邮编覆盖地图</h3>
              <p className="text-gray-400 text-sm">每个模块代表一个前向分拣区(FSA)</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyber-blue">{deliverableCount}</div>
              <div className="text-xs text-gray-400">可配送区域</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{totalCount}</div>
              <div className="text-xs text-gray-400">总区域数</div>
            </div>
          </div>
        </div>
      </div>

      {/* 图例 */}
      <div className="bg-cyber-light-gray p-3 border-b border-cyber-blue/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded border"></div>
              <span className="text-xs text-gray-300">可配送区域</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-400 rounded border opacity-50"></div>
              <span className="text-xs text-gray-300">不可配送区域</span>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            鼠标悬停查看详情，点击查看区域信息
          </div>
        </div>
      </div>

      {/* 地图容器 */}
      <div className="relative" style={{ height: '600px' }}>
        <MapContainer
          center={[56.1304, -106.3468]}
          zoom={4}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          
          {filteredData && (
            <GeoJSON
              data={filteredData}
              style={getFeatureStyle}
              onEachFeature={onEachFeature}
            />
          )}
        </MapContainer>

        {/* 加载指示器 */}
        {!filteredData && (
          <div className="absolute inset-0 flex items-center justify-center bg-cyber-gray/80 backdrop-blur-sm">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-blue mx-auto mb-4"></div>
              <div className="text-white">正在加载邮编区域数据...</div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PrecisePostalMap; 