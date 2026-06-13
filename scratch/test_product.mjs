import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedTestProduct() {
  const { data, error } = await supabase.from('products').insert({
    name: 'Test Multi-Image Product',
    slug: 'test-multi-image-product',
    description: 'This is a test product to verify the multi-image swipe gallery.',
    category: 'Accessories',
    price_usd: 99.99,
    stock_quantity: 10,
    is_active: true,
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1434389678369-182ee20c8191?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop'
    ]
  }).select();

  if (error) {
    console.error('Error inserting:', error);
  } else {
    console.log('Successfully inserted test product:', data[0].id);
  }
}

seedTestProduct();
