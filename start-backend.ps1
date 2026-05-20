[CmdletBinding()]
param(
    [ValidateSet("dev", "prod")]
    [string]$Profile = "dev",
    [switch]$SkipTests = $true
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-JavaMajorVersion {
    $previousErrorAction = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $javaOutput = & java -version 2>&1
    $javaExitCode = $LASTEXITCODE
    $ErrorActionPreference = $previousErrorAction

    if ($javaExitCode -ne 0) {
        throw "Java is not available in PATH."
    }

    $firstLine = "$($javaOutput | Select-Object -First 1)"
    $match = [regex]::Match($firstLine, '"(\d+)')
    if (-not $match.Success) {
        throw "Unable to parse Java version from: $firstLine"
    }

    return [int]$match.Groups[1].Value
}

function Get-ConfiguredServerPort {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ProjectRoot
    )

    $appPropsPath = Join-Path $ProjectRoot "src\main\resources\application.properties"
    if (-not (Test-Path $appPropsPath)) {
        return 8081
    }

    foreach ($line in Get-Content $appPropsPath) {
        if ($line -match "^\s*server\.port\s*=\s*(\d+)\s*$") {
            return [int]$Matches[1]
        }
    }

    return 8081
}

function Test-PortListening {
    param(
        [Parameter(Mandatory = $true)]
        [int]$Port
    )

    $result = netstat -ano | Select-String ":$Port\s+.*LISTENING"
    return $null -ne $result
}

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

if (-not (Test-Path ".\mvnw.cmd")) {
    throw "mvnw.cmd not found. Run this script from project root."
}

Write-Host "[1/5] Checking Java version"
$javaMajor = Get-JavaMajorVersion
if ($javaMajor -lt 21) {
    throw "Java $javaMajor detected. This project requires Java 21+ (pom.xml: <java.version>21)."
}

Write-Host "[2/5] Checking configured server port"
$serverPort = Get-ConfiguredServerPort -ProjectRoot $projectRoot
if (Test-PortListening -Port $serverPort) {
    throw "Port $serverPort is already in use. Stop the process or change server.port."
}

Write-Host "[3/5] Verifying Maven Wrapper"
& .\mvnw.cmd -v
if ($LASTEXITCODE -ne 0) {
    throw "Maven Wrapper check failed."
}

Write-Host "[4/5] Compiling project"
$compileArgs = @("-q")
if ($SkipTests) {
    $compileArgs += "-DskipTests"
}
$compileArgs += "compile"
& .\mvnw.cmd @compileArgs
if ($LASTEXITCODE -ne 0) {
    throw "Project compilation failed."
}

Write-Host "[5/5] Starting backend with profile: $Profile"
Write-Host "Press Ctrl+C to stop the service."
& .\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=$Profile"
