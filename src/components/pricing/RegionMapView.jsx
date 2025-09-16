/**
 * 区域地图视图组件
 * 
 * 提供交互式地图可视化功能，支持：
 * - FSA区域边界显示
 * - 区域高亮和选择
 * - 价格配置可视化
 * - 地图工具和控制
 * 
 * Tasks 22-25: 区域地图视图功能
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map as MapIcon,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  EyeOff,
  Settings,
  Info,
  MapPin,
  Palette,
  Filter,
  Download,
  Share2,
  Maximize2
} from 'lucide-react';

// Leaflet 地图相关导入
import { MapContainer, TileLayer, GeoJSON, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

import { cityStorageService } from '../../utils/storage/cityStorage.js';
import { getRegionStats, generateRegionColor } from '../../types/truckDelivery.js';

// 默认地图配置
const DEFAULT_MAP_CONFIG = {
  center: [56.1304, -106.3468], // 加拿大中心
  zoom: 4,
  minZoom: 3,
  maxZoom: 15,
  attributionControl: false
};

// 地图样式主题
const MAP_THEMES = {
  dark: {
    name: '暗色主题',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  light: {
    name: '亮色主题',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  satellite: {
    name: '卫星视图',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
  }
};

/**
 * 地图控制组件
 */
const MapControls = ({ onZoomIn, onZoomOut, onReset, theme, onThemeChange, layers, onLayerToggle }) => {
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  return (
    <div className="absolute top-4 right-4 z-[1000] space-y-2">
      {/* 缩放控制 */}
      <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-2">
        <div className="flex flex-col gap-1">
          <button
            onClick={onZoomIn}
            className="p-2 hover:bg-gray-700 rounded transition-colors text-white"
            title="放大"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={onZoomOut}
            className="p-2 hover:bg-gray-700 rounded transition-colors text-white"
            title="缩小"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={onReset}
            className="p-2 hover:bg-gray-700 rounded transition-colors text-white"
            title="重置视图"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 主题切换 */}
      <div className="relative">
        <button
          onClick={() => setShowThemeMenu(!showThemeMenu)}
          className="w-full p-3 bg-gray-800/90 backdrop-blur-sm border border-gray-700 
                   hover:bg-gray-700 rounded-lg transition-colors text-white"
          title="切换主题"
        >
          <Palette className="w-4 h-4 mx-auto" />
        </button>
        
        <AnimatePresence>
          {showThemeMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg"
            >
              {Object.entries(MAP_THEMES).map(([key, themeConfig]) => (
                <button
                  key={key}
                  onClick={() => {
                    onThemeChange(key);
                    setShowThemeMenu(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-700 first:rounded-t-lg 
                           last:rounded-b-lg transition-colors ${
                    theme === key ? 'bg-cyan-600 text-white' : 'text-gray-300'
                  }`}
                >
                  {themeConfig.name}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 图层控制 */}
      <div className="relative">
        <button
          onClick={() => setShowLayerMenu(!showLayerMenu)}
          className="w-full p-3 bg-gray-800/90 backdrop-blur-sm border border-gray-700 
                   hover:bg-gray-700 rounded-lg transition-colors text-white"
          title="图层控制"
        >
          <Layers className="w-4 h-4 mx-auto" />
        </button>
        
        <AnimatePresence>
          {showLayerMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-3"
            >
              <h4 className="text-sm font-medium text-white mb-3">显示图层</h4>
              <div className="space-y-2">
                {Object.entries(layers).map(([key, layer]) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={layer.visible}
                      onChange={() => onLayerToggle(key)}
                      className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded 
                               focus:ring-cyan-500 focus:ring-2"
                    />
                    <span className="text-sm text-gray-300">{layer.name}</span>
                    {layer.visible ? (
                      <Eye className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    )}
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/**
 * 地图事件处理组件
 */
const MapEventHandler = ({ onMapClick, onRegionClick }) => {
  const mapEvents = useMapEvents({
    click(e) {
      console.log('地图点击:', e.latlng);
      if (onMapClick) {
        onMapClick(e.latlng);
      }
    },
    zoomend() {
      console.log('缩放级别:', mapEvents.getZoom());
    },
    moveend() {
      console.log('地图中心:', mapEvents.getCenter());
    }
  });

  return null;
};

/**
 * 区域地图视图组件
 */
const RegionMapView = ({
  selectedCityId,
  selectedRegionIds = [],
  onRegionClick,
  onMapClick,
  showPriceInfo = true,
  showRegionBoundaries = true,
  highlightColor = '#00bcd4',
  className = ''
}) => {
  // 状态管理
  const [cityData, setCityData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapTheme, setMapTheme] = useState('dark');
  const [geoJsonData, setGeoJsonData] = useState(null);
  
  // 地图实例引用
  const mapRef = useRef();

  // 图层控制状态
  const [layers, setLayers] = useState({
    boundaries: { name: 'FSA边界', visible: true },
    regions: { name: '区域高亮', visible: true },
    pricing: { name: '价格信息', visible: showPriceInfo },
    labels: { name: '标签', visible: true }
  });

  // 地图配置
  const currentTheme = MAP_THEMES[mapTheme] || MAP_THEMES.dark;

  // 加载城市数据
  const loadCityData = useCallback(async (cityId) => {
    if (!cityId) {
      setCityData(null);
      setGeoJsonData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('加载城市地图数据:', cityId);
      const city = await cityStorageService.getCity(cityId);
      
      if (city) {
        setCityData(city);
        
        // 生成GeoJSON数据
        if (city.regions && city.regions.length > 0) {
          const features = city.regions.map(region => {
            const stats = getRegionStats(region);
            const displayColor = region.displayColor || 
              generateRegionColor(region.level, city.themeColor || '#2196F3', city.regions.length);

            return {
              type: 'Feature',
              properties: {
                id: region.id,
                name: region.name,
                level: region.level,
                fsaCount: stats.fsaCount,
                activePriceRanges: stats.activePriceRanges,
                displayColor: displayColor,
                isSelected: Array.isArray(selectedRegionIds) 
                  ? selectedRegionIds.includes(region.id)
                  : selectedRegionIds === region.id
              },
              geometry: {
                type: 'Polygon',
                coordinates: region.boundaries || [] // 假设区域有边界数据
              }
            };
          });

          setGeoJsonData({
            type: 'FeatureCollection',
            features
          });
        }
      } else {
        setError('城市数据加载失败');
      }
    } catch (err) {
      console.error('加载城市地图数据失败:', err);
      setError('加载地图数据失败，请重试');
      setCityData(null);
      setGeoJsonData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedRegionIds]);

  // 当选中城市变化时重新加载数据
  useEffect(() => {
    loadCityData(selectedCityId);
  }, [selectedCityId, loadCityData]);

  // GeoJSON样式函数
  const getGeoJSONStyle = useCallback((feature) => {
    const { isSelected, displayColor } = feature.properties;
    
    return {
      fillColor: displayColor,
      weight: isSelected ? 3 : 1,
      opacity: isSelected ? 1 : 0.7,
      color: isSelected ? highlightColor : '#ffffff',
      dashArray: isSelected ? '5, 5' : null,
      fillOpacity: layers.regions.visible ? (isSelected ? 0.8 : 0.5) : 0.2
    };
  }, [highlightColor, layers.regions.visible]);

  // 处理区域点击
  const handleGeoJSONClick = useCallback((feature, layer, e) => {
    const { id, name } = feature.properties;
    console.log('点击区域:', name, id);
    
    if (onRegionClick) {
      onRegionClick(id, feature.properties);
    }
  }, [onRegionClick]);

  // 处理区域悬停
  const handleGeoJSONHover = useCallback((feature, layer) => {
    const { name, fsaCount, activePriceRanges } = feature.properties;
    
    // 显示提示信息
    if (layer.getPopup()) {
      layer.unbindPopup();
    }
    
    if (layers.labels.visible) {
      layer.bindPopup(`
        <div class="bg-gray-800 text-white p-3 rounded-lg border border-gray-600">
          <h4 class="font-semibold text-cyan-400">${name}</h4>
          <div class="mt-2 space-y-1 text-sm">
            <div>FSA数量: <span class="text-purple-400">${fsaCount}</span></div>
            <div>价格配置: <span class="text-orange-400">${activePriceRanges}</span></div>
          </div>
        </div>
      `, {
        className: 'custom-popup'
      }).openPopup();
    }
  }, [layers.labels.visible]);

  // 地图控制函数
  const handleZoomIn = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  }, []);

  const handleResetView = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.setView(DEFAULT_MAP_CONFIG.center, DEFAULT_MAP_CONFIG.zoom);
    }
  }, []);

  const handleLayerToggle = useCallback((layerKey) => {
    setLayers(prev => ({
      ...prev,
      [layerKey]: {
        ...prev[layerKey],
        visible: !prev[layerKey].visible
      }
    }));
  }, []);

  return (
    <div className={`relative h-full bg-gray-900 rounded-xl overflow-hidden ${className}`}>
      {/* 地图容器 */}
      <div className="absolute inset-0">
        <MapContainer
          ref={mapRef}
          center={DEFAULT_MAP_CONFIG.center}
          zoom={DEFAULT_MAP_CONFIG.zoom}
          minZoom={DEFAULT_MAP_CONFIG.minZoom}
          maxZoom={DEFAULT_MAP_CONFIG.maxZoom}
          attributionControl={DEFAULT_MAP_CONFIG.attributionControl}
          className="w-full h-full"
          style={{ backgroundColor: '#1f2937' }}
        >
          {/* 底图图层 */}
          <TileLayer
            url={currentTheme.url}
            attribution={currentTheme.attribution}
            maxZoom={DEFAULT_MAP_CONFIG.maxZoom}
          />

          {/* 事件处理 */}
          <MapEventHandler 
            onMapClick={onMapClick}
            onRegionClick={onRegionClick}
          />

          {/* 区域边界图层 */}
          {geoJsonData && layers.boundaries.visible && (
            <GeoJSON
              key={`geojson-${selectedCityId}-${JSON.stringify(selectedRegionIds)}`}
              data={geoJsonData}
              style={getGeoJSONStyle}
              onEachFeature={(feature, layer) => {
                // 绑定点击事件
                layer.on('click', (e) => {
                  handleGeoJSONClick(feature, layer, e);
                });
                
                // 绑定悬停事件
                layer.on('mouseover', () => {
                  handleGeoJSONHover(feature, layer);
                });
                
                layer.on('mouseout', () => {
                  layer.closePopup();
                });
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* 地图控制面板 */}
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleResetView}
        theme={mapTheme}
        onThemeChange={setMapTheme}
        layers={layers}
        onLayerToggle={handleLayerToggle}
      />

      {/* 加载状态 */}
      {loading && (
        <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[1001]">
          <div className="bg-gray-800 rounded-lg p-6 flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-white">加载地图数据...</span>
          </div>
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div className="absolute top-4 left-4 right-4 bg-red-900/90 border border-red-700 rounded-lg p-4 z-[1001]">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-red-400">地图加载错误</h4>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={() => loadCityData(selectedCityId)}
              className="ml-auto px-3 py-1 bg-red-600 hover:bg-red-500 rounded 
                       text-white text-sm transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      )}

      {/* 地图信息面板 */}
      {cityData && !loading && (
        <div className="absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur-sm border border-gray-700 
                      rounded-lg p-4 max-w-sm z-[1000]">
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="w-4 h-4 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: cityData.themeColor }}
            />
            <div>
              <h4 className="font-semibold text-white">{cityData.name}</h4>
              <p className="text-gray-400 text-sm">{cityData.province}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">区域数量</span>
              <div className="text-cyan-400 font-semibold">{cityData.regions?.length || 0}</div>
            </div>
            <div>
              <span className="text-gray-400">选中区域</span>
              <div className="text-purple-400 font-semibold">
                {Array.isArray(selectedRegionIds) ? selectedRegionIds.length : (selectedRegionIds ? 1 : 0)}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 空状态 */}
      {!selectedCityId && !loading && (
        <div className="absolute inset-0 flex items-center justify-center z-[1000]">
          <div className="text-center">
            <MapIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">选择城市以显示地图</h3>
            <p className="text-gray-400">请先在左侧面板选择一个城市来查看其区域地图</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegionMapView;