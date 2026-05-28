import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

let url = '';
let key = '';
for (const line of envContent.split('\n')) {
  if (line.trim().startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=').slice(1).join('=').trim();
  if (line.trim().startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=').slice(1).join('=').trim();
}

const supabase = createClient(url, key);

const today = new Date();
today.setHours(0, 0, 0, 0);
const startOfToday = today.toISOString();
const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
const ago90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

function section(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('='.repeat(60));
}

function row(label, value, warn = false) {
  const prefix = warn ? '⚠️ ' : '✅ ';
  console.log(`  ${prefix} ${label}: ${value}`);
}

async function audit() {
  section('1. SALESMAN ORDERS (POS Floor)');
  const { data: salesmanAll, error: e1 } = await supabase.from('salesman_orders').select('id, status, subtotal, created_at').order('created_at', { ascending: false }).limit(20);
  if (e1) { console.error('  ❌ ERROR:', e1.message); }
  else {
    const today_ = salesmanAll?.filter(o => o.created_at >= startOfToday) || [];
    row('Total all-time records', salesmanAll?.length);
    row('Orders logged today', today_.length, today_.length === 0);
    row('Today statuses', today_.map(o => o.status).join(', ') || 'none', today_.length === 0);
    row('Today subtotals', today_.map(o => `$${o.subtotal}`).join(', ') || 'none');
  }

  section('2. POS COMPLETED ORDERS');
  const { data: posOrders, error: e2 } = await supabase.from('pos_orders').select('id, status, total, source, created_at').order('created_at', { ascending: false }).limit(20);
  if (e2) { console.error('  ❌ ERROR:', e2.message); }
  else {
    const todayPOS = posOrders?.filter(o => o.created_at >= startOfToday) || [];
    const completed = todayPOS.filter(o => o.status === 'completed');
    row('Total all-time records', posOrders?.length);
    row('POS orders today', todayPOS.length, todayPOS.length === 0);
    row('Completed today', completed.length, completed.length === 0);
    row('Total revenue completed today', `$${completed.reduce((s,o) => s + (o.total||0), 0).toFixed(2)}`);
  }

  section('3. ONLINE ORDERS (pending_orders)');
  const { data: onlineOrders, error: e3 } = await supabase.from('pending_orders').select('id, status, total_usd, created_at').order('created_at', { ascending: false }).limit(20);
  if (e3) { console.error('  ❌ ERROR:', e3.message); }
  else {
    const todayOnline = onlineOrders?.filter(o => o.created_at >= startOfToday) || [];
    const monthOnline = onlineOrders?.filter(o => o.created_at >= startOfMonth && o.status !== 'cancelled') || [];
    row('Total records', onlineOrders?.length);
    row('Orders today', todayOnline.length);
    row('Revenue this month', `$${monthOnline.reduce((s,o) => s + (o.total_usd||0), 0).toFixed(2)}`);
  }

  section('4. ONLINE ORDER BRIDGE (online_order_bridge)');
  const { data: bridge, error: e4 } = await supabase.from('online_order_bridge').select('id, status, total, fulfillment').limit(20);
  if (e4) { console.error('  ❌ ERROR:', e4.message); }
  else {
    const pending = bridge?.filter(o => o.status === 'pending') || [];
    const inProgress = bridge?.filter(o => ['confirmed','preparing','ready'].includes(o.status)) || [];
    row('Total bridge records', bridge?.length);
    row('Pending', pending.length);
    row('In progress', inProgress.length);
    row('Total pending revenue', `$${bridge?.reduce((s,o) => s + (o.total||0), 0).toFixed(2)}`);
  }

  section('5. SHIFTS (Active Staff)');
  const { data: shifts, error: e5 } = await supabase.from('shifts').select('id, status, employee_id, store_id, employees!inner(role, full_name)').eq('status', 'open');
  if (e5) { console.error('  ❌ ERROR:', e5.message); }
  else {
    const salesmen = shifts?.filter(s => s.employees?.role === 'salesman') || [];
    row('Open shifts total', shifts?.length, shifts?.length === 0);
    row('Salesmen on floor', salesmen.length);
    row('Roles on shift', [...new Set(shifts?.map(s => s.employees?.role))].join(', ') || 'none');
  }

  section('6. STORE INVENTORY (Low Stock)');
  const { data: inventory, error: e6 } = await supabase.from('store_inventory').select('id, quantity, product_id').lte('quantity', 5);
  if (e6) { console.error('  ❌ ERROR:', e6.message); }
  else {
    row('Low stock items (qty ≤ 5)', inventory?.length);
  }

  section('7. PRODUCTS (Active Count)');
  const { data: products, error: e7 } = await supabase.from('products').select('id, name, is_active').eq('is_active', true);
  if (e7) { console.error('  ❌ ERROR:', e7.message); }
  else {
    row('Active products', products?.length, products?.length === 0);
  }

  section('8. POS ORDER ITEMS (Top Products - 90 days)');
  const { data: posOrders90, error: e8a } = await supabase.from('pos_orders').select('id').gte('created_at', ago90).neq('status', 'cancelled');
  if (e8a) { console.error('  ❌ POS 90d ERROR:', e8a.message); }
  else {
    const orderIds = posOrders90?.map(o => o.id) || [];
    if (orderIds.length > 0) {
      const { data: items, error: e8b } = await supabase.from('pos_order_items').select('product_name, quantity').in('order_id', orderIds);
      if (e8b) { console.error('  ❌ POS items ERROR:', e8b.message); }
      else {
        const grouped = {};
        for (const item of items || []) {
          grouped[item.product_name] = (grouped[item.product_name] || 0) + (item.quantity || 1);
        }
        const top5 = Object.entries(grouped).sort((a, b) => b[1] - a[1]).slice(0, 5);
        row('POS orders in 90d window', orderIds.length);
        row('Top products', top5.map(([name, count]) => `${name}(${count})`).join(', ') || 'none');
      }
    } else {
      row('POS orders in 90d window', 0, true);
    }
  }

  section('9. REVENUE CHART (90-day online orders)');
  const { data: online90, error: e9 } = await supabase.from('pending_orders').select('created_at, total_usd').gte('created_at', ago90).neq('status', 'cancelled');
  if (e9) { console.error('  ❌ ERROR:', e9.message); }
  else {
    const daysWithRevenue = new Set(online90?.map(o => o.created_at?.slice(0,10)));
    row('Online orders in 90d window', online90?.length, online90?.length === 0);
    row('Days with revenue', daysWithRevenue.size);
    row('Total 90d revenue', `$${(online90 || []).reduce((s,o) => s + (o.total_usd||0), 0).toFixed(2)}`);
  }

  section('10. SETTINGS TABLE');
  const { data: settings, error: e10 } = await supabase.from('settings').select('key, value');
  if (e10) { console.error('  ❌ ERROR:', e10.message); }
  else {
    const zigRate = settings?.find(s => s.key === 'zig_rate')?.value;
    row('Total settings rows', settings?.length);
    row('zig_rate value', zigRate ?? '⚠️ NOT FOUND - will default to 13500', !zigRate);
  }

  section('SUMMARY');
  console.log('  Dashboard audit complete. Review ⚠️ warnings above.\n');
}

audit().catch(console.error);
