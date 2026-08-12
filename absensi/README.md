# AbsensiKu — Next.js + Supabase + Vercel

## 1. Supabase
Buka SQL Editor dan jalankan `supabase/schema.sql`.

Lalu:
- Authentication → Users → buat akun admin.
- Salin UUID akun tersebut.
- Jalankan:
  `insert into public.profiles (id, role) values ('UUID_ADMIN', 'admin');`

## 2. Local
```bash
npm install
cp .env.example .env.local
npm run dev
```

Isi `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 3. Vercel
Upload project ini ke GitHub, lalu import repository tersebut di Vercel.
Tambahkan Environment Variables:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

Deploy.

## Fitur
- Login admin melalui Supabase Auth
- Dashboard statistik
- Data anggota: tambah, edit, hapus
- Absensi per tanggal
- Hadir / Izin / Sakit / Alpha
- Pencarian anggota
- Rekap periode
- Export PDF
- RLS untuk membatasi database ke admin

## Keamanan
Gunakan hanya URL project dan publishable/anon key di frontend.
JANGAN masukkan `service_role` key ke browser, GitHub, atau Vercel frontend.
