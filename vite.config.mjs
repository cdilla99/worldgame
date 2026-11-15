import { cp, copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { securityHeaders } from './security-headers.mjs';

const rootDir = import.meta.dirname;
const outDir = resolve(rootDir, 'dist');
const sdkVersion = '2.119.0';
const sdkUrl = `/vendor/supabase-${sdkVersion}.js`;
const sdkPath = resolve(rootDir, 'node_modules/@supabase/supabase-js/dist/umd/supabase.js');
const headers = securityHeaders(process.env.EARTHLING_CSP_REPORT_ONLY === '1');

function preserveClassicRuntime() {
  return {
    name: 'preserve-classic-runtime',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = request.url?.split('?')[0];
        // These are ordered classic scripts, not Vite modules. Serving their
        // original source avoids multi-megabyte inline development sourcemaps.
        if (pathname && /^\/(?:[\w-]+\.js|assets\/globe-[\w-]+\.js|data\/(?:countries|territories|geographic-features)\.js)$/.test(pathname)) {
          try {
            const source = await readFile(resolve(rootDir, pathname.slice(1)));
            response.setHeader('Content-Type', 'text/javascript; charset=utf-8');
            response.setHeader('Cache-Control', 'no-cache');
            response.end(source);
            return;
          } catch { return next(); }
        }
        if (pathname !== sdkUrl) return next();
        response.setHeader('Content-Type', 'text/javascript; charset=utf-8');
        response.end(await readFile(sdkPath));
      });
    },
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
      await mkdir(resolve(outDir, 'vendor'), { recursive: true });
      await copyFile(sdkPath, resolve(outDir, sdkUrl.slice(1)));
      await copyFile(resolve(rootDir, 'node_modules/@supabase/supabase-js/LICENSE'), resolve(outDir, 'vendor/supabase-LICENSE'));
      await writeFile(resolve(outDir, '_headers'), '/*\n' + Object.entries(headers).map(([name, value]) => `  ${name}: ${value}`).join('\n') + '\n');
      await Promise.all(['privacy.html', 'privacy.css'].map(file =>
        copyFile(resolve(rootDir, file), resolve(outDir, file))
      ));
      const entries = await readdir(rootDir, { withFileTypes: true });
      await Promise.all(entries
        .filter(entry => entry.isFile() && entry.name.endsWith('.js') && entry.name !== 'vite.config.js')
        .map(entry => copyFile(resolve(rootDir, entry.name), resolve(outDir, entry.name))));
      await Promise.all(['assets', 'sounds'].map(directory =>
        cp(resolve(rootDir, directory), resolve(outDir, directory), { recursive: true })
      ));
      await mkdir(resolve(outDir, 'data'), { recursive: true });
      await Promise.all(['countries.js', 'territories.js', 'geographic-features.js'].map(file =>
        copyFile(resolve(rootDir, 'data', file), resolve(outDir, 'data', file))
      ));
    }
  };
}

export default defineConfig({
  publicDir: false,
  server: { headers },
  preview: { headers },
  build: { cssMinify: true },
  plugins: [preserveClassicRuntime()]
});
