import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import { motion } from 'framer-motion';
import { MapPin, Info, Database, CheckCircle, Plus, Minus, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 可配送的FSA列表和地图数据
import { completeFSAData, getFSAGeoJSON } from '../data/canadaFSAData.js';
import { generateQuotationHTML, printQuotation } from '../utils/quotationGenerator.js';
import { getRegionFSAs, getRegionConfig } from '../utils/unifiedStorage';
import { dataUpdateNotifier } from '../utils/dataUpdateNotifier';
import { getRegionByFSA, DEFAULT_REGIONS } from '../data/regionManagement.js';
import { testRegionFSAs } from '../utils/testRegionData.js';
import ProvinceAnalyzer from './ProvinceAnalyzer';
import FixedQuotationPanel from './FixedQuotationPanel';
import DeliveryAreaStatus from './DeliveryAreaStatus';
import {
  filterMapDataByDeliveryArea,
  getAllDeliveryFSAs,
  getDeliveryAreaStats
} from '../utils/deliveryAreaFilter.js';

const AccurateFSAMap = ({ searchQuery, selectedProvince = 'all', completeFSAData, selectedRegions: propSelectedRegions = [], selectedFilters = [], highlightedFSAs = [], onFSAClick, onProvinceChange, onRegionChange }) => {
  const [filteredFSAs, setFilteredFSAs] = useState([]);
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);
  const [currentMapProvince, setCurrentMapProvince] = useState(selectedProvince);
  const [selectedFSAForQuotation, setSelectedFSAForQuotation] = useState(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false); // 跟踪用户交互状态
  const [selectedRegions, setSelectedRegions] = useState(propSelectedRegions); // 内部管理区域选择状态
  const [regionFSAsMap, setRegionFSAsMap] = useState(testRegionFSAs); // 使用testRegionFSAs作为初始值，确保颜色始终可见
  const [mapInstance, setMapInstance] = useState(null); // 存储地图实例
  const [visibleRegions, setVisibleRegions] = useState([1, 2, 3, 4, 5]); // 可见的快速筛选区域
  const [showRegionInput, setShowRegionInput] = useState(false); // 是否显示添加区域输入框
  const [newRegionNumber, setNewRegionNumber] = useState(''); // 新区域编号
  const [regionColors, setRegionColors] = useState({}); // 存储区域颜色配置

  // 同步外部props的selectedRegions变化
  useEffect(() => {
    setSelectedRegions(propSelectedRegions);
  }, [propSelectedRegions]);

  // 加载所有区域的FSA映射数据
  useEffect(() => {
    const loadRegionFSAsMap = async () => {
      const map = {};
      let hasDbData = false;

      // 加载所有可能的区域（1-8）
      for (let i = 1; i <= 8; i++) {
        try {
          const fsas = await getRegionFSAs(i.toString());
          if (fsas && fsas.length > 0) {
            map[i.toString()] = fsas;
            hasDbData = true;
          }
        } catch (error) {
          // 静默处理错误，因为某些区域可能还未配置
          console.log(`区域${i}暂无数据库数据`);
        }
      }

      // 额外加载当前选中的区域（可能是UUID格式的卡车配送区域）
      const colors = {};
      for (const regionId of selectedRegions) {
        if (!map[regionId]) { // 如果还没加载这个区域
          try {
            const fsas = await getRegionFSAs(regionId);
            if (fsas && fsas.length > 0) {
              map[regionId] = fsas;
              hasDbData = true;
              console.log(`📦 加载区域 ${regionId} FSA数据:`, fsas.length, '个');

              // 同时获取区域配置中的颜色
              try {
                const config = await getRegionConfig(regionId);
                if (config) {
                  colors[regionId] = config.displayColor || config.color || '#3B82F6';
                  console.log(`🎨 区域 ${regionId} 颜色:`, colors[regionId]);
                }
              } catch (colorError) {
                colors[regionId] = '#3B82F6'; // 默认蓝色
              }
            }
          } catch (error) {
            console.log(`区域 ${regionId} 暂无数据库数据`);
          }
        }
      }

      // 更新区域颜色状态
      if (Object.keys(colors).length > 0) {
        setRegionColors(prev => ({ ...prev, ...colors }));
      }

      // 如果数据库有数据，合并到testRegionFSAs；否则继续使用testRegionFSAs
      if (hasDbData) {
        // 合并数据库数据和默认数据（数据库优先）
        const mergedMap = { ...testRegionFSAs, ...map };
        setRegionFSAsMap(mergedMap);
        console.log('📊 使用合并的FSA映射（数据库+默认）:', Object.keys(mergedMap).length, '个区域有数据');
      } else {
        // 保持使用testRegionFSAs
        console.log('📊 继续使用默认FSA映射（testRegionFSAs）');
      }
    };
    loadRegionFSAsMap();
  }, [visibleRegions, selectedRegions]); // 当可见区域或选中区域变化时重新加载

  // 当内部selectedRegions变化时，通知父组件
  useEffect(() => {
    if (onRegionChange && selectedRegions !== propSelectedRegions) {
      onRegionChange(selectedRegions);
    }
  }, [selectedRegions]);

  // 区域选择变化时聚焦地图
  useEffect(() => {
    if (!mapInstance || !mapData) {
      console.log('⚠️ 地图实例或数据未准备好', { mapInstance: !!mapInstance, mapData: !!mapData });
      return;
    }

    // 确保地图容器已经初始化
    if (!mapInstance._container) {
      console.log('⚠️ 地图容器未初始化');
      return;
    }

    // 使用延迟确保DOM完全准备好，并处理异步操作
    const timeoutId = setTimeout(async () => {
      try {
        if (selectedRegions.length > 0) {
          console.log('🎯 区域选择触发自动缩放，选中区域:', selectedRegions);
          
          // 获取选中区域的所有FSA
          const regionFSAs = [];
          const provinceCount = {}; // 统计每个省份的FSA数量
          
          // 使用 for...of 循环处理异步操作
          for (const regionId of selectedRegions) {
            const config = await getRegionConfig(regionId);
            console.log(`🔍 检查区域 ${regionId} 配置:`, config);
            
            // 直接使用FSA代码
            if (config?.fsaCodes && config.fsaCodes.length > 0) {
              regionFSAs.push(...config.fsaCodes);
              console.log(`✅ 区域 ${regionId} 包含 ${config.fsaCodes.length} 个FSA:`, config.fsaCodes);
              
              // 统计每个省份的FSA数量
              config.fsaCodes.forEach(fsa => {
                const province = getProvinceFromFSA(fsa);
                provinceCount[province] = (provinceCount[province] || 0) + 1;
              });
            } else if (config?.fsa && config.fsa.length > 0) {
              // 向后兼容：如果有旧的fsa字段，使用它
              regionFSAs.push(...config.fsa);
              console.log(`✅ 区域 ${regionId} 包含 ${config.fsa.length} 个FSA (旧格式):`, config.fsa);
              
              config.fsa.forEach(fsa => {
                const province = getProvinceFromFSA(fsa);
                provinceCount[province] = (provinceCount[province] || 0) + 1;
              });
            } else {
              console.log(`⚠️ 区域 ${regionId} 没有FSA数据`);
            }
          }
          
          console.log('📍 区域FSA列表:', regionFSAs);
          console.log('📊 省份分布:', provinceCount);
          
          // 找出FSA最多的省份
          let primaryProvince = null;
          let maxCount = 0;
          Object.entries(provinceCount).forEach(([province, count]) => {
            if (count > maxCount) {
              maxCount = count;
              primaryProvince = province;
            }
          });
          
          // 聚焦到主要省份的FSA
          if (regionFSAs.length > 0 && primaryProvince) {
            console.log(`🎯 聚焦到主要省份 ${primaryProvince} 的FSA`);
            console.log(`   - 区域总FSA数: ${regionFSAs.length}`);
            console.log(`   - ${primaryProvince}省FSA数: ${provinceCount[primaryProvince] || 0}`);
            
            // 只筛选出属于主要省份的FSA
            const primaryProvinceFSAs = regionFSAs.filter(fsa => {
              const province = getProvinceFromFSA(fsa);
              return province === primaryProvince;
            });
            
            console.log(`📍 主要省份FSA列表: ${primaryProvinceFSAs.length}个`, primaryProvinceFSAs);
            console.log('🗺️ 地图数据中的总要素数量:', mapData.features?.length || 0);
            
            // 只筛选出主要省份的FSA features
            const regionFeatures = mapData.features?.filter(feature => {
              const fsaCode = feature.properties.CFSAUID;
              const isMatch = primaryProvinceFSAs.includes(fsaCode);
              if (isMatch && primaryProvinceFSAs.length <= 20) {  // 只有FSA少于20个时才打印
                console.log(`  ✓ 匹配FSA: ${fsaCode}`);
              }
              return isMatch;  // 只显示主要省份的FSA
            }) || [];
            
            console.log(`🗺️ 主要省份FSA要素数量: ${regionFeatures.length}`);
            if (regionFeatures.length === 0 && primaryProvinceFSAs.length > 0) {
              console.log(`❗ 警告: ${primaryProvince}省有FSA但地图数据中找不到匹配的要素`);
              console.log('   主要省份FSA:', primaryProvinceFSAs);
              console.log('   地图数据前5个FSA:', mapData.features?.slice(0, 5).map(f => f.properties.CFSAUID));
            }
            
            if (regionFeatures.length > 0) {
              // 创建包含区域FSA的图层组
              const group = new L.featureGroup();
              regionFeatures.forEach(feature => {
                const layer = L.geoJSON(feature);
                group.addLayer(layer);
              });
              
              // 聚焦到区域FSA块的边界
              if (group.getLayers().length > 0) {
                const bounds = group.getBounds();
                console.log('📐 计算的区域边界:', bounds);
                
                // 检查bounds是否有效
                if (bounds.isValid()) {
                  // 统一使用高缩放级别，不再根据FSA数量限制 - 直接达到省份级别的详细效果
                  let zoomLevel = 11; // 统一使用高缩放级别，与省份点击效果一致
                  let paddingValue = [5, 5]; // 使用最小边距以获得最大填充效果
                  
                  if (mapInstance && mapInstance.fitBounds) {
                    mapInstance.fitBounds(bounds, { 
                      animate: true,
                      duration: 0.8,
                      padding: paddingValue,
                      maxZoom: zoomLevel
                    });
                  }
                  
                  console.log(`✅ 区域选择自动缩放完成 - 使用省份级别详细效果`);
                  console.log(`   - ${primaryProvince}省FSA数量: ${regionFeatures.length}`);
                  console.log(`   - 缩放级别: ${zoomLevel} (省份级别)`);
                  console.log(`   - 边距: ${paddingValue} (最小边距以最大化填充)`);
                } else {
                  console.log('⚠️ 计算的边界无效');
                }
              }
            } else {
              console.log('⚠️ 区域没有匹配的FSA要素');
            }
          } else {
            console.log('⚠️ 区域没有FSA数据');
          }
        } else if (selectedRegions.length === 0) {
          // 没有选中区域时，恢复到加拿大全景
          console.log('🌍 清除选择，恢复到加拿大全景');
          // 使用标准加拿大全景视图，与初始状态保持一致
          if (mapInstance && mapInstance.setView && mapInstance._container) {
            try {
              mapInstance.setView([56.1304, -106.3468], 4, { animate: true, duration: 0.8 });
              console.log('✅ 已恢复到加拿大全景 - 中心点: [56.1304, -106.3468], 缩放级别: 4');
            } catch (e) {
              console.warn('地图视图设置失败，尝试使用flyTo:', e);
              if (mapInstance.flyTo) {
                mapInstance.flyTo([56.1304, -106.3468], 4, { duration: 0.8 });
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ 地图操作出错:', error);
      }
    }, 200); // 200ms延迟确保DOM准备好

    return () => clearTimeout(timeoutId);
  }, [selectedRegions, mapData, mapInstance]);

  // 设置全局函数供弹窗使用
  useEffect(() => {
    window.openFSAManagement = (fsaCode, province, region) => {
      if (onFSAClick) {
        onFSAClick({
          fsaCode,
          province,
          region
        });
      }
    };

    window.printQuotation = (fsaCode) => {
      printQuotation(fsaCode);
    };

    // 添加全局搜索触发函数
    window.triggerMapSearch = (query) => {
      if (!query || !mapInstance || !mapData) return;
      
      const searchTerm = query.trim().toUpperCase();
      console.log('🔍 触发地图搜索:', searchTerm);
      
      // 查找匹配的FSA
      const matchingFeature = mapData.features?.find(feature => {
        const fsaCode = feature.properties?.CFSAUID;
        return fsaCode === searchTerm || (searchTerm.length >= 3 && fsaCode === searchTerm.substring(0, 3));
      });
      
      if (matchingFeature) {
        console.log('✅ 找到匹配的FSA:', matchingFeature.properties.CFSAUID);
        
        // 创建该FSA的边界
        const layer = L.geoJSON(matchingFeature);
        const bounds = layer.getBounds();
        
        // 聚焦到该FSA
        if (bounds.isValid() && mapInstance.fitBounds) {
          mapInstance.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 12,
            animate: true
          });
        }
      } else {
        console.log('❌ 未找到匹配的FSA:', searchTerm);
      }
    };

    return () => {
      delete window.openFSAManagement;
      delete window.printQuotation;
      delete window.triggerMapSearch;
    };
  }, [onFSAClick, mapInstance, mapData]);


  // 监听数据更新通知
  useEffect(() => {
    const unsubscribe = dataUpdateNotifier.subscribe((updateInfo) => {
      console.log('🗺️ AccurateFSAMap收到数据更新通知:', updateInfo);

      // 如果是邮编更新或价格配置更新，重新加载地图数据
      if (updateInfo.type === 'regionUpdate' &&
          (updateInfo.updateType === 'postalCodes' || updateInfo.updateType === 'pricing')) {
        console.log('🔄 区域配置更新，重新加载地图数据');

        // 重新加载地图数据以应用新的配送区域筛选
        loadFSAData();
      }

      // 如果是全局刷新，重新加载所有数据
      if (updateInfo.type === 'globalRefresh') {
        console.log('🔄 全局数据刷新，重新加载地图数据');
        loadFSAData();
      }
    });

    return unsubscribe;
  }, [selectedRegions]);

  useEffect(() => {
    // 使用新的统一FSA数据接口
    const loadFSAData = async () => {
      try {
        console.log('🚀 开始加载FSA边界数据...');
        setLoading(true);

        // 直接使用导入的getFSAGeoJSON函数获取数据
        const fsaBoundariesData = getFSAGeoJSON();

        console.log('✅ FSA数据加载成功:', {
          features: fsaBoundariesData.features?.length || 0,
          type: fsaBoundariesData.type
        });

        if (fsaBoundariesData && fsaBoundariesData.features) {
          // 根据选中的区域进行过滤
          const processed = await filterMapDataByDeliveryArea(fsaBoundariesData, selectedRegions);

          console.log('🎯 配送区域筛选完成:', processed.features.length, '个FSA区域');
          console.log('📊 筛选统计:', processed.metadata);

          // 获取配送区域统计信息
          const deliveryStats = await getDeliveryAreaStats();
          console.log('📈 配送区域统计:', deliveryStats);

          setMapData(processed);
        } else {
          throw new Error('数据格式错误或为空');
        }
      } catch (error) {
        console.error('❌ 加载FSA数据失败:', error);
        // 设置空数据作为fallback
        setMapData({ type: 'FeatureCollection', features: [] });
      } finally {
        setLoading(false);
      }
    };

    // 不再需要检查currentcompleteFSAData，因为数据直接从模块导入
    loadFSAData();
  }, [selectedRegions]);

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

  // 处理省份切换 - 智能地图导航
  const handleProvinceSwitch = (province) => {
    console.log('🗺️ 智能地图导航 - 切换到省份:', province);
    setCurrentMapProvince(province);

    // 通知父组件更新省份筛选
    if (onProvinceChange) {
      onProvinceChange(province);
    }

    // 直接进行地图缩放到省份
    if (mapInstance && mapInstance._container && mapData) {
      try {
        // 筛选出该省份的所有FSA
        const provinceFSAs = mapData.features?.filter(feature => {
          const fsaCode = feature.properties.CFSAUID;
          const fsaProvince = getProvinceFromFSA(fsaCode);
          return fsaProvince === province;
        }) || [];

        if (provinceFSAs.length > 0) {
          console.log(`🎯 智能导航: 找到${provinceFSAs.length}个${province}省FSA块`);
          
          // 创建包含所有FSA的图层组
          const group = new L.featureGroup();
          provinceFSAs.forEach(feature => {
            const layer = L.geoJSON(feature);
            group.addLayer(layer);
          });
          
          // 聚焦到所有FSA块的边界
          if (group.getLayers().length > 0) {
            try {
              const bounds = group.getBounds();
              if (bounds.isValid()) {
                // 确保地图实例处于正确状态
                setTimeout(() => {
                  if (mapInstance && mapInstance._container) {
                    mapInstance.fitBounds(bounds, { 
                      animate: true,
                      duration: 0.8,
                      padding: [10, 10], // 减少边距，让FSA占据更多屏幕空间
                      maxZoom: 10 // 提高最大缩放级别，让FSA填充更满屏幕
                    });
                    console.log('✅ 智能导航: 地图聚焦到省份FSA边界完成 - 使用更大缩放级别');
                  }
                }, 100);
              }
            } catch (e) {
              console.error('智能导航边界计算错误:', e);
            }
          }
        } else {
          // 如果没有找到FSA，使用预设的省份中心点
          const bounds = getProvinceBounds(province);
          if (bounds && mapInstance && mapInstance._container) {
            setTimeout(() => {
              if (mapInstance && mapInstance._container) {
                mapInstance.setView(bounds.center, bounds.zoom, { 
                  animate: true, 
                  duration: 0.8 
                });
                console.log('✅ 智能导航: 地图聚焦到省份中心完成');
              }
            }, 100);
          }
        }
      } catch (error) {
        console.error('❌ 智能导航出错:', error);
        // 降级到预设位置
        const bounds = getProvinceBounds(province);
        if (bounds && mapInstance && mapInstance._container) {
          setTimeout(() => {
            if (mapInstance && mapInstance._container) {
              mapInstance.setView(bounds.center, bounds.zoom, { 
                animate: true, 
                duration: 0.8 
              });
            }
          }, 100);
        }
      }
    }
  };

  // 获取省份的地理中心点和缩放级别 - 增强聚焦力度
  const getProvinceBounds = (province) => {
    const bounds = {
      'BC': { center: [53.7267, -127.6476], zoom: 6 },
      'AB': { center: [53.9333, -116.5765], zoom: 6 },
      'SK': { center: [52.9399, -106.4509], zoom: 6 },
      'MB': { center: [53.7609, -98.8139], zoom: 6 },
      'ON': { center: [51.2538, -85.3232], zoom: 5 },
      'QC': { center: [53.9218, -72.7441], zoom: 5 },
      'NB': { center: [46.5653, -66.4619], zoom: 7 },
      'NS': { center: [44.6820, -63.7443], zoom: 7 },
      'PE': { center: [46.5107, -63.4168], zoom: 8 },
      'NL': { center: [53.1355, -57.6604], zoom: 6 },
      'all': { center: [56.1304, -106.3468], zoom: 4 } // 加拿大全景视图，与取消选择效果一致
    };
    return bounds[province] || bounds['all'];
  };

  // 地图实例获取组件
  const MapInstanceSetter = () => {
    const map = useMap();
    
    useEffect(() => {
      if (map) {
        let resizeObserver = null;
        
        // 等待地图完全初始化
        map.whenReady(() => {
          setMapInstance(map);
          console.log('✅ 地图实例已设置并准备就绪');
          
          // 监听容器大小变化并刷新地图
          resizeObserver = new ResizeObserver(() => {
            // 延迟一点以确保容器动画完成
            setTimeout(() => {
              map.invalidateSize();
              console.log('📐 地图大小已刷新');
            }, 350);
          });
          
          if (map._container && map._container.parentElement) {
            resizeObserver.observe(map._container.parentElement);
          }
        });
        
        // 清理函数
        return () => {
          if (resizeObserver) {
            resizeObserver.disconnect();
          }
        };
      }
    }, [map]);
    
    return null;
  };

  // 简化的地图控制组件
  const MapController = ({ selectedProvince, filteredData }) => {
    const map = useMap();
    const activeOperationRef = useRef(null);

    // 搜索联动 - 最高优先级，但如果有筛选器则跳过
    useEffect(() => {
      if (!map || !searchQuery || !searchQuery.trim()) return;
      // 如果有筛选器，让筛选器优先
      if (selectedFilters && selectedFilters.length > 0) return;
      
      const query = searchQuery.trim().toUpperCase();
      console.log('🔍 搜索联动:', query);
      
      // 清除其他操作的延迟执行
      if (activeOperationRef.current) {
        clearTimeout(activeOperationRef.current);
        activeOperationRef.current = null;
      }
      
      // FSA坐标映射
      const fsaCoordinates = {
        'M5V': { lat: 43.6426, lng: -79.3871 },
        'M5G': { lat: 43.6532, lng: -79.3832 },
        'V6B': { lat: 49.2827, lng: -123.1207 },
        'H3B': { lat: 45.5017, lng: -73.5673 },
        'T2P': { lat: 51.0447, lng: -114.0719 },
        'K1A': { lat: 45.4215, lng: -75.6972 },
      };
      
      // 立即执行搜索操作
      if (fsaCoordinates[query]) {
        const coords = fsaCoordinates[query];
        console.log('🎯 精确FSA定位:', query, coords);
        if (map && map.setView) {
          map.setView([coords.lat, coords.lng], 12, { animate: true });
        }
      } else if (query.length >= 3 && filteredData) {
        const matchingFeatures = filteredData.features?.filter(feature => 
          feature.properties.CFSAUID?.includes(query)
        ) || [];
        
        if (matchingFeatures.length > 0) {
          console.log(`🎯 模糊匹配到${matchingFeatures.length}个FSA区域`);
          
          const group = new L.featureGroup();
          matchingFeatures.forEach(feature => {
            const layer = L.geoJSON(feature);
            group.addLayer(layer);
          });
          
          if (group.getLayers().length > 0 && map && map.fitBounds) {
            map.fitBounds(group.getBounds(), { 
              padding: [10, 10], // 减少边距以获得更大填充
              maxZoom: 12 // 提高最大缩放级别
            });
          }
        }
      }
    }, [map, searchQuery, filteredData, selectedFilters]);

    // 筛选器联动 - 第二优先级，聚焦于FSA块而不是省份中心
    useEffect(() => {
      if (!map || !selectedFilters || selectedFilters.length === 0 || !filteredData) return;
      
      console.log('🎯 筛选器联动:', selectedFilters);
      
      // 清除之前的延迟操作
      if (activeOperationRef.current) {
        clearTimeout(activeOperationRef.current);
        activeOperationRef.current = null;
      }
      
      activeOperationRef.current = setTimeout(() => {
        const provinceFilters = selectedFilters.filter(f => f.startsWith('province:'));
        if (provinceFilters.length === 1) {
          const provinceCode = provinceFilters[0].split(':')[1];
          console.log('🌍 筛选器聚焦到省份FSA块:', provinceCode);
          
          // 筛选出该省份的所有FSA features
          const provinceFSAs = filteredData.features?.filter(feature => {
            const fsaCode = feature.properties.CFSAUID;
            const fsaProvince = getProvinceFromFSA(fsaCode);
            return fsaProvince === provinceCode;
          }) || [];
          
          if (provinceFSAs.length > 0) {
            console.log(`🎯 找到${provinceFSAs.length}个${provinceCode}省FSA块，聚焦到边界`);
            
            // 创建包含所有该省份FSA的图层组
            const group = new L.featureGroup();
            provinceFSAs.forEach(feature => {
              const layer = L.geoJSON(feature);
              group.addLayer(layer);
            });
            
            // 聚焦到所有FSA块的边界
            if (group.getLayers().length > 0) {
              map.fitBounds(group.getBounds(), { 
                animate: true,
                duration: 1,
                padding: [10, 10], // 减少边距以获得更大填充
                maxZoom: 11 // 提高最大缩放级别让FSA填充满屏幕
              });
            }
          } else {
            // 如果没有找到FSA，回退到省份中心
            const bounds = getProvinceBounds(provinceCode);
            if (bounds) {
              map.setView(bounds.center, bounds.zoom, { animate: true, duration: 1 });
            }
          }
        } else {
          // 如果没有省份筛选或多个省份筛选，回到加拿大全景
          console.log('🌍 筛选器回到加拿大全景');
          map.setView([56.1304, -106.3468], 4, { animate: true, duration: 1 });
        }
        activeOperationRef.current = null;
      }, 100);
    }, [map, selectedFilters, filteredData]);

    // 省份选择联动 - 最低优先级
    useEffect(() => {
      if (!map || !filteredData || filteredData.features.length === 0) return;
      if (searchQuery && searchQuery.trim()) return; // 有搜索查询时跳过
      if (selectedFilters && selectedFilters.length > 0) return; // 有筛选器时跳过
      if (isUserInteracting) return; // 用户正在交互时跳过
      
      const targetProvince = currentMapProvince || selectedProvince;
      console.log('🌍 省份联动:', targetProvince, '用户交互状态:', isUserInteracting);
      
      // 清除之前的延迟操作
      if (activeOperationRef.current) {
        clearTimeout(activeOperationRef.current);
      }
      
      activeOperationRef.current = setTimeout(() => {
        // 再次检查用户交互状态，确保在延迟期间没有用户操作
        if (isUserInteracting) {
          console.log('🚫 省份联动被用户交互阻止');
          return;
        }
        
        if (targetProvince === 'all') {
          const bounds = getProvinceBounds('all');
          if (map && map.setView && map._container) {
            try {
              map.setView(bounds.center, bounds.zoom, { animate: true });
            } catch (e) {
              console.warn('地图视图设置失败:', e);
              if (map.flyTo) {
                map.flyTo(bounds.center, bounds.zoom, { duration: 0.8 });
              }
            }
          }
        } else {
          try {
            const group = new L.featureGroup();
            filteredData.features.forEach(feature => {
              const layer = L.geoJSON(feature);
              group.addLayer(layer);
            });
            
            if (group.getLayers().length > 0 && map && map.fitBounds && map._container) {
              try {
                map.fitBounds(group.getBounds(), { 
                  padding: [10, 10], // 减少边距以获得更大填充
                  maxZoom: 11 // 提高最大缩放级别
                });
              } catch (e) {
                console.warn('地图fitBounds失败:', e);
              }
            } else if (map && map.setView && map._container) {
              const bounds = getProvinceBounds(targetProvince);
              try {
                map.setView(bounds.center, bounds.zoom, { animate: true });
              } catch (e) {
                console.warn('地图setView失败:', e);
              }
            }
          } catch (error) {
            console.warn('省份聚焦失败，使用预设位置:', error);
            if (map && map.setView && map._container) {
              const bounds = getProvinceBounds(targetProvince);
              try {
                map.setView(bounds.center, bounds.zoom, { animate: true });
              } catch (e) {
                console.error('地图视图设置完全失败:', e);
              }
            }
          }
        }
      }, 300);
    }, [map, currentMapProvince, selectedProvince, filteredData, searchQuery, selectedFilters, isUserInteracting]);

    return null;
  };

  // 获取区域筛选的FSA列表
  const getRegionFilteredFSAs = async () => {
    if (selectedRegions.length === 0) return [];

    const regionFSAs = [];
    for (const regionId of selectedRegions) {
      try {
        // 使用统一存储架构获取区域FSA
        const fsaCodes = await getRegionFSAs(regionId);
        if (fsaCodes && fsaCodes.length > 0) {
          regionFSAs.push(...fsaCodes);
          console.log(`📍 区域${regionId}FSA数据:`, fsaCodes.length, '个');
        } else {
          console.log(`⚠️ 区域${regionId}没有FSA数据`);
        }
      } catch (error) {
        console.error(`❌ 读取区域 ${regionId} 邮编数据失败:`, error);
      }
    }

    console.log('🎯 区域筛选FSA列表:', regionFSAs.length, '个', regionFSAs);
    return regionFSAs;
  };

  useEffect(() => {
    const applyFilters = async () => {
      if (mapData) {
        console.log('🔍 开始计算地图筛选结果...');
        let filtered = mapData.features.map(feature => feature.properties.CFSAUID);
        console.log('📊 地图总FSA数量:', filtered.length);

        // 应用区域筛选（优先级最高）
        if (selectedRegions.length > 0) {
          console.log('🎯 应用区域筛选，选中区域:', selectedRegions);
          const regionFSAs = await getRegionFilteredFSAs();
          const beforeCount = filtered.length;
          filtered = filtered.filter(fsa => regionFSAs.includes(fsa));
          console.log(`📍 区域筛选结果: ${beforeCount} -> ${filtered.length} 个FSA`);
        }

      // 应用省份筛选
      if (selectedProvince !== 'all') {
        console.log('🌍 应用省份筛选:', selectedProvince);
        const beforeCount = filtered.length;
        filtered = filtered.filter(fsa => getProvinceFromFSA(fsa) === selectedProvince);
        console.log(`🌍 省份筛选结果: ${beforeCount} -> ${filtered.length} 个FSA`);
      }

      // 应用搜索查询
      if (searchQuery && searchQuery.trim()) {
        console.log('🔍 应用搜索查询:', searchQuery);
        const query = searchQuery.toLowerCase().trim();
        const beforeCount = filtered.length;
        filtered = filtered.filter(fsa => fsa.toLowerCase().includes(query));
        console.log(`🔍 搜索筛选结果: ${beforeCount} -> ${filtered.length} 个FSA`);
      }

      // 注意：省份筛选器不影响数据显示，只影响地图聚焦
      // 这样用户可以看到所有FSA边界，同时地图会聚焦到选中的省份
      
      // 应用城市筛选器（如果有的话）
      if (selectedFilters && selectedFilters.length > 0) {
        console.log('🎯 应用筛选器:', selectedFilters);
        const beforeCount = filtered.length;
        
        selectedFilters.forEach(filterKey => {
          if (filterKey.startsWith('city:')) {
            const cityCode = filterKey.split(':')[1];
            console.log('🏙️ 应用城市筛选:', cityCode);
            
            // 城市筛选逻辑（需要根据实际需求实现）
            // 这里可以添加城市到FSA的映射
          }
          // 省份筛选器只用于地图聚焦，不过滤显示数据
        });
        
        console.log(`🎯 筛选器筛选结果: ${beforeCount} -> ${filtered.length} 个FSA`);
      }

      console.log('✅ 最终筛选结果:', filtered.length, '个FSA');
      setFilteredFSAs(filtered);
    }
  };
  
  applyFilters();
  }, [searchQuery, mapData, selectedProvince, selectedRegions, selectedFilters]);

  // 根据省份获取颜色
  const getProvinceColor = (fsa) => {
    const firstChar = fsa.charAt(0);
    switch (firstChar) {
      case 'V': return '#3B82F6'; // BC - 蓝色
      case 'T': return '#F59E0B'; // AB - 橙色
      case 'S': return '#84CC16'; // SK - 绿色
      case 'R': return '#EF4444'; // MB - 红色
      case 'P': case 'N': case 'K': case 'L': case 'M': return '#10B981'; // ON - 绿色
      case 'H': case 'J': return '#8B5CF6'; // QC - 紫色
      case 'G': return '#A855F7'; // QC东部 - 紫色
      case 'E': return '#06B6D4'; // NB - 青色
      case 'B': return '#F97316'; // NS - 橙色
      case 'C': return '#EC4899'; // PEI - 粉色
      case 'A': return '#14B8A6'; // NL - 青绿色
      default: return '#6B7280'; // 其他 - 灰色
    }
  };

  // 样式化每个FSA区域 - 按所属区域着色
  const styleFeature = (feature) => {
    const fsaCode = feature.properties.CFSAUID;
    const isVisible = filteredFSAs.includes(fsaCode);
    const isHighlighted = highlightedFSAs.includes(fsaCode); // 检查是否被高亮

    // 根据FSA获取所属区域的颜色
    let fillColor = null; // 默认无颜色（未分配区域将透明显示）
    let isAssigned = false; // 标记FSA是否已分配到区域

    // 优先从regionFSAsMap查找（如果已加载）
    if (Object.keys(regionFSAsMap).length > 0) {
      for (let regionId of Object.keys(regionFSAsMap)) {
        if (regionFSAsMap[regionId].includes(fsaCode)) {
          const region = DEFAULT_REGIONS.find(r => r.id === regionId);
          if (region) {
            fillColor = region.color;
            isAssigned = true;
          } else {
            // 对于UUID格式的区域（卡车配送区域），使用存储的颜色或默认颜色
            fillColor = regionColors[regionId] || '#3B82F6'; // 使用存储的颜色或默认蓝色
            isAssigned = true;
            if (!regionColors[regionId]) {
              console.log(`📍 FSA ${fsaCode} 属于区域 ${regionId}，使用默认颜色`);
            }
          }
          break;
        }
      }
    } else {
      // 如果regionFSAsMap还未加载，使用testRegionFSAs作为备用
      for (let regionId of Object.keys(testRegionFSAs)) {
        if (testRegionFSAs[regionId].includes(fsaCode)) {
          const region = DEFAULT_REGIONS.find(r => r.id === regionId);
          if (region) {
            fillColor = region.color;
            isAssigned = true;
          }
          break;
        }
      }
    }

    // 如果被高亮，使用特殊样式
    if (isHighlighted) {
      return {
        fillColor: '#FFD700', // 金色高亮
        weight: 3,
        opacity: 1,
        color: '#FF6B6B', // 红色边框
        fillOpacity: 0.7,
        className: 'fsa-polygon-highlighted'
      };
    }

    // 对于未分配的FSA，使用完全透明或极淡的边框
    if (!isAssigned) {
      return {
        fillColor: 'transparent', // 完全透明的填充
        weight: 0.5, // 很细的边框
        opacity: 0.2, // 很低的边框透明度
        color: '#d1d5db', // 淡灰色边框
        fillOpacity: 0, // 完全透明的填充
        className: 'fsa-polygon-unassigned'
      };
    }

    // 已分配区域的正常显示
    return {
      fillColor: fillColor,
      weight: isVisible ? 2 : 1,
      opacity: isVisible ? 1 : 0.3,
      color: '#ffffff',
      fillOpacity: isVisible ? 0.8 : 0.2,  // 提高透明度从0.6到0.8，改善1区蓝色显示效果
      className: 'fsa-polygon'
    };
  };

  // 为每个特征添加交互
  const onEachFeature = (feature, layer) => {
    const fsaCode = feature.properties.CFSAUID;
    const province = feature.properties.province;
    const region = feature.properties.region;

    layer.bindTooltip(`
      <div style="text-align: center; background: linear-gradient(135deg, #1f2937 0%, #374151 100%); border-radius: 8px; padding: 8px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);">
        <div style="font-weight: 700; font-size: 14px; color: #ffffff; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${fsaCode}</div>
        <div style="font-size: 12px; color: #d1d5db; margin-top: 2px;">${region}</div>
      </div>
    `, {
      direction: 'center',
      opacity: 0.95,
      className: 'custom-tooltip'
    });

    // 添加鼠标事件
    layer.on('mouseover', function(e) {
      layer.setStyle({
        fillOpacity: 0.8,
        weight: 3
      });
    });

    layer.on('mouseout', function(e) {
      layer.setStyle(styleFeature(feature));
    });

    // 统一的点击事件处理 - 聚焦到FSA周围区域并显示报价单
    layer.on('click', function(e) {
      console.log('🎯 FSA点击事件:', fsaCode);

      // 设置用户交互状态，阻止自动控制逻辑干扰
      setIsUserInteracting(true);
      console.log('🔒 用户交互状态已锁定，自动控制已禁用');

      // 显示固定报价单面板
      setSelectedFSAForQuotation({
        fsaCode,
        province,
        region
      });

      // 调用父组件的点击回调（用于显示价格面板）
      if (onFSAClick) {
        onFSAClick({
          fsaCode,
          province,
          region,
          properties: feature.properties
        });
      }

      // 聚焦到点击的FSA及其周围区域
      if (mapInstance && mapInstance._container) {
        try {
          // 获取当前FSA的边界
          const fsaBounds = layer.getBounds();
          
          // 检查边界是否有效
          if (fsaBounds.isValid()) {
            // 扩展边界以包含周围区域（适度扩展边界范围）
            const expandedBounds = fsaBounds.pad(0.3); // 扩展30%的边界范围（减少扩展比例）
            
            // 延迟执行以确保DOM准备好
            setTimeout(() => {
              if (mapInstance && mapInstance.fitBounds) {
                mapInstance.fitBounds(expandedBounds, {
                  animate: true,
                  duration: 0.8,
                  padding: [10, 10], // 进一步减少内边距以获得更大填充
                  maxZoom: 12, // 提高最大缩放级别让FSA填充满屏幕
                  minZoom: 8  // 适当提高最小缩放级别
                });
              }
            }, 100);
            
            console.log('🔍 聚焦到FSA区域:', fsaCode, '边界:', expandedBounds);
          } else {
            console.log('⚠️ FSA边界无效');
          }
        } catch (error) {
          console.error('❌ FSA聚焦出错:', error);
        }
      } else {
        console.log('⚠️ 地图实例未准备好，无法聚焦FSA');
      }
    });
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-cyber-gray rounded-2xl shadow-2xl overflow-hidden border border-cyber-blue/30 h-full flex items-center justify-center"
      >
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Database className="w-16 h-16 text-cyber-blue mx-auto" />
          </motion.div>
          <div>
            <p className="text-white text-lg font-bold">加载FSA边界数据</p>
            <p className="text-gray-400 text-sm">正在从Statistics Canada获取官方地理数据...</p>
            <p className="text-cyber-blue text-xs mt-2">文件大小约50MB，首次加载需要稍等</p>
          </div>
          <div className="flex justify-center">
            <div className="animate-pulse flex space-x-1">
              <div className="h-2 w-2 bg-cyber-blue rounded-full"></div>
              <div className="h-2 w-2 bg-cyber-blue rounded-full animation-delay-200"></div>
              <div className="h-2 w-2 bg-cyber-blue rounded-full animation-delay-400"></div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-cyber-gray rounded-2xl shadow-2xl overflow-hidden border border-cyber-blue/30 h-full max-h-full flex flex-col"
    >
      {/* 地图标题 - 压缩高度 */}
      <div className="bg-gradient-to-r from-cyber-dark to-cyber-gray p-2 border-b border-cyber-blue/30 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-cyber-blue/20 p-2 rounded-lg">
              <MapPin className="w-6 h-6 text-cyber-blue" />
            </div>
            <div className="flex items-center space-x-4">
              <h3 className="text-xl font-bold text-white">
                加拿大FSA真实边界地图
                {selectedProvince !== 'all' && (
                  <span className="ml-3 px-3 py-1 bg-gradient-to-r from-cyber-blue/20 to-cyber-green/20 text-cyber-blue rounded-full text-sm font-medium">
                    🎯 {selectedProvince}省
                  </span>
                )}
              </h3>
              
              {/* 动态区域快速筛选按钮 */}
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-sm">快速筛选:</span>
                
                {/* 区域按钮列表 */}
                <div className="flex items-center space-x-1">
                  {visibleRegions.sort((a, b) => a - b).map(region => {
                    const regionInfo = DEFAULT_REGIONS.find(r => r.id === region.toString());
                    return (
                      <div key={region} className="relative group">
                        <button
                          onClick={() => {
                            const regionId = region.toString();
                            setSelectedRegions(prev => 
                              prev.includes(regionId) 
                                ? [] // 取消选中
                                : [regionId] // 单选：只选中当前区域
                            );
                            setIsUserInteracting(true);
                            console.log(`🎯 快速筛选区域 ${region}`);
                          }}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                            selectedRegions.includes(region.toString())
                              ? 'text-white shadow-lg'
                              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
                          }`}
                          style={{
                            backgroundColor: selectedRegions.includes(region.toString()) 
                              ? regionInfo?.color 
                              : undefined
                          }}
                        >
                          <span 
                            className="w-3 h-3 rounded-full border border-white/30"
                            style={{ backgroundColor: regionInfo ? regionInfo.color : '#6B7280' }}
                          ></span>
                          {region}区
                        </button>
                        
                        {/* 删除按钮（悬停时显示） */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setVisibleRegions(prev => prev.filter(r => r !== region));
                            // 如果删除的区域正好被选中，则清除选中
                            if (selectedRegions.includes(region.toString())) {
                              setSelectedRegions([]);
                            }
                            console.log(`🗑️ 移除区域 ${region} 快速筛选`);
                          }}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                
                {/* 添加区域按钮/输入框 */}
                {showRegionInput ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={newRegionNumber}
                      onChange={(e) => setNewRegionNumber(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const num = parseInt(newRegionNumber);
                          if (num > 0 && num <= 8 && !visibleRegions.includes(num)) {
                            setVisibleRegions(prev => [...prev, num]);
                            setNewRegionNumber('');
                            setShowRegionInput(false);
                            console.log(`➕ 添加区域 ${num} 到快速筛选`);
                          }
                        }
                      }}
                      placeholder="1-8"
                      className="w-12 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                      autoFocus
                      min="1"
                      max="8"
                    />
                    <button
                      onClick={() => {
                        const num = parseInt(newRegionNumber);
                        if (num > 0 && num <= 8 && !visibleRegions.includes(num)) {
                          setVisibleRegions(prev => [...prev, num]);
                          console.log(`➕ 添加区域 ${num} 到快速筛选`);
                        }
                        setNewRegionNumber('');
                        setShowRegionInput(false);
                      }}
                      className="p-1 bg-green-600 hover:bg-green-700 rounded text-white"
                    >
                      <CheckCircle className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        setNewRegionNumber('');
                        setShowRegionInput(false);
                      }}
                      className="p-1 bg-gray-600 hover:bg-gray-700 rounded text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowRegionInput(true)}
                    className="px-2 py-1 bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 rounded-lg text-green-400 transition-all duration-200"
                    title="添加区域筛选"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
                
                {/* 清除筛选按钮 */}
                {selectedRegions.length > 0 && (
                  <button
                    onClick={() => {
                      setSelectedRegions([]);
                      setIsUserInteracting(false);
                      console.log('🔄 清除所有区域筛选');
                    }}
                    className="px-2 py-1 rounded-lg text-xs font-medium bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-all duration-200"
                  >
                    清除
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">配送区域FSA</p>
              <p className="text-lg font-bold text-cyber-blue">
                {mapData?.features?.length || 0}
              </p>
              {mapData?.metadata?.originalCount && (
                <p className="text-xs text-gray-500">
                  总计: {mapData.metadata.originalCount}
                </p>
              )}
            </div>

            {filteredFSAs.length !== (mapData?.features?.length || 0) && (
              <div className="text-right">
                <p className="text-sm text-gray-400">
                  {selectedRegions.length > 0 ? '区域筛选' :
                   selectedProvince !== 'all' || searchQuery ? '筛选结果' : '搜索结果'}
                </p>
                <p className="text-lg font-bold text-cyber-green">
                  {filteredFSAs.length}
                </p>
                {selectedRegions.length > 0 && (
                  <p className="text-xs text-gray-500">
                    区域: {selectedRegions.join(', ')}
                  </p>
                )}
              </div>
            )}
            
            <div className="bg-green-500/20 px-3 py-1 rounded-full">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-500 text-sm font-medium">官方数据</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 地图容器 - 使用flex-1充满剩余空间 */}
      <div className="flex-1 w-full relative overflow-hidden">
        {/* 省份分析器 - 移动到地图底部避免与弹窗重叠 */}
        {selectedRegions && selectedRegions.length > 0 && (
          <div className="absolute bottom-4 left-4 z-[1000] max-w-sm">
            <ProvinceAnalyzer
              selectedRegions={selectedRegions}
              onProvinceSwitch={handleProvinceSwitch}
              currentProvince={currentMapProvince}
            />
          </div>
        )}

        {/* 配送区域状态 */}
        <DeliveryAreaStatus
          className="absolute bottom-4 right-4 z-[1000] max-w-xs"
          selectedRegions={selectedRegions}
        />

        <MapContainer
          ref={mapRef}
          center={[56.1304, -106.3468]} // 标准加拿大中心点，与取消选择效果一致
          zoom={4} // 标准加拿大全景缩放级别
          minZoom={3} // 提高最小缩放级别，防止过度缩小
          maxZoom={18}
          maxBounds={[
            [41.0, -141.0], // 西南角 - 加拿大南部边界
            [83.0, -52.0]   // 东北角 - 加拿大北部边界
          ]} // 限制地图边界在加拿大范围内
          maxBoundsViscosity={0.8} // 增加边界粘性，让地图更难超出边界
          style={{ height: 'calc(100% - 1rem)', width: '100%' }}
          className="rounded-b-2xl"
          onClick={(e) => {
            // 点击空白区域时清除交互状态和报价单
            if (e.originalEvent && !e.originalEvent.defaultPrevented) {
              setSelectedFSAForQuotation(null);
              setIsUserInteracting(false);
              console.log('🔓 用户交互状态已解除，自动控制恢复');
            }
          }}
        >
          {/* 地图实例设置器 - 必须在MapContainer内部 */}
          <MapInstanceSetter />
          
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* 筛选后的数据 */}
          {(() => {
            const filteredData = mapData ? {
              type: 'FeatureCollection',
              features: mapData.features.filter(feature => 
                filteredFSAs.includes(feature.properties.CFSAUID)
              )
            } : null;

            return (
              <>
                {/* 地图控制器 - 处理自动缩放 */}
                <MapController 
                  selectedProvince={selectedProvince} 
                  filteredData={filteredData}
                />
                
                {/* 渲染真实的FSA边界 */}
                {filteredData && (
                  <GeoJSON
                    key={`geojson-${filteredFSAs.length}-${selectedProvince}-${JSON.stringify(selectedFilters)}-${JSON.stringify(highlightedFSAs)}`}
                    data={filteredData}
                    style={styleFeature}
                    onEachFeature={onEachFeature}
                  />
                )}
              </>
            );
          })()}
        </MapContainer>

        {/* 简化图例 - 最小化 */}
        <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm p-2 rounded text-xs text-white max-w-[150px]">
          <div className="flex items-center gap-2 mb-1">
            <Info className="w-3 h-3" />
            <span className="font-semibold">省份色彩</span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>BC</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>ON</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>QC</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>AB</span>
            </div>
          </div>
        </div>

        {/* 数据来源标注 - 压缩 */}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-gray-300">
          Statistics Canada 2021 • {mapData?.features?.length || 0} FSAs
        </div>
        
        {/* 添加自定义样式 */}
        <style>{`
          .fsa-polygon:hover {
            stroke-width: 3 !important;
            fill-opacity: 0.8 !important;
          }
          .leaflet-container {
            background-color: #f8fafc;
          }
          .custom-tooltip {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
          }
          .leaflet-tooltip-top:before,
          .leaflet-tooltip-bottom:before,
          .leaflet-tooltip-left:before,
          .leaflet-tooltip-right:before {
            border: none !important;
          }
          .leaflet-popup-content-wrapper {
            background: transparent !important;
            border-radius: 12px !important;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3) !important;
          }
          .leaflet-popup-content {
            margin: 0 !important;
            padding: 0 !important;
          }
          .leaflet-popup-tip {
            background: #374151 !important;
          }
        `}</style>
      </div>

      {/* 固定位置的报价单面板 */}
      <FixedQuotationPanel
        selectedFSA={selectedFSAForQuotation}
        onClose={() => setSelectedFSAForQuotation(null)}
      />
    </motion.div>
  );
};

export default AccurateFSAMap;