import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api/v1';

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加 token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 处理 token 过期
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // 重试原始请求
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // 刷新失败，清除 tokens 并重定向到登录
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('sessionToken');
        window.location.href = '/auth/login';
      }
    }

    return Promise.reject(error);
  }
);

const authService = {
  // 用户注册
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data.data;
  },

  // 用户登录
  login: async (username, password, rememberMe = false) => {
    const response = await apiClient.post('/auth/login', {
      username,
      password,
      rememberMe,
    });
    return response.data.data;
  },

  // 登出
  logout: async (sessionToken) => {
    await apiClient.post('/auth/logout', { sessionToken });
  },

  // 获取当前用户信息
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data.data;
  },

  // 刷新 token
  refreshToken: async (refreshToken) => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data.data;
  },

  // 修改密码
  changePassword: async (currentPassword, newPassword) => {
    const response = await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  // 获取用户会话列表
  getSessions: async () => {
    const response = await apiClient.get('/auth/sessions');
    return response.data.data;
  },

  // 撤销会话
  revokeSession: async (sessionId) => {
    const response = await apiClient.delete(`/auth/sessions/${sessionId}`);
    return response.data;
  },
};

// 用户管理服务（需要管理员权限）
export const userManagementService = {
  // 获取用户列表
  getUsers: async (params = {}) => {
    const response = await apiClient.get('/users', { params });
    return response.data.data;
  },

  // 获取用户详情
  getUserById: async (userId) => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data.data;
  },

  // 创建用户
  createUser: async (userData) => {
    const response = await apiClient.post('/users', userData);
    return response.data.data;
  },

  // 更新用户信息
  updateUser: async (userId, updates) => {
    const response = await apiClient.put(`/users/${userId}`, updates);
    return response.data.data;
  },

  // 更新用户角色
  updateUserRole: async (userId, role) => {
    const response = await apiClient.put(`/users/${userId}/role`, { role });
    return response.data.data;
  },

  // 启用/禁用用户
  updateUserStatus: async (userId, isActive) => {
    const response = await apiClient.put(`/users/${userId}/status`, { isActive });
    return response.data.data;
  },

  // 删除用户
  deleteUser: async (userId) => {
    const response = await apiClient.delete(`/users/${userId}`);
    return response.data;
  },

  // 获取用户活动日志
  getUserActivities: async (userId, params = {}) => {
    const response = await apiClient.get(`/users/${userId}/activities`, { params });
    return response.data.data;
  },

  // 批量操作用户
  batchOperation: async (userIds, action) => {
    const response = await apiClient.post('/users/batch', {
      userIds,
      action,
    });
    return response.data.data;
  },
};

export default authService;