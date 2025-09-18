const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateUserToSuperAdmin(username) {
  try {
    // 查找用户
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username }
        ]
      }
    });

    if (!user) {
      console.error(`用户 ${username} 不存在`);
      return;
    }

    // 更新用户角色为 SUPER_ADMIN
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: 'SUPER_ADMIN',
        isActive: true
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true
      }
    });

    console.log('用户角色已成功更新:');
    console.log('-------------------');
    console.log(`用户名: ${updatedUser.username}`);
    console.log(`邮箱: ${updatedUser.email}`);
    console.log(`全名: ${updatedUser.fullName || '未设置'}`);
    console.log(`新角色: ${updatedUser.role}`);
    console.log(`状态: ${updatedUser.isActive ? '激活' : '未激活'}`);
    console.log('-------------------');
    console.log('请重新登录以使更改生效！');

  } catch (error) {
    console.error('更新用户角色失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 从命令行获取用户名参数
const username = process.argv[2];

if (!username) {
  console.log('使用方法: node updateUserRole.js <用户名或邮箱>');
  console.log('例如: node updateUserRole.js testuser');
  process.exit(1);
}

updateUserToSuperAdmin(username);