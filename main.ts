// Neon Coast Cover Studio — entry program for gta6-cover-art-01.
// Node 22, standard library only. It hands the app in: it copies this
// repository's app/ and screenshots/ beside this file into the output
// directory and writes /output/dossier.json with the vendored make.fun
// library (vendor/makefun-app.ts, the kit's copy, unchanged).
//
// Run it locally with:
//   MAKEFUN_OUTPUT_DIR=/tmp/neon-out node main.ts
// and serve the app itself with `node serve.ts` (http://localhost:8080).
// The program writes the same bytes on every run: it copies files in
// directory order and the dossier builder is deterministic.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

if (!existsSync(join(here, 'app', 'index.html'))) {
  throw new Error('Neon Coast Cover Studio: app/index.html is missing, nothing to hand in');
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of
// app files, in all, or a path under app/ over 1000 bytes).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

// The dossier is the entry's contract with the scorer: never hand in a run
// that wrote nothing.
if (!existsSync(join(out, 'dossier.json'))) {
  throw new Error('Neon Coast Cover Studio: dossier.json was not written');
}
