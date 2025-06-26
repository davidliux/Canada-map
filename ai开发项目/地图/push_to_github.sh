#!/bin/bash

echo "🚀 加拿大快递配送系统 - GitHub推送脚本"
echo "================================================"

# 测试SSH连接
echo "📡 测试GitHub SSH连接..."
if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
    echo "✅ SSH连接成功！"
else
    echo "❌ SSH连接失败，请确保已添加SSH key到GitHub账户"
    echo ""
    echo "SSH公钥内容:"
    cat ~/.ssh/id_ed25519.pub
    echo ""
    echo "请访问 https://github.com/settings/ssh/new 添加上述公钥"
    exit 1
fi

# 推送到GitHub
echo ""
echo "📤 推送代码到GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 推送成功！"
    echo "🌐 项目地址: https://github.com/davidliux/Canada-map"
    echo ""
    echo "📊 项目统计:"
    echo "   - 65个文件已推送"
    echo "   - 806个FSA数据区域"
    echo "   - React + Electron 桌面应用"
    echo "   - 完整的地图可视化系统"
else
    echo "❌ 推送失败，请检查网络连接和权限"
fi 