/**
 * Electron Preload Script
 * 为渲染进程提供安全的文件系统访问接口
 */

const { contextBridge, ipcRenderer } = require('electron')

// 向渲染进程暴露安全的API
contextBridge.exposeInMainWorld('electronAPI', {
  // 获取应用数据目录
  getAppDataPath: () => ipcRenderer.invoke('get-app-data-path'),
  
  // 文件操作
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('write-file', filePath, data),
  fileExists: (filePath) => ipcRenderer.invoke('file-exists', filePath),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  
  // 目录操作
  createDirectory: (dirPath) => ipcRenderer.invoke('create-directory', dirPath),
  listDirectory: (dirPath) => ipcRenderer.invoke('list-directory', dirPath),
  
  // 平台信息
  platform: process.platform,
  
  // 检测是否在Electron环境中
  isElectron: true
})

console.log('Preload script loaded successfully')
