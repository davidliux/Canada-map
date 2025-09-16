import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import CityRegionEditor from '../../components/cities/CityRegionEditor.jsx';
import RegionPriceManager from '../../components/cities/RegionPriceManager.jsx';
import PriceCalculatorDemo from '../../components/cities/PriceCalculatorDemo.jsx';
import TruckDeliveryMap from '../../components/TruckDeliveryMap';
import TruckDeliverySearch from '../../components/cities/TruckDeliverySearch.jsx';
import { cityDatabaseService } from '../../utils/storage/cityDatabaseService.js';
import {
  ArrowLeft,
  Building2,
  MapPin,
  DollarSign,
  Package,
  Clock,
  TrendingUp,
  AlertCircle,
  Layers,
  Map
} from 'lucide-react';

const CityView = () => {
  const { cityId } = useParams();
  const navigate = useNavigate();
  const [city, setCity] = useState(null);
  const [regions, setRegions] = useState([]);
  const [activeTab, setActiveTab] = useState('map');
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [highlightedFSAs, setHighlightedFSAs] = useState([]);

  // 加载城市数据
  useEffect(() => {
    const loadCityData = async () => {
      try {
        // 使用数据库服务加载城市数据
        const cityData = await cityDatabaseService.getCity(cityId);
        if (cityData) {
          setCity(cityData);
          setRegions(cityData.regions || []);
        } else {
          console.warn(`城市未找到: ${cityId}`);
          navigate('/truck-delivery');
        }
      } catch (error) {
        console.error('加载城市数据失败:', error);
        navigate('/truck-delivery');
      }
    };

    if (cityId) {
      loadCityData();
    }
  }, [cityId, navigate]);

  // 处理搜索选择
  const handleSearchSelect = (suggestion) => {
    console.log('城市视图搜索选择:', suggestion);
    
    if (suggestion.type === 'fsa') {
      // 高亮显示FSA
      setHighlightedFSAs([suggestion.value]);
      // 切换到地图标签页
      setActiveTab('map');
    } else if (suggestion.type === 'postal') {
      // 处理邮编搜索
      setHighlightedFSAs([suggestion.data.fsa]);
      setActiveTab('map');
    } else if (suggestion.type === 'city' && suggestion.data.id !== cityId) {
      // 如果搜索到其他城市，导航到该城市
      navigate(`/truck-delivery/city/${suggestion.data.id}`);
    }
  };

  // 处理城市导航
  const handleCityNavigation = (cityData) => {
    if (cityData.id !== cityId) {
      navigate(`/truck-delivery/city/${cityData.id}`);
    }
  };


  if (!city) {
    return (
      <div className="h-full bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* 页面头部 */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/truck-delivery')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: city.themeColor + '20' }}
            >
              <Building2 className="w-5 h-5" style={{ color: city.themeColor }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{city.name}</h1>
              <p className="text-sm text-gray-400">
                {city.province} • {regions.length} 个区域 • {regions.reduce((sum, r) => sum + (r.fsaCodes?.length || 0), 0)} 个FSA
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* 搜索功能 */}
            <div className="w-80">
              <TruckDeliverySearch
                onSelect={handleSearchSelect}
                onCityNavigation={handleCityNavigation}
                searchHistory={searchHistory}
                onHistoryUpdate={setSearchHistory}
                className="w-full"
                placeholder="在此城市中搜索FSA或邮编..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* 标签页 */}
      <div className="border-b border-gray-700">
        <div className="px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('map')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'map'
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Map className="w-4 h-4" />
              配送地图
            </button>
            <button
              onClick={() => setActiveTab('regions')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'regions'
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              配送区域
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'pricing'
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              价格策略
            </button>
            <button
              onClick={() => setActiveTab('statistics')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'statistics'
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              数据统计
            </button>
          </nav>
        </div>
      </div>

      {/* 内容区域 */}
      <div className={`${activeTab === 'map' ? 'p-0' : 'p-6'} flex-1 overflow-auto`}>
        {activeTab === 'map' && (
          <div className="h-[calc(100vh-200px)]">
            <TruckDeliveryMap
              selectedCity={city.name}
              selectedRegions={regions.map(r => r.level).filter(l => l !== undefined)}
              highlightedFSAs={highlightedFSAs}
              onCityClick={(data) => {
                console.log('城市地图点击:', data);
              }}
              onRegionClick={(data) => {
                console.log('区域点击:', data);
                // 可以切换到区域编辑标签页
                setActiveTab('regions');
              }}
              className="rounded-none"
            />
          </div>
        )}
        {activeTab === 'regions' && (
          <CityRegionEditor
            cityData={city}
            onCityChange={async (updatedCity) => {
              // 保存更新的城市数据到数据库
              const success = await cityDatabaseService.saveCity(updatedCity);
              if (success) {
                setCity(updatedCity);
                setRegions(updatedCity.regions || []);
              }
            }}
          />
        )}
        {activeTab === 'pricing' && (
          <PricingTab 
            regions={regions} 
            cityThemeColor={city.themeColor}
            selectedRegion={selectedRegion}
            onRegionSelect={setSelectedRegion}
            onPriceUpdate={(regionId, priceTable) => {
              // 更新区域价格后刷新城市数据
              const loadCityData = async () => {
                try {
                  const cityData = await cityDatabaseService.getCity(cityId);
                  if (cityData) {
                    setCity(cityData);
                    setRegions(cityData.regions || []);
                  }
                } catch (error) {
                  console.error('刷新城市数据失败:', error);
                }
              };
              loadCityData();
            }}
          />
        )}
        {activeTab === 'statistics' && (
          <StatisticsTab city={city} regions={regions} />
        )}
      </div>

    </div>
  );
};


// 价格策略标签页
const PricingTab = ({ regions, cityThemeColor, selectedRegion, onRegionSelect, onPriceUpdate }) => {
  return (
    <div className="space-y-6">
      {/* 区域选择器 */}
      {regions.length > 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h3 className="text-lg font-medium text-white mb-4">选择区域进行价格配置</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {regions.map((region) => {
              const activePrices = region.priceTable?.prices?.filter(p => p.isActive) || [];
              const avgPrice = activePrices.length > 0 
                ? (activePrices.reduce((sum, p) => sum + p.price, 0) / activePrices.length).toFixed(2)
                : '0.00';
              
              return (
                <button
                  key={region.id}
                  onClick={() => onRegionSelect(region)}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    selectedRegion?.id === region.id
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-gray-600 bg-gray-700 hover:bg-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div 
                      className="px-2 py-1 rounded text-xs font-medium text-white text-center min-w-12"
                      style={{ backgroundColor: region.displayColor }}
                    >
                      L{region.level}
                    </div>
                    <span className="text-white font-medium text-sm truncate">{region.name}</span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="text-gray-300">
                      FSA: {region.fsaCodes?.length || 0}
                    </div>
                    <div className="text-gray-300">
                      价格: {activePrices.length}/13
                    </div>
                    <div className="text-green-400 font-medium">
                      平均: ${avgPrice}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 价格管理组件 */}
      <RegionPriceManager
        selectedRegion={selectedRegion}
        regionList={regions}
        onPriceUpdate={onPriceUpdate}
      />

      {/* 价格计算器演示 */}
      <PriceCalculatorDemo
        availableRegions={regions}
      />
    </div>
  );
};

// 数据统计标签页
const StatisticsTab = ({ city, regions }) => {
  const totalFSAs = regions.reduce((sum, r) => sum + (r.fsaCodes?.length || 0), 0);
  const totalPriceConfigs = regions.reduce((sum, r) => sum + (r.priceTable?.prices?.filter(p => p.isActive).length || 0), 0);
  const avgPriceConfigs = regions.length > 0 ? (totalPriceConfigs / regions.length).toFixed(1) : 0;
  
  const stats = [
    {
      label: '配送区域数',
      value: regions.length,
      icon: Layers,
      color: 'text-blue-400'
    },
    {
      label: '覆盖FSA总数',
      value: totalFSAs,
      icon: MapPin,
      color: 'text-green-400'
    },
    {
      label: '活跃价格配置',
      value: `${totalPriceConfigs} (平均${avgPriceConfigs}/区域)`,
      icon: DollarSign,
      color: 'text-yellow-400'
    },
    {
      label: '最后更新时间',
      value: city.metadata?.updatedAt
        ? new Date(city.metadata.updatedAt).toLocaleDateString('zh-CN')
        : '未知',
      icon: Clock,
      color: 'text-purple-400'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800 rounded-lg border border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <Icon className={`w-5 h-5 ${stat.color}`} />
              <TrendingUp className="w-4 h-4 text-gray-600" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-sm text-gray-400">{stat.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
};


export default CityView;