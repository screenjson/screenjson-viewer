import { rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packagePath = resolve(root, 'node_modules/screenjson-ui');
const spec =
  'screenjson-ui@https://github.com/screenjson/screenjson-ui/archive/refs/heads/develop.tar.gz';

rmSync(packagePath, { recursive: true, force: true });

const result = spawnSync(
  'npm',
  ['install', '--ignore-scripts', '--force', spec],
  {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  }
);

process.exit(result.status ?? 1);
