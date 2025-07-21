import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Zap } from 'lucide-react';

/**
 * 省份分析器组件
 * 分析选中区域的FSA分布，提供智能缩放和省份切换功能
 */
const ProvinceAnalyzer = ({ selectedRegions, onProvinceSwitch, currentProvince }) => {
  const [provinceStats, setProvinceStats] = useState({});
  const [primaryProvince, setPrimaryProvince] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 省份信息配置
  const provinceInfo = {
    'BC': { name: '不列颠哥伦比亚省', color: '#10b981', shortName: 'BC' },
    'AB': { name: '阿尔伯塔省', color: '#3b82f6', shortName: 'AB' },
    'SK': { name: '萨斯喀彻温省', color: '#8b5cf6', shortName: 'SK' },
    'MB': { name: '马尼托巴省', color: '#f59e0b', shortName: 'MB' },
    'ON': { name: '安大略省', color: '#ef4444', shortName: 'ON' },
    'QC': { name: '魁北克省', color: '#06b6d4', shortName: 'QC' },
    'NB': { name: '新不伦瑞克省', color: '#84cc16', shortName: 'NB' },
    'NS': { name: '新斯科舍省', color: '#f97316', shortName: 'NS' },
    'PE': { name: '爱德华王子岛省', color: '#ec4899', shortName: 'PE' },
    'NL': { name: '纽芬兰和拉布拉多省', color: '#6366f1', shortName: 'NL' },
    'YT': { name: '育空地区', color: '#14b8a6', shortName: 'YT' },
    'NT': { name: '西北地区', color: '#a855f7', shortName: 'NT' },
    'NU': { name: '努纳武特地区', color: '#64748b', shortName: 'NU' }
  };

  // 根据FSA前缀判断省份
  const getProvinceFromFSA = (fsa) => {
    const firstChar = fsa.charAt(0).toUpperCase();
    switch (firstChar) {
      case 'V': return 'BC';
      case 'T': return 'AB';
      case 'S': return 'SK';
      case 'R': return 'MB';
      case 'P': case 'N': case 'K': case 'L': case 'M': return 'ON';
      case 'H': case 'J': case 'G': return 'QC';
      case 'E': return 'NB';
      case 'B': return 'NS';
      case 'C': return 'PE';
      case 'A': return 'NL';
      case 'Y': return 'YT';
      case 'X': return 'NT';
      default: return 'ON';
    }
  };

  // 分析选中区域的省份分布
  const analyzeProvinceDistribution = async () => {
    if (!selectedRegions || selectedRegions.length === 0) {
      setProvinceStats({});
      setPrimaryProvince(null);
      return;
    }

    setIsAnalyzing(true);

    try {
      // 动态导入统一存储模块
      const { getRegionPostalCodes } = await import('../utils/unifiedStorage');
      
      const stats = {};
      let totalFSAs = 0;

      // 收集所有选中区域的FSA
      selectedRegions.forEach(regionId => {
        const postalCodes = getRegionPostalCodes(regionId);
        
        postalCodes.forEach(fsa => {
          const province = getProvinceFromFSA(fsa);
          if (!stats[province]) {
            stats[province] = {
              count: 0,
              fsas: [],
              percentage: 0
            };
          }
          stats[province].count++;
          stats[province].fsas.push(fsa);
          totalFSAs++;
        });
      });

      // 计算百分比
      Object.keys(stats).forEach(province => {
        stats[province].percentage = (stats[province].count / totalFSAs * 100).toFixed(1);
      });

      // 找出FSA数量最多的省份作为主要省份
      const primary = Object.keys(stats).reduce((max, province) => 
        stats[province].count > (stats[max]?.count || 0) ? province : max
      , null);

      setProvinceStats(stats);
      setPrimaryProvince(primary);

      // 自动切换到主要省份
      if (primary && primary !== currentProvince) {
        console.log('🎯 自动切换到主要省份:', primary);
        onProvinceSwitch?.(primary);
      }

    } catch (error) {
      console.error('❌ 分析省份分布失败:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 监听选中区域变化
  useEffect(() => {
    analyzeProvinceDistribution();
  }, [selectedRegions]);

  // 获取排序后的省份列表
  const getSortedProvinces = () => {
    return Object.keys(provinceStats)
      .sort((a, b) => provinceStats[b].count - provinceStats[a].count)
      .map(province => ({
        code: province,
        ...provinceInfo[province],
        ...provinceStats[province]
      }));
  };

  const sortedProvinces = getSortedProvinces();

  if (!selectedRegions || selectedRegions.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-sm border border-blue-500/30 rounded-lg p-4 shadow-xl"
    >
      {/* 标题区域 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-blue-400" />
          <h3 className="text-white font-medium text-sm">智能地图导航</h3>
        </div>
        
        {isAnalyzing && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-cyber-blue border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-gray-400">分析中...</span>
          </div>
        )}
      </div>

      {/* 主要省份显示 */}
      {primaryProvince && (
        <div className="mb-3 p-3 bg-gradient-to-r from-blue-900/20 to-green-900/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: provinceInfo[primaryProvince]?.color }}
              ></div>
              <span className="text-white font-medium text-sm">
                主要区域: {provinceInfo[primaryProvince]?.shortName}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-green-400 text-sm font-semibold">
                {provinceStats[primaryProvince]?.count} FSA
              </span>
              <span className="text-xs text-gray-400">
                ({provinceStats[primaryProvince]?.percentage}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 省份标签栏 */}
      {sortedProvinces.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400">涉及省份 ({sortedProvinces.length})</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {sortedProvinces.map((province) => (
              <motion.button
                key={province.code}
                onClick={() => onProvinceSwitch?.(province.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  currentProvince === province.code
                    ? 'bg-blue-600/30 text-blue-300 border-blue-500/50'
                    : 'bg-gray-800/50 text-gray-300 border-gray-600/50 hover:bg-gray-700/50'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center gap-1.5">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: province.color }}
                  ></div>
                  <span>{province.shortName}</span>
                  <span className="text-xs opacity-75">({province.count})</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* 快速操作提示 */}
      <div className="mt-3 pt-3 border-t border-gray-700/50">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Zap className="w-3 h-3" />
          <span>点击省份标签快速跳转到对应区域</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProvinceAnalyzer;
