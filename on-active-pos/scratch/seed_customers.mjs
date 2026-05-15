import { db } from './src/db/dexie.ts';

const STORE_ID = '00000000-0000-0000-0000-000000000001';

const mockCustomers = [
  {
    id: 'c1',
    store_id: STORE_ID,
    name: 'Tinashe Murehwa',
    phone: '0772123456',
    email: 'tinashe@example.com',
    address: '123 Samora Machel Ave',
    loyalty_points: 120,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'c2',
    store_id: STORE_ID,
    name: 'Sarah Moyo',
    phone: '0712345678',
    email: 'sarah@example.com',
    address: '45 Josiah Tongogara St',
    loyalty_points: 45,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'c3',
    store_id: STORE_ID,
    name: 'Blessing Zulu',
    phone: '0788998877',
    email: 'blessing@gmail.com',
    address: 'Borrowdale Office Park',
    loyalty_points: 300,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

async function seedCustomers() {
  await db.customers.bulkPut(mockCustomers);
  console.log('Seeded 3 mock customers with real store ID');
}

seedCustomers();
