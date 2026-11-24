@echo off
echo Rebuilding and restarting backend container...
docker-compose up -d --build backend
echo Done! Backend container has been rebuilt and restarted.
echo Checking logs...
timeout /t 3 /nobreak >nul
docker logs pskp-6s-max-backend-1 --tail 50
pause
