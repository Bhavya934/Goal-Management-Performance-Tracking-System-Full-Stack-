$src = 'c:\Users\bhavy\Downloads\Atom_Quest'
$dest = 'c:\Users\bhavy\Downloads\AtomQuest_Goals_Final.zip'

Remove-Item $dest -Force -ErrorAction SilentlyContinue

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($dest, 'Create')

$excludeDirs = @('.next', 'node_modules', '.git')

Get-ChildItem $src -Recurse -Force | Where-Object {
    $rel = $_.FullName.Substring($src.Length + 1)
    $skip = $false
    foreach ($d in $excludeDirs) {
        if ($rel.StartsWith("$d\") -or $rel -eq $d) {
            $skip = $true
            break
        }
    }
    (-not $skip) -and (-not $_.PSIsContainer)
} | ForEach-Object {
    $entry = $_.FullName.Substring($src.Length + 1)
    try {
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $entry, 'Optimal') | Out-Null
    } catch {
        # Skip locked files
    }
}

$zip.Dispose()
$size = [math]::Round((Get-Item $dest).Length / 1MB, 2)
Write-Host "ZIP created successfully at: $dest ($size MB)"
