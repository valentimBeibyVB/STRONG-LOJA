import defaultLogo from '../assets/images/strong-logo.jpg';
import defaultLogoOpt from '../assets/images/strong-logo-opt.jpg';

export const DEFAULT_BRAND_LOGO = defaultLogoOpt || defaultLogo;
export const DEFAULT_BRAND_LOGO_HIGHRES = defaultLogo;

/**
 * Resolves a logo URL so that it works seamlessly on:
 * - Localhost / dev server
 * - Subdirectory hosting such as GitHub Pages (https://user.github.io/repo-name/)
 * - Cloud Run / preview containers
 * - Mobile devices (iOS Safari, Android Chrome)
 * - Static export or offline cache
 */
export function resolveLogoUrl(url?: string | null): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return DEFAULT_BRAND_LOGO;
  }

  const trimmed = url.trim();

  // If it's an inlined base64 data URL, use it directly (e.g., uploaded in admin)
  if (trimmed.startsWith('data:')) {
    return trimmed;
  }

  // If it's a full remote URL (http:// or https://), use it directly
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // If it matches known default filenames, use the bundled Vite asset
  // This guarantees Vite generates a relative URL compatible with GitHub Pages subpaths
  const knownDefaultNames = [
    '/strong-logo.jpg',
    'strong-logo.jpg',
    './strong-logo.jpg',
    '/strong-logo-opt.jpg',
    'strong-logo-opt.jpg',
    './strong-logo-opt.jpg',
    '/logo.jpg',
    'logo.jpg',
    './logo.jpg'
  ];

  if (knownDefaultNames.includes(trimmed)) {
    return DEFAULT_BRAND_LOGO;
  }

  // If it's a path starting with '/', adapt to Vite base URL for subfolder hosting
  if (trimmed.startsWith('/')) {
    const baseUrl = import.meta.env.BASE_URL || './';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    return `${cleanBase}${trimmed.slice(1)}`;
  }

  return trimmed;
}
