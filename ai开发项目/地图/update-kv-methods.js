#!/usr/bin/env node

/**
 * 自动更新KV存储方法
 * 将所有this.kv调用替换为await this.ensureInitialized()
 */

import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'lib', 'kv-storage.js');

// 读取文件内容
let content = fs.readFileSync(filePath, 'utf8');

// 查找所有方法
const methodRegex = /async\s+(\w+)\s*\([^)]*\)\s*{([^}]*)}/g;
let match;
let updatedContent = content;

while ((match = methodRegex.exec(content)) !== null) {
  const methodName = match[1];
  const methodBody = match[2];
  
  // 跳过已经更新的方法
  if (methodBody.includes('await this.ensureInitialized()')) {
    continue;
  }
  
  // 检查方法是否使用了this.kv
  if (methodBody.includes('this.kv')) {
    // 创建更新后的方法体
    const updatedMethodBody = methodBody.replace(
      /(\s+)try\s*{/,
      '$1try {\n$1  const kv = await this.ensureInitialized();'
    ).replace(/this\.kv\./g, 'kv.');
    
    // 替换方法体
    const originalMethod = `async ${methodName}([^)]*\\) {${methodBody.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}}`;
    const updatedMethod = `async ${methodName}$1) {${updatedMethodBody}}`;
    
    updatedContent = updatedContent.replace(
      new RegExp(originalMethod),
      updatedMethod
    );
    
    console.log(`✅ 更新方法: ${methodName}`);
  }
}

// 写入更新后的内容
fs.writeFileSync(filePath, updatedContent, 'utf8');
console.log('🎉 更新完成！');
