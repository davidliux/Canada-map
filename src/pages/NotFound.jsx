import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-700">404</h1>
        <p className="text-2xl font-semibold text-white mt-4">页面未找到</p>
        <p className="text-gray-400 mt-2">抱歉，您访问的页面不存在。</p>
        
        <div className="mt-8 flex items-center justify-center space-x-4">
          <Link
            to="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Home className="w-4 h-4" />
            <span>返回首页</span>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回上一页</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;