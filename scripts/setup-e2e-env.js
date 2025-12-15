#!/usr/bin/env node
import { copyFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

try {
  copyFileSync(
    resolve(rootDir, '.env.e2e'),
    resolve(rootDir, '.env.test')
  );
  // eslint-disable-next-line no-console
  console.log('✓ Copied .env.e2e to .env.test');
} catch (error) {
  console.error('✗ Failed to copy .env.e2e:', error.message);
  process.exit(1);
}
