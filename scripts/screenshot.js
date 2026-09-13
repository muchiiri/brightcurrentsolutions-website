/* Dev-only QA script: serves the site locally and screenshots every page
 * at desktop + mobile widths (plus a couple of interactive states) using
 * Playwright. Not part of the production site. Run with: npm run screenshot
 */
const path = require("path");
const http = require("http");
const fs = require("fs");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, ".screenshots");
const PORT = 4173;

const MIME = {
  ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".json": "application/json"
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent(req.url.split("?")[0]);
      if (urlPath === "/") urlPath = "/index.html";
      const filePath = path.join(ROOT, urlPath);
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end("Not found"); return; }
        const ext = path.extname(filePath);
        res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
        res.end(data);
      });
    });
    server.listen(PORT, () => resolve(server));
  });
}

const PAGES = ["index.html", "about.html", "services.html", "contact.html", "products.html", "work.html", "404.html"];
const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 }
};

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);
  const server = await startServer();
  const browser = await chromium.launch();

  for (const viewportName of Object.keys(VIEWPORTS)) {
    const context = await browser.newContext({ viewport: VIEWPORTS[viewportName] });
    const page = await context.newPage();
    for (const pageName of PAGES) {
      await page.goto(`http://localhost:${PORT}/${pageName}`, { waitUntil: "networkidle" });
      const base = pageName.replace(".html", "");
      await page.screenshot({ path: path.join(OUT_DIR, `${base}--${viewportName}.png`), fullPage: true });
      console.log(`captured ${base} @ ${viewportName}`);
    }
    await context.close();
  }

  // Interactive states
  const context = await browser.newContext({ viewport: VIEWPORTS.mobile });
  const page = await context.newPage();
  await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: "networkidle" });
  await page.click("[data-nav-toggle]");
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(OUT_DIR, "index--mobile-menu-open.png") });
  console.log("captured index mobile menu open state");
  await context.close();

  const context2 = await browser.newContext({ viewport: VIEWPORTS.desktop });
  const page2 = await context2.newPage();
  await page2.goto(`http://localhost:${PORT}/services.html`, { waitUntil: "networkidle" });
  await page2.click("#service-1 [data-accordion-trigger]");
  await page2.waitForTimeout(350);
  await page2.screenshot({ path: path.join(OUT_DIR, "services--service-1-expanded.png") });
  console.log("captured services with service-1 expanded");
  await context2.close();

  const context3 = await browser.newContext({ viewport: VIEWPORTS.desktop });
  const page3 = await context3.newPage();
  await page3.goto(`http://localhost:${PORT}/contact.html`, { waitUntil: "networkidle" });
  await page3.click(".faq-item:first-child [data-accordion-trigger]");
  await page3.waitForTimeout(350);
  await page3.locator("#faq").scrollIntoViewIfNeeded();
  await page3.screenshot({ path: path.join(OUT_DIR, "contact--faq-open.png") });
  console.log("captured contact with FAQ open");
  await context3.close();

  await browser.close();
  server.close();
  console.log("Done. Screenshots in .screenshots/");
})();
