import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  const hostname = req.headers.get('host') || '';
  
  // Exclude vercel domains, localhost, or the root domain
  const isVercel = hostname.includes('vercel.app');
  const isLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1');
  
  // Base domains we want to ignore for wildcard routing
  const baseDomains = ['status.vestcodes.co', 'vestcodes.co', 'www.status.vestcodes.co'];

  // Only rewrite if it's not a base domain, not vercel, not local, and not an API/static route
  if (
    !isVercel &&
    !isLocal &&
    !baseDomains.includes(hostname) &&
    !req.nextUrl.pathname.startsWith('/api') &&
    !req.nextUrl.pathname.startsWith('/_next')
  ) {
    // Attempt to extract subdomain
    const subdomain = hostname.split('.')[0];
    
    // Rewrite to the product specific page
    if (subdomain && subdomain !== 'status') {
      return NextResponse.rewrite(new URL(`/status/${subdomain}`, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
