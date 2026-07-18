import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SIPEDAS",
  description: "Dinas Pendidikan Kabupaten Bojonegoro",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <div className="layout-container">
          <aside className="sidebar">
            <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
              
              {/* Pembungkus Logo Resmi Dinas Pendidikan */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                marginBottom: '1rem' 
              }}>
                <img 
                  src="/logo.ico" 
                  alt="Logo Dinas Pendidikan Bojonegoro" 
                  style={{ 
                    width: '65px', 
                    height: 'auto',
                    objectFit: 'contain'
                  }} 
                />
              </div>

              <div style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '2px' }}>SIPEDAS</div>
              <div style={{ fontSize: '0.6rem', color: '#fca5a5', fontWeight: 700, marginTop: '5px', letterSpacing: '1px' }}>
                DINAS PENDIDIKAN BOJONEGORO
              </div>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', marginTop: '1.5rem' }}></div>
            </div>
            
            <nav style={{ marginTop: '0.5rem' }}>
              <Link href="/" className="nav-item">
                📊 <span style={{marginLeft:'15px'}}>DASHBOARD</span>
              </Link>
              
              <Link href="/surat-masuk" className="nav-item">
                📩 <span style={{marginLeft:'15px'}}>SURAT MASUK</span>
              </Link>
              
              <Link href="/surat-keluar" className="nav-item">
                📤 <span style={{marginLeft:'15px'}}>SURAT KELUAR</span>
              </Link>

              {/* Menu Baru: Dokumen Kerja */}
              <Link href="/dokumen-kerja" className="nav-item">
                📁 <span style={{marginLeft:'15px'}}>DOKUMEN KERJA</span>
              </Link>

              {/* Menu Baru: Dokumentasi */}
              <Link href="/dokumentasi" className="nav-item">
                📸 <span style={{marginLeft:'15px'}}>DOKUMENTASI</span>
              </Link>
            </nav>
          </aside>

          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}