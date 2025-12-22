// Polyfill for pdf-parse/pdfjs-dist in Node 20+
// Heavily mocked to satisfy pdf.js requirements in node env
if (!global.DOMMatrix) {
    global.DOMMatrix = class DOMMatrix {
        constructor() { this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0; }
    };
}
if (!global.DOMPoint) {
    global.DOMPoint = class DOMPoint {
        constructor(x = 0, y = 0, z = 0, w = 1) { this.x = x; this.y = y; this.z = z; this.w = w; }
    };
}
// Stub ImageData if needed (though some checks might just warn)
if (!global.ImageData) {
    global.ImageData = class ImageData {
        constructor(width, height) { this.width = width; this.height = height; this.data = new Uint8ClampedArray(width * height * 4); }
    };
}

const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const pdf = require('pdf-extraction');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());

app.get('/api/prices', async (req, res) => {
    console.log('[Puppeteer] Received request. Launching browser...');
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Setup download path
        const downloadPath = path.resolve(__dirname, 'downloads');
        if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath);

        // Clear previous downloads
        fs.readdirSync(downloadPath).forEach(f => fs.unlinkSync(path.join(downloadPath, f)));

        const client = await page.target().createCDPSession();
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadPath,
        });

        console.log('[Puppeteer] Navigating to Coffee Board...');
        // Increase timeout for slow government site
        await page.goto('https://coffeeboard.gov.in/Market_Info.aspx', { waitUntil: 'networkidle0', timeout: 60000 });

        const selector = 'a[href*="lbnmarketinfo"]';
        // Wait for the PDF link
        await page.waitForSelector(selector, { timeout: 10000 });

        console.log('[Puppeteer] Clicking PDF link...');
        await page.click(selector);

        // Wait for download
        console.log('[Puppeteer] Waiting for download...');
        const waitForFile = () => new Promise((resolve, reject) => {
            let attempts = 0;
            const interval = setInterval(() => {
                const files = fs.readdirSync(downloadPath);
                const pdfFile = files.find(f => f.toLowerCase().endsWith('.pdf'));
                if (pdfFile) {
                    clearInterval(interval);
                    // Wait for download to finish (check size stable or no crdownload)
                    // Simple wait
                    setTimeout(() => resolve(path.join(downloadPath, pdfFile)), 2000);
                }
                attempts++;
                if (attempts > 30) { // 30 seconds
                    clearInterval(interval);
                    reject(new Error('Download timeout'));
                }
            }, 1000);
        });

        const filePath = await waitForFile();
        console.log('[Puppeteer] Downloaded:', filePath);

        // Parse PDF
        const dataBuffer = fs.readFileSync(filePath);
        let parseFunc = pdf;
        if (typeof pdf !== 'function' && typeof pdf.default === 'function') {
            parseFunc = pdf.default;
        }

        const data = await parseFunc(dataBuffer);
        const text = data.text;

        // Extract Data
        const dateMatch = text.match(/Raw\s*Coffee\s*Price\s*\(Karnataka\)\s*as\s*on\s*(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4})/i);
        const lastUpdated = dateMatch ? dateMatch[1] : (text.match(/as\s*on\s*(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4})/i)?.[1] || 'Unknown Date');

        const lines = text.split('\n');
        let pricesArr = [];

        for (const line of lines) {
            const numbers = line.match(/\d{4,5}/g);
            if (numbers && numbers.length >= 8) {
                if (parseInt(numbers[0]) > 20000) {
                    pricesArr = numbers;
                    break;
                }
            }
        }

        const prices = [];
        if (pricesArr.length >= 8) {
            prices.push({ id: 'arabica-parchment', name: 'Arabica Parchment', price: `₹ ${pricesArr[0]} - ${pricesArr[1]}` });
            prices.push({ id: 'arabica-cherry', name: 'Arabica Cherry', price: `₹ ${pricesArr[2]} - ${pricesArr[3]}` });
            prices.push({ id: 'robusta-parchment', name: 'Robusta Parchment', price: `₹ ${pricesArr[4]} - ${pricesArr[5]}` });
            prices.push({ id: 'robusta-cherry', name: 'Robusta Cherry', price: `₹ ${pricesArr[6]} - ${pricesArr[7]}` });
        } else {
            prices.push({ id: 'arabica-parchment', name: 'Arabica Parchment', price: 'N/A' });
            prices.push({ id: 'arabica-cherry', name: 'Arabica Cherry', price: 'N/A' });
            prices.push({ id: 'robusta-parchment', name: 'Robusta Parchment', price: 'N/A' });
            prices.push({ id: 'robusta-cherry', name: 'Robusta Cherry', price: 'N/A' });
        }

        await browser.close();

        res.json({
            prices,
            lastUpdated,
            source: 'Coffee Board of India (Daily Report PDF)',
            note: 'Live Data via Puppeteer'
        });

    } catch (error) {
        console.error('[Puppeteer] Error:', error.message);
        if (browser) await browser.close();
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
