const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SEED_ASSETS_DIR = path.join(__dirname, '..', 'seed-assets');
const UPLOADS_SEED_DIR = path.join(__dirname, '..', 'uploads', 'seed');
const MANIFEST_PATH = path.join(SEED_ASSETS_DIR, 'manifest.json');

const REQUIRED_FILES = [
  'landscape_photo.jpg',
  'sample_video.mp4',
  'reference_guide.pdf',
];

/** Копирует встроенные в образ файлы в volume uploads/seed (переживает rebuild). */
function syncSeedAssetsFromBundle() {
  fs.mkdirSync(UPLOADS_SEED_DIR, { recursive: true });

  if (!fs.existsSync(SEED_ASSETS_DIR)) {
    console.warn('[SEED] Нет каталога seed-assets в образе');
    return false;
  }

  let copied = 0;
  for (const name of fs.readdirSync(SEED_ASSETS_DIR)) {
    if (name === 'manifest.json') continue;
    const src = path.join(SEED_ASSETS_DIR, name);
    if (!fs.statSync(src).isFile()) continue;
    const dest = path.join(UPLOADS_SEED_DIR, name);
    const needCopy = !fs.existsSync(dest) || fs.statSync(dest).size !== fs.statSync(src).size;
    if (needCopy) {
      fs.copyFileSync(src, dest);
      copied++;
    }
  }

  if (copied) console.log(`[SEED] Скопировано в uploads/seed: ${copied} файл(ов)`);

  const missing = REQUIRED_FILES.filter((f) => !fs.existsSync(path.join(UPLOADS_SEED_DIR, f)));
  if (missing.length) {
    console.log(`[SEED] Не хватает файлов (${missing.join(', ')}), пробуем seed-prepare-assets.js...`);
    try {
      execSync('node seed-prepare-assets.js', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
      });
    } catch (e) {
      console.warn('[SEED] prepare не удался:', e.message);
    }
  }

  rebuildManifest();
  return !REQUIRED_FILES.some((f) => !fs.existsSync(path.join(UPLOADS_SEED_DIR, f)));
}

function rebuildManifest() {
  const REMOTE_META = {
    'landscape_photo.jpg': { type: 'image', mime: 'image/jpeg' },
    'portrait_photo.png': { type: 'image', mime: 'image/png' },
    'mountains_photo.jpg': { type: 'image', mime: 'image/jpeg' },
    'loading_animation.gif': { type: 'gif', mime: 'image/gif' },
    'sample_video.mp4': { type: 'video', mime: 'video/mp4' },
    'reference_guide.pdf': { type: 'document', mime: 'application/pdf' },
  };

  const manifest = [];
  if (!fs.existsSync(UPLOADS_SEED_DIR)) return manifest;

  for (const name of fs.readdirSync(UPLOADS_SEED_DIR)) {
    const p = path.join(UPLOADS_SEED_DIR, name);
    if (!fs.statSync(p).isFile()) continue;
    const meta = REMOTE_META[name] || {};
    const ext = path.extname(name).toLowerCase();
    let type = meta.type;
    let mime = meta.mime;
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

  fs.mkdirSync(SEED_ASSETS_DIR, { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
  return manifest;
}

function loadAttachmentPool() {
  syncSeedAssetsFromBundle();
  if (fs.existsSync(MANIFEST_PATH)) {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  }
  return rebuildManifest();
}

module.exports = { syncSeedAssetsFromBundle, loadAttachmentPool, UPLOADS_SEED_DIR, MANIFEST_PATH };
