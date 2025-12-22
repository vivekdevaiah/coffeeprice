import axios from 'axios';

// 1. Primary: Try fetching the static prices.json (updated by GitHub Actions)
// 2. Secondary: Try fetching from the local dev server (if running)
// 3. Last: Use hardcoded fallback
const STATIC_URL = 'prices.json';
const DEV_URL = 'http://localhost:3001/api/prices';

export const fetchCoffeePrices = async () => {
    // Try Static File First (Production Mode)
    try {
        console.log(`Attempting fetch via ${STATIC_URL}...`);
        const response = await axios.get(STATIC_URL);
        if (response.data && response.data.prices) {
            return response.data;
        }
    } catch (e) {
        console.log("Static file not found or error, trying dev server...");
    }

    // Try Dev Server Second
    try {
        console.log(`Attempting fetch via ${DEV_URL}...`);
        const response = await axios.get(DEV_URL);
        if (response.data && response.data.prices) {
            return response.data;
        }
    } catch (error) {
        console.warn(`All network fetches failed. Using fallback data.`);
        return {
            prices: [
                { name: "Robusta Cherry", price: "₹ 10,300 - 10,500", id: "robusta-cherry" },
                { name: "Robusta Parchment", price: "₹ 16,500 - 17,500", id: "robusta-parchment" },
                { name: "Arabica Cherry", price: "₹ 14,300 - 14,600", id: "arabica-cherry" },
                { name: "Arabica Parchment", price: "₹ 28,200 - 28,800", id: "arabica-parchment" }
            ],
            lastUpdated: "Service Interrupted (Cached)",
            isFallback: true
        };
    }
};
