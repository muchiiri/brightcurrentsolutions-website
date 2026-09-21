/* Bakes the shared navbar into every static page so file:// previews work.
 * Edit partials/navbar.html, then run: npm run sync-navbar
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PAGES = ["index.html", "about.html", "services.html", "contact.html", "products.html", "work.html", "404.html"];
const navbar = fs.readFileSync(path.join(ROOT, "partials", "navbar.html"), "utf8").trim();
const rendered = `<!-- navbar:start -->\n${navbar}\n<!-- navbar:end -->`;

const GENERATED_RE = /<!-- navbar:start -->[\s\S]*?<!-- navbar:end -->/g;
const LEGACY_RE = /<header class="site-header">[\s\S]*?<\/header>(?:\s*<div class="mobile-nav" id="mobile-nav" data-mobile-nav>\s*<div class="container">[\s\S]*?<\/div>\s*<\/div>)?/g;

// Validate every page before writing any, so a changed layout cannot leave
// only some pages updated.
const updates = PAGES.map((page) => {
  const filePath = path.join(ROOT, page);
  const html = fs.readFileSync(filePath, "utf8");
  const generated = [...html.matchAll(GENERATED_RE)];
  const matches = generated.length ? generated : [...html.matchAll(LEGACY_RE)];
  if (matches.length !== 1) {
    throw new Error(`${page}: expected exactly one navbar, found ${matches.length}`);
  }
  const pattern = generated.length ? GENERATED_RE : LEGACY_RE;
  return { page, filePath, html: html.replace(pattern, () => rendered) };
});

for (const { page, filePath, html } of updates) {
  if (fs.readFileSync(filePath, "utf8") !== html) {
    fs.writeFileSync(filePath, html, "utf8");
    console.log("synced navbar ->", page);
  }
}
