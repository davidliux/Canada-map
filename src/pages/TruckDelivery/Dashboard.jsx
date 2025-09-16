import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import TruckDeliveryMap from '../../components/TruckDeliveryMap';
import TruckDeliverySearch from '../../components/cities/TruckDeliverySearch';
import { cityApi, zoneApi } from '../../services/truckDeliveryApi';
import {
  Truck,
  Building2,
  Package,
  TrendingUp,
  Activity,
  Users,
  BarChart3,
  Zap,
  MapPin,
  DollarSign,
  Clock,
  ArrowLeft,
  Layers,
  Filter,
  ChevronDown,
  Search,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { deliverableFSAs } from '../../data/deliverableFSA';

const TruckDeliveryDashboard = () => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [cityRegions, setCityRegions] = useState([]);
  const [highlightedFSAs, setHighlightedFSAs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allConfiguredFSAs, setAllConfiguredFSAs] = useState([]); // 所有已配置的FSA
  const [stats, setStats] = useState({
    totalCities: 0,
    totalRegions: 0,
    totalFSAs: 0,
    activeProvinces: 0,
    coverageRate: 0,
    dailyDeliveries: 0,
    activeDrivers: 0,
    avgDeliveryTime: 0
  });

  // 加载城市和区域数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('开始加载城市数据...');
        // 从后端API加载城市数据，包含区域信息
        const citiesData = await cityApi.getAll(true);
        console.log('API返回的城市数据:', citiesData);

        // 对于每个城市，获取其详细的区域信息
        const citiesWithRegions = await Promise.all(
          citiesData.map(async (city) => {
            try {
              console.log(`获取城市 ${city.name} 的详细信息...`);
              // 获取城市详情，包含zones
              const cityDetail = await cityApi.getById(city.id);
              console.log(`城市 ${city.name} 详情:`, cityDetail);
              return {
                ...city,
                regions: cityDetail.zones || [],
                totalRegions: cityDetail.zones?.length || 0,
                totalFSAs: cityDetail.zones?.reduce((sum, zone) =>
                  sum + (zone.fsa_codes?.length || zone.fsaCodes?.length || 0), 0) || 0
              };
            } catch (err) {
              console.error(`获取城市 ${city.name} 详情失败:`, err);
              return {
                ...city,
                regions: [],
                totalRegions: 0,
                totalFSAs: 0
              };
            }
          })
        );

        console.log('处理后的城市数据:', citiesWithRegions);
        setCities(citiesWithRegions);

        // 收集所有配置的FSA
        const configuredFSAs = [];
        citiesWithRegions.forEach(city => {
          if (city.regions && Array.isArray(city.regions)) {
            city.regions.forEach(region => {
              const fsaCodes = region.fsaCodes || region.fsa_codes || [];
              if (fsaCodes && fsaCodes.length > 0) {
                configuredFSAs.push(...fsaCodes);
              }
            });
          }
        });
        // 去重
        const uniqueFSAs = [...new Set(configuredFSAs)];
        setAllConfiguredFSAs(uniqueFSAs);
        console.log('配置的FSA总数:', uniqueFSAs.length, '部分FSA:', uniqueFSAs.slice(0, 10));

        // 计算统计数据
        const totalRegions = citiesWithRegions.reduce((sum, city) => sum + (city.totalRegions || 0), 0);
        const totalFSAs = uniqueFSAs.length; // 使用实际配置的FSA数量
        console.log(`统计: 总区域数=${totalRegions}, 总FSA数=${totalFSAs}`);
        const provinces = new Set(citiesWithRegions.map(c => c.province));

        // 计算覆盖率
        const coverageRate = deliverableFSAs.length > 0
          ? (totalFSAs / deliverableFSAs.length * 100).toFixed(1)
          : 0;

        setStats({
          totalCities: citiesWithRegions.length,
          totalRegions,
          totalFSAs,
          activeProvinces: provinces.size,
          coverageRate: parseFloat(coverageRate),
          dailyDeliveries: Math.floor(Math.random() * 2000) + 1000,
          activeDrivers: Math.floor(Math.random() * 100) + 50,
          avgDeliveryTime: (Math.random() * 2 + 1).toFixed(1)
        });
      } catch (err) {
        console.error('加载城市数据失败:', err);
        console.error('错误详情:', err.message, err.stack);
        setError('无法加载城市数据，请检查后端服务是否运行');

        // 尝试从localStorage加载备用数据
        const fallbackData = localStorage.getItem('truck_delivery_cities');
        if (fallbackData) {
          try {
            const parsedCities = JSON.parse(fallbackData);
            setCities(parsedCities);
            console.log('已从本地缓存加载备用数据');
          } catch (parseErr) {
            console.error('解析本地数据失败:', parseErr);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 60000); // 每60秒刷新
    return () => clearInterval(interval);
  }, []);

  // 处理城市选择
  const handleCitySelect = async (city) => {
    console.log('选中城市:', city);
    setSelectedCity(city);

    try {
      // 从后端API加载该城市的区域数据
      if (city.regions && city.regions.length > 0) {
        // 如果城市对象已经包含区域数据，直接使用
        setCityRegions(city.regions);

        // 收集所有FSA用于高亮显示
        const allFSAs = [];
        city.regions.forEach(region => {
          // 处理不同的字段名
          const fsaCodes = region.fsaCodes || region.fsa_codes || region.fsaList || [];
          if (fsaCodes && fsaCodes.length > 0) {
            allFSAs.push(...fsaCodes);
          }
        });
        console.log('高亮的FSA列表:', allFSAs);
        setHighlightedFSAs(allFSAs);
      } else {
        // 如果没有区域数据，尝试从 API 获取
        const zones = await zoneApi.getByCityId(city.id);
        setCityRegions(zones);

        const allFSAs = [];
        zones.forEach(zone => {
          const fsaCodes = zone.fsa_codes || zone.fsaCodes || [];
          if (fsaCodes && fsaCodes.length > 0) {
            allFSAs.push(...fsaCodes);
          }
        });
        console.log('高亮的FSA列表:', allFSAs);
        setHighlightedFSAs(allFSAs);
      }
    } catch (err) {
      console.error('加载城市区域数据失败:', err);
      console.error('错误详情:', err.message);
      setCityRegions([]);
      setHighlightedFSAs([]);
    }
  };

  // 清除选择
  const handleClearSelection = () => {
    setSelectedCity(null);
    setCityRegions([]);
    setHighlightedFSAs([]);
  };

  // 处理搜索
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // 处理搜索结果选择
  const handleSearchSelect = (suggestion) => {
    console.log('搜索选择:', suggestion);
    
    if (suggestion.type === 'city') {
      handleCitySelect(suggestion.data);
    } else if (suggestion.type === 'fsa') {
      // 高亮显示FSA
      setHighlightedFSAs([suggestion.value]);
      // 如果FSA属于某个城市，也选中该城市
      if (suggestion.data.cityInfo) {
        handleCitySelect(suggestion.data.cityInfo);
      }
    } else if (suggestion.type === 'postal') {
      // 处理邮编搜索
      setHighlightedFSAs([suggestion.data.fsa]);
      if (suggestion.data.cityInfo) {
        handleCitySelect(suggestion.data.cityInfo);
      }
    }
  };

  // 处理城市导航
  const handleCityNavigation = (cityData) => {
    navigate(`/truck-delivery/city/${cityData.id}`);
  };

  const statsCards = [
    {
      title: '服务城市',
      value: stats.totalCities,
      unit: '个',
      icon: Building2,
      color: 'from-blue-500 to-blue-600',
      trend: '+2',
      trendUp: true
    },
    {
      title: '配送区域',
      value: stats.totalRegions,
      unit: '个',
      icon: Layers,
      color: 'from-green-500 to-green-600',
      trend: '+5',
      trendUp: true
    },
    {
      title: 'FSA覆盖',
      value: stats.totalFSAs,
      unit: '个',
      icon: MapPin,
      color: 'from-purple-500 to-purple-600',
      trend: '+12',
      trendUp: true
    },
    {
      title: '覆盖率',
      value: stats.coverageRate,
      unit: '%',
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      trend: '+3.2%',
      trendUp: true
    },
    {
      title: '今日配送',
      value: stats.dailyDeliveries,
      unit: '单',
      icon: Package,
      color: 'from-cyan-500 to-cyan-600',
      trend: '+15%',
      trendUp: true
    },
    {
      title: '活跃司机',
      value: stats.activeDrivers,
      unit: '人',
      icon: Users,
      color: 'from-pink-500 to-pink-600',
      trend: '+8',
      trendUp: true
    },
    {
      title: '平均时效',
      value: stats.avgDeliveryTime,
      unit: '小时',
      icon: Clock,
      color: 'from-indigo-500 to-indigo-600',
      trend: '-0.3h',
      trendUp: true
    },
    {
      title: '系统状态',
      value: '正常',
      unit: '',
      icon: Activity,
      color: 'from-green-500 to-green-600',
      trend: '99.9%',
      trendUp: true
    }
  ];

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* 顶部导航栏 */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboards')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="返回仪表板选择"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <Truck className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-xl font-bold text-white">卡车派送数据大屏</h1>
              <p className="text-xs text-gray-400">
                实时配送网络监控 · {new Date().toLocaleString('zh-CN')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {selectedCity && (
              <div className="flex items-center space-x-3 bg-gray-700/50 px-4 py-2 rounded-lg">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedCity.themeColor }}
                />
                <span className="text-sm text-white">{selectedCity.name}</span>
                <button
                  onClick={handleClearSelection}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-green-400 animate-pulse" />
              <span className="text-sm text-gray-300">实时更新</span>
            </div>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="px-6 py-4 bg-gray-800/50 backdrop-blur border-b border-gray-700">
        <div className="grid grid-cols-8 gap-4">
          {statsCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-4"
              >
                <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
                  <div className={`w-full h-full bg-gradient-to-br ${card.color} rounded-full blur-2xl`} />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-5 h-5 text-gray-400" />
                    {card.trend && (
                      <span className={`text-xs ${card.trendUp ? 'text-green-400' : 'text-red-400'}`}>
                        {card.trend}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-bold text-white">
                      {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                    </span>
                    {card.unit && (
                      <span className="text-sm text-gray-400">{card.unit}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{card.title}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur flex items-center justify-center z-50">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <span className="text-white text-lg">正在加载城市数据...</span>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-900/90 text-white px-6 py-3 rounded-lg shadow-xl z-50">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* 主要内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧城市列表 */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">城市网络</h2>
              <span className="text-sm text-gray-400">{cities.length} 个城市</span>
            </div>

            {/* 搜索功能 */}
            <div className="mb-4">
              <TruckDeliverySearch
                onSearch={handleSearch}
                onSelect={handleSearchSelect}
                onCityNavigation={handleCityNavigation}
                searchHistory={searchHistory}
                onHistoryUpdate={setSearchHistory}
                className="w-full"
                placeholder="搜索城市、FSA代码或邮编..."
              />
            </div>

            {/* 城市筛选 */}
            <div className="mb-4">
              <select
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                onChange={(e) => {
                  if (e.target.value) {
                    const city = cities.find(c => c.id === e.target.value);
                    if (city) handleCitySelect(city);
                  } else {
                    handleClearSelection();
                  }
                }}
                value={selectedCity?.id || ''}
              >
                <option value="">全部城市</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
            </div>

            {/* 城市卡片列表 */}
            <div className="space-y-3">
              {cities.map((city) => (
                <motion.div
                  key={city.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleCitySelect(city)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    selectedCity?.id === city.id
                      ? 'bg-blue-900/30 border border-blue-600/50'
                      : 'bg-gray-700/50 border border-gray-600/30 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: city.themeColor + '20' }}
                      >
                        <Building2 className="w-5 h-5" style={{ color: city.themeColor }} />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{city.name}</h3>
                        <p className="text-xs text-gray-400">{city.province}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-800/50 rounded px-2 py-1">
                      <span className="text-gray-400">区域: </span>
                      <span className="text-white font-medium">{city.totalRegions || city.regions?.length || 0}</span>
                    </div>
                    <div className="bg-gray-800/50 rounded px-2 py-1">
                      <span className="text-gray-400">FSA: </span>
                      <span className="text-white font-medium">{city.totalFSAs || 0}</span>
                    </div>
                  </div>

                  {selectedCity?.id === city.id && cityRegions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <p className="text-xs text-gray-400 mb-2">配送区域等级</p>
                      <div className="space-y-1">
                        {cityRegions.map((region) => (
                          <div key={region.id} className="flex items-center justify-between">
                            <span className="text-xs text-gray-300">
                              Level {region.level}: {region.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {(region.fsaCodes || region.fsa_codes || region.fsaList)?.length || 0} FSA
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* 实时活动 */}
          <div className="p-4 border-t border-gray-700">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">实时活动</h3>
            <div className="space-y-2">
              {[
                { type: 'delivery', text: '新订单已分配', time: '刚刚', color: 'bg-green-400' },
                { type: 'update', text: '多伦多区域更新', time: '2分钟前', color: 'bg-blue-400' },
                { type: 'alert', text: '温哥华配送延迟', time: '5分钟前', color: 'bg-yellow-400' },
                { type: 'complete', text: '批量订单完成', time: '10分钟前', color: 'bg-purple-400' }
              ].map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-3 p-2 bg-gray-700/30 rounded-lg"
                >
                  <div className={`w-2 h-2 rounded-full ${activity.color}`} />
                  <div className="flex-1">
                    <p className="text-xs text-white">{activity.text}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* 地图区域 - 使用简化的卡车配送地图组件 */}
        <div className="flex-1 relative bg-gray-900">
          <TruckDeliveryMap
            highlightedFSAs={highlightedFSAs}
            cityView={selectedCity}
            cityRegions={cityRegions} // 传递城市区域数据，包含颜色信息
            allCities={cities} // 传递所有城市数据，用于全局视图颜色
            searchQuery={searchQuery}
            configuredFSAs={allConfiguredFSAs} // 传递所有配置的FSA
            className="h-full"
          />
          
          {/* 地图图例 */}
          {selectedCity && cityRegions.length > 0 && (
            <div className="absolute bottom-4 left-4 bg-gray-800/95 backdrop-blur border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white mb-2">区域图例</h3>
              <div className="space-y-2">
                {cityRegions.map((region, index) => {
                  const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'];
                  return (
                    <div key={region.id} className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: colors[index % colors.length] }}
                      />
                      <span className="text-xs text-gray-300">
                        Level {region.level}: {region.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TruckDeliveryDashboard;