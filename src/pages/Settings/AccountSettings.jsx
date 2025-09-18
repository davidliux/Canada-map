import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Key,
  Save,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AccountSettings = () => {
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

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg shadow-xl"
        >
          {/* 头部 */}
          <div className="border-b border-gray-700 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">账户设置</h1>
            <p className="text-gray-400 text-sm mt-1">管理您的账户信息和安全设置</p>
          </div>

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
      </div>
    </div>
  );
};

export default AccountSettings;