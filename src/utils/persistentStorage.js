/**
 * 持久化存储工具
 * 基于Electron文件系统的数据持久化解决方案
 * 解决LocalStorage跨浏览器数据丢失问题
 */

// 检测是否在Electron环境中
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI && window.electronAPI.isElectron;
};

// 存储配置
const STORAGE_CONFIG = {
  DATA_DIR: 'canada-postal-data',
  REGION_DATA_FILE: 'region-data.json',
  BACKUP_DIR: 'backups',
  MAX_BACKUPS: 10
};

/**
 * 获取应用数据目录路径
 */
const getDataPath = async () => {
  if (isElectron()) {
    try {
      const userDataPath = await window.electronAPI.getAppDataPath();
      return `${userDataPath}/${STORAGE_CONFIG.DATA_DIR}`;
    } catch (error) {
      console.error('获取应用数据目录失败:', error);
      return null;
    }
  }
  return null;
};

/**
 * 确保目录存在
 */
const ensureDirectoryExists = async (dirPath) => {
  if (!isElectron()) return false;

  try {
    const result = await window.electronAPI.createDirectory(dirPath);
    return result.success;
  } catch (error) {
    console.error('创建目录失败:', error);
    return false;
  }
};

/**
 * 创建数据备份
 */
const createBackup = async (data) => {
  if (!isElectron()) return false;

  try {
    const dataPath = await getDataPath();
    if (!dataPath) return false;

    const backupDir = `${dataPath}/${STORAGE_CONFIG.BACKUP_DIR}`;

    await ensureDirectoryExists(backupDir);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `${backupDir}/region-data-${timestamp}.json`;

    const writeResult = await window.electronAPI.writeFile(backupFile, JSON.stringify(data, null, 2));

    if (writeResult.success) {
      // 清理旧备份
      await cleanupOldBackups(backupDir);
      console.log('数据备份创建成功:', backupFile);
      return true;
    } else {
      console.error('备份写入失败:', writeResult.error);
      return false;
    }
  } catch (error) {
    console.error('创建备份失败:', error);
    return false;
  }
};

/**
 * 清理旧备份文件
 */
const cleanupOldBackups = async (backupDir) => {
  try {
    const listResult = await window.electronAPI.listDirectory(backupDir);
    if (!listResult.success) return;

    const backupFiles = listResult.files
      .filter(file => !file.isDirectory &&
                     file.name.startsWith('region-data-') &&
                     file.name.endsWith('.json'))
      .sort((a, b) => new Date(b.modified) - new Date(a.modified));

    // 保留最新的MAX_BACKUPS个备份
    if (backupFiles.length > STORAGE_CONFIG.MAX_BACKUPS) {
      const filesToDelete = backupFiles.slice(STORAGE_CONFIG.MAX_BACKUPS);
      for (const file of filesToDelete) {
        await window.electronAPI.deleteFile(file.path);
        console.log('删除旧备份:', file.name);
      }
    }
  } catch (error) {
    console.error('清理备份失败:', error);
  }
};

/**
 * 从文件系统读取数据
 */
export const readFromFile = async () => {
  if (!isElectron()) {
    console.warn('非Electron环境，回退到LocalStorage');
    return readFromLocalStorage();
  }

  try {
    const dataPath = await getDataPath();
    if (!dataPath) {
      console.warn('无法获取数据目录，回退到LocalStorage');
      return readFromLocalStorage();
    }

    const filePath = `${dataPath}/${STORAGE_CONFIG.REGION_DATA_FILE}`;

    const exists = await window.electronAPI.fileExists(filePath);
    if (!exists) {
      console.log('数据文件不存在，尝试从LocalStorage迁移');
      return await migrateFromLocalStorage();
    }

    const result = await window.electronAPI.readFile(filePath);
    if (result.success) {
      const parsedData = JSON.parse(result.data);
      console.log('从文件系统读取数据成功:', filePath);
      return parsedData;
    } else {
      console.error('读取文件失败:', result.error);
      return readFromLocalStorage();
    }
  } catch (error) {
    console.error('从文件系统读取数据失败:', error);
    return readFromLocalStorage();
  }
};

/**
 * 写入数据到文件系统
 */
export const writeToFile = async (data) => {
  if (!isElectron()) {
    console.warn('非Electron环境，回退到LocalStorage');
    return writeToLocalStorage(data);
  }

  try {
    const dataPath = await getDataPath();
    if (!dataPath) {
      console.warn('无法获取数据目录，回退到LocalStorage');
      return writeToLocalStorage(data);
    }

    await ensureDirectoryExists(dataPath);

    const filePath = `${dataPath}/${STORAGE_CONFIG.REGION_DATA_FILE}`;

    // 创建备份
    const exists = await window.electronAPI.fileExists(filePath);
    if (exists) {
      const result = await window.electronAPI.readFile(filePath);
      if (result.success) {
        const existingData = JSON.parse(result.data);
        await createBackup(existingData);
      }
    }

    // 写入新数据
    const writeResult = await window.electronAPI.writeFile(filePath, JSON.stringify(data, null, 2));

    if (writeResult.success) {
      console.log('数据写入文件系统成功:', filePath);
      return true;
    } else {
      console.error('写入文件失败:', writeResult.error);
      return writeToLocalStorage(data);
    }
  } catch (error) {
    console.error('写入文件系统失败:', error);
    return writeToLocalStorage(data);
  }
};

/**
 * 从LocalStorage读取数据（回退方案）
 */
const readFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem('unified_region_data');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('从LocalStorage读取失败:', error);
    return null;
  }
};

/**
 * 写入数据到LocalStorage（回退方案）
 */
const writeToLocalStorage = (data) => {
  try {
    localStorage.setItem('unified_region_data', JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('写入LocalStorage失败:', error);
    return false;
  }
};

/**
 * 从LocalStorage迁移数据到文件系统
 */
const migrateFromLocalStorage = async () => {
  console.log('开始从LocalStorage迁移数据...');

  const localData = readFromLocalStorage();
  if (localData) {
    const success = await writeToFile(localData);
    if (success) {
      console.log('数据迁移成功');
      return localData;
    }
  }

  console.log('没有找到可迁移的数据');
  return null;
};

/**
 * 获取备份列表
 */
export const getBackupList = () => {
  if (!isElectron()) return [];
  
  try {
    const fs = window.require('fs');
    const path = window.require('path');
    
    const dataPath = getDataPath();
    const backupDir = path.join(dataPath, STORAGE_CONFIG.BACKUP_DIR);
    
    if (!fs.existsSync(backupDir)) return [];
    
    return fs.readdirSync(backupDir)
      .filter(file => file.startsWith('region-data-') && file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          created: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));
  } catch (error) {
    console.error('获取备份列表失败:', error);
    return [];
  }
};

/**
 * 从备份恢复数据
 */
export const restoreFromBackup = (backupPath) => {
  if (!isElectron()) return false;
  
  try {
    const fs = window.require('fs');
    
    const backupData = fs.readFileSync(backupPath, 'utf8');
    const parsedData = JSON.parse(backupData);
    
    const success = writeToFile(parsedData);
    if (success) {
      console.log('从备份恢复数据成功:', backupPath);
      return parsedData;
    }
    
    return false;
  } catch (error) {
    console.error('从备份恢复失败:', error);
    return false;
  }
};

/**
 * 导出数据到指定路径
 */
export const exportData = (exportPath, data) => {
  if (!isElectron()) return false;
  
  try {
    const fs = window.require('fs');
    fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));
    console.log('数据导出成功:', exportPath);
    return true;
  } catch (error) {
    console.error('数据导出失败:', error);
    return false;
  }
};

/**
 * 从指定路径导入数据
 */
export const importData = (importPath) => {
  if (!isElectron()) return null;
  
  try {
    const fs = window.require('fs');
    const data = fs.readFileSync(importPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('数据导入失败:', error);
    return null;
  }
};
