-- Обновить аватарки инфлюенсерам
UPDATE users SET avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=FOTOshopper' WHERE nick = 'FOTOshopper';
UPDATE users SET avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=videograph' WHERE nick = 'videograph';
UPDATE users SET avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=zanuda' WHERE nick = 'zanuda';
UPDATE users SET avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=musicvideo' WHERE nick = 'musicбvvideo';

-- Создать 3 болванчика (если не существуют)
INSERT INTO users (nick, email, hashed_password, role, avatar_url, created_at)
SELECT 'science_daily', 'science@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'https://api.dicebear.com/7.x/avataaars/svg?seed=science', NOW() - INTERVAL '1 year'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE nick = 'science_daily');

INSERT INTO users (nick, email, hashed_password, role, avatar_url, created_at)
SELECT 'history_facts', 'history@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'https://api.dicebear.com/7.x/avataaars/svg?seed=history', NOW() - INTERVAL '1 year'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE nick = 'history_facts');

INSERT INTO users (nick, email, hashed_password, role, avatar_url, created_at)
SELECT 'tech_explained', 'tech@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tech', NOW() - INTERVAL '1 year'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE nick = 'tech_explained');

-- Создать образовательные посты для science_daily
INSERT INTO posts (user_id, body, deleted, created_at)
SELECT 
  (SELECT id FROM users WHERE nick = 'science_daily'),
  E'Чёрные дыры и квантовая механика\n\nКвантовая механика описывает поведение частиц на микроскопическом уровне, где классические законы физики перестают работать. В основе теории лежит принцип неопределённости Гейзенберга.\n\nЧёрные дыры представляют собой регионы пространства-времени с гравитационным притяжением настолько сильным, что ничто, даже свет, не может покинуть их. Горизонт событий — граница чёрной дыры.',
  FALSE,
  NOW() - INTERVAL '45 days'
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE user_id = (SELECT id FROM users WHERE nick = 'science_daily') LIMIT 1);

INSERT INTO posts (user_id, body, deleted, created_at)
SELECT 
  (SELECT id FROM users WHERE nick = 'science_daily'),
  E'Эволюция и естественный отбор\n\nТеория эволюции Чарльза Дарвина объясняет разнообразие жизни на Земле через процесс естественного отбора. Организмы с полезными наследуемыми признаками имеют больше шансов выжить.\n\nГенетика показала, что эволюция происходит на молекулярном уровне через мутации ДНК. Примеры естественного отбора: резистентность бактерий к антибиотикам, камуфляж бабочек.',
  FALSE,
  NOW() - INTERVAL '30 days'
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE user_id = (SELECT id FROM users WHERE nick = 'science_daily') OFFSET 1 LIMIT 1);

INSERT INTO posts (user_id, body, deleted, created_at)
SELECT 
  (SELECT id FROM users WHERE nick = 'science_daily'),
  E'Климат Земли и парниковый эффект\n\nПарниковый эффект — естественный процесс, при котором атмосфера Земли удерживает тепло от Солнца. Без него средняя температура составляла бы -18°C вместо +15°C.\n\nГлобальное потепление приводит к таянию ледников и повышению уровня моря. МГЭИК прогнозирует рост температуры на 1.5-4.5°C к 2100 году.',
  FALSE,
  NOW() - INTERVAL '15 days'
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE user_id = (SELECT id FROM users WHERE nick = 'science_daily') OFFSET 2 LIMIT 1);

-- Создать образовательные посты для history_facts
INSERT INTO posts (user_id, body, deleted, created_at)
SELECT 
  (SELECT id FROM users WHERE nick = 'history_facts'),
  E'Древний Египет и пирамидальное строительство\n\nПирамиды Гизы — последнее из семи чудес древнего мира. Великая пирамида Хеопса была построена около 2560 года до н.э. и оставалась самым высоким сооружением более 3800 лет.\n\nЕгиптяне разработали сложные системы ирригации, математики и астрономии. Их календарь на 365 дней был на удивление точным. Религия включала веру в загробную жизнь.',
  FALSE,
  NOW() - INTERVAL '40 days'
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE user_id = (SELECT id FROM users WHERE nick = 'history_facts') LIMIT 1);

INSERT INTO posts (user_id, body, deleted, created_at)
SELECT 
  (SELECT id FROM users WHERE nick = 'history_facts'),
  E'Ренессанс и возрождение науки\n\nРенессанс XIV-XVII веков ознаменовал переход от средневековья к новому времени. Италия стала колыбелью этого движения.\n\nЛеонардо да Винчи воплощал идеал универсального человека: художник, инженер, анатом. Микеланджело создал статую Давида. Изобретение книгопечатания Гутенбергом в 1440-х годах революционизировало знания.',
  FALSE,
  NOW() - INTERVAL '25 days'
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE user_id = (SELECT id FROM users WHERE nick = 'history_facts') OFFSET 1 LIMIT 1);

INSERT INTO posts (user_id, body, deleted, created_at)
SELECT 
  (SELECT id FROM users WHERE nick = 'history_facts'),
  E'Промышленная революция\n\nПромышленная революция XVIII-XIX веков преобразовала аграрные общества в индустриальные. Изобретение паровой машины Джеймсом Уаттом изменило экономику.\n\nЖелезные дороги и пароходы сократили время путешествий. Урбанизация привела к росту городов и появлению рабочего класса. Прогресс сопровождался социальными проблемами.',
  FALSE,
  NOW() - INTERVAL '10 days'
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE user_id = (SELECT id FROM users WHERE nick = 'history_facts') OFFSET 2 LIMIT 1);

-- Создать образовательные посты для tech_explained
INSERT INTO posts (user_id, body, deleted, created_at)
SELECT 
  (SELECT id FROM users WHERE nick = 'tech_explained'),
  E'Искусственный интеллект и машинное обучение\n\nМашинное обучение — подраздел ИИ, где системы учатся на данных без явного программирования. Типы: обучение с учителем, без учителя и с подкреплением.\n\nНейронные сети лежат в основе глубокого обучения. Современные трансформеры применяют механизм внимания. Применения: распознавание речи, компьютерное зрение, медицинская диагностика.',
  FALSE,
  NOW() - INTERVAL '35 days'
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE user_id = (SELECT id FROM users WHERE nick = 'tech_explained') LIMIT 1);

INSERT INTO posts (user_id, body, deleted, created_at)
SELECT 
  (SELECT id FROM users WHERE nick = 'tech_explained'),
  E'Блокчейн и криптовалюты\n\nБлокчейн — распределённый реестр с криптографически связанными блоками. Технология обеспечивает децентрализацию без доверенных посредников.\n\nБиткоин, созданный в 2008 году, стал первой криптовалютой. Эфириум ввёл смарт-контракты. Технология применяется в финансах, логистике, здравоохранении.',
  FALSE,
  NOW() - INTERVAL '20 days'
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE user_id = (SELECT id FROM users WHERE nick = 'tech_explained') OFFSET 1 LIMIT 1);

INSERT INTO posts (user_id, body, deleted, created_at)
SELECT 
  (SELECT id FROM users WHERE nick = 'tech_explained'),
  E'Квантовые компьютеры\n\nКлассические компьютеры используют биты (0 или 1), квантовые — кубиты в суперпозиции. Это позволяет обрабатывать огромное количество вариантов одновременно.\n\nЗапутанность связывает квантовые частицы независимо от расстояния. Алгоритм Шора факторизует числа экспоненциально быстрее. IBM, Google и Microsoft разрабатывают квантовые процессоры.',
  FALSE,
  NOW() - INTERVAL '5 days'
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE user_id = (SELECT id FROM users WHERE nick = 'tech_explained') OFFSET 2 LIMIT 1);

-- Создать подписки для alice на всех ключевых пользователей
DO $$
DECLARE
  alice_id INTEGER;
  target_id INTEGER;
BEGIN
  SELECT id INTO alice_id FROM users WHERE nick = 'alice';
  
  IF alice_id IS NOT NULL THEN
    -- Подписка на инфлюенсеров
    FOR target_id IN SELECT id FROM users WHERE nick IN ('FOTOshopper', 'videograph', 'zanuda', 'musicбvvideo')
    LOOP
      INSERT INTO subscriptions (follower_id, followee_id) VALUES (alice_id, target_id) ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Подписка на болванчиков
    FOR target_id IN SELECT id FROM users WHERE nick IN ('science_daily', 'history_facts', 'tech_explained')
    LOOP
      INSERT INTO subscriptions (follower_id, followee_id) VALUES (alice_id, target_id) ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END $$;
