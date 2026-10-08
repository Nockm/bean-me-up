# Windows PowerShell 5.1 or later. No Node.js or third-party modules needed.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$coffeeRoot = Join-Path $root 'coffees'
$destination = Join-Path $root 'coffees.json'
$temporary = Join-Path $root ('coffees-' + [guid]::NewGuid().ToString() + '.tmp')
try {
    $coffees = @(
        foreach ($folder in (Get-ChildItem -LiteralPath $coffeeRoot -Directory | Where-Object { -not $_.Name.StartsWith('.') } | Sort-Object Name)) {
            $images = @(
                Get-ChildItem -LiteralPath $folder.FullName -File |
                    Where-Object { -not $_.Name.StartsWith('.') -and $_.Extension -match '^\.(avif|gif|jpe?g|png|svg|webp)$' } |
                    Sort-Object Name |
                    ForEach-Object { 'coffees/' + [Uri]::EscapeDataString($folder.Name) + '/' + [Uri]::EscapeDataString($_.Name) }
            )
            if ($images.Count -gt 0) {
                [pscustomobject]@{ title = $folder.Name; images = $images }
            }
        }
    )
    $json = ConvertTo-Json -InputObject $coffees -Depth 5
    [IO.File]::WriteAllText($temporary, $json + [Environment]::NewLine, (New-Object Text.UTF8Encoding($false)))
    Move-Item -LiteralPath $temporary -Destination $destination -Force
    Write-Host ('Updated coffees.json: ' + $coffees.Count + ' available coffees.')
} catch {
    Write-Error $_
    exit 1
} finally {
    if (Test-Path -LiteralPath $temporary) { Remove-Item -LiteralPath $temporary -Force }
}
