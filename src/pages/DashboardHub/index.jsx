import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Map,
  MapPin,
  Package,
  TrendingUp,
  Activity,
  Users,
  Truck,
  BarChart3,
  Zap,
  ArrowUpRight,
  Database,
  Globe,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const DashboardHub = () => {
  const navigate = useNavigate();

  const dashboards = [
    {
      id: 'fsa-dashboard',
      title: 'FSA配送仪表板',
      description: '管理加拿大FSA配送区域，查看覆盖率和区域统计',
      icon: Package,
      color: 'from-blue-500 to-cyan-500',
      bgGradient: 'bg-gradient-to-br from-blue-500/10 to-cyan-500/5',
      borderColor: 'border-blue-500/20',
      path: '/dashboard',
      stats: [
        { label: '区域数', value: '120+', icon: MapPin },
        { label: '覆盖率', value: '95%', icon: TrendingUp },
        { label: '统计分析', value: '实时', icon: Activity }
      ],
      status: 'running',
      lastUpdate: '5分钟前更新'
    },
    {
      id: 'truck-dashboard',
      title: '卡车配送仪表板',
      description: '管理城市卡车配送路线，优化物流配送效率',
      icon: Truck,
      color: 'from-purple-500 to-pink-500',
      bgGradient: 'bg-gradient-to-br from-purple-500/10 to-pink-500/5',
      borderColor: 'border-purple-500/20',
      path: '/truck-delivery/dashboard',
      stats: [
        { label: '城市数', value: '25+', icon: Users },
        { label: '路线数', value: '180+', icon: MapPin },
        { label: '实时监控', value: '启用', icon: Activity }
      ],
      status: 'running',
      lastUpdate: '刚刚更新'
    }
  ];

  const quickStats = [
    {
      title: '系统状态',
      value: '正常运行',
      icon: Shield,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      trend: '99.9% 在线率'
    },
    {
      title: '数据同步',
      value: '实时',
      icon: Database,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      trend: '每5秒刷新'
    },
    {
      title: '全球覆盖',
      value: '加拿大',
      icon: Globe,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      trend: '10省3地区'
    },
    {
      title: '性能指标',
      value: '优秀',
      icon: BarChart3,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      trend: '响应<100ms'
    }
  ];

  const handleDashboardClick = (path) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* 顶部状态栏 */}
      <div className="bg-gray-850 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-400">系统运行正常</span>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="border-gray-700 text-gray-300">
                <Activity className="w-3 h-3 mr-1 text-green-500" />
                在线
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-4 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl shadow-lg">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">仪表板中心</h1>
              <p className="text-gray-400 mt-1">选择您需要访问的仪表板</p>
            </div>
          </div>
        </motion.div>

        {/* 快速统计 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-4 gap-4 mb-8"
        >
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="border-gray-800 bg-gray-800/50 backdrop-blur hover:bg-gray-800/70 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {stat.trend}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{stat.title}</p>
                    <p className="text-lg font-semibold text-white">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        {/* 仪表板卡片 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dashboards.map((dashboard, index) => {
            const Icon = dashboard.icon;

            return (
              <motion.div
                key={dashboard.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card
                  className={`
                    group overflow-hidden border ${dashboard.borderColor}
                    bg-gray-800/80 backdrop-blur hover:bg-gray-800
                    transition-all duration-300 cursor-pointer
                    hover:shadow-2xl hover:scale-[1.02]
                  `}
                  onClick={() => handleDashboardClick(dashboard.path)}
                >
                  {/* 顶部彩色条 */}
                  <div className={`h-1 bg-gradient-to-r ${dashboard.color}`} />

                  <CardHeader className={`${dashboard.bgGradient}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 bg-gradient-to-br ${dashboard.color} rounded-xl shadow-lg`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl text-white flex items-center">
                            {dashboard.title}
                            <ArrowUpRight className="w-5 h-5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </CardTitle>
                          <CardDescription className="text-gray-400 mt-1">
                            {dashboard.description}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    {/* 统计信息网格 */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {dashboard.stats.map((stat, idx) => {
                        const StatIcon = stat.icon;
                        return (
                          <div
                            key={idx}
                            className="bg-gray-900/50 rounded-lg p-3 border border-gray-700"
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              <StatIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-xs text-gray-500">{stat.label}</span>
                            </div>
                            <p className="text-xl font-bold text-white">{stat.value}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* 底部信息 */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-xs text-gray-400">
                            {dashboard.status === 'running' ? '运行中' : '已暂停'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">{dashboard.lastUpdate}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white hover:bg-gray-700"
                      >
                        进入仪表板
                        <ArrowUpRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* 底部提示卡片 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <Card className="border border-gray-700 bg-gradient-to-br from-gray-800/80 to-gray-850/80 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">快速提示</h3>
                  <p className="text-sm text-gray-300 mb-4">
                    每个仪表板都提供了完整的数据可视化功能，包括实时数据更新、交互式地图展示和详细的统计分析。
                    选择您需要的仪表板即可开始工作。
                  </p>
                  <div className="flex items-center space-x-6 text-sm text-gray-400">
                    <div className="flex items-center space-x-2">
                      <Database className="w-4 h-4 text-blue-500" />
                      <span>实时数据同步</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span>安全访问</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-purple-500" />
                      <span>性能优化</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardHub;