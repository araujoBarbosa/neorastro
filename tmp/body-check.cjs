const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    const bodyText = await page.textContent('body');
    console.log('BODY:', bodyText && bodyText.trim());
    await browser.close();
})();
