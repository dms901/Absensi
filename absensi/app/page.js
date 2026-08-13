"use client";
import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true); // true = login, false = register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nama, setNama] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClientComponentClient();
  const router = useRouter();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isLogin) {
      // LOGIN
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        router.push("/dashboard"); // ganti ke halaman dashboard kamu
      }
    } else {
      // REGISTER
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nama: nama },
        },
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        // Insert ke tabel profiles
        const { error: profileError } = await supabase
          .from("profiles")
          .insert([
            {
              id: data.user.id,
              email: email,
              nama: nama,
              role: "member", // default member
            },
          ]);
        
        if(profileError) setError(profileError.message);
        else {
          alert("Pendaftaran berhasil! Silakan login.");
          setIsLogin(true); // balik ke form login
          setEmail("");
          setPassword("");
          setNama("");
        }
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <div className="flex items-center justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white text-2xl font-bold">A</div>
          <h1 className="ml-3 text-2xl font-bold text-gray-800">AbsensiKu</h1>
        </div>
        <p className="text-center text-gray-500 mb-6">
          {isLogin ? "Masuk ke akun kamu" : "Daftar akun baru"}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Nama</label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
                className="mt-1 w-full rounded-md border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nama Lengkap"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-md border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="email@domain.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Minimal 6 karakter"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 py-2 px-4 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Memproses..." : isLogin ? "Masuk ke Dashboard" : "Daftar Sekarang"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
          <button 
            onClick={() => {setIsLogin(!isLogin); setError("")}} 
            className="font-medium text-blue-600 hover:underline"
          >
            {isLogin ? "Daftar di sini" : "Masuk di sini"}
          </button>
        </p>
      </div>
    </div>
  );
}