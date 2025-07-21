/**
 * 简单的API测试端点
 */

export default async function handler(request) {
  const response = {
    success: true,
    message: 'API测试成功',
    data: {
      method: request.method,
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL ? 'vercel' : 'local',
      version: '3.0.0'
    }
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
