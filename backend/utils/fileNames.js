const path = require('path');
const { v4: uuidv4 } = require('uuid');

/** Исправляет кириллицу, испорченную multer/busboy (latin1 вместо utf8). */
function decodeUploadOriginalName(name) {
  if (!name || typeof name !== 'string') return 'file';
  if (/[ÃÐÑÂ]/.test(name)) {
    try {
      const decoded = Buffer.from(name, 'latin1').toString('utf8');
      if (decoded && decoded !== name) return decoded;
    } catch (_) { /* ignore */ }
  }
  return name;
}

/** Имя на диске: uuid + исходное имя (для отладки), отображение — original_name в БД. */
function safeStorageFileName(originalName) {
  const original = decodeUploadOriginalName(originalName);
  const ext = path.extname(original) || '';
  const stem = path.basename(original, ext)
    .replace(/[^\w.\-()\u0400-\u04FF ]/gi, '_')
    .replace(/_+/g, '_')
    .trim()
    .slice(0, 72) || 'file';
  return `${uuidv4()}_${stem}${ext}`.slice(0, 180);
}

module.exports = { decodeUploadOriginalName, safeStorageFileName };
