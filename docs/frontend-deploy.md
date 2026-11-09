# Frontend deployment (zero downtime)

The frontend runs as two independent Next.js standalone releases behind Nginx:

| Color | Port | systemd service | Release symlink |
|-------|------|-----------------|-----------------|
| blue  | 3000 | `alfa-frontend-blue.service`  | `/home/alfa-project/alfa-frontend-blue` |
| green | 3001 | `alfa-frontend-green.service` | `/home/alfa-project/alfa-frontend-green` |

Nginx reads the active port from
`/etc/nginx/conf.d/alfa-frontend-upstream.conf`. The current color is also
stored in `/home/alfa-project/frontend-active`.

The backend (`alfa-app.service`, `/api/`, `/images/`) is **not** touched by
this process.

## Deploy

From the frontend repository on Windows:

```powershell
.\scripts\deploy-frontend.ps1
```

The script:

1. Refuses to deploy a dirty working tree (override with `-Force`) and pushes
   any committed local changes to `origin/main` (skip with `-SkipPush`).
2. Pulls `origin/main` on the server and installs dependencies only when
   `package-lock.json` changed.
3. Builds a standalone release in `/home/alfa-project/build`. The live `.next`
   is never rebuilt in place.
4. Copies the release to `/home/alfa-project/releases/<sha>-<timestamp>`.
5. Points the idle color at the new release and restarts only that color.
6. Health-checks the idle color on its local port.
7. Reloads Nginx with the new upstream (graceful reload; in-flight requests
   finish on the old workers).
8. Waits 10 seconds, then stops the old color.
9. Verifies `https://alfagrouptech.com/` and the `/sw.js` headers.

If the new release is not healthy, it is stopped and the active color keeps
serving. Nginx is not switched.

## Rollback

Switch back to the previous color/release without rebuilding:

```powershell
.\scripts\deploy-frontend.ps1 -Rollback
```

The previous color's release directory is kept on disk for exactly this case.

## SSH authentication

The script uses, in order:

1. `~/.ssh/alfa_deploy` if it exists.
2. `%TEMP%\opencode\ssh_pass.txt` (one-time SSH password file).

Create the password file with:

```powershell
$p = "$env:TEMP\opencode\ssh_pass.txt"
$b = [Runtime.InteropServices.Marshal]::SecureStringToBSTR((Read-Host "SSH password" -AsSecureString))
[IO.File]::WriteAllText($p, [Runtime.InteropServices.Marshal]::PtrToStringBSTR($b))
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b)
```

## Useful commands on the server

```bash
cat /home/alfa-project/frontend-active
cat /etc/nginx/conf.d/alfa-frontend-upstream.conf
systemctl status alfa-frontend-blue alfa-frontend-green
journalctl -u alfa-frontend-blue -n 50 --no-pager
ls -1dt /home/alfa-project/releases/*/ | head
```

## Notes

- The old `alfa-frontend.service` (which ran `npm run build && npm run start`)
  is disabled. Keep it as an emergency fallback only.
- Releases are pruned automatically, but the two releases referenced by the
  color symlinks are always kept.
- The build user is `springuser`; `/home/springuser` must exist and be writable
  by that user.
- Server-side build env comes from `/home/alfa-project/alfa-ecommerce/.env.local`
  and is copied into each release.
