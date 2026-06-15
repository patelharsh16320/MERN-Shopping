const fs   = require('fs');
const path = require('path');

const LOGS_DIR   = path.join(__dirname, '..', 'logs');
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function ensureLogsDir() {
  if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });
}

function todayFilename() {
  const d = new Date();
  return path.join(LOGS_DIR, `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}.log`);
}

function purgeOldLogs() {
  try {
    const now = Date.now();
    fs.readdirSync(LOGS_DIR).forEach(f => {
      const full = path.join(LOGS_DIR, f);
      try { if (now - fs.statSync(full).mtimeMs > MAX_AGE_MS) fs.unlinkSync(full); } catch {}
    });
  } catch {}
}

ensureLogsDir();
purgeOldLogs();

// Daily purge at midnight
const msUntilMidnight = () => { const m = new Date(); m.setHours(24,0,0,0); return m - Date.now(); };
setTimeout(function tick() { purgeOldLogs(); setTimeout(tick, 86400000); }, msUntilMidnight());

function appendLog(line) {
  try { ensureLogsDir(); fs.appendFileSync(todayFilename(), line + '\n', 'utf8'); } catch {}
}

function pad(n) { return String(n).padStart(2, '0'); }

function formatTime(d) {
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Decode JWT payload without verifying (just for logging)
function decodeToken(req) {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return null;
    return JSON.parse(Buffer.from(auth.split('.')[1], 'base64').toString('utf8'));
  } catch { return null; }
}

// Detect notable events to add a tag after the URL
function eventTag(req, body) {
  const url = req.originalUrl;
  const m   = req.method;
  if (m === 'POST' && url.includes('/auth/login'))    return '[LOGIN]';
  if (m === 'POST' && url.includes('/auth/register')) return '[REGISTER]';
  if (m === 'PUT'  && url.includes('/auth/profile'))  return '[PROFILE_UPDATE]';
  if (m === 'PUT'  && url.includes('/users/') && body?.email) return '[EMAIL_CHANGE]';
  if (m === 'PUT'  && url.includes('/reset-password'))       return '[PASSWORD_RESET]';
  if (m === 'POST' && url.includes('/orders'))        return '[ORDER_PLACED]';
  return '';
}

module.exports = function requestLogger(req, res, next) {
  const start   = Date.now();
  const payload = decodeToken(req);
  const userId  = payload?.id || null;

  // Capture body for event detection (body is already parsed by express.json())
  const body = req.body;

  res.on('finish', () => {
    const ms  = Date.now() - start;
    const ip  = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '-').split(',')[0].trim();
    const tag = res.statusCode < 400 ? eventTag(req, body) : '';

    // For login, capture the email from the request body for traceability
    let extra = '';
    if (tag === '[LOGIN]' || tag === '[REGISTER]')  extra = `  email=${body?.email || '?'}`;
    if (tag === '[EMAIL_CHANGE]')                    extra = `  new_email=${body?.email || '?'}`;
    if (tag === '[PROFILE_UPDATE]' && body?.name)    extra = `  name=${body.name}`;

    const line = [
      formatTime(new Date()),
      ip.padEnd(20),
      (userId || 'guest').padEnd(28),
      req.method.padEnd(7),
      String(res.statusCode).padEnd(4),
      `${ms}ms`.padEnd(8),
      req.originalUrl,
      tag,
      extra,
    ].join('  ').trimEnd();

    appendLog(line);
  });

  next();
};
