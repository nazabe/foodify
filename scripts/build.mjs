import { execFileSync } from 'node:child_process';
import { cpSync, rmSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const ORIGINAL = resolve(ROOT, 'models/original/tiny_planet_friends_3d-mug-2923.glb');
const VARIANTS = resolve(ROOT, 'models/variants');
const DEFAULT_OUT = resolve(ROOT, 'models/foodify-mug.glb');

mkdirSync(VARIANTS, { recursive: true });

const scale = 0.1; // ancho real aprox. ~11 cm (1 unidad glTF = 1 m)
const temp = (name) => resolve(VARIANTS, `_${name}.glb`);

function runGltfTransform(...args) {
  execFileSync('pnpm', ['exec', 'gltf-transform', ...args], { stdio: 'inherit' });
}

function rescale(input, output, factor) {
  execFileSync(process.execPath, [resolve(ROOT, 'scripts/rescale.mjs'), input, output, String(factor)], {
    stdio: 'inherit',
  });
}

try {
  console.log('\n=== 1) Reducir texturas (base 512 y base 1024) ===');
  runGltfTransform('resize', ORIGINAL, temp('base512'), '--width', '512', '--height', '512');
  runGltfTransform('resize', ORIGINAL, temp('base1024'), '--width', '1024', '--height', '1024');

  const geometry = [
    { ratio: '0.30', tag: 's30' },
    { ratio: '0.20', tag: 's20' },
    { ratio: '0.15', tag: 's15' },
  ];

  for (const { ratio, tag } of geometry) {
    console.log(`\n=== 2) Geometría ${tag} (keep ${ratio}) + escala ×${scale} + draco ===`);
    const plain = temp(`plain-${tag}`);
    runGltfTransform(
      'optimize',
      temp('base512'),
      plain,
      '--compress', 'false',
      '--texture-compress', 'false',
      '--simplify',
      '--simplify-ratio', ratio,
    );
    const scaled = temp(`scaled-${tag}`);
    rescale(plain, scaled, scale);
    runGltfTransform('draco', scaled, resolve(VARIANTS, `foodify-mug-${tag}.glb`));
  }

  console.log(`\n=== 3) Variante s30 con texturas 1024 (A/B calidad) ===`);
  const plain1024 = temp('plain-s30-1024');
  runGltfTransform(
    'optimize',
    temp('base1024'),
    plain1024,
    '--compress', 'false',
    '--texture-compress', 'false',
    '--simplify',
    '--simplify-ratio', '0.30',
  );
  const scaled1024 = temp('scaled-s30-1024');
  rescale(plain1024, scaled1024, scale);
  runGltfTransform('draco', scaled1024, resolve(VARIANTS, 'foodify-mug-s30-t1024.glb'));

  console.log('\n=== 4) Default = s30 (tex 512, escala real) ===');
  cpSync(resolve(VARIANTS, 'foodify-mug-s30.glb'), DEFAULT_OUT);
  console.log(`✅ Default → ${DEFAULT_OUT}`);
} finally {
  rmSync(temp('base512'), { force: true });
  rmSync(temp('base1024'), { force: true });
  rmSync(temp('plain-s30'), { force: true });
  rmSync(temp('plain-s20'), { force: true });
  rmSync(temp('plain-s15'), { force: true });
  rmSync(temp('scaled-s30'), { force: true });
  rmSync(temp('scaled-s20'), { force: true });
  rmSync(temp('scaled-s15'), { force: true });
  rmSync(temp('plain-s30-1024'), { force: true });
  rmSync(temp('scaled-s30-1024'), { force: true });
}
