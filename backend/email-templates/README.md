# HTML-шаблоны писем для EmailJS

Стили совпадают с тёмной темой сайта: фон `#0a0a14`, карточка `#12121f`, акцент `#6b7fff`, текст `#e5e7f0`.

## Куда вставить

1. [EmailJS Dashboard](https://dashboard.emailjs.com/admin/templates) → ваш шаблон → **Content** (HTML).
2. Скопируйте **весь** файл из этой папки в редактор шаблона.
3. Вкладка **Settings**:
   - **To Email:** `{{to_email}}`
   - **To Name:** `{{to_name}}`
   - **Subject** (по желанию): `Подтверждение смены email` / `Сброс пароля Micro Blog`

| Файл | Назначение | Переменная в `.env` |
|------|------------|---------------------|
| `email-change.html` | Смена email | `EMAILJS_TEMPLATE_ID` |
| `password-reset.html` | Сброс пароля | `EMAILJS_PASSWORD_RESET_TEMPLATE_ID` |

## Переменные в шаблоне

Оба шаблона используют: `{{to_name}}`, `{{to_email}}`, `{{token}}`, `{{verification_token}}` (дубликат token).

Дополнительно:

- смена email: `{{new_email}}`, `{{verification_link}}`
- сброс пароля: `{{reset_link}}`, `{{verification_link}}` (то же, что reset_link)

Бэкенд передаёт все эти поля автоматически (`backend/services/emailService.js`).

## Важно

- Не удаляйте `{{...}}` — EmailJS подставит значения при отправке.
- После правки шаблона перезапуск backend не обязателен; достаточно сохранить в EmailJS.
- Если письмо снова приходит на Gmail отправителя — в Settings поле **To Email** не равно `{{to_email}}`.

Подробнее: `../EMAIL_TEMPLATE_SETUP.md`
