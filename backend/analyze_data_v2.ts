import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Data Analysis for ML Planning ---');

    // 1. Delivery Counts & Date Range
    const totalDeliveries = await prisma.delivery.count();
    const earliestDelivery = await prisma.delivery.findFirst({ orderBy: { deliveryDate: 'asc' } });
    const latestDelivery = await prisma.delivery.findFirst({ orderBy: { deliveryDate: 'desc' } });

    console.log(`Total Deliveries: ${totalDeliveries}`);
    if (earliestDelivery && latestDelivery) {
        console.log(`Date Range: ${earliestDelivery.deliveryDate.toISOString()} to ${latestDelivery.deliveryDate.toISOString()}`);
        const dayDiff = (latestDelivery.deliveryDate.getTime() - earliestDelivery.deliveryDate.getTime()) / (1000 * 3600 * 24);
        console.log(`Total Days: ${Math.round(dayDiff)}`);
    }

    // 2. Daily Aggregation (using groupBy instead of raw query to avoid syntax issues)
    const dailyGroups = await prisma.delivery.groupBy({
        by: ['deliveryDate'],
        _count: { _all: true },
        _sum: { totalCost: true },
        orderBy: { deliveryDate: 'asc' }
    });

    console.log(`\nDaily Data Points: ${dailyGroups.length}`);
    // Group by actual day (YYYY-MM-DD) in JS since groupBy uses full datetime
    const dayMap = new Map();
    dailyGroups.forEach(g => {
        const dateStr = g.deliveryDate.toISOString().split('T')[0];
        if (!dayMap.has(dateStr)) {
            dayMap.set(dateStr, { count: 0, cost: 0 });
        }
        const entry = dayMap.get(dateStr);
        entry.count += g._count._all;
        entry.cost += g._sum.totalCost || 0;
    });

    console.log(`Unique Days: ${dayMap.size}`);
    const first5 = Array.from(dayMap.entries()).slice(0, 5);
    console.log('Sample Daily Data (First 5):', first5);


    // 3. Lead Time / On-Time Analysis for Random Forest
    const overtimeCount = await prisma.delivery.count({ where: { hasOvertime: true } });
    console.log(`\nDeliveries with Overtime (Proxy for Delay Risk): ${overtimeCount} (${((overtimeCount / totalDeliveries) * 100).toFixed(1)}%)`);

    // 4. Feature Availability
    const vehicleTypes = await prisma.vehicle.groupBy({ by: ['type'], _count: true });
    console.log('\nVehicle Types:', vehicleTypes);

    const categories = await prisma.premise.groupBy({ by: ['category'], _count: true });
    console.log('Premise Categories:', categories);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
