import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { MapPin, Package, Truck } from 'lucide-react';
import { deliverablePostalCodes } from '../data/postalCodes';

// 修复Leaflet默认图标问题
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// 创建自定义图标
const createCustomIcon = (color = '#00f5ff') => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 10px rgba(0, 245, 255, 0.6);
        animation: pulse 2s infinite;
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const DeliveryMap = ({ selectedProvince, searchQuery }) => {
  const [filteredCodes, setFilteredCodes] = useState(deliverablePostalCodes);
  const [mapCenter, setMapCenter] = useState([56.1304, -106.3468]); // 加拿大中心
  const [zoomLevel, setZoomLevel] = useState(4);

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

    // 如果有过滤结果，调整地图视图
    if (filtered.length > 0) {
      if (filtered.length === 1) {
        setMapCenter([filtered[0].lat, filtered[0].lng]);
        setZoomLevel(12);
      } else {
        // 计算所有点的中心
        const avgLat = filtered.reduce((sum, code) => sum + code.lat, 0) / filtered.length;
        const avgLng = filtered.reduce((sum, code) => sum + code.lng, 0) / filtered.length;
        setMapCenter([avgLat, avgLng]);
        setZoomLevel(6);
      }
    } else {
      setMapCenter([56.1304, -106.3468]);
      setZoomLevel(4);
    }
  }, [selectedProvince, searchQuery]);

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
            <Package className="w-5 h-5 text-cyber-blue" />
            <span className="text-sm font-medium">可配送区域</span>
          </div>
          <div className="text-cyber-blue font-bold text-lg">
            {filteredCodes.length}
          </div>
        </div>
      </div>

      {/* 图例 */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-cyber-gray/90 backdrop-blur-sm rounded-lg p-4 border border-cyber-light-gray">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-cyber-blue rounded-full border-2 border-white shadow-cyber"></div>
            <span className="text-sm">配送点</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-cyber-green rounded-full bg-cyber-green/20"></div>
            <span className="text-sm">配送范围</span>
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
        
        {filteredCodes.map((code, index) => (
          <React.Fragment key={`${code.postalCode}-${index}`}>
            {/* 配送点标记 */}
            <Marker
              position={[code.lat, code.lng]}
              icon={createCustomIcon('#00f5ff')}
            >
              <Popup className="cyber-popup">
                <div className="p-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-4 h-4 text-cyber-blue" />
                    <span className="font-semibold text-cyber-blue">配送点信息</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div><strong>邮编:</strong> {code.postalCode}</div>
                    <div><strong>城市:</strong> {code.city}</div>
                    <div><strong>省份:</strong> {code.province}</div>
                    <div className="flex items-center gap-1 mt-2 text-cyber-green">
                      <Package className="w-3 h-3" />
                      <span className="text-xs">此区域可配送</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
            
            {/* 配送范围圆圈 */}
            <Circle
              center={[code.lat, code.lng]}
              radius={5000} // 5公里配送范围
              pathOptions={{
                color: '#10b981',
                fillColor: '#10b981',
                fillOpacity: 0.1,
                weight: 2,
                opacity: 0.6,
              }}
            />
          </React.Fragment>
        ))}
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

export default DeliveryMap;