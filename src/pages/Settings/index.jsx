import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Save,
  RefreshCw,
  Database,
  MapPin,
  Globe,
  Settings as SettingsIcon,
  Monitor,
  Palette,
  Bell,
  Shield,
  Download,
  Upload,
  Trash2,
  Users,
  UserCog,
  Lock,
  User,
  Mail,
  Calendar,
  Key,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';

const Settings = () => {
  const { user, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // 密码表单状态
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [settings, setSettings] = useState({
    // 地图设置
    map: {
      defaultZoom: 4,
      defaultCenter: { lat: 56.1304, lng: -106.3468 },
      maxZoom: 18,
      minZoom: 3,
      tileProvider: 'openstreetmap',
      showFSALabels: true,
      showProvinceLabels: true,
      animationDuration: 1000
    },
    // 数据设置
    data: {
      cacheDuration: 5 * 60 * 1000, // 5分钟
      autoRefresh: true,
      refreshInterval: 30000, // 30秒
      batchSize: 100,
      compressionEnabled: true
    },
    // 界面设置
    ui: {
      theme: 'dark',
      language: 'zh-CN',
      sidebarWidth: 320,
      showAnimations: true,
      compactMode: false,
      showTooltips: true
    },
    // 通知设置
    notifications: {
      enabled: true,
      dataUpdates: true,
      systemAlerts: true,
      performanceWarnings: true
    },
    // 安全设置
    security: {
      sessionTimeout: 30 * 60 * 1000, // 30分钟
      autoLogout: true,
      encryptLocalData: false,
      auditLog: true
    }
  });

  const [hasChanges, setHasChanges] = useState(false);

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // 保存设置到localStorage
    localStorage.setItem('app-settings', JSON.stringify(settings));
    setHasChanges(false);
    console.log('设置已保存:', settings);
  };

  const handleReset = () => {
    if (confirm('确定要重置所有设置到默认值吗？')) {
      localStorage.removeItem('app-settings');
      window.location.reload();
    }
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'canada-postal-settings.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importSettings = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          setSettings(importedSettings);
          setHasChanges(true);
        } catch (error) {
          alert('导入设置文件失败：文件格式不正确');
        }
      };
      reader.readAsText(file);
    }
  };

  // 处理密码修改
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // 验证新密码
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: '两次输入的新密码不一致' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: '新密码长度至少为6位' });
      return;
    }

    setLoading(true);
    try {
      const result = await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '密码修改失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '未知';
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取角色显示名称
  const getRoleDisplayName = (role) => {
    const roleMap = {
      'SUPER_ADMIN': '超级管理员',
      'ADMIN': '管理员',
      'MANAGER': '经理',
      'USER': '普通用户'
    };
    return roleMap[role] || role;
  };

  const tabs = [
    { id: 'map', label: '地图设置', icon: MapPin },
    { id: 'data', label: '数据设置', icon: Database },
    { id: 'ui', label: '界面设置', icon: Monitor },
    { id: 'notifications', label: '通知设置', icon: Bell },
    { id: 'security', label: '安全设置', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* 标题栏 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-3 rounded-lg">
              <SettingsIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">系统设置</h1>
              <p className="text-gray-400 mt-1">配置加拿大邮政地图系统</p>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center space-x-3">
            <button
              onClick={exportSettings}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>导出</span>
            </button>

            <label className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>导入</span>
              <input
                type="file"
                accept=".json"
                onChange={importSettings}
                className="hidden"
              />
            </label>

            <button
              onClick={handleReset}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>重置</span>
            </button>

            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                hasChanges 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{hasChanges ? '保存设置' : '已保存'}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* 账户设置面板 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gray-800 rounded-lg"
      >
        {/* 标签页 */}
        <div className="border-b border-gray-700">
          <nav className="flex space-x-1 px-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'profile'
                  ? 'text-blue-500 border-blue-500'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              <User className="inline w-4 h-4 mr-2" />
              个人信息
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'security'
                  ? 'text-blue-500 border-blue-500'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              <Shield className="inline w-4 h-4 mr-2" />
              安全设置
            </button>
          </nav>
        </div>

        {/* 内容区域 */}
        <div className="p-6">
          {/* 消息提示 */}
          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-lg flex items-center ${
                message.type === 'success'
                  ? 'bg-green-900/20 text-green-400 border border-green-800'
                  : 'bg-red-900/20 text-red-400 border border-red-800'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-2" />
              )}
              {message.text}
            </motion.div>
          )}

          {/* 个人信息标签页 */}
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 用户名 */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <User className="inline w-4 h-4 mr-1" />
                    用户名
                  </label>
                  <div className="bg-gray-900 rounded-lg px-4 py-3 text-white">
                    {user?.username || '未设置'}
                  </div>
                </div>

                {/* 邮箱 */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <Mail className="inline w-4 h-4 mr-1" />
                    邮箱
                  </label>
                  <div className="bg-gray-900 rounded-lg px-4 py-3 text-white">
                    {user?.email || '未设置'}
                  </div>
                </div>

                {/* 角色 */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <Shield className="inline w-4 h-4 mr-1" />
                    角色权限
                  </label>
                  <div className="bg-gray-900 rounded-lg px-4 py-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-800">
                      {getRoleDisplayName(user?.role)}
                    </span>
                  </div>
                </div>

                {/* 创建时间 */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    注册时间
                  </label>
                  <div className="bg-gray-900 rounded-lg px-4 py-3 text-white">
                    {formatDate(user?.createdAt)}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 安全设置标签页 */}
          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-md"
            >
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">
                  <Key className="inline w-5 h-5 mr-2" />
                  修改密码
                </h3>

                {/* 当前密码 */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    当前密码
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value
                      })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({
                        ...showPasswords,
                        current: !showPasswords.current
                      })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPasswords.current ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 新密码 */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    新密码
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value
                      })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({
                        ...showPasswords,
                        new: !showPasswords.new
                      })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPasswords.new ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">至少6个字符</p>
                </div>

                {/* 确认新密码 */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    确认新密码
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value
                      })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({
                        ...showPasswords,
                        confirm: !showPasswords.confirm
                      })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 提交按钮 */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
                    loading
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {loading ? (
                    <span>处理中...</span>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      保存修改
                    </>
                  )}
                </button>
              </form>

              {/* 安全提示 */}
              <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg">
                <h4 className="text-yellow-400 font-medium mb-2">
                  <AlertCircle className="inline w-4 h-4 mr-1" />
                  安全提示
                </h4>
                <ul className="text-yellow-300 text-sm space-y-1">
                  <li>• 定期修改密码以保护账户安全</li>
                  <li>• 使用强密码，包含字母、数字和特殊字符</li>
                  <li>• 不要与他人共享您的账户密码</li>
                  <li>• 修改密码后需要重新登录</li>
                </ul>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* 管理功能区域 - 仅对 SUPER_ADMIN 显示 */}
      {user?.role === 'SUPER_ADMIN' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-purple-600 p-2 rounded-lg">
                <UserCog className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">管理员功能</h2>
                <p className="text-gray-400 text-sm">超级管理员专属功能区域</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 用户管理卡片 */}
              <Link
                to="/settings/account-management"
                className="group relative bg-gray-700 rounded-lg p-6 hover:bg-gray-600 transition-all duration-200 hover:shadow-xl hover:scale-105"
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-blue-600 p-3 rounded-lg group-hover:bg-blue-500 transition-colors">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      可用
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    用户管理
                  </h3>
                  <p className="text-gray-400 text-sm flex-grow">
                    管理系统用户账户、分配角色权限、控制访问级别
                  </p>
                  <div className="mt-4 flex items-center text-blue-400 text-sm font-medium">
                    <span>进入管理</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>

              {/* 权限设置卡片 */}
              <Link
                to="/settings/permissions"
                className="group relative bg-gray-700 rounded-lg p-6 hover:bg-gray-600 transition-all duration-200 hover:shadow-xl hover:scale-105"
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-purple-600 p-3 rounded-lg group-hover:bg-purple-500 transition-colors">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      可用
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                    权限管理
                  </h3>
                  <p className="text-gray-400 text-sm flex-grow">
                    管理用户权限组、设置查询限制、控制模块访问权限
                  </p>
                  <div className="mt-4 flex items-center text-purple-400 text-sm font-medium">
                    <span>进入管理</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>

              {/* 审计日志卡片（占位，未来扩展） */}
              <div className="relative bg-gray-700 rounded-lg p-6 opacity-50 cursor-not-allowed">
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-gray-600 p-3 rounded-lg">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      开发中
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    审计日志
                  </h3>
                  <p className="text-gray-400 text-sm flex-grow">
                    查看系统操作日志、用户活动记录、安全事件追踪
                  </p>
                  <div className="mt-4 flex items-center text-gray-500 text-sm">
                    <span>即将推出</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-600 rounded-lg">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-yellow-500" />
                <p className="text-sm text-gray-300">
                  <span className="font-medium text-yellow-500">安全提示：</span>
                  管理员功能涉及系统核心设置，请谨慎操作。所有操作都会记录在系统日志中。
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Settings;