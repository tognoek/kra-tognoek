@echo off
setlocal

REM Start all services: S3, Kra, Server, FE
REM Each service runs in a separate window

set ROOT=%~dp0

echo Starting services...

start "S3" cmd /k "cd /d %ROOT%S3 && cargo run"
start "Kra" cmd /k "cd /d %ROOT%Kra && cargo run"
start "Server" cmd /k "cd /d %ROOT%Server && npm run dev"
start "FE" cmd /k "cd /d %ROOT%FE && npm run dev"

echo.
echo All services started in separate windows!
echo Close the windows to stop services.

endlocal
