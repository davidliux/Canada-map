/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Ensure base region exists
  await prisma.deliveryRegion.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      name: '区域1',
      description: '配送区域1',
      displayOrder: 1,
      colorCode: '#3B82F6',
    },
  });

  // Ensure two default weight ranges for region 1 if empty
  const count = await prisma.weightRange.count({ where: { regionId: '1' } });
  if (count === 0) {
    await prisma.weightRange.createMany({
      data: [
        { regionId: '1', rangeName: '0-11.000 KGS', minWeight: 0.0, maxWeight: 11.0, price: 0, displayOrder: 1 },
        { regionId: '1', rangeName: '11.001-15.000 KGS', minWeight: 11.001, maxWeight: 15.0, price: 0, displayOrder: 2 },
      ],
      skipDuplicates: true,
    });
  }

  console.log('Seed completed.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
