@echo off
echo [GitHub Auto-Sync] Starting...
git add .
git commit -m "Auto-sync update: %date% %time%"
git push origin main
echo [GitHub Auto-Sync] Done! Site will be updated in 1-2 minutes.
pause
