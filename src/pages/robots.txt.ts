import type { APIRoute } from 'astro';
export const GET: APIRoute = () => {
  const preview = import.meta.env.PREVIEW_NOINDEX === '1' || (import.meta.env.CF_PAGES === '1' && import.meta.env.CF_PAGES_BRANCH !== 'main');
  return new Response(preview ? 'User-agent: *\nDisallow: /\n' : 'User-agent: *\nAllow: /\nSitemap: https://silverpalaceguide.com/sitemap-index.xml\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
