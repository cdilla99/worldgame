import { createHash } from 'node:crypto';

// The existing static design-mode switch is the sole allowed inline script.
const designBootstrap = "if (new URLSearchParams(location.search).get('design') === 'atlas') document.body.classList.add('design-review');";
const designHash = createHash('sha256').update(designBootstrap).digest('base64');
// Shared by Vite preview and Netlify so browser checks exercise the deployed policy.
export const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'sha256-${designHash}' https://accounts.google.com/gsi/client`,
  "style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style",
  "connect-src 'self' https://njlklquuzrezqheikcxp.supabase.co https://accounts.google.com/gsi/ https://en.wikipedia.org",
  "img-src 'self' data: blob: https://flagcdn.com https://cdn.jsdelivr.net/npm/flag-icons@7.5.0/flags/ https://raw.githubusercontent.com/djaiss/mapsicon/master/all/ https://upload.wikimedia.org https://*.googleusercontent.com",
  "font-src 'self' https://fonts.gstatic.com",
  "media-src 'self' blob:",
  "frame-src https://accounts.google.com/gsi/",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'"
].join('; ');

export function securityHeaders(reportOnly = false) {
  return {
    [reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy']: contentSecurityPolicy,
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()'
  };
}
