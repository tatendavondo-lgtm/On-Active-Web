const ExcelJS = require('exceljs');
const path = require('path');

async function createTemplate() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'On Active';
  
  // ── Main data sheet ──
  const ws = wb.addWorksheet('Products', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  // Column definitions
  ws.columns = [
    { header: 'Product Name', key: 'name', width: 30 },
    { header: 'Category', key: 'category', width: 18 },
    { header: 'Gender', key: 'gender', width: 12 },
    { header: 'Base Price (USD)', key: 'price', width: 18 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Size', key: 'size', width: 10 },
    { header: 'Color', key: 'color', width: 15 },
    { header: 'Quantity', key: 'quantity', width: 12 },
    { header: 'Featured', key: 'featured', width: 12 },
    { header: 'Trending', key: 'trending', width: 12 },
  ];

  // Style the header row
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A1A' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 30;

  // Dropdown lists
  const categories = '"Tops,Bottoms,Leggings,Sports Bras,Shorts,Accessories,Outerwear"';
  const genders = '"All,Men,Women"';
  const sizes = '"XS,S,M,L,XL,XXL,3XL,4XL"';
  const yesNo = '"Yes,No"';

  // Apply data validation (dropdowns) to 500 rows
  for (let row = 2; row <= 500; row++) {
    // Category dropdown (Column B)
    ws.getCell(`B${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [categories],
      showErrorMessage: true,
      errorTitle: 'Invalid Category',
      error: 'Please select from: Tops, Bottoms, Leggings, Sports Bras, Shorts, Accessories, Outerwear'
    };

    // Gender dropdown (Column C)
    ws.getCell(`C${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [genders],
      showErrorMessage: true,
      errorTitle: 'Invalid Gender',
      error: 'Please select from: All, Men, Women'
    };

    // Size dropdown (Column F)
    ws.getCell(`F${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [sizes],
      showErrorMessage: true,
      errorTitle: 'Invalid Size',
      error: 'Please select from: XS, S, M, L, XL, XXL, 3XL, 4XL'
    };

    // Featured dropdown (Column I)
    ws.getCell(`I${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [yesNo],
      showErrorMessage: true,
      errorTitle: 'Invalid Value',
      error: 'Please select Yes or No'
    };

    // Trending dropdown (Column J)
    ws.getCell(`J${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [yesNo],
      showErrorMessage: true,
      errorTitle: 'Invalid Value',
      error: 'Please select Yes or No'
    };

    // Price validation (Column D) — must be a number
    ws.getCell(`D${row}`).dataValidation = {
      type: 'decimal',
      operator: 'greaterThan',
      allowBlank: true,
      formulae: [0],
      showErrorMessage: true,
      errorTitle: 'Invalid Price',
      error: 'Price must be a number greater than 0 (e.g. 29.99)'
    };

    // Quantity validation (Column H) — must be a whole number
    ws.getCell(`H${row}`).dataValidation = {
      type: 'whole',
      operator: 'greaterThanOrEqual',
      allowBlank: true,
      formulae: [0],
      showErrorMessage: true,
      errorTitle: 'Invalid Quantity',
      error: 'Quantity must be a whole number (e.g. 10)'
    };

    // Alternate row shading
    if (row % 2 === 0) {
      for (let col = 1; col <= 10; col++) {
        ws.getCell(row, col).fill = {
          type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' }
        };
      }
    }
  }

  // Add 2 example rows
  const examples = [
    { name: 'Example T-Shirt', category: 'Tops', gender: 'All', price: 29.99, description: 'Premium cotton athletic tee', size: 'S', color: 'Black', quantity: 10, featured: 'Yes', trending: 'No' },
    { name: 'Example T-Shirt', category: 'Tops', gender: 'All', price: 29.99, description: '', size: 'S', color: 'White', quantity: 8, featured: 'Yes', trending: 'No' },
    { name: 'Example T-Shirt', category: 'Tops', gender: 'All', price: 29.99, description: '', size: 'M', color: 'Black', quantity: 15, featured: 'Yes', trending: 'No' },
    { name: 'Example T-Shirt', category: 'Tops', gender: 'All', price: 29.99, description: '', size: 'M', color: 'White', quantity: 12, featured: 'Yes', trending: 'No' },
  ];

  examples.forEach((ex, i) => {
    const row = ws.getRow(i + 2);
    row.values = [ex.name, ex.category, ex.gender, ex.price, ex.description, ex.size, ex.color, ex.quantity, ex.featured, ex.trending];
    row.font = { color: { argb: 'FF999999' }, italic: true };
  });

  // ── Instructions sheet ──
  const instrWs = wb.addWorksheet('Instructions');
  instrWs.columns = [{ width: 80 }];
  
  const instructions = [
    '📋 HOW TO FILL IN THIS TEMPLATE',
    '',
    '1. Each ROW = one SIZE + COLOR combination of a product.',
    '',
    '2. If a product comes in S, M, L and each has Black & White,',
    '   you need 6 rows (3 sizes × 2 colors) with the SAME product name.',
    '',
    '3. The DESCRIPTION only needs to be filled in on the FIRST row of each product.',
    '   Leave it blank on the other rows for that same product.',
    '',
    '4. Columns with dropdowns (click the cell to see the arrow):',
    '   • Category: Tops, Bottoms, Leggings, Sports Bras, Shorts, Accessories, Outerwear',
    '   • Gender: All, Men, Women',
    '   • Size: XS, S, M, L, XL, XXL, 3XL, 4XL',
    '   • Featured: Yes or No',
    '   • Trending: Yes or No',
    '',
    '5. DELETE the example rows (rows 2-5 on the Products sheet) before submitting.',
    '',
    '6. Price must be in USD (just the number, e.g. 29.99, not $29.99).',
    '',
    '7. Quantity = how many of that exact size + color you have in stock.',
  ];

  instructions.forEach((line, i) => {
    const row = instrWs.getRow(i + 1);
    row.values = [line];
    if (i === 0) {
      row.font = { bold: true, size: 14 };
    } else {
      row.font = { size: 11 };
    }
  });

  // Save
  const outputPath = path.join(__dirname, 'On_Active_Product_Template.xlsx');
  await wb.xlsx.writeFile(outputPath);
  console.log('Template saved to:', outputPath);
}

createTemplate().catch(console.error);
