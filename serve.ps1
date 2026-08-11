try {
  $root = "C:\Users\Max\OneDrive\Projets\PapaApp"
  $l = New-Object System.Net.HttpListener
  $l.Prefixes.Add("http://localhost:8080/")
  $l.Start()
  Write-Host "PapaApp: http://localhost:8080" -F Green
  Write-Host "Ctrl+C pour arreter" -F Yellow
  while($true){
    $c = $l.GetContext()
    $p = $c.Request.Url.LocalPath
    if($p -eq "/"){$p = "/index.html"}
    $f = $root + $p.Replace("/","\")
    Write-Host $p -F Gray
    if(Test-Path $f){
      $b = [IO.File]::ReadAllBytes($f)
      $c.Response.ContentLength64 = $b.Length
      $c.Response.OutputStream.Write($b,0,$b.Length)
    } else { $c.Response.StatusCode = 404 }
    $c.Response.Close()
  }
} catch {
  Write-Host "ERREUR: $_" -F Red
  Read-Host "Appuyez sur Entree"
}
