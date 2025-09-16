import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  Building2, 
  MapPin, 
  Palette, 
  AlertCircle, 
  CheckCircle,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';

import cityDatabaseService from '../../utils/storage/cityDatabaseService.js';

/**
 * 城市编辑对话框组件
 * 
 * 功能特性：
 * - 城市名称、省份、主题色输入
 * - HTML5 颜色选择器
 * - 城市名称唯一性验证
 * - 表单验证和错误提示
 * - 动画效果和用户体验优化
 */
const CityEditDialog = ({ isOpen, onClose, cityData, isCreating = false }) => {
  // === 表单状态 ===
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    province: '',
    themeColor: '#3B82F6',
    isActive: true
  });

  const [validation, setValidation] = useState({
    name: { isValid: true, error: '' },
    province: { isValid: true, error: '' },
    themeColor: { isValid: true, error: '' }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [saveError, setSaveError] = useState('');

  // === 预设主题色 ===
  const presetColors = [
    '#3B82F6', // 蓝色
    '#10B981', // 绿色
    '#F59E0B', // 琥珀色
    '#EF4444', // 红色
    '#8B5CF6', // 紫色
    '#06B6D4', // 青色
    '#F97316', // 橙色
    '#84CC16', // 石灰色
    '#EC4899', // 粉色
    '#6B7280'  // 灰色
  ];

  // === 初始化表单数据 ===
  useEffect(() => {
    if (isOpen) {
      if (cityData && !isCreating) {
        // 编辑模式：使用现有城市数据
        setFormData({
          id: cityData.id,
          name: cityData.name,
          province: cityData.province,
          themeColor: cityData.themeColor || '#3B82F6',
          isActive: cityData.isActive !== false
        });
      } else {
        // 创建模式：重置为默认值
        setFormData({
          id: generateCityId(),
          name: '',
          province: '',
          themeColor: '#3B82F6',
          isActive: true
        });
      }

      // 重置验证状态
      setValidation({
        name: { isValid: true, error: '' },
        province: { isValid: true, error: '' },
        themeColor: { isValid: true, error: '' }
      });
      setSaveError('');
    }
  }, [isOpen, cityData, isCreating]);

  // === 生成城市ID ===
  const generateCityId = () => {
    // 生成更短的ID，使用城市名或时间戳的简短版本
    const timestamp = Date.now().toString(36).substr(-6);
    const random = Math.random().toString(36).substr(2, 4);
    return `c${timestamp}${random}`.substring(0, 20); // 确保不超过20个字符
  };

  // === 表单验证 ===
  const validateField = async (fieldName, value) => {
    const newValidation = { ...validation };

    switch (fieldName) {
      case 'name':
        if (!value.trim()) {
          newValidation.name = { isValid: false, error: '城市名称不能为空' };
        } else if (value.length < 2) {
          newValidation.name = { isValid: false, error: '城市名称至少需要2个字符' };
        } else if (value.length > 50) {
          newValidation.name = { isValid: false, error: '城市名称不能超过50个字符' };
        } else {
          // 检查名称唯一性
          const isDuplicate = await checkNameUniqueness(value);
          if (isDuplicate) {
            newValidation.name = { isValid: false, error: '此城市名称已存在' };
          } else {
            newValidation.name = { isValid: true, error: '' };
          }
        }
        break;

      case 'province':
        if (!value.trim()) {
          newValidation.province = { isValid: false, error: '省份不能为空' };
        } else if (value.length < 2) {
          newValidation.province = { isValid: false, error: '省份名称至少需要2个字符' };
        } else if (value.length > 20) {
          newValidation.province = { isValid: false, error: '省份名称不能超过20个字符' };
        } else {
          newValidation.province = { isValid: true, error: '' };
        }
        break;

      case 'themeColor':
        if (!value) {
          newValidation.themeColor = { isValid: false, error: '请选择主题色' };
        } else if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
          newValidation.themeColor = { isValid: false, error: '颜色格式不正确' };
        } else {
          newValidation.themeColor = { isValid: true, error: '' };
        }
        break;
    }

    setValidation(newValidation);
    return newValidation[fieldName].isValid;
  };

  // === 检查名称唯一性 ===
  const checkNameUniqueness = async (name) => {
    if (!name.trim()) return false;
    
    setIsCheckingName(true);
    
    try {
      const cities = await cityDatabaseService.getAllCities();
      const isDuplicate = cities.some(city => 
        city.name.toLowerCase() === name.toLowerCase() && 
        city.id !== formData.id
      );
      
      return isDuplicate;
    } catch (error) {
      console.error('检查名称唯一性失败:', error);
      return false;
    } finally {
      setIsCheckingName(false);
    }
  };

  // === 表单字段变更处理 ===
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // 延迟验证以提升用户体验
    if (field === 'name') {
      setTimeout(() => validateField(field, value), 500);
    } else {
      validateField(field, value);
    }
  };

  // === 表单提交 ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 验证所有字段
    const isNameValid = await validateField('name', formData.name);
    const isProvinceValid = await validateField('province', formData.province);
    const isThemeColorValid = await validateField('themeColor', formData.themeColor);

    if (!isNameValid || !isProvinceValid || !isThemeColorValid) {
      return;
    }

    setIsSaving(true);
    setSaveError('');

    try {
      // 构建完整的城市数据
      const cityPayload = {
        id: formData.id,
        name: formData.name.trim(),
        province: formData.province.trim(),
        themeColor: formData.themeColor,
        isActive: formData.isActive,
        regions: cityData?.regions || [], // 保持现有区域数据
        metadata: {
          ...(cityData?.metadata || {}),
          createdAt: cityData?.metadata?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: (cityData?.metadata?.version || 0) + 1
        }
      };

      const success = await cityDatabaseService.saveCity(cityPayload);

      if (success) {
        console.log(`✅ 城市${isCreating ? '创建' : '更新'}成功:`, cityPayload.name);
        onClose();
      } else {
        setSaveError(`${isCreating ? '创建' : '更新'}城市失败，请重试`);
      }
    } catch (error) {
      console.error(`${isCreating ? '创建' : '更新'}城市失败:`, error);
      setSaveError(`${isCreating ? '创建' : '更新'}城市失败: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // === 关闭对话框 ===
  const handleClose = () => {
    if (isSaving) return; // 保存中不允许关闭
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto"
        >
          {/* 对话框头部 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <Building2 className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">
                {isCreating ? '新建城市' : `编辑城市: ${cityData?.name}`}
              </h2>
            </div>
            
            <motion.button
              onClick={handleClose}
              disabled={isSaving}
              className="p-1 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* 表单内容 */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* 城市名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                城市名称 *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors ${
                    validation.name.isValid 
                      ? 'border-gray-600 focus:ring-blue-500 focus:border-blue-500' 
                      : 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  }`}
                  placeholder="输入城市名称，如：多伦多"
                  maxLength={50}
                  disabled={isSaving}
                />
                
                {/* 检查状态指示器 */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {isCheckingName ? (
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  ) : validation.name.isValid && formData.name ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : !validation.name.isValid ? (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  ) : null}
                </div>
              </div>
              
              {!validation.name.isValid && (
                <p className="mt-2 text-sm text-red-400 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{validation.name.error}</span>
                </p>
              )}
            </div>

            {/* 省份 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                省份 *
              </label>
              <input
                type="text"
                value={formData.province}
                onChange={(e) => handleFieldChange('province', e.target.value.toUpperCase().substring(0, 2))}
                maxLength="2"
                placeholder="例如: ON, BC, AB"
                className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors ${
                  validation.province.isValid
                    ? 'border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                    : 'border-red-500 focus:ring-red-500 focus:border-red-500'
                }`}
                disabled={isSaving}
              />
              
              {!validation.province.isValid && (
                <p className="mt-2 text-sm text-red-400 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{validation.province.error}</span>
                </p>
              )}
            </div>

            {/* 主题色选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                主题色 *
              </label>
              
              {/* 预设色块 */}
              <div className="grid grid-cols-5 gap-2 mb-4">
                {presetColors.map((color) => (
                  <motion.button
                    key={color}
                    type="button"
                    onClick={() => handleFieldChange('themeColor', color)}
                    className={`w-12 h-12 rounded-lg border-2 transition-all ${
                      formData.themeColor === color
                        ? 'border-white scale-110 shadow-lg'
                        : 'border-gray-600 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isSaving}
                  />
                ))}
              </div>

              {/* 自定义颜色选择器 */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Palette className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">自定义：</span>
                </div>
                
                <input
                  type="color"
                  value={formData.themeColor}
                  onChange={(e) => handleFieldChange('themeColor', e.target.value)}
                  className="w-12 h-8 rounded border border-gray-600 bg-gray-900 cursor-pointer disabled:opacity-50"
                  disabled={isSaving}
                />
                
                <span className="text-sm text-gray-300 font-mono">
                  {formData.themeColor}
                </span>
              </div>

              {!validation.themeColor.isValid && (
                <p className="mt-2 text-sm text-red-400 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{validation.themeColor.error}</span>
                </p>
              )}
            </div>

            {/* 启用状态 */}
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleFieldChange('isActive', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                  disabled={isSaving}
                />
                <div className="flex items-center space-x-2 text-gray-300">
                  {formData.isActive ? (
                    <Eye className="w-4 h-4 text-green-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  )}
                  <span>启用此城市</span>
                </div>
              </label>
              <p className="mt-2 text-sm text-gray-400">
                禁用后，该城市将不会出现在配送选择中
              </p>
            </div>

            {/* 错误信息 */}
            {saveError && (
              <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg">
                <div className="flex items-center space-x-2 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{saveError}</span>
                </div>
              </div>
            )}

            {/* 按钮区域 */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700">
              <motion.button
                type="button"
                onClick={handleClose}
                disabled={isSaving}
                className="px-6 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                取消
              </motion.button>
              
              <motion.button
                type="submit"
                disabled={isSaving || isCheckingName || Object.values(validation).some(v => !v.isValid)}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>
                  {isSaving ? '保存中...' : (isCreating ? '创建城市' : '保存更改')}
                </span>
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CityEditDialog;