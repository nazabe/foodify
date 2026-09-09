// Panel de diagnóstico (solo logging, sin cambiar comportamiento).
const mv = document.getElementById('mv');

const diagPanel = document.getElementById('diag-panel');
const diagBtn = document.getElementById('btn-diag');
const diagLive = document.getElementById('diag-live');
const diagLog = document.getElementById('diag-log');
const diagCopy = document.getElementById('diag-copy');
const diagClear = document.getElementById('diag-clear');
const diagClose = document.getElementById('diag-close');

const MAX_LINES = 80;
const lines = [];
let sessionActive = false;
let lastVisible = null;
let canvasHooked = false;

function fmtTime() {
  const d = new Date();
  const p = (n, l = 2) => String(n).padStart(l, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
}

function push(text) {
  lines.push(`[${fmtTime()}] ${text}`);
  if (lines.length > MAX_LINES) lines.shift();
  const li = document.createElement('li');
  li.textContent = lines[lines.length - 1];
  diagLog.appendChild(li);
  while (diagLog.childElementCount > MAX_LINES) diagLog.firstElementChild.remove();
  diagLog.scrollTop = diagLog.scrollHeight;
  console.log(`[diag] ${text}`);
}

function log(evt, extra = '') {
  push(`${evt}${extra ? ' — ' + extra : ''}`);
}

// --- Estado de la sesión AR ---
mv.addEventListener('ar-status', (e) => {
  const status = e.detail?.status;
  if (!status) return;
  if (status === 'session-started') {
    sessionActive = true;
    log('ar-status: session-started', `memory=${navigator.deviceMemory ?? '?'}GB`);
  } else if (status === 'failed') {
    sessionActive = false;
    log('ar-status: failed');
  } else if (status === 'not-presenting') {
    sessionActive = false;
    log('ar-status: not-presenting');
  } else {
    log(`ar-status: ${status}`);
  }
});

mv.addEventListener('load', () => log('model: load'));
mv.addEventListener('error', (e) => log('model: error', String(e.detail ?? '')));

// --- modelIsVisible (detección del instante en que se oculta el modelo) ---
setInterval(() => {
  const visible = typeof mv.modelIsVisible === 'boolean' ? mv.modelIsVisible : null;
  if (visible === null || visible === lastVisible) return;
  const prev = lastVisible;
  lastVisible = visible;
  // Solo interesan las transiciones durante AR (o cuando deja de verse tras haber estado visible).
  if (sessionActive || prev === true) {
    log(`modelIsVisible: ${prev} → ${visible}`);
  }
}, 400);

// --- Contexto WebGL del canvas (descartar/confirmar pérdida de contexto) ---
function hookCanvas() {
  if (canvasHooked) return true;
  const shadow = mv.shadowRoot;
  if (!shadow) return false;
  const canvas = shadow.querySelector('canvas');
  if (!canvas) return false;
  canvas.addEventListener('webglcontextlost', (ev) => {
    log('webglcontextlost', `wasAr=${sessionActive}`);
    ev.preventDefault();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    log('webglcontextrestored', `wasAr=${sessionActive}`);
  });
  canvasHooked = true;
  log('canvas: hooked listeners');
  return true;
}
let hookAttempts = 0;
const hookTimer = setInterval(() => {
  if (hookCanvas() || ++hookAttempts > 60) clearInterval(hookTimer);
}, 500);

// --- Visibilidad de pestaña / app ---
document.addEventListener('visibilitychange', () => {
  log('visibilitychange', document.visibilityState);
});
window.addEventListener('blur', () => log('window: blur'));
window.addEventListener('focus', () => log('window: focus'));

// --- Interfaz del panel ---
function refreshLive() {
  const arStatus = mv.getAttribute('ar-status') || 'n/a';
  const mem = navigator.deviceMemory ? navigator.deviceMemory + 'GB' : '?';
  diagLive.textContent = `AR:${arStatus} · visible:${lastVisible ?? '?'} · ${mem}`;
}

diagBtn.addEventListener('click', () => {
  diagPanel.hidden = !diagPanel.hidden;
  if (!diagPanel.hidden) refreshLive();
});

diagClose.addEventListener('click', () => { diagPanel.hidden = true; });
diagClear.addEventListener('click', () => {
  lines.length = 0;
  diagLog.textContent = '';
  log('log limpiado');
});

diagCopy.addEventListener('click', async () => {
  const text = lines.join('\n');
  try {
    await navigator.clipboard.writeText(text);
    diagCopy.textContent = '✓ Copiado';
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    diagCopy.textContent = '✓ Copiado';
  }
  setTimeout(() => { diagCopy.textContent = 'Copiar'; }, 1500);
});

setInterval(refreshLive, 1000);
log('diagnóstico listo', `memory=${navigator.deviceMemory ?? '?'}GB`);
