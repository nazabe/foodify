# foodify — Demo de menú digital en realidad aumentada (MVP)

Demo desplegable en **GitHub Pages** para presentar a franquicias de cafeterías: un producto de catálogo (la taza) se visualiza en 3D y puede "probarse" en el espacio real con Realidad Aumentada desde el celular.

## 🚀 Demo en vivo
Una vez desplegado: `https://<usuario>.github.io/foodify/`

## 🧰 Stack
- HTML/CSS/JS vanilla, mobile-first, sin build.
- [`<model-viewer>`](https://modelviewer.dev) v4.3.1 **self-hosted** en `vendor/` (sin CDN).
- Catálogo en `products.js` → permite agregar más modelos sin tocar el HTML.

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
- ✅ Modelo optimizado: `models/foodify-mug.glb` (**~2.8 MB**, original 19 MB).
- ✅ Sombra desactivada (`shadow-intensity=0`) para estabilidad en equipos de gama media/baja.
- ✅ Variantes de escala real (`s30x008/010/013`) para calibrar el tamaño en AR.
- ⚠️ AR requiere **HTTPS y URL pública**: funciona en GitHub Pages; **no** en `localhost` desde el celular (usar `ngrok` o el deploy).

## 🛠 Comandos
```bash
pnpm install          # instala dev deps (gltf-transform)
pnpm serve            # server local: http://localhost:8080
pnpm optimize:model   # re-optimiza models/foodify-mug.glb desde models/original/
pnpm build:variants   # regenera models/variants/foodify-mug-s{100,75,50,30}.glb
```

## 🧪 Probar variantes de modelo (trade-off rendimiento/calidad)
Se puede conmutar el modelo por URL sin redeployar (todas las variantes viven en `models/variants/`):

```
https://<usuario>.github.io/foodify/?model=models/variants/foodify-mug-s100.glb  # baseline (500k triángulos)
https://<usuario>.github.io/foodify/?model=models/variants/foodify-mug-s75.glb   # ~375k
https://<usuario>.github.io/foodify/?model=models/variants/foodify-mug-s50.glb   # ~250k
https://<usuario>.github.io/foodify/?model=models/variants/foodify-mug-s30.glb   # ~189k (elegida)

# Escalas reales (misma geometría s30; ancho real aprox. del objeto)
https://<usuario>.github.io/foodify/?model=models/variants/foodify-mug-s30x008.glb  # ~9 cm
https://<usuario>.github.io/foodify/?model=models/variants/foodify-mug-s30x010.glb  # ~11 cm
https://<usuario>.github.io/foodify/?model=models/variants/foodify-mug-s30x013.glb  # ~15 cm
```

Sin parámetro se usa el modelo por defecto (`products.js`). La variante activa se muestra en el cartel de estado y en consola.

## 📁 Estructura
```
index.html          # página (producto 3D + CTA AR)
styles.css          # marca "foodify"
app.js              # lógica de carga, estados y AR
products.js         # catálogo (1 producto por ahora)
models/
  foodify-mug.glb   # modelo optimizado por defecto (committeado)
  variants/         # versiones para testear trade-off rendimiento/calidad
  original/         # fuente 19MB (ignorada por git)
vendor/
  model-viewer.min.js
```

## 🚀 Deploy en GitHub Pages
1. Push de `master`.
2. En el repo → *Settings → Pages* → Source: **Deploy from a branch**, rama `master`, carpeta `/ (root)`.
3. Abrir la URL pública desde un celular (Android e iOS) para validar AR.

## 🔮 Próximos pasos (post-pitch)
Catálogo multi-producto, más UX de marca, analítica, pedidos/checkout.
