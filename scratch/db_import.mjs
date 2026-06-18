import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_STORE_ID = '00000000-0000-0000-0000-000000000001';

async function main() {
  const productsRaw = fs.readFileSync('scratch/parsed_products.json', 'utf-8');
  const productsList = JSON.parse(productsRaw);

  console.log(`Starting import of ${productsList.length} products...`);

  for (const prod of productsList) {
    console.log(`Processing product: ${prod.name}`);
    
    // 1. Upsert Product
    const { data: productData, error: productError } = await supabase
      .from('products')
      .upsert({
        slug: prod.slug,
        name: prod.name,
        category: prod.category || null,
        gender: prod.gender || 'All',
        price_usd: prod.price_usd,
        description: prod.description || '',
        sizes: prod.sizes || [],
        stock_quantity: prod.variants.reduce((sum, v) => sum + (v.stock || 0), 0),
        is_featured: prod.is_featured || false,
        is_trending: prod.is_trending || false,
        is_active: true,
        images: []
      }, { onConflict: 'slug' })
      .select('id')
      .single();

    if (productError) {
      console.error(`Error inserting product ${prod.name}:`, productError);
      continue;
    }

    const productId = productData.id;

    // 2. Process Variants
    for (const v of prod.variants) {
      const variantName = `${v.size} / ${v.color}`;
      
      const { data: existingVariant } = await supabase
        .from('product_variants')
        .select('id')
        .eq('product_id', productId)
        .eq('size', v.size)
        .eq('color', v.color)
        .maybeSingle();

      let variantId = existingVariant?.id;

      if (!variantId) {
        const { data: newVar, error: varError } = await supabase
          .from('product_variants')
          .insert({
            product_id: productId,
            name: variantName,
            size: v.size,
            color: v.color,
            price: v.price || prod.price_usd
          })
          .select('id')
          .single();
          
        if (varError) {
           console.error(`Error inserting variant ${variantName} for ${prod.name}:`, varError);
           continue;
        }
        variantId = newVar.id;
      } else {
        await supabase
          .from('product_variants')
          .update({ price: v.price || prod.price_usd })
          .eq('id', variantId);
      }

      // 3. Process Inventory
      const { data: existingInv } = await supabase
        .from('store_inventory')
        .select('id')
        .eq('store_id', DEFAULT_STORE_ID)
        .eq('product_id', productId)
        .eq('variant_id', variantId)
        .maybeSingle();

      if (!existingInv) {
        await supabase
          .from('store_inventory')
          .insert({
            store_id: DEFAULT_STORE_ID,
            product_id: productId,
            variant_id: variantId,
            quantity: v.stock || 0
          });
      } else {
        await supabase
          .from('store_inventory')
          .update({ quantity: v.stock || 0 })
          .eq('id', existingInv.id);
      }
    }
    
    console.log(`Successfully imported ${prod.name} with ${prod.variants.length} variants.`);
  }

  console.log('Import complete!');
}

main().catch(console.error);
