import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Settings,
  Package,
  Truck,
  MapPin,
  DollarSign,
  Mail,
  ChevronRight,
  Shield,
  Zap,
  Users,
  Target,
  Building2,
  FileText,
  Calculator
} from 'lucide-react';

const ManagementHub = () => {
  const navigate = useNavigate();

  // 管理模块数据配置
  const managementModules = [
    {
      id: 'fsa-management',
      title: 'FSA管理',
      description: '管理FSA配送区域、价格配置和邮编管理',
      icon: Package,
      color: 'from-gray-600 to-gray-700',
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
        },
        {
          name: '邮编管理',
          icon: Mail,
          description: '管理邮编数据库',
          href: '/management/fsa/postal-codes'
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
      description: '管理城市配送、服务商、区域配置和价格策略',
      icon: Truck,
      color: 'from-gray-600 to-gray-700',
      category: '卡车配送系统',
      subModules: [
        {
          name: '城市管理',
          icon: Users,
          description: '管理配送城市',
          href: '/management/truck-delivery/cities'
        },
        {
          name: '服务商管理',
          icon: Building2,
          description: '管理物流服务商',
          href: '/management/truck-delivery/providers'
        },
        {
          name: '区域配置',
          icon: Target,
          description: '配置配送区域',
          href: '/management/truck-delivery/regions'
        },
        {
          name: '价格策略',
          icon: DollarSign,
          description: '设置价格策略',
          href: '/management/truck-delivery/pricing'
        },
        {
          name: '动态定价',
          icon: Calculator,
          description: '管理动态定价规则',
          href: '/management/truck-delivery/dynamic-pricing'
        }
      ],
      stats: {
        cities: '25+',
        providers: '10+',
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
    <div className="h-full bg-gray-900 p-6">
      {/* 页面标题 */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Settings className="w-10 h-10 text-gray-500" />
          <div>
            <h1 className="text-3xl font-bold text-white">管理中心</h1>
            <p className="text-gray-400 text-lg mt-1">选择您需要管理的系统模块</p>
          </div>
        </div>
        
        {/* 系统状态指示器 */}
        <div className="flex items-center space-x-6 mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">管理系统在线</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-300">权限验证已启用</span>
          </div>
        </div>
      </div>

      {/* 管理模块卡片网格 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
        {managementModules.map((module, index) => {
          const Icon = module.icon;
          
          return (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group"
            >
              <div className="bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                {/* 卡片头部 - 灰色渐变背景 */}
                <div className={`h-32 rounded-t-xl bg-gradient-to-r ${module.color} p-6 relative overflow-hidden`}>
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
                  
                  {/* 分类标签 */}
                  <div className="absolute bottom-4 right-4">
                    <span className="text-xs text-white bg-black bg-opacity-30 px-2 py-1 rounded-full">
                      {module.category}
                    </span>
                  </div>
                </div>

                {/* 卡片内容 */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">
                        {module.title}
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {module.description}
                      </p>
                    </div>
                  </div>

                  {/* 子模块列表 */}
                  <div className="mb-6">
                    <div className="space-y-2">
                      {module.subModules.map((subModule) => {
                        const SubModuleIcon = subModule.icon;
                        return (
                          <div
                            key={subModule.name}
                            className="flex items-center justify-between p-3 bg-gray-750 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors group/item"
                            onClick={() => handleSubModuleClick(subModule.href)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center group-hover/item:bg-gray-500 transition-colors">
                                <SubModuleIcon className="w-4 h-4 text-gray-300" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-white group-hover/item:text-gray-300 transition-colors">
                                  {subModule.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {subModule.description}
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-500 group-hover/item:text-white group-hover/item:translate-x-1 transition-all" />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 统计信息 */}
                  <div className="border-t border-gray-700 pt-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">
                          {module.stats.regions || module.stats.cities}
                        </div>
                        <div className="text-xs text-gray-400">
                          {module.stats.regions ? '区域数' : '城市数'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">
                          {module.stats.configured || module.stats.routes}
                        </div>
                        <div className="text-xs text-gray-400">
                          {module.stats.configured ? '配置率' : '路线数'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="text-sm font-medium text-green-500">{module.stats.status}</div>
                        </div>
                        <div className="text-xs text-gray-400">状态</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 卡片底部操作区域 */}
                <div className={`px-6 py-4 bg-gradient-to-r ${module.color} bg-opacity-5 rounded-b-xl border-t border-gray-700`}>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      点击子模块进入管理界面
                    </div>
                    <div className="flex items-center space-x-2 text-gray-500">
                      <span className="text-xs">{module.subModules.length} 个功能</span>
                      <Settings className="w-4 h-4" />
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
            <h3 className="text-lg font-semibold text-white">管理提示</h3>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            每个管理模块提供完整的配置功能，包括数据管理、参数设置和系统监控。
            请根据您的权限级别选择相应的管理功能。
          </p>
          
          {/* 快捷操作提示 */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-gray-400">FSA系统：120+ 区域管理</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-xs text-gray-400">卡车配送：25+ 城市 | 10+ 服务商</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ManagementHub;