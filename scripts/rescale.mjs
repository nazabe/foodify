import { readFile } from 'node:fs/promises';
import { NodeIO } from '@gltf-transform/core';
import { KHRMaterialsSpecular } from '@gltf-transform/extensions';

const [, , input, output, factorArg] = process.argv;
const factor = Number(factorArg);

if (!input || !output || !Number.isFinite(factor)) {
  console.error('uso: node scripts/rescale.mjs <input.glb> <output.glb> <factor>');
  process.exit(1);
}

const io = new NodeIO().registerExtensions([KHRMaterialsSpecular]);
const doc = await io.read(input);
const root = doc.getRoot();
let scaled = 0;

for (const node of root.listNodes()) {
  if (node.getMesh()) {
    const [x, y, z] = node.getScale();
    node.setScale([x * factor, y * factor, z * factor]);
    scaled++;
  }
}

if (scaled === 0) {
  console.error('No se encontraron nodos con mesh para escalar.');
  process.exit(1);
}

await io.write(output, doc);
console.log(`✅ Escalado x${factor}: ${scaled} nodo(s) → ${output}`);
