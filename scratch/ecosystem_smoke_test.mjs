import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabaseUrl = 'https://hnyilsmevqenwpspuguz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhueWlsc21ldnFlbndwc3B1Z3V6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk4MTg1MiwiZXhwIjoyMDkwNTU3ODUyfQ.1a0VP9pNtBlAP2kNLaGEIwU4LHSoeIIhrzmdSuahaxs';
const geminiKey = 'AIzaSyDfmKIhYPy43WyhPm1XJOfeK2Ti1_3Z2uY';

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);

async function smokeTest() {
  console.log('🚀 STARTING ECOSYSTEM SMOKE TEST 🚀\n');
  const results = [];

  try {
    // 1. DATA BRIDGE TEST
    console.log('--- TEST 1: Webstore to Bridge ---');
    const { data: store } = await supabase.from('stores').select('id, name').limit(1).single();
    const orderRef = `SMOKE-${Math.floor(Math.random() * 1000)}`;
    
    const { data: webOrder } = await supabase.from('pending_orders').insert({
      order_ref: orderRef,
      total_usd: 250,
      items: [{ name: 'Smoke Test Hoodie', quantity: 1, price_usd: 250 }],
      status: 'pending'
    }).select().single();

    const { data: bridgeOrder, error: bErr } = await supabase.from('online_order_bridge').insert({
      webstore_order_id: webOrder.id,
      store_id: store.id,
      customer_name: 'Smoke Tester',
      total: 250,
      status: 'pending'
    }).select().single();

    if (bridgeOrder) {
      console.log(`✅ Order Bridge: SUCCESS (Linked Web Order ${orderRef} to ${store.name})`);
      results.push('Data Bridge: PASS');
    } else {
      console.error('❌ Order Bridge: FAIL', bErr);
      results.push('Data Bridge: FAIL');
    }

    // 2. STAFF MANAGEMENT TEST
    console.log('\n--- TEST 2: Staff & Audit ---');
    const { data: staff } = await supabase.from('employees').insert({
      full_name: 'Smoke Test Cashier',
      role: 'till_operator',
      pin: '7777',
      store_id: store.id,
      is_active: true
    }).select().single();

    const { data: audit } = await supabase.from('admin_audit_logs').insert({
      action: 'smoke_test_create',
      target_type: 'employee',
      target_id: staff.id,
      details: { name: 'Smoke Test Cashier' }
    }).select().single();

    if (staff && audit) {
      console.log('✅ Staff & Audit: SUCCESS (Staff created and action logged)');
      results.push('Staff Management: PASS');
    } else {
      results.push('Staff Management: FAIL');
    }

    // 3. AI INTEGRATION TEST (Gemini 2.5 Flash)
    console.log('\n--- TEST 3: AI Intelligence (Samkee) ---');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `System: You are Samkee. 
    Context: Today we had one test web order (${orderRef}) for $250 and added one new staff member (Smoke Test Cashier).
    User: Give me a quick status update on the store activities today.`;

    const aiRes = await model.generateContent(prompt);
    console.log(`Samkee says: "${aiRes.response.text().trim()}"`);
    console.log('✅ AI Integration: SUCCESS');
    results.push('AI Intelligence: PASS');

    // 4. CLEANUP
    console.log('\n--- CLEANING UP ---');
    await supabase.from('online_order_bridge').delete().eq('id', bridgeOrder.id);
    await supabase.from('pending_orders').delete().eq('id', webOrder.id);
    await supabase.from('admin_audit_logs').delete().eq('target_id', staff.id);
    await supabase.from('employees').delete().eq('id', staff.id);
    console.log('✅ Cleanup finished.');

    console.log('\n' + '='.repeat(30));
    console.log('FINAL ECOSYSTEM REPORT');
    console.log('='.repeat(30));
    results.forEach(r => console.log(r));

  } catch (err) {
    console.error('\n💥 SMOKE TEST CRASHED:', err.message);
  }
}

smokeTest();
