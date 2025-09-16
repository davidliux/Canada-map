/**
 * 定价上下文
 * 
 * 提供全局定价状态管理和操作，支持：
 * - 定价规则管理
 * - 区域选择状态
 * - 批量操作协调
 * - 实时数据同步
 * 
 * Tasks 36-39: 定价上下文管理
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, useMemo } from 'react';
import pricingService from '../services/pricingService.js';
import cityStorageService from '../utils/storage/cityStorage.js';

// 初始状态
const initialState = {
  // 当前选择
  selectedCityId: null,
  selectedRegionId: null,
  selectedRegionIds: new Set(),
  
  // 数据状态
  cities: [],
  currentCity: null,
  pricingRules: [],
  
  // 编辑状态
  isEditing: false,
  editingRuleId: null,
  isDirty: false,
  
  // UI状态
  viewMode: 'list', // 'list' | 'editor' | 'map'
  showBatchOperations: false,
  multiSelectMode: false,
  
  // 加载状态
  loading: {
    cities: false,
    regions: false,
    rules: false,
    saving: false
  },
  
  // 错误状态
  errors: [],
  warnings: [],
  
  // 历史记录
  history: [],
  historyIndex: -1
};

// Action类型
const ActionTypes = {
  // 数据加载
  LOAD_CITIES_START: 'LOAD_CITIES_START',
  LOAD_CITIES_SUCCESS: 'LOAD_CITIES_SUCCESS',
  LOAD_CITIES_ERROR: 'LOAD_CITIES_ERROR',
  
  LOAD_CITY_START: 'LOAD_CITY_START',
  LOAD_CITY_SUCCESS: 'LOAD_CITY_SUCCESS',
  LOAD_CITY_ERROR: 'LOAD_CITY_ERROR',
  
  LOAD_RULES_START: 'LOAD_RULES_START',
  LOAD_RULES_SUCCESS: 'LOAD_RULES_SUCCESS',
  LOAD_RULES_ERROR: 'LOAD_RULES_ERROR',
  
  // 选择操作
  SELECT_CITY: 'SELECT_CITY',
  SELECT_REGION: 'SELECT_REGION',
  SELECT_MULTIPLE_REGIONS: 'SELECT_MULTIPLE_REGIONS',
  CLEAR_SELECTION: 'CLEAR_SELECTION',
  
  // 编辑操作
  START_EDITING: 'START_EDITING',
  STOP_EDITING: 'STOP_EDITING',
  SET_DIRTY: 'SET_DIRTY',
  CLEAR_DIRTY: 'CLEAR_DIRTY',
  
  // UI状态
  SET_VIEW_MODE: 'SET_VIEW_MODE',
  TOGGLE_BATCH_OPERATIONS: 'TOGGLE_BATCH_OPERATIONS',
  TOGGLE_MULTI_SELECT: 'TOGGLE_MULTI_SELECT',
  
  // 规则管理
  ADD_RULE: 'ADD_RULE',
  UPDATE_RULE: 'UPDATE_RULE',
  DELETE_RULE: 'DELETE_RULE',
  
  // 错误处理
  ADD_ERROR: 'ADD_ERROR',
  CLEAR_ERRORS: 'CLEAR_ERRORS',
  ADD_WARNING: 'ADD_WARNING',
  CLEAR_WARNINGS: 'CLEAR_WARNINGS',
  
  // 历史记录
  PUSH_HISTORY: 'PUSH_HISTORY',
  UNDO: 'UNDO',
  REDO: 'REDO'
};

// Reducer函数
const pricingReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.LOAD_CITIES_START:
      return {
        ...state,
        loading: { ...state.loading, cities: true },
        errors: state.errors.filter(e => e.type !== 'cities')
      };
      
    case ActionTypes.LOAD_CITIES_SUCCESS:
      return {
        ...state,
        cities: action.payload,
        loading: { ...state.loading, cities: false }
      };
      
    case ActionTypes.LOAD_CITIES_ERROR:
      return {
        ...state,
        loading: { ...state.loading, cities: false },
        errors: [...state.errors, { type: 'cities', message: action.payload }]
      };
      
    case ActionTypes.LOAD_CITY_START:
      return {
        ...state,
        loading: { ...state.loading, regions: true },
        errors: state.errors.filter(e => e.type !== 'city')
      };
      
    case ActionTypes.LOAD_CITY_SUCCESS:
      return {
        ...state,
        currentCity: action.payload,
        loading: { ...state.loading, regions: false }
      };
      
    case ActionTypes.LOAD_CITY_ERROR:
      return {
        ...state,
        loading: { ...state.loading, regions: false },
        errors: [...state.errors, { type: 'city', message: action.payload }]
      };
      
    case ActionTypes.LOAD_RULES_START:
      return {
        ...state,
        loading: { ...state.loading, rules: true },
        errors: state.errors.filter(e => e.type !== 'rules')
      };
      
    case ActionTypes.LOAD_RULES_SUCCESS:
      return {
        ...state,
        pricingRules: action.payload,
        loading: { ...state.loading, rules: false }
      };
      
    case ActionTypes.LOAD_RULES_ERROR:
      return {
        ...state,
        loading: { ...state.loading, rules: false },
        errors: [...state.errors, { type: 'rules', message: action.payload }]
      };
      
    case ActionTypes.SELECT_CITY:
      return {
        ...state,
        selectedCityId: action.payload,
        selectedRegionId: null,
        selectedRegionIds: new Set(),
        currentCity: null
      };
      
    case ActionTypes.SELECT_REGION:
      return {
        ...state,
        selectedRegionId: action.payload,
        selectedRegionIds: action.payload ? new Set([action.payload]) : new Set()
      };
      
    case ActionTypes.SELECT_MULTIPLE_REGIONS:
      return {
        ...state,
        selectedRegionIds: new Set(action.payload),
        selectedRegionId: action.payload.length === 1 ? action.payload[0] : null
      };
      
    case ActionTypes.CLEAR_SELECTION:
      return {
        ...state,
        selectedCityId: null,
        selectedRegionId: null,
        selectedRegionIds: new Set(),
        currentCity: null
      };
      
    case ActionTypes.START_EDITING:
      return {
        ...state,
        isEditing: true,
        editingRuleId: action.payload
      };
      
    case ActionTypes.STOP_EDITING:
      return {
        ...state,
        isEditing: false,
        editingRuleId: null,
        isDirty: false
      };
      
    case ActionTypes.SET_DIRTY:
      return {
        ...state,
        isDirty: true
      };
      
    case ActionTypes.CLEAR_DIRTY:
      return {
        ...state,
        isDirty: false
      };
      
    case ActionTypes.SET_VIEW_MODE:
      return {
        ...state,
        viewMode: action.payload
      };
      
    case ActionTypes.TOGGLE_BATCH_OPERATIONS:
      return {
        ...state,
        showBatchOperations: !state.showBatchOperations
      };
      
    case ActionTypes.TOGGLE_MULTI_SELECT:
      return {
        ...state,
        multiSelectMode: !state.multiSelectMode,
        selectedRegionIds: new Set()
      };
      
    case ActionTypes.ADD_RULE:
      return {
        ...state,
        pricingRules: [...state.pricingRules, action.payload]
      };
      
    case ActionTypes.UPDATE_RULE:
      return {
        ...state,
        pricingRules: state.pricingRules.map(rule =>
          rule.id === action.payload.id ? { ...rule, ...action.payload } : rule
        )
      };
      
    case ActionTypes.DELETE_RULE:
      return {
        ...state,
        pricingRules: state.pricingRules.filter(rule => rule.id !== action.payload)
      };
      
    case ActionTypes.ADD_ERROR:
      return {
        ...state,
        errors: [...state.errors, action.payload]
      };
      
    case ActionTypes.CLEAR_ERRORS:
      return {
        ...state,
        errors: action.payload ? state.errors.filter(e => e.type !== action.payload) : []
      };
      
    case ActionTypes.ADD_WARNING:
      return {
        ...state,
        warnings: [...state.warnings, action.payload]
      };
      
    case ActionTypes.CLEAR_WARNINGS:
      return {
        ...state,
        warnings: action.payload ? state.warnings.filter(w => w.type !== action.payload) : []
      };
      
    case ActionTypes.PUSH_HISTORY:
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      return {
        ...state,
        history: [...newHistory, action.payload],
        historyIndex: newHistory.length
      };
      
    case ActionTypes.UNDO:
      if (state.historyIndex > 0) {
        const previousState = state.history[state.historyIndex - 1];
        return {
          ...state,
          ...previousState,
          historyIndex: state.historyIndex - 1
        };
      }
      return state;
      
    case ActionTypes.REDO:
      if (state.historyIndex < state.history.length - 1) {
        const nextState = state.history[state.historyIndex + 1];
        return {
          ...state,
          ...nextState,
          historyIndex: state.historyIndex + 1
        };
      }
      return state;
      
    default:
      return state;
  }
};

// 创建上下文
const PricingContext = createContext();

/**
 * 定价提供者组件
 */
export const PricingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(pricingReducer, initialState);

  // 加载城市列表
  const loadCities = useCallback(async () => {
    dispatch({ type: ActionTypes.LOAD_CITIES_START });
    
    try {
      const cities = await cityStorageService.getAllCities();
      dispatch({ type: ActionTypes.LOAD_CITIES_SUCCESS, payload: cities });
    } catch (error) {
      console.error('加载城市列表失败:', error);
      dispatch({ type: ActionTypes.LOAD_CITIES_ERROR, payload: error.message });
    }
  }, []);

  // 加载城市详情
  const loadCity = useCallback(async (cityId) => {
    if (!cityId) return;
    
    dispatch({ type: ActionTypes.LOAD_CITY_START });
    
    try {
      const city = await cityStorageService.getCity(cityId);
      dispatch({ type: ActionTypes.LOAD_CITY_SUCCESS, payload: city });
    } catch (error) {
      console.error('加载城市详情失败:', error);
      dispatch({ type: ActionTypes.LOAD_CITY_ERROR, payload: error.message });
    }
  }, []);

  // 加载定价规则
  const loadPricingRules = useCallback(async (cityId) => {
    if (!cityId) return;
    
    dispatch({ type: ActionTypes.LOAD_RULES_START });
    
    try {
      const rules = await pricingService.getCityPricingRules(cityId);
      dispatch({ type: ActionTypes.LOAD_RULES_SUCCESS, payload: rules });
    } catch (error) {
      console.error('加载定价规则失败:', error);
      dispatch({ type: ActionTypes.LOAD_RULES_ERROR, payload: error.message });
    }
  }, []);

  // 选择操作
  const selectCity = useCallback((cityId) => {
    dispatch({ type: ActionTypes.SELECT_CITY, payload: cityId });
    if (cityId) {
      loadCity(cityId);
      loadPricingRules(cityId);
    }
  }, [loadCity, loadPricingRules]);

  const selectRegion = useCallback((regionId) => {
    dispatch({ type: ActionTypes.SELECT_REGION, payload: regionId });
  }, []);

  const selectMultipleRegions = useCallback((regionIds) => {
    dispatch({ type: ActionTypes.SELECT_MULTIPLE_REGIONS, payload: regionIds });
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_SELECTION });
  }, []);

  // 编辑操作
  const startEditing = useCallback((ruleId = null) => {
    dispatch({ type: ActionTypes.START_EDITING, payload: ruleId });
  }, []);

  const stopEditing = useCallback(() => {
    dispatch({ type: ActionTypes.STOP_EDITING });
  }, []);

  const setDirty = useCallback((isDirty = true) => {
    if (isDirty) {
      dispatch({ type: ActionTypes.SET_DIRTY });
    } else {
      dispatch({ type: ActionTypes.CLEAR_DIRTY });
    }
  }, []);

  // UI操作
  const setViewMode = useCallback((mode) => {
    dispatch({ type: ActionTypes.SET_VIEW_MODE, payload: mode });
  }, []);

  const toggleBatchOperations = useCallback(() => {
    dispatch({ type: ActionTypes.TOGGLE_BATCH_OPERATIONS });
  }, []);

  const toggleMultiSelect = useCallback(() => {
    dispatch({ type: ActionTypes.TOGGLE_MULTI_SELECT });
  }, []);

  // 规则管理
  const addRule = useCallback(async (rule) => {
    try {
      const newRule = await pricingService.createRule(rule);
      dispatch({ type: ActionTypes.ADD_RULE, payload: newRule });
      return newRule;
    } catch (error) {
      console.error('添加规则失败:', error);
      dispatch({ type: ActionTypes.ADD_ERROR, payload: { type: 'rules', message: error.message } });
      throw error;
    }
  }, []);

  const updateRule = useCallback(async (ruleId, updates) => {
    try {
      const updatedRule = await pricingService.updateRule(ruleId, updates);
      dispatch({ type: ActionTypes.UPDATE_RULE, payload: updatedRule });
      return updatedRule;
    } catch (error) {
      console.error('更新规则失败:', error);
      dispatch({ type: ActionTypes.ADD_ERROR, payload: { type: 'rules', message: error.message } });
      throw error;
    }
  }, []);

  const deleteRule = useCallback(async (ruleId) => {
    try {
      await pricingService.deleteRule(ruleId);
      dispatch({ type: ActionTypes.DELETE_RULE, payload: ruleId });
    } catch (error) {
      console.error('删除规则失败:', error);
      dispatch({ type: ActionTypes.ADD_ERROR, payload: { type: 'rules', message: error.message } });
      throw error;
    }
  }, []);

  // 批量操作
  const performBatchOperation = useCallback(async (operation, data) => {
    try {
      // 记录操作前状态
      dispatch({ 
        type: ActionTypes.PUSH_HISTORY, 
        payload: { 
          pricingRules: state.pricingRules,
          selectedRegionIds: state.selectedRegionIds 
        }
      });

      switch (operation) {
        case 'bulkEdit':
          // 批量编辑实现
          break;
        case 'copyPricing':
          // 复制定价实现
          break;
        case 'delete':
          // 批量删除实现
          break;
        default:
          throw new Error(`未知的批量操作: ${operation}`);
      }
    } catch (error) {
      console.error('批量操作失败:', error);
      dispatch({ type: ActionTypes.ADD_ERROR, payload: { type: 'batch', message: error.message } });
      throw error;
    }
  }, [state.pricingRules, state.selectedRegionIds]);

  // 错误处理
  const clearErrors = useCallback((type = null) => {
    dispatch({ type: ActionTypes.CLEAR_ERRORS, payload: type });
  }, []);

  const addError = useCallback((error) => {
    dispatch({ type: ActionTypes.ADD_ERROR, payload: error });
  }, []);

  const clearWarnings = useCallback((type = null) => {
    dispatch({ type: ActionTypes.CLEAR_WARNINGS, payload: type });
  }, []);

  const addWarning = useCallback((warning) => {
    dispatch({ type: ActionTypes.ADD_WARNING, payload: warning });
  }, []);

  // 历史记录操作
  const undo = useCallback(() => {
    dispatch({ type: ActionTypes.UNDO });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: ActionTypes.REDO });
  }, []);

  // 初始化加载
  useEffect(() => {
    loadCities();
  }, [loadCities]);

  // 计算派生状态
  const derivedState = useMemo(() => ({
    // 当前选中的区域数据
    selectedRegions: state.currentCity?.regions?.filter(region => 
      state.selectedRegionIds.has(region.id)
    ) || [],
    
    // 是否有选择
    hasSelection: state.selectedCityId !== null,
    hasRegionSelection: state.selectedRegionId !== null || state.selectedRegionIds.size > 0,
    
    // 是否可以执行操作
    canUndo: state.historyIndex > 0,
    canRedo: state.historyIndex < state.history.length - 1,
    canSave: state.isDirty && !state.loading.saving,
    
    // 错误状态
    hasErrors: state.errors.length > 0,
    hasWarnings: state.warnings.length > 0,
    
    // 加载状态
    isLoading: Object.values(state.loading).some(loading => loading)
  }), [state]);

  // 提供的值
  const contextValue = {
    // 状态
    ...state,
    ...derivedState,
    
    // 数据加载方法
    loadCities,
    loadCity,
    loadPricingRules,
    
    // 选择方法
    selectCity,
    selectRegion,
    selectMultipleRegions,
    clearSelection,
    
    // 编辑方法
    startEditing,
    stopEditing,
    setDirty,
    
    // UI方法
    setViewMode,
    toggleBatchOperations,
    toggleMultiSelect,
    
    // 规则管理方法
    addRule,
    updateRule,
    deleteRule,
    performBatchOperation,
    
    // 错误处理方法
    clearErrors,
    addError,
    clearWarnings,
    addWarning,
    
    // 历史记录方法
    undo,
    redo
  };

  return (
    <PricingContext.Provider value={contextValue}>
      {children}
    </PricingContext.Provider>
  );
};

/**
 * 使用定价上下文的Hook
 */
export const usePricing = () => {
  const context = useContext(PricingContext);
  
  if (context === undefined) {
    throw new Error('usePricing must be used within a PricingProvider');
  }
  
  return context;
};

export default PricingContext;