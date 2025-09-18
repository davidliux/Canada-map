# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制package文件并安装依赖
COPY package*.json ./
RUN npm ci

# 复制源代码
COPY . .

# 构建应用（增加内存限制）
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 从构建阶段复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制nginx配置
COPY nginx.docker.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]