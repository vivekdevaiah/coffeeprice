const pdf = require('pdf-parse');
console.log('Type:', typeof pdf);
console.log('Value:', pdf);
try {
    console.log('Is func?', typeof pdf === 'function');
} catch (e) { }

if (pdf.default) {
    console.log('Default:', pdf.default);
}
