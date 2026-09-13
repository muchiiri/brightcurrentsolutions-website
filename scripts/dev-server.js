/* Lightweight static file server for local previewing.
 * The shared footer (and any future fetch()-based includes) only works when
 * pages are loaded over http(s) — double-clicking an .html file opens it as
 * file://, which browsers block fetch() from reading local files under.
 * Run this, then open the printed URL in your browser, and everything
 * (footer include, contact form talking to send-quote.php if you have PHP
 * running separately, etc.) behaves the same as it will on a real host.
 */
const path = require("path");
const http = require("http");
const fs = require("fs");

const ROOT = path.resolve(__dirname, "..");
const PORT = process.env.PORT || 5500;

const MIME = {
  ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".json": "application/json",
  ".php": "text/plain" // no PHP interpreter here — see note below
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  const filePath = path.join(ROOT, urlPath);

  // Don't let requests escape the project folder.
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found: " + urlPath);
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log("");
  console.log("  BrightCurrent Solutions — local preview");
  console.log("  ---------------------------------------");
  console.log("  http://localhost:" + PORT);
  console.log("");
  console.log("  Open that in your browser instead of double-clicking the");
  console.log("  .html files — the shared footer (and the contact form,");
  console.log("  once you have PHP available) only work over http(s).");
  console.log("");
  console.log("  Press Ctrl+C to stop.");
  console.log("");
});
