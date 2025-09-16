// Provider Form Component
// 服务商创建/编辑表单组件

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Save,
  Truck,
  Package,
  Info,
  Phone,
  Mail,
  Globe,
  MapPin,
  User
} from 'lucide-react';

const ProviderForm = ({ provider, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'EXPRESS',
    status: 'PENDING',
    description: '',
    contactInfo: {
      contactPerson: '',
      email: '',
      phone: '',
      website: '',
      address: ''
    },
    capabilities: [],
    businessRules: {
      maxWeight: '',
      maxVolume: '',
      deliveryDays: '',
      cutoffTime: ''
    },
    priority: 100,
    isActive: true
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (provider) {
      setFormData({
        ...provider,
        contactInfo: provider.contactInfo || formData.contactInfo,
        businessRules: provider.businessRules || formData.businessRules,
        capabilities: provider.capabilities || []
      });
    }
  }, [provider]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // 清除对应的错误
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleContactChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [field]: value
      }
    }));
  };

  const handleBusinessRuleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      businessRules: {
        ...prev.businessRules,
        [field]: value
      }
    }));
  };

  const handleCapabilityToggle = (capability) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities.includes(capability)
        ? prev.capabilities.filter(c => c !== capability)
        : [...prev.capabilities, capability]
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.code) {
      newErrors.code = '服务商代码是必填项';
    }
    if (!formData.name) {
      newErrors.name = '服务商名称是必填项';
    }
    if (!formData.contactInfo.email) {
      newErrors.email = '联系邮箱是必填项';
    } else if (!/\S+@\S+\.\S+/.test(formData.contactInfo.email)) {
      newErrors.email = '邮箱格式不正确';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const url = provider 
        ? `/api/v1/providers/${provider.id}`
        : '/api/v1/providers';
      
      const method = provider ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        onSave(data.data);
      } else {
        setErrors({ submit: data.error || '保存失败' });
      }
    } catch (error) {
      console.error('Error saving provider:', error);
      setErrors({ submit: '保存失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  const providerTypes = [
    { value: 'EXPRESS', label: '快递', icon: Truck },
    { value: 'FREIGHT', label: '货运', icon: Package },
    { value: 'DEDICATED', label: '专线', icon: MapPin },
    { value: 'LTL', label: '零担', icon: Package },
    { value: 'FTL', label: '整车', icon: Truck }
  ];

  const capabilities = [
    '同日达',
    '次日达',
    '冷链运输',
    '危险品运输',
    '大件运输',
    '国际运输',
    '上门取件',
    '送货上门',
    '签收服务',
    '保价服务',
    '代收货款',
    '仓储服务'
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">
            {provider ? '编辑服务商' : '添加服务商'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* 基本信息 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-4">基本信息</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  服务商代码 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 ${
                    errors.code ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="如：PDN、FGX"
                  disabled={!!provider}
                />
                {errors.code && (
                  <p className="mt-1 text-sm text-red-400">{errors.code}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  服务商名称 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="服务商名称"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">类型</label>
                <div className="grid grid-cols-3 gap-2">
                  {providerTypes.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleChange('type', type.value)}
                      className={`px-3 py-2 rounded-lg border transition-all flex items-center justify-center gap-1 ${
                        formData.type === type.value
                          ? 'bg-cyan-900/30 border-cyan-500 text-cyan-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <type.icon className="w-4 h-4" />
                      <span className="text-sm">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">优先级</label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  placeholder="数字越小优先级越高"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm text-gray-400 mb-1">描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                rows="3"
                placeholder="服务商描述信息"
              />
            </div>
          </div>

          {/* 联系信息 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-4">联系信息</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  联系人
                </label>
                <input
                  type="text"
                  value={formData.contactInfo.contactPerson}
                  onChange={(e) => handleContactChange('contactPerson', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  placeholder="联系人姓名"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  邮箱 <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={formData.contactInfo.email}
                  onChange={(e) => handleContactChange('email', e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="contact@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  <Phone className="w-4 h-4 inline mr-1" />
                  电话
                </label>
                <input
                  type="tel"
                  value={formData.contactInfo.phone}
                  onChange={(e) => handleContactChange('phone', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  <Globe className="w-4 h-4 inline mr-1" />
                  网站
                </label>
                <input
                  type="url"
                  value={formData.contactInfo.website}
                  onChange={(e) => handleContactChange('website', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm text-gray-400 mb-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                地址
              </label>
              <input
                type="text"
                value={formData.contactInfo.address}
                onChange={(e) => handleContactChange('address', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                placeholder="公司地址"
              />
            </div>
          </div>

          {/* 服务能力 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-4">服务能力</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {capabilities.map(capability => (
                <label
                  key={capability}
                  className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={formData.capabilities.includes(capability)}
                    onChange={() => handleCapabilityToggle(capability)}
                    className="w-4 h-4 rounded border-gray-600 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-sm text-gray-300">{capability}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 业务规则 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-4">业务规则</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">最大重量 (kg)</label>
                <input
                  type="number"
                  value={formData.businessRules.maxWeight}
                  onChange={(e) => handleBusinessRuleChange('maxWeight', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  placeholder="最大承载重量"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">最大体积 (m³)</label>
                <input
                  type="number"
                  value={formData.businessRules.maxVolume}
                  onChange={(e) => handleBusinessRuleChange('maxVolume', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  placeholder="最大承载体积"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">配送时效 (天)</label>
                <input
                  type="text"
                  value={formData.businessRules.deliveryDays}
                  onChange={(e) => handleBusinessRuleChange('deliveryDays', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  placeholder="如：1-3"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">截单时间</label>
                <input
                  type="time"
                  value={formData.businessRules.cutoffTime}
                  onChange={(e) => handleBusinessRuleChange('cutoffTime', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* 错误提示 */}
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-900 rounded-lg">
              <p className="text-red-400 text-sm">{errors.submit}</p>
            </div>
          )}
        </form>

        {/* 底部操作 */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProviderForm;