param(
  [string]$BackupDir = ".\backups",
  [string]$DbName = "photovault",
  [string]$DbUser = "photovault",
  [string]$DbHost = "localhost",
  [string]$UploadPath = ".\uploads",
  [string]$LogPath = ".\logs"
)

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = Join-Path $BackupDir $timestamp

Write-Host "Creating backup in $backupPath..." -ForegroundColor Green

New-Item -ItemType Directory -Path $backupPath -Force | Out-Null

Write-Host "Dumping database..." -ForegroundColor Yellow
$dumpFile = Join-Path $backupPath "database.sql"
$env:PGPASSWORD = "photovault"
& pg_dump -h $DbHost -U $DbUser -d $DbName -F c -f $dumpFile
if ($LASTEXITCODE -ne 0) {
  Write-Host "Database dump failed!" -ForegroundColor Red
  exit 1
}

Write-Host "Backing up uploads..." -ForegroundColor Yellow
$uploadsBackup = Join-Path $backupPath "uploads"
Copy-Item -Path $UploadPath -Destination $uploadsBackup -Recurse -Force

Write-Host "Backing up logs..." -ForegroundColor Yellow
$logsBackup = Join-Path $backupPath "logs"
Copy-Item -Path $LogPath -Destination $logsBackup -Recurse -Force

Compress-Archive -Path "$backupPath\*" -DestinationPath "$backupPath.zip" -Force
Remove-Item -Path $backupPath -Recurse -Force

Write-Host "Backup completed: $backupPath.zip" -ForegroundColor Green
