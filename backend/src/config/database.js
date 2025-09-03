const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

let prisma;

const connectDatabase = async () => {
  try {
    if (!prisma) {
      prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' 
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
      });
    }
    
    // Test connection
    await prisma.$connect();
    logger.info('Database connection established');
    
    return prisma;
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

const disconnectDatabase = async () => {
  if (prisma) {
    await prisma.$disconnect();
    logger.info('Database connection closed');
  }
};

const getPrismaClient = () => {
  if (!prisma) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return prisma;
};

module.exports = {
  connectDatabase,
  disconnectDatabase,
  getPrismaClient,
};