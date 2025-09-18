import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AccurateFSAMap from '../../components/AccurateFSAMap';
import MapController from '../../components/MapController';
import {
  Map,
  MapPin,
  Package,
  TrendingUp,
  Activity,
  Users,
  BarChart3,
  Zap,
  ArrowLeft,
  Shield,
  Database
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getAllRegionConfigs, getStorageStats } from '../../utils/unifiedStorage';
import { completeFSAData } from '../../data/canadaFSAData';
import { getCityFSAs } from '../../data/cityFSAMapping';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRegions: 0,
    activeFSAs: 0,
    totalPostalCodes: 0,
    coverageRate: 0,
    dailyQueries: 0,
    activeUsers: 0,
  });
  
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [completeFSADataList, setcompleteFSADataList] = useState([]);
  const [highlightedFSAs, setHighlightedFSAs] = useState([]);
  const mapRef = useRef(null);

  useEffect(() => {
    // 加载统计数据
    const loadStats = () => {
      const regionsObj = getAllRegionConfigs();
      const regions = Object.values(regionsObj || {}); // 转换对象为数组
      const storageStats = getStorageStats();
      
      // 计算活跃FSA数量
      const activeFSAs = new Set();
      regions.forEach(region => {
        if (region.fsa) {
          region.fsa.forEach(fsaCode => activeFSAs.add(fsaCode));
        }
      });

      // 计算覆盖率
      const totalFSAs = completeFSAData.length;
      const coverageRate = totalFSAs > 0 ? (activeFSAs.size / totalFSAs * 100).toFixed(1) : 0;

      setStats({
        totalRegions: regions.length,
        activeFSAs: activeFSAs.size,
        totalPostalCodes: storageStats.totalFSAs || 0, // 使用totalFSAs字段
        coverageRate: parseFloat(coverageRate),
        dailyQueries: Math.floor(Math.random() * 1000) + 500, // 模拟数据
        activeUsers: Math.floor(Math.random() * 50) + 20, // 模拟数据
      });
    };

    loadStats();
    
    // 每30秒更新一次统计数据
    const interval = setInterval(loadStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // 设置全局搜索处理器
  useEffect(() => {
    window.mapSearchHandler = (query) => {
      setSearchQuery(query);
    };

    window.mapSelectHandler = (suggestion) => {
      setSearchQuery(suggestion.value);
    };

    window.mapFilterHandler = (filters) => {
      setSelectedFilters(filters);
    };

    return () => {
      delete window.mapSearchHandler;
      delete window.mapSelectHandler;
      delete window.mapFilterHandler;
    };
  }, []);

  const handleRegionFilter = (regions) => {
    setSelectedRegions(regions);
    // 这里可以添加过滤逻辑
  };

  // 处理城市选择
  // 处理区域选择
  const handleRegionSelect = (regions) => {
    setSelectedRegions(regions);
  };

  const statsCards = [
    {
      title: '配送区域',
      value: stats.totalRegions,
      icon: Map,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      trend: '+12%',
      description: '已配置区域'
    },
    {
      title: '活跃FSA',
      value: stats.activeFSAs,
      icon: MapPin,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      trend: '+5%',
      description: '已分配FSA'
    },
    {
      title: '邮编总数',
      value: (stats.totalPostalCodes || 0).toLocaleString(),
      icon: Package,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      trend: '+8%',
      description: '已录入邮编'
    },
    {
      title: '今日查询',
      value: stats.dailyQueries.toLocaleString(),
      icon: Activity,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      trend: '+15%',
      description: '查询次数'
    },
    {
      title: '覆盖率',
      value: `${stats.coverageRate}%`,
      icon: TrendingUp,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
      trend: '+2%',
      description: '区域覆盖'
    },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* 顶部导航栏 */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboards')}
              className="hover:bg-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                <Map className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">FSA配送仪表板</h1>
                <p className="text-xs text-gray-400">实时监控加拿大配送网络</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="border-gray-700 text-gray-300">
              <Activity className="w-3 h-3 mr-1 text-green-500" />
              实时数据
            </Badge>
            <Badge variant="outline" className="border-gray-700 text-gray-300">
              <Shield className="w-3 h-3 mr-1 text-blue-500" />
              已认证
            </Badge>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 统计卡片 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 py-4 bg-gray-850 border-b border-gray-700"
        >
          <div className="grid grid-cols-5 gap-4">
            {statsCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-gray-700 bg-gray-800/80 backdrop-blur hover:bg-gray-800 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                          <Icon className={`w-4 h-4 ${stat.color}`} />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {stat.trend}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{stat.title}</p>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                        <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* 地图区域 - 全屏 */}
        <div className="flex-1 relative overflow-hidden bg-gray-900">
          {/* 全屏地图组件 */}
          <div className="absolute inset-0">
          <AccurateFSAMap
            ref={mapRef}
            searchQuery={searchQuery}
            selectedProvince={selectedProvince}
            selectedRegions={selectedRegions}
            selectedFilters={selectedFilters}
            highlightedFSAs={highlightedFSAs}
            onFSAClick={(fsa) => {
              console.log('FSA clicked:', fsa);
            }}
            onRegionChange={handleRegionSelect}
          />
        </div>

        {/* 地图控制器 */}
        <MapController
          mapRef={mapRef}
          searchQuery={searchQuery}
          selectedFilters={selectedFilters}
          fsaData={completeFSADataList}
          onFSAFound={(fsaCode) => {
            console.log('📦 FSA找到:', fsaCode);
            // 高亮显示FSA
            setHighlightedFSAs([fsaCode]);
          }}
          onPricingPanelOpen={(fsaInfo) => {
            console.log('💰 FSA信息:', fsaInfo);
          }}
          completeFSAData={completeFSAData}
        />

          {/* 右下角图例 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="absolute bottom-4 right-4 max-w-xs border-gray-700 bg-gray-800/90 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="text-white font-medium text-sm">地图图例</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-gray-300">已配置区域</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-gray-300">活跃配送</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-500 rounded"></div>
                    <span className="text-gray-300">未配置</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-gray-300">暂停服务</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;