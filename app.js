const mv = document.getElementById('mv');
const products = window.FOODIFY_PRODUCTS || [];
const product = products[0];

// Permite probar variantes del modelo sin redeploy: ?model=models/variants/foodify-mug-s50.glb
const MODEL_PARAM = new URLSearchParams(location.search).get('model');
const VARIANT_LABEL = MODEL_PARAM ? MODEL_PARAM.split('/').pop().replace(/\.glb$/, '') : '';

function modelUrl() {
  return MODEL_PARAM || product.model;
}

const els = {
  loading: document.getElementById('loading'),
  loadingText: document.getElementById('loading-text'),
  errorBox: document.getElementById('error-box'),
  btnRetry: document.getElementById('btn-retry'),
  status: document.getElementById('status'),
  btnAr: document.getElementById('btn-ar'),
  desktopNote: document.getElementById('desktop-note'),
  name: document.getElementById('product-name'),
  category: document.getElementById('product-category'),
  tagline: document.getElementById('product-tagline'),
  desc: document.getElementById('product-desc'),
  footYear: document.getElementById('foot-year'),
};

const UA = navigator.userAgent;
const IS_IOS =
  /iP(hone|ad|od)/i.test(UA) ||
  (UA.includes('Macintosh') && navigator.maxTouchPoints > 1);
const IS_ANDROID = /Android/i.test(UA);
const IS_HANDHELD =
  IS_IOS || IS_ANDROID || (window.matchMedia('(pointer: coarse)').matches && window.innerWidth < 900);

els.footYear.textContent = new Date().getFullYear();

function showStatus(text, kind = '', ms = 2600) {
  els.status.textContent = text;
  els.status.className = 'status' + (kind ? ' ' + kind : '');
  els.status.hidden = false;
  clearTimeout(showStatus._t);
  if (ms) showStatus._t = setTimeout(() => { els.status.hidden = true; }, ms);
}

function setLoading(percent) {
  els.loading.classList.remove('hide');
  if (percent === null) {
    els.loadingText.textContent = 'Preparando el producto…';
  } else {
    const pct = Math.round(percent * 100);
    els.loadingText.textContent = `Preparando el producto… ${Math.min(99, pct)}%`;
  }
}

function hideLoading() {
  els.loading.classList.add('hide');
}

if (!product) {
  els.errorBox.hidden = false;
  els.errorBox.querySelector('p').textContent = 'No se encontró el catálogo de productos.';
  throw new Error('FOODIFY_PRODUCTS vacío');
}

function applyProduct() {
  document.title = `${product.name} · foodify${VARIANT_LABEL ? ' · ' + VARIANT_LABEL : ''}`;
  els.name.textContent = product.name;
  els.category.textContent = product.category;
  els.tagline.textContent = product.tagline;
  els.desc.textContent = product.description;
  mv.alt = product.alt;
  mv.src = modelUrl();
  if (VARIANT_LABEL) console.log(`🧪 Variante activa: ${VARIANT_LABEL}`);
}

function absoluteModelUrl() {
  const u = new URL(modelUrl(), window.location.href);
  return u.href;
}

function openSceneViewerFallback() {
  const modelUrl = absoluteModelUrl();
  console.log('📱 Fallback AR → Scene Viewer. Modelo:', modelUrl);
  if (IS_IOS) {
    window.location.href =
      `https://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(modelUrl)}&mode=ar_preferred`;
  } else if (IS_ANDROID) {
    const intent =
      `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(modelUrl)}&mode=ar_preferred` +
      '#Intent;scheme=https;package=com.google.android.googlequicksearchbox;' +
      'action=android.intent.action.VIEW;end;';
    window.location.href = intent;
  } else {
    showStatus('AR solo disponible en celulares', 'warn');
  }
}

async function launchAR() {
  if (!mv.loaded) {
    showStatus('Esperá a que termine de cargar el modelo…', 'warn');
    return;
  }
  els.btnAr.disabled = true;
  els.btnAr.classList.add('busy');
  els.btnAr.querySelector('.btn-ar-label').textContent = 'Iniciando AR…';

  try {
    if (mv.canActivateAR) {
      console.log('🥽 Activando AR con model-viewer (canActivateAR = true)');
      await mv.activateAR();
      // WebXR queda activo: el estado se refleja vía ar-status.
    } else {
      console.log('⚠️ canActivateAR = false → fallback a Scene Viewer');
      openSceneViewerFallback();
    }
  } catch (err) {
    console.warn('⚠️ activateAR falló, usando fallback:', err);
    openSceneViewerFallback();
  } finally {
    setTimeout(() => {
      els.btnAr.disabled = false;
      els.btnAr.classList.remove('busy');
      els.btnAr.querySelector('.btn-ar-label').textContent = 'Ver en realidad aumentada';
    }, 400);
  }
}

function updateAREntry() {
  const isArUsable = IS_HANDHELD;
  els.btnAr.hidden = !isArUsable;
  els.desktopNote.hidden = isArUsable;
  if (isArUsable && mv.loaded) {
    const label = IS_IOS ? 'Ver en realidad aumentada (Quick Look)' : 'Ver en realidad aumentada';
    els.btnAr.querySelector('.btn-ar-label').textContent = label;
  }
}

// --- Eventos de model-viewer ---
mv.addEventListener('load', () => {
  hideLoading();
  els.errorBox.hidden = true;
  showStatus(`Producto listo ✅${VARIANT_LABEL ? ' (' + VARIANT_LABEL + ')' : ''}`, 'ok', 2200);
  console.log('✅ Modelo cargado');
  updateAREntry();
});

mv.addEventListener('progress', (e) => {
  const total = e.detail?.totalProgress ?? 0;
  if (total < 1) setLoading(total);
});

mv.addEventListener('error', (e) => {
  console.error('❌ Error de carga:', e.detail, e);
  hideLoading();
  els.errorBox.hidden = false;
});

mv.addEventListener('ar-status', (e) => {
  const status = e.detail?.status;
  console.log('ar-status:', status);
  if (status === 'session-started') {
    showStatus('🔮 AR activo: buscá la taza en tu espacio', 'ok', 0);
  } else if (status === 'object-placed') {
    showStatus('🎯 Taza colocada — tocá para ajustar', 'ok', 0);
  } else if (status === 'failed') {
    showStatus('No se pudo iniciar la realidad aumentada', 'warn');
  }
});

// --- Acciones ---
els.btnAr.addEventListener('click', launchAR);

els.btnRetry.addEventListener('click', () => {
  els.errorBox.hidden = true;
  setLoading(null);
  mv.src = `${modelUrl()}?t=${Date.now()}`;
});

// --- Arranque ---
applyProduct();
updateAREntry();
setLoading(null);
