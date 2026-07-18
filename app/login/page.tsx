"use client";

import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal login");
      }
      
      // Menggunakan replace untuk membersihkan tumpukan riwayat agar mantap masuk ke dashboard
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex", justifyContent: "center", alignItems: "center",
      height: "100vh", backgroundColor: "#f5f5f5", fontFamily: "sans-serif"
    }}>
      <div style={{
        width: "100%", maxWidth: "400px", padding: "30px",
        backgroundColor: "#ffffff", borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)", borderTop: "5px solid #800000"
      }}>
        {/* PERUBAHAN IDENTITAS VISUAL MENJADI SIPEDAS */}
        <div style={{ textAlign: "center", marginBottom: "25px" }}>
          <h2 style={{ color: "#800000", margin: "0 0 5px 0", letterSpacing: "1px" }}>SIPEDAS</h2>
          <p style={{ color: "#666", fontSize: "13px", margin: 0 }}>Dinas Pendidikan Kabupaten Bojonegoro</p>
        </div>

        {error && (
          <div style={{
            padding: "10px", backgroundColor: "#ffebee", color: "#c62828",
            borderRadius: "4px", marginBottom: "15px", fontSize: "14px", textAlign: "center"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "bold", color: "#333" }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: "100%", padding: "10px", borderRadius: "4px",
                border: "1px solid #ccc", boxSizing: "border-box"
              }}
              placeholder="Masukkan username"
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "bold", color: "#333" }}>Password</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%", padding: "10px", paddingRight: "40px", borderRadius: "4px",
                  border: "1px solid #ccc", boxSizing: "border-box"
                }}
                placeholder="Masukkan password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px",
                  color: "#666",
                  userSelect: "none"
                }}
                title={showPassword ? "Sembunyikan Kata Sandi" : "Tampilkan Kata Sandi"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "12px", backgroundColor: "#800000",
              color: "#fff", border: "none", borderRadius: "4px",
              fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer", fontSize: "16px"
            }}
          >
            {loading ? "Memproses..." : "Masuk Sistem"}
          </button>
        </form>
      </div>
    </div>
  );
}