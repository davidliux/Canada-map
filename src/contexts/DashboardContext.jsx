import React, { createContext, useReducer, useContext, useEffect } from 'react';
import dashboardReducer from '../reducers/dashboardReducer';
import { cityApi, zoneApi } from '../services/truckDeliveryApi';
import { completeFSAData } from '../data/canadaFSAData';

// 初始状态
const initialState = {
  // 城市相关
  cities: [],
  selectedCity: null,
  cityRegions: [],

  // FSA相关
  highlightedFSAs: [],
  allConfiguredFSAs: [],

  // 搜索相关
  searchQuery: '',
  searchHistory: [],

  // 统计数据
  stats: {
    totalCities: 0,
    totalRegions: 0,
    totalFSAs: 0,
    activeProvinces: 0,
    coverageRate: 0,
    dailyDeliveries: 0,
    activeDrivers: 0,
    avgDeliveryTime: 0
  },

  // UI状态
  loading: false,
  error: null,
  expandedRegions: [], // 展开的区域ID列表
  selectedRegion: null,
  selectedFSAGroup: null
};

// 创建Context
const DashboardContext = createContext(null);

// Provider组件
export const DashboardProvider = ({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  // 加载城市数据
  const loadCities = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      console.log('开始加载城市数据...');
      const citiesData = await cityApi.getAll(true);
      console.log('API返回的城市数据:', citiesData);

      // 对于每个城市，获取其详细的区域信息
      const citiesWithRegions = await Promise.all(
        citiesData.map(async (city) => {
          try {
            console.log(`获取城市 ${city.name} 的详细信息...`);
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

      // 计算统计数据
      const totalRegions = citiesWithRegions.reduce((sum, city) => sum + (city.totalRegions || 0), 0);
      const totalFSAs = uniqueFSAs.length;
      const provinces = new Set(citiesWithRegions.map(c => c.province));
      const coverageRate = completeFSAData.length > 0
        ? (totalFSAs / completeFSAData.length * 100).toFixed(1)
        : 0;

      const stats = {
        totalCities: citiesWithRegions.length,
        totalRegions,
        totalFSAs,
        activeProvinces: provinces.size,
        coverageRate: parseFloat(coverageRate),
        dailyDeliveries: Math.floor(Math.random() * 2000) + 1000,
        activeDrivers: Math.floor(Math.random() * 100) + 50,
        avgDeliveryTime: (Math.random() * 2 + 1).toFixed(1)
      };

      dispatch({ type: 'SET_CITIES', payload: citiesWithRegions });
      dispatch({ type: 'SET_ALL_CONFIGURED_FSAS', payload: uniqueFSAs });
      dispatch({ type: 'SET_STATS', payload: stats });
    } catch (err) {
      console.error('加载城市数据失败:', err);
      dispatch({ type: 'SET_ERROR', payload: '无法加载城市数据，请检查后端服务是否运行' });

      // 尝试从localStorage加载备用数据
      const fallbackData = localStorage.getItem('truck_delivery_cities');
      if (fallbackData) {
        try {
          const parsedCities = JSON.parse(fallbackData);
          dispatch({ type: 'SET_CITIES', payload: parsedCities });
          console.log('已从本地缓存加载备用数据');
        } catch (parseErr) {
          console.error('解析本地数据失败:', parseErr);
        }
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // 选择城市
  const selectCity = async (city) => {
    console.log('选择城市:', city);
    dispatch({ type: 'SELECT_CITY', payload: city });

    if (!city) {
      dispatch({ type: 'SET_CITY_REGIONS', payload: [] });
      dispatch({ type: 'SET_HIGHLIGHTED_FSAS', payload: [] });
      return;
    }

    try {
      let regions = [];
      let allFSAs = [];

      if (city.regions && city.regions.length > 0) {
        regions = city.regions;
        city.regions.forEach(region => {
          const fsaCodes = region.fsaCodes || region.fsa_codes || region.fsaList || [];
          if (fsaCodes && fsaCodes.length > 0) {
            allFSAs.push(...fsaCodes);
          }
        });
      } else {
        // 从API获取区域数据
        const zones = await zoneApi.getByCityId(city.id);
        regions = zones;
        zones.forEach(zone => {
          const fsaCodes = zone.fsa_codes || zone.fsaCodes || [];
          if (fsaCodes && fsaCodes.length > 0) {
            allFSAs.push(...fsaCodes);
          }
        });
      }

      console.log('高亮的FSA列表:', allFSAs);
      dispatch({ type: 'SET_CITY_REGIONS', payload: regions });
      dispatch({ type: 'SET_HIGHLIGHTED_FSAS', payload: allFSAs });
    } catch (err) {
      console.error('加载城市区域数据失败:', err);
      dispatch({ type: 'SET_CITY_REGIONS', payload: [] });
      dispatch({ type: 'SET_HIGHLIGHTED_FSAS', payload: [] });
    }
  };

  // 切换区域展开状态
  const toggleRegionExpand = (regionId) => {
    dispatch({ type: 'TOGGLE_REGION_EXPAND', payload: regionId });
  };

  // 高亮FSA分组
  const highlightFSAGroup = (fsaList) => {
    dispatch({ type: 'HIGHLIGHT_FSA_GROUP', payload: fsaList });
  };

  // 设置搜索查询
  const setSearchQuery = (query) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  };

  // 添加搜索历史
  const addSearchHistory = (item) => {
    dispatch({ type: 'ADD_SEARCH_HISTORY', payload: item });
  };

  // 初始化加载数据
  useEffect(() => {
    loadCities();
  }, []);

  // Context值
  const value = {
    state,
    dispatch,
    actions: {
      loadCities,
      selectCity,
      toggleRegionExpand,
      highlightFSAGroup,
      setSearchQuery,
      addSearchHistory
    }
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

// 自定义Hook
export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
};

export default DashboardContext;