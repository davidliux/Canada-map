import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Database,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { dataMigrationManager } from '../utils/dataMigration.js';

/**
 * 数据迁移工具页面组件
 * 集成到主应用中的迁移工具
 */
const MigrationToolPage = ({ onClose }) => {
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [migrationResult, setMigrationResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [migrationDetails, setMigrationDetails] = useState([]);

  useEffect(() => {
    checkMigrationStatus();
  }, []);

  const checkMigrationStatus = async () => {
    try {
      const result = await dataMigrationManager.checkMigrationNeeded();
      setMigrationStatus(result);
    } catch (error) {
      console.error('检查迁移状态失败:', error);
      setMigrationStatus({
        needed: false,
        error: error.message
      });
    }
  };

  const performAutoMigration = async () => {
    setIsProcessing(true);
    setMigrationResult(null);
    setMigrationProgress(0);
    setMigrationDetails([]);

    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setMigrationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      const result = await dataMigrationManager.performMigration({
        createBackup: true,
        overwriteExisting: false,
        batchSize: 3
      });

      clearInterval(progressInterval);
      setMigrationProgress(100);
      setMigrationResult(result);
      setMigrationDetails(result.details || []);

    } catch (error) {
      setMigrationResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const testAPIConnection = async () => {
    try {
      const response = await fetch('/api/regions');
      const isSuccess = response.ok;
      
      setMigrationResult({
        success: isSuccess,
        message: isSuccess ? 'API连接正常' : `API连接失败: ${response.status}`,
        type: 'api_test'
      });
    } catch (error) {
      setMigrationResult({
        success: false,
        message: `API连接失败: ${error.message}`,
        type: 'api_test'
      });
    }
  };

  const createEmergencyBackup = () => {
    try {
      const localData = JSON.parse(localStorage.getItem('regionConfigs') || '{}');
      const backupData = {
        regionConfigs: localData,
        timestamp: new Date().toISOString(),
        type: 'emergency_backup'
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emergency-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMigrationResult({
        success: true,
        message: '紧急备份已下载',
        type: 'backup'
      });
    } catch (error) {
      setMigrationResult({
        success: false,
        message: `备份失败: ${error.message}`,
        type: 'backup'
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-gradient-to-br from-gray-900 to-gray-800 border border-blue-500/30 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b border-blue-500/20">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-white">数据迁移工具</h2>
              <p className="text-sm text-gray-400">将localStorage数据迁移到Vercel KV存储</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 迁移状态检查 */}
          <div className="bg-gray-800/50 border border-gray-600/50 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              迁移状态检查
            </h3>
            
            <button
              onClick={checkMigrationStatus}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors mb-3"
            >
              检查迁移需求
            </button>

            {migrationStatus && (
              <div className={`p-3 rounded-lg border ${
                migrationStatus.needed 
                  ? 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300'
                  : 'bg-green-900/20 border-green-500/30 text-green-300'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {migrationStatus.needed ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  <span className="font-semibold">
                    {migrationStatus.needed ? '需要迁移' : '无需迁移'}
                  </span>
                </div>
                <p className="text-sm">{migrationStatus.reason}</p>
                
                {migrationStatus.localCount !== undefined && (
                  <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-400">{migrationStatus.localCount}</div>
                      <div className="opacity-80">localStorage区域</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-400">{migrationStatus.apiCount}</div>
                      <div className="opacity-80">API区域</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-yellow-400">
                        {Math.max(0, migrationStatus.localCount - migrationStatus.apiCount)}
                      </div>
                      <div className="opacity-80">需要迁移</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 迁移操作 */}
          <div className="bg-gray-800/50 border border-gray-600/50 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              数据迁移操作
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={performAutoMigration}
                disabled={isProcessing || (migrationStatus && !migrationStatus.needed)}
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg transition-all"
              >
                <RefreshCw className={`w-5 h-5 ${isProcessing ? 'animate-spin' : ''}`} />
                <div className="text-left">
                  <div className="font-semibold">开始自动迁移</div>
                  <div className="text-sm opacity-90">自动检测并迁移数据</div>
                </div>
              </button>

              <button
                onClick={testAPIConnection}
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all"
              >
                <Database className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">测试API连接</div>
                  <div className="text-sm opacity-90">验证服务器连接</div>
                </div>
              </button>
            </div>

            {/* 进度条 */}
            {isProcessing && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">迁移进度</span>
                  <span className="text-sm text-gray-300">{migrationProgress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${migrationProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* 迁移结果 */}
          {migrationResult && (
            <div className="bg-gray-800/50 border border-gray-600/50 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">迁移结果</h3>
              
              <div className={`p-3 rounded-lg border ${
                migrationResult.success
                  ? 'bg-green-900/20 border-green-500/30'
                  : 'bg-red-900/20 border-red-500/30'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {migrationResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  )}
                  <span className={`font-semibold ${
                    migrationResult.success ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {migrationResult.message || (migrationResult.success ? '操作成功' : '操作失败')}
                  </span>
                </div>
                
                {migrationResult.migratedRegions && (
                  <div className="text-sm text-gray-300">
                    成功迁移 {migrationResult.migratedRegions}/{migrationResult.totalRegions} 个区域
                  </div>
                )}
              </div>

              {/* 详细日志 */}
              {migrationDetails.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">详细日志:</h4>
                  <div className="bg-black/30 rounded p-3 max-h-40 overflow-y-auto text-xs font-mono">
                    {migrationDetails.map((detail, index) => (
                      <div key={index} className={`mb-1 ${
                        detail.type === 'success' ? 'text-green-400' :
                        detail.type === 'error' ? 'text-red-400' :
                        detail.type === 'warning' ? 'text-yellow-400' :
                        'text-gray-400'
                      }`}>
                        [{detail.timestamp?.split('T')[1]?.split('.')[0]}] {detail.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 紧急操作 */}
          <div className="bg-gray-800/50 border border-gray-600/50 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">紧急操作</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={createEmergencyBackup}
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg transition-all"
              >
                <Download className="w-4 h-4" />
                <div className="text-left">
                  <div className="font-semibold">创建紧急备份</div>
                  <div className="text-xs opacity-90">下载localStorage数据</div>
                </div>
              </button>

              <button
                onClick={() => window.open('/', '_blank')}
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all"
              >
                <Upload className="w-4 h-4" />
                <div className="text-left">
                  <div className="font-semibold">打开主应用</div>
                  <div className="text-xs opacity-90">返回主界面</div>
                </div>
              </button>
            </div>
          </div>

          {/* 说明信息 */}
          <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4">
            <h4 className="text-blue-300 font-semibold mb-2">💡 使用说明</h4>
            <ul className="text-blue-200 text-sm space-y-1 opacity-90">
              <li>• 首先点击"检查迁移需求"确认是否需要迁移</li>
              <li>• 如果需要迁移，点击"开始自动迁移"执行迁移</li>
              <li>• 迁移过程中会自动创建备份，确保数据安全</li>
              <li>• 建议在迁移前先创建紧急备份</li>
              <li>• 迁移完成后可以在主应用中验证数据</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MigrationToolPage;
