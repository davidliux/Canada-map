import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Filter,
  Check,
  X,
  Globe,
  Building,
  Zap
} from 'lucide-react';
import { getFSAsByProvince } from '../data/deliverableFSA';

const FilterButtonGroup = ({ 
  onProvinceFilter, 
  onCityFilter, 
  onRegionFilter, 
  selectedFilters = [],
  regionStats = {},
  className = "" 
}) => {
  const [activeFilters, setActiveFilters] = useState(new Set(selectedFilters));
  const [animatingFilters, setAnimatingFilters] = useState(new Set());

  // 获取真实FSA数据并计算省份配置
  const fsasByProvince = getFSAsByProvince();
  const provinces = [
    { code: 'ON', name: '安大略省', color: '#3b82f6', count: fsasByProvince.ON.length },
    { code: 'QC', name: '魁北克省', color: '#06b6d4', count: fsasByProvince.QC.length },
    { code: 'BC', name: '不列颠哥伦比亚省', color: '#8b5cf6', count: fsasByProvince.BC.length },
    { code: 'AB', name: '阿尔伯塔省', color: '#f59e0b', count: fsasByProvince.AB.length },
    { code: 'MB', name: '马尼托巴省', color: '#10b981', count: fsasByProvince.MB.length }
  ].filter(province => province.count > 0); // 只显示有数据的省份

  // 热门城市配置
  const popularCities = [
    { code: 'toronto', name: '多伦多', color: '#3b82f6', province: 'ON' },
    { code: 'vancouver', name: '温哥华', color: '#8b5cf6', province: 'BC' },
    { code: 'montreal', name: '蒙特利尔', color: '#06b6d4', province: 'QC' },
    { code: 'calgary', name: '卡尔加里', color: '#f59e0b', province: 'AB' },
    { code: 'ottawa', name: '渥太华', color: '#10b981', province: 'ON' },
    { code: 'edmonton', name: '埃德蒙顿', color: '#f97316', province: 'AB' }
  ];

  // 处理筛选器切换
  const handleFilterToggle = (filterType, filterValue, callback) => {
    const filterKey = `${filterType}:${filterValue}`;
    
    setAnimatingFilters(prev => new Set([...prev, filterKey]));
    
    setTimeout(() => {
      const newActiveFilters = new Set(activeFilters);
      
      if (activeFilters.has(filterKey)) {
        newActiveFilters.delete(filterKey);
      } else {
        newActiveFilters.add(filterKey);
      }
      
      setActiveFilters(newActiveFilters);
      
      if (callback) {
        callback(filterValue, !activeFilters.has(filterKey));
      }
      
      setAnimatingFilters(prev => {
        const newSet = new Set(prev);
        newSet.delete(filterKey);
        return newSet;
      });
    }, 150);
  };

  // 清除所有筛选
  const handleClearAll = () => {
    setActiveFilters(new Set());
    
    // 通知所有回调函数清除筛选
    provinces.forEach(province => {
      if (onProvinceFilter) {
        onProvinceFilter(province.code, false);
      }
    });
    
    popularCities.forEach(city => {
      if (onCityFilter) {
        onCityFilter(city.code, false);
      }
    });
  };

  // 筛选按钮组件
  const FilterButton = ({ 
    id, 
    name, 
    color, 
    count, 
    icon: Icon = MapPin, 
    type, 
    onClick,
    province 
  }) => {
    const filterKey = `${type}:${id}`;
    const isActive = activeFilters.has(filterKey);
    const isAnimating = animatingFilters.has(filterKey);

    return (
      <motion.button
        onClick={() => onClick(type, id)}
        className={`
          relative group p-3 rounded-lg border transition-all duration-200
          ${isActive 
            ? 'border-transparent shadow-lg shadow-opacity-25' 
            : 'border-gray-600 hover:border-gray-500'
          }
        `}
        style={{
          backgroundColor: isActive ? `${color}20` : '#374151',
          boxShadow: isActive ? `0 4px 20px ${color}40` : 'none'
        }}
        whileHover={{ 
          scale: 1.05,
          boxShadow: `0 8px 25px ${color}30`
        }}
        whileTap={{ scale: 0.95 }}
        layout
      >
        {/* 发光边框动画 */}
        <motion.div
          className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100"
          style={{
            background: `linear-gradient(45deg, ${color}, transparent, ${color})`,
            backgroundSize: '200% 200%'
          }}
          animate={isActive ? {
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="absolute inset-[1px] bg-gray-800 rounded-lg" />
        </motion.div>

        {/* 按钮内容 */}
        <div className="relative flex flex-col items-center space-y-2 z-10">
          <motion.div
            animate={isAnimating ? { 
              rotateY: 360,
              scale: [1, 1.2, 1]
            } : isActive ? {
              scale: [1, 1.1, 1]
            } : {}}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center"
          >
            {isActive ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: color }}
              >
                <Check className="w-3 h-3 text-white" />
              </motion.div>
            ) : (
              <Icon 
                className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" 
                style={{ color: isActive ? color : undefined }}
              />
            )}
          </motion.div>
          
          <div className="text-center">
            <div 
              className={`text-sm font-medium transition-colors ${
                isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'
              }`}
            >
              {name}
            </div>
            
            {/* 数量badge */}
            {count !== undefined && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`
                  inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1
                  ${isActive ? 'text-white' : 'text-gray-400'}
                `}
                style={{
                  backgroundColor: isActive ? `${color}40` : '#4b5563'
                }}
              >
                <motion.span
                  animate={isActive ? {
                    scale: [1, 1.2, 1]
                  } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {count}
                </motion.span>
              </motion.div>
            )}

            {/* 省份标识 */}
            {province && (
              <div className="text-xs text-gray-500 mt-1">
                {province}
              </div>
            )}
          </div>
        </div>

        {/* 激活状态的脉冲效果 */}
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-lg"
            style={{ backgroundColor: `${color}20` }}
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.5, 0.2, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </motion.button>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 筛选控制栏 */}
      <div className="flex items-center justify-between">
        <motion.div 
          className="flex items-center space-x-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Filter className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-white">快速筛选</h3>
          
          {/* 活跃筛选数量 */}
          <AnimatePresence>
            {activeFilters.size > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium"
              >
                {activeFilters.size}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 清除所有筛选 */}
        <AnimatePresence>
          {activeFilters.size > 0 && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={handleClearAll}
              className="flex items-center space-x-1 text-gray-400 hover:text-white text-sm transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <X className="w-4 h-4" />
              <span>清除全部</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* 省份筛选 */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Globe className="w-4 h-4" />
          <span>按省份筛选</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {provinces.map(province => (
            <FilterButton
              key={province.code}
              id={province.code}
              name={province.name}
              color={province.color}
              count={province.count}
              icon={Globe}
              type="province"
              onClick={(type, id) => handleFilterToggle(type, id, onProvinceFilter)}
            />
          ))}
        </div>
      </div>

      {/* 热门城市筛选 */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Building className="w-4 h-4" />
          <span>热门城市</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {popularCities.map(city => (
            <FilterButton
              key={city.code}
              id={city.code}
              name={city.name}
              color={city.color}
              icon={Building}
              type="city"
              province={city.province}
              onClick={(type, id) => handleFilterToggle(type, id, onCityFilter)}
            />
          ))}
        </div>
      </div>

      {/* 筛选状态指示器 */}
      <AnimatePresence>
        {activeFilters.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-gray-800 rounded-lg p-4 border border-gray-600"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-white">当前筛选</span>
              </div>
              <span className="text-xs text-gray-400">
                {activeFilters.size} 个条件
              </span>
            </div>
            <div className="text-sm text-gray-300">
              地图将显示符合所选条件的区域
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterButtonGroup;