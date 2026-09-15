import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'نام کاربری و رمز عبور الزامی است' },
        { status: 400 }
      );
    }

    // پیدا کردن کاربر
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'نام کاربری یا رمز عبور اشتباه است' },
        { status: 401 }
      );
    }

    // بررسی رمز عبور
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'نام کاربری یا رمز عبور اشتباه است' },
        { status: 401 }
      );
    }

    // ایجاد response با کوکی جلسه
    const response = NextResponse.json(
      { success: true, message: 'ورود موفقیت‌آمیز بود' },
      { status: 200 }
    );

    // تنظیم کوکی امن (در تولید باید HTTPS باشد)
    response.cookies.set('session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 روز
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'خطا در سرور' },
      { status: 500 }
    );
  }
}
