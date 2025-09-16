import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MonitorSpeaker,
  Truck,
  BarChart3,
  MapPin,
  Package,
  DollarSign,
  ChevronRight,
  TrendingUp,
  Zap
} from 'lucide-react';

const DashboardHub = () => {
  const navigate = useNavigate();

  // 仪表板数据配置
  const dashboards = [
    {
      id: 'fsa-delivery',
      title: 'FSA配送仪表板',
      description: '管理加拿大FSA配送区域，查看覆盖率和区域统计',
      icon: Package,
      color: 'from-blue-500 to-cyan-500',
      href: '/dashboards/fsa',
      features: [
        { name: '区域管理', icon: MapPin },
        { name: '价格配置', icon: DollarSign },
        { name: '统计分析', icon: BarChart3 }
      ],
      stats: {
        regions: '120+',
        coverage: '95%',
        active: '运行中'
      }
    },
    {
      id: 'truck-delivery',
      title: '卡车配送仪表板',
      description: '管理城市卡车配送路线，优化物流配送效率',
      icon: Truck,
      color: 'from-purple-500 to-pink-500',
      href: '/dashboards/truck-delivery',
      features: [
        { name: '城市管理', icon: MapPin },
        { name: '路线优化', icon: TrendingUp },
        { name: '实时监控', icon: Zap }
      ],
      stats: {
        cities: '25+',
        routes: '180+',
        active: '运行中'
      }
    }
  ];

  // 处理仪表板导航
  const handleDashboardClick = (href) => {
    navigate(href);
  };

  return (
    <div className="h-full bg-gray-900 p-6">
      {/* 页面标题 */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <MonitorSpeaker className="w-10 h-10 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold text-white">仪表板中心</h1>
            <p className="text-gray-400 text-lg mt-1">选择您需要访问的仪表板</p>
          </div>
        </div>
        
        {/* 系统状态指示器 */}
        <div className="flex items-center space-x-6 mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">系统运行正常</span>
          </div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-300">所有服务在线</span>
          </div>
        </div>
      </div>

      {/* 仪表板卡片网格 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
        {dashboards.map((dashboard, index) => {
          const Icon = dashboard.icon;
          
          return (
            <motion.div
              key={dashboard.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group cursor-pointer"
              onClick={() => handleDashboardClick(dashboard.href)}
            >
              <div className="bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                {/* 卡片头部 - 渐变背景 */}
                <div className={`h-32 rounded-t-xl bg-gradient-to-r ${dashboard.color} p-6 relative overflow-hidden`}>
                  {/* 背景装饰图案 */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-6 -translate-y-6">
                      <Icon className="w-full h-full" />
                    </div>
                  </div>
                  
                  {/* 主图标 */}
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                  </div>
                </div>

                {/* 卡片内容 */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                        {dashboard.title}
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {dashboard.description}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>

                  {/* 功能特性 */}
                  <div className="mb-6">
                    <div className="grid grid-cols-3 gap-3">
                      {dashboard.features.map((feature) => {
                        const FeatureIcon = feature.icon;
                        return (
                          <div key={feature.name} className="flex flex-col items-center p-3 bg-gray-750 rounded-lg">
                            <FeatureIcon className="w-5 h-5 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-400 text-center">{feature.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 统计信息 */}
                  <div className="border-t border-gray-700 pt-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{dashboard.stats.regions || dashboard.stats.cities}</div>
                        <div className="text-xs text-gray-400">{dashboard.stats.regions ? '区域数' : '城市数'}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{dashboard.stats.coverage || dashboard.stats.routes}</div>
                        <div className="text-xs text-gray-400">{dashboard.stats.coverage ? '覆盖率' : '路线数'}</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="text-sm font-medium text-green-500">{dashboard.stats.active}</div>
                        </div>
                        <div className="text-xs text-gray-400">状态</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 卡片底部操作区域 */}
                <div className={`px-6 py-4 bg-gradient-to-r ${dashboard.color} bg-opacity-5 rounded-b-xl border-t border-gray-700`}>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      点击访问仪表板
                    </div>
                    <div className="flex items-center space-x-2 text-gray-500 group-hover:text-white transition-colors">
                      <span className="text-xs">进入</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 底部提示信息 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-center"
      >
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <Zap className="w-6 h-6 text-yellow-500" />
            <h3 className="text-lg font-semibold text-white">快速提示</h3>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            每个仪表板都提供完整的管理功能，包括数据可视化、配置管理和实时监控。
            您可以通过侧边栏快速切换不同的功能模块。
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardHub;