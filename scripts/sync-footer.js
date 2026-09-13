/* Bakes partials/footer.html into every page as static markup.
 *
 * Why: a runtime fetch() of the footer partial only works when a page is
 * served over http(s). Opening a page directly (file://) — which is how
 * people naturally preview a static site by double-clicking it — silently
 * fails that fetch in every major browser, leaving the footer empty. That's
 * not an edge case here, it's the normal way this project gets opened.
 *
 * So instead: partials/footer.html stays the single source of truth for
 * editing, but this script writes its current contents into every page as
 * real static HTML. Pages work identically whether opened via file://, a
 * local server, or a real host — no fetch, no failure mode.
 *
 * Usage: whenever you change partials/footer.html, run:
 *   npm run sync-footer
 * It's idempotent — safe to run as many times as you like.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PARTIAL_PATH = path.join(ROOT, "partials", "footer.html");
const PAGES = ["index.html", "about.html", "services.html", "contact.html", "products.html", "work.html", "404.html"];

const footerHtml = fs.readFileSync(PARTIAL_PATH, "utf8").trim();

// Matches either the placeholder div (first run) or a previously-synced
// <footer class="site-footer">...</footer> block (subsequent runs).
const PLACEHOLDER_RE = /<div id="site-footer"><\/div>/;
const EXISTING_FOOTER_RE = /<footer class="site-footer">[\s\S]*?<\/footer>/;

let changed = 0;
let skipped = [];

PAGES.forEach((page) => {
  const filePath = path.join(ROOT, page);
  if (!fs.existsSync(filePath)) {
    skipped.push(page + " (file not found)");
    return;
  }
  const html = fs.readFileSync(filePath, "utf8");
  let updated = null;

  if (PLACEHOLDER_RE.test(html)) {
    updated = html.replace(PLACEHOLDER_RE, footerHtml);
  } else if (EXISTING_FOOTER_RE.test(html)) {
    updated = html.replace(EXISTING_FOOTER_RE, footerHtml);
  } else {
    skipped.push(page + " (no placeholder or existing footer found)");
    return;
  }

  fs.writeFileSync(filePath, updated, "utf8");
  changed++;
  console.log("synced footer ->", page);
});

console.log("");
console.log(changed + " page(s) updated.");
if (skipped.length) {
  console.log("Skipped:");
  skipped.forEach((s) => console.log("  - " + s));
}
