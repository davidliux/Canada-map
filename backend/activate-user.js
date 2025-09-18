const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function activateUser() {
  try {
    // 激活用户名为 David123 的用户
    const result = await prisma.user.update({
      where: {
        username: 'David123'
      },
      data: {
        isActive: true
      }
    });

    console.log('用户已激活:', result.username);
    console.log('当前状态: isActive =', result.isActive);

    // 也可以激活所有用户
    const activateAll = await prisma.user.updateMany({
      where: {
        isActive: false
      },
      data: {
        isActive: true
      }
    });

    console.log(`共激活 ${activateAll.count} 个用户`);

  } catch (error) {
    console.error('激活用户失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

activateUser();