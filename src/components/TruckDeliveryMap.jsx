import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { completeFSAData } from '../data/completeFSAData';
import { getRegionFSAGroups } from '../utils/unifiedStorage';
import { WAREHOUSES } from '../data/warehouses';

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
  isGroupFiltered = false, // 新增：是否在分组筛选模式
  cityView = null,
  cityRegions = [], // 城市区域数据，包含颜色信息
  allCities = [], // 所有城市数据，用于全局视图
  searchQuery = '',
  configuredFSAs = [], // 添加配置的FSA列表
  onFSAClick = null, // FSA点击回调
  className = ''
}) => {
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fsaPointData, setFsaPointData] = useState([]); // 没有边界的FSA点数据
  const [fsaGroupMap, setFsaGroupMap] = useState({}); // FSA到分组名称的映射

  // 如果没有配置的FSA，使用所有FSA（默认显示全部）
  const displayFSAs = useMemo(() => {
    if (configuredFSAs && configuredFSAs.length > 0) {
      return configuredFSAs;
    }
    // 如果没有配置，显示所有FSA
    return completeFSAData.map(item => item.fsa);
  }, [configuredFSAs]);

  // 加载所有区域的FSA分组信息
  useEffect(() => {
    const loadFSAGroups = async () => {
      const groupMap = {};

      // 加载所有城市区域的FSA分组
      const allRegions = [];
      if (cityRegions && cityRegions.length > 0) {
        allRegions.push(...cityRegions);
      } else if (allCities && allCities.length > 0) {
        allCities.forEach(city => {
          if (city.regions && Array.isArray(city.regions)) {
            allRegions.push(...city.regions);
          }
        });
      }

      // 为每个区域加载FSA分组
      for (const region of allRegions) {
        try {
          const groups = await getRegionFSAGroups(region.id);
          if (groups && groups.length > 0) {
            groups.forEach(group => {
              const groupName = group.groupName || group.name || '';
              const fsaCodes = group.fsaCodes || [];
              fsaCodes.forEach(fsa => {
                groupMap[fsa] = groupName;
              });
            });
          }
        } catch (err) {
          console.error(`加载区域 ${region.name} 的FSA分组失败:`, err);
        }
      }

      setFsaGroupMap(groupMap);
    };

    loadFSAGroups();
  }, [cityRegions, allCities]);

  // 创建 FSA 到区域颜色和深度的映射
  const fsaColorMap = useMemo(() => {
    const map = {};

    // Step 1: 始终先处理所有城市，为每个FSA分配其所属城市的颜色
    if (allCities && allCities.length > 0) {
      allCities.forEach(city => {
        // 每个城市的主题色
        const cityThemeColor = city.theme_color || city.themeColor || '#3B82F6';

        // 处理城市的区域
        if (city.regions && Array.isArray(city.regions)) {
          city.regions.forEach(region => {
            const fsaCodes = region.fsaCodes || region.fsa_codes || region.fsaList || [];

            // 获取区域编号
            const zoneName = region.name || region.zone_name || '';
            let zoneLevel = 1;

            // 修复：支持"1区"、"2区"等格式
            const zoneMatch = zoneName.match(/zone\s*(\d+)|区域\s*(\d+)|region\s*(\d+)|(\d+)\s*区/i);
            if (zoneMatch) {
              zoneLevel = parseInt(zoneMatch[1] || zoneMatch[2] || zoneMatch[3] || zoneMatch[4]) || 1;
            }

            // 基础透明度映射
            const baseOpacityMap = {
              1: 0.8,
              2: 0.65,
              3: 0.5,
              4: 0.35,
              5: 0.25
            };

            // 如果是选中的城市，稍微增加透明度以高亮显示
            // 同时比较ID和名称，以确保匹配成功
            const isSelectedCity = cityView && (
              (cityView.id && city.id && cityView.id === city.id) ||
              (cityView.name && city.name && cityView.name === city.name)
            );
            const opacityBoost = isSelectedCity ? 0.1 : 0;
            const opacity = Math.min((baseOpacityMap[zoneLevel] || 0.5) + opacityBoost, 0.9);

            if (fsaCodes && fsaCodes.length > 0) {
              fsaCodes.forEach(fsa => {
                map[fsa] = {
                  color: cityThemeColor,  // 保持原城市颜色
                  opacity: opacity,
                  zoneLevel: zoneLevel,
                  isSelected: isSelectedCity  // 标记是否为选中城市
                };
              });
            }
          });
        }
      });
    }

    // Step 2: 如果没有城市数据但有选中城市，使用备用方案
    if (Object.keys(map).length === 0 && cityView?.themeColor) {
      highlightedFSAs.forEach(fsa => {
        map[fsa] = {
          color: cityView.themeColor || cityView.theme_color || '#3B82F6',
          opacity: 0.6,
          zoneLevel: 1,
          isSelected: true
        };
      });
    }

    return map;
  }, [allCities, cityView, highlightedFSAs]);

  // 加载FSA边界数据和点数据
  useEffect(() => {
    const loadFSAData = async () => {
      try {
        setLoading(true);
        // 直接使用主要数据文件
        const response = await fetch('/data/canada_fsa_boundaries.json');

        if (!response.ok) {
          throw new Error(`HTTP错误: ${response.status}`);
        }

        const fsaBoundariesData = await response.json();

        if (fsaBoundariesData && fsaBoundariesData.features) {
          console.log(`✅ 成功加载 ${fsaBoundariesData.features.length} 个FSA边界数据`);
          setMapData(fsaBoundariesData);

          // 找出哪些FSA有边界数据
          const fsasWithBoundaries = new Set(
            fsaBoundariesData.features.map(f => f.properties.CFSAUID)
          );

          // 从completeFSAData中找出没有边界的FSA
          const pointFSAs = completeFSAData.filter(fsa => !fsasWithBoundaries.has(fsa.fsa));
          console.log(`📍 需要用点显示的FSA: ${pointFSAs.length} 个`);
          console.log(`🗺️ 总共显示FSA: ${fsasWithBoundaries.size + pointFSAs.length} 个`);

          setFsaPointData(pointFSAs);
        } else {
          throw new Error('数据格式错误或为空');
        }
      } catch (error) {
        console.error('❌ 加载FSA数据失败:', error);
        // 设置空数据以防止崩溃
        setMapData({ type: 'FeatureCollection', features: [] });
        // 如果边界数据加载失败，使用所有点数据
        setFsaPointData(completeFSAData);
        console.log(`📍 使用全部点数据: ${completeFSAData.length} 个FSA`);
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

  // 统一获取FSA的基础颜色和透明度
  const getFSABaseStyle = (fsaCode) => {
    const colorConfig = fsaColorMap[fsaCode];
    let baseColor = '#3B82F6'; // 默认蓝色
    let baseOpacity = 0.5; // 默认透明度

    if (colorConfig) {
      baseColor = colorConfig.color;
      baseOpacity = colorConfig.opacity;
    } else if (cityView?.themeColor || cityView?.theme_color) {
      // 如果没有配置，使用城市主题色
      baseColor = cityView.themeColor || cityView.theme_color || cityView.color || '#3B82F6';
    } else {
      // 根据省份使用默认颜色
      const province = getProvinceFromFSA(fsaCode);
      const provinceColors = {
        'BC': '#F59E0B',
        'AB': '#10B981',
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

    return { baseColor, baseOpacity };
  };

  // 定义FSA区域样式 - 使用配置的颜色和透明度
  const fsaStyle = (feature) => {
    const fsaCode = feature.properties.CFSAUID;
    const isConfigured = displayFSAs.includes(fsaCode); // 检查是否是配置的FSA
    const isHighlighted = highlightedFSAs.includes(fsaCode);
    const colorConfig = fsaColorMap[fsaCode];

    // 如果不是配置的FSA，不显示
    if (!isConfigured) {
      return {
        fillColor: 'transparent',
        fillOpacity: 0,
        color: 'transparent',
        weight: 0
      };
    }

    // 使用统一的函数获取颜色
    const { baseColor, baseOpacity } = getFSABaseStyle(fsaCode);

    // 高亮的FSA - 使用增强显示效果，但保持相对透明度差异
    if (isHighlighted) {
      return {
        fillColor: baseColor,
        fillOpacity: Math.min(baseOpacity + 0.2, 0.9), // 增强透明度但保持相对差异
        color: baseColor,
        weight: 2
      };
    }

    // 如果在分组筛选模式，未选中的FSA显示为很淡的灰色
    if (isGroupFiltered) {
      return {
        fillColor: '#6B7280',  // 灰色
        fillOpacity: 0.1,       // 很低的透明度，但仍可见
        color: '#6B7280',       // 灰色边框
        weight: 0.3,            // 细边框
        dashArray: '2,2'        // 虚线边框
      };
    }

    // 普通状态 - 保持原色边框，不使用白色边框
    return {
      fillColor: baseColor,
      fillOpacity: baseOpacity,
      color: baseColor,  // 保持原色边框
      weight: 0.5  // 统一边框粗细
    };
  };

  // 处理FSA点击事件
  const onEachFeature = (feature, layer) => {
    const fsaCode = feature.properties.CFSAUID;
    const isConfigured = displayFSAs.includes(fsaCode);

    // 只为配置的FSA添加交互
    if (!isConfigured) {
      return;
    }

    const province = getProvinceFromFSA(fsaCode);

    // 查找FSA所属的城市、区域和分组信息
    let cityName = '';
    let regionName = '';
    let groupName = fsaGroupMap[fsaCode] || ''; // 从映射中获取分组名称
    let regionColor = '#6B7280';

    // 定义省份代码列表，用于过滤
    const provinceCodes = ['BC', 'AB', 'SK', 'MB', 'ON', 'QC', 'NB', 'NS', 'PE', 'NL', 'YT', 'NT', 'NU'];

    // 如果有选中的城市，在该城市的区域中查找
    if (cityView && cityRegions.length > 0) {
      // 检查cityView.name是否为省份代码
      if (!provinceCodes.includes(cityView.name)) {
        cityName = cityView.name || '';
      }
      for (const region of cityRegions) {
        const fsaCodes = region.fsaCodes || region.fsa_codes || [];
        if (fsaCodes.includes(fsaCode)) {
          regionName = region.name || region.zone_name || '';
          regionColor = cityView.themeColor || cityView.theme_color || '#3B82F6';
          break;
        }
      }
    } else {
      // 在所有城市中查找
      for (const city of allCities) {
        if (city.regions && Array.isArray(city.regions)) {
          for (const region of city.regions) {
            const fsaCodes = region.fsaCodes || region.fsa_codes || [];
            if (fsaCodes.includes(fsaCode)) {
              // 检查city.name是否为省份代码
              if (!provinceCodes.includes(city.name)) {
                cityName = city.name || '';
              }
              regionName = region.name || region.zone_name || '';
              regionColor = city.theme_color || city.themeColor || '#3B82F6';
              break;
            }
          }
          if (regionName) break;
        }
      }
    }

    // 如果没有找到城市名称，或城市名称是省份代码，尝试从completeFSAData中获取
    if (!cityName || provinceCodes.includes(cityName)) {
      const fsaInfo = completeFSAData.find(item => item.fsa === fsaCode);
      if (fsaInfo && fsaInfo.city) {
        cityName = fsaInfo.city;
      }
    }

    // 为关闭按钮创建唯一ID
    const popupId = `popup-${fsaCode}-${Date.now()}`;

    // 创建更详细的弹窗内容
    const popupContent = `
      <div class="bg-gray-900 text-white rounded-lg shadow-xl overflow-hidden" style="min-width: 220px;">
        <!-- 头部区域 -->
        <div class="relative px-4 pt-3 pb-2" style="background: linear-gradient(135deg, ${regionColor}99 0%, ${regionColor}66 100%);">
          <button id="${popupId}" class="absolute top-2 right-2 text-white/70 hover:text-white transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <h3 class="font-bold text-2xl mb-1">${fsaCode}</h3>
          <div class="flex items-center gap-2 text-white/90 text-xs">
            <span class="px-2 py-0.5 bg-white/20 rounded-full">${province}</span>
          </div>
        </div>

        <!-- 内容区域 -->
        <div class="px-4 py-3 bg-gray-800 space-y-3">
          <div class="flex items-start gap-2">
            <svg class="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <div class="flex-1">
              <div class="text-xs text-gray-400">所属省份</div>
              <div class="text-sm font-medium">${province}</div>
            </div>
          </div>


          ${regionName ? `
          <div class="flex items-start gap-2">
            <svg class="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <div class="flex-1">
              <div class="text-xs text-gray-400">配送区域</div>
              <div class="text-sm font-medium">${regionName}</div>
            </div>
          </div>
          ` : ''}

          ${groupName ? `
          <div class="flex items-start gap-2">
            <svg class="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <div class="flex-1">
              <div class="text-xs text-gray-400">FSA分组</div>
              <div class="text-sm font-medium">${groupName}</div>
            </div>
          </div>
          ` : ''}

          <div class="flex items-start gap-2">
            <svg class="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div class="flex-1">
              <div class="text-xs text-gray-400">FSA编码</div>
              <div class="text-sm font-medium font-mono">${fsaCode}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    layer.bindPopup(popupContent, {
      className: 'custom-fsa-popup',
      closeButton: false,
      minWidth: 220,
      maxWidth: 280,
      offset: [0, -10]
    });

    // 移除了鼠标悬停效果，保持颜色稳定不变
    layer.on({
      popupopen: (e) => {
        // 当弹窗打开时，为关闭按钮添加点击事件
        setTimeout(() => {
          const closeButton = document.getElementById(popupId);
          if (closeButton) {
            closeButton.onclick = () => {
              layer.closePopup();
            };
          }
        }, 0);
      },
      click: (e) => {
        // 处理FSA点击事件
        if (onFSAClick) {
          const fsaCode = feature.properties.CFSAUID;
          // 查找该FSA属于哪个区域
          let regionId = null;
          for (const region of cityRegions) {
            const fsaCodes = region.fsaCodes || region.fsa_codes || [];
            if (fsaCodes.includes(fsaCode)) {
              regionId = region.id;
              break;
            }
          }
          onFSAClick(fsaCode, regionId);
        }
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
            key={displayFSAs.join(',').substring(0, 100)} // 添加key以强制重新渲染（限制长度）
            data={mapData}
            style={fsaStyle}
            onEachFeature={onEachFeature}
          />
        )}

        {/* 已移除旧的FSA圆点渲染 - 现在使用完整的多边形边界 */}

        {/* 添加仓库标记 */}
        {Object.values(WAREHOUSES).map(warehouse => {
          // 为黑暗系主题创建仓库图标
          const warehouseIcon = L.divIcon({
            className: 'warehouse-marker-dark',
            html: `
              <div style="
                position: relative;
                width: 50px;
                height: 60px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                cursor: pointer;
              ">
                <div style="
                  background: linear-gradient(135deg, ${warehouse.color}DD, ${warehouse.color}99);
                  border: 2px solid rgba(255, 255, 255, 0.2);
                  border-radius: 50%;
                  width: 40px;
                  height: 40px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5), 0 0 20px ${warehouse.color}66;
                  font-size: 20px;
                  backdrop-filter: blur(8px);
                ">
                  ${warehouse.icon}
                </div>
                <div style="
                  background: rgba(17, 24, 39, 0.95);
                  border: 1px solid rgba(255, 255, 255, 0.1);
                  border-radius: 4px;
                  padding: 2px 6px;
                  margin-top: 4px;
                  font-size: 11px;
                  font-weight: bold;
                  color: white;
                  white-space: nowrap;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
                ">
                  ${warehouse.shortName}
                </div>
              </div>
            `,
            iconSize: [50, 60],
            iconAnchor: [25, 60],
            popupAnchor: [0, -60]
          });

          return (
            <Marker
              key={warehouse.id}
              position={[warehouse.coordinates.lat, warehouse.coordinates.lng]}
              icon={warehouseIcon}
            >
              <Popup
                className="warehouse-popup-dark"
                closeButton={true}
              >
                <div style={{
                  background: 'linear-gradient(135deg, #1f2937, #111827)',
                  borderRadius: '8px',
                  padding: '16px',
                  minWidth: '260px',
                  color: 'white',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                  <div style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingBottom: '12px',
                    marginBottom: '12px'
                  }}>
                    <h3 style={{
                      margin: '0 0 4px 0',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: warehouse.color,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '24px' }}>{warehouse.icon}</span>
                      {warehouse.name}
                    </h3>
                    <p style={{
                      margin: '0',
                      fontSize: '12px',
                      color: 'rgba(156, 163, 175, 1)',
                      fontStyle: 'italic'
                    }}>
                      {warehouse.fullName}
                    </p>
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                    <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'rgba(156, 163, 175, 1)' }}>FSA区域:</span>
                      <span style={{
                        background: 'rgba(59, 130, 246, 0.2)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        border: '1px solid rgba(59, 130, 246, 0.3)'
                      }}>{warehouse.fsa}</span>
                    </div>
                    <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'rgba(156, 163, 175, 1)' }}>服务区域:</span>
                      <span>{warehouse.serviceAreas.join(', ')}</span>
                    </div>
                    <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'rgba(156, 163, 175, 1)' }}>时区:</span>
                      <span>{warehouse.timezone}</span>
                    </div>
                    <div style={{
                      marginTop: '12px',
                      padding: '8px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '4px',
                      borderLeft: `3px solid ${warehouse.color}`,
                      fontSize: '12px',
                      color: 'rgba(209, 213, 219, 1)'
                    }}>
                      <strong>描述:</strong> {warehouse.description}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

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