#!/usr/bin/env bash
# Deploy ooostop.ru static site to Beget via FTP.
# Usage:
#   BEGET_FTP_PASS='...' ./scripts/deploy-beget.sh
# Optional:
#   BEGET_FTP_HOST=gedeva0h.beget.tech
#   BEGET_FTP_USER=gedeva0h_ooostop
#   BEGET_REMOTE_DIR=.
#   RESEND_API_KEY=re_xxx   # writes api/config.php on remote

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${BEGET_FTP_HOST:-gedeva0h.beget.tech}"
USER="${BEGET_FTP_USER:-gedeva0h_ooostop}"
PASS="${BEGET_FTP_PASS:-}"
REMOTE_DIR="${BEGET_REMOTE_DIR:-.}"

if [[ -z "$PASS" ]]; then
  echo "Set BEGET_FTP_PASS first." >&2
  exit 1
fi

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

mkdir -p "$STAGE/dist" "$STAGE/vendor" "$STAGE/api"
cp "$ROOT/index.html" "$ROOT/script.js" "$ROOT/styles.css" "$ROOT/.htaccess" "$STAGE/"
cp "$ROOT/dist/tailwind.css" "$STAGE/dist/"
cp "$ROOT/vendor/alpine.min.js" "$STAGE/vendor/"
cp "$ROOT/beget/api/lead.php" "$ROOT/beget/api/config.example.php" "$STAGE/api/"

if [[ -n "${RESEND_API_KEY:-}" ]]; then
  cat > "$STAGE/api/config.php" <<PHP
<?php
return [
  'RESEND_API_KEY' => '${RESEND_API_KEY}',
  'RESEND_FROM_EMAIL' => '${RESEND_FROM_EMAIL:-noreply@mail.ooostop.ru}',
  'LEAD_TO_EMAIL' => '${LEAD_TO_EMAIL:-3630013@mail.ru}',
];
PHP
fi

python3 - <<PY
from ftplib import FTP
from pathlib import Path
import os

host = os.environ.get('BEGET_FTP_HOST', '$HOST')
user = os.environ.get('BEGET_FTP_USER', '$USER')
passwd = os.environ['BEGET_FTP_PASS']
remote_dir = os.environ.get('BEGET_REMOTE_DIR', '$REMOTE_DIR')
stage = Path('$STAGE')

ftp = FTP()
ftp.connect(host, 21, timeout=40)
ftp.login(user, passwd)
ftp.set_pasv(True)
if remote_dir not in ('', '.', '/'):
    ftp.cwd(remote_dir)
print('PWD', ftp.pwd())

def ensure_dir(path: str):
    parts = [p for p in path.split('/') if p]
    cur = ''
    for part in parts:
        cur = f'{cur}/{part}' if cur else part
        try:
            ftp.mkd(cur)
        except Exception:
            pass

def upload_file(local: Path, remote: str):
    parent = '/'.join(remote.split('/')[:-1])
    if parent:
        ensure_dir(parent)
    with local.open('rb') as f:
        ftp.storbinary(f'STOR {remote}', f)
    print('UP', remote)

for path in sorted(stage.rglob('*')):
    if path.is_file():
        rel = path.relative_to(stage).as_posix()
        upload_file(path, rel)

print('DONE')
ftp.quit()
PY
