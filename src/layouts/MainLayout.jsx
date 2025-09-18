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
  Truck,
  Monitor,
  Sliders,
  ChevronLeft,
  LogOut,
  User
} from 'lucide-react';
import AnimatedSearchBox from '../components/AnimatedSearchBox';
import FilterButtonGroup from '../components/FilterButtonGroup';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState([]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const navigation = [
    { name: '仪表板', href: '/dashboards', icon: Monitor },
    { name: '管理中心', href: '/management', icon: Sliders },
    { name: '系统设置', href: '/settings', icon: Settings },
  ];

  // 判断是否为FSA仪表板页面（只在FSA仪表板显示邮编筛选）
  const isFSADashboard = location.pathname === '/dashboards/fsa';

  // 判断是否在仪表板区域（用于显示导航）
  const isInDashboardArea = location.pathname === '/' || location.pathname.startsWith('/dashboards');

  // 判断是否为卡车配送大屏页面（隐藏侧边栏）
  const isTruckDeliveryDashboard = location.pathname === '/dashboards/truck-delivery';

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
    // 特殊处理仪表板路径，因为根路径 "/" 也应该匹配 "/dashboards"
    if (path === '/dashboards') {
      return location.pathname === '/' || location.pathname.startsWith('/dashboards');
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

      {/* Sidebar - 扩大宽度从w-64到w-80，在卡车配送大屏页面隐藏 */}
      {!isTruckDeliveryDashboard && (
      <div className={`
        fixed top-0 left-0 z-50 h-full w-80 bg-gray-800 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="h-24 px-2 py-2 bg-gray-900 relative">
            <Logo size="sidebar" className="h-full" />
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white absolute top-4 right-4 z-10"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
            {/* 只在FSA仪表板页面显示邮编筛选 */}
            {isFSADashboard ? (
              <div className="space-y-6">
                {/* 返回导航 */}
                <div className="px-3 pb-3 border-b border-gray-700">
                  <Link
                    to="/dashboards"
                    className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    <span className="text-sm">返回仪表板选择</span>
                  </Link>
                </div>

                {/* 配送区域覆盖盒标题 */}
                <div className="px-3">
                  <div className="flex items-center space-x-2 mb-4">
                    <Database className="w-5 h-5 text-blue-500" />
                    <h2 className="text-lg font-semibold text-white">FSA邮编筛选</h2>
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
              /* 其他页面显示主导航 */
              <div className="space-y-1">
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
      )}

      {/* Main content - 更新左边距以匹配新的边栏宽度，确保高度占满，卡车配送大屏页面不需要间距 */}
      <div className={`h-screen flex flex-col ${isTruckDeliveryDashboard ? '' : 'lg:pl-80'}`}>
        {/* Top bar - 压缩顶部栏高度，卡车配送大屏页面隐藏 */}
        {!isTruckDeliveryDashboard && (
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
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 hover:bg-gray-700 rounded-lg px-2 py-1 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-gray-300">{user?.username || '管理员'}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-400 border-b border-gray-700">
                        <div className="font-medium">{user?.username}</div>
                        <div className="text-xs">{user?.role === 'SUPER_ADMIN' ? '超级管理员' : user?.role === 'ADMIN' ? '管理员' : '用户'}</div>
                      </div>
                      <button
                        onClick={() => {
                          navigate('/settings/account');
                          setShowUserMenu(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                      >
                        <User className="inline w-4 h-4 mr-2" />
                        账户设置
                      </button>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                      >
                        <LogOut className="inline w-4 h-4 mr-2" />
                        退出登录
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}

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