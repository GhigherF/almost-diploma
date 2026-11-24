const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getPosts, getPostById, createPost, updatePost, deletePost } = require('../controllers/postsController');
const { decodeUploadOriginalName } = require('../utils/fileNames');

module.exports = (pool, upload, handleMulterError, resolveFileType) => {
  router.get('/', async (req, res) => {
    try {
      const includeViewed = req.query.includeViewed === 'true';
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;
      const result = await getPosts(pool, req.headers['authorization'], includeViewed, limit, offset);
      res.json(result);
    } catch (err) {
      console.error('[POSTS] Ошибка:', err);
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const post = await getPostById(pool, req.params.id, req.headers['authorization']);
      res.json(post);
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/', authMiddleware, upload.array('files', 20), handleMulterError, async (req, res) => {
    const { body } = req.body;
    if (!body) return res.status(400).json({ error: 'body обязателен' });
    
    try {
      const post = await createPost(pool, req.user.id, body, req.files, resolveFileType);
      res.status(201).json(post);
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  router.patch('/:id', authMiddleware, upload.array('files', 20), handleMulterError, async (req, res) => {
    const { body, filesToDelete } = req.body;
    if (!body) return res.status(400).json({ error: 'body обязателен' });
    
    try {
      // Парсим filesToDelete если это строка
      const deleteIds = filesToDelete ? JSON.parse(filesToDelete) : [];
      
      // Обновляем пост и удаляем файлы
      const post = await updatePost(pool, req.params.id, req.user.id, body, deleteIds);
      
      // Добавляем новые файлы если есть
      const savedFiles = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const { rows: fr } = await pool.query(
            `INSERT INTO post_files (post_id, file_url, file_type, original_name, mime_type, size_bytes)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [post.id, `/uploads/${file.filename}`, resolveFileType(file.mimetype),
             decodeUploadOriginalName(file.originalname), file.mimetype, file.size]
          );
          savedFiles.push(fr[0]);
        }
      }
      
      // Получаем все файлы поста
      const { rows: allFiles } = await pool.query(
        'SELECT * FROM post_files WHERE post_id = $1',
        [post.id]
      );
      
      res.json({ ...post, files: allFiles });
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/:id', authMiddleware, async (req, res) => {
    try {
      const result = await deletePost(pool, req.params.id, req.user.id, req.user.role);
      res.json(result);
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
