import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // بررسی کوکی جلسه
  const session = request.cookies.get('session')?.value;
  const isAuthenticated = session === 'authenticated';

  // لیست مسیرهای عمومی (بدون نیاز به احراز هویت)
  const publicPaths = ['/login'];

  // اگر مسیر عمومی است و کاربر لاگین است، ریدایرکت به داشبورد
  if (publicPaths.includes(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // اگر مسیر خصوصی است و کاربر لاگین نیست، ریدایرکت به login
  if (!publicPaths.includes(pathname) && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
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
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
