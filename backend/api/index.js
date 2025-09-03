/**
 * Vercel Functions 入口文件
 * 将 Express 应用适配为 Vercel Functions
 */

const app = require('../src/app');

// Vercel Functions 导出
module.exports = app;

// 为了兼容性，也导出为默认
module.exports.default = app;