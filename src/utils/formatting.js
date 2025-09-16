/**
 * 格式化工具函数
 * 提供各种数据格式化功能
 */

/**
 * 格式化货币金额
 */
export const formatCurrency = (amount, currency = 'CAD') => {
  if (amount == null) return 'N/A';
  
  const formatter = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return formatter.format(amount);
};

/**
 * 格式化数字
 */
export const formatNumber = (number, decimals = 0) => {
  if (number == null) return 'N/A';
  
  return new Intl.NumberFormat('en-CA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
};

/**
 * 格式化百分比
 */
export const formatPercent = (value, decimals = 1) => {
  if (value == null) return 'N/A';
  
  return new Intl.NumberFormat('en-CA', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100);
};

/**
 * 格式化日期
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  const options = {
    short: {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    },
    medium: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    },
    long: {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    },
    time: {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }
  };
  
  return new Intl.DateTimeFormat('en-CA', options[format] || options.short).format(dateObj);
};

/**
 * 格式化时间间隔
 */
export const formatTimeAgo = (date) => {
  if (!date) return 'N/A';
  
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);
  
  if (diffInSeconds < 60) {
    return '刚刚';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} 分钟前`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} 小时前`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} 天前`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} 个月前`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} 年前`;
  }
};

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

/**
 * 格式化重量
 */
export const formatWeight = (kg, unit = 'kg') => {
  if (kg == null) return 'N/A';
  
  switch (unit) {
    case 'g':
      return `${(kg * 1000).toFixed(0)} g`;
    case 'lb':
      return `${(kg * 2.20462).toFixed(1)} lb`;
    case 'kg':
    default:
      return `${kg.toFixed(1)} kg`;
  }
};

/**
 * 格式化距离
 */
export const formatDistance = (meters, unit = 'auto') => {
  if (meters == null) return 'N/A';
  
  if (unit === 'auto') {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else if (meters < 10000) {
      return `${(meters / 1000).toFixed(1)} km`;
    } else {
      return `${Math.round(meters / 1000)} km`;
    }
  }
  
  switch (unit) {
    case 'm':
      return `${Math.round(meters)} m`;
    case 'km':
      return `${(meters / 1000).toFixed(2)} km`;
    case 'mi':
      return `${(meters / 1609.344).toFixed(2)} mi`;
    case 'ft':
      return `${(meters * 3.28084).toFixed(0)} ft`;
    default:
      return `${Math.round(meters)} m`;
  }
};

/**
 * 格式化邮政编码
 */
export const formatPostalCode = (code) => {
  if (!code) return '';
  
  // 加拿大邮政编码格式: A1A 1A1
  const cleaned = code.replace(/\s+/g, '').toUpperCase();
  if (cleaned.length === 6) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  }
  
  return cleaned;
};

/**
 * 格式化电话号码
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // 移除所有非数字字符
  const cleaned = phone.replace(/\D/g, '');
  
  // 加拿大电话号码格式: (XXX) XXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone; // 如果格式不对，返回原始值
};

/**
 * 截断文本
 */
export const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (!text || text.length <= maxLength) return text;
  
  return text.slice(0, maxLength - suffix.length) + suffix;
};

/**
 * 首字母大写
 */
export const capitalize = (text) => {
  if (!text) return '';
  
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * 格式化URL
 */
export const formatUrl = (url) => {
  if (!url) return '';
  
  // 如果没有协议，添加 https://
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  
  return url;
};

/**
 * 格式化状态
 */
export const formatStatus = (status) => {
  const statusMap = {
    active: '活跃',
    inactive: '非活跃',
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消'
  };
  
  return statusMap[status] || status;
};

export default {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatDate,
  formatTimeAgo,
  formatFileSize,
  formatWeight,
  formatDistance,
  formatPostalCode,
  formatPhoneNumber,
  truncateText,
  capitalize,
  formatUrl,
  formatStatus
};