import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkWarehouse() {
  try {
    console.log('Checking for warehouse premise...\n');
    
    // Find premises that might be the warehouse
    const warehousePremises = await prisma.premise.findMany({
      where: {
        OR: [
          { name: { contains: 'Red Bull Distribution', mode: 'insensitive' } },
          { name: { contains: 'Fuschl', mode: 'insensitive' } },
          { name: { contains: 'warehouse', mode: 'insensitive' } },
        ],
      },
    });

    if (warehousePremises.length === 0) {
      console.log('❌ No warehouse premise found!');
      console.log('The database may not be seeded properly.');
      console.log('Run: npm run seed');
    } else {
      console.log(`✅ Found ${warehousePremises.length} warehouse premise(s):\n`);
      warehousePremises.forEach((premise) => {
        console.log(`ID: ${premise.id}`);
        console.log(`Name: ${premise.name}`);
        console.log(`Address: ${premise.address}`);
        console.log(`Coordinates: ${premise.latitude}, ${premise.longitude}`);
        console.log(`Category: ${premise.category}`);
        console.log('---');
      });
    }

    // Also check total premises count
    const totalPremises = await prisma.premise.count();
    console.log(`\nTotal premises in database: ${totalPremises}`);
    
  } catch (error) {
    console.error('Error checking warehouse:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWarehouse();
