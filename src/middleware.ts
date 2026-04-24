import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // Exclude Vercel preview domains, localhost
  const isVercel = hostname.includes('vercel.app');
  const isLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1');

  // Base domains (not subdomains)
  const baseDomains = ['status.vestcodes.co', 'vestcodes.co', 'www.status.vestcodes.co'];

  // Skip static files, API routes, and base domains
  if (
    !isVercel &&
    !isLocal &&
    !baseDomains.includes(hostname) &&
    !url.pathname.startsWith('/api') &&
    !url.pathname.startsWith('/_next') &&
    !url.pathname.startsWith('/admin')
  ) {
    // Determine the subdomain from something like "portexa.status.vestcodes.co"
    // e.g. hostname.replace('.status.vestcodes.co', '')
    // Or dynamically check if it ends with .status.vestcodes.co
    let subdomain = hostname.split('.')[0];
    
    // Explicitly handle "slug.status.vestcodes.co" pattern
    if (hostname.endsWith('.status.vestcodes.co')) {
      subdomain = hostname.replace('.status.vestcodes.co', '');
    }

    if (subdomain && subdomain !== 'status' && subdomain !== 'www') {
      // Rewrite to /status/[slug]/[...path]
      // e.g., portexa.status.vestcodes.co/incidents -> /status/portexa/incidents
      const search = url.search;
      return NextResponse.rewrite(new URL(`/status/${subdomain}${url.pathname}${search}`, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
