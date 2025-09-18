#!/bin/bash
# SSH密钥问题排查脚本 - 在VNC控制台执行

echo "======================================="
echo "   SSH密钥连接问题排查"
echo "======================================="

echo ""
echo "[1] 检查SSH服务状态："
systemctl status sshd | head -10

echo ""
echo "[2] 检查SSH配置文件关键设置："
echo "-----------------------------------"
grep -E "^(PermitRootLogin|PubkeyAuthentication|PasswordAuthentication|AuthorizedKeysFile)" /etc/ssh/sshd_config

echo ""
echo "[3] 检查root用户的.ssh目录："
echo "-----------------------------------"
ls -la /root/.ssh/

echo ""
echo "[4] 检查authorized_keys文件："
echo "-----------------------------------"
if [ -f /root/.ssh/authorized_keys ]; then
    echo "文件权限："
    ls -l /root/.ssh/authorized_keys
    echo ""
    echo "文件内容（前100字符）："
    head -c 100 /root/.ssh/authorized_keys
    echo "..."
    echo ""
    echo "公钥数量："
    grep -c "ssh-rsa" /root/.ssh/authorized_keys
else
    echo "❌ authorized_keys文件不存在！"
fi

echo ""
echo "[5] 检查SSH日志（最近的认证失败）："
echo "-----------------------------------"
grep "Failed\|error\|denied" /var/log/auth.log | tail -5

echo ""
echo "[6] 检查SELinux状态（如果存在）："
echo "-----------------------------------"
if command -v getenforce &> /dev/null; then
    getenforce
else
    echo "SELinux未安装"
fi

echo ""
echo "[7] 检查防火墙规则："
echo "-----------------------------------"
if command -v ufw &> /dev/null; then
    ufw status | grep 22
else
    echo "ufw未安装"
fi

echo ""
echo "======================================="
echo "   修复建议"
echo "======================================="
echo ""
echo "如果authorized_keys不存在或为空，执行："
echo "1. mkdir -p /root/.ssh"
echo "2. touch /root/.ssh/authorized_keys"
echo "3. chmod 700 /root/.ssh"
echo "4. chmod 600 /root/.ssh/authorized_keys"
echo ""
echo "然后添加公钥（阿里云应该自动添加）："
echo "5. 检查阿里云是否正确注入了公钥"