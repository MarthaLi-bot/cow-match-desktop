const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const viteBin = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite');
const outDir = path.join(root, 'dist');

function copyElectronMain() {
  const electronOut = path.join(root, 'dist-electron');
  fs.rmSync(electronOut, { recursive: true, force: true });
  fs.mkdirSync(electronOut, { recursive: true });
  fs.copyFileSync(path.join(root, 'electron', 'main.cjs'), path.join(electronOut, 'main.cjs'));
}

function fallbackBuild() {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(outDir, 'assets', 'icons'), { recursive: true });
  fs.copyFileSync(path.join(root, 'src', 'fallback-app.js'), path.join(outDir, 'assets', 'app.js'));
  fs.copyFileSync(path.join(root, 'src', 'fallback-styles.css'), path.join(outDir, 'assets', 'styles.css'));
  fs.readdirSync(path.join(root, 'src', 'assets', 'icons')).forEach((file) => {
    if (file.endsWith('.svg')) {
      fs.copyFileSync(path.join(root, 'src', 'assets', 'icons', file), path.join(outDir, 'assets', 'icons', file));
    }
  });
  fs.writeFileSync(path.join(outDir, 'index.html'), `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>牛了个牛</title>
<link rel="stylesheet" href="./assets/styles.css" />
</head>
<body>
<div id="root"></div>
<script type="module" src="./assets/app.js"></script>
</body>
</html>
`);
  console.log('Built dependency-free fallback dist because node_modules/.bin/vite is unavailable.');
}

if (fs.existsSync(viteBin)) {
  const result = spawnSync(viteBin, ['build'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status ?? 1);
} else {
  fallbackBuild();
}

copyElectronMain();
console.log('Electron main process copied to dist-electron/main.cjs');
