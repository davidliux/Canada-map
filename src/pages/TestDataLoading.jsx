import React, { useState, useEffect } from 'react';
import truckDeliveryApi from '../services/truckDeliveryApi';

const TestDataLoading = () => {
  const [data, setData] = useState({
    cities: [],
    zones: [],
    groups: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('开始加载数据...');

      // 1. 加载城市
      console.log('正在加载城市...');
      const cities = await truckDeliveryApi.cities.getAll(true);
      console.log('城市数据:', cities);

      if (cities && cities.length > 0) {
        // 2. 加载第一个城市的区域
        const firstCity = cities[0];
        console.log('正在加载区域...', firstCity.id);
        const zones = await truckDeliveryApi.zones.getByCityId(firstCity.id);
        console.log('区域数据:', zones);

        if (zones && zones.length > 0) {
          // 3. 加载第一个区域的分组
          const firstZone = zones[0];
          console.log('正在加载分组...', firstZone.id);
          const groupsResponse = await truckDeliveryApi.groups.getByZoneId(firstZone.id);
          console.log('分组数据:', groupsResponse);

          setData({
            cities,
            zones,
            groups: groupsResponse.data || [],
            loading: false,
            error: null
          });
        } else {
          setData({
            cities,
            zones: [],
            groups: [],
            loading: false,
            error: null
          });
        }
      } else {
        setData({
          cities: [],
          zones: [],
          groups: [],
          loading: false,
          error: '没有找到城市数据'
        });
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  if (data.loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4">正在加载数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">数据加载测试</h1>

      {data.error && (
        <div className="bg-red-600/20 border border-red-500 rounded-lg p-4 mb-6">
          <p className="text-red-400">错误: {data.error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* 城市数据 */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-blue-400">
            城市数据 ({data.cities.length} 个)
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {data.cities.map(city => (
              <div key={city.id} className="bg-gray-800 rounded p-3">
                <div className="font-medium">{city.name}</div>
                <div className="text-sm text-gray-400">ID: {city.id}</div>
                <div className="text-sm text-gray-400">省份: {city.province}</div>
                <div className="text-sm text-gray-400">
                  区域数: {city.total_zones || city.zones?.length || 0}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 区域数据 */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-green-400">
            区域数据 ({data.zones.length} 个)
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {data.zones.map(zone => (
              <div key={zone.id} className="bg-gray-800 rounded p-3">
                <div className="font-medium">{zone.name}</div>
                <div className="text-sm text-gray-400">ID: {zone.id}</div>
                <div className="text-sm text-gray-400">级别: {zone.level}</div>
                <div className="text-sm text-gray-400">
                  FSA: {zone.fsa_codes?.substring(0, 50)}...
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 分组数据 */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-purple-400">
            分组数据 ({data.groups.length} 个)
          </h2>
          <div className="space-y-2">
            {data.groups.map(group => (
              <div key={group.id} className="bg-gray-800 rounded p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{group.name}</div>
                  <div className="text-sm text-gray-400">FSA: {group.fsa_codes}</div>
                </div>
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: group.display_color || '#666' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={loadData}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
        >
          重新加载
        </button>
      </div>
    </div>
  );
};

export default TestDataLoading;