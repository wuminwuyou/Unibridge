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
$sqlPath = Join-Path $scriptRoot "insert-test-data.sql"
if (-not (Test-Path $sqlPath)) {
    throw "insert-test-data.sql not found at: $sqlPath"
}

Write-Host "[1/3] Importing test data from insert-test-data.sql"
$sqlForMySql = $sqlPath.Replace('\', '/')
Invoke-MySql -Arguments @(
    "-h", $MySqlHost,
    "-P", "$MySqlPort",
    "-u", $MySqlUser,
    "-p$MySqlPassword",
    "--default-character-set=utf8mb4",
    $DatabaseName,
    "-e", "source $sqlForMySql"
)

Write-Host "[2/3] Verifying row counts"
$expectedCounts = @{
    entity                     = 3
    entity_profile             = 3
    user                       = 3
    user_profile               = 3
    user_auth_link             = 3
    team                       = 3
    team_member                = 3
    project                    = 3
    project_commercial_secret  = 3
    note                       = 10  # 10 条便于 Feed 换一换联调
    sys_credit_profiles        = 3
    sys_credit_logs            = 6
}

foreach ($entry in $expectedCounts.GetEnumerator() | Sort-Object Name) {
    $table = $entry.Key
    $expected = $entry.Value
    if ($table -eq "user") {
        $countSql = "SELECT COUNT(*) FROM ``user``;"
    } else {
        $countSql = "SELECT COUNT(*) FROM $table;"
    }
    $count = & $MySqlExe -h $MySqlHost -P $MySqlPort -u $MySqlUser "-p$MySqlPassword" -N -D $DatabaseName -e $countSql
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to query row count for $table."
    }
    Write-Host ("  {0,-28} {1} (expected {2})" -f $table, $count, $expected)
    if ([int]$count -ne $expected) {
        throw "Expected $expected rows in $table, got $count."
    }
}

Write-Host "[3/3] Test data import completed."
Write-Host ""
Write-Host "Database: $DatabaseName"
Write-Host "Test accounts (password SHA256 hash of '123456'):"
Write-Host "  user 1 student : 13800001001 / zhangming@test.com"
Write-Host "  user 2 mentor  : 13800001002 / limentor@test.com"
Write-Host "  user 3 pm      : 13800001003 / wangpm@tencent.com"
Write-Host ""
Write-Host "Tip: Run schema first if tables are missing:"
Write-Host "  .\init-db.ps1"
Write-Host "Then load test data:"
Write-Host '  .\insert-test-data.ps1 -MySqlPassword "<your_password>"'
