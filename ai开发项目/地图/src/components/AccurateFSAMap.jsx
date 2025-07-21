import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import { motion } from 'framer-motion';
import { MapPin, Info, Database, CheckCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 可配送的FSA列表
import { deliverableFSAs } from '../data/deliverableFSA.js';
import { generateQuotationHTML, printQuotation } from '../utils/quotationGenerator.js';
import { serverStorage } from '../utils/serverStorage';
import { dataUpdateNotifier } from '../utils/dataUpdateNotifier';
import ProvinceAnalyzer from './ProvinceAnalyzer';
import FixedQuotationPanel from './FixedQuotationPanel';
import DeliveryAreaStatus from './DeliveryAreaStatus';
import {
  filterMapDataByDeliveryArea,
  getAllDeliveryFSAs,
  getDeliveryAreaStats
} from '../utils/deliveryAreaFilter.js';

const AccurateFSAMap = ({ searchQuery, selectedProvince = 'all', deliverableFSAs, selectedRegions = [], onFSAClick, onProvinceChange }) => {
  const [filteredFSAs, setFilteredFSAs] = useState([]);
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);
  const [currentDeliverableFSAs, setCurrentDeliverableFSAs] = useState([]);
  const [currentMapProvince, setCurrentMapProvince] = useState(selectedProvince);
  const [selectedFSAForQuotation, setSelectedFSAForQuotation] = useState(null);

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

    return () => {
      delete window.openFSAManagement;
      delete window.printQuotation;
    };
  }, [onFSAClick]);

  // 监听外部传入的FSA数据变化
  useEffect(() => {
    if (deliverableFSAs && deliverableFSAs.length > 0) {
      setCurrentDeliverableFSAs(deliverableFSAs);
    } else {
      // 使用默认数据
      import('../data/deliverableFSA.js').then(module => {
        setCurrentDeliverableFSAs(module.deliverableFSAs);
      });
    }
  }, [deliverableFSAs]);

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
    // 动态加载新的完整FSA数据文件
    const loadFSAData = async () => {
      try {
        console.log('🚀 开始加载完整FSA边界数据...');
        const response = await fetch('/data/canada_fsa_boundaries_complete.json');
        
        if (!response.ok) {
          throw new Error(`HTTP错误: ${response.status}`);
        }
        
        const fsaBoundariesData = await response.json();
        console.log('✅ FSA数据加载成功:', fsaBoundariesData);
        
        if (fsaBoundariesData && fsaBoundariesData.features) {
          // 使用配送区域筛选器过滤FSA数据
          const processed = filterMapDataByDeliveryArea(fsaBoundariesData, selectedRegions);

          console.log('🎯 配送区域筛选完成:', processed.features.length, '个FSA区域');
          console.log('📊 筛选统计:', processed.metadata);

          // 获取配送区域统计信息
          const deliveryStats = getDeliveryAreaStats();
          console.log('📈 配送区域统计:', deliveryStats);

          setMapData(processed);
        } else {
          throw new Error('数据格式错误或为空');
        }
      } catch (error) {
        console.error('❌ 加载FSA数据失败:', error);
        // 显示错误信息但不阻止应用运行
        setMapData({ type: 'FeatureCollection', features: [] });
      } finally {
        setLoading(false);
      }
    };

    if (currentDeliverableFSAs.length > 0) {
      loadFSAData();
    }
  }, [currentDeliverableFSAs]);

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

  // 处理省份切换
  const handleProvinceSwitch = (province) => {
    console.log('🗺️ 切换到省份:', province);
    setCurrentMapProvince(province);

    // 通知父组件更新省份筛选
    if (onProvinceChange) {
      onProvinceChange(province);
    }
  };

  // 获取省份的地理中心点和缩放级别
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
      'all': { center: [56.1304, -106.3468], zoom: 4 }
    };
    return bounds[province] || bounds['all'];
  };

  // 地图控制组件
  const MapController = ({ selectedProvince, filteredData }) => {
    const map = useMap();

    useEffect(() => {
      if (!map || !filteredData || filteredData.features.length === 0) return;

      const timeout = setTimeout(() => {
        // 使用当前地图省份而不是选中省份
        const targetProvince = currentMapProvince || selectedProvince;

        if (targetProvince === 'all') {
          // 显示所有区域 - 缩放到加拿大全境
          const bounds = getProvinceBounds('all');
          map.setView(bounds.center, bounds.zoom);
        } else {
          // 筛选特定省份 - 缩放到筛选区域
          try {
            // 计算所有筛选FSA的边界
            const group = new L.featureGroup();
            filteredData.features.forEach(feature => {
              const layer = L.geoJSON(feature);
              group.addLayer(layer);
            });
            
            if (group.getLayers().length > 0) {
              // 缩放到筛选区域的边界，添加适当的边距
              map.fitBounds(group.getBounds(), { 
                padding: [20, 20],
                maxZoom: 8 // 限制最大缩放级别，避免过度放大
              });
            } else {
              // 如果没有找到具体区域，使用省份预设的中心点
              const bounds = getProvinceBounds(targetProvince);
              map.setView(bounds.center, bounds.zoom);
            }
          } catch (error) {
            console.warn('自动缩放失败，使用预设区域:', error);
            const bounds = getProvinceBounds(targetProvince);
            map.setView(bounds.center, bounds.zoom);
          }
        }
      }, 300); // 添加延迟确保数据渲染完成

      return () => clearTimeout(timeout);
    }, [map, currentMapProvince, selectedProvince, filteredData]);

    return null;
  };

  // 获取区域筛选的FSA列表
  const getRegionFilteredFSAs = async () => {
    if (selectedRegions.length === 0) return [];

    const regionFSAs = [];

    for (const regionId of selectedRegions) {
      try {
        // 使用服务器存储架构获取区域邮编
        const regionConfig = await serverStorage.getRegionConfig(regionId);
        const postalCodes = regionConfig ? regionConfig.postalCodes : [];
        if (postalCodes && postalCodes.length > 0) {
          regionFSAs.push(...postalCodes);
          console.log(`📍 区域${regionId}邮编数据:`, postalCodes.length, '个');
        } else {
          console.log(`⚠️ 区域${regionId}没有邮编数据`);
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

        console.log('✅ 最终筛选结果:', filtered.length, '个FSA');
        setFilteredFSAs(filtered);
      }
    };

    applyFilters();
  }, [searchQuery, mapData, selectedProvince, selectedRegions]);

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

  // 样式化每个FSA区域
  const styleFeature = (feature) => {
    const fsaCode = feature.properties.CFSAUID;
    const isVisible = filteredFSAs.includes(fsaCode);
    const color = getProvinceColor(fsaCode);
    
    return {
      fillColor: color,
      weight: isVisible ? 2 : 1,
      opacity: isVisible ? 1 : 0.3,
      color: '#ffffff',
      fillOpacity: isVisible ? 0.6 : 0.2,
      className: 'fsa-polygon'
    };
  };

  // 为每个特征添加交互
  const onEachFeature = (feature, layer) => {
    const fsaCode = feature.properties.CFSAUID;
    const province = feature.properties.province;
    const region = feature.properties.region;

    // 点击时显示固定报价单面板，而不是弹窗
    layer.on('click', () => {
      setSelectedFSAForQuotation({
        fsaCode,
        province,
        region
      });
    });

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

    // 添加点击事件
    layer.on('click', function(e) {
      if (onFSAClick) {
        onFSAClick({
          fsaCode,
          province,
          region,
          properties: feature.properties
        });
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
        <div className="text-center">
          <Database className="w-16 h-16 text-cyber-blue mx-auto mb-4 animate-pulse" />
          <p className="text-white text-lg">加载真实FSA边界数据...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-cyber-gray rounded-2xl shadow-2xl overflow-hidden border border-cyber-blue/30 h-full"
    >
      {/* 地图标题 */}
      <div className="bg-gradient-to-r from-cyber-dark to-cyber-gray p-4 border-b border-cyber-blue/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-cyber-blue/20 p-2 rounded-lg">
              <MapPin className="w-6 h-6 text-cyber-blue" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                加拿大FSA真实边界地图
                {selectedProvince !== 'all' && (
                  <span className="ml-3 px-3 py-1 bg-gradient-to-r from-cyber-blue/20 to-cyber-green/20 text-cyber-blue rounded-full text-sm font-medium">
                    🎯 {selectedProvince}省
                  </span>
                )}
              </h3>
              <p className="text-gray-400 text-sm">
                Statistics Canada 2021官方数据 • 真实地理边界
                {selectedProvince !== 'all' && (
                  <span className="ml-2 text-cyber-green">
                    • 自动聚焦已启用
                  </span>
                )}
              </p>
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

      {/* 地图容器 */}
      <div className="h-[600px] relative">
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
          center={[56.1304, -106.3468]} // 加拿大地理中心
          zoom={4}
          minZoom={1}
          maxZoom={18}
          style={{ height: '100%', width: '100%' }}
          className="rounded-b-2xl"
          onClick={() => setSelectedFSAForQuotation(null)} // 点击空白区域关闭报价单
        >
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
                    key={`geojson-${filteredFSAs.length}-${selectedProvince}`}
                    data={filteredData}
                    style={styleFeature}
                    onEachFeature={onEachFeature}
                  />
                )}
              </>
            );
          })()}
        </MapContainer>

        {/* 详细图例 */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg z-1000 max-w-[280px]">
          <h4 className="font-bold text-sm mb-3 flex items-center">
            <Info className="w-4 h-4 mr-2" />
            地图图例
          </h4>
          
          <div className="space-y-3">
            <div>
              <h5 className="font-medium text-xs mb-1">省份色彩</h5>
              <div className="space-y-1 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>不列颠哥伦比亚省 (V)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>安大略省 (L,M,N,K)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded"></div>
                  <span>魁北克省 (H,J)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span>阿尔伯塔省 (T)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>马尼托巴省 (R)</span>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-2">
              <h5 className="font-medium text-xs mb-1">数据来源</h5>
              <div className="text-xs text-gray-600">
                <p>• Statistics Canada 2021</p>
                <p>• 官方FSA边界文件</p>
                <p>• 真实地理坐标</p>
              </div>
            </div>
          </div>
        </div>

        {/* 数据来源标注 */}
        <div className="absolute top-4 right-4 bg-cyber-dark/80 backdrop-blur-sm px-3 py-2 rounded-lg">
          <p className="text-xs text-gray-300">
            ✓ 真实官方数据 • Statistics Canada 2021 • {mapData?.features?.length || 0}个可配送FSA • 覆盖率97.64%
          </p>
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