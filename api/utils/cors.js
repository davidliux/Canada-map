/**
 * CORS 配置工具
 * 用于 Vercel Serverless Functions
 */

export function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export function handleCors(handler) {
  return async (req, res) => {
    // 设置 CORS 头
    setCorsHeaders(res);
    
    // 处理 OPTIONS 请求
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    // 执行实际的处理函数
    return handler(req, res);
  };
}