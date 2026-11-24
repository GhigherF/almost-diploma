# Настройка EmailJS для сброса пароля

## 1. Создайте шаблон в EmailJS

1. Откройте [https://www.emailjs.com/](https://www.emailjs.com/) → **Email Templates** → **Create New Template**.
2. Название, например: `Password Reset`.
3. Скопируйте **Template ID** (вид `template_xxxxxxx`).

## 2. ОБЯЗАТЕЛЬНО: поле «To Email» в настройках шаблона

В EmailJS откройте шаблон → **Settings** (шестерёнка) → **To Email** и вставьте **ровно**:

```
{{to_email}}
```

Если там пусто или ваш Gmail — письма уходят **вам**, а не пользователю.  
Ошибка «такого адреса не существует» часто бывает, если в To стоит `{{new_email}}`, а переменная пустая — в коде для сброса пароля `new_email` тоже заполняется, но безопаснее использовать `{{to_email}}`.

**To Name:** `{{to_name}}`

## 3. Поля шаблона (Template Parameters)

В теле письма используйте переменные в двойных фигурных скобках:

| Переменная в шаблоне | Откуда берётся | Пример в письме |
|---------------------|----------------|-----------------|
| `{{to_email}}` | Email пользователя | Кому отправляем |
| `{{to_name}}` | Ник пользователя | Привет, {{to_name}}! |
| `{{user_name}}` | То же, что ник | |
| `{{token}}` | Токен сброса (64 символа) | Код: `{{token}}` |
| `{{verification_token}}` | Дубликат токена | На случай старого шаблона |
| `{{reset_link}}` | Ссылка на фронт | [Сбросить пароль]({{reset_link}}) |
| `{{verification_link}}` | То же, что reset_link | Запасное имя |

### HTML в стиле сайта

Скопируйте в EmailJS → Content весь файл:

[`email-templates/password-reset.html`](email-templates/password-reset.html)

(Тёмная тема Micro Blog, кнопка «Сбросить пароль», блок с токеном.)

## 3. Куда вставить ID в проекте

### Вариант A — отдельный шаблон для сброса пароля (рекомендуется)

В `.env` бэкенда (или переменные Docker для `backend`):

```env
EMAILJS_SERVICE_ID=service_xxxxxxx
EMAILJS_PUBLIC_KEY=xxxxxxxx
EMAILJS_PRIVATE_KEY=xxxxxxxx
EMAILJS_TEMPLATE_ID=template_email_change
EMAILJS_PASSWORD_RESET_TEMPLATE_ID=template_password_reset
FRONTEND_URL=http://localhost
```

`EMAILJS_PASSWORD_RESET_TEMPLATE_ID` — **новый** Template ID из шага 1.

### Вариант B — один шаблон на всё

Если не задать `EMAILJS_PASSWORD_RESET_TEMPLATE_ID`, используется `EMAILJS_TEMPLATE_ID` (как для смены email). Тогда в **одном** шаблоне должны быть и `{{new_email}}`, и `{{reset_link}}`, и `{{token}}`.

## 4. Service ID и ключи

Те же, что для смены email:

- **Service ID** → `EMAILJS_SERVICE_ID`
- **Public Key** → `EMAILJS_PUBLIC_KEY`
- **Private Key** → `EMAILJS_PRIVATE_KEY`

Взять: EmailJS → **Account** → **API Keys** / **Email Services**.

## 5. FRONTEND_URL

Должен совпадать с адресом, где открывается сайт:

| Среда | Пример |
|-------|--------|
| Локально | `http://localhost:3000` или `http://localhost` |
| Прод | `https://ваш-домен.ru` |

Ссылка в письме: `{FRONTEND_URL}/reset-password?token=...`

## 6. Проверка

1. Перезапустите backend после изменения `.env`.
2. Откройте `/forgot-password`, введите email существующего пользователя.
3. Проверьте почту и переход по `reset_link` или ввод `token` на `/reset-password`.

## 7. Где это в коде

| Файл | Роль |
|------|------|
| `backend/services/emailService.js` | `sendPasswordResetEmail()` |
| `backend/controllers/authController.js` | `requestPasswordReset`, `resetPassword` |
| `backend/routes/authRoutes.js` | `POST /auth/forgot-password`, `POST /auth/reset-password` |
| `frontend/src/pages/ForgotPasswordPage.js` | Запрос письма |
| `frontend/src/pages/ResetPasswordPage.js` | Новый пароль + токен |
| `frontend/src/pages/LoginPage.js` | Ссылка после ошибки входа |

## 8. Миграция БД (если база уже была создана)

```bash
psql -U postgres -d microblog -f db/migrations/004_add_password_reset_tokens.sql
```

Или выполните SQL из файла вручную в pgAdmin / DBeaver.
