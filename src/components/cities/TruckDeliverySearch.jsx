import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  MapPin, 
  Building2, 
  Package, 
  Clock,
  Zap,
  Loader2,
  Truck,
  Navigation,
  DollarSign,
  Hash,
  Layers
} from 'lucide-react';
import { cityStorageService } from '../../utils/storage/cityStorage.js';
import { completeFSAData } from '../../data/canadaFSAData.js';
import { fsaStatistics } from '../../data/fsaStats.js';
import { debouncedSearch, globalCache, performanceMonitor } from '../../utils/performanceOptimizer.js';

/**
 * 卡车配送搜索组件
 * 
 * 功能特性：
 * - 实时搜索城市、FSA、邮编
 * - 智能搜索建议和自动完成
 * - 高亮显示匹配文本
 * - 支持价格和区域层级信息显示
 * - 点击结果自动定位到地图
 * - 搜索历史记录
 */
const TruckDeliverySearch = ({ 
  onSearch, 
  onSelect, 
  onCityNavigation,
  placeholder = "搜索城市、FSA代码或邮编...",
  searchHistory = [],
  onHistoryUpdate,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  // 缓存城市数据和FSA索引
  const [citiesData, setCitiesData] = useState([]);
  const [fsaIndex, setFsaIndex] = useState({});

  // 预加载城市数据和FSA索引
  useEffect(() => {
    const loadData = async () => {
      try {
        // 加载城市数据
        const cities = await cityStorageService.getAllCities();
        setCitiesData(cities);

        // 获取FSA索引统计
        const fsaStats = cityStorageService.getFSAIndexStats();
        setFsaIndex(fsaStats.cityStats);

        console.log('🔍 搜索数据预加载完成:', {
          cities: cities.length,
          fsasMapped: Object.keys(fsaStats.cityStats).length
        });
      } catch (error) {
        console.error('预加载搜索数据失败:', error);
      }
    };

    loadData();
  }, []);

  // FSA到城市名映射缓存
  const fsaToCityNameMap = useMemo(() => {
    const map = new Map();
    citiesData.forEach(city => {
      // 通过FSA索引找到属于这个城市的FSA
      Object.keys(fsaIndex).forEach(fsa => {
        if (fsaIndex[fsa] && fsaIndex[fsa] === city.id) {
          map.set(fsa, city.name);
        }
      });
    });
    return map;
  }, [citiesData, fsaIndex]);

  /**
   * 高亮匹配文本
   */
  const highlightMatch = (text, searchTerm) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-400 text-black px-0.5 rounded">
          {part}
        </span>
      ) : part
    );
  };

  /**
   * 智能搜索函数
   */
  const performSmartSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const cacheKey = `truck-search:${searchQuery}`;
    const cachedResult = globalCache.get(cacheKey);
    if (cachedResult) {
      setSuggestions(cachedResult);
      setShowSuggestions(cachedResult.length > 0);
      return;
    }

    setIsLoading(true);
    performanceMonitor.startTimer(`truck-search-${searchQuery}`);

    try {
      const query = searchQuery.toLowerCase();
      const results = [];

      // 1. 搜索城市名称
      citiesData.forEach(city => {
        if (city.name.toLowerCase().includes(query)) {
          results.push({
            id: `city-${city.id}`,
            type: 'city',
            value: city.name,
            label: `${city.name}`,
            sublabel: `${city.province} • ${city.regionCount}区域 • ${city.totalFSAs}个FSA`,
            icon: Building2,
            color: city.themeColor || '#3B82F6',
            data: city,
            score: city.name.toLowerCase().indexOf(query) === 0 ? 100 : 50 // 优先匹配开头
          });
        }
      });

      // 2. 搜索FSA代码
      const upperQuery = query.toUpperCase();
      completeFSAData.forEach(fsa => {
        if (fsa.includes(upperQuery)) {
          const cityName = fsaToCityNameMap.get(fsa) || '未分配城市';
          const cityInfo = citiesData.find(c => c.name === cityName);
          
          // 获取省份信息
          let province = '未知省份';
          const firstChar = fsa.charAt(0);
          if (fsaStatistics.byProvince) {
            for (const [code, info] of Object.entries(fsaStatistics.byProvince)) {
              if (info.prefix.includes(firstChar)) {
                province = info.name;
                break;
              }
            }
          }

          results.push({
            id: `fsa-${fsa}`,
            type: 'fsa',
            value: fsa,
            label: `FSA ${fsa}`,
            sublabel: `${cityName} • ${province}`,
            icon: MapPin,
            color: cityInfo?.themeColor || '#10B981',
            data: { fsa, cityName, cityInfo },
            score: fsa.indexOf(upperQuery) === 0 ? 90 : 40
          });
        }
      });

      // 3. 搜索完整邮编（模拟）
      if (query.length >= 6) {
        const fsaPrefix = query.substring(0, 3).toUpperCase();
        if (completeFSAData.includes(fsaPrefix)) {
          const cityName = fsaToCityNameMap.get(fsaPrefix) || '未分配城市';
          const cityInfo = citiesData.find(c => c.name === cityName);
          
          results.push({
            id: `postal-${query}`,
            type: 'postal',
            value: query.toUpperCase(),
            label: `邮编 ${query.toUpperCase()}`,
            sublabel: `${cityName} • FSA: ${fsaPrefix}`,
            icon: Package,
            color: cityInfo?.themeColor || '#F59E0B',
            data: { postalCode: query.toUpperCase(), fsa: fsaPrefix, cityName, cityInfo },
            score: 80
          });
        }
      }

      // 4. 按省份搜索
      if (fsaStatistics.byProvince) {
        Object.entries(fsaStatistics.byProvince).forEach(([code, info]) => {
          if (info.name.includes(query) || code.toLowerCase().includes(query)) {
            results.push({
              id: `province-${code}`,
              type: 'province',
              value: info.name,
              label: `${info.name} (${code})`,
              sublabel: `可送达 ${info.deliverable}/${info.total} 个FSA • 覆盖率 ${info.coverage}%`,
              icon: Layers,
              color: info.color || '#8B5CF6',
              data: info,
              score: 30
            });
          }
        });
      }

      // 按相关性排序
      results.sort((a, b) => b.score - a.score);

      // 限制结果数量
      const limitedResults = results.slice(0, 8);

      // 缓存结果
      globalCache.set(cacheKey, limitedResults, 5 * 60 * 1000); // 5分钟缓存

      setSuggestions(limitedResults);
      setShowSuggestions(limitedResults.length > 0);
    } catch (error) {
      console.error('搜索失败:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
      performanceMonitor.endTimer(`truck-search-${searchQuery}`);
    }
  }, [citiesData, fsaToCityNameMap]);

  // 防抖搜索
  const debouncedSearchFunction = useCallback(
    (query) => debouncedSearch(query, performSmartSearch),
    [performSmartSearch]
  );

  // 处理输入变化
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    
    if (onSearch) {
      onSearch(value);
    }
    
    debouncedSearchFunction(value);
  };

  // 处理键盘事件
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelect(suggestions[selectedIndex]);
        } else if (query.trim()) {
          handleSelect({ 
            type: 'search', 
            value: query, 
            label: query,
            data: { query: query.trim() }
          });
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // 处理选择建议
  const handleSelect = (suggestion) => {
    setQuery(suggestion.value);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    // 更新搜索历史
    if (onHistoryUpdate && !searchHistory.find(item => item.value === suggestion.value)) {
      const historyItem = {
        ...suggestion,
        timestamp: Date.now()
      };
      onHistoryUpdate([historyItem, ...searchHistory.slice(0, 4)]);
    }
    
    // 根据类型执行不同操作
    if (suggestion.type === 'city' && onCityNavigation) {
      onCityNavigation(suggestion.data);
    }
    
    if (onSelect) {
      onSelect(suggestion);
    }
  };

  // 清除搜索
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    if (onSearch) {
      onSearch('');
    }
  };

  // 获取结果类型图标和样式
  const getResultTypeIcon = (type) => {
    switch (type) {
      case 'city': return Building2;
      case 'fsa': return MapPin;
      case 'postal': return Package;
      case 'province': return Layers;
      default: return Search;
    }
  };

  const getResultTypeLabel = (type) => {
    switch (type) {
      case 'city': return '城市';
      case 'fsa': return 'FSA';
      case 'postal': return '邮编';
      case 'province': return '省份';
      default: return '搜索';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* 搜索框容器 */}
      <motion.div
        className={`
          relative bg-gray-800 rounded-lg transition-all duration-300
          ${isFocused 
            ? 'ring-2 ring-blue-500 ring-opacity-50 shadow-lg shadow-blue-500/20 scale-105' 
            : 'ring-1 ring-gray-600'
          }
        `}
        whileHover={{ scale: 1.02 }}
      >
        {/* 动画边框效果 */}
        <motion.div
          className="absolute inset-0 rounded-lg"
          animate={{
            background: isFocused 
              ? 'linear-gradient(45deg, #3B82F6, #06B6D4, #10B981, #3B82F6)' 
              : 'transparent'
          }}
          style={{
            backgroundSize: '300% 300%',
          }}
        >
          <motion.div
            animate={isFocused ? { 
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] 
            } : {}}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-[1px] bg-gray-800 rounded-lg"
          />
        </motion.div>

        {/* 搜索输入框 */}
        <div className="relative flex items-center p-4">
          <motion.div
            animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
            transition={isLoading ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-blue-500" />
            ) : (
              <Truck className="w-5 h-5 text-blue-500" />
            )}
          </motion.div>
          
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsFocused(true);
              if (query && suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => {
              setIsFocused(false);
              // 延迟隐藏建议，确保点击建议有效
              setTimeout(() => setShowSuggestions(false), 150);
            }}
            placeholder={placeholder}
            className="flex-1 ml-3 bg-transparent text-white placeholder-gray-400 focus:outline-none text-lg font-medium"
          />

          {/* 搜索统计 */}
          {!isFocused && !query && citiesData.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-2 text-xs text-gray-500"
            >
              <span>{citiesData.length} 城市</span>
              <span>•</span>
              <span>{Object.keys(fsaIndex).length} FSA</span>
            </motion.div>
          )}

          {/* 清除按钮 */}
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                onClick={handleClear}
                className="ml-3 p-1 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 搜索建议下拉框 */}
      <AnimatePresence>
        {showSuggestions && (suggestions.length > 0 || searchHistory.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-lg shadow-2xl border border-gray-600 z-50 max-h-96 overflow-y-auto"
          >
            {/* 搜索结果 */}
            {suggestions.length > 0 && (
              <div className="p-2">
                <div className="flex items-center text-xs text-gray-400 mb-2 px-2">
                  <Zap className="w-3 h-3 mr-1" />
                  搜索结果 ({suggestions.length})
                </div>
                {suggestions.map((suggestion, index) => {
                  const Icon = getResultTypeIcon(suggestion.type);
                  return (
                    <motion.button
                      key={suggestion.id}
                      onClick={() => handleSelect(suggestion)}
                      className={`
                        w-full flex items-center p-3 rounded-lg text-left transition-colors group
                        ${selectedIndex === index 
                          ? 'bg-blue-600 text-white' 
                          : 'hover:bg-gray-700 text-gray-300'
                        }
                      `}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex-shrink-0 mr-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ 
                            backgroundColor: suggestion.color + '20'
                          }}
                        >
                          <Icon className="w-4 h-4" style={{ color: suggestion.color }} />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {highlightMatch(suggestion.label, query)}
                        </div>
                        <div className="text-sm opacity-75 truncate">
                          {highlightMatch(suggestion.sublabel, query)}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-2">
                        <span className="text-xs opacity-50 px-2 py-1 bg-black bg-opacity-20 rounded">
                          {getResultTypeLabel(suggestion.type)}
                        </span>
                        {suggestion.type === 'city' && (
                          <Navigation className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* 搜索历史 */}
            {searchHistory.length > 0 && (
              <div className="p-2 border-t border-gray-700">
                <div className="flex items-center text-xs text-gray-400 mb-2 px-2">
                  <Clock className="w-3 h-3 mr-1" />
                  搜索历史
                </div>
                {searchHistory.slice(0, 3).map((item, index) => {
                  const Icon = getResultTypeIcon(item.type);
                  return (
                    <motion.button
                      key={`history-${index}`}
                      onClick={() => handleSelect(item)}
                      className="w-full flex items-center p-3 rounded-lg text-left hover:bg-gray-700 text-gray-300 transition-colors"
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-4 h-4 mr-3 flex-shrink-0 text-gray-500" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.value}</div>
                        <div className="text-sm opacity-75 truncate">{item.label}</div>
                      </div>
                      <div className="text-xs opacity-50 ml-2">
                        {getResultTypeLabel(item.type)}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TruckDeliverySearch;