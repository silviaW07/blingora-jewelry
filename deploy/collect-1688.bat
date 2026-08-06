@echo off
cd /d "%~dp0.."
node scripts/collect-1688.mjs %*
pause
