"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function MonitoringDokumenKerja() {
  // State data utama
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk Navigasi Folder
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  
  // State untuk Fitur Search & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadData = async () => {
    setLoading(true);
    try {
      // Jika tidak di dalam folder, ambil semua data (all=true) dari endpoint dokumen-kerja
      const url = currentFolderId 
        ? `/api/dokumen-kerja?parentId=${currentFolderId}` 
        : "/api/dokumen-kerja?all=true";
      
      const res = await fetch(url);
      if (res.ok) {
        const d = await res.json();
        
        // Penanganan struktur data dari API (Folder vs File)
        if (Array.isArray(d)) {
          setData(d);
        } else if (d.folders || d.files) {
          const combined = [
            ...(d.folders || []).map((f: any) => ({ ...f, type: 'folder' })),
            ...(d.files || []).map((f: any) => ({ ...f, type: 'file' }))
          ];
          setData(combined);
        } else {
          setData(d.data || []);
        }
      }
    } catch (error) {
      console.error("Gagal load data dokumen kerja:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentFolderId]);

  const handleDelete = async (id: any, type: string) => {
    const message = type === 'folder' 
      ? "Hapus folder ini? Semua isi di dalamnya mungkin tidak akan terlihat." 
      : "Apakah Anda yakin ingin menghapus data dokumen kerja ini?";

    if (confirm(message)) {
      try {
        const res = await fetch(`/api/dokumen-kerja?id=${id}&type=${type}`, { method: "DELETE" });
        if (res.ok) {
          alert("Data berhasil dihapus");
          loadData();
        }
      } catch (error) {
        alert("Gagal menghapus data");
      }
    }
  };

  // LOGIKA SEARCH (Disesuaikan dengan field Dokumen Kerja)
  const filteredData = data.filter((item: any) => {
    const nama = item.namaDokumen || item.name || "";
    const tempat = item.tempat || "";
    
    const searchStr = `${nama} ${tempat}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  // LOGIKA PAGINATION
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <div style={{ backgroundColor: '#f4f7fa', minHeight: '100vh' }}>
      <header className="header-bar" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1.5rem 2rem', 
        background: 'white', 
        borderBottom: '1px solid #e2e8f0' 
      }}>
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#800000', margin: 0 }}>
            MONITORING DOKUMEN KERJA
          </h1>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>
            Dinas Pendidikan Kabupaten Bojonegoro &bull; Bidang Sarana Prasarana
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {currentFolderId && (
            <button 
              onClick={() => setCurrentFolderId(null)}
              style={{ ...btnPageStyle, background: '#64748b', color: 'white' }}
            >
              ⬅ KEMBALI KE SEMUA DATA
            </button>
          )}
          <Link href="/dokumen-kerja/tambah" style={{ 
            background: '#800000', color: 'white', padding: '12px 24px', 
            borderRadius: '8px', fontWeight: 700, textDecoration: 'none', fontSize: '0.8rem',
            boxShadow: '0 4px 12px rgba(128,0,0,0.2)'
          }}>
            + INPUT DOKUMEN BARU
          </Link>
        </div>
      </header>

      <div className="card-container" style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '10px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input 
              type="text"
              placeholder="Cari berdasarkan nama dokumen atau tempat..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={searchFieldStyle}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                style={clearSearchBtnStyle}
              >✕</button>
            )}
          </div>
        </div>

        <div className="data-card" style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#475569' }}>
              {currentFolderId ? "ISI FOLDER" : "DAFTAR ARSIP DOKUMEN KERJA"}
            </span>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>
              Menampilkan {currentItems.length} dari {filteredData.length} Berkas
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: '1000px', width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ ...thStyle, width: '60px' }}>NO</th>
                  <th style={thStyle}>NAMA DOKUMEN / FOLDER</th>
                  <th style={thStyle}>TANGGAL</th>
                  <th style={thStyle}>TEMPAT</th>
                  <th style={thStyle}>FILE LAMPIRAN</th>
                  <th style={{ ...thStyle, borderRight: 'none', textAlign: 'center' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={statusTextStyle}>Menghubungkan ke database...</td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan={6} style={statusTextStyle}>Data dokumen kerja tidak ditemukan.</td></tr>
                ) : currentItems.map((item: any, index: number) => {
                  const isFolder = item.type === 'folder' || (!item.namaDokumen && item.name);
                  
                  // NORMALISASI PATH DAN ARRAY BERKAS AGAR TIDAK ERROR 404
                  let files: string[] = [];
                  if (item.fileUrl) {
                    if (Array.isArray(item.fileUrl)) {
                      files = item.fileUrl;
                    } else if (typeof item.fileUrl === 'string') {
                      files = item.fileUrl.split(/[ ,]+/).filter(Boolean);
                    }
                  }

                  return (
                    <tr key={item.id} style={{ background: index % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 800, color: '#800000' }}>
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: isFolder ? '#2563eb' : '#334155' }}>
                        {isFolder ? (
                          <button 
                            onClick={() => setCurrentFolderId(item.id)}
                            style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 800, cursor: 'pointer', textAlign: 'left', padding: 0 }}
                          >
                            📁 {item.name || "Folder Tanpa Nama"}
                          </button>
                        ) : (item.namaDokumen || "-")}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: '0.8rem', color: '#475569', whiteSpace: 'nowrap' }}>
                          {item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>
                        {isFolder ? "-" : (item.tempat || "-")}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {isFolder ? (
                            <span style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700 }}>DIREKTORI</span>
                          ) : files.length > 0 ? (
                            files.map((url: string, i: number) => {
                              const cleanUrl = url.trim();
                              // Mengalihkan secara penuh dari public local /uploads/ ke cloud Supabase Storage
                              const finalUrl = cleanUrl.startsWith('http') ? cleanUrl : `https://vbgygthhazkecogdleyd.supabase.co/storage/v1/object/public/dokumen-kerja/${cleanUrl}`;
                              
                              // Mengambil potongan nama file asli sebagai nama file hasil download
                              const fileNameToDownload = cleanUrl.split('/').pop() || `berkas_${i + 1}`;
                              
                              return (
                                <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                  <a 
                                    href={finalUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    style={fileBadgeStyle}
                                  >
                                    📄 LIHAT BERKAS
                                  </a>
                                  
                                  {/* FITUR DOWNLOAD BERKAS */}
                                  <a
                                    href={`${finalUrl}?download=`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={`Download Berkas ${i + 1}`}
                                    style={downloadBadgeStyle}
                                  >
                                    📥 DOWNLOAD
                                  </a>
                                </div>
                              );
                            })
                          ) : (
                            <span style={{ color: '#cbd5e1', fontSize: '0.7rem' }}>Tidak ada file</span>
                          )}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, borderRight: 'none', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                          {!isFolder && (
                            <Link href={`/dokumen-kerja/edit/${item.id}`} style={{ color: '#2563eb', fontWeight: 800, textDecoration: 'none', fontSize: '0.7rem' }}>
                              EDIT
                            </Link>
                          )}
                          <button onClick={() => handleDelete(item.id, isFolder ? 'folder' : 'file')} style={deleteBtnStyle}>
                            HAPUS
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!loading && totalPages > 1 && (
            <div style={paginationWrapperStyle}>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} style={{ ...btnPageStyle, opacity: currentPage === 1 ? 0.5 : 1 }}> Sebelumnya </button>
              <div style={{ display: 'flex', gap: '5px' }}>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i} onClick={() => setCurrentPage(i + 1)}
                    style={{
                      ...btnPageStyle,
                      background: currentPage === i + 1 ? '#800000' : 'white',
                      color: currentPage === i + 1 ? 'white' : '#475569',
                      borderColor: currentPage === i + 1 ? '#800000' : '#e2e8f0',
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} style={{ ...btnPageStyle, opacity: currentPage === totalPages ? 0.5 : 1 }}> Selanjutnya </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// CSS-in-JS Styles (Consistent with reference)
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '1.2rem 1rem', fontSize: '0.65rem', color: '#475569', fontWeight: 900, textTransform: 'uppercase', borderRight: '1px solid #e2e8f0', letterSpacing: '0.5px' };
const tdStyle: React.CSSProperties = { padding: '1.2rem 1rem', fontSize: '0.85rem', borderRight: '1px solid #f1f5f9', verticalAlign: 'top' };
const fileBadgeStyle: React.CSSProperties = { background: '#fff1f2', color: '#800000', padding: '5px 10px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, textDecoration: 'none', border: '1px solid #fecaca', display: 'inline-flex', alignItems: 'center', gap: '6px', width: 'fit-content', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' };

// Style Baru Tambahan untuk Tombol Download
const downloadBadgeStyle: React.CSSProperties = { background: '#f0fdf4', color: '#16a34a', padding: '5px 10px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, textDecoration: 'none', border: '1px solid #bbf7d0', display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', cursor: 'pointer' };

const btnPageStyle: React.CSSProperties = { padding: '8px 15px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s ease' };
const searchFieldStyle: React.CSSProperties = { width: '100%', padding: '12px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' };
const clearSearchBtnStyle: React.CSSProperties = { position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', fontWeight: 700 };
const cardStyle: React.CSSProperties = { background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' };
const cardHeaderStyle: React.CSSProperties = { padding: '1.25rem', background: '#fcfcfc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const deleteBtnStyle: React.CSSProperties = { background: 'none', border: 'none', color: '#ef4444', fontWeight: 800, cursor: 'pointer', fontSize: '0.7rem' };
const paginationWrapperStyle: React.CSSProperties = { padding: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', background: '#fcfcfc', borderTop: '1px solid #e2e8f0' };
const statusTextStyle: React.CSSProperties = { textAlign: 'center', padding: '4rem', color: '#94a3b8' };