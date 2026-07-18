"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TambahSuratKeluar() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "folder">("file");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const dataToSend = new FormData(e.currentTarget);
    
    // Menggunakan metode POST untuk menambah data baru ke endpoint surat-keluar
    const res = await fetch("/api/surat-keluar", { 
      method: "POST", 
      body: dataToSend 
    });

    if (res.ok) { 
      alert("Arsip Surat Keluar Berhasil Ditambahkan!"); 
      router.push("/surat-keluar"); 
      router.refresh();
    } else {
      alert("Gagal menambahkan data. Pastikan semua field wajib terisi.");
    }
    setLoading(false);
  };

  return (
    <div className="page-wrapper" style={{ 
      backgroundColor: '#f4f7fa', 
      minHeight: '100vh', 
      paddingBottom: '3rem',
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>
      {/* HEADER: Brand di Kiri, Tombol di Kanan */}
      <header className="header-bar" style={{ 
        background: 'white', 
        borderBottom: '1px solid #e2e8f0', 
        padding: '1.2rem 0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}>
        <div className="header-content" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          width: '100%', 
          maxWidth: '1000px', 
          margin: '0 auto',
          padding: '0 2rem' 
        }}>
          {/* BAGIAN KIRI: BRAND */}
          <div style={{ textAlign: 'left' }}>
            <h1 className="brand-title" style={{ 
              fontSize: '1.6rem', 
              fontWeight: 900, 
              color: '#800000', 
              margin: 0,
              letterSpacing: '-0.5px'
            }}>E-ARSIP</h1>
            <p className="brand-sub" style={{ 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              color: '#64748b', 
              textTransform: 'uppercase',
              letterSpacing: '1px',
              margin: 0 
            }}>Dinas Pendidikan Kabupaten Bojonegoro</p>
          </div>

          {/* BAGIAN KANAN: TOMBOL KEMBALI */}
          <button 
            onClick={() => router.back()} 
            className="btn-back" 
            style={{ 
              background: 'white', 
              border: '1.5px solid #e2e8f0', 
              padding: '10px 24px', 
              borderRadius: '10px', 
              fontWeight: 800, 
              fontSize: '0.8rem', 
              color: '#475569', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>←</span> KEMBALI
          </button>
        </div>
      </header>

      {/* CARD FORM */}
      <div className="form-card" style={{
        maxWidth: '1000px',
        margin: '2.5rem auto',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
      }}>
        <div className="form-header" style={{
          padding: '1.8rem 2.5rem',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          background: '#fcfdfe'
        }}>
          <div className="header-accent" style={{
            width: '6px',
            height: '24px',
            background: '#800000',
            borderRadius: '10px'
          }}></div>
          <h2 style={{ fontWeight: 900, color: '#1e293b', fontSize: '1.3rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Tambah Data Surat Keluar
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-body" style={{
            padding: '2.5rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.8rem'
          }}>
            {/* Field Nomor Urut */}
            <div className="input-group">
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '10px', textTransform: 'uppercase' }}>Nomor Urut</label>
              <input name="noUrut" type="number" required placeholder="Masukkan nomor urut" style={{ width: '100%', padding: '14px 18px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem', background: '#f8fafc' }} />
            </div>
            
            {/* Field Nomor Berkas */}
            <div className="input-group">
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '10px', textTransform: 'uppercase' }}>Nomor Berkas</label>
              <input name="noBerkas" required placeholder="Masukkan nomor berkas" style={{ width: '100%', padding: '14px 18px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem', background: '#f8fafc' }} />
            </div>

            {/* Field Tujuan Surat (Full Width - Pengganti Alamat Pengirim) */}
            <div className="input-group full-width" style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '10px', textTransform: 'uppercase' }}>Tujuan Surat</label>
              <input name="tujuanSurat" required placeholder="Masukkan instansi/nama tujuan" style={{ width: '100%', padding: '14px 18px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem', background: '#f8fafc' }} />
            </div>

            {/* Field Nomor Surat */}
            <div className="input-group">
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '10px', textTransform: 'uppercase' }}>Nomor Surat</label>
              <input name="nomorSurat" required placeholder="Masukkan nomor surat resmi" style={{ width: '100%', padding: '14px 18px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem', background: '#f8fafc' }} />
            </div>

            {/* Field Tanggal Surat */}
            <div className="input-group">
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '10px', textTransform: 'uppercase' }}>Tanggal Surat</label>
              <input name="tanggalSurat" type="date" required style={{ width: '100%', padding: '14px 18px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem', background: '#f8fafc' }} />
            </div>

            {/* Field No Petunjuk */}
            <div className="input-group">
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '10px', textTransform: 'uppercase' }}>No. Petunjuk (P)</label>
              <input name="noPetunjuk" placeholder="Isi no petunjuk" style={{ width: '100%', padding: '14px 18px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem', background: '#f8fafc' }} />
            </div>

            {/* Field No Paket */}
            <div className="input-group">
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '10px', textTransform: 'uppercase' }}>No. Paket (K)</label>
              <input name="noPaket" placeholder="Isi no paket" style={{ width: '100%', padding: '14px 18px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem', background: '#f8fafc' }} />
            </div>

            {/* Field Perihal (Full Width) */}
            <div className="input-group full-width" style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '10px', textTransform: 'uppercase' }}>Perihal Surat</label>
              <textarea name="perihal" rows={4} required placeholder="Ringkasan perihal surat keluar..." style={{ width: '100%', padding: '14px 18px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem', background: '#f8fafc', resize: 'vertical', lineHeight: '1.6' }}></textarea>
            </div>

            {/* Upload Section */}
            <div className="upload-container" style={{ gridColumn: 'span 2', background: '#fdf2f2', border: '2px dashed #f87171', padding: '2rem', borderRadius: '16px', marginTop: '10px' }}>
              <label style={{ display: 'block', marginBottom: '20px', color: '#800000', fontWeight: 900, fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'center' }}>
                📎 Unggah Lampiran Digital (Opsional)
              </label>
              
              <div className="upload-mode-toggle" style={{ display: 'flex', gap: '15px', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.5)', padding: '6px', borderRadius: '12px' }}>
                <button 
                  type="button" 
                  className={`btn-toggle ${uploadMode === 'file' ? 'active' : ''}`}
                  onClick={() => setUploadMode("file")}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: uploadMode === 'file' ? '#800000' : 'transparent', color: uploadMode === 'file' ? 'white' : '#64748b', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', transition: '0.3s' }}
                >
                  UPLOAD FILE
                </button>
                <button 
                  type="button" 
                  className={`btn-toggle ${uploadMode === 'folder' ? 'active' : ''}`}
                  onClick={() => setUploadMode("folder")}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: uploadMode === 'folder' ? '#800000' : 'transparent', color: uploadMode === 'folder' ? 'white' : '#64748b', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', transition: '0.3s' }}
                >
                  UPLOAD FOLDER
                </button>
              </div>
              
              <div className="file-input-wrapper" style={{ textAlign: 'center' }}>
                <input 
                  type="file" 
                  name="files" 
                  multiple 
                  {...(uploadMode === "folder" ? { webkitdirectory: "", directory: "" } : ({} as any))}
                  style={{ 
                    fontSize: '0.85rem', 
                    color: '#475569',
                    background: 'white',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #fecaca',
                    cursor: 'pointer'
                  }}
                />
              </div>
            </div>
          </div>
          
          <div className="form-footer" style={{ padding: '2rem 2.5rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
            <button 
              type="submit" 
              disabled={loading} 
              className="btn-submit" 
              style={{ 
                width: '100%', 
                background: loading ? '#94a3b8' : '#800000', 
                color: 'white', 
                border: 'none', 
                padding: '20px', 
                borderRadius: '12px', 
                fontWeight: 900, 
                fontSize: '1rem', 
                cursor: loading ? 'not-allowed' : 'pointer', 
                transition: 'all 0.3s ease',
                boxShadow: loading ? 'none' : '0 10px 15px -3px rgba(128, 0, 0, 0.3)'
              }}
            >
              {loading ? "SEDANG MENYIMPAN..." : "SIMPAN ARSIP SURAT KELUAR"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}