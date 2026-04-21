$files = Get-ChildItem -Path "server" -Recurse -Filter "*.js" | Where-Object { $_.FullName -notmatch "node_modules|coverage|\.git" }
$changedFiles = @()
foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw
        if ([string]::IsNullOrWhiteSpace($content)) { $lines = @() } else { $lines = $content -split '\r?\n' }
        $modified = $false
        $relPath = $file.FullName.Replace("C:\Git Projects\Voleena-Online-Ordering-System\", "")
        $codemapTag = "BACKEND_" + ($relPath.ToUpper() -replace '[^A-Z0-9]', '_')
        $firstIdx = -1
        for ($i=0; $i -lt $lines.Count; $i++) { if ($lines[$i].Trim() -ne "") { $firstIdx = $i; break } }
        if ($firstIdx -eq -1 -or -not $lines[$firstIdx].StartsWith("// CODEMAP:")) {
            $header = @("// CODEMAP: $codemapTag", "// PURPOSE: Backend module with request handling/business logic/data access.", "// SEARCH_HINT: Search by exported function name in this file.")
            if ($firstIdx -eq -1) { $lines = $header + $lines } else { $lines = $lines[0..($firstIdx-1)] + $header + $lines[$firstIdx..($lines.Count-1)] }
            $modified = $true
        }
        $newLines = @()
        for ($i=0; $i -lt $lines.Count; $i++) {
            $line = $lines[$i]
            if ($line -match '^(exports\.(?<name>\w+)\s*=\s*(async\s+)?\(|const\s+(?<name>\w+)\s*=\s*(async\s+)?\(|(async\s+)?function\s+(?<name>\w+)\s*\()') {
                $name = $Matches['name']; $prevComment = $false
                for ($j=$i-1; $j -ge 0; $j--) { if ($lines[$j].Trim() -ne "") { if ($lines[$j].Trim().StartsWith("//") -or $lines[$j].Trim().EndsWith("*/") -or $lines[$j].Trim().StartsWith("*")) { $prevComment = $true }; break } }
                if (-not $prevComment) { $newLines += "// Simple: This handles $name logic."; $modified = $true }
            }
            $newLines += $line
        }
        if ($modified) { 
            [IO.File]::WriteAllLines($file.FullName, $newLines, (New-Object System.Text.UTF8Encoding $false))
            $changedFiles += $file.FullName 
        }
    } catch { Write-Error "Error processing $($file.FullName): $_" }
}
Write-Host "Changed file count: $($changedFiles.Count)"; $changedFiles | % { Write-Host $_ }
$unresolved = @(); $files = Get-ChildItem -Path "server" -Recurse -Filter "*.js" | Where-Object { $_.FullName -notmatch "node_modules|coverage|\.git" }
foreach ($file in $files) {
    try { $lines = Get-Content $file.FullName } catch { continue }
    for ($i=0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '^(exports\.(?<name>\w+)\s*=\s*(async\s+)?\(|const\s+(?<name>\w+)\s*=\s*(async\s+)?\(|(async\s+)?function\s+(?<name>\w+)\s*\()') {
            $hasC = $false; for ($j=$i-1; $j -ge 0; $j--) { if ($lines[$j].Trim() -ne "") { if ($lines[$j].Trim().StartsWith("//") -or $lines[$j].Trim().EndsWith("*/") -or $lines[$j].Trim().StartsWith("*")) { $hasC = $true }; break } }
            if (-not $hasC) { $unresolved += "$($file.FullName):$($i+1)" }
        }
    }
}
Write-Host "Unresolved count: $($unresolved.Count)"; $unresolved | Select -First 20 | % { Write-Host $_ }
