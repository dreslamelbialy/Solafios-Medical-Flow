# 🧪 Solafios Mediflow — Full Project Specification Document
إصدار: 1.0  
تاريخ: 2026-10-07  
إعداد: إسلام + Copilot

---

## 📘 1. Overview

**Mediflow** هو تطبيق ويب لإدارة الأدوية، يساعد المستخدم على:

- إدخال الأدوية يدويًا  
- تنظيم الجرعات اليومية  
- حساب مواعيد الجرعات تلقائيًا  
- إنشاء جدول علاجي كامل  
- تذكير المستخدم بمواعيد الجرعات  
- حفظ سجل الأدوية  
- إضافة زر Scan Prescription (غير مفعل الآن — Coming Soon)

---

## 🧩 2. Technology Stack

### ✔ Frontend
- HTML  
- CSS  
- JavaScript / TypeScript  
- Tabs-based UI  
- Responsive Design (Mobile-first)

### ✔ Backend
- Supabase  
  - Database  
  - Auth  
  - Storage  
  - Policies  
  - Supabase JS Client

### ✔ Future Features
- Supabase Edge Functions (للـ Scan لاحقًا)

---

## 🧩 3. Application Structure (Tabs)

التطبيق يحتوي على Tabs رئيسية:

### 1) Add Medicine — إضافة دواء
Tab لإدخال بيانات الدواء يدويًا.

### 2) Schedule — جدول الجرعات
يعرض الجرعات المحسوبة تلقائيًا.

### 3) Reminders — التذكيرات
يعرض التذكيرات اليومية.

### 4) History — سجل الأدوية
يعرض الأدوية السابقة والمنتهية.

### 5) Settings — الإعدادات
إعدادات المستخدم + أوقات الوجبات.

### 6) Scan Prescription (Coming Soon)
زر placeholder فقط  
لا يعمل الآن  
نرجع له لاحقًا.

---

## 🧩 4. Add Medicine Tab — Full Form Specification

### الحقول المطلوبة:

| Field | Type | Description |
|------|------|-------------|
| name | string | اسم الدواء |
| strength | string | تركيز الدواء |
| dose | string | الجرعة (قرص/نصف/مل) |
| pills_per_dose | number | عدد الحبات في الجرعة |
| times_per_day | number | عدد مرات الاستخدام يوميًا |
| schedule | enum | قبل/بعد الفطار، الغداء، العشاء، قبل النوم، بعد الاستيقاظ |
| first_dose_time | datetime | بداية أول جرعة |
| duration | number | مدة العلاج بالأيام |
| notes | string | ملاحظات الطبيب |
| type | enum | tablet / syrup / injection / drops / cream |

---

## 🧩 5. Schedule Calculation Logic

بعد إدخال:

- times_per_day  
- first_dose_time  
- schedule  

يتم حساب الجرعات تلقائيًا:

### مثال:

- أول جرعة: 08:30  
- عدد الجرعات: 3 مرات يوميًا  
- الجرعات:  
  - 08:30  
  - 16:30  
  - 00:30  

### لو schedule مرتبط بوجبة:

- قبل الفطار → قبل وقت الفطار المحدد في Settings  
- بعد الغداء → بعد وقت الغداء المحدد  
- قبل النوم → قبل وقت النوم المحدد

---

## 🧩 6. Database Schema (Supabase)

### Table: medicines

| Column | Type |
|--------|------|
| id | uuid |
| user_id | uuid |
| name | text |
| strength | text |
| dose | text |
| pills_per_dose | int |
| times_per_day | int |
| schedule | text |
| first_dose_time | timestamp |
| duration | int |
| notes | text |
| type | text |
| created_at | timestamp |

### Table: doses_schedule

| Column | Type |
|--------|------|
| id | uuid |
| medicine_id | uuid |
| dose_time | timestamp |
| taken | boolean |
| created_at | timestamp |

### Table: reminders

| Column | Type |
|--------|------|
| id | uuid |
| medicine_id | uuid |
| reminder_time | timestamp |
| status | text |
| created_at | timestamp |

---

## 🧩 7. Settings Tab

### الحقول:

- breakfast_time  
- lunch_time  
- dinner_time  
- sleep_time  
- wake_time  

تستخدم لحساب الجرعات المرتبطة بالوجبات.

---

## 🧩 8. Scan Prescription Tab (Placeholder)

### زر واحد:

```
<button disabled>
  Scan Prescription (Coming Soon)
</button>
```

### وظيفة مستقبلية:

- رفع صورة الروشتة  
- إرسالها لـ Supabase Edge Function  
- استخراج الأدوية تلقائيًا  
- إدخالها في جدول medicines

---

## 🧩 9. Required Tests

### Functional Tests

- إدخال دواء كامل  
- إدخال دواء ناقص البيانات  
- حساب الجرعات  
- انتهاء مدة العلاج  
- عرض جدول الجرعات  
- عرض سجل الأدوية  
- تعديل إعدادات الوجبات  
- زر Scan يعمل كـ placeholder

### UI Tests

- استجابة الواجهة  
- Tabs تعمل بدون مشاكل  
- Validation للحقول

### Integration Tests

- Supabase Insert  
- Supabase Select  
- Supabase Auth  
- Supabase Policies

---

## 🧩 10. Final Deliverables

Language Model يجب أن ينتج:

### 1) Full Web App  
HTML + CSS + JS / React  
كل Tabs جاهزة.

### 2) Supabase Integration  
ملف JS للاتصال بـ Supabase.

### 3) Database Setup  
ملف SQL لإنشاء الجداول.

### 4) Documentation  
ملف:

```
IMPLEMENTATION-NOTES.md
```

يشرح كل اللي اتعمل.

---

## 🧩 11. Final Instruction for the Language Model

> **Instruction to the Language Model:**  
> Build the full Mediflow application exactly as specified in this document.  
> Create all tabs, all pages, all logic, all database tables, and all integrations.  
> Generate a full documentation file named `IMPLEMENTATION-NOTES.md` explaining everything done.  
> Leave the Scan Prescription feature as a placeholder button for future development.

---

# ✔ End of Document
