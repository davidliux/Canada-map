const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// 默认超级管理员账号信息
const DEFAULT_ADMIN = {
  username: 'admin',
  email: 'admin@example.com',
  password: 'Admin123!',
  fullName: '系统管理员'
};

async function setupDefaultAdmin() {
  console.log('=== 设置默认超级管理员账号 ===\n');

  try {
    // 检查是否已存在超级管理员
    const existingSuperAdmin = await prisma.user.findFirst({
      where: {
        role: 'SUPER_ADMIN'
      }
    });

    if (existingSuperAdmin) {
      console.log('⚠️  系统中已存在超级管理员账号：');
      console.log(`   用户名: ${existingSuperAdmin.username}`);
      console.log(`   邮箱: ${existingSuperAdmin.email}`);
      console.log('\n如需创建新的超级管理员，请运行 createSuperAdmin.js 脚本。');
      return;
    }

    // 检查默认用户名是否已被使用
    const existingUsername = await prisma.user.findUnique({
      where: { username: DEFAULT_ADMIN.username }
    });

    if (existingUsername) {
      // 如果用户已存在但不是超级管理员，更新其角色
      if (existingUsername.role !== 'SUPER_ADMIN') {
        const updatedUser = await prisma.user.update({
          where: { id: existingUsername.id },
          data: { role: 'SUPER_ADMIN' }
        });

        console.log('✅ 已将现有用户提升为超级管理员：');
        console.log(`   用户名: ${updatedUser.username}`);
        console.log(`   邮箱: ${updatedUser.email}`);
        return;
      } else {
        console.log('✅ 用户已经是超级管理员');
        return;
      }
    }

    // 检查默认邮箱是否已被使用
    const existingEmail = await prisma.user.findUnique({
      where: { email: DEFAULT_ADMIN.email }
    });

    if (existingEmail) {
      console.log('⚠️  默认邮箱已被使用，使用备用邮箱...');
      DEFAULT_ADMIN.email = `admin_${Date.now()}@example.com`;
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 10);

    // 创建超级管理员用户
    const user = await prisma.user.create({
      data: {
        username: DEFAULT_ADMIN.username,
        email: DEFAULT_ADMIN.email,
        passwordHash: hashedPassword,
        fullName: DEFAULT_ADMIN.fullName,
        role: 'SUPER_ADMIN',
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

    console.log('\n✅ 默认超级管理员账号创建成功！');
    console.log('=====================================');
    console.log(`用户名: ${user.username}`);
    console.log(`密码: ${DEFAULT_ADMIN.password}`);
    console.log(`邮箱: ${user.email}`);
    console.log(`全名: ${user.fullName}`);
    console.log(`角色: ${user.role}`);
    console.log('=====================================');
    console.log('\n⚠️  重要提示：请立即登录并修改默认密码！');
    console.log('登录地址: http://localhost:5001/settings/account');

  } catch (error) {
    console.error('\n❌ 设置失败:', error.message);

    // 如果是数据库连接错误，提供更多帮助信息
    if (error.code === 'P1001' || error.message.includes('connect')) {
      console.log('\n提示: 请确保数据库服务正在运行，并检查 .env 文件中的 DATABASE_URL 配置。');
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
setupDefaultAdmin().catch((error) => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});