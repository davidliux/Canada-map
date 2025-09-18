const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// 要重置密码的用户和新密码
const USERNAME = 'testuser';
const NEW_PASSWORD = 'Test123456!';  // 新密码

async function resetPassword() {
  console.log(`=== 重置用户 ${USERNAME} 的密码 ===\n`);

  try {
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { username: USERNAME }
    });

    if (!user) {
      console.error(`❌ 用户 ${USERNAME} 不存在`);
      process.exit(1);
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);

    // 更新密码
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        refreshToken: null,
        refreshTokenExpiresAt: null
      }
    });

    console.log('✅ 密码重置成功！');
    console.log('=====================================');
    console.log(`用户名: ${updatedUser.username}`);
    console.log(`新密码: ${NEW_PASSWORD}`);
    console.log(`邮箱: ${updatedUser.email}`);
    console.log(`角色: ${updatedUser.role}`);
    console.log('=====================================');
    console.log('\n现在可以使用新密码登录了！');
    console.log('登录地址: http://localhost:5001/settings/account');

  } catch (error) {
    console.error('\n❌ 密码重置失败:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
resetPassword().catch((error) => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});