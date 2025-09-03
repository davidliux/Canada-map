import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// 修复Leaflet默认图标问题
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const SimpleMap = () => {
  return (
    <div className="bg-cyber-gray rounded-xl p-4 border border-cyber-blue/30">
      <h3 className="text-white mb-4">测试地图 (简化版)</h3>
      <div style={{ height: '400px', width: '100%' }}>
        <MapContainer
          center={[49.2827, -123.1207]} // 温哥华
          zoom={10}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={19}
          />
          <Marker position={[49.2827, -123.1207]}>
            <Popup>
              温哥华市中心 <br /> 测试标记点
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
};

export default SimpleMap; 