# 多阶段构建 - 后端应用
FROM node:18-alpine AS deps

# 安装构建依赖
RUN apk add --no-cache python3 make g++

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装所有依赖
RUN npm ci

# 构建阶段
FROM node:18-alpine AS builder

# 安装 Prisma 需要的依赖
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# 从 deps 阶段复制 node_modules
COPY --from=deps /app/node_modules ./node_modules

# 复制源代码
COPY . .

# 如果有 Prisma，生成客户端
RUN if [ -f "prisma/schema.prisma" ]; then npx prisma generate; fi

# 生产环境镜像
FROM node:18-alpine

# 安装 dumb-init 用于正确处理信号
RUN apk add --no-cache dumb-init

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 仅安装生产依赖
RUN npm ci --only=production && npm cache clean --force

# 从构建阶段复制源代码和生成的文件
COPY --from=builder --chown=nodejs:nodejs /app .

# 切换到非 root 用户
USER nodejs

# 暴露端口
EXPOSE 5050

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5050/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); });"

# 使用 dumb-init 启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
