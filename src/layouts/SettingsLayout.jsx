import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Map, DollarSign, MapPin, ChevronRight } from 'lucide-react';

const SettingsLayout = () => {
  const location = useLocation();

  const tabs = [
    {
      name: '区域管理',
      href: '/settings/regions',
      icon: Map,
      description: '管理配送区域和FSA分配'
    },
    {
      name: '价格配置',
      href: '/settings/prices',
      icon: DollarSign,
      description: '设置区域价格和重量区间'
    },
    {
      name: '邮编管理',
      href: '/settings/postal-codes',
      icon: MapPin,
      description: '管理邮政编码和FSA数据'
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
              <Link to="/" className="hover:text-white">首页</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">配置管理</span>
              {currentTab && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-white">{currentTab.name}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white">配置管理中心</h1>
            <p className="mt-1 text-sm text-gray-400">
              管理系统配置、区域划分、价格设置和邮编数据
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
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
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${isActive
                      ? 'border-blue-500 text-blue-500'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-300'}
                  `} />
                  <span>{tab.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;