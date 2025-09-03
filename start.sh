#!/bin/bash

# 加拿大快递配送系统 - 一键启动脚本
# =====================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 显示启动菜单
show_menu() {
    echo ""
    echo "=========================================="
    echo "   加拿大快递配送系统 - 启动控制台 v2.0"
    echo "=========================================="
    echo ""
    echo "请选择启动模式："
    echo ""
    echo "  1) 🚀 开发模式 (前端+后端+数据库)"
    echo "  2) 💻 仅前端开发"
    echo "  3) 🔧 仅后端开发"
    echo "  4) 🗄️  初始化数据库"
    echo "  5) 📦 构建生产版本"
    echo "  6) 🐳 Docker容器启动"
    echo "  7) 🧹 清理缓存和依赖"
    echo "  8) 📊 系统健康检查"
    echo "  9) ❌ 退出"
    echo ""
}

# 检查依赖
check_dependencies() {
    print_info "检查系统依赖..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装。请先安装 Node.js >= 18.0.0"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    print_success "Node.js 版本: v$NODE_VERSION"
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        print_error "npm 未安装"
        exit 1
    fi
    
    NPM_VERSION=$(npm -v)
    print_success "npm 版本: v$NPM_VERSION"
    
    # 检查 PostgreSQL (可选)
    if command -v psql &> /dev/null; then
        PSQL_VERSION=$(psql --version | awk '{print $3}')
        print_success "PostgreSQL 版本: $PSQL_VERSION"
    else
        print_warning "PostgreSQL 未检测到 (后端功能需要)"
    fi
    
    # 检查 Redis (可选)
    if command -v redis-cli &> /dev/null; then
        print_success "Redis 已安装"
    else
        print_warning "Redis 未检测到 (缓存功能可选)"
    fi
}

# 安装依赖
install_dependencies() {
    print_info "安装项目依赖..."
    
    # 安装前端依赖
    print_info "安装前端依赖..."
    npm install
    
    if [ $? -eq 0 ]; then
        print_success "前端依赖安装成功"
    else
        print_error "前端依赖安装失败"
        exit 1
    fi
    
    # 安装后端依赖
    print_info "安装后端依赖..."
    cd backend
    npm install
    cd ..
    
    if [ $? -eq 0 ]; then
        print_success "后端依赖安装成功"
    else
        print_error "后端依赖安装失败"
        exit 1
    fi
}

# 初始化数据库
init_database() {
    print_info "初始化数据库..."
    
    # 检查 .env 文件
    if [ ! -f "backend/.env" ]; then
        print_warning ".env 文件不存在，创建默认配置..."
        cp backend/.env.example backend/.env
        print_info "请编辑 backend/.env 文件配置数据库连接"
        read -p "按回车键继续..."
    fi
    
    cd backend
    
    # 运行 Prisma 迁移
    print_info "运行数据库迁移..."
    npx prisma migrate dev --name init
    
    if [ $? -eq 0 ]; then
        print_success "数据库迁移成功"
    else
        print_error "数据库迁移失败"
        cd ..
        return 1
    fi
    
    # 生成 Prisma Client
    print_info "生成 Prisma Client..."
    npx prisma generate
    
    # 运行种子数据（如果存在）
    if [ -f "prisma/seed.js" ]; then
        print_info "导入种子数据..."
        npm run prisma:seed
    fi
    
    cd ..
    print_success "数据库初始化完成"
}

# 启动开发模式
start_dev_mode() {
    print_info "启动开发模式..."
    
    # 检查并安装依赖
    if [ ! -d "node_modules" ] || [ ! -d "backend/node_modules" ]; then
        install_dependencies
    fi
    
    # 使用 concurrently 同时启动前后端
    if command -v concurrently &> /dev/null; then
        print_info "使用 concurrently 启动前后端..."
        npx concurrently \
            --names "FRONTEND,BACKEND" \
            --prefix-colors "cyan,yellow" \
            "npm run dev" \
            "cd backend && npm run dev"
    else
        # 如果没有 concurrently，使用后台进程
        print_info "启动后端服务..."
        cd backend
        npm run dev &
        BACKEND_PID=$!
        cd ..
        
        print_info "启动前端服务..."
        npm run dev &
        FRONTEND_PID=$!
        
        print_success "服务已启动"
        print_info "前端: http://localhost:5001"
        print_info "后端: http://localhost:5050"
        print_info "按 Ctrl+C 停止所有服务"
        
        # 等待用户中断
        trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
        wait
    fi
}

# 仅启动前端
start_frontend_only() {
    print_info "启动前端开发服务器..."
    
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    
    npm run dev
}

# 仅启动后端
start_backend_only() {
    print_info "启动后端 API 服务器..."
    
    cd backend
    
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    
    npm run dev
}

# 构建生产版本
build_production() {
    print_info "构建生产版本..."
    
    # 构建前端
    print_info "构建前端..."
    npm run build
    
    if [ $? -eq 0 ]; then
        print_success "前端构建成功"
    else
        print_error "前端构建失败"
        exit 1
    fi
    
    # 构建后端
    print_info "准备后端生产环境..."
    cd backend
    npm run build
    cd ..
    
    print_success "生产版本构建完成"
    print_info "前端文件: ./dist"
    print_info "启动生产服务器: cd backend && npm start"
}

# Docker 容器启动
start_docker() {
    print_info "启动 Docker 容器..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose 未安装"
        exit 1
    fi
    
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        print_success "Docker 容器启动成功"
        print_info "前端: http://localhost:5001"
        print_info "后端: http://localhost:5050"
        print_info "数据库: localhost:5432"
    else
        print_error "Docker 容器启动失败"
    fi
}

# 清理缓存和依赖
clean_project() {
    print_warning "即将清理所有缓存和依赖..."
    read -p "确定要继续吗？(y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "清理前端..."
        rm -rf node_modules package-lock.json dist
        
        print_info "清理后端..."
        rm -rf backend/node_modules backend/package-lock.json
        
        print_info "清理缓存..."
        npm cache clean --force
        
        print_success "清理完成"
    else
        print_info "取消清理"
    fi
}

# 系统健康检查
health_check() {
    print_info "执行系统健康检查..."
    
    # 检查前端
    print_info "检查前端服务..."
    curl -s http://localhost:5001 > /dev/null
    if [ $? -eq 0 ]; then
        print_success "前端服务运行正常"
    else
        print_warning "前端服务未运行"
    fi
    
    # 检查后端
    print_info "检查后端 API..."
    curl -s http://localhost:5050/health > /dev/null
    if [ $? -eq 0 ]; then
        print_success "后端 API 运行正常"
    else
        print_warning "后端 API 未运行"
    fi
    
    # 检查数据库连接
    print_info "检查数据库连接..."
    cd backend
    npx prisma db push --accept-data-loss --skip-generate 2>/dev/null
    if [ $? -eq 0 ]; then
        print_success "数据库连接正常"
    else
        print_warning "数据库连接失败"
    fi
    cd ..
    
    # 检查磁盘空间
    print_info "检查磁盘空间..."
    DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $DISK_USAGE -lt 90 ]; then
        print_success "磁盘空间充足 (使用率: ${DISK_USAGE}%)"
    else
        print_warning "磁盘空间不足 (使用率: ${DISK_USAGE}%)"
    fi
}

# 主程序
main() {
    clear
    
    # 检查依赖
    check_dependencies
    
    while true; do
        show_menu
        read -p "请输入选项 (1-9): " choice
        
        case $choice in
            1)
                start_dev_mode
                ;;
            2)
                start_frontend_only
                ;;
            3)
                start_backend_only
                ;;
            4)
                init_database
                ;;
            5)
                build_production
                ;;
            6)
                start_docker
                ;;
            7)
                clean_project
                ;;
            8)
                health_check
                ;;
            9)
                print_info "退出程序"
                exit 0
                ;;
            *)
                print_error "无效选项，请重新选择"
                ;;
        esac
        
        echo ""
        read -p "按回车键返回主菜单..."
    done
}

# 运行主程序
main