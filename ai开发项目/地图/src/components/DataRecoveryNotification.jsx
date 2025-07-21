import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, X, RefreshCw } from 'lucide-react';
import { checkDataIntegrity, recoverLegacyData, resetToDefaultConfig } from '../utils/dataRecovery';
import { dataUpdateNotifier } from '../utils/dataUpdateNotifier';

/**
 * 数据恢复通知组件
 * 显示数据恢复状态和操作选项
 */
const DataRecoveryNotification = () => {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState('checking'); // checking, recovered, failed, normal
  const [report, setReport] = useState(null);
  const [recoveryResult, setRecoveryResult] = useState(null);

  useEffect(() => {
    // 检查数据完整性
    const checkData = () => {
      const integrityReport = checkDataIntegrity();
      setReport(integrityReport);
      
      if (integrityReport.totalFSAs === 0 || integrityReport.regionsWithData === 0) {
        setStatus('warning');
        setVisible(true);
      } else if (integrityReport.issues.length > 0) {
        setStatus('warning');
        setVisible(true);
      } else {
        setStatus('normal');
      }
    };
    
    // 初始检查
    checkData();
    
    // 监听数据更新
    const unsubscribe = dataUpdateNotifier.subscribe(() => {
      checkData();
    });
    
    return unsubscribe;
  }, []);

  const handleRecover = () => {
    setStatus('recovering');
    
    try {
      const result = recoverLegacyData();
      setRecoveryResult(result);
      
      if (result.success) {
        setStatus('recovered');
        // 通知数据更新
        dataUpdateNotifier.notify({
          type: 'globalRefresh',
          source: 'dataRecovery'
        });
      } else {
        setStatus('failed');
      }
    } catch (error) {
      console.error('数据恢复失败:', error);
      setStatus('failed');
      setRecoveryResult({
        success: false,
        message: error.message
      });
    }
  };

  const handleReset = () => {
    if (window.confirm('确定要重置所有区域配置为默认状态吗？这将清除所有现有数据！')) {
      setStatus('resetting');
      
      try {
        const result = resetToDefaultConfig();
        
        if (result.success) {
          setStatus('reset');
          // 通知数据更新
          dataUpdateNotifier.notify({
            type: 'globalRefresh',
            source: 'dataReset'
          });
        } else {
          setStatus('failed');
        }
      } catch (error) {
        console.error('重置配置失败:', error);
        setStatus('failed');
      }
    }
  };

  const handleClose = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md"
      >
        <div className="bg-cyber-gray border border-cyber-blue/30 rounded-lg shadow-lg p-4 mx-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center">
              {status === 'warning' && (
                <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />
              )}
              {status === 'recovering' && (
                <RefreshCw className="w-5 h-5 text-cyber-blue mr-2 animate-spin" />
              )}
              {status === 'recovered' && (
                <CheckCircle className="w-5 h-5 text-cyber-green mr-2" />
              )}
              {status === 'failed' && (
                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              )}
              <h3 className="text-white font-medium">
                {status === 'warning' && '检测到数据问题'}
                {status === 'recovering' && '正在恢复数据...'}
                {status === 'recovered' && '数据恢复成功'}
                {status === 'resetting' && '正在重置数据...'}
                {status === 'reset' && '数据重置成功'}
                {status === 'failed' && '数据操作失败'}
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-sm text-gray-300 mb-4">
            {status === 'warning' && (
              <div>
                <p>系统检测到区域配置数据可能丢失或不完整：</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>区域总数: {report?.totalRegions || 0}</li>
                  <li>有数据的区域: {report?.regionsWithData || 0}</li>
                  <li>FSA总数: {report?.totalFSAs || 0}</li>
                  {report?.issues.map((issue, index) => (
                    <li key={index} className="text-yellow-400">{issue}</li>
                  ))}
                </ul>
                <p className="mt-2">您可以尝试恢复数据或重置为默认配置。</p>
              </div>
            )}
            
            {status === 'recovered' && (
              <div>
                <p>{recoveryResult?.message}</p>
                <ul className="list-disc list-inside mt-2">
                  <li>恢复区域数: {recoveryResult?.recoveredRegions || 0}</li>
                  <li>恢复FSA数: {recoveryResult?.totalFSAs || 0}</li>
                </ul>
              </div>
            )}
            
            {status === 'failed' && (
              <p>操作失败: {recoveryResult?.message || '未知错误'}</p>
            )}
            
            {status === 'reset' && (
              <p>所有区域配置已重置为默认状态。</p>
            )}
          </div>
          
          <div className="flex justify-end space-x-3">
            {['warning', 'failed'].includes(status) && (
              <>
                <button
                  onClick={handleRecover}
                  className="px-3 py-1 bg-cyber-blue/20 hover:bg-cyber-blue/30 text-cyber-blue text-sm rounded"
                >
                  恢复数据
                </button>
                <button
                  onClick={handleReset}
                  className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded"
                >
                  重置配置
                </button>
              </>
            )}
            
            {['recovered', 'reset'].includes(status) && (
              <button
                onClick={handleClose}
                className="px-3 py-1 bg-cyber-green/20 hover:bg-cyber-green/30 text-cyber-green text-sm rounded"
              >
                确定
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DataRecoveryNotification;
