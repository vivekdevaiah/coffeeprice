const puppeteer = require('puppeteer');
// Final Poke for Automated Hosting Success
const pdf = require('pdf-extraction');
const fs = require('fs');
const path = require('path');

// Polyfills for PDF parsing in Node
if (!global.DOMMatrix) { global.DOMMatrix = class DOMMatrix { constructor() { this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0; } }; }
if (!global.DOMPoint) { global.DOMPoint = class DOMPoint { constructor(x = 0, y = 0, z = 0, w = 1) { this.x = x; this.y = y; this.z = z; this.w = w; } }; }
if (!global.ImageData) { global.ImageData = class ImageData { constructor(width, height) { this.width = width; this.height = height; this.data = new Uint8ClampedArray(width * height * 4); } }; }

async function scrape() {
    console.log('[Scraper] Starting...');
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        const downloadPath = path.resolve(__dirname, '../downloads');
        if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath);
        fs.readdirSync(downloadPath).forEach(f => fs.unlinkSync(path.join(downloadPath, f)));

        const client = await page.target().createCDPSession();
        await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadPath });

        console.log('[Scraper] Navigating to Coffee Board...');
        await page.goto('https://coffeeboard.gov.in/Market_Info.aspx', { waitUntil: 'networkidle0', timeout: 60000 });

        const selector = 'a[href*="lbnmarketinfo"]';
        await page.waitForSelector(selector, { timeout: 10000 });
        await page.click(selector);

        console.log('[Scraper] Waiting for download...');
        const filePath = await new Promise((resolve, reject) => {
            let attempts = 0;
            const interval = setInterval(() => {
                const files = fs.readdirSync(downloadPath);
                const pdfFile = files.find(f => f.toLowerCase().endsWith('.pdf'));
                if (pdfFile) {
                    clearInterval(interval);
                    setTimeout(() => resolve(path.join(downloadPath, pdfFile)), 5000);
                }
                if (++attempts > 40) { clearInterval(interval); reject(new Error('Download timeout')); }
            }, 1000);
        });

        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        const text = data.text;

        const dateMatch = text.match(/Raw\s*Coffee\s*Price\s*\(Karnataka\)\s*as\s*on\s*(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4})/i);
        const lastUpdated = dateMatch ? dateMatch[1] : (text.match(/as\s*on\s*(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4})/i)?.[1] || 'Unknown');

        const lines = text.split('\n');
        let pricesArr = [];
        for (const line of lines) {
            const numbers = line.match(/\d{4,5}/g);
            if (numbers && numbers.length >= 8 && parseInt(numbers[0]) > 20000) {
                pricesArr = numbers;
                break;
            }
        }

        const prices = [
            { id: 'arabica-parchment', name: 'Arabica Parchment', price: pricesArr.length >= 8 ? `₹ ${pricesArr[0]} - ${pricesArr[1]}` : 'N/A' },
            { id: 'arabica-cherry', name: 'Arabica Cherry', price: pricesArr.length >= 8 ? `₹ ${pricesArr[2]} - ${pricesArr[3]}` : 'N/A' },
            { id: 'robusta-parchment', name: 'Robusta Parchment', price: pricesArr.length >= 8 ? `₹ ${pricesArr[4]} - ${pricesArr[5]}` : 'N/A' },
            { id: 'robusta-cherry', name: 'Robusta Cherry', price: pricesArr.length >= 8 ? `₹ ${pricesArr[6]} - ${pricesArr[7]}` : 'N/A' }
        ];

        const result = {
            prices,
            lastUpdated,
            source: 'Coffee Board of India',
            fetchedAt: new Date().toISOString()
        };

        const outputPath = path.resolve(__dirname, '../public/prices.json');
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log('[Scraper] Success! saved to', outputPath);

        await browser.close();
    } catch (error) {
        console.error('[Scraper] Error:', error.message);
        if (browser) await browser.close();
        process.exit(1);
    }
}

scrape();
