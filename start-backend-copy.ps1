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

function Start-BackendProcess {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ProfileName
    )

    $args = @(
        "/c",
        "mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=$ProfileName"
    )

    $process = Start-Process -FilePath "cmd.exe" -ArgumentList $args -WorkingDirectory $projectRoot -PassThru
    Write-Host "Backend started. PID=$($process.Id)"
    return $process
}

function Stop-BackendProcessTree {
    param(
        [Parameter(Mandatory = $true)]
        [System.Diagnostics.Process]$Process
    )

    if (-not $Process.HasExited) {
        taskkill /PID $Process.Id /T /F | Out-Null
    }
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
Write-Host "Watching source changes for auto-restart."
Write-Host "Press Ctrl+C to stop."

$script:changePending = $false
$script:lastChangeTime = Get-Date
$debounceSeconds = 2
$watchers = @()
$eventNames = @()

try {
    $backendProcess = Start-BackendProcess -ProfileName $Profile

    $watchTargets = @(
        (Join-Path $projectRoot "src\main\java"),
        (Join-Path $projectRoot "src\main\resources")
    )

    foreach ($target in $watchTargets) {
        if (Test-Path $target) {
            $watcher = New-Object System.IO.FileSystemWatcher
            $watcher.Path = $target
            $watcher.Filter = "*.*"
            $watcher.IncludeSubdirectories = $true
            $watcher.EnableRaisingEvents = $true
            $watchers += $watcher

            foreach ($eventType in @("Changed", "Created", "Deleted", "Renamed")) {
                $eventName = "watch_${eventType}_$([guid]::NewGuid().ToString('N'))"
                $eventNames += $eventName
                Register-ObjectEvent -InputObject $watcher -EventName $eventType -SourceIdentifier $eventName -Action {
                    $script:changePending = $true
                    $script:lastChangeTime = Get-Date
                } | Out-Null
            }
        }
    }

    $pomPath = Join-Path $projectRoot "pom.xml"
    if (Test-Path $pomPath) {
        $pomWatcher = New-Object System.IO.FileSystemWatcher
        $pomWatcher.Path = $projectRoot
        $pomWatcher.Filter = "pom.xml"
        $pomWatcher.IncludeSubdirectories = $false
        $pomWatcher.EnableRaisingEvents = $true
        $watchers += $pomWatcher

        foreach ($eventType in @("Changed", "Created", "Deleted", "Renamed")) {
            $eventName = "watch_pom_${eventType}_$([guid]::NewGuid().ToString('N'))"
            $eventNames += $eventName
            Register-ObjectEvent -InputObject $pomWatcher -EventName $eventType -SourceIdentifier $eventName -Action {
                $script:changePending = $true
                $script:lastChangeTime = Get-Date
            } | Out-Null
        }
    }

    while ($true) {
        Start-Sleep -Seconds 1

        if ($backendProcess.HasExited) {
            throw "Backend process exited unexpectedly."
        }

        if ($script:changePending -and ((Get-Date) -gt $script:lastChangeTime.AddSeconds($debounceSeconds))) {
            $script:changePending = $false
            Write-Host "Change detected. Restarting backend..."

            Stop-BackendProcessTree -Process $backendProcess
            Start-Sleep -Seconds 1
            $backendProcess = Start-BackendProcess -ProfileName $Profile
        }
    }
}
finally {
    foreach ($name in $eventNames) {
        Unregister-Event -SourceIdentifier $name -ErrorAction SilentlyContinue
    }
    foreach ($watcher in $watchers) {
        $watcher.EnableRaisingEvents = $false
        $watcher.Dispose()
    }
    if ($null -ne $backendProcess -and -not $backendProcess.HasExited) {
        Stop-BackendProcessTree -Process $backendProcess
    }
}
