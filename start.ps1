# Store Accounting - Simple PowerShell Server
# Works on Windows 10/11 without installing anything

$port = 8000
$distPath = Join-Path $PSScriptRoot "dist"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Store Accounting Server" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check if dist folder exists
if (-not (Test-Path $distPath)) {
    Write-Host "[ERROR] dist folder not found!" -ForegroundColor Red
    Write-Host "Please run: npm run build" -ForegroundColor Yellow
    pause
    exit
}

Write-Host "Starting server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Open in browser: http://localhost:$port" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop: Close this window" -ForegroundColor Gray
Write-Host ""

# Open browser
Start-Process "http://localhost:$port"

# Simple HTTP server using .NET
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "Server is running!" -ForegroundColor Green
Write-Host ""

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    
    $urlPath = $request.Url.LocalPath
    if ($urlPath -eq "/") { $urlPath = "/index.html" }
    
    $filePath = Join-Path $distPath $urlPath.TrimStart("/").Replace("/", "\")
    
    if (Test-Path $filePath -PathType Leaf) {
        $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
        
        $contentType = switch ($extension) {
            ".html" { "text/html; charset=utf-8" }
            ".css"  { "text/css; charset=utf-8" }
            ".js"   { "application/javascript; charset=utf-8" }
            ".json" { "application/json; charset=utf-8" }
            ".png"  { "image/png" }
            ".jpg"  { "image/jpeg" }
            ".jpeg" { "image/jpeg" }
            ".gif"  { "image/gif" }
            ".svg"  { "image/svg+xml" }
            ".ico"  { "image/x-icon" }
            default { "application/octet-stream" }
        }
        
        try {
            $content = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $contentType
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
        } catch {
            $response.StatusCode = 500
        }
    } else {
        $response.StatusCode = 404
        $errorMsg = "404 - File not found: $urlPath"
        $errorBytes = [System.Text.Encoding]::UTF8.GetBytes($errorMsg)
        $response.ContentType = "text/plain; charset=utf-8"
        $response.ContentLength64 = $errorBytes.Length
        $response.OutputStream.Write($errorBytes, 0, $errorBytes.Length)
    }
    
    $response.Close()
}
