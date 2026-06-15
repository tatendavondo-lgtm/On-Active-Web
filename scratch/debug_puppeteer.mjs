import puppeteer from 'puppeteer';

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({ 
    headless: 'new',
    executablePath: "C:\\Users\\taten\\.cache\\puppeteer\\chrome\\win64-149.0.7827.22\\chrome-win64\\chrome.exe"
  });
  const page = await browser.newPage();
  
  // Intercept responses to catch the 500
  page.on('response', async (response) => {
    if (response.request().method() === 'POST' && response.url().includes('/admin/staff')) {
      console.log(`\n\n[RESPONSE intercepted] Status: ${response.status()}`);
      try {
        const text = await response.text();
        console.log("Response Body:", text);
      } catch (e) {
        console.log("Could not read body:", e);
      }
    }
  });

  console.log("Navigating to login...");
  await page.goto('https://www.onactive.shop/admin/login', { waitUntil: 'networkidle2' });
  
  console.log("Filling login...");
  await page.type('input[type="email"]', 'samusibanda1@gmail.com');
  await page.type('input[type="password"]', 'Keespace@1');
  
  console.log("Submitting login...");
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]')
  ]);

  console.log("Navigating to staff page...");
  await page.goto('https://www.onactive.shop/admin/staff', { waitUntil: 'networkidle2' });

  console.log("Filling staff form...");
  // Full Name is the first text input
  const inputs = await page.$$('input[type="text"]');
  await inputs[0].type('Test Puppeteer'); // Full name
  
  // Email
  await page.type('input[type="email"]', 'testpuppeteer@gmail.com');
  
  // Phone
  await inputs[1].type('123456789');
  
  // PIN - last text input
  await inputs[2].type('9999');

  console.log("Clicking Add Staff Member...");
  // Find the button with text "Add Staff Member"
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Add Staff Member')) {
      await btn.click();
      break;
    }
  }

  console.log("Waiting for network to settle...");
  await new Promise(r => setTimeout(r, 5000));
  
  await browser.close();
  console.log("Done.");
})();
