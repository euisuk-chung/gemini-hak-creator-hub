const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function exportSlidesToPDF() {
    const htmlFile = path.join(__dirname, 'presentation_standalone.html');
    const outputPdf = path.join(__dirname, 'presentation_slides.pdf');

    console.log('Starting PDF export...');
    console.log('HTML file:', htmlFile);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set viewport to 1920x1080 for high quality
    await page.setViewport({ width: 1920, height: 1080 });

    // Load the presentation with print-pdf mode
    const fileUrl = `file:///${htmlFile.replace(/\\/g, '/')}?print-pdf`;
    console.log('Loading:', fileUrl);

    await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 60000 });

    // Wait for reveal.js to initialize
    await page.waitForSelector('.reveal', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Export to PDF
    await page.pdf({
        path: outputPdf,
        width: '1920px',
        height: '1080px',
        printBackground: true,
        preferCSSPageSize: true
    });

    console.log('PDF exported to:', outputPdf);

    await browser.close();
    console.log('Done!');
}

exportSlidesToPDF().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
