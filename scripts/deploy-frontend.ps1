<#
.SYNOPSIS
    Zero-downtime production deploy for the Alfa frontend.

.DESCRIPTION
    Builds a new standalone release in an isolated build directory, starts it
    on the idle color (blue :3000 / green :3001), health-checks it, then
    switches the Nginx upstream gracefully. The previous color keeps serving
    until the new one is healthy, so the site never goes down.

    Backend deployment is intentionally NOT part of this script.

.PARAMETER Rollback
    Skip build/push and flip Nginx back to the previous color.

.EXAMPLE
    .\scripts\deploy-frontend.ps1

.EXAMPLE
    .\scripts\deploy-frontend.ps1 -Rollback
#>
[CmdletBinding()]
param(
    [string]$SshHost = "209.50.228.90",
    [string]$SshUser = "root",
    [string]$RemotePath = "/home/alfa-project/alfa-ecommerce",
    [string]$Branch = "main",
    [string]$PasswordFile = (Join-Path $env:TEMP "opencode\ssh_pass.txt"),
    [string]$KeyFile = (Join-Path $HOME ".ssh\alfa_deploy"),
    [switch]$SkipPush,
    [switch]$Force,
    [switch]$Rollback
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$Message) {
    Write-Host ("[{0}] {1}" -f (Get-Date -Format "HH:mm:ss"), $Message) -ForegroundColor Cyan
}

function Fail([string]$Message) {
    Write-Host "ERROR: $Message" -ForegroundColor Red
    exit 1
}

$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

$git = (Get-Command git -ErrorAction SilentlyContinue).Source
if (-not $git) { Fail "git was not found in PATH." }
$ssh = (Get-Command ssh -ErrorAction SilentlyContinue).Source
if (-not $ssh) { Fail "ssh was not found in PATH." }

# ---------------------------------------------------------------- local checks
if (-not $Rollback) {
    $currentBranch = (& $git rev-parse --abbrev-ref HEAD).Trim()
    if ($currentBranch -ne $Branch) {
        Fail "You are on '$currentBranch'. Switch to '$Branch' before deploying."
    }

    $dirty = @(& $git status --porcelain)
    if ($dirty.Count -gt 0 -and -not $Force) {
        Write-Host "Uncommitted changes:" -ForegroundColor Yellow
        $dirty | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
        Fail "Commit/stash them first, or rerun with -Force."
    }

    Write-Step "Fetching origin/$Branch..."
    & $git fetch origin $Branch --quiet
    if ($LASTEXITCODE -ne 0) { Fail "git fetch failed." }

    $localHead = (& $git rev-parse HEAD).Trim()
    $remoteHead = (& $git rev-parse "origin/$Branch").Trim()

    if ($localHead -ne $remoteHead) {
        $ahead = [int](& $git rev-list --count "origin/$Branch..HEAD")
        $behind = [int](& $git rev-list --count "HEAD..origin/$Branch")

        if ($behind -gt 0) {
            Fail "Local is behind origin/$Branch by $behind commit(s). Pull/rebase first."
        }
        if ($SkipPush) {
            Fail "There are $ahead unpushed commit(s). Rerun without -SkipPush."
        }

        Write-Step "Pushing $ahead commit(s) to origin/$Branch..."
        & $git push origin $Branch
        if ($LASTEXITCODE -ne 0) { Fail "git push failed." }
    } else {
        Write-Step "origin/$Branch is up to date ($($localHead.Substring(0, 7)))."
    }
}

# ---------------------------------------------------------------- ssh setup
$sshArgs = @(
    "-o", "StrictHostKeyChecking=accept-new",
    "-o", "ConnectTimeout=15",
    "-o", "ServerAliveInterval=30",
    "-o", "LogLevel=ERROR",
    "-o", "NumberOfPasswordPrompts=1"
)
$askpassFile = $null

if (Test-Path $KeyFile) {
    Write-Step "Using SSH key: $KeyFile"
    $sshArgs += @("-i", $KeyFile)
} elseif (Test-Path $PasswordFile) {
    $askpassDir = Split-Path -Parent $PasswordFile
    $askpassFile = Join-Path $askpassDir "askpass_deploy.cmd"
    Set-Content -Path $askpassFile -Encoding ASCII -Value @(
        "@echo off",
        "type `"$PasswordFile`""
    )
    $env:SSH_ASKPASS = $askpassFile
    $env:SSH_ASKPASS_REQUIRE = "force"
    $env:DISPLAY = "localhost:0"
    Write-Step "Using SSH password from: $PasswordFile"
} else {
    Fail @"
No SSH key and no password file found.
  Key:      $KeyFile
  Password: $PasswordFile

Create the password file once with:
  `$p = "`$env:TEMP\opencode\ssh_pass.txt"
  `$b = [Runtime.InteropServices.Marshal]::SecureStringToBSTR((Read-Host "SSH password" -AsSecureString))
  [IO.File]::WriteAllText(`$p, [Runtime.InteropServices.Marshal]::PtrToStringBSTR(`$b))
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR(`$b)
"@
}

$target = "$SshUser@$SshHost"

function Invoke-RemoteScript {
    param(
        [Parameter(Mandatory = $true)][string]$Runner,
        [Parameter(Mandatory = $true)][string]$Script,
        [Parameter(Mandatory = $true)][string]$Label
    )

    # The remote shell must never receive CRLF line endings.
    $Script = $Script -replace "`r`n", "`n"

    $remoteOut = $Script | & $ssh @sshArgs $target $Runner 2>&1
    $exitCode = $LASTEXITCODE
    $remoteOut | ForEach-Object { Write-Host $_ }
    if ($exitCode -ne 0) {
        Fail "$Label failed (remote exit $exitCode)."
    }
}

try {
    if ($Rollback) {
        $activateScript = @'
set -euo pipefail

STATE=/home/alfa-project/frontend-active
UPSTREAM=/etc/nginx/conf.d/alfa-frontend-upstream.conf

ACTIVE=$(cat "$STATE" 2>/dev/null || echo green)
if [ "$ACTIVE" = "blue" ]; then
    TARGET=green
    TARGET_PORT=3001
    ACTIVE_PORT=3000
else
    TARGET=blue
    TARGET_PORT=3000
    ACTIVE_PORT=3001
fi

[ -L "/home/alfa-project/alfa-frontend-$TARGET" ] || { echo "NO_PREVIOUS_RELEASE"; exit 2; }

echo "ROLLBACK_ACTIVE=$ACTIVE TARGET=$TARGET PORT=$TARGET_PORT"
systemctl start "alfa-frontend-$TARGET" 2>/dev/null || true

i=0
ok=0
while [ "$i" -lt 60 ]; do
    i=$((i + 1))
    if curl -fsS -o /dev/null "http://127.0.0.1:$TARGET_PORT/" 2>/dev/null; then
        ok=1
        break
    fi
    sleep 2
done
if [ "$ok" -ne 1 ]; then
    echo "ROLLBACK_TARGET_HEALTH_FAILED"
    journalctl -u "alfa-frontend-$TARGET" -n 60 --no-pager || true
    exit 3
fi

printf 'upstream alfa_frontend {\n    server 127.0.0.1:%s;\n}\n' "$TARGET_PORT" > "$UPSTREAM"
nginx -t
nginx -s reload
echo "$TARGET" > "$STATE"

sleep 10
systemctl stop "alfa-frontend-$ACTIVE" 2>/dev/null || true
echo "ROLLBACK_OK ACTIVE_NOW=$TARGET"
'@
        Write-Step "Rolling back to the previous color..."
        Invoke-RemoteScript -Runner "bash -s" -Script $activateScript -Label "Rollback"
    } else {
        $buildScript = @'
set -euo pipefail

export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export HOME=/home/springuser

CHECKOUT=__REMOTE_PATH__
BUILD=/home/alfa-project/build
RELEASES=/home/alfa-project/releases
BRANCH=__BRANCH__

cd "$CHECKOUT"

# Discard lockfile noise left by previous manual installs.
git checkout -- package-lock.json 2>/dev/null || true

git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"
NEW_SHA=$(git rev-parse HEAD)
SHORT_SHA=$(git rev-parse --short HEAD)
echo "COMMIT=$SHORT_SHA"

# Only reinstall when the lockfile actually changed.
LOCK_HASH=$(sha256sum package-lock.json | awk '{print $1}')
LAST_LOCK="$RELEASES/.last-lock"
if [ ! -f "$LAST_LOCK" ] || [ "$(cat "$LAST_LOCK")" != "$LOCK_HASH" ]; then
    echo "LOCKFILE_CHANGED -> npm ci"
    npm ci --no-audit --no-fund
    echo "$LOCK_HASH" > "$LAST_LOCK"
else
    echo "LOCKFILE_UNCHANGED -> skip npm ci"
fi

# Isolated build directory: never touches the live .next.
rm -rf "$BUILD"
mkdir -p "$BUILD"
git archive HEAD | tar -x -C "$BUILD"
cp -a "$CHECKOUT/.env.local" "$BUILD/.env.local"
cp -al "$CHECKOUT/node_modules" "$BUILD/node_modules"

cd "$BUILD"
NEXT_STANDALONE=true npm run build
npm run pwa:check

TS=$(date -u +%Y%m%d-%H%M%S)
REL="$RELEASES/${SHORT_SHA}-${TS}"
mkdir -p "$REL"
cp -a "$BUILD/.next/standalone/." "$REL/"
mkdir -p "$REL/.next"
cp -a "$BUILD/.next/static" "$REL/.next/static"
cp -a "$BUILD/public" "$REL/public"
cp -a "$BUILD/.env.local" "$REL/.env.local"

chmod -R u+rwX "$REL"
echo "$REL" > "$RELEASES/.pending"
echo "$NEW_SHA" > "$RELEASES/.pending-sha"

echo "RELEASE=$REL"
echo "BUILD_ID=$(cat "$REL/.next/BUILD_ID")"
echo "BUILD_OK"
'@
        $buildScript = $buildScript.Replace("__REMOTE_PATH__", $RemotePath)
        $buildScript = $buildScript.Replace("__BRANCH__", $Branch)

        Write-Step "Building the new release on the server (live traffic stays on the active color)..."
        Invoke-RemoteScript -Runner "runuser -u springuser -- bash -s" -Script $buildScript -Label "Build"

        $activateScript = @'
set -euo pipefail

RELEASES=/home/alfa-project/releases
STATE=/home/alfa-project/frontend-active
UPSTREAM=/etc/nginx/conf.d/alfa-frontend-upstream.conf

REL=$(cat "$RELEASES/.pending" 2>/dev/null || true)
[ -n "$REL" ] && [ -d "$REL" ] || { echo "PENDING_RELEASE_MISSING"; exit 2; }

ACTIVE=$(cat "$STATE" 2>/dev/null || echo green)
if [ "$ACTIVE" = "blue" ]; then
    TARGET=green
    TARGET_PORT=3001
    ACTIVE_PORT=3000
else
    TARGET=blue
    TARGET_PORT=3000
    ACTIVE_PORT=3001
fi

echo "ACTIVE=$ACTIVE TARGET=$TARGET TARGET_PORT=$TARGET_PORT"
echo "RELEASE=$REL"

# Atomic symlink swap for the idle color.
ln -sfn "$REL" "/home/alfa-project/alfa-frontend-$TARGET.tmp"
mv -Tf "/home/alfa-project/alfa-frontend-$TARGET.tmp" "/home/alfa-project/alfa-frontend-$TARGET"

systemctl restart "alfa-frontend-$TARGET"

i=0
ok=0
while [ "$i" -lt 90 ]; do
    i=$((i + 1))
    if curl -fsS -o /dev/null "http://127.0.0.1:$TARGET_PORT/" 2>/dev/null; then
        ok=1
        break
    fi
    sleep 2
done

if [ "$ok" -ne 1 ]; then
    echo "TARGET_HEALTH_FAILED"
    journalctl -u "alfa-frontend-$TARGET" -n 80 --no-pager || true
    systemctl stop "alfa-frontend-$TARGET" 2>/dev/null || true
    exit 3
fi

echo "TARGET_HEALTHY_AFTER=$((i * 2))s"

# Graceful Nginx switch. Existing connections stay on the old workers.
OLD_CONFIG=$(cat "$UPSTREAM")
printf 'upstream alfa_frontend {\n    server 127.0.0.1:%s;\n}\n' "$TARGET_PORT" > "$UPSTREAM"

if ! nginx -t; then
    echo "NGINX_TEST_FAILED -> reverting upstream"
    printf '%s\n' "$OLD_CONFIG" > "$UPSTREAM"
    nginx -s reload 2>/dev/null || true
    systemctl stop "alfa-frontend-$TARGET" 2>/dev/null || true
    exit 4
fi

nginx -s reload
echo "$TARGET" > "$STATE"
echo "SWITCHED_TO=$TARGET"

# Let Nginx drain in-flight requests before stopping the old color.
sleep 10
systemctl stop "alfa-frontend-$ACTIVE" 2>/dev/null || true
echo "STOPPED=$ACTIVE"

# Keep the two color releases; prune older unreferenced ones.
KEEP_BLUE=$(readlink -f /home/alfa-project/alfa-frontend-blue 2>/dev/null || true)
KEEP_GREEN=$(readlink -f /home/alfa-project/alfa-frontend-green 2>/dev/null || true)
ls -1dt "$RELEASES"/*/ 2>/dev/null | tail -n +6 | while read -r old; do
    old=${old%/}
    if [ "$old" != "$KEEP_BLUE" ] && [ "$old" != "$KEEP_GREEN" ]; then
        echo "PRUNE=$old"
        rm -rf "$old"
    fi
done

echo "DEPLOY_OK ACTIVE_NOW=$TARGET"
'@

        Write-Step "Starting the new release and switching Nginx..."
        Invoke-RemoteScript -Runner "bash -s" -Script $activateScript -Label "Activation"
    }

    # ------------------------------------------------------------ verification
    Write-Step "Verifying the public site..."
    $siteCode = (& curl.exe -sS -o NUL -w "%{http_code}" "https://alfagrouptech.com/")
    $swHeaders = (& curl.exe -sSI "https://alfagrouptech.com/sw.js" 2>$null) -join "`n"
    $hasNoStore = $swHeaders -match "(?im)^cache-control:\s*no-cache,\s*no-store,\s*must-revalidate"
    $hasSwScope = $swHeaders -match "(?im)^service-worker-allowed:\s*/"

    if ($siteCode -ne "200") {
        Fail "Public site returned HTTP $siteCode."
    }
    if (-not $hasNoStore -or -not $hasSwScope) {
        Write-Host "WARNING: /sw.js headers look wrong (no-store=$hasNoStore, scope=$hasSwScope)." -ForegroundColor Yellow
    }

    Write-Step "Done. https://alfagrouptech.com/ -> HTTP $siteCode"
}
finally {
    if ($askpassFile) {
        Remove-Item $askpassFile -Force -ErrorAction SilentlyContinue
        Remove-Item Env:SSH_ASKPASS -ErrorAction SilentlyContinue
        Remove-Item Env:SSH_ASKPASS_REQUIRE -ErrorAction SilentlyContinue
    }
}
