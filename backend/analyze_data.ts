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

    // 2. Daily Aggregation for ARIMA
    // We need to see if we have gaps or if data is continuous
    const dailyCounts = await prisma.$queryRaw`
        SELECT DATE(delivery_date) as date, COUNT(*) as count, SUM("totalCost") as cost
        FROM deliveries
        GROUP BY DATE(delivery_date)
        ORDER BY date ASC
    `;
    console.log(`\nDaily Data Points: ${(dailyCounts as any[]).length}`);
    console.log('Sample Daily Data (First 5):');
    console.log((dailyCounts as any[]).slice(0, 5));

    // 3. Lead Time / On-Time Analysis for Random Forest
    // Since we don't have an "expected delivery date" field in the schema, we must infer reliability or use duration.
    // The schema has `duration` (actual hours). 
    // We can check if `hasOvertime` is true as a proxy for "delayed" or "complex".
    const overtimeCount = await prisma.delivery.count({ where: { hasOvertime: true } });
    console.log(`\nDeliveries with Overtime (Proxy for Delay Risk): ${overtimeCount} (${((overtimeCount / totalDeliveries) * 100).toFixed(1)}%)`);

    // 4. Feature Availability for Random Forest
    // Vehicle Types
    const vehicleTypes = await prisma.vehicle.groupBy({ by: ['type'], _count: true });
    console.log('\nVehicle Types:');
    console.log(vehicleTypes);

    // Regions/States from Premises (Address parsing might be needed, or look at distribution)
    const premises = await prisma.premise.findMany({ select: { address: true, category: true } });
    console.log(`\nTotal Premises: ${premises.length}`);

    // Check distribution of categories
    const categories = await prisma.premise.groupBy({ by: ['category'], _count: true });
    console.log('Premise Categories:');
    console.log(categories);

    // 5. Seasonality Check (Monthly)
    const monthlyCounts = await prisma.$queryRaw`
        SELECT EXTRACT(MONTH FROM delivery_date) as month, COUNT(*) as count
        FROM deliveries
        GROUP BY month
        ORDER BY month ASC
    `;
    console.log('\nMonthly Distribution:');
    console.log(monthlyCounts);

}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
