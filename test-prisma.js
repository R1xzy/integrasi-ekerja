const { PrismaClient } = require('@prisma/client');

async function testPrisma() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing Prisma models...');
    
    // List all available methods
    const methods = Object.getOwnPropertyNames(prisma)
      .filter(prop => typeof prisma[prop] === 'object' && prisma[prop] !== null)
      .filter(prop => !prop.startsWith('_') && !prop.startsWith('$'))
      .sort();
    
    console.log('Available models:', methods);
    
    // Test specific models
    if (prisma.providerDocument) {
      console.log('✅ providerDocument model available');
      const count = await prisma.providerDocument.count();
      console.log('providerDocument count:', count);
    } else {
      console.log('❌ providerDocument model NOT available');
    }
    
    if (prisma.review) {
      console.log('✅ review model available');
      // Test if isShow field exists
      try {
        const reviews = await prisma.review.findMany({
          where: { isShow: true },
          take: 1
        });
        console.log('✅ isShow field works');
      } catch (error) {
        console.log('❌ isShow field error:', error.message);
      }
    }
    
    if (prisma.user) {
      console.log('✅ user model available');
      // Test providerDocuments relation
      try {
        const users = await prisma.user.findMany({
          include: { providerDocuments: true },
          take: 1
        });
        console.log('✅ providerDocuments relation works');
      } catch (error) {
        console.log('❌ providerDocuments relation error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPrisma();
