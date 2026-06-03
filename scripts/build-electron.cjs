const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'dist-electron');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
fs.copyFileSync(path.join(__dirname, '..', 'electron', 'main.cjs'), path.join(outDir, 'main.cjs'));
console.log('Electron main process copied to dist-electron/main.cjs');
