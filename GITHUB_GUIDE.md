# 📤 راهنمای آپلود در GitHub

## 🎯 مراحل کامل آپلود پروژه در GitHub

### مرحله ۱: نصب Git

اگر Git نصب نیست، از لینک زیر دانلود و نصب کنید:
- **ویندوز**: https://git-scm.com/download/win
- **مک**: https://git-scm.com/download/mac
- **لینوکس**: `sudo apt install git`

### مرحله ۲: تنظیم Git

```bash
# تنظیم نام کاربری
git config --global user.name "davar2000-png"

# تنظیم ایمیل
git config --global user.email "your-email@example.com"
```

### مرحله ۳: ساخت ریپازیتوری در GitHub

1. به https://github.com/new بروید
2. نام ریپازیتوری: `store-appnew`
3. توضیحات: "سیستم حسابداری فروشگاه"
4. **Public** را انتخاب کنید
5. **تیک "Add README" را نزنید** (چون ما README داریم)
6. دکمه **Create repository** را بزنید

### مرحله ۴: Push کردن کد به GitHub

در ترمینال یا Command Prompt، دستورات زیر را اجرا کنید:

```bash
# رفتن به پوشه پروژه
cd path/to/your/project

# مقداردهی اولیه Git
git init

# اضافه کردن همه فایل‌ها
git add .

# اولین commit
git commit -m "Initial commit: سیستم حسابداری فروشگاه"

# اضافه کردن ریپازیتوری remote
git remote add origin https://github.com/davar2000-png/store-appnew.git

# تغییر نام branch به main
git branch -M main

# Push به GitHub
git push -u origin main
```

### مرحله ۵: تأیید

1. به https://github.com/davar2000-png/store-appnew بروید
2. صفحه را رفرش کنید
3. باید همه فایل‌ها را ببینید ✅

---

## 🔄 به‌روزرسانی کد در GitHub

هر زمان تغییراتی در کد ایجاد کردید:

```bash
# اضافه کردن تغییرات
git add .

# commit کردن
git commit -m "توضیح تغییرات"

# push به GitHub
git push
```

---

## 🌐 آپلود روی GitHub Pages (اختیاری)

اگر می‌خواهید برنامه به صورت آنلاین در دسترس باشد:

### روش ۱: استفاده از GitHub Pages

1. ابتدا build بگیرید:
```bash
npm run build
```

2. فایل `vite.config.ts` را ویرایش کنید و این خط را اضافه کنید:
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/store-appnew/',
})
```

3. دوباره build بگیرید:
```bash
npm run build
```

4. به تنظیمات ریپازیتوری بروید:
   - Settings → Pages
   - Source را روی **Deploy from a branch** قرار دهید
   - Branch را روی **gh-pages** و پوشه **/ (root)** قرار دهید
   - Save کنید

5. بعد از چند دقیقه، برنامه در آدرس زیر در دسترس خواهد بود:
   ```
   https://davar2000-png.github.io/store-appnew/
   ```

### روش ۲: استفاده از Vercel (پیشنهادی)

1. به https://vercel.com بروید
2. با GitHub لاگین کنید
3. دکمه **New Project** را بزنید
4. ریپازیتوری `store-appnew` را انتخاب کنید
5. تنظیمات را تأیید کنید
6. Deploy کنید

برنامه در عرض ۲ دقیقه آنلاین می‌شود! 🎉

---

## 📋 دستورات مفید Git

### مشاهده وضعیت
```bash
git status
```

### مشاهده تاریخچه commit ها
```bash
git log
```

### بازگشت به commit قبلی
```bash
git reset --hard HEAD~1
```

### ایجاد branch جدید
```bash
git checkout -b feature-name
```

### مرج کردن branch
```bash
git merge feature-name
```

---

## ⚠️ نکات مهم

### قبل از push:

1. **فایل .gitignore** را بررسی کنید
2. مطمئن شوید `node_modules` و `dist` اضافه نمی‌شوند
3. اطلاعات حساس (پسورد، API key) را اضافه نکنید

### اگر مشکل پیش آمد:

```bash
# حذف و اضافه کردن دوباره remote
git remote remove origin
git remote add origin https://github.com/davar2000-png/store-appnew.git

# Force push (با احتیاط!)
git push -f origin main
```

---

## 🎯 خلاصه دستورات

```bash
# یک بار انجام دهید:
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/davar2000-png/store-appnew.git
git branch -M main
git push -u origin main

# هر بار که تغییر دادید:
git add .
git commit -m "توضیح تغییرات"
git push
```

---

**موفق باشید! 🚀**
