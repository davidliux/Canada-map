import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import AccurateFSAMap from '../../components/AccurateFSAMap';
import StatsCard from './components/StatsCard';
import MapController from '../../components/MapController';
// 仅在开发环境导入数据健康监控
const DataHealthMonitor = import.meta.env.DEV 
  ? React.lazy(() => import('../../components/DataHealthMonitor'))
  : null;
import { 
  Map, 
  MapPin, 
  Package, 
  TrendingUp,
  Activity,
  Users,
  BarChart,
  Zap
} from 'lucide-react';
import { getAllRegionConfigs, getStorageStats } from '../../utils/unifiedStorage';
import { deliverableFSAs } from '../../data/deliverableFSA';

const Dashboard = () => {
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
  const [deliverableFSAsList, setDeliverableFSAsList] = useState([]);
  const mapRef = useRef(null);

  useEffect(() => {
    // 加载统计数据
    const loadStats = async () => {
      const regionsObj = await getAllRegionConfigs(true); // 改为异步调用并强制刷新
      const regions = Object.values(regionsObj || {}); // 转换对象为数组
      const storageStats = await getStorageStats(true); // 改为异步调用
      
      // 计算活跃FSA数量
      const activeFSAs = new Set();
      regions.forEach(region => {
        if (region.fsa) {
          region.fsa.forEach(fsaCode => activeFSAs.add(fsaCode));
        }
      });

      // 计算覆盖率
      const totalFSAs = deliverableFSAs.length;
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

  const statsCards = [
    {
      title: '配送区域',
      value: stats.totalRegions,
      icon: Map,
      color: 'blue',
      trend: '+12%',
      description: '已配置区域'
    },
    {
      title: '活跃FSA',
      value: stats.activeFSAs,
      icon: MapPin,
      color: 'green',
      trend: '+5%',
      description: '已分配FSA'
    },
    {
      title: '邮编总数',
      value: (stats.totalPostalCodes || 0).toLocaleString(),
      icon: Package,
      color: 'purple',
      trend: '+8%',
      description: '已录入邮编'
    },
    {
      title: '今日查询',
      value: stats.dailyQueries.toLocaleString(),
      icon: Activity,
      color: 'pink',
      trend: '+15%',
      description: '查询次数'
    },
    {
      title: '在线用户',
      value: stats.activeUsers,
      icon: Users,
      color: 'cyan',
      trend: '+2',
      description: '当前在线'
    },
  ];

  return (
    <div className="h-screen flex flex-col">
      {/* 主内容区域 - 全屏地图 */}
      <div className="flex-1 bg-gray-900 relative overflow-hidden">
        {/* 地图工具栏 - 压缩工具栏高度 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-1 left-2 right-2 z-10 flex items-center justify-between"
        >
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-1 border border-gray-700">
            <div className="flex items-center space-x-2">
              <h2 className="text-white font-semibold text-sm">加拿大FSA真实边界地图</h2>
              <div className="flex items-center space-x-1 text-xs text-gray-400">
                <Activity className="w-3 h-3 text-green-500" />
                <span>实时数据</span>
              </div>
            </div>
          </div>

        </motion.div>

        {/* 全屏地图组件 - 进一步最小化顶部间距 */}
        <div className="absolute inset-0 pt-6">
          <AccurateFSAMap
            ref={mapRef}
            searchQuery={searchQuery}
            selectedProvince={selectedProvince}
            selectedRegions={selectedRegions}
            selectedFilters={selectedFilters}
            onFSAClick={(fsa) => console.log('FSA clicked:', fsa)}
          />
        </div>

        {/* 地图控制器 */}
        <MapController
          mapRef={mapRef}
          searchQuery={searchQuery}
          selectedFilters={selectedFilters}
          fsaData={deliverableFSAsList}
          deliverableFSAs={deliverableFSAs}
        />

        {/* 右侧面板 */}
        <div className="absolute bottom-4 right-4 space-y-4">
          {/* 数据健康监控 - 仅在开发环境显示 */}
          {DataHealthMonitor && (
            <React.Suspense fallback={<div />}>
              <DataHealthMonitor onDataChange={() => loadStats()} />
            </React.Suspense>
          )}
          
          {/* 地图图例 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700 max-w-xs"
          >
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
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;