import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Settings,
  Package,
  Truck,
  MapPin,
  DollarSign,
  ChevronRight,
  Shield,
  Zap,
  Users,
  Target,
  Activity,
  BarChart3,
  Database,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Logo from '@/components/Logo';

const ManagementHub = () => {
  const navigate = useNavigate();

  // 管理模块数据配置
  const managementModules = [
    {
      id: 'fsa-management',
      title: 'FSA管理',
      description: '管理FSA配送区域和价格配置',
      icon: Package,
      color: 'bg-blue-500',
      accentColor: 'text-blue-500',
      bgPattern: 'bg-gradient-to-br from-blue-500/10 to-blue-600/5',
      category: 'FSA配送系统',
      subModules: [
        {
          name: '区域管理',
          icon: MapPin,
          description: '配置和管理FSA区域',
          href: '/management/fsa/regions'
        },
        {
          name: '价格配置',
          icon: DollarSign,
          description: '设置区域价格策略',
          href: '/management/fsa/prices'
        }
      ],
      stats: {
        regions: '120+',
        configured: '95%',
        status: '运行中'
      }
    },
    {
      id: 'truck-delivery-management',
      title: '卡车配送管理',
      description: '管理城市配送和区域配置',
      icon: Truck,
      color: 'bg-purple-500',
      accentColor: 'text-purple-500',
      bgPattern: 'bg-gradient-to-br from-purple-500/10 to-purple-600/5',
      category: '卡车配送系统',
      subModules: [
        {
          name: '城市管理',
          icon: Users,
          description: '管理配送城市',
          href: '/management/truck-delivery/cities'
        },
        {
          name: '区域配置',
          icon: Target,
          description: '配置配送区域',
          href: '/management/truck-delivery/regions'
        },
        {
          name: '定价配置',
          icon: DollarSign,
          description: '配置板数定价策略',
          href: '/management/truck-delivery/pricing-config'
        }
      ],
      stats: {
        cities: '25+',
        routes: '180+',
        status: '运行中'
      }
    },
  ];

  // 处理子模块导航
  const handleSubModuleClick = (href) => {
    navigate(href);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* 顶部导航栏 */}
      <div className="bg-gray-850 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-end">
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="py-1 px-3 border-gray-700 text-gray-300">
              <Activity className="w-3 h-3 mr-1 text-green-500" />
              系统正常
            </Badge>
            <Badge variant="outline" className="py-1 px-3 border-gray-700 text-gray-300">
              <Shield className="w-3 h-3 mr-1 text-blue-500" />
              已认证
            </Badge>
            <Badge variant="outline" className="py-1 px-3 border-gray-700 text-gray-300">
              <Globe className="w-3 h-3 mr-1 text-cyan-500" />
              在线
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* 页面头部 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="mb-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl shadow-lg">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">
                  管理中心
                </h1>
                <p className="text-gray-400 mt-1">集中管理所有系统模块和配置</p>
              </div>
            </div>
          </div>

          {/* 快速统计 */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <Card className="border-gray-800 bg-gray-800/50 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">总区域数</p>
                    <p className="text-2xl font-bold text-white">145</p>
                  </div>
                  <MapPin className="w-8 h-8 text-blue-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-800 bg-gray-800/50 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">活跃城市</p>
                    <p className="text-2xl font-bold text-white">25</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-800 bg-gray-800/50 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">配送路线</p>
                    <p className="text-2xl font-bold text-white">180+</p>
                  </div>
                  <Truck className="w-8 h-8 text-green-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-800 bg-gray-800/50 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">系统健康度</p>
                    <p className="text-2xl font-bold text-white">98%</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-orange-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* 主要内容区域 - 使用 Tabs 组织 */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-gray-800 text-gray-400">
            <TabsTrigger value="all">全部系统</TabsTrigger>
            <TabsTrigger value="fsa">FSA配送</TabsTrigger>
            <TabsTrigger value="truck">卡车配送</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {managementModules.map((module, index) => {
                const Icon = module.icon;

                return (
                  <motion.div
                    key={module.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden border border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 bg-gray-800">
                      {/* 卡片头部 */}
                      <div className={`h-2 ${module.color}`} />
                      <CardHeader className={`${module.bgPattern} border-b border-gray-700`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-3 ${module.color} rounded-xl shadow-md`}>
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-xl">{module.title}</CardTitle>
                              <CardDescription className="mt-1">{module.description}</CardDescription>
                            </div>
                          </div>
                          <Badge variant="secondary" className="mt-1">{module.category}</Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="p-6">
                        {/* 功能模块列表 */}
                        <div className="space-y-3 mb-6">
                          {module.subModules.map((subModule) => {
                            const SubIcon = subModule.icon;
                            return (
                              <Button
                                key={subModule.name}
                                variant="ghost"
                                className="w-full justify-start text-left hover:bg-gray-700 p-3 text-gray-300"
                                onClick={() => handleSubModuleClick(subModule.href)}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center space-x-3">
                                    <div className={`p-2 ${module.bgPattern} rounded-lg`}>
                                      <SubIcon className={`w-4 h-4 ${module.accentColor}`} />
                                    </div>
                                    <div>
                                      <div className="font-medium">{subModule.name}</div>
                                      <div className="text-xs text-gray-400">
                                        {subModule.description}
                                      </div>
                                    </div>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                </div>
                              </Button>
                            );
                          })}
                        </div>

                        {/* 统计信息 */}
                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
                          <div>
                            <div className="text-2xl font-bold text-white">
                              {module.stats.regions || module.stats.cities}
                            </div>
                            <div className="text-xs text-gray-500">
                              {module.stats.regions ? '区域数' : '城市数'}
                            </div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-white">
                              {module.stats.configured || module.stats.routes}
                            </div>
                            <div className="text-xs text-gray-500">
                              {module.stats.configured ? '配置率' : '路线数'}
                            </div>
                          </div>
                          <div>
                            <Badge variant="success" className="mt-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1" />
                              {module.stats.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter className="bg-gray-850 px-6 py-3 border-t border-gray-700">
                        <div className="flex items-center justify-between w-full">
                          <span className="text-sm text-gray-400">
                            {module.subModules.length} 个管理模块
                          </span>
                          <Button variant="outline" size="sm" className="h-7 border-gray-600 hover:bg-gray-700 text-gray-300">
                            查看详情
                            <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="fsa" className="mt-6">
            <div className="grid grid-cols-1 gap-6">
              {managementModules.filter(m => m.id === 'fsa-management').map((module, index) => {
                const Icon = module.icon;
                return (
                  <motion.div
                    key={module.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="overflow-hidden border border-gray-700 shadow-lg bg-gray-800">
                      <div className={`h-2 ${module.color}`} />
                      <CardHeader className={`${module.bgPattern} border-b border-gray-700`}>
                        <div className="flex items-center space-x-3">
                          <div className={`p-3 ${module.color} rounded-xl shadow-md`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">{module.title}</CardTitle>
                            <CardDescription>{module.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-2 gap-4">
                          {module.subModules.map((subModule) => {
                            const SubIcon = subModule.icon;
                            return (
                              <Button
                                key={subModule.name}
                                variant="outline"
                                className="h-auto p-4 justify-start border-gray-700 hover:bg-gray-700 text-gray-300"
                                onClick={() => handleSubModuleClick(subModule.href)}
                              >
                                <SubIcon className="w-5 h-5 mr-3" />
                                <div className="text-left">
                                  <div className="font-medium">{subModule.name}</div>
                                  <div className="text-xs text-gray-400">{subModule.description}</div>
                                </div>
                              </Button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="truck" className="mt-6">
            <div className="grid grid-cols-1 gap-6">
              {managementModules.filter(m => m.id === 'truck-delivery-management').map((module, index) => {
                const Icon = module.icon;
                return (
                  <motion.div
                    key={module.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="overflow-hidden border border-gray-700 shadow-lg bg-gray-800">
                      <div className={`h-2 ${module.color}`} />
                      <CardHeader className={`${module.bgPattern} border-b border-gray-700`}>
                        <div className="flex items-center space-x-3">
                          <div className={`p-3 ${module.color} rounded-xl shadow-md`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">{module.title}</CardTitle>
                            <CardDescription>{module.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-3 gap-4">
                          {module.subModules.map((subModule) => {
                            const SubIcon = subModule.icon;
                            return (
                              <Button
                                key={subModule.name}
                                variant="outline"
                                className="h-auto p-4 justify-start border-gray-700 hover:bg-gray-700 text-gray-300"
                                onClick={() => handleSubModuleClick(subModule.href)}
                              >
                                <SubIcon className="w-5 h-5 mr-3" />
                                <div className="text-left">
                                  <div className="font-medium">{subModule.name}</div>
                                  <div className="text-xs text-gray-400">{subModule.description}</div>
                                </div>
                              </Button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* 底部帮助卡片 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <Card className="border border-gray-700 shadow-md bg-gradient-to-br from-gray-800 to-gray-850">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-md">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2 text-white">快速提示</h3>
                  <p className="text-sm text-gray-300 mb-4">
                    管理中心提供了完整的系统配置功能。每个模块都包含独立的管理界面，
                    可以进行数据管理、参数配置和实时监控。
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Database className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-400">
                        实时数据同步
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-400">
                        权限保护
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-gray-400">
                        性能监控
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-gray-400">
                        数据分析
                      </span>
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

export default ManagementHub;