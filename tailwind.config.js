/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                coffee: {
                    50: '#fdf8f6',
                    100: '#f2e8e5',
                    200: '#eaddd7',
                    300: '#e0cec7',
                    400: '#d2bab0',
                    500: '#a77f5d',
                    600: '#8c6b4e',
                    700: '#73573f',
                    800: '#5a4330',
                    900: '#423022',
                    950: '#1a120b'
                },
                accent: {
                    gold: '#D4AF37',
                    amber: '#FFBF00'
                }
            }
        },
    },
    plugins: [],
}
