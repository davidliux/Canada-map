import React, { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

// 地图控制器 - 处理搜索和筛选的地图联动
const MapController = ({ 
  mapRef, 
  searchQuery, 
  selectedFilters = [],
  onMapUpdate,
  fsaData = [],
  deliverableFSAs = []
}) => {
  const animationRef = useRef(null);
  
  // FSA坐标映射 - 实际项目中这些数据应该来自地理数据库
  const fsaCoordinates = {
    'M5V': { lat: 43.6426, lng: -79.3871, province: 'ON', city: 'Toronto' },
    'M5G': { lat: 43.6532, lng: -79.3832, province: 'ON', city: 'Toronto' },
    'V6B': { lat: 49.2827, lng: -123.1207, province: 'BC', city: 'Vancouver' },
    'H3B': { lat: 45.5017, lng: -73.5673, province: 'QC', city: 'Montreal' },
    // 更多FSA坐标...
  };

  // 省份中心坐标
  const provinceCoordinates = {
    'ON': { lat: 44.2619, lng: -78.2579, zoom: 6 },
    'QC': { lat: 46.8139, lng: -71.2081, zoom: 6 },
    'BC': { lat: 49.2827, lng: -123.1207, zoom: 6 },
    'AB': { lat: 53.9333, lng: -116.5765, zoom: 6 },
    'MB': { lat: 49.8951, lng: -97.1384, zoom: 6 },
    'SK': { lat: 50.4452, lng: -104.6189, zoom: 6 },
    'NS': { lat: 44.6820, lng: -63.7443, zoom: 7 },
    'NB': { lat: 46.5653, lng: -66.4619, zoom: 7 },
    'NL': { lat: 53.1355, lng: -57.6604, zoom: 6 },
    'PE': { lat: 46.5107, lng: -63.4168, zoom: 8 }
  };

  // 城市中心坐标
  const cityCoordinates = {
    'toronto': { lat: 43.6532, lng: -79.3832, zoom: 10 },
    'vancouver': { lat: 49.2827, lng: -123.1207, zoom: 10 },
    'montreal': { lat: 45.5017, lng: -73.5673, zoom: 10 },
    'calgary': { lat: 51.0447, lng: -114.0719, zoom: 10 },
    'ottawa': { lat: 45.4215, lng: -75.6972, zoom: 10 },
    'edmonton': { lat: 53.5461, lng: -113.4938, zoom: 10 }
  };

  // 平滑地图动画函数
  const animateMapTo = useCallback((targetLat, targetLng, targetZoom = 8, duration = 1000) => {
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    const startLat = map.getCenter().lat;
    const startLng = map.getCenter().lng;
    const startZoom = map.getZoom();
    
    const startTime = Date.now();
    
    // 清除之前的动画
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 使用缓入缓出动画函数
      const easeInOut = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const easedProgress = easeInOut(progress);
      
      const currentLat = startLat + (targetLat - startLat) * easedProgress;
      const currentLng = startLng + (targetLng - startLng) * easedProgress;
      const currentZoom = startZoom + (targetZoom - startZoom) * easedProgress;
      
      map.setView([currentLat, currentLng], currentZoom, { animate: false });
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // 动画完成回调
        if (onMapUpdate) {
          onMapUpdate({
            center: [currentLat, currentLng],
            zoom: currentZoom
          });
        }
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  }, [mapRef, onMapUpdate]);

  // 处理搜索联动
  const handleSearchUpdate = useCallback((query) => {
    if (!query || !mapRef.current) return;

    const searchTerm = query.trim().toUpperCase();
    
    // 1. 直接FSA码匹配
    const fsaMatch = fsaCoordinates[searchTerm];
    if (fsaMatch) {
      console.log(`🎯 找到FSA: ${searchTerm}，跳转到坐标:`, fsaMatch);
      animateMapTo(fsaMatch.lat, fsaMatch.lng, 12);
      return;
    }

    // 2. 邮编匹配 (取前3位作为FSA)
    if (searchTerm.length >= 3) {
      const fsaCode = searchTerm.substring(0, 3);
      const fsaMatch = fsaCoordinates[fsaCode];
      if (fsaMatch) {
        console.log(`🎯 通过邮编找到FSA: ${fsaCode}，跳转到坐标:`, fsaMatch);
        animateMapTo(fsaMatch.lat, fsaMatch.lng, 13);
        return;
      }
    }

    // 3. 城市名称匹配
    const cityKeys = Object.keys(cityCoordinates);
    const matchedCity = cityKeys.find(city => 
      city.toLowerCase().includes(query.toLowerCase()) ||
      cityCoordinates[city].name?.toLowerCase().includes(query.toLowerCase())
    );
    
    if (matchedCity) {
      const cityCoord = cityCoordinates[matchedCity];
      console.log(`🏙️ 找到城市: ${matchedCity}，跳转到坐标:`, cityCoord);
      animateMapTo(cityCoord.lat, cityCoord.lng, cityCoord.zoom);
      return;
    }

    // 4. 省份匹配
    const provinceKeys = Object.keys(provinceCoordinates);
    const matchedProvince = provinceKeys.find(province => 
      province === searchTerm ||
      provinceCoordinates[province].name?.toLowerCase().includes(query.toLowerCase())
    );
    
    if (matchedProvince) {
      const provCoord = provinceCoordinates[matchedProvince];
      console.log(`🗺️ 找到省份: ${matchedProvince}，跳转到坐标:`, provCoord);
      animateMapTo(provCoord.lat, provCoord.lng, provCoord.zoom);
      return;
    }

    console.log(`❓ 未找到匹配的位置: ${query}`);
  }, [animateMapTo, mapRef]);

  // 处理筛选联动
  const handleFiltersUpdate = useCallback((filters) => {
    if (!mapRef.current || !filters.length) return;

    const provinceFilters = filters.filter(f => f.startsWith('province:'));
    const cityFilters = filters.filter(f => f.startsWith('city:'));

    // 省份筛选优先
    if (provinceFilters.length > 0) {
      const provinceCode = provinceFilters[0].split(':')[1];
      const provCoord = provinceCoordinates[provinceCode];
      if (provCoord) {
        console.log(`🗺️ 筛选省份: ${provinceCode}，跳转到坐标:`, provCoord);
        animateMapTo(provCoord.lat, provCoord.lng, provCoord.zoom);
        return;
      }
    }

    // 城市筛选
    if (cityFilters.length > 0) {
      const cityCode = cityFilters[0].split(':')[1];
      const cityCoord = cityCoordinates[cityCode];
      if (cityCoord) {
        console.log(`🏙️ 筛选城市: ${cityCode}，跳转到坐标:`, cityCoord);
        animateMapTo(cityCoord.lat, cityCoord.lng, cityCoord.zoom);
        return;
      }
    }
  }, [animateMapTo, mapRef]);

  // 监听搜索变化
  useEffect(() => {
    if (searchQuery) {
      handleSearchUpdate(searchQuery);
    }
  }, [searchQuery, handleSearchUpdate]);

  // 监听筛选变化
  useEffect(() => {
    handleFiltersUpdate(selectedFilters);
  }, [selectedFilters, handleFiltersUpdate]);

  // 清理动画
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // 提供给外部使用的方法
  const mapControlMethods = {
    // 跳转到指定坐标
    flyTo: (lat, lng, zoom = 10) => {
      animateMapTo(lat, lng, zoom);
    },
    
    // 重置到加拿大全景
    resetView: () => {
      animateMapTo(56.1304, -106.3468, 4);
    },
    
    // 高亮特定FSA
    highlightFSA: (fsaCode) => {
      const coords = fsaCoordinates[fsaCode];
      if (coords) {
        animateMapTo(coords.lat, coords.lng, 12);
      }
    },

    // 批量显示FSA区域
    showFSARegion: (fsaCodes) => {
      if (!fsaCodes.length) return;
      
      // 计算所有FSA的边界框
      const validCoords = fsaCodes
        .map(code => fsaCoordinates[code])
        .filter(Boolean);
      
      if (validCoords.length === 0) return;
      
      const bounds = {
        north: Math.max(...validCoords.map(c => c.lat)),
        south: Math.min(...validCoords.map(c => c.lat)),
        east: Math.max(...validCoords.map(c => c.lng)),
        west: Math.min(...validCoords.map(c => c.lng))
      };
      
      // 计算中心点和适合的缩放级别
      const centerLat = (bounds.north + bounds.south) / 2;
      const centerLng = (bounds.east + bounds.west) / 2;
      
      // 根据边界大小估算缩放级别
      const latDiff = bounds.north - bounds.south;
      const lngDiff = bounds.east - bounds.west;
      const maxDiff = Math.max(latDiff, lngDiff);
      
      let zoom = 8;
      if (maxDiff > 10) zoom = 5;
      else if (maxDiff > 5) zoom = 6;
      else if (maxDiff > 2) zoom = 7;
      else if (maxDiff > 1) zoom = 8;
      else zoom = 10;
      
      animateMapTo(centerLat, centerLng, zoom);
    }
  };

  // 暴露控制方法给父组件
  useEffect(() => {
    if (onMapUpdate) {
      onMapUpdate(mapControlMethods);
    }
  }, [onMapUpdate]);

  return null; // 这是一个控制器组件，不渲染任何UI
};

export default MapController;