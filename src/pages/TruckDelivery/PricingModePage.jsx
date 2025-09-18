import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Calculator, TrendingUp, Save } from 'lucide-react';
import PricingModeSelector from '../../components/pricing/PricingModeSelector';
import PriceCalculator from '../../components/pricing/PriceCalculator';
import { cityStorageService } from '../../utils/storage/cityStorage';

const PricingModePage = () => {
  const { cityId } = useParams();
  const navigate = useNavigate();
  const [selectedZone, setSelectedZone] = useState(null);
  const [cityData, setCityData] = useState(null);
  const [activeTab, setActiveTab] = useState('config');

  useEffect(() => {
    loadCityData();
  }, [cityId]);

  const loadCityData = async () => {
    try {
      const cities = cityStorageService.getCities();
      const city = cities.find(c => c.id === cityId);

      if (city) {
        setCityData(city);
        // 默认选择第一个区域
        if (city.regions && city.regions.length > 0) {
          setSelectedZone(city.regions[0].id);
        }
      } else {
        console.error('City not found:', cityId);
      }
    } catch (error) {
      console.error('Error loading city data:', error);
    }
  };

  const handleZoneChange = (zoneId) => {
    setSelectedZone(zoneId);
  };

  const handleModeChange = (mode, config) => {
    console.log('Mode changed:', mode, config);
    // 这里可以添加额外的处理逻辑
  };

  if (!cityData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
        <div className="text-center text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* 顶部导航栏 */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/management/truck-delivery')}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">定价模式管理</h1>
                <p className="text-sm text-gray-400 mt-1">
                  {cityData.name} - 灵活定价配置
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-400">
                <span className="text-gray-500">城市：</span>
                <span className="text-white font-medium ml-1">{cityData.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 区域选择器 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">选择配送区域</label>
          <div className="flex flex-wrap gap-2">
            {cityData.regions?.map((region) => (
              <button
                key={region.id}
                onClick={() => handleZoneChange(region.id)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  selectedZone === region.id
                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
                style={{
                  borderLeft: `4px solid ${region.color || '#6B7280'}`
                }}
              >
                <span className="font-medium">{region.name}</span>
                <span className="ml-2 text-xs opacity-75">
                  {region.level}区
                </span>
              </button>
            ))}
          </div>
        </div>

        {selectedZone && (
          <>
            {/* 标签页切换 */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab('config')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  activeTab === 'config'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <Settings className="w-4 h-4" />
                模式配置
              </button>
              <button
                onClick={() => setActiveTab('calculator')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  activeTab === 'calculator'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <Calculator className="w-4 h-4" />
                价格计算
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                价格分析
              </button>
            </div>

            {/* 内容区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeTab === 'config' && (
                <>
                  <PricingModeSelector
                    cityId={cityId}
                    zoneId={selectedZone}
                    onModeChange={handleModeChange}
                    className="lg:col-span-2"
                  />
                </>
              )}

              {activeTab === 'calculator' && (
                <>
                  <PriceCalculator
                    cityId={cityId}
                    zoneId={selectedZone}
                  />
                  <div className="bg-gray-900 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">快速报价</h3>

                    {/* 客户信息输入 */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">客户名称</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                          placeholder="输入客户名称"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">联系方式</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                          placeholder="输入联系电话或邮箱"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">备注</label>
                        <textarea
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                          rows="3"
                          placeholder="输入备注信息"
                        />
                      </div>

                      <button className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 flex items-center justify-center gap-2">
                        <Save className="w-4 h-4" />
                        生成报价单
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'analytics' && (
                <div className="lg:col-span-2">
                  <div className="bg-gray-900 rounded-xl p-8">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-400 mb-2">价格分析</h3>
                      <p className="text-sm text-gray-500">
                        价格趋势分析和优化建议功能即将推出
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 底部信息 */}
            <div className="mt-8 p-4 bg-gray-900/50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-400">
                  当前区域：
                  <span className="text-white font-medium ml-2">
                    {cityData.regions?.find(r => r.id === selectedZone)?.name}
                  </span>
                </div>
                <div className="text-gray-400">
                  配送范围：
                  <span className="text-white font-medium ml-2">
                    {cityData.regions?.find(r => r.id === selectedZone)?.fsaCodes?.length || 0} 个FSA
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PricingModePage;