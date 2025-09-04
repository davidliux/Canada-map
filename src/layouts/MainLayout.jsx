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
  Zap,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react';
import AnimatedSearchBox from '../components/AnimatedSearchBox';
import FilterButtonGroup from '../components/FilterButtonGroup';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // 默认关闭
  const [searchModalOpen, setSearchModalOpen] = useState(false); // 搜索弹窗状态
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

  // 暂时禁用快捷键功能
  // React.useEffect(() => {
  //   const handleKeyDown = (e) => {
  //     // Ctrl+Enter (Windows/Linux) 或 Cmd+Enter (Mac)
  //     if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
  //       e.preventDefault();
  //       setSearchModalOpen(true);
  //     }
  //     // ESC 键关闭搜索弹窗
  //     if (e.key === 'Escape' && searchModalOpen) {
  //       setSearchModalOpen(false);
  //     }
  //   };

  //   if (isDashboard) {
  //     window.addEventListener('keydown', handleKeyDown);
  //     return () => window.removeEventListener('keydown', handleKeyDown);
  //   }
  // }, [isDashboard, searchModalOpen]);

  // 搜索处理
  const handleSearch = (query) => {
    setSearchQuery(query);
    // 将搜索查询传递给Dashboard组件
    if (window.mapSearchHandler) {
      window.mapSearchHandler(query);
    }
    // 直接触发地图定位
    if (window.triggerMapSearch) {
      window.triggerMapSearch(query);
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
      {/* 移除背景遮罩，保持主界面高亮 */}

      {/* 搜索弹窗 - 暂时禁用 */}
      
      {/* 悬浮按钮 - 更加精致和低调的设计 */}
      {!sidebarOpen && isDashboard && (
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 0.7, x: 0 }}
          whileHover={{ opacity: 1, x: 5 }}
          transition={{ duration: 0.2 }}
          onClick={() => setSidebarOpen(true)}
          className="fixed left-0 top-24 z-40 bg-gray-800/80 hover:bg-gray-700/90 text-gray-400 hover:text-white py-3 px-2 rounded-r-lg backdrop-blur-sm border-y border-r border-gray-700/50 transition-all duration-200 group"
          title="打开筛选面板"
        >
          <div className="flex flex-col items-center space-y-1">
            <div className="flex space-x-0.5">
              <div className="w-1 h-1 bg-current rounded-full"></div>
              <div className="w-1 h-1 bg-current rounded-full"></div>
              <div className="w-1 h-1 bg-current rounded-full"></div>
            </div>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </motion.button>
      )}

      {/* Sidebar - 默认隐藏，通过按钮控制显示 */}
      <div className={`
        fixed top-0 left-0 z-50 h-full w-80 bg-gray-800 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0 shadow-[0_0_50px_rgba(0,0,0,0.5)]' : '-translate-x-full'}
      `}>
        {/* 侧边栏右边缘的关闭按钮 - 精致设计 */}
        {sidebarOpen && isDashboard && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            whileHover={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            onClick={() => setSidebarOpen(false)}
            className="absolute -right-8 top-24 bg-gray-800/80 hover:bg-gray-700/90 text-gray-400 hover:text-white py-3 px-1.5 rounded-r-lg backdrop-blur-sm border-y border-r border-gray-700/50 transition-all duration-200"
            title="关闭筛选面板"
          >
            <ChevronLeft className="w-3 h-3" />
          </motion.button>
        )}
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 bg-gray-900">
            <div className="flex items-center space-x-2">
              <Package className="w-8 h-8 text-blue-500" />
              <span className="text-white font-bold text-lg">加拿大邮政系统</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
              title="关闭面板"
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

      {/* Main content - 根据侧边栏状态动态调整 */}
      <div className={`h-screen flex flex-col transition-all duration-300 ease-in-out ${
        sidebarOpen && isDashboard ? 'ml-80' : 'ml-0'
      }`}>
        {/* Top bar - 压缩顶部栏高度 */}
        <div className="sticky top-0 z-30 flex h-12 bg-gray-800 shadow-lg flex-shrink-0">
          <div className="flex flex-1 items-center justify-between px-6">
            <div className="flex items-center space-x-4 text-gray-300">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span className="text-sm">系统状态: 正常运行</span>
              </div>
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