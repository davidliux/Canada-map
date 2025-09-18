# 后端 Dockerfile
FROM node:18-alpine

# 安装必要的系统依赖（为 Prisma 客户端）
RUN apk add --no-cache openssl

WORKDIR /app

# 复制 package 文件
COPY package*.json ./
COPY prisma ./prisma/

# 安装依赖
RUN npm ci

# 生成 Prisma 客户端
RUN npx prisma generate

# 复制源代码
COPY . .

# 创建上传目录
RUN mkdir -p uploads

# 暴露端口
EXPOSE 5050

# 启动命令
CMD ["npm", "start"]