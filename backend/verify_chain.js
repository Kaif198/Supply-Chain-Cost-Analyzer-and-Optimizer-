const API_URL = 'http://localhost:3000/api';

async function main() {
    try {
        console.log('1. Logging in...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        if (!loginRes.ok) {
            const txt = await loginRes.text();
            throw new Error(`Login failed: ${loginRes.status} ${txt}`);
        }
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('   Logged in. Token received.');

        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

        console.log('2. Fetching Premises...');
        const premisesRes = await fetch(`${API_URL}/premises`, { headers });
        const premises = await premisesRes.json();
        const originId = premises[0].id;
        const destinationId = premises[1].id;
        console.log(`   Origin: ${originId}, Destination: ${destinationId}`);

        console.log('3. Fetching Vehicles...');
        const vehiclesRes = await fetch(`${API_URL}/vehicles`, { headers });
        const vehicles = await vehiclesRes.json();
        const vehicleId = vehicles[0].id;
        console.log(`   Vehicle: ${vehicleId}`);

        console.log('4. Creating Delivery...');
        const deliveryPayload = {
            originId,
            destinationId,
            vehicleId,
            demand: 100,
            deliveryDate: new Date().toISOString()
        };
        const createRes = await fetch(`${API_URL}/deliveries`, {
            method: 'POST',
            headers,
            body: JSON.stringify(deliveryPayload)
        });
        if (!createRes.ok) {
            const err = await createRes.text();
            throw new Error(`Create Delivery failed: ${err}`);
        }
        const deliveryData = await createRes.json();
        const deliveryId = deliveryData.id;
        console.log(`   Delivery Created: ${deliveryId}`);

        console.log('5. Waiting for Blockchain Hook (5s)...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log('6. Verifying Audit Log...');
        const auditRes = await fetch(`${API_URL}/inventory-chain/audit-log`, { headers });
        const logs = await auditRes.json();

        const found = logs.find(l => l.deliveryId === deliveryId);
        if (found) {
            console.log('   SUCCESS: Blockchain record found!');
            console.log('   Transaction Hash:', found.txHash);
            console.log('   Movement Hash:', found.movementHash);
        } else {
            console.error('   FAILURE: Blockchain record NOT found for delivery ID', deliveryId);
            console.log('   Recent logs:', logs.slice(0, 3));
            process.exit(1);
        }

    } catch (error) {
        console.error('ERROR:', error);
        process.exit(1);
    }
}

main();
