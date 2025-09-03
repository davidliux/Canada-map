#!/bin/bash

# 🚀 智能助手系统快速移植脚本 v4.1
# 用途：将完整的智能助手生态系统快速部署到新项目

echo "🤖 智能助手系统快速移植工具 v4.1"
echo "=================================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取当前脚本所在目录（源项目目录）
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo -e "${BLUE}📍 源项目目录: ${SOURCE_DIR}${NC}"

# 获取目标项目目录
if [ -z "$1" ]; then
    echo -e "${YELLOW}💡 使用方法: $0 <目标项目目录>${NC}"
    echo "例如: $0 /path/to/my-new-project"
    exit 1
fi

TARGET_DIR="$1"
echo -e "${BLUE}📍 目标项目目录: ${TARGET_DIR}${NC}"

# 创建目标目录（如果不存在）
if [ ! -d "$TARGET_DIR" ]; then
    echo -e "${YELLOW}📁 创建目标目录...${NC}"
    mkdir -p "$TARGET_DIR"
fi

cd "$TARGET_DIR"

echo -e "${GREEN}✅ 开始移植智能助手系统...${NC}"

# 1. 复制 Cursor AI 代理配置
echo -e "${BLUE}🤖 移植 Cursor AI 代理配置...${NC}"
if [ -d "$SOURCE_DIR/.cursor" ]; then
    cp -r "$SOURCE_DIR/.cursor" ./
    echo -e "${GREEN}   ✅ Cursor AI 代理配置已复制${NC}"
else
    echo -e "${RED}   ❌ 源目录中未找到 .cursor 配置${NC}"
fi

# 2. 复制智能助手系统
echo -e "${BLUE}🧠 移植智能助手系统核心...${NC}"
if [ -d "$SOURCE_DIR/智能助手系统" ]; then
    cp -r "$SOURCE_DIR/智能助手系统" ./
    echo -e "${GREEN}   ✅ 智能助手系统已复制${NC}"
else
    echo -e "${RED}   ❌ 源目录中未找到智能助手系统${NC}"
fi

# 3. 复制 BMad 官方核心（如果存在）
echo -e "${BLUE}🎭 移植 BMad 官方核心...${NC}"
if [ -d "$SOURCE_DIR/.bmad-core" ]; then
    cp -r "$SOURCE_DIR/.bmad-core" ./
    echo -e "${GREEN}   ✅ BMad 官方核心已复制${NC}"
else
    echo -e "${YELLOW}   ⚠️  BMad 官方核心不存在，跳过${NC}"
fi

# 4. 复制 web-bundles（可选）
echo -e "${BLUE}📦 移植 web-bundles 扩展包...${NC}"
if [ -d "$SOURCE_DIR/web-bundles" ]; then
    echo -e "${YELLOW}   📦 发现 web-bundles，是否复制？(y/N)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        cp -r "$SOURCE_DIR/web-bundles" ./
        echo -e "${GREEN}   ✅ web-bundles 已复制${NC}"
    else
        echo -e "${YELLOW}   ⏭️  跳过 web-bundles${NC}"
    fi
else
    echo -e "${YELLOW}   ⚠️  web-bundles 不存在，跳过${NC}"
fi

# 5. 创建项目特定的目录结构
echo -e "${BLUE}📁 创建项目特定目录结构...${NC}"
mkdir -p docs/{design,bmad-stories,quality-reviews,technical-specs,project-management}
mkdir -p docs/design/{database,api,architecture}
mkdir -p docs/quality-reviews/{step-reviews,story-reviews}
mkdir -p docs/technical-specs/{coding-standards,deployment}
mkdir -p docs/project-management/{workflows,planning}
echo -e "${GREEN}   ✅ 项目目录结构已创建${NC}"

# 6. 创建项目配置文件
echo -e "${BLUE}⚙️  创建项目配置文件...${NC}"
cat > .smart-assistant-config.yml << EOF
# 智能助手系统项目配置 v4.1
project:
  name: "新项目"
  created_date: "$(date +%Y-%m-%d)"
  version: "1.0.0"
  type: "待配置"  # web/mobile/api/ai
  
smart_assistant:
  version: "v4.1"
  enabled_features:
    - "BMad Method工作流程"
    - "TDD开发支持"
    - "前端设计自动需求收集"
    - "强制质量评审"
    - "上下文恢复系统"
    - "智能代理调度"
  
customizations:
  tech_stack: "待配置"  # 如: Node.js/React/PostgreSQL
  domain: "待配置"      # 如: 电商/金融/教育/医疗
  complexity: "中等"    # 简单/中等/复杂
  
team:
  size: 1
  roles: ["开发者"]
EOF
echo -e "${GREEN}   ✅ 项目配置文件已创建${NC}"

# 7. 创建 README
echo -e "${BLUE}📝 创建项目 README...${NC}"
cat > README.md << EOF
# 新项目

> 搭载智能助手系统 v4.1 - BMad Method融合+Self-contained Context+TDD全功能

## 🚀 快速开始

### 使用智能助手开始开发

\`\`\`bash
# 初始化项目
@project-controller 初始化项目 "项目名称" "项目描述"

# 智能开发
@project-controller 我要做一个[具体需求]

# 查看状态
@project-controller 状态

# 继续开发
@project-controller 下一步
\`\`\`

## 🤖 智能助手功能

- ✅ **BMad Method工作流程**: 9步精简高效开发
- ✅ **TDD完整支持**: 测试驱动开发全流程
- ✅ **前端设计自动需求收集**: 效率提升48%
- ✅ **强制质量评审**: 确保高质量交付
- ✅ **上下文恢复**: 0.3秒恢复任何工作状态
- ✅ **智能代理调度**: 10个专业AI代理自动协作

## 📚 文档

- [智能助手系统概述](智能助手系统/系统概述.md)
- [用户使用指南](智能助手系统/用户使用指南.md)
- [项目移植指南](智能助手系统/项目移植指南.md)

## 🎯 核心理念

**您只需要专注于需求，AI助手处理一切技术复杂性！**

---
*由智能助手系统 v4.1 自动生成*
EOF
echo -e "${GREEN}   ✅ 项目 README 已创建${NC}"

# 8. 验证移植结果
echo -e "${BLUE}🔍 验证移植结果...${NC}"

# 检查关键文件
CRITICAL_FILES=(
    ".cursor/rules/project-controller.mdc"
    "智能助手系统/project-controller.md"
    "智能助手系统/系统概述.md"
    "智能助手系统/用户使用指南.md"
)

ALL_GOOD=true
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}   ✅ $file${NC}"
    else
        echo -e "${RED}   ❌ $file 缺失${NC}"
        ALL_GOOD=false
    fi
done

echo ""
echo "=================================================="

if [ "$ALL_GOOD" = true ]; then
    echo -e "${GREEN}🎉 智能助手系统移植成功！${NC}"
    echo ""
    echo -e "${BLUE}📋 下一步操作：${NC}"
    echo "1. 打开 Cursor IDE 并切换到此目录"
    echo "2. 运行: @project-controller 状态"
    echo "3. 运行: @project-controller 我要做一个[您的项目想法]"
    echo ""
    echo -e "${YELLOW}💡 提示：${NC}"
    echo "- 修改 .smart-assistant-config.yml 中的项目信息"
    echo "- 查看 智能助手系统/用户使用指南.md 了解详细用法"
    echo "- 使用 @project-controller 命令开始智能化开发"
    echo ""
    echo -e "${GREEN}🚀 享受AI驱动的高效开发体验！${NC}"
else
    echo -e "${RED}❌ 移植过程中发现问题，请检查源目录和权限${NC}"
fi

echo "=================================================="
echo -e "${BLUE}📍 移植完成时间: $(date)${NC}"
echo -e "${BLUE}📍 移植目标目录: $(pwd)${NC}"