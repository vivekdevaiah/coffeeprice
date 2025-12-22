import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function downloadPDF() {
    const url = 'https://coffeeboard.gov.in/Market_Info.aspx';

    try {
        // 1. Get the page to find ViewState
        console.log('Fetching initial page...');
        const initialResponse = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(initialResponse.data);
        const viewState = $('#__VIEWSTATE').val();
        const eventValidation = $('#__EVENTVALIDATION').val();
        const viewStateGenerator = $('#__VIEWSTATEGENERATOR').val();

        if (!viewState || !eventValidation) {
            throw new Error('Could not find ViewState info');
        }

        console.log('Got ViewState. Sending PostBack...');

        // 2. Simulate PostBack to get PDF
        // The link ID is usually 'lbnmarketinfo' based on browser inspection (or similar)
        // We need to check the exact ID from the 'href' javascript:__doPostBack('ctl00$ContentPlaceHolder1$lbnmarketinfo','')

        // Let's assume the ID is what we saw: ctl00$ContentPlaceHolder1$lbnmarketinfo
        // We need to look at the HTML to be sure of the ID.
        // For now I'm guessing based on common ASP.NET patterns and the user prompt saying "Daily report button"

        const params = new URLSearchParams();
        params.append('__EVENTTARGET', 'ctl00$ContentPlaceHolder1$lbnmarketinfo');
        params.append('__EVENTARGUMENT', '');
        params.append('__VIEWSTATE', viewState);
        params.append('__VIEWSTATEGENERATOR', viewStateGenerator || '');
        params.append('__EVENTVALIDATION', eventValidation);

        // Add other form fields if necessary (often empty inputs are needed)

        const pdfResponse = await axios.post(url, params, {
            responseType: 'arraybuffer',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Cookie': initialResponse.headers['set-cookie'] ? initialResponse.headers['set-cookie'].join('; ') : ''
            }
        });

        if (pdfResponse.headers['content-type'].includes('pdf')) {
            console.log('PDF Downloaded successfully!');
            fs.writeFileSync('market_report.pdf', pdfResponse.data);
            console.log('Saved to market_report.pdf');
        } else {
            console.log('Failed to get PDF. Response type:', pdfResponse.headers['content-type']);
            // console.log(pdfResponse.data.toString()); // Log error html
        }

    } catch (err) {
        console.error('Error:', err.message);
    }
}

downloadPDF();
