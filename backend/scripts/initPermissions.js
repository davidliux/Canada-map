/**
 * 初始化权限系统数据
 * 运行: node scripts/initPermissions.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function initPermissions() {
  console.log('开始初始化权限系统...');

  try {
    // 1. 创建默认权限组
    console.log('创建权限组...');

    const groups = [
      {
        name: 'ADMIN_FULL',
        description: '管理员完全权限',
        permissions: [
          { module: 'management', access: true, view: true, edit: true },
          { module: 'truck_delivery', access: true, view: true, edit: true },
          { module: 'fsa_boundaries', access: true, view: true, edit: true },
          { module: 'pricing', access: true, view: true, edit: true },
          { module: 'users', access: true, view: true, edit: true },
          { module: 'reports', access: true, view: true, edit: true }
        ],
        isActive: true
      },
      {
        name: 'VIP1_GROUP',
        description: 'VIP1用户权限组',
        permissions: [
          { module: 'truck_delivery', access: true, view: true, edit: false },
          { module: 'fsa_boundaries', access: true, view: true, edit: false },
          { module: 'pricing', access: true, view: true, edit: false }
        ],
        isActive: true
      },
      {
        name: 'VIP2_GROUP',
        description: 'VIP2用户权限组',
        permissions: [
          { module: 'truck_delivery', access: true, view: true, edit: false },
          { module: 'fsa_boundaries', access: true, view: true, edit: false },
          { module: 'pricing', access: true, view: true, edit: false },
          { module: 'reports', access: true, view: true, edit: false }
        ],
        isActive: true
      },
      {
        name: 'BASIC_USER',
        description: '基础用户权限',
        permissions: [
          { module: 'fsa_boundaries', access: true, view: true, edit: false },
          { module: 'pricing', access: true, view: true, edit: false }
        ],
        isActive: true
      }
    ];

    for (const group of groups) {
      await prisma.permissionGroup.upsert({
        where: { name: group.name },
        update: group,
        create: group
      });
      console.log(`✓ 创建/更新权限组: ${group.name}`);
    }

    // 2. 获取所有用户并根据角色分配权限
    console.log('\n分配用户权限...');
    const users = await prisma.user.findMany();

    for (const user of users) {
      // 确定要分配的权限组
      let groupName;
      switch (user.role) {
        case 'SUPER_ADMIN':
        case 'ADMIN':
          groupName = 'ADMIN_FULL';
          break;
        case 'VIP_1':
          groupName = 'VIP1_GROUP';
          break;
        case 'VIP_2':
          groupName = 'VIP2_GROUP';
          break;
        default:
          groupName = 'BASIC_USER';
      }

      const group = await prisma.permissionGroup.findUnique({
        where: { name: groupName }
      });

      if (group) {
        // 创建用户权限关联
        await prisma.userPermission.upsert({
          where: {
            userId_groupId: {
              userId: user.id,
              groupId: group.id
            }
          },
          update: {},
          create: {
            userId: user.id,
            groupId: group.id,
            modules: []
          }
        });
        console.log(`✓ 为用户 ${user.username} (${user.role}) 分配权限组 ${groupName}`);

        // 设置查询限制
        const limits = {
          VIP_1: { daily: 10, monthly: 300 },
          VIP_2: { daily: 20, monthly: 600 },
          USER: { daily: 5, monthly: 150 },
          MANAGER: { daily: 50, monthly: 1500 }
        };

        const userLimit = limits[user.role];
        if (userLimit) {
          await prisma.userQueryLimit.upsert({
            where: {
              userId_queryType: {
                userId: user.id,
                queryType: 'PRICE_QUERY'
              }
            },
            update: {
              dailyLimit: userLimit.daily,
              monthlyLimit: userLimit.monthly
            },
            create: {
              userId: user.id,
              queryType: 'PRICE_QUERY',
              dailyLimit: userLimit.daily,
              monthlyLimit: userLimit.monthly,
              usedToday: 0,
              usedThisMonth: 0
            }
          });
          console.log(`  └─ 设置查询限制: 每日 ${userLimit.daily} 次, 每月 ${userLimit.monthly} 次`);
        }
      }
    }

    console.log('\n✅ 权限系统初始化完成！');

    // 显示统计信息
    const groupCount = await prisma.permissionGroup.count();
    const permissionCount = await prisma.userPermission.count();
    const limitCount = await prisma.userQueryLimit.count();

    console.log('\n📊 统计信息:');
    console.log(`  - 权限组: ${groupCount} 个`);
    console.log(`  - 用户权限分配: ${permissionCount} 条`);
    console.log(`  - 查询限制设置: ${limitCount} 条`);

  } catch (error) {
    console.error('❌ 初始化失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行初始化
initPermissions();