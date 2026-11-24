# Настройка EmailJS (смена email и сброс пароля)

## Главная причина «письмо пришло на Gmail отправителя»

В шаблоне EmailJS поле **To Email** (вкладка Settings / Настройки шаблона) должно быть:

```
{{to_email}}
```

**Нельзя:**
- оставлять пустым (тогда уходит на почту сервиса — ваш Gmail);
- писать свой Gmail вручную;
- для сброса пароля ставить только `{{new_email}}`, если в коде не передаётся новый email (для сброса пароля мы дублируем `new_email` = email пользователя, но надёжнее всё равно `{{to_email}}`).

**To Name:** `{{to_name}}`

---

## Переменные в теле письма

| Переменная | Смена email | Сброс пароля |
|------------|-------------|--------------|
| `{{to_email}}` | новый email | email пользователя |
| `{{to_name}}` | ник | ник |
| `{{token}}` | токен | токен |
| `{{verification_token}}` | то же | то же |
| `{{new_email}}` | новый email | = email (для совместимости) |
| `{{verification_link}}` | ссылка verify | ссылка reset |
| `{{reset_link}}` | — | `/reset-password?token=...` |
| `{{message}}` | текст с токеном | текст с токеном |

---

## HTML-шаблоны в стиле сайта

Скопируйте **весь HTML** в EmailJS → **Content** (режим HTML / Code editor):

| Шаблон | Файл в проекте |
|--------|----------------|
| Смена email | [`email-templates/email-change.html`](email-templates/email-change.html) |
| Сброс пароля | [`email-templates/password-reset.html`](email-templates/password-reset.html) |

Стиль: тёмный фон `#0a0a14`, карточка `#12121f`, акцент `#6b7fff`, кнопка и блок токена как в интерфейсе. Без эмодзи. Токен смены email — **30 минут**, сброс пароля — **1 час** (как в коде).

**Settings → To Email:** `{{to_email}}` · **To Name:** `{{to_name}}`

---

## Шаблон сброса пароля (отдельный template_id)

В `.env`:

```env
EMAILJS_PASSWORD_RESET_TEMPLATE_ID=template_ваш_сброс
```

---

## .env бэкенда

```env
EMAILJS_SERVICE_ID=service_xxx
EMAILJS_PUBLIC_KEY=xxx
EMAILJS_PRIVATE_KEY=xxx
EMAILJS_TEMPLATE_ID=template_смена_email
EMAILJS_PASSWORD_RESET_TEMPLATE_ID=template_сброс_пароля
FRONTEND_URL=http://localhost
```

После изменений — **перезапуск backend**.

---

## Проверка

```bash
docker logs <backend-container> 2>&1 | grep EMAIL
```

В логе должно быть: `Отправка ... → user@mail.com` (не ваш Gmail).
