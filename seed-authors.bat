@echo off
echo Заполнение БД: 10 демо-авторов...
cd /d "%~dp0backend"
node seed-prepare-assets.js
node seed-10-authors.js --reset
if errorlevel 1 (
  echo.
  echo Если БД в Docker, попробуйте:
  echo   docker compose exec backend node seed-10-authors.js --reset
  pause
  exit /b 1
)
echo.
echo Готово. Логин: demo_author_anna@demo.local  Пароль: Password123
pause
