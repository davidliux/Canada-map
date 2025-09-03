import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });

    // 可以在这里发送错误报告到监控服务
    this.reportError(error, errorInfo);
  }

  reportError = (error, errorInfo) => {
    // 发送错误到监控服务
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // 这里可以集成Sentry或其他错误监控服务
    console.log('Error Report:', errorReport);
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full bg-gray-800 rounded-lg p-8 border border-gray-700"
          >
            {/* 错误图标 */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center mb-6"
            >
              <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </motion.div>

            {/* 错误标题 */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-white text-center mb-4"
            >
              页面出错了
            </motion.h1>

            {/* 错误描述 */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-400 text-center mb-6"
            >
              很抱歉，页面遇到了一个意外错误。我们已经记录了这个问题，正在努力修复。
            </motion.p>

            {/* 开发环境下显示错误详情 */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ delay: 0.5 }}
                className="mb-6 p-4 bg-gray-900 rounded border border-red-500/20"
              >
                <h3 className="text-red-400 font-medium text-sm mb-2">错误详情 (开发模式)</h3>
                <div className="text-xs text-gray-500 font-mono">
                  <div className="mb-2">
                    <strong>错误信息:</strong> {this.state.error.message}
                  </div>
                  <div className="max-h-32 overflow-auto">
                    <strong>堆栈信息:</strong>
                    <pre className="whitespace-pre-wrap mt-1">
                      {this.state.error.stack}
                    </pre>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 操作按钮 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex space-x-3"
            >
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>重试</span>
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <Home className="w-4 h-4" />
                <span>回到首页</span>
              </button>
            </motion.div>

            {/* 联系信息 */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-xs text-gray-500 text-center mt-6"
            >
              如果问题持续存在，请联系技术支持
            </motion.p>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 高阶组件形式的错误边界
export const withErrorBoundary = (Component, errorComponent = null) => {
  return function WithErrorBoundaryComponent(props) {
    return (
      <ErrorBoundary fallback={errorComponent}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

// Hook形式的错误处理
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error) => {
    console.error('Error caught by useErrorHandler:', error);
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      // 可以在这里发送错误报告
      console.error('Unhandled error:', error);
    }
  }, [error]);

  if (error) {
    throw error; // 让ErrorBoundary捕获
  }

  return { handleError, resetError };
};

export default ErrorBoundary;