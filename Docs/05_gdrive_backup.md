# Google Drive Database Daily Backup Setup Guide (/opt/dev)

This guide details how to set up automated daily MongoDB database backups from VPS (`/opt/dev`) directly to Google Drive using `rclone` and `cron`.

---

## 📁 Included Files

- Backup Script: [`scripts/backup-to-gdrive.sh`](file:///c:/Users/mdikr/Documents/CODE/Decantre_Fullstack/scripts/backup-to-gdrive.sh)
- Output Folder on VPS: `/opt/dev/backups`
- Log File on VPS: `/var/log/decantre-backup.log`
- Target Container: `decantre-mongodb-dev`
- Target Database: `perfume-store`

---

## 🛠️ Step 1: Install `rclone` on VPS

Log into your VPS via SSH:
```bash
ssh root@144.79.218.126
```

Install `rclone`:
```bash
sudo apt update && sudo apt install -y rclone
```
*(Or official script: `curl https://rclone.org/install.sh | sudo bash`)*

---

## 🔐 Step 2: Configure Google Drive Remote in `rclone`

Run the configuration command on your VPS:
```bash
rclone config
```

Follow these setup choices:

1. **New remote**: Type `n` and press Enter.
2. **Name**: Type `gdrive` and press Enter.
3. **Storage type**: Type `drive` (or choose the number for **Google Drive**).
4. **Client ID / Client Secret**: Press **Enter** to leave blank.
5. **Scope**: Type `1` (Full access all files).
6. **Service Account Credentials File**: Press **Enter** to leave blank.
7. **Edit advanced config**: Type `n` and press Enter.
8. **Use auto config?**: Type `n` (since VPS has no web browser).

### 🔑 Authorizing Google Drive (Browser Authentication step):
`rclone` will output a command like this:
```text
rclone authorize "drive" "xxxxxxxx..."
```

1. Run that `rclone authorize "drive" ...` command on your **local computer** terminal (Command Prompt / PowerShell / Mac Terminal).
2. A browser window will open automatically asking you to log into your Google account and grant permissions.
3. Once approved, your local terminal will display a verification code block wrapped in `{ "access_token": ... }`.
4. Copy that JSON code block and paste it back into the VPS SSH terminal.
5. **Configure as Team Drive?**: Type `n`
6. **Confirm & Save**: Type `y` and press `q` to quit.

Test Google Drive connection:
```bash
rclone ls gdrive:
```
*(If this command runs without error, rclone is successfully connected to Google Drive!)*

---

## 🚀 Step 3: Set Permissions & Run Manual Test

Ensure the script is executable:
```bash
cd /opt/dev
chmod +x scripts/backup-to-gdrive.sh
```

Run the backup script manually to verify:
```bash
/opt/dev/scripts/backup-to-gdrive.sh
```

### What happens during execution:
1. Automatically targets container `decantre-mongodb-dev` (or reads `.env`).
2. Creates compressed database dump in `/opt/dev/backups/decantre_db_perfume-store_<timestamp>.gz`.
3. Uploads the compressed file to Google Drive under folder `Decantre_DB_Backups`.
4. Deletes local backup archives older than 7 days to conserve disk space.

---

## ⏰ Step 4: Schedule Daily Backup via Cron

Open the system crontab editor on VPS:
```bash
crontab -e
```

Add the following line at the end of the file (runs every night at **3:00 AM**):
```cron
0 3 * * * /opt/dev/scripts/backup-to-gdrive.sh >> /var/log/decantre-backup.log 2>&1
```

Save and exit (`Ctrl+O` then `Enter`, then `Ctrl+X` in nano).

---

## 📋 Checking Backup Logs & Status

To view execution logs at any time on your VPS:
```bash
tail -f /var/log/decantre-backup.log
```

To list backups stored on Google Drive:
```bash
rclone ls gdrive:Decantre_DB_Backups
```
