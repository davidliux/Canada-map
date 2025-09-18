import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  MapPin, 
  Clock,
  Zap,
  Loader2
} from 'lucide-react';
import { debouncedSearch, globalCache, performanceMonitor } from '../utils/performanceOptimizer';

const AnimatedSearchBox = ({ 
  onSearch, 
  onSelect, 
  placeholder = "搜索邮编、FSA编码、城市...",
  searchHistory = [],
  onHistoryUpdate 
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // 优化的搜索函数
  const optimizedSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // 检查缓存
    const cacheKey = `search:${searchQuery}`;
    const cachedResult = globalCache.get(cacheKey);
    if (cachedResult) {
      setSuggestions(cachedResult);
      setShowSuggestions(cachedResult.length > 0);
      return;
    }

    setIsLoading(true);
    performanceMonitor.startTimer(`search-${searchQuery}`);
    
    try {
      // 模拟搜索API调用 - 实际项目中替换为真实API
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // 模拟搜索结果
      const mockSuggestions = [
        { id: 1, type: 'fsa', value: 'M5V', label: 'M5V - 多伦多市中心', icon: MapPin },
        { id: 2, type: 'postal', value: 'M5V 3A8', label: 'M5V 3A8 - 多伦多', icon: MapPin },
        { id: 3, type: 'city', value: '多伦多', label: '多伦多 - 安大略省', icon: MapPin },
        { id: 4, type: 'province', value: 'ON', label: '安大略省 - 全省', icon: MapPin }
      ].filter(item => 
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.value.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // 缓存结果
      globalCache.set(cacheKey, mockSuggestions, 5 * 60 * 1000); // 5分钟缓存

      setSuggestions(mockSuggestions);
      setShowSuggestions(mockSuggestions.length > 0);
    } catch (error) {
      console.error('搜索失败:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
      performanceMonitor.endTimer(`search-${searchQuery}`);
    }
  }, []);

  // 处理搜索输入
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    
    if (onSearch) {
      onSearch(value);
    }
    
    debouncedSearch(value, optimizedSearch);
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
          handleSelect({ type: 'search', value: query, label: query });
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
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
      onHistoryUpdate([suggestion, ...searchHistory.slice(0, 4)]);
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
    inputRef.current?.focus();
    
    if (onSearch) {
      onSearch('');
    }
  };

  // 全局键盘快捷键
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // 点击外部关闭建议
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
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
        {/* 动画边框 */}
        <motion.div
          className="absolute inset-0 rounded-lg"
          animate={{
            background: isFocused 
              ? 'linear-gradient(45deg, #3b82f6, #06b6d4, #3b82f6)' 
              : 'transparent'
          }}
          style={{
            backgroundSize: '200% 200%',
          }}
        >
          <motion.div
            animate={isFocused ? { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
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
              <Search className="w-5 h-5 text-blue-500" />
            )}
          </motion.div>
          
          <input
            ref={inputRef}
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
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="flex-1 ml-3 bg-transparent text-white placeholder-gray-400 focus:outline-none text-lg font-medium"
          />


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
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-lg shadow-xl border border-gray-600 z-50 max-h-80 overflow-y-auto"
          >
            {/* 搜索建议 */}
            {suggestions.length > 0 && (
              <div className="p-2">
                <div className="flex items-center text-xs text-gray-400 mb-2 px-2">
                  <Zap className="w-3 h-3 mr-1" />
                  搜索建议
                </div>
                {suggestions.map((suggestion, index) => {
                  const Icon = suggestion.icon;
                  return (
                    <motion.button
                      key={suggestion.id}
                      onClick={() => handleSelect(suggestion)}
                      className={`
                        w-full flex items-center p-3 rounded-lg text-left transition-colors
                        ${selectedIndex === index 
                          ? 'bg-blue-600 text-white' 
                          : 'hover:bg-gray-700 text-gray-300'
                        }
                      `}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium">{suggestion.value}</div>
                        <div className="text-sm opacity-75">{suggestion.label}</div>
                      </div>
                      <div className="text-xs opacity-50 ml-2">{suggestion.type}</div>
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
                {searchHistory.map((item, index) => {
                  const Icon = item.icon || MapPin;
                  return (
                    <motion.button
                      key={`history-${index}`}
                      onClick={() => handleSelect(item)}
                      className="w-full flex items-center p-3 rounded-lg text-left hover:bg-gray-700 text-gray-300 transition-colors"
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium">{item.value}</div>
                        <div className="text-sm opacity-75">{item.label}</div>
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

export default AnimatedSearchBox;