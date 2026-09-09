# foodify — Demo de menú digital en realidad aumentada (MVP)

Demo desplegable en **GitHub Pages** para presentar a franquicias de cafeterías: un producto de catálogo (la taza) se visualiza en 3D y puede "probarse" en el espacio real con Realidad Aumentada desde el celular.

## 🚀 Demo en vivo
Una vez desplegado: `https://<usuario>.github.io/foodify/`

## 🧰 Stack
- HTML/CSS/JS vanilla, mobile-first, sin build.
- [`<model-viewer>`](https://modelviewer.dev) v4.3.1 vía **CDN** (unpkg, Brotli + caché compartida) para carga rápida en mobile.
- Catálogo en `products.js` → permite agregar más modelos sin tocar el HTML.
- Optimización de modelos con `@gltf-transform` (dev).

## 🎯 Compatibilidad de AR
| Dispositivo | Comportamiento |
|---|---|
| Desktop | Visor 3D (sin AR) + nota "probalo en tu celular" |
| Android con WebXR / ARCore | AR nativo integrado (`activateAR`) |
| Android sin ARCore | Fallback a **Google Scene Viewer** (AR si el equipo lo soporta, o vista 3D del objeto) |
| iOS / iPadOS | AR Quick Look (model-viewer genera el USDZ) |

El CTA propio se muestra en móviles; ante cualquier imposibilidad se redirige a Scene Viewer con la URL absoluta del modelo (resuelta dinámicamente, funciona bajo la subruta `/foodify/`).

## 🧪 Estado
- ✅ Visor 3D funcional (rotación, zoom, sombra, carga con progreso).
- ✅ CTA de AR con estados claros y fallback determinístico.
- ✅ Modelo default optimizado para carga mobile: `models/foodify-mug.glb` = **s30 (~189k triángulos) · texturas 512 · escala real (~11 cm)** → **~1 MB** (original 19 MB).
- ⚠️ AR requiere **HTTPS y URL pública**: funciona en GitHub Pages; **no** en `localhost` desde el celular (usar `ngrok` o el deploy).

## 🛠 Comandos
```bash
pnpm install          # instala dev deps (gltf-transform, core, extensions)
pnpm serve            # server local: http://localhost:8080
pnpm build:models     # reconstruye default + variantes desde models/original/
```

## 🧪 Probar variantes de modelo (trade-off rendimiento/calidad)
Se puede conmutar el modelo por URL sin redeployar (todas las variantes viven en `models/variants/`):

```
https://<usuario>.github.io/foodify/?model=models/variants/foodify-mug-s30.glb   # default (escala real ~11 cm, tex 512)
https://<usuario>.github.io/foodify/?model=models/variants/foodify-mug-s20.glb   # geometría más liviana (tex 512)
https://<usuario>.github.io/foodify/?model=models/variants/foodify-mug-s15.glb   # geometría mínima (tex 512)
https://<usuario>.github.io/foodify/?model=models/variants/foodify-mug-s30-t1024.glb  # misma geometría pero texturas 1024 (A/B calidad)
```

Sin parámetro se usa el modelo por defecto (`models/foodify-mug.glb`, s30). La variante activa se muestra en el cartel de estado y en consola.

## 📁 Estructura
```
index.html          # página (producto 3D + CTA AR)
styles.css          # marca "foodify"
app.js              # lógica de carga, estados y AR
products.js         # catálogo (1 producto por ahora)
scripts/
  build.mjs         # pipeline de modelos (resize → simplify → escala real → draco)
  rescale.mjs       # multiplica la escala de los nodos del modelo (metros reales)
models/
  foodify-mug.glb   # modelo default (s30, escala real, tex 512) ~1 MB
  variants/         # s30/s20/s15 + s30-t1024 para A/B
  original/         # fuente 19MB (ignorada por git)
```

## 🚀 Deploy en GitHub Pages
1. Push de `master`.
2. En el repo → *Settings → Pages* → Source: **Deploy from a branch**, rama `master`, carpeta `/ (root)`.
3. Abrir la URL pública desde un celular (Android e iOS) para validar AR.

## 🔮 Próximos pasos (post-pitch)
Catálogo multi-producto, más UX de marca, analítica, pedidos/checkout.
