import { chromium } from 'playwright';

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

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
  await page.goto('https://www.onactive.shop/admin/login');
  
  console.log("Filling login...");
  await page.fill('input[type="email"]', 'samusibanda1@gmail.com');
  await page.fill('input[type="password"]', 'Keespace@1');
  
  console.log("Submitting login...");
  await Promise.all([
    page.waitForNavigation(),
    page.click('button[type="submit"]')
  ]);

  console.log("Navigating to staff page...");
  await page.goto('https://www.onactive.shop/admin/staff');

  console.log("Filling staff form...");
  const textInputs = await page.locator('input[type="text"]').all();
  await textInputs[0].fill('Test PW');
  
  await page.fill('input[type="email"]', 'testpw@gmail.com');
  
  await textInputs[1].fill('123456789');
  await textInputs[2].fill('8888');

  console.log("Clicking Add Staff Member...");
  await page.click('button:has-text("Add Staff Member")');

  console.log("Waiting for response...");
  await page.waitForTimeout(5000);
  
  await browser.close();
  console.log("Done.");
})();
