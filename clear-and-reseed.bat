@echo off
echo Очистка базы данных и пересоздание данных...
echo.

echo Останавливаем контейнеры...
docker-compose down

echo.
echo Удаляем volume с данными PostgreSQL...
docker volume rm pskp-6s-max_pgdata 2>nul

echo.
echo Запускаем контейнеры заново...
docker-compose up -d

echo.
echo Ожидание запуска базы данных (15 секунд)...
timeout /t 15 /nobreak

echo.
echo Готово! База данных пересоздана с новыми данными.
echo Данные распределены по последнему месяцу.
echo 60%% пользователей имеют аватарки.
echo.
pause
