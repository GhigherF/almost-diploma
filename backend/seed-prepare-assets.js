/**
 * Скачивает и готовит файлы для seed в seed-assets/ и uploads/seed/
 * node seed-prepare-assets.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const SEED_ASSETS_DIR = path.join(__dirname, 'seed-assets');
const UPLOADS_SEED_DIR = path.join(__dirname, 'uploads', 'seed');

const REMOTE_FILES = [
  { url: 'https://placehold.co/900x560/jpeg?text=Landscape', file: 'landscape_photo.jpg', type: 'image', mime: 'image/jpeg' },
  { url: 'https://placehold.co/800x500/png?text=Portrait', file: 'portrait_photo.png', type: 'image', mime: 'image/png' },
  {
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    file: 'mountains_photo.jpg',
    type: 'image',
    mime: 'image/jpeg',
  },
  { url: 'https://www.w3schools.com/html/mov_bbb.mp4', file: 'sample_video.mp4', type: 'video', mime: 'video/mp4' },
  { url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', file: 'reference_guide.pdf', type: 'document', mime: 'application/pdf' },
];

/** Минимальный валидный GIF 1×1 (fallback). */
const MINI_GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

function writeTextAssets() {
  const portfolio = `ПОРТФОЛИО — ОБЗОР ПРОЕКТОВ
==============================

Первый абзац: веб-приложение для управления задачами на React и Node.js,
интеграция с PostgreSQL, деплой через Docker Compose.

Второй абзац: мобильный прототип, дизайн-система в Figma, A/B-тесты лендинга,
метрики конверсии и отчёт для заказчика.`;
  fs.writeFileSync(path.join(SEED_ASSETS_DIR, 'portfolio_overview.txt'), portfolio, 'utf8');

  const rec = `РЕКОМЕНДАЦИИ КЛИЕНТОВ
========================

Первый абзац: отметили скорость отклика и понятную документацию API.

Второй абзац: просили добавить тёмную тему и экспорт отчётов в PDF —
запланировано в следующем спринте.`;
  fs.writeFileSync(path.join(SEED_ASSETS_DIR, 'client_recommendations.txt'), rec, 'utf8');

  const spec = `# Design system (draft)

## Colors
- Primary: #5b8def
- Surface: #f4f5f7

## Typography
- Headings: 700
- Body: 400, 15px

Первый абзац описывает сетку и отступы.
Второй абзац — правила для кнопок и карточек постов.`;
  fs.writeFileSync(path.join(SEED_ASSETS_DIR, 'design_system_spec.md'), spec, 'utf8');
}

async function downloadTo(url, dest) {
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000, maxRedirects: 5 });
  fs.writeFileSync(dest, Buffer.from(res.data));
  return fs.statSync(dest).size;
}

async function main() {
  fs.mkdirSync(SEED_ASSETS_DIR, { recursive: true });
  fs.mkdirSync(UPLOADS_SEED_DIR, { recursive: true });

  writeTextAssets();
  for (const name of fs.readdirSync(SEED_ASSETS_DIR)) {
    const src = path.join(SEED_ASSETS_DIR, name);
    if (!fs.statSync(src).isFile() || name === 'manifest.json') continue;
    fs.copyFileSync(src, path.join(UPLOADS_SEED_DIR, name));
  }
  console.log('  ✓ текстовые и gif-файлы скопированы в uploads/seed/');

  for (const item of REMOTE_FILES) {
    const cachePath = path.join(SEED_ASSETS_DIR, item.file);
    const uploadPath = path.join(UPLOADS_SEED_DIR, item.file);
    try {
      if (!fs.existsSync(cachePath) || fs.statSync(cachePath).size < 200) {
        console.log(`  ⬇ ${item.file}`);
        await downloadTo(item.url, cachePath);
      } else {
        console.log(`  ✓ ${item.file} (кэш)`);
      }
      fs.copyFileSync(cachePath, uploadPath);
    } catch (e) {
      console.warn(`  ✗ ${item.file}: ${e.message}`);
    }
  }

  const manifest = [];
  for (const name of fs.readdirSync(UPLOADS_SEED_DIR)) {
    const p = path.join(UPLOADS_SEED_DIR, name);
    if (!fs.statSync(p).isFile()) continue;
    const meta = REMOTE_FILES.find(r => r.file === name);
    const ext = path.extname(name).toLowerCase();
    let type = meta?.type;
    let mime = meta?.mime;
    if (!type) {
      if (ext === '.gif') { type = 'gif'; mime = 'image/gif'; }
      else if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) { type = 'image'; mime = 'image/jpeg'; }
      else if (ext === '.mp4') { type = 'video'; mime = 'video/mp4'; }
      else if (ext === '.pdf') { type = 'document'; mime = 'application/pdf'; }
      else { type = 'document'; mime = 'text/plain'; }
    }
    manifest.push({
      file: name,
      url: `/uploads/seed/${name}`,
      type,
      mime,
      name,
      size: fs.statSync(p).size,
    });
  }

  fs.writeFileSync(
    path.join(SEED_ASSETS_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );
  console.log(`\nГотово: ${manifest.length} файлов в uploads/seed/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
