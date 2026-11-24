# Таблица 3.5 – Соответствие маршрутов контроллерам и функциям

В таблице приведены маршруты серверной части проекта, их HTTP-методы, соответствующие контроллеры и функции контроллеров. Серверная часть проекта не использует общий префикс `/api`; маршруты подключаются напрямую в файле `backend/index.js`.

| Метод | Маршрут | Контроллер | Метод контроллера |
|---|---|---|---|
| POST | `/auth/register` | `authController` | `register` |
| POST | `/auth/login` | `authController` | `login` |
| POST | `/auth/forgot-password` | `authController` | `requestPasswordReset` |
| POST | `/auth/reset-password` | `authController` | `resetPassword` |
| GET | `/auth/me` | `authController` | `getMe` |
| GET | `/posts` | `postsController` | `getPosts` |
| GET | `/posts/:id` | `postsController` | `getPostById` |
| POST | `/posts` | `postsController` | `createPost` |
| PATCH | `/posts/:id` | `postsController` | `updatePost` |
| DELETE | `/posts/:id` | `postsController` | `deletePost` |
| POST | `/posts/:id/view` | `viewsController` | `markPostAsViewed` |
| GET | `/posts/:postId/comments` | `commentsController` | `getComments` |
| POST | `/posts/:postId/comments` | `commentsController` | `createComment` |
| DELETE | `/comments/:id` | `commentsController` | `deleteComment` |
| POST | `/posts/:id/like` | `likesController` | `togglePostLike` |
| POST | `/comments/:id/like` | `likesController` | `toggleCommentLike` |
| GET | `/users` | `usersController` | `getUsers` |
| GET | `/users/:id/activity` | `usersController` | `getUserActivity` |
| GET | `/users/:id/comments` | `usersController` | `getUserComments` |
| GET | `/users/:id/posts` | `usersController` | `getUserPosts` |
| GET | `/users/:id` | `usersController` | `getUserProfile` |
| PATCH | `/users/me` | `usersController` | `updateUserProfile` |
| GET | `/users/:id/views` | `usersController` | `getUserViews` |
| GET | `/users/:id/followers` | `usersController` | `getUserFollowers` |
| GET | `/users/:id/following` | `usersController` | `getUserFollowing` |
| POST | `/users/:id/subscribe` | `usersController` | `toggleSubscription` |
| POST | `/users/:id/ban` | `usersController` | `toggleBan` |
| GET | `/notifications` | `notificationsController` | `getNotifications` |
| POST | `/notifications/read` | `notificationsController` | `markNotificationsAsRead` |
| DELETE | `/notifications/:id` | `notificationsController` | `deleteNotification` |
| POST | `/email/change-request` | `emailController` | `requestEmailChange` |
| POST | `/email/verify` | `emailController` | `verifyEmailChange` |

## Пояснение

Маршруты авторизации расположены в `authRoutes.js` и отвечают за регистрацию, вход пользователя, получение данных текущего пользователя и восстановление пароля. Маршруты публикаций находятся в `postsRoutes.js` и позволяют получать, создавать, редактировать и удалять посты. Для комментариев используется связка маршрутов `commentsRoutes.js` и `commentDeleteRoutes.js`: первый файл отвечает за получение и создание комментариев к публикациям, второй — за удаление комментариев.

Отдельные маршруты предусмотрены для лайков, просмотров, уведомлений, пользователей и смены email. Часть маршрутов защищена middleware авторизации `auth.js`, который проверяет JWT-токен пользователя перед выполнением операции.
