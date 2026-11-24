@echo off
echo Clearing all post views from database...
docker exec -it pskp-6s-max-postgres-1 psql -U postgres -d microblog -c "DELETE FROM post_views;"
echo Done! All post views have been cleared.
pause
