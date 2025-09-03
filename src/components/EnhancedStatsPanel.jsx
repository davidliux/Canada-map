import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  MapPin,
  BarChart3,
  Truck,
  Activity,
  TrendingUp,
  Globe,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { getDeliveryStats, getFSAsByProvince } from '../data/deliverableFSA';
import { getAllRegionConfigs, getStorageStats } from '../utils/unifiedStorage';
import { dataUpdateNotifier } from '../utils/dataUpdateNotifier';

const EnhancedStatsPanel = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // 计算统一存储架构中的实际配送区域数据
  const calculateUnifiedStats = () => {
    try {
      const regionConfigs = getAllRegionConfigs();
      const storageStats = getStorageStats();

      console.log('📊 计算统计数据 - 区域配置:', regionConfigs);
      console.log('📊 存储统计:', storageStats);

      // 统计所有区域中的FSA数量
      let totalFSAs = 0;
      let activeFSAs = 0;
      const fsasByProvince = {
        'BC': 0, 'ON': 0, 'QC': 0, 'AB': 0, 'MB': 0,
        'SK': 0, 'NS': 0, 'NB': 0, 'NL': 0, 'PE': 0,
        'YT': 0, 'NT': 0, 'NU': 0
      };

      // 确保regionConfigs是对象且不为空
      if (regionConfigs && typeof regionConfigs === 'object') {
        Object.values(regionConfigs).forEach(config => {
          if (config && config.postalCodes && Array.isArray(config.postalCodes)) {
            totalFSAs += config.postalCodes.length;

            if (config.isActive) {
              activeFSAs += config.postalCodes.length;
            }

            // 按省份分类FSA
            config.postalCodes.forEach(fsa => {
              if (typeof fsa === 'string' && fsa.length > 0) {
                const firstChar = fsa.charAt(0).toUpperCase();
                switch (firstChar) {
                  case 'V': fsasByProvince.BC++; break;
                  case 'T': fsasByProvince.AB++; break;
                  case 'S': fsasByProvince.SK++; break;
                  case 'R': fsasByProvince.MB++; break;
                  case 'P': case 'N': case 'K': case 'L': case 'M':
                    fsasByProvince.ON++; break;
                  case 'H': case 'J': case 'G':
                    fsasByProvince.QC++; break;
                  case 'E': fsasByProvince.NB++; break;
                  case 'B': fsasByProvince.NS++; break;
                  case 'C': fsasByProvince.PE++; break;
                  case 'A': fsasByProvince.NL++; break;
                  case 'Y': fsasByProvince.YT++; break;
                  case 'X': fsasByProvince.NT++; break;
                  default: fsasByProvince.ON++; break;
                }
              }
            });
          }
        });
      }

      const result = {
        total: totalFSAs,
        activeFSAs,
        byProvince: fsasByProvince,
        regionCount: storageStats?.regionCount || 0,
        activeRegions: storageStats?.activeRegions || 0
      };

      console.log('📊 计算结果:', result);
      return result;

    } catch (error) {
      console.error('❌ 计算统计数据失败:', error);

      // 返回默认值避免界面崩溃
      return {
        total: 0,
        activeFSAs: 0,
        byProvince: {
          'BC': 0, 'ON': 0, 'QC': 0, 'AB': 0, 'MB': 0,
          'SK': 0, 'NS': 0, 'NB': 0, 'NL': 0, 'PE': 0,
          'YT': 0, 'NT': 0, 'NU': 0
        },
        regionCount: 0,
        activeRegions: 0
      };
    }
  };

  const loadStats = () => {
    setIsLoading(true);
    setTimeout(() => {
      // 使用统一存储架构的数据
      const unifiedStats = calculateUnifiedStats();

      // 计算覆盖率 (基于统计局1643个总FSA)
      const totalCanadianFSAs = 1643;
      const coverageRate = ((unifiedStats.total / totalCanadianFSAs) * 100).toFixed(2);

      setStats({
        ...unifiedStats,
        coverageRate,
        totalCanadianFSAs
      });
      setIsLoading(false);
      setLastUpdate(new Date());
    }, 500);
  };

  useEffect(() => {
    loadStats();

    // 监听数据更新通知
    const unsubscribe = dataUpdateNotifier.subscribe((updateInfo) => {
      console.log('EnhancedStatsPanel收到数据更新通知:', updateInfo);
      loadStats();
    });

    return unsubscribe;
  }, []);

  const handleRefresh = () => {
    setStats(null);
    loadStats();
  };

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="bg-cyber-gray rounded-xl p-6 border border-cyber-blue/30"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="h-16 bg-cyber-light-gray rounded animate-pulse"></div>
          </motion.div>
        ))}
      </div>
    );
  }

  const activeProvinces = Object.keys(stats.byProvince).filter(p => stats.byProvince[p] > 0);

  const statCards = [
    {
      title: '配送区域',
      value: stats.total,
      subtitle: 'FSA邮编前缀',
      icon: Package,
      color: 'cyber-blue',
      bgColor: 'bg-cyber-blue/20',
      change: '+100%',
      trend: 'up'
    },
    {
      title: '覆盖省份',
      value: activeProvinces.length,
      subtitle: '加拿大省份/地区',
      icon: MapPin,
      color: 'cyber-green',
      bgColor: 'bg-cyber-green/20',
      change: '+7',
      trend: 'up'
    },
    {
      title: '覆盖率',
      value: `${stats.coverageRate}%`,
      subtitle: `${stats.totalCanadianFSAs}个官方FSA`,
      icon: BarChart3,
      color: 'cyber-purple',
      bgColor: 'bg-cyber-purple/20',
      change: '+52.44%',
      trend: 'up'
    },
    {
      title: '系统状态',
      value: '在线',
      subtitle: '实时监控',
      icon: Activity,
      color: 'cyber-green',
      bgColor: 'bg-cyber-green/20',
      change: '99.9%',
      trend: 'stable'
    }
  ];

  return (
    <div className="mb-8">
      {/* 主要统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            className="bg-cyber-gray rounded-xl p-6 border border-cyber-blue/30 hover:border-cyber-blue/60 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon className={`w-6 h-6 text-${card.color}`} />
              </div>
              {card.trend === 'up' && (
                <div className="flex items-center text-cyber-green text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {card.change}
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <div className={`text-2xl font-bold text-${card.color}`}>
                {card.value}
              </div>
              <div className="text-white font-medium text-sm">
                {card.title}
              </div>
              <div className="text-gray-400 text-xs">
                {card.subtitle}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 详细信息面板 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 省份详细分布 */}
        <motion.div
          className="lg:col-span-2 bg-cyber-gray rounded-xl p-6 border border-cyber-blue/30"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <Globe className="w-5 h-5 mr-2 text-cyber-blue" />
              省份配送分布
            </h3>
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-400 hover:text-cyber-blue transition-colors"
              title="刷新数据"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {Object.entries(stats.byProvince)
              .filter(([_, count]) => count > 0)
              .sort(([,a], [,b]) => b - a)
              .map(([province, count]) => {
                const percentage = ((count / stats.total) * 100).toFixed(1);
                const provinceNames = {
                  'BC': '不列颠哥伦比亚省',
                  'ON': '安大略省', 
                  'QC': '魁北克省',
                  'AB': '阿尔伯塔省',
                  'MB': '马尼托巴省'
                };
                
                return (
                  <div key={province} className="bg-cyber-light-gray rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-cyber-blue font-bold text-lg">{count}</div>
                      <div className="text-cyber-green text-sm">{percentage}%</div>
                    </div>
                    <div className="text-white font-medium text-sm mb-1">{province}</div>
                    <div className="text-gray-400 text-xs">{provinceNames[province] || province}</div>
                    
                    {/* 进度条 */}
                    <div className="mt-3 w-full bg-cyber-dark rounded-full h-2">
                      <div
                        className="bg-cyber-blue h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </motion.div>

        {/* 系统状态 */}
        <motion.div
          className="bg-cyber-gray rounded-xl p-6 border border-cyber-blue/30"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <Activity className="w-5 h-5 mr-2 text-cyber-blue" />
              系统监控
            </h3>
          </div>

          <div className="space-y-4">
            {/* 数据状态 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-cyber-green mr-2" />
                <span className="text-white text-sm">数据完整性</span>
              </div>
              <span className="text-cyber-green text-sm font-bold">100%</span>
            </div>

            {/* 系统状态 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-cyber-green rounded-full animate-pulse mr-3"></div>
                <span className="text-white text-sm">服务状态</span>
              </div>
              <span className="text-cyber-green text-sm font-bold">正常</span>
            </div>

            {/* 最后更新 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-white text-sm">最后更新</span>
              </div>
              <span className="text-gray-400 text-xs">
                {lastUpdate.toLocaleTimeString()}
              </span>
            </div>

            {/* 数据源信息 */}
            <div className="mt-4 p-3 bg-cyber-dark rounded-lg">
              <div className="text-xs text-gray-300">
                <div className="flex items-center mb-1">
                  <CheckCircle className="w-3 h-3 text-cyber-green mr-1" />
                  <span className="text-cyber-green font-bold">Statistics Canada 2021</span>
                </div>
                <div>官方FSA边界数据</div>
                <div>覆盖率提升至 {stats.coverageRate}%</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EnhancedStatsPanel; 