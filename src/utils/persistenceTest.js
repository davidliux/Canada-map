/**
 * 持久化存储诊断和测试工具
 * 专门用于诊断跨浏览器数据持久化问题
 */

import { readFromFile, writeToFile, getBackupList } from './persistentStorage.js';
import { 
  getAllRegionConfigs, 
  getAllRegionConfigsSync,
  saveAllRegionConfigs,
  addPostalCodesToRegion,
  getRegionPostalCodes 
} from './unifiedStorage.js';

/**
 * 检测当前环境和存储能力
 */
export const detectEnvironment = () => {
  const environment = {
    isElectron: false,
    hasElectronAPI: false,
    hasFileSystemAccess: false,
    hasLocalStorage: false,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    timestamp: new Date().toISOString()
  };

  // 检测Electron环境
  if (typeof window !== 'undefined' && window.electronAPI) {
    environment.isElectron = true;
    environment.hasElectronAPI = true;
    environment.electronAPI = {
      isElectron: window.electronAPI.isElectron,
      platform: window.electronAPI.platform,
      hasGetAppDataPath: typeof window.electronAPI.getAppDataPath === 'function',
      hasReadFile: typeof window.electronAPI.readFile === 'function',
      hasWriteFile: typeof window.electronAPI.writeFile === 'function'
    };
  }

  // 检测LocalStorage
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    environment.hasLocalStorage = true;
  } catch (error) {
    environment.hasLocalStorage = false;
    environment.localStorageError = error.message;
  }

  return environment;
};

/**
 * 测试文件系统访问能力
 */
export const testFileSystemAccess = async () => {
  const result = {
    canGetDataPath: false,
    canCreateDirectory: false,
    canWriteFile: false,
    canReadFile: false,
    dataPath: null,
    errors: []
  };

  if (!window.electronAPI) {
    result.errors.push('Electron API不可用');
    return result;
  }

  try {
    // 测试获取数据路径
    const userDataPath = await window.electronAPI.getAppDataPath();
    if (userDataPath) {
      result.canGetDataPath = true;
      result.dataPath = `${userDataPath}/canada-postal-data`;
    }
  } catch (error) {
    result.errors.push(`获取数据路径失败: ${error.message}`);
  }

  if (result.dataPath) {
    try {
      // 测试创建目录
      const createResult = await window.electronAPI.createDirectory(result.dataPath);
      result.canCreateDirectory = createResult.success;
      if (!createResult.success) {
        result.errors.push(`创建目录失败: ${createResult.error}`);
      }
    } catch (error) {
      result.errors.push(`创建目录异常: ${error.message}`);
    }

    try {
      // 测试写入文件
      const testFilePath = `${result.dataPath}/test-file.json`;
      const testData = JSON.stringify({ test: true, timestamp: Date.now() });
      const writeResult = await window.electronAPI.writeFile(testFilePath, testData);
      result.canWriteFile = writeResult.success;
      
      if (writeResult.success) {
        // 测试读取文件
        const readResult = await window.electronAPI.readFile(testFilePath);
        result.canReadFile = readResult.success;
        
        if (readResult.success) {
          const parsedData = JSON.parse(readResult.data);
          result.testDataValid = parsedData.test === true;
        }
        
        // 清理测试文件
        await window.electronAPI.deleteFile(testFilePath);
      } else {
        result.errors.push(`写入文件失败: ${writeResult.error}`);
      }
    } catch (error) {
      result.errors.push(`文件操作异常: ${error.message}`);
    }
  }

  return result;
};

/**
 * 测试数据存储和读取
 */
export const testDataPersistence = async () => {
  const result = {
    localStorage: { canWrite: false, canRead: false, data: null },
    fileSystem: { canWrite: false, canRead: false, data: null },
    dataConsistency: false,
    errors: []
  };

  const testData = {
    testRegion: {
      id: 'test',
      name: '测试区域',
      isActive: true,
      postalCodes: ['TEST1', 'TEST2'],
      lastUpdated: new Date().toISOString(),
      metadata: {
        createdAt: new Date().toISOString(),
        version: '2.0.0',
        notes: '持久化测试数据',
        totalPostalCodes: 2
      }
    }
  };

  // 测试LocalStorage
  try {
    localStorage.setItem('test_persistence', JSON.stringify(testData));
    result.localStorage.canWrite = true;
    
    const storedData = localStorage.getItem('test_persistence');
    if (storedData) {
      result.localStorage.data = JSON.parse(storedData);
      result.localStorage.canRead = true;
    }
    
    localStorage.removeItem('test_persistence');
  } catch (error) {
    result.errors.push(`LocalStorage测试失败: ${error.message}`);
  }

  // 测试文件系统
  try {
    const writeSuccess = await writeToFile(testData);
    result.fileSystem.canWrite = writeSuccess;
    
    if (writeSuccess) {
      const readData = await readFromFile();
      if (readData) {
        result.fileSystem.data = readData;
        result.fileSystem.canRead = true;
        
        // 检查数据一致性
        result.dataConsistency = JSON.stringify(testData) === JSON.stringify(readData);
      }
    }
  } catch (error) {
    result.errors.push(`文件系统测试失败: ${error.message}`);
  }

  return result;
};

/**
 * 测试跨浏览器数据一致性
 */
export const testCrossBrowserConsistency = async () => {
  const result = {
    beforeTest: {},
    afterTest: {},
    testPostalCode: 'XTEST',
    testRegionId: '1',
    success: false,
    errors: []
  };

  try {
    // 记录测试前状态
    result.beforeTest = {
      regionConfigs: await getAllRegionConfigs(),
      postalCodes: getRegionPostalCodes(result.testRegionId),
      cacheExists: !!window._regionConfigsCache,
      localStorageData: localStorage.getItem('unified_region_data')
    };

    // 添加测试邮编
    console.log('添加测试邮编...');
    const addResult = await addPostalCodesToRegion(result.testRegionId, [result.testPostalCode]);
    
    if (!addResult) {
      result.errors.push('添加测试邮编失败');
      return result;
    }

    // 等待数据同步
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 记录测试后状态
    result.afterTest = {
      regionConfigs: await getAllRegionConfigs(),
      postalCodes: getRegionPostalCodes(result.testRegionId),
      cacheExists: !!window._regionConfigsCache,
      localStorageData: localStorage.getItem('unified_region_data')
    };

    // 验证邮编是否添加成功
    const hasTestCode = result.afterTest.postalCodes.includes(result.testPostalCode);
    result.success = hasTestCode;

    if (!hasTestCode) {
      result.errors.push('测试邮编未成功添加到区域');
    }

    // 清理测试数据
    if (hasTestCode) {
      const { removePostalCodesFromRegion } = await import('./unifiedStorage.js');
      await removePostalCodesFromRegion(result.testRegionId, [result.testPostalCode]);
    }

  } catch (error) {
    result.errors.push(`跨浏览器测试失败: ${error.message}`);
  }

  return result;
};

/**
 * 完整的持久化诊断
 */
export const runPersistenceDiagnosis = async () => {
  console.log('🔍 开始持久化存储诊断...');
  
  const diagnosis = {
    environment: null,
    fileSystemAccess: null,
    dataPersistence: null,
    crossBrowserTest: null,
    recommendations: [],
    overallStatus: 'unknown'
  };

  try {
    // 1. 环境检测
    console.log('📋 检测环境...');
    diagnosis.environment = detectEnvironment();
    
    // 2. 文件系统访问测试
    console.log('📁 测试文件系统访问...');
    diagnosis.fileSystemAccess = await testFileSystemAccess();
    
    // 3. 数据持久化测试
    console.log('💾 测试数据持久化...');
    diagnosis.dataPersistence = await testDataPersistence();
    
    // 4. 跨浏览器一致性测试
    console.log('🌐 测试跨浏览器一致性...');
    diagnosis.crossBrowserTest = await testCrossBrowserConsistency();

    // 5. 生成建议
    diagnosis.recommendations = generateRecommendations(diagnosis);
    
    // 6. 确定整体状态
    diagnosis.overallStatus = determineOverallStatus(diagnosis);

  } catch (error) {
    console.error('诊断过程出错:', error);
    diagnosis.error = error.message;
    diagnosis.overallStatus = 'error';
  }

  return diagnosis;
};

/**
 * 生成修复建议
 */
const generateRecommendations = (diagnosis) => {
  const recommendations = [];

  if (!diagnosis.environment.isElectron) {
    recommendations.push({
      type: 'warning',
      message: '当前不在Electron环境中，无法使用文件系统持久化',
      action: '启动Electron应用以获得完整的持久化功能'
    });
  }

  if (diagnosis.environment.isElectron && !diagnosis.environment.hasElectronAPI) {
    recommendations.push({
      type: 'error',
      message: 'Electron API不可用',
      action: '检查preload.js是否正确加载'
    });
  }

  if (diagnosis.fileSystemAccess && diagnosis.fileSystemAccess.errors.length > 0) {
    recommendations.push({
      type: 'error',
      message: '文件系统访问存在问题',
      action: '检查文件权限和路径配置'
    });
  }

  if (!diagnosis.dataPersistence.localStorage.canWrite) {
    recommendations.push({
      type: 'error',
      message: 'LocalStorage不可用',
      action: '检查浏览器设置和隐私模式'
    });
  }

  if (!diagnosis.dataPersistence.dataConsistency) {
    recommendations.push({
      type: 'warning',
      message: '数据一致性检查失败',
      action: '检查数据序列化和反序列化逻辑'
    });
  }

  return recommendations;
};

/**
 * 确定整体状态
 */
const determineOverallStatus = (diagnosis) => {
  if (diagnosis.error) return 'error';
  
  const hasFileSystem = diagnosis.environment.isElectron && 
                       diagnosis.fileSystemAccess.canWriteFile && 
                       diagnosis.fileSystemAccess.canReadFile;
  
  const hasLocalStorage = diagnosis.dataPersistence.localStorage.canWrite && 
                         diagnosis.dataPersistence.localStorage.canRead;
  
  if (hasFileSystem && hasLocalStorage) return 'excellent';
  if (hasFileSystem || hasLocalStorage) return 'good';
  return 'poor';
};

// 导出到全局对象
if (typeof window !== 'undefined') {
  window.persistenceTest = {
    detectEnvironment,
    testFileSystemAccess,
    testDataPersistence,
    testCrossBrowserConsistency,
    runPersistenceDiagnosis
  };
}
