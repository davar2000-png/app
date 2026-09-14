import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "مدیریت فروشگاه موبایل",
  description: "سیستم مدیریت فروشگاه موبایل - نسخه وب",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="font-vazir antialiased">
        {children}
      </body>
    </html>
  );
}
