<<<<<<< HEAD
# TORO Pharma Fullstack

واجهة React + Vite + Tailwind مربوطة مع Backend FastAPI + SQLite.

## الميزات

- واجهة عامة عربي / إنكليزي مع RTL و LTR.
- عرض المنتجات من قاعدة بيانات الباك إند.
- فحص كود تحقق مكوّن من 6 محارف عبر API.
- أول فحص صحيح يحوّل الكود إلى مستخدم.
- أي فحص لاحق لنفس الكود يعطي تحذير أنه أصلي لكنه مستخدم مسبقاً.
- لوحة أدمن مخفية على `/toro-control-9487`.
- تسجيل دخول أدمن بتوكن وجلسة محمية.
- إضافة / تعديل / حذف منتجات.
- إضافة كود تحقق يدوي.
- توليد أكواد تحقق دفعة واحدة حتى 50,000.
- تصدير الأكواد CSV.
- عرض سجل محاولات الفحص.
- زر واتساب عائم للرقم `+963957257941` برسالة `مرحبا`.

## تشغيل الباك إند

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

افتح توثيق الـ API:

```text
http://localhost:8000/docs
```

## تشغيل الفرونت

من جذر المشروع:

```bash
npm install
npm run dev
```

افتح:

```text
http://localhost:5173
```

## لوحة الأدمن

```text
http://localhost:5173/toro-control-9487
```

بيانات الدخول الافتراضية للتجربة المحلية:

```text
username: admin
password: admin123
```

غيّرها قبل النشر من:

```text
backend/.env
```

وخاصة هذه القيم:

```env
ADMIN_PASSWORD=CHANGE_THIS_PASSWORD
APP_SECRET_KEY=CHANGE_THIS_LONG_RANDOM_SECRET_KEY
FRONTEND_ORIGIN=https://your-domain.com
```

## أكواد تجربة

عند تشغيل الباك إند لأول مرة، يتم إنشاء هذه الأكواد تلقائياً:

```text
TR0001
TR0002
TR0003
```

`TR0003` يكون مستخدم مسبقاً للتجربة.

## ملاحظة أمنية

لا تضع أكواد التحقق داخل React. الأكواد الآن محفوظة داخل SQLite ويتم فحصها عبر FastAPI فقط. الرابط المخفي للوحة الأدمن ليس حماية كافية وحده، لذلك اللوحة مربوطة بتسجيل دخول وتوكن.
=======
# Toro-_pharma
>>>>>>> 64b76e5730a910c5f91d8162a1b5b749c8d98cd5
