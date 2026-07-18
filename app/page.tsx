"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const [stats, setStats] = useState({
    totalBerkas: 0,
    suratMasuk: 0,
    suratKeluar: 0,
    dokumenKerja: 0,
    dokumentasi: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const safeFetch = async (url: string) => {
          try {
            const res = await fetch(`${url}?mode=count`);
            if (!res.ok) return { files: [] };
            return await res.json();
          } catch (e) {
            return { files: [] };
          }
        };

        const [dataMasuk, dataKeluar, dataKerja, dataDok] = await Promise.all([
          safeFetch('/api/surat-masuk'),
          safeFetch('/api/surat-keluar'),
          safeFetch('/api/dokumen-kerja'),
          safeFetch('/api/dokumentasi')
        ]);

        const sm = dataMasuk.files?.length || 0;
        const sk = dataKeluar.files?.length || 0;
        const dk = dataKerja.files?.length || 0;
        const ds = dataDok.files?.length || 0;

        setStats({
          suratMasuk: sm,
          suratKeluar: sk,
          dokumenKerja: dk,
          dokumentasi: ds,
          totalBerkas: sm + sk + dk + ds
        });
      } catch (err) {
        console.error("Dashboard error:", err);
      }
    };

    fetchStats();
  }, []);

  // Fungsi Logout Sistem dimasukkan di dalam komponen utama
  const handleLogout = async () => {
    const confirmLogout = confirm("Apakah Anda yakin ingin keluar dari sistem?");
    if (!confirmLogout) return;

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Gagal logout:", error);
      alert("Terjadi kesalahan saat logout.");
    }
  };

  return (
    <>
      <header className="header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', background: 'white', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#800000', margin: 0 }}>E-ARSIP DASHBOARD</h1>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Dinas Pendidikan Kabupaten Bojonegoro &bull; Bidang Sarana Prasarana</p>
        </div>
        
        {/* Tombol interaktif menggantikan kotak ikon statis lama */}
        <button 
          onClick={handleLogout}
          title="Keluar dari Sistem"
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#800000';
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.borderColor = '#800000';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#f8fafc';
            e.currentTarget.style.color = '#1e293b';
            e.currentTarget.style.borderColor = '#e2e8f0';
          }}
          style={{ 
            padding: '0.5rem 1rem',
            background: '#f8fafc', 
            borderRadius: '8px', 
            border: '1px solid #e2e8f0', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '8px',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#1e293b',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <span>👤</span>
          <span>LOGOUT</span>
        </button>
      </header>

      <div className="card-container" style={{ padding: '2rem', backgroundColor: '#f4f7fa', minHeight: 'calc(100vh - 90px)' }}>
        
        {/* STATS SUMMARY - Diperbarui untuk menampilkan semua kategori */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '2rem' }}>
          {[
            { label: 'SURAT MASUK', value: stats.suratMasuk, color: '#1e293b' },
            { label: 'SURAT KELUAR', value: stats.suratKeluar, color: '#1e293b' },
            { label: 'DOKUMEN KERJA', value: stats.dokumenKerja, color: '#1e293b' },
            { label: 'DOKUMENTASI', value: stats.dokumentasi, color: '#1e293b' },
            { label: 'TOTAL BERKAS', value: stats.totalBerkas, color: '#800000' },
          ].map((stat, i) => (
            <div key={i} style={{ 
              background: 'white', 
              padding: '1.5rem', 
              borderRadius: '12px', 
              border: '1px solid #e2e8f0', 
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              borderLeft: i === 4 ? `4px solid ${stat.color}` : '1px solid #e2e8f0' // Aksen khusus untuk Total
            }}>
              <p style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, marginBottom: '8px', letterSpacing: '0.5px' }}>{stat.label}</p>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: stat.color, margin: 0 }}>
                {stat.value.toLocaleString('id-ID')}
              </h3>
            </div>
          ))}
        </div>

        {/* MAIN MENU */}
        <div className="data-card" style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem', background: '#fcfcfc', borderBottom: '1px solid #e2e8f0' }}>
            <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#475569' }}>NAVIGASI ARSIP DIGITAL</span>
          </div>

          <div style={{ padding: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
              <MenuCard href="/surat-masuk/berkas" icon="📩" title="SURAT MASUK" desc="Kelola arsip surat masuk regency secara terpusat." />
              <MenuCard href="/surat-keluar/berkas" icon="📤" title="SURAT KELUAR" desc="Akses folder dan berkas surat keluar sarana prasarana." />
              <MenuCard href="/dokumen-kerja/berkas" icon="📁" title="DOKUMEN KERJA" desc="Penyimpanan laporan, nota dinas, dan administrasi kerja." />
              <MenuCard href="/dokumentasi/berkas" icon="📸" title="DOKUMENTASI" desc="Galeri digital dokumentasi kegiatan dan fisik sarpras." />
            </div>
          </div>
        </div>

        <footer style={{ marginTop: '3rem', textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
          E-ARSIP DIGITAL &bull; DINAS PENDIDIKAN KABUPATEN BOJONEGORO &bull; 2026
        </footer>
      </div>
    </>
  );
}

function MenuCard({ href, icon, title, desc }: { href: string, icon: string, title: string, desc: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{ padding: '2rem', background: '#fff', borderRadius: '12px', border: '1.5px solid #e2e8f0', transition: '0.2s', textAlign: 'center', height: '100%' }} 
           onMouseOver={(e) => { e.currentTarget.style.borderColor = '#800000'; e.currentTarget.style.transform = 'translateY(-5px)'; }} 
           onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{icon}</div>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 900, color: '#1e293b', margin: '0 0 8px 0' }}>{title}</h4>
        <p style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: '1.5', margin: 0 }}>{desc}</p>
      </div>
    </Link>
  );
}