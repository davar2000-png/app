import { redirect } from 'next/navigation';

export default function Home() {
  // ریدایرکت خودکار به صفحه ورود
  redirect('/login');
}
