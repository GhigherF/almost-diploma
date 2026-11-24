# Демо-авторы (болванчики)

Пароль для всех: **Password123**

| Ник | Email |
|-----|-------|
| demo_author_anna | demo_author_anna@demo.local |
| demo_author_ivan | demo_author_ivan@demo.local |
| demo_author_maria | demo_author_maria@demo.local |
| demo_author_dmitry | demo_author_dmitry@demo.local |
| demo_author_elena | demo_author_elena@demo.local |
| demo_author_sergey | demo_author_sergey@demo.local |
| demo_author_olga | demo_author_olga@demo.local |
| demo_author_pavel | demo_author_pavel@demo.local |
| demo_author_nina | demo_author_nina@demo.local |
| demo_author_artem | demo_author_artem@demo.local |

**Логин:** `demo_author_anna@demo.local` (и остальные `demo_author_*@demo.local`)  
**Пароль:** `Password123`

При `docker compose up` демо-данные и файлы поднимаются **автоматически** (`startup.js` → `ensure-demo-data.js`).

Принудительно пересоздать демо-посты:

```bash
docker compose exec backend node seed-10-authors.js --reset
```

После изменения файлов в `seed-assets/`:

```bash
cd backend && npm run seed:prepare
docker compose build backend && docker compose up -d backend
```
