# Файлы для демо-постов

Эти файлы **вшиты в Docker-образ** backend. При старте контейнера копируются в volume `uploads/seed/` (том uploads перекрывает `/app/uploads`, поэтому без копирования вложения пропадают после rebuild).

Добавить/обновить файлы:

```bash
cd backend
npm run seed:prepare
# скопировать uploads/seed/* сюда в seed-assets/
```

После изменения: `docker compose build backend && docker compose up -d backend`
