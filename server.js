const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DIST_PATH = path.join(__dirname, 'dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.woff2': 'application/font-woff2'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(DIST_PATH, req.url === '/' ? 'index.html' : req.url);
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // اگر فایل پیدا نشد، index.html را برگردان (برای SPA)
        fs.readFile(path.join(DIST_PATH, 'index.html'), (err, content) => {
          if (err) {
            res.writeHead(500);
            res.end('Error loading application');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end('Error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': mimeType });
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
  const platform = process.platform;
  if (platform === 'win32') {
    exec(`start http://localhost:${PORT}`);
  } else if (platform === 'darwin') {
    exec(`open http://localhost:${PORT}`);
  } else {
    exec(`xdg-open http://localhost:${PORT}`);
  }
});
