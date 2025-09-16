import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Map, DollarSign, MapPin, ChevronRight, Database } from 'lucide-react';

const FSAManagementLayout = () => {
  const location = useLocation();

  const tabs = [
    {
      name: '区域管理',
      href: '/management/fsa/regions',
      icon: Map,
      description: '管理FSA区域分配和配送区域设置'
    },
    {
      name: '价格配置',
      href: '/management/fsa/prices',
      icon: DollarSign,
      description: '设置各区域的配送价格和重量区间'
    },
    {
      name: '邮编管理',
      href: '/management/fsa/postal-codes',
      icon: MapPin,
      description: '管理邮政编码数据和FSA映射关系'
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
              <span className="text-white">FSA管理</span>
              {currentTab && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-white">{currentTab.name}</span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <Database className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold text-white">FSA管理中心</h1>
                <p className="mt-1 text-sm text-gray-400">
                  管理前向分拣区域、配送区域划分、价格配置和邮政编码数据
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
                      ? 'border-blue-500 text-blue-500'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                    }
                  `}
                  title={tab.description}
                >
                  <Icon className={`
                    -ml-0.5 mr-2 h-5 w-5 transition-colors duration-200
                    ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-300'}
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

export default FSAManagementLayout;