import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Menu, Building2 } from 'lucide-react';
import CompactCityCard from './CompactCityCard';
// import VirtualCityList from './VirtualCityList';
import { useDebounce } from '../../hooks/useDebounce';

/**
 * 城市列表面板组件
 * 宽度为w-64的城市列表面板，集成搜索功能和城市列表
 * Requirements: FR-001, FR-007, FR-008
 */
const CityListPanel = ({
  cities = [],
  selectedCity = null,
  onCitySelect,
  className = '',
  isMobile = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const searchInputRef = useRef(null);

  // 使用防抖搜索
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // 过滤城市列表和查找匹配的FSA
  const { filteredCities, matchingFSA } = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return { filteredCities: cities, matchingFSA: null };
    }

    const query = debouncedSearchQuery.toLowerCase();
    let foundFSA = null;
    let matchingCity = null;

    // 检查是否是FSA代码搜索（3个字符）
    if (query.length >= 3) {
      // 精确匹配FSA代码（不区分大小写）
      for (const city of cities) {
        const fsaCodes = city.regions?.flatMap(r => r.fsaCodes || r.fsa_codes || []) || [];
        const exactMatch = fsaCodes.find(fsa => fsa.toLowerCase() === query.substring(0, 3));
        if (exactMatch) {
          foundFSA = exactMatch;
          matchingCity = city;
          break;
        }
      }
    }

    // 过滤城市
    const filtered = cities.filter(city => {
      const cityName = (city.name || city.city_name || '').toLowerCase();
      const province = (city.province || city.province_code || '').toLowerCase();
      const fsaCodes = city.regions?.flatMap(r => r.fsaCodes || r.fsa_codes || []) || [];

      return (
        cityName.includes(query) ||
        province.includes(query) ||
        fsaCodes.some(fsa => fsa.toLowerCase().includes(query))
      );
    });

    return {
      filteredCities: filtered,
      matchingFSA: foundFSA ? { fsa: foundFSA, city: matchingCity } : null
    };
  }, [cities, debouncedSearchQuery]);

  // 处理城市选择
  const handleCitySelect = (city, skipHighlight = false, specificFSA = null) => {
    if (onCitySelect) {
      // 如果有特定的FSA，传递给父组件
      if (specificFSA) {
        onCitySelect(city, skipHighlight, specificFSA);
      } else {
        onCitySelect(city, skipHighlight);
      }
    }
    // 移动端选择后自动收起
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  // 清除搜索
  const clearSearch = () => {
    setSearchQuery('');
  };

  // 处理FSA搜索匹配 - 自动选择城市并高亮FSA
  useEffect(() => {
    if (matchingFSA && matchingFSA.city) {
      console.log('找到匹配的FSA:', matchingFSA.fsa, '属于城市:', matchingFSA.city.name);
      // 选择城市但跳过高亮所有FSA，而是通过specificFSA参数传递
      handleCitySelect(matchingFSA.city, true, matchingFSA.fsa);
    }
  }, [matchingFSA]);

  // 快捷键支持 - 按 / 键聚焦搜索框
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // 面板内容
  const panelContent = (
    <>
      {/* 面板头部 */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            配送城市
          </h2>
          {!isMobile && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:bg-gray-700 rounded-lg transition-colors lg:hidden"
            >
              <Menu className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索城市、FSA（如L9T）..."
            className="w-full pl-10 pr-10 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-700 rounded"
            >
              <X className="w-3 h-3 text-gray-500" />
            </button>
          )}
        </div>

        {/* 搜索结果统计 */}
        <div className="mt-2 text-xs text-gray-500">
          {searchQuery && matchingFSA && (
            <span className="text-green-400">
              已定位到 FSA: {matchingFSA.fsa} ({matchingFSA.city.name})
            </span>
          )}
          {searchQuery && !matchingFSA && (
            <span>找到 {filteredCities.length} 个城市</span>
          )}
          {!searchQuery && (
            <span>共 {cities.length} 个城市 · 按 / 键快速搜索</span>
          )}
        </div>
      </div>

      {/* 城市列表 */}
      <div className="flex-1 overflow-hidden">
        {/* 普通列表 */}
        <div className="p-4 space-y-2 overflow-y-auto h-full">
          {filteredCities.map((city) => (
            <CompactCityCard
                key={city.id || city.name}
                city={city}
                isSelected={selectedCity?.id === city.id}
                onClick={() => handleCitySelect(city)}
              />
            ))}
            {filteredCities.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">未找到匹配的城市</p>
              </div>
            )}
          </div>
      </div>
    </>
  );

  // 桌面端
  if (!isMobile) {
    return (
      <motion.div
        className={`w-64 h-full bg-gray-800 border-r border-gray-700 flex flex-col ${className}`}
        initial={{ x: -256 }}
        animate={{ x: isCollapsed ? -256 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {panelContent}
      </motion.div>
    );
  }

  // 移动端
  return (
    <>
      {/* 移动端触发按钮 */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-40 p-2 bg-gray-800 border border-gray-700 rounded-lg lg:hidden"
      >
        <Menu className="w-6 h-6 text-white" />
      </button>

      {/* 移动端面板 */}
      <motion.div
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-gray-800 border-r border-gray-700 flex flex-col lg:hidden ${className}`}
        initial={{ x: -320 }}
        animate={{ x: isMobileOpen ? 0 : -320 }}
        transition={{ duration: 0.3 }}
      >
        {/* 关闭按钮 */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-4 right-4 p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {panelContent}
      </motion.div>

      {/* 遮罩层 */}
      {isMobileOpen && (
        <motion.div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
};

export default CityListPanel;