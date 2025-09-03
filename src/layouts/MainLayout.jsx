import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Map, 
  Settings, 
  Menu, 
  X, 
  Home,
  Package,
  DollarSign,
  MapPin,
  BarChart3,
  FileText,
  HelpCircle,
  Filter,
  Database,
  Zap
} from 'lucide-react';
import AnimatedSearchBox from '../components/AnimatedSearchBox';
import FilterButtonGroup from '../components/FilterButtonGroup';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState([]);

  const navigation = [
    { name: '数据大屏', href: '/', icon: Home },
    { name: '配置管理', href: '/settings', icon: Settings },
  ];

  const quickLinks = [
    { name: '区域管理', href: '/settings/regions', icon: Map },
    { name: '价格配置', href: '/settings/prices', icon: DollarSign },
    { name: '邮编管理', href: '/settings/postal-codes', icon: MapPin },
  ];

  // 判断是否为主页（数据大屏）
  const isDashboard = location.pathname === '/';

  // 搜索处理
  const handleSearch = (query) => {
    setSearchQuery(query);
    // 将搜索查询传递给Dashboard组件
    if (window.mapSearchHandler) {
      window.mapSearchHandler(query);
    }
  };

  // 搜索选择处理
  const handleSearchSelect = (suggestion) => {
    if (window.mapSelectHandler) {
      window.mapSelectHandler(suggestion);
    }
  };

  // 筛选处理
  const handleProvinceFilter = (provinceCode, isActive) => {
    const filterKey = `province:${provinceCode}`;
    setSelectedFilters(prev => {
      const newFilters = isActive 
        ? [...prev, filterKey]
        : prev.filter(f => f !== filterKey);
      
      // 传递给Dashboard组件
      if (window.mapFilterHandler) {
        window.mapFilterHandler(newFilters);
      }
      
      return newFilters;
    });
  };

  const handleCityFilter = (cityCode, isActive) => {
    const filterKey = `city:${cityCode}`;
    setSelectedFilters(prev => {
      const newFilters = isActive 
        ? [...prev, filterKey]
        : prev.filter(f => f !== filterKey);
      
      // 传递给Dashboard组件
      if (window.mapFilterHandler) {
        window.mapFilterHandler(newFilters);
      }
      
      return newFilters;
    });
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - 扩大宽度从w-64到w-80 */}
      <div className={`
        fixed top-0 left-0 z-50 h-full w-80 bg-gray-800 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 bg-gray-900">
            <div className="flex items-center space-x-2">
              <Package className="w-8 h-8 text-blue-500" />
              <span className="text-white font-bold text-lg">加拿大邮政系统</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
            {/* 主页显示搜索和筛选 */}
            {isDashboard ? (
              <div className="space-y-6">
                {/* 配送区域覆盖盒标题 */}
                <div className="px-3">
                  <div className="flex items-center space-x-2 mb-4">
                    <Database className="w-5 h-5 text-blue-500" />
                    <h2 className="text-lg font-semibold text-white">邮编筛选</h2>
                  </div>
                  <p className="text-sm text-gray-400">配送区域筛选</p>
                </div>

                {/* 搜索框 */}
                <div className="px-3">
                  <AnimatedSearchBox
                    onSearch={handleSearch}
                    onSelect={handleSearchSelect}
                    searchHistory={searchHistory}
                    onHistoryUpdate={setSearchHistory}
                  />
                </div>

                {/* 筛选按钮组 */}
                <div className="px-1">
                  <FilterButtonGroup
                    onProvinceFilter={handleProvinceFilter}
                    onCityFilter={handleCityFilter}
                    selectedFilters={selectedFilters}
                  />
                </div>
              </div>
            ) : (
              /* 非主页显示原有导航 */
              <>
                <div className="space-y-1">
                  <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    主导航
                  </p>
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`
                          group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                          ${isActive(item.href)
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }
                        `}
                      >
                        <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-8 space-y-1">
                  <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    快捷访问
                  </p>
                  {quickLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`
                          group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                          ${isActive(item.href)
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }
                        `}
                      >
                        <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </nav>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-gray-700">
            <div className="p-4">
              <button className="group flex w-full items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors">
                <HelpCircle className="mr-3 h-5 w-5" />
                帮助文档
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content - 更新左边距以匹配新的边栏宽度，确保高度占满 */}
      <div className="lg:pl-80 h-screen flex flex-col">
        {/* Top bar - 压缩顶部栏高度 */}
        <div className="sticky top-0 z-30 flex h-12 bg-gray-800 shadow-lg flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 text-gray-400 hover:text-white focus:outline-none lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 items-center justify-between px-4">
            <div className="flex items-center space-x-2 text-gray-300">
              <BarChart3 className="w-5 h-5" />
              <span className="text-sm">系统状态: 正常运行</span>
            </div>

            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/settings')}
                className="text-gray-400 hover:text-white transition-colors"
                title="系统设置"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button className="text-gray-400 hover:text-white">
                <FileText className="w-5 h-5" />
              </button>
              <div className="h-8 w-px bg-gray-700" />
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">A</span>
                </div>
                <span className="text-sm text-gray-300">管理员</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content - 确保页面内容占满剩余高度 */}
        <main className="flex-1 h-full">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;