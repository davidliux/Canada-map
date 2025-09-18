import React from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  MapPin,
  Package,
  Truck,
  TrendingUp,
  Activity,
  Users,
  Clock
} from 'lucide-react';
import EmptyState from './EmptyState';

/**
 * 统计概览组件
 * 显示总体统计信息（城市数、区域数、FSA覆盖等）
 * Requirements: FR-009
 */
const StatsOverview = ({
  stats = {},
  className = ''
}) => {
  const statsCards = [
    {
      id: 'cities',
      title: '配送城市',
      value: stats.totalCities || 0,
      unit: '个',
      icon: Building2,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      description: '已开通配送服务的城市'
    },
    {
      id: 'regions',
      title: '配送区域',
      value: stats.totalRegions || 0,
      unit: '个',
      icon: MapPin,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/10',
      description: '已划分的配送区域'
    },
    {
      id: 'fsas',
      title: 'FSA覆盖',
      value: stats.totalFSAs || 0,
      unit: '个',
      icon: Package,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10',
      description: '前向分拣区域代码'
    },
    {
      id: 'coverage',
      title: '覆盖率',
      value: stats.coverageRate || 0,
      unit: '%',
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-500/10',
      description: '全国FSA覆盖比例'
    },
    {
      id: 'deliveries',
      title: '今日配送',
      value: stats.dailyDeliveries || 0,
      unit: '单',
      icon: Truck,
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-500/10',
      description: '今日配送订单数量'
    },
    {
      id: 'drivers',
      title: '活跃司机',
      value: stats.activeDrivers || 0,
      unit: '人',
      icon: Users,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-500/10',
      description: '当前在线司机数量'
    },
    {
      id: 'provinces',
      title: '覆盖省份',
      value: stats.activeProvinces || 0,
      unit: '个',
      icon: Activity,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-500/10',
      description: '已开通服务的省份'
    },
    {
      id: 'avgTime',
      title: '平均时效',
      value: stats.avgDeliveryTime || 0,
      unit: '小时',
      icon: Clock,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-500/10',
      description: '平均配送时间'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className={`p-6 h-full overflow-auto ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">配送系统概览</h2>
        <p className="text-gray-400 mt-1">实时监控配送网络运营状态</p>
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.id}
              variants={itemVariants}
              className="relative group"
            >
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300">
                {/* 背景渐变 */}
                <div className={`absolute inset-0 rounded-xl ${stat.bgColor} opacity-5 group-hover:opacity-10 transition-opacity`} />

                {/* 图标 */}
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${stat.color} mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* 标题 */}
                <h3 className="text-sm font-medium text-gray-400 mb-2">{stat.title}</h3>

                {/* 数值 */}
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </span>
                  <span className="text-sm text-gray-500">{stat.unit}</span>
                </div>

                {/* 描述 */}
                <p className="text-xs text-gray-500 mt-2">{stat.description}</p>

                {/* 装饰线 */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color} rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* 底部信息 */}
      <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-400">系统状态：</span>
            <span className="text-sm font-medium text-green-500">正常运行</span>
          </div>
          <div className="text-xs text-gray-500">
            最后更新：{new Date().toLocaleTimeString('zh-CN')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;