import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

async function testAIChatRoute() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  let url = '';
  let serviceKey = '';
  let apiKey = '';
  envContent.split('\n').forEach(line => {
    if (line.trim().startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/^"(.*)"$/, '$1');
    if (line.trim().startsWith('SUPABASE_SERVICE_ROLE_KEY=')) serviceKey = line.split('=')[1].trim().replace(/^"(.*)"$/, '$1');
    if (line.trim().startsWith('GEMINI_API_KEY=')) apiKey = line.split('=')[1].trim().replace(/^"(.*)"$/, '$1');
  });

  const adminSupabase = createClient(url, serviceKey);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  console.log('Testing pos_orders...');
  let res = await adminSupabase
      .from('pos_orders')
      .select('id, order_number, source, total, status, created_at, auto_discount_applied, auto_discount_amount')
      .eq('status', 'completed')
      .gte('created_at', todayStart.toISOString());
  
  if (res.error) {
      console.log('Fallback pos_orders...');
      res = await adminSupabase
        .from('pos_orders')
        .select('id, order_number, source, total, status, created_at')
        .eq('status', 'completed')
        .gte('created_at', todayStart.toISOString());
  }
  const posOrdersList = res.data ?? [];
  console.log('posOrdersList length:', posOrdersList.length);

  console.log('Testing shifts...');
  const shiftsRes = await adminSupabase
      .from('shifts')
      .select('id, employee_id, store_id, opened_at, opening_cash')
      .eq('status', 'open');
  const openShiftsList = shiftsRes.data ?? [];
  console.log('openShiftsList length:', openShiftsList.length);

  console.log('Testing online_order_bridge...');
  let pendingRes = await adminSupabase
      .from('online_order_bridge')
      .select('id, fulfillment, status, total, customer_name, assigned_at')
      .not('status', 'in', '("completed","cancelled")');
  if (pendingRes.error) {
      console.log('Fallback online_order_bridge...');
      pendingRes = await adminSupabase
        .from('online_order_bridge')
        .select('id, fulfillment, status, assigned_at')
        .not('status', 'in', '("completed","cancelled")');
  }
  const pendingOnlineList = pendingRes.data ?? [];
  console.log('pendingOnlineList length:', pendingOnlineList.length);

  const posContext = `
## POS Sales Today
- Total POS orders: ${posOrdersList.length}
- POS revenue: $${posOrdersList.reduce((s, o) => s + (o.total || 0), 0).toFixed(2)}
- Walk-in: ${posOrdersList.filter(o => o.source === 'walk_in').length}
- Salesman: ${posOrdersList.filter(o => o.source === 'salesman').length}
- Auto-discounts applied: ${posOrdersList.filter(o => o.auto_discount_applied).length}

## Open Shifts
- ${openShiftsList.length} staff currently on shift

## Online Orders Pending Fulfillment
- ${pendingOnlineList.length} orders waiting
- Collection: ${pendingOnlineList.filter(o => o.fulfillment === 'collection').length}
- Delivery: ${pendingOnlineList.filter(o => o.fulfillment === 'delivery').length}
`;
  console.log('Generated context successfully.');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const systemInstruction = `You are Samkee's personal business assistant for On Active...
  
  POS and Unified Channel Real-time Context:
  ${posContext}`;

  console.log('Starting chat...');
  try {
      const chat = model.startChat({
        history: [],
        systemInstruction: {
            role: 'system',
            parts: [{ text: systemInstruction }]
        }
      });
      console.log('Sending message stream...');
      const result = await chat.sendMessageStream("Hello, are you online?");
      for await (const chunk of result.stream) {
          process.stdout.write(chunk.text());
      }
      console.log('\nSuccess!');
  } catch (err) {
      console.error('Chat error:', err);
  }
}

testAIChatRoute();
