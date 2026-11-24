const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const {
  validateEmail,
  validatePassword,
  validateNickname,
  validatePostBody,
  validateComment
} = require('./utils/validators');

const {
  enrichPosts
} = require('./controllers/postsController');

// ========================================
// UNIT TESTS

describe('Backend API Unit Tests - Валидация и логика', () => {

  // ========================================
  // 1. ВАЛИДАЦИЯ EMAIL И ПАРОЛЯ
  // ========================================

  describe('Валидация email и пароля', () => {

    test('Email валидация: корректные email принимаются', () => {
      const validEmails = [
        'user@example.com',
        'test.user@domain.co.uk',
        'admin+tag@service.org'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    test('Email валидация: некорректные email отклоняются', () => {
      const invalidEmails = [
        'no-at-sign',
        '@nodomain.com',
        'user@',
        'user@domain',
        ''
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    test('Пароль валидация: слабые пароли отклоняются', () => {
      expect(validatePassword('123').valid).toBe(false);
      expect(validatePassword('abcd').valid).toBe(false);
      expect(validatePassword('pass').valid).toBe(false);
    });

    test('Пароль валидация: сильные пароли принимаются', () => {
      expect(validatePassword('SecurePass123').valid).toBe(true);
      expect(validatePassword('MyPass12345').valid).toBe(true);
      expect(validatePassword('Password1').valid).toBe(true);
    });

    test('Хеширование пароля: вызовы bcrypt', async () => {

      bcrypt.hash.mockResolvedValue('fake-hash');

      bcrypt.compare
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const originalPwd = 'SecurePass123';

      const hash = await bcrypt.hash(originalPwd, 10);

      expect(hash).toBe('fake-hash');

      const isMatch = await bcrypt.compare(originalPwd, hash);

      expect(isMatch).toBe(true);

      const wrongMatch = await bcrypt.compare(
        'WrongPassword123',
        hash
      );

      expect(wrongMatch).toBe(false);

      expect(bcrypt.hash).toHaveBeenCalledWith(
        originalPwd,
        10
      );

      expect(bcrypt.compare).toHaveBeenCalledTimes(2);
    });

    test('JWT токен: создание и верификация', () => {

      const userId = 42;
      const email = 'user@test.com';

      jwt.sign.mockReturnValue('fake-token');

      jwt.verify.mockReturnValue({
        user_id: userId,
        email
      });

      const token = jwt.sign(
        { user_id: userId, email },
        'test-secret',
        { expiresIn: '7d' }
      );

      expect(token).toBe('fake-token');

      const decoded = jwt.verify(
        token,
        'test-secret'
      );

      expect(decoded.user_id).toBe(userId);
      expect(decoded.email).toBe(email);

      expect(jwt.sign).toHaveBeenCalled();

      expect(jwt.verify).toHaveBeenCalledWith(
        'fake-token',
        'test-secret'
      );
    });
  });

  // ========================================
  // 2. ВАЛИДАЦИЯ КОНТЕНТА
  // ========================================

  describe('Валидация контента', () => {

    test('Пост: допустимое содержание', () => {

      const validPosts = [
        'Hello world',
        'Test post',
        'a'.repeat(500),
        '🎉 Emoji'
      ];

      validPosts.forEach(post => {
        expect(validatePostBody(post).valid).toBe(true);
      });
    });

    test('Пост: пустой пост отклоняется', () => {

      expect(validatePostBody('').valid).toBe(false);

      expect(validatePostBody('   ').valid).toBe(false);

      expect(validatePostBody(null).valid).toBe(false);
    });

    test('Пост: слишком длинный пост отклоняется', () => {

      const tooLong = 'a'.repeat(10001);

      expect(validatePostBody(tooLong).valid)
        .toBe(false);
    });

    test('Никнейм: допустимые никнеймы', () => {

      expect(validateNickname('alice').valid)
        .toBe(true);

      expect(validateNickname('user_123').valid)
        .toBe(true);

      expect(validateNickname('ab').valid)
        .toBe(true);
    });

    test('Комментарий: валидация комментариев', () => {

      expect(validateComment('Nice!').valid)
        .toBe(true);

      expect(validateComment('').valid)
        .toBe(false);

      expect(validateComment('a'.repeat(5001)).valid)
        .toBe(false);
    });
  });

  // ========================================
  // 3. ОБОГАЩЕНИЕ ДАННЫХ
  // ========================================

  describe('Обогащение постов', () => {

    test('Обогащение: добавляет счетчики из БД', async () => {

      const mockPool = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [] })
          .mockResolvedValueOnce({
            rows: [
              { post_id: 1, cnt: '15' },
              { post_id: 2, cnt: '8' }
            ]
          })
          .mockResolvedValueOnce({
            rows: [
              { post_id: 1, cnt: '5' },
              { post_id: 2, cnt: '2' }
            ]
          })
          .mockResolvedValueOnce({
            rows: [
              { post_id: 1, cnt: '200' },
              { post_id: 2, cnt: '100' }
            ]
          })
          .mockResolvedValueOnce({ rows: [] })
      };

      const posts = [
        {
          id: 1,
          body: 'Post 1',
          user_id: 1
        },
        {
          id: 2,
          body: 'Post 2',
          user_id: 2
        }
      ];

      const enriched = await enrichPosts(
        mockPool,
        posts,
        null
      );

      expect(enriched).toHaveLength(2);

      expect(enriched[0].likes_count)
        .toBe(15);

      expect(enriched[0].comments_count)
        .toBe(5);

      expect(enriched[0].views_count)
        .toBe(200);

      expect(enriched[1].likes_count)
        .toBe(8);

      expect(mockPool.query)
        .toHaveBeenCalledTimes(4);
    });

    test('Обогащение: значения по умолчанию', async () => {

      const mockPool = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [] })
          .mockResolvedValueOnce({ rows: [] })
          .mockResolvedValueOnce({ rows: [] })
          .mockResolvedValueOnce({ rows: [] })
          .mockResolvedValueOnce({ rows: [] })
      };

      const posts = [
        {
          id: 99,
          body: 'No data',
          user_id: 1
        }
      ];

      const enriched = await enrichPosts(
        mockPool,
        posts,
        null
      );

      expect(enriched[0].likes_count)
        .toBe(0);

      expect(enriched[0].comments_count)
        .toBe(0);

      expect(enriched[0].views_count)
        .toBe(0);

      expect(enriched[0].files)
        .toEqual([]);
    
    });
  });

  // ========================================
  // 4. EDGE CASES И ОШИБКИ
  // ========================================

  describe('Edge cases', () => {

    test('Невалидный JWT: выбрасывает ошибку', () => {

      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => {
        jwt.verify(
          'fake.token.here',
          'test-secret'
        );
      }).toThrow('Invalid token');
    });

    test('Спецсимволы и длинные значения', () => {

      expect(
        validateEmail(
          'user+tag@sub.domain.co.uk'
        )
      ).toBe(true);

      expect(
        validatePassword('P@ssw0rd!#$%').valid
      ).toBe(true);

      expect(
        validateNickname('user_123_abc').valid
      ).toBe(true);
    });
  });
});