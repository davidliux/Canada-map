/**
 * Dashboard Reducer
 * 处理所有Dashboard相关的状态更新逻辑
 * Requirements: 设计2.2.2
 */

const dashboardReducer = (state, action) => {
  switch (action.type) {
    // 城市相关
    case 'SET_CITIES':
      return {
        ...state,
        cities: action.payload
      };

    case 'SELECT_CITY':
      return {
        ...state,
        selectedCity: action.payload,
        selectedRegion: null,
        selectedFSAGroup: null,
        expandedRegions: []
      };

    case 'SET_CITY_REGIONS':
      return {
        ...state,
        cityRegions: action.payload
      };

    // FSA相关
    case 'SET_HIGHLIGHTED_FSAS':
      return {
        ...state,
        highlightedFSAs: action.payload
      };

    case 'SET_ALL_CONFIGURED_FSAS':
      return {
        ...state,
        allConfiguredFSAs: action.payload
      };

    case 'HIGHLIGHT_FSA_GROUP':
      return {
        ...state,
        highlightedFSAs: action.payload,
        selectedFSAGroup: action.payload
      };

    // 区域相关
    case 'SELECT_REGION':
      const region = action.payload;
      const fsaCodes = region?.fsaCodes || region?.fsa_codes || [];
      return {
        ...state,
        selectedRegion: region,
        highlightedFSAs: fsaCodes
      };

    case 'TOGGLE_REGION_EXPAND':
      const regionId = action.payload;
      const expandedRegions = state.expandedRegions.includes(regionId)
        ? state.expandedRegions.filter(id => id !== regionId)
        : [...state.expandedRegions, regionId];
      return {
        ...state,
        expandedRegions
      };

    // 搜索相关
    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload
      };

    case 'ADD_SEARCH_HISTORY':
      const newHistory = [action.payload, ...state.searchHistory.filter(
        item => item.value !== action.payload.value
      )].slice(0, 10); // 保留最近10条
      return {
        ...state,
        searchHistory: newHistory
      };

    case 'CLEAR_SEARCH_HISTORY':
      return {
        ...state,
        searchHistory: []
      };

    // 统计相关
    case 'SET_STATS':
      return {
        ...state,
        stats: action.payload
      };

    case 'UPDATE_STATS':
      return {
        ...state,
        stats: {
          ...state.stats,
          ...action.payload
        }
      };

    // UI状态
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };

    // 批量更新
    case 'BATCH_UPDATE':
      return {
        ...state,
        ...action.payload
      };

    // 重置状态
    case 'RESET':
      return {
        ...state,
        selectedCity: null,
        cityRegions: [],
        highlightedFSAs: [],
        selectedRegion: null,
        selectedFSAGroup: null,
        expandedRegions: [],
        searchQuery: '',
        error: null
      };

    case 'RESET_ALL':
      return action.payload; // 完全重置为初始状态

    default:
      console.warn(`Unhandled action type: ${action.type}`);
      return state;
  }
};

export default dashboardReducer;