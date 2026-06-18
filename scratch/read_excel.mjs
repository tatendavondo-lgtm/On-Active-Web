import ExcelJS from 'exceljs';

async function main() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('C:\\Users\\taten\\Documents\\On_Active_Products finnal.xlsx');
  
  workbook.eachSheet((sheet, id) => {
    console.log(`Sheet: ${sheet.name} (ID: ${id})`);
    console.log(`Total rows: ${sheet.rowCount}`);
    
    const rows = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 20) {
        rows.push({
          rowNumber,
          values: row.values.slice(1)
        });
      }
    });
    console.log(JSON.stringify(rows, null, 2));
  });
}

main().catch(console.error);
