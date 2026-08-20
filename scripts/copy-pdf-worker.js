const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
const dst = path.join(__dirname, '../public/pdf.worker.min.mjs');

if (fs.existsSync(src)) {
  if (!fs.existsSync(dst)) {
    fs.copyFileSync(src, dst);
    console.log('✓ PDF.js worker file copied to public/');
  } else {
    console.log('✓ PDF.js worker file already in public/');
  }
} else {
  console.warn('⚠ PDF.js worker source not found at', src);
}
