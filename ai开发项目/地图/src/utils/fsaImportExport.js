/**
 * FSA配置数据导入导出工具
 * 支持CSV和JSON格式的批量操作
 */

// 注意：fsaImportExport.js需要重构以使用统一存储架构
// 暂时注释掉fsaStorage导入，因为在统一架构中不再需要单独的FSA存储
// import { getAllFSAConfigs, batchSaveFSAConfigs } from './fsaStorage.js';

// 临时的占位函数，避免导入错误
const getAllFSAConfigs = () => ({});
const batchSaveFSAConfigs = () => ({ success: false });
import { validateFSAConfig, createDefaultFSAConfig } from '../data/fsaManagement.js';

/**
 * 导出FSA配置为JSON格式
 * @param {string[]} fsaCodes - 要导出的FSA代码列表，为空则导出全部
 * @returns {Object} 导出的数据对象
 */
export const exportFSAConfigsAsJSON = (fsaCodes = []) => {
  const allConfigs = getAllFSAConfigs();
  
  let configsToExport;
  if (fsaCodes.length > 0) {
    configsToExport = {};
    fsaCodes.forEach(code => {
      if (allConfigs[code]) {
        configsToExport[code] = allConfigs[code];
      }
    });
  } else {
    configsToExport = allConfigs;
  }
  
  return {
    exportDate: new Date().toISOString(),
    version: '1.0.0',
    totalConfigs: Object.keys(configsToExport).length,
    configs: configsToExport
  };
};

/**
 * 导出FSA配置为CSV格式
 * @param {string[]} fsaCodes - 要导出的FSA代码列表，为空则导出全部
 * @returns {string} CSV格式的字符串
 */
export const exportFSAConfigsAsCSV = (fsaCodes = []) => {
  const allConfigs = getAllFSAConfigs();
  
  let configsToExport;
  if (fsaCodes.length > 0) {
    configsToExport = {};
    fsaCodes.forEach(code => {
      if (allConfigs[code]) {
        configsToExport[code] = allConfigs[code];
      }
    });
  } else {
    configsToExport = allConfigs;
  }
  
  // CSV头部
  const headers = [
    'FSA代码',
    '省份',
    '地区',
    '是否启用',
    '邮编列表',
    '重量区间配置',
    '最后更新时间',
    '备注'
  ];
  
  // 构建CSV行
  const rows = [headers.join(',')];
  
  Object.entries(configsToExport).forEach(([fsaCode, config]) => {
    const row = [
      fsaCode,
      config.province || '',
      config.region || '',
      config.isActive ? '是' : '否',
      `"${config.postalCodes.join(';')}"`,
      `"${JSON.stringify(config.weightRanges)}"`,
      config.lastUpdated || '',
      `"${config.metadata?.notes || ''}"`
    ];
    rows.push(row.join(','));
  });
  
  return rows.join('\n');
};

/**
 * 导出重量区间价格表为CSV
 * @param {string} fsaCode - FSA代码
 * @returns {string} CSV格式的价格表
 */
export const exportWeightRangeCSV = (fsaCode) => {
  const allConfigs = getAllFSAConfigs();
  const config = allConfigs[fsaCode];
  
  if (!config) {
    throw new Error(`FSA配置不存在: ${fsaCode}`);
  }
  
  const headers = ['重量区间', '最小重量(KGS)', '最大重量(KGS)', '价格(CAD)', '是否启用'];
  const rows = [headers.join(',')];
  
  config.weightRanges.forEach(range => {
    const row = [
      `"${range.label}"`,
      range.min,
      range.max === Infinity ? 'Infinity' : range.max,
      range.price,
      range.isActive ? '是' : '否'
    ];
    rows.push(row.join(','));
  });
  
  return rows.join('\n');
};

/**
 * 从JSON数据导入FSA配置
 * @param {Object} jsonData - JSON格式的配置数据
 * @returns {Object} 导入结果
 */
export const importFSAConfigsFromJSON = (jsonData) => {
  const results = {
    success: false,
    imported: 0,
    failed: 0,
    errors: [],
    warnings: []
  };
  
  try {
    // 验证JSON结构
    if (!jsonData.configs || typeof jsonData.configs !== 'object') {
      results.errors.push('无效的JSON格式：缺少configs字段');
      return results;
    }
    
    // 验证每个配置
    const validConfigs = {};
    Object.entries(jsonData.configs).forEach(([fsaCode, config]) => {
      const validation = validateFSAConfig(config);
      
      if (validation.isValid) {
        validConfigs[fsaCode] = {
          ...config,
          lastUpdated: new Date().toISOString()
        };
      } else {
        results.failed++;
        results.errors.push(`${fsaCode}: ${validation.errors.join(', ')}`);
      }
      
      if (validation.warnings.length > 0) {
        results.warnings.push(`${fsaCode}: ${validation.warnings.join(', ')}`);
      }
    });
    
    // 批量保存有效配置
    if (Object.keys(validConfigs).length > 0) {
      const saveResults = batchSaveFSAConfigs(validConfigs);
      results.imported = saveResults.success;
      results.failed += saveResults.failed;
      results.errors.push(...saveResults.errors);
    }
    
    results.success = results.failed === 0;
    return results;
    
  } catch (error) {
    console.error('导入JSON失败:', error);
    results.errors.push('导入过程中发生错误');
    return results;
  }
};

/**
 * 从CSV数据导入FSA配置
 * @param {string} csvData - CSV格式的配置数据
 * @returns {Object} 导入结果
 */
export const importFSAConfigsFromCSV = (csvData) => {
  const results = {
    success: false,
    imported: 0,
    failed: 0,
    errors: [],
    warnings: []
  };
  
  try {
    const lines = csvData.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      results.errors.push('CSV文件格式错误：至少需要标题行和一行数据');
      return results;
    }
    
    // 解析标题行
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    // 验证必需的列
    const requiredColumns = ['FSA代码', '省份', '地区', '是否启用'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      results.errors.push(`CSV缺少必需列: ${missingColumns.join(', ')}`);
      return results;
    }
    
    // 解析数据行
    const validConfigs = {};
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]);
        
        if (values.length !== headers.length) {
          results.warnings.push(`第${i + 1}行：列数不匹配`);
          continue;
        }
        
        const rowData = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index];
        });
        
        // 构建配置对象
        const fsaCode = rowData['FSA代码'];
        if (!fsaCode) {
          results.warnings.push(`第${i + 1}行：FSA代码为空`);
          continue;
        }
        
        const config = createDefaultFSAConfig(
          fsaCode,
          rowData['省份'] || '',
          rowData['地区'] || ''
        );
        
        config.isActive = rowData['是否启用'] === '是';
        
        // 解析邮编列表
        if (rowData['邮编列表']) {
          const postalCodes = rowData['邮编列表']
            .split(';')
            .map(code => code.trim())
            .filter(code => code);
          config.postalCodes = postalCodes;
        }
        
        // 解析重量区间配置
        if (rowData['重量区间配置']) {
          try {
            const weightRanges = JSON.parse(rowData['重量区间配置']);
            if (Array.isArray(weightRanges)) {
              config.weightRanges = weightRanges;
            }
          } catch (error) {
            results.warnings.push(`第${i + 1}行：重量区间配置格式错误`);
          }
        }
        
        // 设置备注
        if (rowData['备注']) {
          config.metadata.notes = rowData['备注'];
        }
        
        // 验证配置
        const validation = validateFSAConfig(config);
        if (validation.isValid) {
          validConfigs[fsaCode] = config;
        } else {
          results.failed++;
          results.errors.push(`${fsaCode}: ${validation.errors.join(', ')}`);
        }
        
        if (validation.warnings.length > 0) {
          results.warnings.push(`${fsaCode}: ${validation.warnings.join(', ')}`);
        }
        
      } catch (error) {
        results.warnings.push(`第${i + 1}行：解析失败 - ${error.message}`);
      }
    }
    
    // 批量保存有效配置
    if (Object.keys(validConfigs).length > 0) {
      const saveResults = batchSaveFSAConfigs(validConfigs);
      results.imported = saveResults.success;
      results.failed += saveResults.failed;
      results.errors.push(...saveResults.errors);
    }
    
    results.success = results.failed === 0;
    return results;
    
  } catch (error) {
    console.error('导入CSV失败:', error);
    results.errors.push('导入过程中发生错误');
    return results;
  }
};

/**
 * 解析CSV行，处理引号内的逗号
 * @param {string} line - CSV行
 * @returns {string[]} 解析后的值数组
 */
const parseCSVLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
};

/**
 * 下载文件到本地
 * @param {string} content - 文件内容
 * @param {string} filename - 文件名
 * @param {string} mimeType - MIME类型
 */
export const downloadFile = (content, filename, mimeType = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * 读取上传的文件
 * @param {File} file - 文件对象
 * @returns {Promise<string>} 文件内容
 */
export const readUploadedFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      resolve(e.target.result);
    };
    
    reader.onerror = (e) => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsText(file);
  });
};
