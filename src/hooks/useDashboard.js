import { useContext, useMemo, useCallback } from 'react';
import DashboardContext from '../contexts/DashboardContext';

/**
 * Dashboard 自定义 Hooks 集合
 * 封装常用的数据获取和操作逻辑
 * Requirements: 设计2.5.2
 */

// 主要的Dashboard Hook (已在Context中导出，这里做增强)
export const useDashboardEnhanced = () => {
  const { state, actions } = useContext(DashboardContext);

  // 计算派生状态
  const derivedState = useMemo(() => ({
    hasSelectedCity: !!state.selectedCity,
    hasRegions: state.cityRegions.length > 0,
    hasFSAs: state.highlightedFSAs.length > 0,
    isLoading: state.loading,
    hasError: !!state.error,
    totalExpandedRegions: state.expandedRegions.length
  }), [state]);

  return {
    ...state,
    ...derivedState,
    ...actions
  };
};

// 获取区域数据的Hook
export const useRegionData = (cityId) => {
  const { state } = useContext(DashboardContext);

  const regionData = useMemo(() => {
    if (!cityId || !state.selectedCity || state.selectedCity.id !== cityId) {
      return {
        regions: [],
        totalFSAs: 0,
        regionCount: 0
      };
    }

    const regions = state.cityRegions;
    const totalFSAs = regions.reduce((sum, region) => {
      const fsaCodes = region.fsaCodes || region.fsa_codes || [];
      return sum + fsaCodes.length;
    }, 0);

    return {
      regions,
      totalFSAs,
      regionCount: regions.length
    };
  }, [cityId, state.selectedCity, state.cityRegions]);

  return regionData;
};

// 获取城市统计的Hook
export const useCityStats = () => {
  const { state } = useContext(DashboardContext);

  const cityStats = useMemo(() => {
    const cities = state.cities;
    const provinceMap = {};

    cities.forEach(city => {
      const province = city.province || 'Unknown';
      if (!provinceMap[province]) {
        provinceMap[province] = {
          name: province,
          cities: [],
          totalRegions: 0,
          totalFSAs: 0
        };
      }
      provinceMap[province].cities.push(city);
      provinceMap[province].totalRegions += city.totalRegions || 0;
      provinceMap[province].totalFSAs += city.totalFSAs || 0;
    });

    return {
      byProvince: Object.values(provinceMap),
      totalProvinces: Object.keys(provinceMap).length,
      topCities: cities
        .sort((a, b) => (b.totalFSAs || 0) - (a.totalFSAs || 0))
        .slice(0, 5)
    };
  }, [state.cities]);

  return cityStats;
};

// 搜索功能Hook
export const useSearch = () => {
  const { state, actions } = useContext(DashboardContext);

  const searchResults = useMemo(() => {
    if (!state.searchQuery) return [];

    const query = state.searchQuery.toLowerCase();
    const results = [];

    // 搜索城市
    state.cities.forEach(city => {
      const cityName = (city.name || '').toLowerCase();
      const province = (city.province || '').toLowerCase();

      if (cityName.includes(query) || province.includes(query)) {
        results.push({
          type: 'city',
          value: city.name,
          data: city,
          label: `${city.name}, ${city.province}`
        });
      }

      // 搜索FSA
      if (city.regions) {
        city.regions.forEach(region => {
          const fsaCodes = region.fsaCodes || region.fsa_codes || [];
          fsaCodes.forEach(fsa => {
            if (fsa.toLowerCase().includes(query)) {
              results.push({
                type: 'fsa',
                value: fsa,
                data: { cityInfo: city, region },
                label: `FSA: ${fsa} (${city.name})`
              });
            }
          });
        });
      }
    });

    return results.slice(0, 20); // 限制返回结果数量
  }, [state.searchQuery, state.cities]);

  const search = useCallback((query) => {
    actions.setSearchQuery(query);
  }, [actions]);

  const clearSearch = useCallback(() => {
    actions.setSearchQuery('');
  }, [actions]);

  return {
    query: state.searchQuery,
    results: searchResults,
    history: state.searchHistory,
    search,
    clearSearch,
    addToHistory: actions.addSearchHistory
  };
};

// FSA高亮管理Hook
export const useFSAHighlight = () => {
  const { state, dispatch } = useContext(DashboardContext);

  const highlightFSAs = useCallback((fsaList) => {
    dispatch({ type: 'SET_HIGHLIGHTED_FSAS', payload: fsaList });
  }, [dispatch]);

  const clearHighlight = useCallback(() => {
    dispatch({ type: 'SET_HIGHLIGHTED_FSAS', payload: [] });
  }, [dispatch]);

  const toggleFSA = useCallback((fsa) => {
    const current = state.highlightedFSAs;
    const newList = current.includes(fsa)
      ? current.filter(f => f !== fsa)
      : [...current, fsa];
    dispatch({ type: 'SET_HIGHLIGHTED_FSAS', payload: newList });
  }, [state.highlightedFSAs, dispatch]);

  return {
    highlightedFSAs: state.highlightedFSAs,
    highlightFSAs,
    clearHighlight,
    toggleFSA,
    isHighlighted: (fsa) => state.highlightedFSAs.includes(fsa)
  };
};

// 区域展开管理Hook
export const useRegionExpansion = () => {
  const { state, actions } = useContext(DashboardContext);

  const isExpanded = useCallback((regionId) => {
    return state.expandedRegions.includes(regionId);
  }, [state.expandedRegions]);

  const expandAll = useCallback(() => {
    const allRegionIds = state.cityRegions.map(r => r.id);
    dispatch({ type: 'BATCH_UPDATE', payload: { expandedRegions: allRegionIds } });
  }, [state.cityRegions]);

  const collapseAll = useCallback(() => {
    dispatch({ type: 'BATCH_UPDATE', payload: { expandedRegions: [] } });
  }, []);

  return {
    expandedRegions: state.expandedRegions,
    isExpanded,
    toggleExpand: actions.toggleRegionExpand,
    expandAll,
    collapseAll
  };
};