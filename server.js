const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const DIST_PATH = path.join(__dirname, 'dist');

console.log('Server starting...');
console.log('Serving files from:', DIST_PATH);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let filePath = path.join(DIST_PATH, req.url === '/' ? 'index.html' : req.url);
  
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // اگر فایل پیدا نشد، index.html را برگردان (برای SPA)
        fs.readFile(path.join(DIST_PATH, 'index.html'), (err2, content2) => {
          if (err2) {
            res.writeHead(500);
            res.end('Error loading application');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(content2, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end('Error loading application');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('========================================');
  console.log('  TechnoKala Accounting System');
  console.log('========================================');
  console.log('');
  console.log(`  Server running at: http://localhost:${PORT}`);
  console.log('');
  console.log('  Opening browser...');
  console.log('');
  console.log('  To stop: Press Ctrl+C');
  console.log('');
  
  // باز کردن مرورگر
  const { exec } = require('child_process');
  exec(`start http://localhost:${PORT}`);
});
