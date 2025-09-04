// Vercel Edge Function 作为 Supabase 代理
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path') || 'regions';
  const query = searchParams.get('query') || 'select=*';
  
  // 从环境变量获取配置
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ehjoyxemglhnmzikswjn.supabase.co';
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!SUPABASE_ANON_KEY) {
    return new Response(
      JSON.stringify({ error: 'Supabase configuration missing' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${path}?${query}`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
      }
    );
    
    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch from Supabase',
        details: error.message 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}