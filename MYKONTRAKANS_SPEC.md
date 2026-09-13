# MyKontrakans — Product & Implementation Specification

> Dokumen ini adalah **single source of truth** untuk AI coding agent.
> Baca dokumen ini sampai selesai sebelum mengubah kode.
> Implementasikan proyek secara bertahap sesuai bagian **Implementation Stages**.
> **WAJIB commit setelah menyelesaikan setiap stage. JANGAN push ke remote.**
> Deployment ke Vercel akan dilakukan manual oleh pemilik proyek.

---

# 1. Project Overview

Nama aplikasi: **MyKontrakans**

MyKontrakans adalah aplikasi web untuk mengatur kehidupan bersama di sebuah kontrakan berisi **6 anggota**.

Fokus versi awal aplikasi adalah:

- autentikasi anggota,
- onboarding anggota melalui email,
- manajemen role,
- pencatatan uang kas,
- pembuatan tagihan kas bulanan,
- upload bukti pembayaran,
- approval/rejection oleh Admin atau Bendahara,
- pencatatan pemasukan dan pengeluaran,
- dashboard finansial dan analytics,
- email notification otomatis,
- responsive mobile-first UI.

Aplikasi harus terasa seperti **premium finance/lifestyle app**, bukan dashboard admin generik.

---

# 2. Existing Project Requirements

Project sudah diinisialisasi oleh owner.

Teknologi berikut **WAJIB dipertahankan dan digunakan**:

- Next.js
- shadcn/ui
- Neon PostgreSQL
- Zod

Sebelum coding:

1. Baca `package.json`.
2. Identifikasi package yang sudah tersedia.
3. Jangan menghapus dependency yang masih digunakan.
4. Tambahkan dependency hanya bila memang dibutuhkan.
5. Pastikan dependency kompatibel dengan versi Next.js yang ada.
6. Gunakan package manager yang terdeteksi dari project (`pnpm`, `npm`, `yarn`, atau `bun`).
7. Jangan mengganti struktur project secara drastis tanpa alasan.

---

# 3. Recommended Stack

Gunakan stack berikut sebagai target arsitektur.

## Core

- Next.js
- TypeScript
- React
- App Router
- Server Components sebagai default
- Client Components hanya saat memang dibutuhkan

## UI

- Tailwind CSS
- shadcn/ui
- Lucide React
- Sonner
- next-themes

## Database

- Neon PostgreSQL
- Prisma ORM

Jika Prisma belum ada, install dan setup.

Gunakan singleton Prisma client yang aman untuk development.

## Validation

- Zod

Gunakan schema validation pada:
- form,
- server action / route handler,
- env validation bila diperlukan.

## Forms

Preferred:

- React Hook Form
- `@hookform/resolvers`
- Zod

## Authentication

Preferred:

- Auth.js / NextAuth bila cocok dengan project existing

atau implementasi credentials auth sendiri bila lebih sederhana dan konsisten.

Kebutuhan minimum:

- email + password login,
- hashed password,
- secure session,
- middleware route protection,
- RBAC.

Password wajib di-hash menggunakan:

- bcryptjs

## Email

- Resend

Gunakan React Email bila membantu templating:

- `resend`
- `@react-email/components`

Email harus memiliki template profesional dan responsive.

## Upload

Untuk MVP, bukti pembayaran dapat menggunakan salah satu solusi berikut:

Preferred:
- Vercel Blob

Alternative:
- Cloudinary

Jangan menyimpan binary image langsung ke PostgreSQL.

Buat abstraction sederhana agar storage mudah diganti.

## Charts

Preferred:

- Recharts

Gunakan chart yang benar-benar membantu memahami kondisi keuangan.

## Dates

- date-fns

Gunakan timezone secara konsisten.

Default business timezone:

`Asia/Jakarta`

## Utilities

- clsx
- tailwind-merge
- class-variance-authority

Jika sudah tersedia via shadcn, jangan install ulang.

---

# 4. User Roles

Terdapat tiga role:

```ts
ADMIN
TREASURER
MEMBER
```

Label UI Bahasa Indonesia:

- `ADMIN` → Admin
- `TREASURER` → Bendahara
- `MEMBER` → Anggota

Semua user tetap dianggap sebagai anggota kontrakan dan memiliki kewajiban membayar kas.

Perbedaan role hanya pada permission.

## Permission Matrix

### Admin

Boleh:

- melihat seluruh dashboard,
- CRUD anggota,
- menentukan role anggota,
- mengirim undangan/onboarding massal,
- membuat dan mengatur tagihan kas,
- menentukan tanggal jatuh tempo default,
- melihat semua pembayaran,
- approve pembayaran,
- reject pembayaran,
- CRUD kategori pemasukan,
- CRUD kategori pengeluaran,
- membuat pemasukan manual,
- membuat pengeluaran,
- melihat analytics lengkap,
- melihat history transaksi,
- mengatur konfigurasi aplikasi.

### Bendahara

Boleh:

- melihat dashboard keuangan,
- membuat tagihan kas,
- mengelola pembayaran,
- approve pembayaran,
- reject pembayaran,
- membuat pemasukan manual,
- membuat pengeluaran,
- CRUD kategori keuangan,
- melihat analytics.

Bendahara tidak boleh:

- menghapus Admin,
- mengubah role Admin,
- melakukan konfigurasi sensitif user management bila tidak diperlukan.

### Anggota

Boleh:

- melihat dashboard pribadinya,
- melihat tagihan,
- melihat QRIS,
- upload bukti pembayaran,
- melihat status pembayaran,
- melihat riwayat pembayaran,
- melihat saldo kas global bila owner mengizinkan pada MVP.

Tidak boleh:

- approve/reject pembayaran,
- mengedit transaksi global,
- mengatur kategori,
- mengatur anggota lain.

---

# 5. Authentication & Onboarding Flow

Tidak ada public registration.

Akun hanya dibuat oleh Admin.

## Admin adds member

Admin memasukkan:

- nama,
- email,
- role.

Setelah user dibuat:

1. sistem generate onboarding token,
2. token memiliki expiry,
3. email onboarding dikirim,
4. user membuka link,
5. user membuat password,
6. token invalid setelah berhasil digunakan,
7. user kemudian dapat login.

Contoh onboarding URL:

```txt
https://your-domain.com/onboarding?token=...
```

Jangan mengirim password plaintext melalui email.

## Bulk Invitation

Admin dapat:

- memilih beberapa anggota,
- klik `Kirim Undangan`,
- sistem mengirim onboarding email secara massal.

Tampilkan hasil:

- berhasil terkirim,
- gagal,
- sudah aktif,
- email invalid.

## Recommended token properties

Token onboarding:

- random cryptographically secure,
- single use,
- expiry default 24 jam,
- jangan menyimpan raw token jika memungkinkan.

Preferred approach:

- generate token,
- simpan hash token ke DB,
- raw token hanya dikirim lewat email.

---

# 6. Financial Concepts

Ada dua kelompok transaksi utama:

```ts
INCOME
EXPENSE
```

## Initial Income Category Seed

Seed kategori:

```txt
Uang Kas
```

## Initial Expense Category Seed

Seed kategori:

```txt
Listrik
WiFi
```

Setelah seed awal, kategori harus dapat dikelola melalui CRUD.

Recommended additional category fields:

- id,
- name,
- type,
- isActive,
- createdAt,
- updatedAt.

Jangan hardcode kategori setelah seed.

---

# 7. Monthly Dues / Uang Kas

Admin/Bendahara dapat mengatur konfigurasi kas.

Minimal configuration:

- nominal kas per anggota,
- tanggal jatuh tempo bulanan,
- enabled/disabled recurring billing.

Contoh:

```txt
Nominal kas: Rp100.000
Jatuh tempo: tanggal 10 setiap bulan
```

Sistem membuat tagihan per anggota setiap periode.

Karena seluruh role juga anggota, maka:

- Admin tetap mendapatkan tagihan,
- Bendahara tetap mendapatkan tagihan,
- Member mendapatkan tagihan.

Total normal untuk kontrakan berisi 6 orang:

```txt
6 × nominal kas
```

---

# 8. Billing Generation

Buat model billing yang bersifat bulanan.

Contoh periode:

```txt
September 2026
```

Setiap billing period memiliki:

- month,
- year,
- dueDate,
- amountPerMember,
- status period bila diperlukan.

Setiap anggota memiliki record individual invoice/payment obligation.

Hindari logic yang hanya menghitung status secara frontend.

Data harus tetap auditable.

---

# 9. Payment Flow

Alur pembayaran anggota:

1. user login,
2. membuka tagihan bulan berjalan,
3. melihat jumlah tagihan,
4. melihat QRIS,
5. QRIS berasal dari:

```txt
/public/qris.jpg
```

6. user melakukan pembayaran,
7. user upload screenshot bukti,
8. submit,
9. status menjadi menunggu review,
10. Admin/Bendahara mengecek bukti,
11. approve atau reject.

---

# 10. Payment Status

Pisahkan status internal dan label UI bila perlu.

Recommended internal status:

```ts
UNPAID
PENDING_REVIEW
PAID
REJECTED
OVERDUE
```

Namun label utama yang ditampilkan kepada user mengikuti kebutuhan:

### Lunas

Jika pembayaran sudah di-approve.

```txt
Lunas
```

### Belum dibayar

Jika:

- belum membayar,
- dan sudah masuk rentang 3 hari sebelum jatuh tempo.

```txt
Belum dibayar
```

### Melebihi X hari

Jika sudah melewati due date.

Contoh:

```txt
Melebihi 2 hari
Melebihi 7 hari
```

Hitung secara dinamis berdasarkan tanggal hari ini dan due date.

### Menunggu review

Saat bukti sudah dikirim tetapi belum direview:

```txt
Menunggu review
```

### Ditolak

Jika pembayaran ditolak:

```txt
Ditolak
```

dan alasan rejection harus ditampilkan.

---

# 11. Due Date Behavior

Jika due date tanggal 10:

- sebelum tanggal 7: status normal / upcoming,
- tanggal 7–10: `Belum dibayar`,
- tanggal >10: `Melebihi X hari`,
- sudah submit: `Menunggu review`,
- approved: `Lunas`,
- rejected: `Ditolak`.

Jangan override `PENDING_REVIEW`, `PAID`, atau `REJECTED` hanya berdasarkan tanggal.

---

# 12. Payment Evidence

User harus upload screenshot pembayaran.

Validasi minimum:

- JPG,
- JPEG,
- PNG,
- WEBP.

Recommended max size:

```txt
5 MB
```

Tampilkan:

- image preview sebelum submit,
- loading upload,
- error upload yang jelas.

Admin/Bendahara dapat membuka preview image pada review page.

---

# 13. Approval Flow

Admin/Bendahara mempunyai halaman review pembayaran.

Per item tampilkan:

- nama anggota,
- periode,
- nominal,
- tanggal submit,
- bukti pembayaran,
- status.

Action:

```txt
Setujui
Tolak
```

## Approve

Saat approve:

1. payment status menjadi `PAID`,
2. simpan approver,
3. simpan approval timestamp,
4. buat/konfirmasi pemasukan,
5. update saldo,
6. kirim email ke user,
7. tampilkan Sonner toast.

## Reject

Saat reject:

Admin/Bendahara wajib memasukkan alasan.

Contoh:

```txt
Nominal pada bukti tidak sesuai.
```

Setelah reject:

1. status `REJECTED`,
2. simpan reason,
3. simpan reviewer,
4. simpan timestamp,
5. user dapat upload ulang bukti,
6. kirim email rejection,
7. tampilkan toast.

---

# 14. Financial Ledger

Jangan hanya menyimpan angka saldo.

Gunakan ledger transaksi.

Model transaksi minimal:

```ts
Transaction {
  id
  type
  categoryId
  amount
  description
  transactionDate
  createdById
  relatedPaymentId?
  createdAt
  updatedAt
}
```

Saldo dihitung dari:

```txt
SUM(INCOME) - SUM(EXPENSE)
```

Jangan membuat saldo mutable sebagai satu-satunya source of truth.

---

# 15. Manual Income

Admin/Bendahara boleh menambahkan pemasukan manual.

Fields:

- kategori,
- nominal,
- tanggal,
- catatan optional.

---

# 16. Expense

Admin/Bendahara dapat menambahkan pengeluaran.

Fields:

- kategori,
- nominal,
- tanggal transaksi,
- deskripsi,
- bukti transaksi optional.

Kategori default:

- Listrik
- WiFi

Kategori lain dapat ditambahkan lewat CRUD.

---

# 17. Dashboard

Dashboard harus langsung memberikan informasi penting tanpa terlalu banyak teks penjelasan.

## Global Finance Cards

Minimal:

- Saldo Saat Ini
- Pemasukan Bulan Ini
- Pengeluaran Bulan Ini
- Tagihan Belum Lunas

Optional:

- Pending Review
- Pengeluaran Terbesar

Gunakan format Rupiah.

Contoh:

```txt
Rp1.250.000
```

---

# 18. Dashboard Charts

Jangan menampilkan chart hanya untuk dekorasi.

Minimal buat:

## Cash Flow Chart

Line / area chart:

- pemasukan per bulan,
- pengeluaran per bulan.

Range:

- 6 bulan terakhir.

## Expense Breakdown

Donut / pie chart:

- Listrik,
- WiFi,
- kategori lainnya.

## Payment Completion

Bar / progress visualization:

```txt
5 / 6 anggota sudah membayar
```

per periode.

## Optional

Trend saldo:

- saldo akhir setiap bulan.

---

# 19. Member Dashboard

Dashboard anggota mobile-first.

Prioritas urutan:

1. current balance card,
2. tagihan bulan ini,
3. payment status,
4. tombol bayar / upload bukti,
5. history pembayaran,
6. ringkasan kas kontrakan.

Jika sudah lunas:

tombol pembayaran jangan terlalu dominan.

Jika pending:

tampilkan status review.

Jika rejected:

tampilkan alasan dan tombol `Upload Ulang`.

---

# 20. Admin / Treasurer Dashboard

Prioritas:

1. saldo,
2. pemasukan/pengeluaran,
3. pending payment reviews,
4. payment completion,
5. charts,
6. recent transactions.

Tambahkan shortcut:

- Tambah Pengeluaran
- Tambah Pemasukan
- Review Pembayaran
- Kelola Anggota

---

# 21. Navigation

## Mobile

WAJIB menggunakan bottom navigation seperti native mobile app.

Contoh Admin/Bendahara:

```txt
Dashboard
Kas
Transaksi
Anggota
Profil
```

Anggota:

```txt
Beranda
Tagihan
Riwayat
Profil
```

Gunakan icon Lucide.

Bottom navigation:

- sticky/fixed bottom,
- safe area aware,
- mudah dijangkau ibu jari,
- active state jelas.

## Desktop

Gunakan sidebar.

Desktop sidebar:

- collapsible bila cocok,
- logo + MyKontrakans,
- navigation,
- user profile di bagian bawah.

---

# 22. Theme

Harus mendukung:

```txt
Light Mode
Dark Mode
```

Gunakan `next-themes`.

Toggle:

- berada di kanan atas,
- satu kali klik langsung berganti dark ↔ light,
- jangan tampilkan dropdown pilihan `System`,
- tidak perlu theme picker.

Icon:

```txt
Sun / Moon
```

---

# 23. Visual Direction

Style:

- premium,
- modern,
- clean,
- elegant,
- finance app feel,
- rounded,
- spacious,
- subtle shadow,
- minimal noise.

Primary color:

```txt
Blue
```

Gunakan biru yang elegan.

Recommended palette:

```txt
Primary        #2563EB
Primary Dark   #1D4ED8
Accent         #3B82F6
Soft Blue      #EFF6FF
Dark Surface   #0B1220
```

Boleh menyesuaikan agar memenuhi contrast accessibility.

Status colors:

- success = green,
- warning = amber,
- danger = red,
- info = blue.

Jangan menjadikan seluruh halaman terlalu biru.

Gunakan warna primary untuk:

- CTA,
- active navigation,
- highlight,
- key metrics.

---

# 24. UX Rules

Hindari:

- terlalu banyak subtitle kecil,
- card berlebihan,
- dashboard penuh border,
- teks explanatory yang tidak penting,
- layout desktop yang dipaksa mengecil di mobile.

Prioritaskan:

- informasi singkat,
- hierarchy jelas,
- whitespace,
- touch target minimal ~44 px,
- responsive spacing,
- skeleton loading,
- empty state,
- error state,
- confirmation dialog untuk destructive actions.

---

# 25. shadcn/ui Requirements

Gunakan komponen shadcn untuk elemen UI.

Preferred components:

- Button
- Card
- Badge
- Avatar
- Dialog
- AlertDialog
- Sheet
- DropdownMenu
- Select
- Input
- Textarea
- Form
- Label
- Tabs
- Table
- Skeleton
- Separator
- Tooltip
- Popover
- Calendar
- Command
- Drawer jika sesuai

Jangan menggunakan native HTML control dengan tampilan default jika shadcn equivalent tersedia.

---

# 26. Toast

Gunakan:

```txt
Sonner
```

Global config:

```txt
position = top-right
duration = 1500ms
closeButton = false
```

Gunakan toast pada:

- create,
- update,
- delete,
- submit payment,
- approve,
- reject,
- invitation sent,
- failed action,
- upload success/error.

Contoh:

```txt
Pembayaran berhasil dikirim.
Pembayaran disetujui.
Pembayaran ditolak.
Pengeluaran berhasil ditambahkan.
Undangan berhasil dikirim.
```

---

# 27. Email Notifications

Gunakan Resend.

Email otomatis dikirim pada event berikut.

## Invitation

Subject:

```txt
Undangan MyKontrakans
```

Isi:

- sapaan,
- informasi bahwa user ditambahkan ke kontrakan,
- tombol aktivasi,
- expiry link.

## Payment Submitted

Kirim ke user sebagai confirmation.

Optional:

kirim ke Admin/Bendahara notification bahwa ada payment baru.

## Payment Approved

Subject:

```txt
Pembayaran Kas Disetujui
```

## Payment Rejected

Subject:

```txt
Pembayaran Kas Perlu Diperbaiki
```

Tampilkan:

- periode,
- nominal,
- alasan rejection.

## Transaction Notification

Jika sesuai requirement:

pemasukan/pengeluaran penting dapat dikirim ke anggota.

Untuk MVP, minimal event berikut wajib:

- invitation,
- payment submitted,
- approved,
- rejected.

---

# 28. Email Reliability

Jangan membuat request UI terlihat gagal hanya karena email notification gagal setelah database transaction sukses.

Pattern preferred:

1. simpan perubahan DB,
2. attempt email,
3. log email error,
4. response utama tetap merefleksikan transaksi yang sudah berhasil.

Namun onboarding invitation membutuhkan feedback jika email benar-benar tidak terkirim.

---

# 29. Database Suggested Schema

AI agent boleh menyesuaikan naming.

Minimal entity:

```txt
User
OnboardingToken
FinancialCategory
BillingPeriod
MemberBill
PaymentSubmission
Transaction
AppSetting
AuditLog
```

---

# 30. Suggested Prisma Models

Gunakan ini sebagai reference, bukan kewajiban 1:1.

```prisma
enum UserRole {
  ADMIN
  TREASURER
  MEMBER
}

enum TransactionType {
  INCOME
  EXPENSE
}

enum BillStatus {
  UNPAID
  PENDING_REVIEW
  PAID
  REJECTED
}

model User {
  id             String   @id @default(cuid())
  name           String
  email          String   @unique
  passwordHash   String?
  role           UserRole @default(MEMBER)
  isActive       Boolean  @default(true)
  activatedAt    DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

Model lengkap silakan dibuat sesuai relasi yang diperlukan.

---

# 31. Audit Trail

Approval finansial harus auditable.

Simpan informasi:

- siapa membuat transaksi,
- siapa approve,
- siapa reject,
- kapan,
- alasan reject.

Recommended AuditLog:

```txt
action
entityType
entityId
actorId
metadata
createdAt
```

Contoh action:

```txt
PAYMENT_SUBMITTED
PAYMENT_APPROVED
PAYMENT_REJECTED
TRANSACTION_CREATED
MEMBER_INVITED
```

---

# 32. App Settings

Buat configuration table untuk nilai yang mungkin berubah.

Minimal:

```txt
MONTHLY_DUES_AMOUNT
MONTHLY_DUE_DAY
```

Optional:

```txt
HOUSE_NAME
CURRENCY
TIMEZONE
```

Default:

```txt
HOUSE_NAME = MyKontrakans
CURRENCY = IDR
TIMEZONE = Asia/Jakarta
```

---

# 33. IDR Currency Helper

Buat centralized formatter.

Contoh:

```ts
new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
})
```

Gunakan konsisten di seluruh app.

---

# 34. Date Handling

Gunakan:

```txt
Asia/Jakarta
```

Hindari bug karena server Vercel UTC.

Untuk perhitungan:

- due date,
- overdue days,
- monthly grouping,

pastikan timezone diperhatikan.

---

# 35. Security

WAJIB:

- hash password,
- secure session cookie,
- server-side authorization,
- validate upload,
- validate form menggunakan Zod,
- jangan percaya role dari client,
- jangan expose password hash,
- jangan expose raw onboarding token di DB,
- batasi route admin secara server-side,
- jangan hanya hide button di frontend.

Jangan menyimpan secret di source code.

---

# 36. Route Protection

Contoh:

```txt
/login
/onboarding
```

public.

Authenticated:

```txt
/dashboard
/bills
/history
/profile
```

Admin/Treasurer:

```txt
/transactions
/payments/review
/categories
```

Admin:

```txt
/members
/settings
```

Boleh menggunakan route group.

Contoh:

```txt
(app)
(auth)
(admin)
```

---

# 37. Suggested App Structure

AI boleh menyesuaikan dengan project existing.

```txt
app/
  (auth)/
    login/
    onboarding/

  (app)/
    dashboard/
    bills/
    history/
    profile/

  admin/
    members/
    payments/
    transactions/
    categories/
    settings/

components/
  dashboard/
  finance/
  payments/
  members/
  layout/
  ui/

lib/
  auth/
  db/
  email/
  storage/
  permissions/
  validators/
  utils/

prisma/
  schema.prisma
  seed.ts

public/
  qris.jpg
```

Jika struktur project existing sudah baik, jangan refactor hanya agar sama persis.

---

# 38. Environment Variables

Buat file:

```txt
.env.example
```

dengan template:

```env
# ============================================
# APP
# ============================================

NEXT_PUBLIC_APP_NAME="MyKontrakans"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# ============================================
# DATABASE - NEON
# ============================================

DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"

# Optional jika Prisma membutuhkan direct connection
DIRECT_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"

# ============================================
# AUTH
# ============================================

AUTH_SECRET="CHANGE_ME_WITH_A_LONG_RANDOM_SECRET"

# Jika implementasi auth custom:
SESSION_SECRET="CHANGE_ME_WITH_A_LONG_RANDOM_SECRET"

# ============================================
# RESEND / SMTP
# ============================================

RESEND_API_KEY="re_xxxxxxxxxxxxxxxxx"

EMAIL_FROM="MyKontrakans <noreply@your-domain.com>"

# ============================================
# FILE STORAGE
# ============================================

# Preferred: Vercel Blob
BLOB_READ_WRITE_TOKEN=""

# Alternative Cloudinary
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# ============================================
# OPTIONAL
# ============================================

NEXT_PUBLIC_DEFAULT_TIMEZONE="Asia/Jakarta"
```

Catatan:

- Agent jangan pernah mengisi secret asli.
- Jangan commit `.env`.
- Commit hanya `.env.example`.

Pastikan `.gitignore` melindungi:

```txt
.env
.env.local
.env.production
```

---

# 39. Seed Data

Buat seed.

## Finance Categories

Income:

```txt
Uang Kas
```

Expense:

```txt
Listrik
WiFi
```

## Users

Buat mekanisme seed user development menggunakan environment variable.

Jangan hardcode real credential production.

Contoh env:

```env
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="ChangeMe123!"
SEED_ADMIN_NAME="Admin MyKontrakans"
```

Jika environment variable tidak tersedia, seed user dapat dilewati.

Kategori tetap boleh di-seed.

---

# 40. Member Count

Jumlah anggota kontrakan saat ini:

```txt
6 orang
```

Namun jangan hardcode `6` ke logic utama.

Jumlah anggota harus berasal dari user aktif di database.

---

# 41. Empty States

Harus ada empty state yang clean.

Contoh:

```txt
Belum ada transaksi.
Belum ada pembayaran yang perlu direview.
Belum ada tagihan periode ini.
```

Tidak perlu paragraf panjang.

---

# 42. Loading States

Gunakan:

- skeleton,
- button pending state,
- disabled state.

Jangan biarkan user submit dua kali.

---

# 43. Confirmation

Gunakan AlertDialog pada:

- delete member,
- delete category,
- delete transaction jika diperbolehkan,
- perubahan role penting.

Approval pembayaran tidak wajib confirm jika flow sudah jelas.

Reject harus menggunakan dialog/form karena alasan rejection wajib.

---

# 44. Responsive Requirements

Target utama:

```txt
375px–430px mobile
```

Tetap mendukung:

- tablet,
- laptop,
- desktop widescreen.

Perhatikan:

- table jangan overflow buruk,
- gunakan cards/list untuk mobile bila lebih cocok,
- chart harus responsive,
- dialog jangan keluar viewport,
- bottom nav tidak menutupi konten.

Tambahkan padding bawah sesuai tinggi bottom nav.

---

# 45. Accessibility

Minimal:

- label form,
- keyboard accessible,
- focus state jelas,
- color contrast layak,
- icon-only button punya aria-label,
- tidak mengandalkan warna saja untuk status.

---

# 46. Data Integrity

Untuk approval payment:

gunakan database transaction bila perlu.

Pastikan payment tidak dapat approved dua kali.

Related income transaction tidak boleh terbuat dua kali.

Buat unique constraint yang sesuai.

Contoh:

```txt
memberId + billingPeriodId unique
```

Satu anggota satu bill per periode.

---

# 47. Billing Automation

Untuk MVP tidak perlu cron external jika belum diperlukan.

Boleh membuat tagihan dengan pendekatan:

### Option A — Generate Period

Admin/Bendahara klik:

```txt
Buat Tagihan Bulan Ini
```

Sistem generate tagihan untuk semua active members.

### Option B — Auto ensure

Saat membuka periode bulan berjalan, server memastikan billing period tersedia.

Preferred untuk MVP:

```txt
Explicit Generate Period
```

karena mudah diaudit.

Namun tetap sediakan setting:

```txt
Tanggal jatuh tempo
Nominal kas
```

---

# 48. Settings Page

Minimal:

## Kas Bulanan

- nominal,
- tanggal jatuh tempo.

## Branding

- nama kontrakan.

QRIS tidak perlu uploader pada MVP.

Gunakan:

```txt
/public/qris.jpg
```

---

# 49. Profile Page

User dapat melihat:

- nama,
- email,
- role.

Optional:

- ubah nama,
- ubah password.

User tidak boleh mengubah role sendiri.

---

# 50. Transaction History

Tampilkan:

- tanggal,
- jenis,
- kategori,
- nominal,
- deskripsi,
- pembuat.

Filter:

- bulan,
- type,
- category.

Mobile gunakan list/card yang nyaman.

Desktop boleh table.

---

# 51. Analytics Queries

Analytics harus menggunakan data real database.

Minimal:

## Balance

```txt
total income - total expense
```

## Monthly income

Current calendar month.

## Monthly expense

Current calendar month.

## Cashflow

Group by month.

## Expense category distribution

Group expense by category.

## Payment completion

```txt
paid member bills / total member bills
```

---

# 52. Error Handling

Gunakan error message yang friendly.

Jangan expose:

- stack trace,
- DB details,
- API key,
- SQL errors.

Server log boleh lebih detail.

---

# 53. Coding Style

- TypeScript strict.
- Hindari `any`.
- Gunakan reusable server utilities.
- Gunakan Zod schema reusable.
- Jangan membuat file component >500 baris bila dapat dipisah dengan masuk akal.
- Hindari premature abstraction.
- Jangan membuat layer architecture berlebihan.

---

# 54. Naming

Gunakan English pada code.

Contoh:

```txt
PaymentSubmission
BillingPeriod
FinancialCategory
```

Gunakan Bahasa Indonesia pada UI.

---

# 55. Git Rules

SANGAT PENTING.

Setelah menyelesaikan setiap stage:

```bash
git status
git add .
git commit -m "<commit message>"
```

JANGAN menjalankan:

```bash
git push
```

Owner akan push manual.

Sebelum commit:

- pastikan build lolos,
- lint bila tersedia,
- typecheck bila tersedia.

---

# 56. Commit Convention

Gunakan conventional commits.

Contoh:

```txt
chore: setup project foundation
feat: add authentication and onboarding
feat: add monthly billing workflow
feat: add payment approval system
feat: add finance transactions
feat: add analytics dashboard
feat: add responsive navigation
fix: improve payment validation
```

---

# 57. Implementation Stages

Kerjakan secara urut.

Jangan mengimplementasikan semuanya sekaligus dalam satu commit.

---

## Stage 0 — Audit Existing Project

Tasks:

1. baca `package.json`,
2. identifikasi Next.js version,
3. identifikasi package manager,
4. cek existing shadcn setup,
5. cek Tailwind setup,
6. cek existing folder structure,
7. cek apakah Prisma/Auth sudah ada,
8. cek existing environment handling.

Jangan menghapus existing code yang berfungsi tanpa alasan.

Buat catatan singkat perubahan yang diperlukan.

Jika dependency belum tersedia, install dependency yang diperlukan.

Minimal likely dependencies:

```txt
prisma
@prisma/client
zod
react-hook-form
@hookform/resolvers
bcryptjs
resend
sonner
next-themes
recharts
date-fns
lucide-react
```

Tambahkan hanya yang belum ada.

Run project.

Pastikan tidak ada error baru.

Commit:

```txt
chore: prepare mykontrakans project foundation
```

---

## Stage 1 — Database & Core Models

Implement:

- Prisma setup,
- Neon connection,
- enums,
- User,
- category,
- billing,
- payment submission,
- transaction,
- settings,
- onboarding token,
- audit log.

Tambahkan:

- migrations,
- seed categories,
- optional development admin seed.

Tambahkan `.env.example`.

Run:

```txt
prisma validate
migration
seed
build/typecheck
```

Commit:

```txt
feat: add database schema and seed data
```

---

## Stage 2 — Authentication

Implement:

- login,
- secure session,
- logout,
- middleware,
- role authorization,
- protected layout.

UI:

- premium login page,
- responsive mobile,
- dark/light support.

Tidak ada register page.

Commit:

```txt
feat: add authentication and role protection
```

---

## Stage 3 — Member Management & Onboarding

Admin page:

```txt
Anggota
```

Features:

- list member,
- add member,
- edit name,
- edit email,
- edit role,
- disable member bila diperlukan,
- resend invite,
- bulk send invite.

Implement:

- onboarding token,
- email via Resend,
- set password onboarding page,
- expiration,
- single-use token.

Commit:

```txt
feat: add member onboarding and invitations
```

---

## Stage 4 — Application Shell & Responsive Navigation

Implement app shell.

Mobile:

- bottom nav.

Desktop:

- sidebar.

Add:

- top bar,
- theme toggle,
- profile menu,
- responsive spacing.

Theme:

- light/dark one-click toggle.

Premium blue visual system.

Commit:

```txt
feat: add responsive app navigation and theme
```

---

## Stage 5 — Finance Categories & Settings

Implement:

- CRUD income category,
- CRUD expense category,
- app settings,
- monthly dues amount,
- monthly due day.

Protect system categories from accidental destructive deletion if already referenced.

Commit:

```txt
feat: add finance categories and billing settings
```

---

## Stage 6 — Monthly Billing

Implement:

- create billing period,
- generate member bills,
- list periods,
- current period,
- due date,
- per-member obligation,
- derived status.

Prevent duplicate generation.

Display:

- status,
- due date,
- amount,
- completion progress.

Commit:

```txt
feat: add monthly dues billing workflow
```

---

## Stage 7 — Member Payment Submission

Implement:

- QRIS card using `/public/qris.jpg`,
- payment detail,
- upload screenshot,
- preview,
- file validation,
- submit payment,
- pending review state,
- resend email confirmation.

Support rejected payment re-upload.

Commit:

```txt
feat: add member payment submission flow
```

---

## Stage 8 — Payment Review

Admin/Bendahara:

- payment review queue,
- evidence preview,
- approve,
- reject with required reason.

Approve:

- mark bill paid,
- create related income transaction,
- save reviewer,
- audit log,
- send email,
- toast.

Reject:

- reason,
- audit,
- email,
- toast.

Commit:

```txt
feat: add payment approval and rejection workflow
```

---

## Stage 9 — Income & Expense Management

Implement:

- add manual income,
- add expense,
- transaction history,
- filter,
- category,
- notes,
- optional receipt evidence.

Compute balance from ledger.

Commit:

```txt
feat: add finance transaction management
```

---

## Stage 10 — Dashboard Analytics

Implement responsive dashboard.

Cards:

- saldo,
- pemasukan bulan ini,
- pengeluaran bulan ini,
- belum lunas,
- pending review bila role memungkinkan.

Charts:

- 6-month cash flow,
- expense distribution,
- monthly payment completion.

Add recent transactions.

Commit:

```txt
feat: add financial analytics dashboard
```

---

## Stage 11 — Polish UX

Review seluruh aplikasi.

Improve:

- responsive spacing,
- mobile card layouts,
- bottom navigation safe area,
- skeletons,
- empty states,
- error states,
- dialogs,
- form validation,
- loading,
- Sonner config,
- accessibility,
- dark mode.

Remove:

- unnecessary explanatory copy,
- duplicate headings,
- visual clutter.

Commit:

```txt
refactor: polish responsive ui and user experience
```

---

## Stage 12 — Production Readiness

Run:

```bash
npm run lint
npm run build
```

Gunakan command package manager yang sesuai.

Check:

- no TypeScript errors,
- no lint errors,
- no exposed secret,
- env validation,
- DB indexes,
- correct authorization,
- no duplicate approval,
- correct mobile experience.

Tambahkan README setup bila belum ada.

Jangan deploy.

Jangan push.

Commit:

```txt
chore: prepare app for production deployment
```

---

# 58. Final Verification Checklist

Sebelum menyatakan selesai:

## Authentication

- [ ] Public registration tidak ada
- [ ] Login bekerja
- [ ] Session aman
- [ ] RBAC server-side bekerja

## Members

- [ ] Admin dapat menambah anggota
- [ ] Invitation email bekerja
- [ ] Bulk invitation bekerja
- [ ] Token expiry bekerja
- [ ] Password disimpan hashed

## Billing

- [ ] Nominal kas configurable
- [ ] Due date configurable
- [ ] Billing period dapat dibuat
- [ ] Tidak ada duplicate bill
- [ ] Semua role mendapat kewajiban kas

## Payment

- [ ] QRIS tampil
- [ ] Bukti dapat diupload
- [ ] Pending review bekerja
- [ ] Approve bekerja
- [ ] Reject membutuhkan alasan
- [ ] Re-upload setelah reject bekerja

## Status

- [ ] Lunas
- [ ] Belum dibayar
- [ ] Menunggu review
- [ ] Ditolak
- [ ] Melebihi X hari

## Finance

- [ ] Ledger income/expense
- [ ] Saldo benar
- [ ] Income categories CRUD
- [ ] Expense categories CRUD
- [ ] Listrik seeded
- [ ] WiFi seeded
- [ ] Uang Kas seeded

## Dashboard

- [ ] Current balance
- [ ] Monthly income
- [ ] Monthly expense
- [ ] Outstanding bills
- [ ] Cashflow chart
- [ ] Expense distribution
- [ ] Payment progress

## Notifications

- [ ] Sonner top-right
- [ ] duration 1500ms
- [ ] no close button
- [ ] invitation email
- [ ] payment submission email
- [ ] approval email
- [ ] rejection email

## UI

- [ ] Mobile-first
- [ ] Bottom navigation mobile
- [ ] Sidebar desktop
- [ ] Premium blue theme
- [ ] Light mode
- [ ] Dark mode
- [ ] One-click theme toggle
- [ ] Responsive charts
- [ ] No visual clutter

## Git

- [ ] Commit per stage
- [ ] Tidak ada push dari agent
- [ ] Working tree clean setelah final commit

---

# 59. Important Agent Behavior

Saat menjalankan implementasi:

1. Jangan meminta owner memilih library untuk hal kecil jika pilihan yang reasonable bisa diambil sendiri.
2. Prioritaskan consistency dengan existing project.
3. Jangan mengganti technology wajib:
   - Next.js
   - shadcn/ui
   - Neon
   - Zod
4. Jangan push.
5. Commit setiap stage.
6. Jika menemukan issue existing project, perbaiki bila berkaitan langsung dengan stage.
7. Jangan meninggalkan placeholder UI yang tidak berfungsi.
8. Jangan membuat fake analytics setelah database tersedia.
9. Jangan menampilkan dummy production data.
10. Jangan hardcode anggota menjadi 6 pada business logic.
11. Jangan hardcode secret.
12. Jangan mengirim password melalui email.
13. Jangan approve transaksi hanya di frontend.
14. Jangan membuat status pembayaran hanya berdasarkan tampilan frontend.
15. Utamakan kualitas pengalaman mobile.

---

# 60. Definition of Done

Project dianggap selesai ketika:

- keenam anggota dapat memiliki akun,
- Admin dapat mengundang anggota melalui email,
- semua user dapat login,
- tagihan kas bulanan dapat dibuat,
- user dapat membayar via QRIS dan upload bukti,
- Admin/Bendahara dapat approve/reject,
- status pembayaran tampil akurat,
- approval menghasilkan pemasukan,
- pemasukan/pengeluaran tercatat,
- saldo dihitung benar,
- dashboard analytics berfungsi,
- email notifications berjalan,
- dark/light mode berfungsi,
- mobile UI terasa seperti aplikasi mobile,
- desktop menggunakan sidebar,
- aplikasi berhasil build,
- setiap stage memiliki commit,
- tidak ada `git push` yang dijalankan oleh AI agent.
