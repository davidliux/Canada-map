import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, AlertCircle, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BatchFSAGroupCreator = ({ region, onSave, onCancel, existingGroups = [] }) => {
  const [rows, setRows] = useState([
    { id: 1, name: '', fsaCodes: '', description: '' }
  ]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // 添加新行
  const addRow = () => {
    const newId = Math.max(...rows.map(r => r.id)) + 1;
    setRows([...rows, { id: newId, name: '', fsaCodes: '', description: '' }]);
  };

  // 删除行
  const removeRow = (id) => {
    if (rows.length > 1) {
      setRows(rows.filter(r => r.id !== id));
      // 清除该行的错误
      const newErrors = { ...errors };
      delete newErrors[id];
      setErrors(newErrors);
    }
  };

  // 复制行
  const duplicateRow = (row) => {
    const newId = Math.max(...rows.map(r => r.id)) + 1;
    const newRow = {
      ...row,
      id: newId,
      name: row.name + ' (副本)'
    };
    setRows([...rows, newRow]);
  };

  // 更新行数据
  const updateRow = (id, field, value) => {
    setRows(rows.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ));

    // 清除该字段的错误
    if (errors[id]) {
      const newErrors = { ...errors };
      delete newErrors[id][field];
      if (Object.keys(newErrors[id]).length === 0) {
        delete newErrors[id];
      }
      setErrors(newErrors);
    }
  };

  // 解析FSA代码
  const parseFSACodes = (input) => {
    if (!input) return [];

    // 支持多种分隔符：逗号、空格、分号、换行
    const codes = input
      .split(/[,;\s\n]+/)
      .map(code => code.trim().toUpperCase())
      .filter(code => code.length > 0);

    // 验证FSA格式（加拿大邮编前3位）
    const validCodes = codes.filter(code => /^[A-Z]\d[A-Z]$/.test(code));

    return [...new Set(validCodes)]; // 去重
  };

  // 验证单行
  const validateRow = (row) => {
    const rowErrors = {};

    if (!row.name.trim()) {
      rowErrors.name = '请输入组名称';
    } else if (existingGroups.some(g => g.name === row.name.trim())) {
      rowErrors.name = '组名称已存在';
    }

    const fsaCodes = parseFSACodes(row.fsaCodes);
    if (fsaCodes.length === 0) {
      rowErrors.fsaCodes = '请输入有效的FSA代码';
    }

    return rowErrors;
  };

  // 验证所有行
  const validateAll = () => {
    const newErrors = {};
    let hasError = false;

    // 检查重复的组名
    const names = rows.map(r => r.name.trim()).filter(n => n);
    const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);

    rows.forEach(row => {
      const rowErrors = validateRow(row);

      if (duplicateNames.includes(row.name.trim())) {
        rowErrors.name = '批量创建中存在重复的组名称';
      }

      if (Object.keys(rowErrors).length > 0) {
        newErrors[row.id] = rowErrors;
        hasError = true;
      }
    });

    setErrors(newErrors);
    return !hasError;
  };

  // 批量保存
  const handleBatchSave = async () => {
    if (!validateAll()) {
      return;
    }

    setSaving(true);

    try {
      const groupsToCreate = rows
        .filter(row => row.name.trim())
        .map(row => ({
          name: row.name.trim(),
          description: row.description.trim(),
          fsaCodes: parseFSACodes(row.fsaCodes),
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`, // 随机颜色
          regionId: region.id
        }));

      await onSave(groupsToCreate);
    } catch (error) {
      console.error('批量创建失败:', error);
    } finally {
      setSaving(false);
    }
  };

  // 智能解析文本行
  const parseSmartLine = (line) => {
    let name = '';
    let fsaCodes = '';
    let description = '';

    // 移除多余的空格
    line = line.replace(/\s+/g, ' ').trim();

    // 格式1: Name → FSA1, FSA2, FSA3
    const arrowMatch = line.match(/^([^→]+)\s*→\s*(.+)$/);
    if (arrowMatch) {
      name = arrowMatch[1].trim();
      fsaCodes = arrowMatch[2].trim();

      // 处理FSA代码，确保格式正确
      fsaCodes = fsaCodes
        .replace(/[,，、]\s*/g, ', ') // 统一分隔符
        .replace(/\s+/g, ' '); // 规范化空格

      return { name, fsaCodes, description };
    }

    // 格式2: Name(FSA1,FSA2,FSA3) 或 Name (FSA1, FSA2, FSA3)
    const parenMatch = line.match(/^([^(]+)\s*\(([^)]+)\)(.*)$/);
    if (parenMatch) {
      name = parenMatch[1].trim();
      fsaCodes = parenMatch[2].trim();
      description = parenMatch[3].trim();

      // 处理FSA代码
      fsaCodes = fsaCodes
        .replace(/[,，、]\s*/g, ', ')
        .replace(/\s+/g, ' ');

      return { name, fsaCodes, description };
    }

    // 格式3: 使用Tab分隔
    if (line.includes('\t')) {
      const parts = line.split('\t');
      name = parts[0]?.trim() || '';
      fsaCodes = parts[1]?.trim() || '';
      description = parts[2]?.trim() || '';

      // 处理FSA代码
      if (fsaCodes) {
        fsaCodes = fsaCodes
          .replace(/[,，、]\s*/g, ', ')
          .replace(/\s+/g, ' ');
      }

      return { name, fsaCodes, description };
    }

    // 格式4: 使用冒号分隔 Name: FSA1, FSA2, FSA3
    const colonMatch = line.match(/^([^:]+):\s*(.+)$/);
    if (colonMatch) {
      name = colonMatch[1].trim();
      fsaCodes = colonMatch[2].trim();

      fsaCodes = fsaCodes
        .replace(/[,，、]\s*/g, ', ')
        .replace(/\s+/g, ' ');

      return { name, fsaCodes, description };
    }

    // 默认：尝试识别FSA代码模式
    // 如果包含逗号分隔的3字符代码，可能整行都是FSA代码
    const fsaPattern = /\b[A-Z]\d[A-Z]\b/g;
    const fsaMatches = line.match(fsaPattern);

    if (fsaMatches && fsaMatches.length > 0) {
      // 如果整行都是FSA代码，则需要用户手动输入名称
      fsaCodes = fsaMatches.join(', ');
      name = ''; // 留空让用户填写
    } else {
      // 否则可能整行是名称
      name = line;
    }

    return { name, fsaCodes, description };
  };

  // 从剪贴板粘贴（智能识别）
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const lines = text.split('\n').filter(line => line.trim());

      const newRows = lines.map((line, index) => {
        const parsed = parseSmartLine(line);
        const newId = Math.max(...rows.map(r => r.id), 0) + index + 1;

        return {
          id: newId,
          name: parsed.name,
          fsaCodes: parsed.fsaCodes,
          description: parsed.description
        };
      });

      if (newRows.length > 0) {
        // 如果当前只有一个空行，替换它
        if (rows.length === 1 && !rows[0].name && !rows[0].fsaCodes) {
          setRows(newRows);
        } else {
          setRows([...rows, ...newRows]);
        }
      }
    } catch (error) {
      console.error('粘贴失败:', error);
      alert('粘贴失败，请确保已复制文本到剪贴板');
    }
  };

  // 智能填充示例数据
  const handleSmartFillExample = () => {
    const exampleData = `Mississauga → L4T, L4V, L4W, L4X, L4Y, L5A, L5B, L5C, L5E, L5G, L5H, L5J, L5K, L5L, L5M, L5N, L5R, L5S, L5T, L5V, L5W
Brampton → L6P, L6R, L6S, L6T, L6V, L6W, L6X, L6Y, L6Z, L7A
North York → M2H, M2J, M2K, M2L, M2M, M2N, M2P, M2R, M3A, M3B, M3C, M3H, M3J, M9L, M9M, M9N
Calgary remote area(T3Z,T2W,T2J,T3P, T3R,T3L,T1Z,T2P)`;

    const lines = exampleData.split('\n').filter(line => line.trim());
    const newRows = lines.map((line, index) => {
      const parsed = parseSmartLine(line);
      return {
        id: index + 1,
        name: parsed.name,
        fsaCodes: parsed.fsaCodes,
        description: parsed.description
      };
    });

    setRows(newRows);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* 标题栏 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">批量创建FSA分组</h2>
            <p className="text-blue-100 text-sm mt-1">
              为 {region.name} 快速创建多个FSA分组
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 工具栏 */}
        <div className="bg-gray-800 p-3 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <button
              onClick={addRow}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                       transition-colors flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              添加行
            </button>

            <button
              onClick={handlePaste}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700
                       transition-colors flex items-center gap-2 text-sm"
              title="支持多种格式智能识别"
            >
              <Copy className="w-4 h-4" />
              智能粘贴
            </button>

            <button
              onClick={handleSmartFillExample}
              className="px-3 py-1.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600
                       transition-colors flex items-center gap-2 text-sm"
            >
              填充示例
            </button>

            <div className="flex-1" />

            <div className="text-sm text-gray-400">
              {rows.length} 个分组待创建
            </div>
          </div>

          {/* 智能识别提示 */}
          <div className="mt-2 p-2 bg-blue-900/30 rounded-lg text-xs text-blue-300">
            <strong>智能识别支持格式：</strong>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <div>• Name → L4T, L4V, L4W...</div>
              <div>• Name(T3Z,T2W,T2J...)</div>
              <div>• Name: M5V, M5G, M5H...</div>
              <div>• Excel表格 (Tab分隔)</div>
            </div>
          </div>
        </div>

        {/* 表格内容 - 可滚动区域 */}
        <div className="flex-1 overflow-auto min-h-0">
          <table className="w-full">
            <thead className="bg-gray-800 sticky top-0 z-10">
              <tr>
                <th className="text-left p-3 text-gray-300 font-medium text-sm w-8">#</th>
                <th className="text-left p-3 text-gray-300 font-medium text-sm w-1/4">
                  组名称 <span className="text-red-400">*</span>
                </th>
                <th className="text-left p-3 text-gray-300 font-medium text-sm w-1/3">
                  FSA代码 <span className="text-red-400">*</span>
                  <span className="text-xs text-gray-500 ml-1">(用逗号或空格分隔)</span>
                </th>
                <th className="text-left p-3 text-gray-300 font-medium text-sm w-1/4">
                  描述说明
                </th>
                <th className="text-center p-3 text-gray-300 font-medium text-sm w-20">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {rows.map((row, index) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="p-3 text-gray-500 text-sm">
                      {index + 1}
                    </td>

                    <td className="p-3">
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                        placeholder="输入组名称"
                        className={`w-full px-2 py-1 bg-gray-800 border rounded text-white text-sm
                                  focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all
                                  ${errors[row.id]?.name ? 'border-red-500' : 'border-gray-700'}`}
                      />
                      {errors[row.id]?.name && (
                        <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors[row.id].name}
                        </p>
                      )}
                    </td>

                    <td className="p-3">
                      <textarea
                        value={row.fsaCodes}
                        onChange={(e) => updateRow(row.id, 'fsaCodes', e.target.value)}
                        placeholder="如: M5V, M5G, M5H 或 M5V M5G M5H"
                        rows="2"
                        className={`w-full px-2 py-1 bg-gray-800 border rounded text-white text-sm
                                  focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all
                                  resize-none ${errors[row.id]?.fsaCodes ? 'border-red-500' : 'border-gray-700'}`}
                      />
                      {errors[row.id]?.fsaCodes && (
                        <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors[row.id].fsaCodes}
                        </p>
                      )}
                      {row.fsaCodes && !errors[row.id]?.fsaCodes && (
                        <p className="text-gray-500 text-xs mt-1">
                          识别到 {parseFSACodes(row.fsaCodes).length} 个有效FSA
                        </p>
                      )}
                    </td>

                    <td className="p-3">
                      <input
                        type="text"
                        value={row.description}
                        onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                        placeholder="可选的描述信息"
                        className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded
                                 text-white text-sm focus:outline-none focus:ring-1
                                 focus:ring-blue-500 transition-all"
                      />
                    </td>

                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => duplicateRow(row)}
                          className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                          title="复制"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeRow(row.id)}
                          className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                          title="删除"
                          disabled={rows.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* 底部操作栏 - 固定在底部 */}
        <div className="bg-gray-800 p-4 flex items-center justify-between border-t border-gray-700 flex-shrink-0">
          <div className="text-sm text-gray-400">
            <div>提示：直接粘贴文本，系统会智能识别格式</div>
            <div className="text-xs text-gray-500 mt-1">支持箭头(→)、括号()、冒号(:)、Tab等多种分隔方式</div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleBatchSave}
              disabled={saving || rows.filter(r => r.name && r.name.trim()).length === 0}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white
                       rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? '创建中...' : `批量创建 (${rows.filter(r => r.name && r.name.trim()).length} 个)`}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BatchFSAGroupCreator;