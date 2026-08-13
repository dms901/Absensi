import './globals.css'

export const metadata = {
  title: "AbsensiKu — Dashboard",
  description: "Sistem absensi berbasis Supabase",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
