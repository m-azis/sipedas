"use client";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function EditDokumentasi() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploadMode, setUploadMode] = useState<"file" | "folder">("file");
  const [formData, setFormData] = useState<any>({
    namaDokumen: "",
    tanggal: "",
    tempat: "",
  });

  // Fungsi pembantu untuk memformat tanggal ke YYYY-MM-DD agar bisa terbaca oleh input type="date"
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  useEffect(() => {
    const fetchDokumentasi = async () => {
      try {
        // Mengambil data dari endpoint dokumentasi
        const res = await fetch(`/api/dokumentasi/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setFormData(data);
        }
      } catch (error) {
        console.error("Gagal mengambil data dokumentasi:", error);
      } finally {
        setFetching(false);
      }
    };
    fetchDokumentasi();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const dataToSend = new FormData(e.currentTarget);
    
    // Mengarah ke endpoint dokumentasi dengan method PUT
    const res = await fetch(`/api/dokumentasi/${params.id}`, { 
      method: "PUT", 
      body: dataToSend 
    });

    if (res.ok) { 
      alert("Perubahan Dokumentasi Berhasil Disimpan!"); 
      router.push("/dokumentasi/berkas"); 
      router.refresh();
    } else {
      alert("Gagal memperbarui data dokumentasi.");
    }
    setLoading(false);
  };

  if (fetching) return <div style={{ padding: '4rem', textAlign: 'center', color: '#800000', fontWeight: 800 }}>MENGAMBIL DATA DOKUMENTASI...</div>;

  return (
    <div className="page-wrapper" style={{ 
      backgroundColor: '#f4f7fa', 
      minHeight: '100vh', 
      paddingBottom: '3rem',
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>
      {/* HEADER */}
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
          <div style={{ textAlign: 'left' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#800000', margin: 0 }}>E-ARSIP</h1>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', margin: 0 }}>
              Dinas Pendidikan Kabupaten Bojonegoro
            </p>
          </div>
          <button 
            onClick={() => router.back()} 
            style={{ 
              background: 'white', border: '1.5px solid #e2e8f0', padding: '10px 24px', 
              borderRadius: '10px', fontWeight: 800, fontSize: '0.8rem', color: '#475569', cursor: 'pointer' 
            }}
          >
            ← KEMBALI
          </button>
        </div>
      </header>

      {/* CARD FORM */}
      <div className="form-card" style={{
        maxWidth: '1000px', margin: '2.5rem auto', background: 'white',
        borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden'
      }}>
        <div style={{ padding: '1.8rem 2.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '6px', height: '24px', background: '#800000', borderRadius: '10px' }}></div>
          <h2 style={{ fontWeight: 900, color: '#1e293b', fontSize: '1.3rem', margin: 0 }}>EDIT DATA DOKUMENTASI</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
            
            <div className="input-group">
              <label style={labelStyle}>Nama Dokumentasi</label>
              <input 
                name="namaDokumen" 
                required 
                defaultValue={formData.namaDokumen} 
                style={inputStyle} 
                placeholder="Masukkan judul atau nama dokumentasi..."
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.8rem' }}>
              <div className="input-group">
                <label style={labelStyle}>Tanggal Dokumentasi</label>
                <input 
                  name="tanggal" 
                  type="date" 
                  required 
                  defaultValue={formatDateForInput(formData.tanggal)} 
                  style={inputStyle} 
                />
              </div>

              <div className="input-group">
                <label style={labelStyle}>Tempat Kegiatan</label>
                <input 
                  name="tempat" 
                  required 
                  defaultValue={formData.tempat} 
                  style={inputStyle} 
                  placeholder="Contoh: Ruang Rapat Lt. 2"
                />
              </div>
            </div>

            {/* Upload Section */}
            <div style={{ background: '#fdf2f2', border: '2px dashed #f87171', padding: '2rem', borderRadius: '16px' }}>
              <label style={{ display: 'block', marginBottom: '20px', color: '#800000', fontWeight: 900, fontSize: '0.85rem', textAlign: 'center' }}>
                📎 UPDATE LAMPIRAN DOKUMENTASI (OPSIONAL)
              </label>
              
              <div style={{ display: 'flex', gap: '15px', marginBottom: '1.5rem' }}>
                <button type="button" onClick={() => setUploadMode("file")} style={{ ...toggleBtnStyle, background: uploadMode === 'file' ? '#800000' : 'white', color: uploadMode === 'file' ? 'white' : '#64748b' }}>UPLOAD FILE</button>
                <button type="button" onClick={() => setUploadMode("folder")} style={{ ...toggleBtnStyle, background: uploadMode === 'folder' ? '#800000' : 'white', color: uploadMode === 'folder' ? 'white' : '#64748b' }}>UPLOAD FOLDER</button>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <p style={{fontSize: '0.75rem', fontWeight: 700, color: '#991b1b', marginBottom: '12px'}}>
                  Kosongkan jika tidak ingin mengganti file dokumentasi yang sudah ada
                </p>
                <input 
                  type="file" name="files" multiple 
                  {...(uploadMode === "folder" ? { webkitdirectory: "", directory: "" } : ({} as any))}
                  style={{ fontSize: '0.85rem', background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #fecaca' }}
                />
              </div>
            </div>
          </div>
          
          <div style={{ padding: '2rem 2.5rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
            <button 
              type="submit" disabled={loading} 
              style={{ 
                width: '100%', background: loading ? '#94a3b8' : '#800000', color: 'white', 
                border: 'none', padding: '20px', borderRadius: '12px', fontWeight: 900, 
                fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 10px 15px -3px rgba(128, 0, 0, 0.3)'
              }}
            >
              {loading ? "MENYIMPAN PERUBAHAN..." : "UPDATE DATA DOKUMENTASI"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Styles
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '10px', textTransform: 'uppercase'
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '14px 18px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem', background: '#f8fafc'
};

const toggleBtnStyle: React.CSSProperties = {
  flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', transition: '0.3s'
};