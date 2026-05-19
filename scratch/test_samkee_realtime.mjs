import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hnyilsmevqenwpspuguz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhueWlsc21ldnFlbndwc3B1Z3V6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk4MTg1MiwiZXhwIjoyMDkwNTU3ODUyfQ.1a0VP9pNtBlAP2kNLaGEIwU4LHSoeIIhrzmdSuahaxs';
const geminiKey = 'AIzaSyDfmKIhYPy43WyhPm1XJOfeK2Ti1_3Z2uY';

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);

async function testSamkee() {
  console.log('=== TEST: Samkee Real-time Data Access ===\n');

  try {
    // 1. Create a very specific "Secret" order to see if AI finds it
    const secretAmount = 133.37;
    const orderRef = `AI-TEST-${Math.floor(Math.random() * 1000)}`;
    
    console.log(`Step 1: Creating a unique order for $${secretAmount}...`);
    const { data: order } = await supabase.from('pos_orders').insert({
      order_number: orderRef,
      total: secretAmount,
      status: 'completed',
      source: 'walk_in',
      fulfillment: 'immediate'
    }).select().single();

    // 2. Mock the context that would be sent to the API
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const { data: posOrders } = await supabase
      .from('pos_orders')
      .select('total, source')
      .eq('status', 'completed')
      .gte('created_at', todayStart.toISOString());

    const storeContext = {
      revenue: posOrders.reduce((s, o) => s + (o.total || 0), 0),
      totalOrdersToday: posOrders.length,
      topSeller: 'Test Product'
    };

    const posContext = `## POS Sales Today\n- Total POS orders: ${posOrders.length}\n- POS revenue: $${storeContext.revenue.toFixed(2)}`;

    console.log('Step 2: Prompting Samkee about today\'s sales...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); 
    
    const prompt = `System: You are Samkee, a business assistant for On Active. Store data: ${JSON.stringify(storeContext)}. POS Context: ${posContext}. 
    User: How much revenue have we made in the physical store today? Be specific.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    console.log('\n--- SAMKEE\'S RESPONSE ---');
    console.log(response);
    console.log('--------------------------\n');

    if (response.includes(secretAmount.toString())) {
      console.log('✅ SUCCESS: Samkee identified the real-time order amount!');
    } else {
      console.log('❌ FAIL: Samkee did not mention the specific amount.');
    }

    // 3. Cleanup
    await supabase.from('pos_orders').delete().eq('id', order.id);
    console.log('\nCleanup complete.');

  } catch (err) {
    console.error('Test Error:', err.message);
  }
}

testSamkee();
