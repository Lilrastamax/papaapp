$port = 8080
$root = Resolve-Path "$PSScriptRoot"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://+:$port/")
$listener.Start()

$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.PrefixOrigin -ne 'WellKnown' -and $_.IPAddress -ne '127.0.0.1'}).IPAddress | Select-Object -First 1

$mimeTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".js" = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".png" = "image/png"
  ".svg" = "image/svg+xml"
}

Write-Host "PapaApp dispo sur:" -ForegroundColor Green
Write-Host "  http://localhost:$port" -ForegroundColor Cyan
Write-Host "  http://${ip}:$port  (iPhone)" -ForegroundColor Cyan
Write-Host "Ctrl+C pour arreter" -ForegroundColor Yellow

while ($true) {
  $context = $listener.GetContext()
  $request = $context.Request
  $response = $context.Response
  $path = $request.Url.LocalPath
  if ($path -eq "/") { $path = "/index.html" }
  $filePath = Join-Path $root $path.TrimStart("/")
  if (Test-Path -Path $filePath -PathType Leaf) {
    $ext = [IO.Path]::GetExtension($filePath)
    $mime = $mimeTypes[$ext]
    if (-not $mime) { $mime = "application/octet-stream" }
    $bytes = [IO.File]::ReadAllBytes($filePath)
    $response.ContentType = $mime
    $response.ContentLength64 = $bytes.Length
    $response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $response.StatusCode = 404
  }
  $response.Close()
}
