const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createSuperAdmin() {
  console.log('=== 创建超级管理员账号 ===\n');

  try {
    // 收集用户信息
    const username = await question('请输入用户名: ');
    const email = await question('请输入邮箱: ');
    const password = await question('请输入密码 (至少8个字符，包含大小写字母和数字): ');
    const fullName = await question('请输入全名 (可选，直接回车跳过): ');

    // 验证输入
    if (!username || username.length < 3) {
      throw new Error('用户名至少需要3个字符');
    }

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      throw new Error('请输入有效的邮箱地址');
    }

    if (!password || password.length < 8) {
      throw new Error('密码至少需要8个字符');
    }

    if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)) {
      throw new Error('密码必须包含大小写字母和数字');
    }

    // 检查用户名是否已存在
    const existingUsername = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUsername) {
      throw new Error('用户名已被使用');
    }

    // 检查邮箱是否已存在
    const existingEmail = await prisma.user.findUnique({
      where: { email }
    });

    if (existingEmail) {
      throw new Error('邮箱已被注册');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建超级管理员用户
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: hashedPassword,
        fullName: fullName || null,
        role: 'SUPER_ADMIN',  // 设置为超级管理员角色
        isActive: true
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true
      }
    });

    console.log('\n✅ 超级管理员账号创建成功！');
    console.log('===========================');
    console.log(`用户ID: ${user.id}`);
    console.log(`用户名: ${user.username}`);
    console.log(`邮箱: ${user.email}`);
    console.log(`全名: ${user.fullName || '未设置'}`);
    console.log(`角色: ${user.role}`);
    console.log(`创建时间: ${user.createdAt.toLocaleString()}`);
    console.log('===========================');
    console.log('\n现在可以使用此账号登录系统了！');

  } catch (error) {
    console.error('\n❌ 创建失败:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// 运行脚本
createSuperAdmin().catch((error) => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});