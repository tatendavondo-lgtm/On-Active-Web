import ExcelJS from 'exceljs';
import fs from 'fs';

function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  const workbook = new ExcelJS.Workbook();
  const EXCEL_FILE_PATH = 'C:/Users/taten/Documents/On_Active.xlsx';
  await workbook.xlsx.readFile(EXCEL_FILE_PATH);
  
  const sheet = workbook.getWorksheet('Products');
  const productsMap = new Map();
  let currentProduct = null;

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    // Read cells
    const rowName = row.getCell(1).value;
    const rowCategory = row.getCell(2).value;
    const rowGender = row.getCell(3).value;
    const rowPrice = row.getCell(4).value;
    const rowDescription = row.getCell(5).value;
    const rowSize = row.getCell(6).value;
    const rowColor = row.getCell(7).value;
    const rowQty = row.getCell(8).value;
    const rowFeatured = row.getCell(9).value;
    const rowTrending = row.getCell(10).value;

    // Determine if it's a new product or continuation
    if (rowName !== null && rowName !== undefined && String(rowName).trim() !== '') {
      const name = String(rowName).trim();
      const slug = generateSlug(name);
      
      if (!productsMap.has(slug)) {
        currentProduct = {
          name,
          slug,
          category: rowCategory ? String(rowCategory).trim() : null,
          gender: rowGender ? String(rowGender).trim() : 'All',
          price_usd: rowPrice ? parseFloat(rowPrice) : 0,
          description: rowDescription ? String(rowDescription).trim() : '',
          is_featured: String(rowFeatured).toLowerCase() === 'yes',
          is_trending: String(rowTrending).toLowerCase() === 'yes',
          variants: []
        };
        productsMap.set(slug, currentProduct);
      } else {
        currentProduct = productsMap.get(slug);
        // Fill in missing details if this row has them
        if (rowCategory && !currentProduct.category) currentProduct.category = String(rowCategory).trim();
        if (rowGender && (!currentProduct.gender || currentProduct.gender === 'All')) currentProduct.gender = String(rowGender).trim();
        if (rowPrice && !currentProduct.price_usd) currentProduct.price_usd = parseFloat(rowPrice);
        if (rowDescription && !currentProduct.description) currentProduct.description = String(rowDescription).trim();
        if (rowFeatured) currentProduct.is_featured = String(rowFeatured).toLowerCase() === 'yes';
        if (rowTrending) currentProduct.is_trending = String(rowTrending).toLowerCase() === 'yes';
      }
    }

    // If we have a current product, add the variant
    if (currentProduct) {
      // Clean size and color
      const size = rowSize ? String(rowSize).trim() : 'Standard';
      const color = rowColor ? String(rowColor).trim() : 'Standard';
      const stock = rowQty ? parseInt(rowQty, 10) : 0;
      const price = rowPrice ? parseFloat(rowPrice) : currentProduct.price_usd;

      currentProduct.variants.push({
        size,
        color,
        stock,
        price
      });
    }
  });

  let productsList = Array.from(productsMap.values());
  
  // Post-process to collect all unique sizes for each product's sizes array
  for (const prod of productsList) {
    const sizeSet = new Set();
    for (const v of prod.variants) {
      if (v.size && v.size !== 'Standard') {
        sizeSet.add(v.size);
      }
    }
    prod.sizes = Array.from(sizeSet);
  }

  // Filter to start from "Biker tights"
  const startIndex = productsList.findIndex(p => p.slug.includes('biker-tights'));
  if (startIndex !== -1) {
    productsList = productsList.slice(startIndex);
  }

  console.log(`Parsed ${productsList.length} valid products.`);
  fs.writeFileSync('scratch/parsed_products.json', JSON.stringify(productsList, null, 2));
  console.log('Saved to scratch/parsed_products.json');
}

main().catch(console.error);
