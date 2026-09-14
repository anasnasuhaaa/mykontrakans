# MyKontrakans 🏡

> Aplikasi web modern untuk manajemen keuangan kas rumah kontrakan bersama yang transparan, rapi, dan mudah digunakan.

---

## 🌟 Fitur Utama

- **Role-Based Access Control (RBAC):**
  - **Admin:** Mengelola data anggota, undangan onboarding email, pengaturan kas rumah tangga, dan seluruh fitur keuangan.
  - **Bendahara (Treasurer):** Verifikasi bukti transfer QRIS, pencatatan transaksi pemasukan/pengeluaran, dan pengelolaan kategori.
  - **Anggota (Member):** Melihat kewajiban kas bulanan, scan QRIS, upload bukti pembayaran, melihat riwayat status approval, dan transparansi arus kas kontrakan.

- **Sistem Pembayaran & Tagihan Kas Bulanan:**
  - Pembuatan tagihan bulanan otomatis untuk seluruh anggota aktif dengan tanggal jatuh tempo fleksibel.
  - Tampilan tagihan mobile-first dengan scan dan download QRIS (`/public/qris.jpeg`).
  - Unggah screenshot bukti transfer (format JPG, PNG, WEBP maks. 2 MB) dengan preview instan.
  - Alur verifikasi (Approve / Reject dengan alasan penolakan wajib) dan dukungan unggah ulang jika ditolak.
  - Notifikasi email otomatis via Resend (Undangan, Bukti Diterima, Disetujui, Perlu Diperbaiki).

- **Buku Kas & Ledger Keuangan:**
  - Perhitungan saldo kas otomatis berbasis transaksi ledger: `SUM(INCOME) - SUM(EXPENSE)`.
  - Pencatatan pemasukan manual dan pengeluaran operasional (token listrik, internet WiFi, galon, dll.) dilengkapi bukti nota.
  - Kategori keuangan dinamis yang dapat disesuaikan.

- **Dashboard Analitik & Visualisasi Data:**
  - Ringkasan metrik utama: Saldo saat ini, pemasukan & pengeluaran bulan berjalan, serta status antrean tagihan.
  - Grafik tren arus kas 6 bulan terakhir (Area Chart).
  - Distribusi persentase kategori pengeluaran (Donut Chart).
  - Indikator persentase kelunasan iuran kas anggota per periode.

- **Mobile-First & Aksesibilitas:**
  - Navigasi bawah (*bottom navigation*) fixed ramah jempol untuk perangkat mobile dengan dukungan *safe-area-inset*.
  - Sidebar desktop yang bersih dan intuitif.
  - Dukungan tema Gelap & Terang (*Dark/Light Mode*) dengan transisi mulus.
  - Feedback interaktif menggunakan Sonner Toast.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Server Actions, `proxy.ts` routing)
- **UI & Styling:** [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/), Lucide Icons
- **Komponen:** Radix UI Primitives, Sonner Toast
- **Database & ORM:** [Neon PostgreSQL](https://neon.tech/) Serverless, [Prisma ORM 6](https://www.prisma.io/)
- **Visualisasi:** [Recharts](https://recharts.org/)
- **Email Service:** [Resend](https://resend.com/)
- **File Storage:** [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) (dengan fallback lokal saat development)
- **Validasi:** [Zod](https://zod.dev/)

---

## 🚀 Panduan Instalasi Lokal

### 1. Klon Repositori & Pasang Dependensi
```bash
git clone <repo-url>
cd mykontrakans
npm install
```

### 2. Konfigurasi Environment Variables
Salin berkas `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

Sesuaikan nilai-nilai berikut:
```env
# Database Neon PostgreSQL
DATABASE_URL="postgres://user:password@ep-sample.region.neon.tech/neondb?sslmode=require"

# Base URL Aplikasi
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Layanan Email (Resend)
RESEND_API_KEY="re_123456789"
EMAIL_FROM="MyKontrakans <noreply@domain-anda.com>"

# Penyimpanan Berkas (Opsional untuk development, wajib di production Vercel)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

# Akun Awal Administrator (Opsional untuk seed pertama)
SEED_ADMIN_EMAIL="admin@kontrakan.local"
SEED_ADMIN_NAME="Budi Santoso"
SEED_ADMIN_PASSWORD="PasswordKuatKontrakan123!"
```

### 3. Migrasi Database & Seed Data
```bash
# Generate Prisma Client
npm run db:generate

# Terapkan migrasi ke database Neon
npm run db:migrate

# Jalankan data awal (kategori keuangan, pengaturan, & admin)
npm run db:seed
```

### 4. Jalankan Server Development
```bash
npm run dev
```
Buka peramban di [http://localhost:3000](http://localhost:3000).

---

## 🧪 Pengujian & Build

```bash
# Menjalankan unit tests
npm test

# Pengecekan tipe data TypeScript
npm run typecheck

# Linting kode
npm run lint

# Build production
npm run build
```

---

## 🔒 Keamanan & Praktik Terbaik

- Password disimpan menggunakan hashing **bcrypt** (salt rounds 12).
- Session dikelola menggunakan token acak 256-bit (`crypto.randomBytes(32)`) yang disimpan secara ter-hash SHA-256 di database dengan cookie `HttpOnly`, `SameSite: Lax`, dan `Secure` di production.
- Rate limiting berbasis database untuk mencegah serangan brute force pada login.
- Validasi ketat di sisi server (Server Actions) menggunakan Zod schema sebelum mengeksekusi mutasi database.
- Proteksi route di lapisan server menggunakan `proxy.ts` dan fungsi otorisasi `requireUser(roles)`.
