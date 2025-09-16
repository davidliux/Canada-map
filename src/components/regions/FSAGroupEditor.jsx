/**
 * FSA组编辑器组件
 * 用于创建和编辑FSA组
 */

import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, AlertCircle, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  validateGroupName,
  detectFSAConflicts,
  suggestGroupName
} from '../../utils/fsaGroupValidation';

/**
 * FSA组编辑器
 * @param {Object} props - 组件属性
 * @param {Object} props.group - 要编辑的组（null表示创建新组）
 * @param {Object} props.region - 区域对象
 * @param {Array} props.existingGroups - 现有组列表
 * @param {Array} props.ungroupedFSAs - 未分组的FSA列表
 * @param {Function} props.onSave - 保存回调
 * @param {Function} props.onCancel - 取消回调
 */
const FSAGroupEditor = ({
  group = null,
  region,
  existingGroups = [],
  ungroupedFSAs = [],
  onSave,
  onCancel
}) => {
  const isEditMode = !!group;

  // 表单状态
  const [formData, setFormData] = useState({
    name: group?.name || '',
    fsaCodes: group?.fsaCodes || [],
    fsaInput: group?.fsaCodes?.join(', ') || '', // 新增：FSA输入字符串
    enableCustomPricing: group?.customPricing?.enabled || false
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // 处理FSA输入变化
  const handleFSAInputChange = (value) => {
    setFormData(prev => ({ ...prev, fsaInput: value }));

    // 解析输入的FSA代码
    const fsaArray = value
      .split(/[,，\s]+/) // 支持逗号、中文逗号和空格分隔
      .map(fsa => fsa.trim().toUpperCase())
      .filter(fsa => fsa.length > 0);

    setFormData(prev => ({ ...prev, fsaCodes: fsaArray }));

    // 清除FSA相关错误
    if (errors.fsaCodes) {
      setErrors(prev => ({ ...prev, fsaCodes: null }));
    }
  };

  // 生成建议名称
  useEffect(() => {
    if (!isEditMode && !formData.name) {
      const suggestedName = suggestGroupName(existingGroups, '新组');
      setFormData(prev => ({ ...prev, name: suggestedName }));
    }
  }, [isEditMode, existingGroups]);

  // 验证表单
  const validateForm = () => {
    const newErrors = {};

    // 验证组名
    const nameValidation = validateGroupName(
      formData.name,
      existingGroups,
      isEditMode ? group.id : null
    );
    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.errors[0];
    }

    // 验证FSA冲突
    if (formData.fsaCodes.length > 0) {
      const conflicts = detectFSAConflicts(
        formData.fsaCodes,
        existingGroups,
        isEditMode ? group.id : null
      );
      if (conflicts.hasConflicts) {
        newErrors.fsaCodes = conflicts.conflictSummary[0];
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理保存
  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const saveData = {
        name: formData.name.trim(),
        fsaCodes: formData.fsaCodes
      };

      // 如果启用了自定义价格，添加价格配置
      if (formData.enableCustomPricing) {
        saveData.customPricing = {
          enabled: true,
          weightRanges: group?.customPricing?.weightRanges || []
        };
      } else if (isEditMode && group?.customPricing) {
        // 如果是编辑模式且之前有价格配置，现在禁用了
        saveData.customPricing = {
          enabled: false,
          weightRanges: group.customPricing.weightRanges
        };
      }

      await onSave(saveData);
    } catch (error) {
      console.error('保存失败:', error);
      setErrors({ submit: error.message || '保存失败' });
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-gray-700"
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-gray-100">
            {isEditMode ? '编辑FSA组' : '创建FSA组'}
          </h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* 内容 */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-130px)]">
          {/* 错误提示 */}
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-red-300 text-sm">{errors.submit}</span>
            </div>
          )}

          {/* 组名称 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-200 mb-2">
              组名称 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                if (errors.name) {
                  setErrors(prev => ({ ...prev, name: null }));
                }
              }}
              className={`w-full px-3 py-2 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-100 ${
                errors.name ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="输入组名称（1-50字符）"
              maxLength={50}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name}</p>
            )}
            <p className="mt-1 text-sm text-gray-400">
              {formData.name.length}/50 字符
            </p>
          </div>

          {/* 自定义价格选项 */}
          <div className="mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableCustomPricing}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  enableCustomPricing: e.target.checked
                }))}
                className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-200">
                启用组级别自定义价格
              </span>
            </label>
            <p className="mt-1 ml-6 text-sm text-gray-400">
              启用后，该组内的FSA将使用独立的价格配置，而不是区域默认价格
            </p>
          </div>

          {/* FSA输入 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-200 mb-2">
              选择FSA ({formData.fsaCodes.length} 个)
            </label>

            {errors.fsaCodes && (
              <div className="mb-2 p-2 bg-red-900/20 border border-red-700 rounded flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-red-300 text-sm">{errors.fsaCodes}</span>
              </div>
            )}

            <textarea
              value={formData.fsaInput}
              onChange={(e) => handleFSAInputChange(e.target.value)}
              className={`w-full px-3 py-2 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-100 ${
                errors.fsaCodes ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="输入FSA代码，用逗号分隔（如：A1H, A1L, A1N, A1S, A1B, A1M, A0M）"
              rows={4}
            />

            <p className="mt-2 text-sm text-gray-400">
              输入要包含在此组中的FSA代码，每个FSA只能属于一个组。支持用逗号、空格分隔。
            </p>

          </div>

          {/* FSA预览 */}
          {formData.fsaCodes.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-200 mb-2">
                已识别的FSA ({formData.fsaCodes.length} 个)
              </label>
              <div className="p-3 bg-gray-900/30 border border-gray-700 rounded-lg max-h-32 overflow-y-auto">
                <div className="flex flex-wrap gap-1">
                  {formData.fsaCodes.map((fsa, index) => (
                    <span
                      key={`${fsa}-${index}`}
                      className="px-2 py-0.5 bg-blue-900/30 text-blue-400 text-xs rounded border border-blue-700"
                    >
                      {fsa}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            disabled={saving}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={saving || !formData.name.trim()}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditMode ? '保存更改' : '创建组'}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default FSAGroupEditor;