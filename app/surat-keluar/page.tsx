"use client";
import { useEffect, useState } from "react";
import Link from "next/link"; 

export default function MonitoringSuratKeluar() {
  // Menggunakan any[] untuk konsistensi dengan struktur data folder dan file
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk Navigasi Folder (Explorer Mode)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  
  // State untuk Fitur Search & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadData = async () => {
    setLoading(true);
    try {
      // Endpoint disesuaikan ke surat-keluar
      const url = currentFolderId 
        ? `/api/surat-keluar?parentId=${currentFolderId}` 
        : "/api/surat-keluar?all=true";
      
      const res = await fetch(url);
      if (res.ok) {
        const d = await res.json();
        
        // Penanganan struktur data dari API (Mode Folder vs Mode All)
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
      console.error("Gagal load data surat keluar:", error);
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
      : "Apakah Anda yakin ingin menghapus arsip surat keluar ini?";

    if (confirm(message)) {
      try {
        const res = await fetch(`/api/surat-keluar?id=${id}&type=${type}`, { method: "DELETE" });
        if (res.ok) {
          alert("Data berhasil dihapus");
          loadData();
        }
      } catch (error) {
        alert("Gagal menghapus data");
      }
    }
  };

  // LOGIKA SEARCH: Mencari berdasarkan kolom utama surat keluar
  const filteredData = data.filter((item: any) => {
    const noBerkas = item.noBerkas || "";
    const penerima = item.alamatPenerima || item.tujuanSurat || item.kepadanya || "";
    const nomor = item.nomorSurat || "";
    const perihal = item.perihal || item.name || ""; 
    
    const searchStr = `${noBerkas} ${penerima} ${nomor} ${perihal}`.toLowerCase();
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
            MONITORING SURAT KELUAR
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
          <Link href="/surat-keluar/tambah" style={{ 
            background: '#800000', color: 'white', padding: '12px 24px', 
            borderRadius: '8px', fontWeight: 700, textDecoration: 'none', fontSize: '0.8rem',
            boxShadow: '0 4px 12px rgba(128,0,0,0.2)'
          }}>
            + INPUT SURAT BARU
          </Link>
        </div>
      </header>

      <div className="card-container" style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '10px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input 
              type="text"
              placeholder="Cari arsip keluar (No Berkas, Penerima, Nomor Surat, Perihal...)"
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
              {currentFolderId ? "ISI FOLDER SURAT KELUAR" : "DAFTAR ARSIP KELUAR DIGITAL (SELURUHNYA)"}
            </span>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>
              Menampilkan {currentItems.length} dari {filteredData.length} Berkas
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: '1500px', width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={thStyle}>NO</th>
                  <th style={thStyle}>NO. BERKAS</th>
                  <th style={thStyle}>ALAMAT PENERIMA / TUJUAN</th>
                  <th style={thStyle}>NOMOR SURAT</th>
                  <th style={thStyle}>TANGGAL</th>
                  <th style={thStyle}>P</th>
                  <th style={thStyle}>K</th>
                  <th style={thStyle}>PERIHAL</th>
                  <th style={thStyle}>DOKUMEN LAMPIRAN</th>
                  <th style={{ ...thStyle, borderRight: 'none', textAlign: 'center' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} style={statusTextStyle}>Sinkronisasi database keluar...</td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan={10} style={statusTextStyle}>Data surat keluar tidak ditemukan.</td></tr>
                ) : currentItems.map((item: any, index: number) => {
                  const isFolder = item.type === 'folder' || (!item.nomorSurat && item.name);
                  
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
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#1e293b' }}>
                        {isFolder ? "DIR" : (item.noBerkas || "-")}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: isFolder ? '#2563eb' : '#334155' }}>
                        {isFolder ? (
                          <button 
                            onClick={() => setCurrentFolderId(item.id)}
                            style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 800, cursor: 'pointer', textAlign: 'left', padding: 0 }}
                          >
                            📁 {item.name || "Folder Tanpa Nama"}
                          </button>
                        ) : (item.alamatPenerima || item.tujuanSurat || item.kepadanya || "-")}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 800, color: '#1e293b' }}>
                        {isFolder ? "-" : (item.nomorSurat || "-")}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: '0.8rem', color: '#475569', whiteSpace: 'nowrap' }}>
                          {item.tanggalSurat ? new Date(item.tanggalSurat).toLocaleDateString('id-ID') : '-'}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>{item.noPetunjuk || '-'}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>{item.noPaket || '-'}</td>
                      <td style={{ ...tdStyle, fontSize: '0.75rem', color: '#64748b', lineHeight: '1.5', maxWidth: '250px' }}>
                        {isFolder ? "Folder Penyimpanan Surat Keluar" : item.perihal}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {isFolder ? (
                            <span style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700 }}>DIREKTORI</span>
                          ) : files.length > 0 ? (
                            files.map((url: string, i: number) => {
                              const cleanUrl = url.trim();
                              // Menyesuaikan base path folder fisik ke surat-keluar secara eksplisit
                              const finalUrl = cleanUrl.startsWith('http') ? cleanUrl : `https://vbgygthhazkecogdleyd.supabase.co/storage/v1/object/public/surat-keluar/${cleanUrl}`;
                              const fileNameToDownload = cleanUrl.split('/').pop() || `surat_keluar_${i + 1}`;

                              return (
                                <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                  <a 
                                    href={finalUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    style={fileBadgeStyle}
                                  >
                                    📄 ARSIP {i + 1}
                                  </a>

                                  <a
                                    href={`${finalUrl}?download=`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={`Download Arsip ${i + 1}`}
                                    style={downloadBadgeStyle}
                                  >
                                    📥 DOWNLOAD
                                  </a>
                                </div>
                              );
                            })
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700, background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', width: 'fit-content' }}>
                              TANPA FILE
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, borderRight: 'none', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                          {!isFolder && (
                            <Link href={`/surat-keluar/edit/${item.id}`} style={{ color: '#2563eb', fontWeight: 800, textDecoration: 'none', fontSize: '0.7rem' }}>
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
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} style={{ ...btnPageStyle, opacity: currentPage === 1 ? 0.5 : 1 }}> Halaman Sebelumnya </button>
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
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} style={{ ...btnPageStyle, opacity: currentPage === totalPages ? 0.5 : 1 }}> Halaman Selanjutnya </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Konsistensi Style Object (CSS-in-JS)
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '1.2rem 1rem', fontSize: '0.65rem', color: '#475569', fontWeight: 900, textTransform: 'uppercase', borderRight: '1px solid #e2e8f0', letterSpacing: '0.5px' };
const tdStyle: React.CSSProperties = { padding: '1.2rem 1rem', fontSize: '0.85rem', borderRight: '1px solid #f1f5f9', verticalAlign: 'top' };
const fileBadgeStyle: React.CSSProperties = { background: '#fff1f2', color: '#800000', padding: '5px 10px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, textDecoration: 'none', border: '1px solid #fecaca', display: 'inline-flex', alignItems: 'center', gap: '6px', width: 'fit-content', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' };
const downloadBadgeStyle: React.CSSProperties = { background: '#f0fdf4', color: '#16a34a', padding: '5px 10px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, textDecoration: 'none', border: '1px solid #bbf7d0', display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', cursor: 'pointer' };
const btnPageStyle: React.CSSProperties = { padding: '8px 15px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s ease' };
const searchFieldStyle: React.CSSProperties = { width: '100%', padding: '12px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' };
const clearSearchBtnStyle: React.CSSProperties = { position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', fontWeight: 700 };
const cardStyle: React.CSSProperties = { background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' };
const cardHeaderStyle: React.CSSProperties = { padding: '1.25rem', background: '#fcfcfc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const deleteBtnStyle: React.CSSProperties = { background: 'none', border: 'none', color: '#ef4444', fontWeight: 800, cursor: 'pointer', fontSize: '0.7rem' };
const paginationWrapperStyle: React.CSSProperties = { padding: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', background: '#fcfcfc', borderTop: '1px solid #e2e8f0' };
const statusTextStyle: React.CSSProperties = { textAlign: 'center', padding: '4rem', color: '#94a3b8' };