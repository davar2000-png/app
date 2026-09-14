import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', request.url));
  
  // پاک کردن کوکی جلسه
  response.cookies.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  return response;
}
