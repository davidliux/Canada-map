import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 地图控制组件 - 增强版，支持FSA边界自动缩放
const MapController = ({ highlightedFSAs, cityView, mapData }) => {
  const map = useMap();

  // 城市选择改变时，缩放到城市的FSA边界
  useEffect(() => {
    if (!map || !highlightedFSAs || highlightedFSAs.length === 0) return;

    // 如果有地图数据，找到高亮的FSA并缩放到它们的边界
    if (mapData && mapData.features) {
      const highlightedFeatures = mapData.features.filter(feature =>
        highlightedFSAs.includes(feature.properties.CFSAUID)
      );

      if (highlightedFeatures.length > 0) {
        // 创建一个包含所有高亮FSA的图层组
        const group = new L.featureGroup();
        highlightedFeatures.forEach(feature => {
          const layer = L.geoJSON(feature);
          group.addLayer(layer);
        });

        // 获取边界并缩放
        try {
          const bounds = group.getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, {
              animate: true,
              duration: 1,
              padding: [30, 30],
              maxZoom: 11
            });
            console.log(`🎯 缩放到 ${highlightedFeatures.length} 个FSA的边界`);
          }
        } catch (error) {
          console.error('计算边界失败:', error);
          // 备用方案：使用城市中心点
          if (cityView && cityView.center_lat && cityView.center_lng) {
            map.setView([parseFloat(cityView.center_lat), parseFloat(cityView.center_lng)], 9, {
              animate: true,
              duration: 0.8
            });
          }
        }
      }
    } else if (cityView && cityView.center_lat && cityView.center_lng) {
      // 如果没有FSA数据，使用城市中心点
      map.setView([parseFloat(cityView.center_lat), parseFloat(cityView.center_lng)], 9, {
        animate: true,
        duration: 0.8
      });
    }
  }, [cityView, highlightedFSAs, map, mapData]);

  return null;
};

const TruckDeliveryMap = ({
  highlightedFSAs = [],
  cityView = null,
  cityRegions = [], // 城市区域数据，包含颜色信息
  allCities = [], // 所有城市数据，用于全局视图
  searchQuery = '',
  configuredFSAs = [], // 添加配置的FSA列表
  className = ''
}) => {
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 创建 FSA 到区域颜色的映射
  const fsaColorMap = useMemo(() => {
    const map = {};

    // 如果有选中城市的区域数据，使用区域的颜色
    if (cityRegions && cityRegions.length > 0) {
      cityRegions.forEach(region => {
        // 处理不同的字段名
        const fsaCodes = region.fsaCodes || region.fsa_codes || region.fsaList || [];
        const regionColor = region.color || region.displayColor || region.themeColor;

        if (fsaCodes && fsaCodes.length > 0 && regionColor) {
          fsaCodes.forEach(fsa => {
            map[fsa] = regionColor;
          });
        }
      });
    }
    // 如果没有选中城市（全局视图），使用所有城市的区域颜色
    else if (allCities && allCities.length > 0) {
      allCities.forEach(city => {
        // 每个城市的主题色
        const cityThemeColor = city.theme_color || city.themeColor;

        // 处理城市的区域
        if (city.regions && Array.isArray(city.regions)) {
          city.regions.forEach(region => {
            const fsaCodes = region.fsaCodes || region.fsa_codes || region.fsaList || [];
            // 优先使用区域颜色，其次使用城市主题色
            const regionColor = region.color || region.displayColor || cityThemeColor;

            if (fsaCodes && fsaCodes.length > 0 && regionColor) {
              fsaCodes.forEach(fsa => {
                map[fsa] = regionColor;
              });
            }
          });
        }
      });
    }

    // 如果还是没有颜色，使用城市主题色作为后备
    if (Object.keys(map).length === 0 && cityView?.themeColor) {
      highlightedFSAs.forEach(fsa => {
        map[fsa] = cityView.themeColor;
      });
    }

    return map;
  }, [cityRegions, cityView, highlightedFSAs, allCities]);

  // 加载FSA边界数据
  useEffect(() => {
    const loadFSAData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/data/canada_fsa_boundaries_complete.json');

        if (!response.ok) {
          throw new Error(`HTTP错误: ${response.status}`);
        }

        const fsaBoundariesData = await response.json();

        if (fsaBoundariesData && fsaBoundariesData.features) {
          setMapData(fsaBoundariesData);
        } else {
          throw new Error('数据格式错误或为空');
        }
      } catch (error) {
        console.error('加载FSA数据失败:', error);

        // 尝试加载备用数据
        try {
          const fallbackResponse = await fetch('/data/canada_fsa_boundaries.json');
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setMapData(fallbackData);
          }
        } catch (fallbackError) {
          console.error('备用数据加载失败:', fallbackError);
          setMapData({ type: 'FeatureCollection', features: [] });
        }
      } finally {
        setLoading(false);
      }
    };

    loadFSAData();
  }, []);

  // 根据FSA前缀判断省份
  const getProvinceFromFSA = (fsa) => {
    const firstChar = fsa.charAt(0);
    switch (firstChar) {
      case 'V': return 'BC';
      case 'T': return 'AB';
      case 'S': return 'SK';
      case 'R': return 'MB';
      case 'P': case 'N': case 'K': case 'L': case 'M': return 'ON';
      case 'H': case 'J': case 'G': return 'QC';
      case 'E': return 'NB';
      case 'B': return 'NS';
      case 'C': return 'PE';
      case 'A': return 'NL';
      default: return 'OTHER';
    }
  };

  // 定义FSA区域样式 - 使用配置的颜色
  const fsaStyle = (feature) => {
    const fsaCode = feature.properties.CFSAUID;
    const isConfigured = configuredFSAs.includes(fsaCode); // 检查是否是配置的FSA
    const isHighlighted = highlightedFSAs.includes(fsaCode);

    // 如果不是配置的FSA，不显示
    if (!isConfigured) {
      return {
        fillColor: 'transparent',
        fillOpacity: 0,
        color: 'transparent',
        weight: 0
      };
    }

    // 优先使用配置的颜色
    let baseColor = fsaColorMap[fsaCode];

    // 如果没有配置颜色，使用城市主题色
    if (!baseColor && cityView?.themeColor) {
      baseColor = cityView.themeColor;
    }

    // 如果还是没有颜色，根据省份使用默认颜色
    if (!baseColor) {
      const province = getProvinceFromFSA(fsaCode);
      const provinceColors = {
        'BC': '#10B981',
        'AB': '#F59E0B',
        'SK': '#8B5CF6',
        'MB': '#EC4899',
        'ON': '#3B82F6',
        'QC': '#06B6D4',
        'NB': '#84CC16',
        'NS': '#F97316',
        'PE': '#A855F7',
        'NL': '#EF4444',
        'OTHER': '#6B7280'
      };
      baseColor = provinceColors[province] || '#6B7280';
    }

    // 高亮的FSA - 使用配置的颜色，增强显示效果
    if (isHighlighted) {
      return {
        fillColor: baseColor,
        fillOpacity: 0.6, // 增强透明度
        color: baseColor,
        weight: 2
      };
    }

    // 普通状态 - 使用配置的颜色
    return {
      fillColor: baseColor,
      fillOpacity: 0.4, // 统一的基础透明度
      color: baseColor,
      weight: 0.5
    };
  };

  // 处理FSA点击事件
  const onEachFeature = (feature, layer) => {
    const fsaCode = feature.properties.CFSAUID;
    const isConfigured = configuredFSAs.includes(fsaCode);

    // 只为配置的FSA添加交互
    if (!isConfigured) {
      return;
    }

    const province = getProvinceFromFSA(fsaCode);

    layer.bindPopup(`
      <div class="bg-gray-800 text-white p-3 rounded">
        <h3 class="font-bold text-lg">${fsaCode}</h3>
        <p class="text-sm">省份: ${province}</p>
      </div>
    `);

    // 鼠标悬停效果 - 只改变边界样式，不改变透明度
    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        // 只改变边界样式，完全不触碰fillOpacity
        layer.setStyle({
          weight: 3,  // 加粗边界
          color: '#FFFFFF',  // 白色边界高亮
          dashArray: ''  // 实线
          // 不设置fillOpacity，让它保持原样
        });
        layer.bringToFront();  // 将层带到前面
      },
      mouseout: (e) => {
        const layer = e.target;
        const fsaCode = feature.properties.CFSAUID;
        const isHighlighted = highlightedFSAs.includes(fsaCode);

        // 只恢复边界样式，不改变透明度
        const baseColor = fsaColorMap[fsaCode] || '#6B7280';
        layer.setStyle({
          weight: isHighlighted ? 2 : 0.5,  // 恢复原始边界粗细
          color: baseColor,  // 恢复原始颜色
          dashArray: ''  // 实线
          // 不设置fillOpacity，让它保持原样
        });
      }
    });
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 ${className}`}>
        <div className="text-white">加载地图数据...</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <MapContainer
        center={[56.1304, -106.3468]}
        zoom={4}
        className="w-full h-full"
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {mapData && (
          <GeoJSON
            key={configuredFSAs.join(',')} // 添加key以强制重新渲染
            data={mapData}
            style={fsaStyle}
            onEachFeature={onEachFeature}
          />
        )}

        <MapController
          highlightedFSAs={highlightedFSAs}
          cityView={cityView}
          mapData={mapData}
        />
      </MapContainer>
    </div>
  );
};

export default TruckDeliveryMap;