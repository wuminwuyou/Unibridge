[CmdletBinding()]
param(
    [string]$MySqlHost = "localhost",
    [int]$MySqlPort = 3306,
    [string]$MySqlUser = "root",
    [string]$MySqlPassword = "111111",
    [string]$DatabaseName = "project_cooperation_platform",
    [string]$MySqlExe = "mysql"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Invoke-MySql {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    & $MySqlExe @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "mysql command failed with exit code $LASTEXITCODE."
    }
}

$mysqlCmd = Get-Command $MySqlExe -ErrorAction SilentlyContinue
if (-not $mysqlCmd) {
    throw "mysql client not found. Install MySQL client or pass -MySqlExe with full path."
}

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$dbSqlPath = Join-Path $scriptRoot "db.sql"
if (-not (Test-Path $dbSqlPath)) {
    throw "db.sql not found at: $dbSqlPath"
}

Write-Host "[1/4] Creating database if not exists: $DatabaseName"
Invoke-MySql -Arguments @(
    "-h", $MySqlHost,
    "-P", "$MySqlPort",
    "-u", $MySqlUser,
    "-p$MySqlPassword",
    "-e", "CREATE DATABASE IF NOT EXISTS $DatabaseName DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;"
)

Write-Host "[2/4] Importing schema and seed data from db.sql"
$dbSqlForMySql = $dbSqlPath.Replace('\', '/')
Invoke-MySql -Arguments @(
    "-h", $MySqlHost,
    "-P", "$MySqlPort",
    "-u", $MySqlUser,
    "-p$MySqlPassword",
    "--default-character-set=utf8mb4",
    $DatabaseName,
    "-e", "source $dbSqlForMySql"
)

Write-Host "[3/4] Verifying table count"
$tableCount = & $MySqlExe -h $MySqlHost -P $MySqlPort -u $MySqlUser "-p$MySqlPassword" -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DatabaseName';"
if ($LASTEXITCODE -ne 0) {
    throw "Failed to query table count."
}

Write-Host "[4/4] Verifying admin seed data"
$adminCount = & $MySqlExe -h $MySqlHost -P $MySqlPort -u $MySqlUser "-p$MySqlPassword" -N -D $DatabaseName -e "SELECT COUNT(*) FROM system_admin;"
if ($LASTEXITCODE -ne 0) {
    throw "Failed to query admin seed data."
}

Write-Host ""
Write-Host "Database initialization completed."
Write-Host "Database: $DatabaseName"
Write-Host "Total tables: $tableCount"
Write-Host "system_admin rows: $adminCount"
Write-Host ""
Write-Host "Tip: If password differs from application-dev.properties, pass it explicitly:"
Write-Host ".\init-db.ps1 -MySqlPassword '<your_password>'"
