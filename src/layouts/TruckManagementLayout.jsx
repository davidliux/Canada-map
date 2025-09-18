import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, Building2, MapPin, ChevronRight, DollarSign } from 'lucide-react';

const TruckManagementLayout = () => {
  const location = useLocation();

  const tabs = [
    {
      name: '城市管理',
      href: '/management/truck-delivery/cities',
      icon: Building2,
      description: '管理卡车配送城市和区域划分'
    },
    {
      name: '区域配置',
      href: '/management/truck-delivery/regions',
      icon: MapPin,
      description: '配置卡车配送区域和覆盖范围'
    },
    {
      name: '定价配置',
      href: '/management/truck-delivery/pricing-config',
      icon: DollarSign,
      description: '管理四种定价模式的配置'
    },
  ];

  const currentTab = tabs.find(tab => tab.href === location.pathname);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 shadow-lg">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
              <Link to="/" className="hover:text-white transition-colors">首页</Link>
              <ChevronRight className="w-4 h-4" />
              <Link to="/management" className="hover:text-white transition-colors">管理中心</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">卡车配送管理</span>
              {currentTab && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-white">{currentTab.name}</span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <Truck className="w-8 h-8 text-purple-500" />
              <div>
                <h1 className="text-2xl font-bold text-white">卡车配送管理中心</h1>
                <p className="mt-1 text-sm text-gray-400">
                  管理卡车配送城市、区域配置和配送范围设置
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="bg-gray-800 border-t border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = location.pathname === tab.href;
              
              return (
                <Link
                  key={tab.name}
                  to={tab.href}
                  className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                    ${isActive
                      ? 'border-purple-500 text-purple-500'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                    }
                  `}
                  title={tab.description}
                >
                  <Icon className={`
                    -ml-0.5 mr-2 h-5 w-5 transition-colors duration-200
                    ${isActive ? 'text-purple-500' : 'text-gray-400 group-hover:text-gray-300'}
                  `} />
                  <span>{tab.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TruckManagementLayout;