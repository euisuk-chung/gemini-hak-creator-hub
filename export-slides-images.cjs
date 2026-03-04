const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function exportSlidesToImages() {
    const htmlFile = path.join(__dirname, 'presentation_standalone.html');
    const outputDir = path.join(__dirname, 'slides');

    // Create output directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('Starting slide image export...');
    console.log('HTML file:', htmlFile);
    console.log('Output dir:', outputDir);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set viewport to 1920x1080 for high quality
    await page.setViewport({ width: 1920, height: 1080 });

    // Load the presentation
    const fileUrl = `file:///${htmlFile.replace(/\\/g, '/')}`;
    console.log('Loading:', fileUrl);

    await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 60000 });

    // Wait for reveal.js to initialize
    await page.waitForSelector('.reveal', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Inject CSS to ensure white background and full viewport coverage
    await page.addStyleTag({
        content: `
            html, body {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
            }
            .reveal {
                background: white !important;
            }
            .reveal .slides {
                background: white !important;
            }
            .reveal .slide-background {
                background: white !important;
            }
            .reveal .slides section {
                background: white !important;
            }
        `
    });

    // Get total number of slides
    const totalSlides = await page.evaluate(() => {
        return Reveal.getTotalSlides();
    });

    console.log(`Total slides: ${totalSlides}`);

    // Capture each slide
    for (let i = 0; i < totalSlides; i++) {
        // Navigate to slide
        await page.evaluate((index) => {
            Reveal.slide(index);
        }, i);

        // Wait for transition
        await new Promise(resolve => setTimeout(resolve, 500));

        // Take screenshot of full viewport
        const filename = `${i + 1}_slide.png`;
        const filepath = path.join(outputDir, filename);

        await page.screenshot({
            path: filepath,
            clip: {
                x: 0,
                y: 0,
                width: 1920,
                height: 1080
            }
        });

        console.log(`Captured: ${filename}`);
    }

    await browser.close();
    console.log(`\nDone! ${totalSlides} images saved to: ${outputDir}`);
}

exportSlidesToImages().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
