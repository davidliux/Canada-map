import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { MapPin, Package, Truck, Shield } from 'lucide-react';
import { deliverablePostalCodes } from '../data/postalCodes';

// 修复Leaflet默认图标问题
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// 定义加拿大各省份和地区的大致边界区域
const getProvinceRegions = () => {
  return {
    'NL': { // 纽芬兰与拉布拉多
      name: '纽芬兰与拉布拉多',
      bounds: [[46.561, -67.767], [60.374, -52.648]],
      center: [53.467, -60.207],
      color: '#ff6b6b'
    },
    'NS': { // 新斯科舍
      name: '新斯科舍',
      bounds: [[43.374, -66.405], [47.037, -59.728]],
      center: [44.682, -63.744],
      color: '#4ecdc4'
    },
    'NB': { // 新不伦瑞克
      name: '新不伦瑞克',
      bounds: [[44.599, -69.058], [48.072, -63.777]],
      center: [46.498, -66.159],
      color: '#45b7d1'
    },
    'PE': { // 爱德华王子岛
      name: '爱德华王子岛',
      bounds: [[45.957, -64.421], [47.084, -61.954]],
      center: [46.510, -63.413],
      color: '#96ceb4'
    },
    'QC': { // 魁北克
      name: '魁北克',
      bounds: [[44.991, -79.763], [62.583, -57.103]],
      center: [52.939, -73.549],
      color: '#feca57'
    },
    'ON': { // 安大略
      name: '安大略',
      bounds: [[41.676, -95.156], [56.859, -74.320]],
      center: [50.000, -85.000],
      color: '#ff9ff3'
    },
    'MB': { // 马尼托巴
      name: '马尼托巴',
      bounds: [[48.998, -102.179], [60.000, -88.909]],
      center: [53.760, -98.813],
      color: '#54a0ff'
    },
    'SK': { // 萨斯喀彻温
      name: '萨斯喀彻温',
      bounds: [[49.000, -110.000], [60.000, -101.362]],
      center: [52.939, -106.451],
      color: '#5f27cd'
    },
    'AB': { // 阿尔伯塔
      name: '阿尔伯塔',
      bounds: [[49.000, -120.000], [60.000, -110.003]],
      center: [53.933, -116.576],
      color: '#00d2d3'
    },
    'BC': { // 不列颠哥伦比亚
      name: '不列颠哥伦比亚',
      bounds: [[48.308, -139.057], [60.000, -114.033]],
      center: [53.726, -127.647],
      color: '#ff6348'
    },
    'YT': { // 育空
      name: '育空',
      bounds: [[60.000, -141.000], [69.647, -123.742]],
      center: [64.068, -139.438],
      color: '#2ed573'
    },
    'NT': { // 西北地区
      name: '西北地区',
      bounds: [[60.000, -136.478], [78.741, -102.000]],
      center: [64.825, -124.845],
      color: '#a4b0be'
    },
    'NU': { // 努纳武特
      name: '努纳武特',
      bounds: [[60.000, -110.000], [83.110, -61.000]],
      center: [70.299, -83.107],
      color: '#778beb'
    }
  };
};

// 创建六边形区域用于表示可配送区域
const createHexagon = (center, radius = 50000) => {
  const points = [];
  const [lat, lng] = center;
  
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60) * Math.PI / 180;
    const dx = radius * Math.cos(angle) / 111320; // 转换为度
    const dy = radius * Math.sin(angle) / (111320 * Math.cos(lat * Math.PI / 180));
    points.push([lat + dy, lng + dx]);
  }
  
  return points;
};

// 根据邮编生成配送区域GeoJSON
const generateDeliveryRegions = (postalCodes) => {
  const regions = [];
  
  // 按省份分组邮编
  const provinceGroups = postalCodes.reduce((acc, code) => {
    if (!acc[code.province]) {
      acc[code.province] = [];
    }
    acc[code.province].push(code);
    return acc;
  }, {});

  const provinceRegions = getProvinceRegions();

  Object.entries(provinceGroups).forEach(([province, codes]) => {
    const provinceInfo = provinceRegions[province];
    if (!provinceInfo) return;

    // 为每个省份创建配送区域
    codes.forEach((code, index) => {
      const hexPoints = createHexagon([code.lat, code.lng], 30000);
      
      regions.push({
        type: "Feature",
        properties: {
          province: code.province,
          provinceName: provinceInfo.name,
          postalCode: code.postalCode,
          city: code.city,
          color: provinceInfo.color,
          count: codes.length
        },
        geometry: {
          type: "Polygon",
          coordinates: [hexPoints.map(point => [point[1], point[0]])] // GeoJSON要求[lng, lat]
        }
      });
    });

    // 为省份创建整体覆盖区域（较淡的背景）
    if (codes.length > 0) {
      const bounds = provinceInfo.bounds;
      regions.push({
        type: "Feature",
        properties: {
          province: province,
          provinceName: provinceInfo.name,
          type: 'province-background',
          color: provinceInfo.color,
          count: codes.length
        },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [bounds[0][1], bounds[0][0]], // 西南
            [bounds[1][1], bounds[0][0]], // 东南
            [bounds[1][1], bounds[1][0]], // 东北
            [bounds[0][1], bounds[1][0]], // 西北
            [bounds[0][1], bounds[0][0]]  // 闭合
          ]]
        }
      });
    }
  });

  return {
    type: "FeatureCollection",
    features: regions
  };
};

const DeliveryRegions = ({ selectedProvince, searchQuery }) => {
  const [filteredCodes, setFilteredCodes] = useState(deliverablePostalCodes);
  const [mapCenter, setMapCenter] = useState([56.1304, -106.3468]); // 加拿大中心
  const [zoomLevel, setZoomLevel] = useState(4);
  const [geoJsonData, setGeoJsonData] = useState(null);

  useEffect(() => {
    let filtered = deliverablePostalCodes;

    // 按省份过滤
    if (selectedProvince && selectedProvince !== 'all') {
      filtered = filtered.filter(code => code.province === selectedProvince);
    }

    // 按搜索查询过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(code => 
        code.postalCode.toLowerCase().includes(query) ||
        code.city.toLowerCase().includes(query) ||
        code.province.toLowerCase().includes(query)
      );
    }

    setFilteredCodes(filtered);

    // 生成GeoJSON数据
    const geoJson = generateDeliveryRegions(filtered);
    setGeoJsonData(geoJson);

    // 调整地图视图
    if (filtered.length > 0) {
      if (selectedProvince && selectedProvince !== 'all') {
        const provinceRegions = getProvinceRegions();
        const provinceInfo = provinceRegions[selectedProvince];
        if (provinceInfo) {
          setMapCenter(provinceInfo.center);
          setZoomLevel(6);
        }
      } else if (filtered.length === 1) {
        setMapCenter([filtered[0].lat, filtered[0].lng]);
        setZoomLevel(8);
      } else {
        // 计算所有点的中心
        const avgLat = filtered.reduce((sum, code) => sum + code.lat, 0) / filtered.length;
        const avgLng = filtered.reduce((sum, code) => sum + code.lng, 0) / filtered.length;
        setMapCenter([avgLat, avgLng]);
        setZoomLevel(5);
      }
    } else {
      setMapCenter([56.1304, -106.3468]);
      setZoomLevel(4);
    }
  }, [selectedProvince, searchQuery]);

  // 区域样式函数
  const geoJsonStyle = (feature) => {
    const isBackground = feature.properties.type === 'province-background';
    
    return {
      fillColor: feature.properties.color,
      weight: isBackground ? 1 : 2,
      opacity: isBackground ? 0.3 : 0.8,
      color: isBackground ? feature.properties.color : '#ffffff',
      dashArray: isBackground ? '5, 5' : '',
      fillOpacity: isBackground ? 0.1 : 0.6
    };
  };

  // 区域交互事件
  const onEachFeature = (feature, layer) => {
    if (feature.properties.type !== 'province-background') {
      layer.on({
        mouseover: (e) => {
          const layer = e.target;
          layer.setStyle({
            weight: 3,
            color: '#00f5ff',
            fillOpacity: 0.8
          });
        },
        mouseout: (e) => {
          if (geoJsonData) {
            e.target.setStyle(geoJsonStyle(feature));
          }
        }
      });

      // 添加弹出窗口
      layer.bindPopup(`
        <div class="p-3 bg-cyber-gray text-white rounded-lg border border-cyber-light-gray">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-3 h-3 rounded-full" style="background-color: ${feature.properties.color}"></div>
            <span class="font-semibold text-cyber-blue">配送区域</span>
          </div>
          <div class="space-y-1 text-sm">
            <div><strong>邮编:</strong> ${feature.properties.postalCode}</div>
            <div><strong>城市:</strong> ${feature.properties.city}</div>
            <div><strong>省份:</strong> ${feature.properties.provinceName}</div>
            <div class="flex items-center gap-1 mt-2 text-cyber-green">
              <div class="w-3 h-3 bg-cyber-green rounded-full"></div>
              <span class="text-xs">此区域可配送</span>
            </div>
          </div>
        </div>
      `);
    } else {
      // 省份背景区域的弹出窗口
      layer.bindPopup(`
        <div class="p-3 bg-cyber-gray text-white rounded-lg border border-cyber-light-gray">
          <div class="flex items-center gap-2 mb-2">
            <Shield class="w-4 h-4 text-cyber-blue" />
            <span class="font-semibold text-cyber-blue">省份覆盖</span>
          </div>
          <div class="space-y-1 text-sm">
            <div><strong>省份:</strong> ${feature.properties.provinceName}</div>
            <div><strong>配送点数量:</strong> ${feature.properties.count}</div>
            <div class="flex items-center gap-1 mt-2 text-cyber-green">
              <Package class="w-3 h-3" />
              <span class="text-xs">此省份有配送服务</span>
            </div>
          </div>
        </div>
      `);
    }
  };

  return (
    <motion.div 
      className="relative h-full w-full rounded-xl overflow-hidden border border-cyber-light-gray"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* 地图统计信息覆盖层 */}
      <div className="absolute top-4 left-4 z-[1000] bg-cyber-gray/90 backdrop-blur-sm rounded-lg p-4 border border-cyber-light-gray">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyber-blue" />
            <span className="text-sm font-medium">覆盖区域</span>
          </div>
          <div className="text-cyber-blue font-bold text-lg">
            {filteredCodes.length}
          </div>
        </div>
      </div>

      {/* 图例 */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-cyber-gray/90 backdrop-blur-sm rounded-lg p-4 border border-cyber-light-gray">
        <div className="space-y-2">
          <div className="text-sm font-semibold text-cyber-blue mb-2">配送区域图例</div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded border-2 border-white opacity-80"></div>
            <span className="text-xs">核心配送区</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-cyan-400 bg-cyan-400/20 rounded"></div>
            <span className="text-xs">省份覆盖范围</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-cyber-green bg-cyber-green/30 rounded"></div>
            <span className="text-xs">鼠标悬停高亮</span>
          </div>
        </div>
      </div>

      <MapContainer
        center={mapCenter}
        zoom={zoomLevel}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
        key={`${mapCenter[0]}-${mapCenter[1]}-${zoomLevel}`}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {geoJsonData && (
          <GeoJSON
            data={geoJsonData}
            style={geoJsonStyle}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>

      {/* 无结果提示 */}
      {filteredCodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-cyber-dark/50 backdrop-blur-sm z-[1000]">
          <motion.div 
            className="text-center p-8 bg-cyber-gray rounded-xl border border-cyber-light-gray"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <MapPin className="w-12 h-12 text-cyber-blue mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">未找到配送区域</h3>
            <p className="text-gray-400">请尝试调整搜索条件或选择其他省份</p>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default DeliveryRegions; 