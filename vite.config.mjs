import { cp, copyFile, mkdir, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const rootDir = import.meta.dirname;
const outDir = resolve(rootDir, 'dist');

function preserveClassicRuntime() {
  return {
    name: 'preserve-classic-runtime',
    transformIndexHtml: {
      order: 'pre',
      handler() {
        return [{
          tag: 'script',
          attrs: { type: 'module', src: '/data/country-economics-entry.ts' },
          injectTo: 'body'
        }];
      }
    },
    async closeBundle() {
      await mkdir(outDir, { recursive: true });
      const entries = await readdir(rootDir, { withFileTypes: true });
      await Promise.all(entries
        .filter(entry => entry.isFile() && entry.name.endsWith('.js') && entry.name !== 'vite.config.js')
        .map(entry => copyFile(resolve(rootDir, entry.name), resolve(outDir, entry.name))));
      await Promise.all(['assets', 'sounds'].map(directory =>
        cp(resolve(rootDir, directory), resolve(outDir, directory), { recursive: true })
      ));
      await mkdir(resolve(outDir, 'data'), { recursive: true });
      await Promise.all(['countries.js', 'territories.js'].map(file =>
        copyFile(resolve(rootDir, 'data', file), resolve(outDir, 'data', file))
      ));
    }
  };
}

export default defineConfig({
  publicDir: false,
  build: { cssMinify: false },
  plugins: [preserveClassicRuntime()]
});
