"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface FileItem {
  id: string;
  name: string;
  type: "file" | "folder";
  updatedAt: string;
  category?: string;
  parentId: string | null;
  fileUrl?: string;
}

export default function ManajemenBerkasSuratKeluar() {
  const router = useRouter();
  const [items, setItems] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [movingItems, setMovingItems] = useState<{ ids: string[], names: string } | null>(null);
  
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Memuat data arsip surat keluar dari API
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/surat-keluar?parentId=${currentPath || "null"}`);
      if (!res.ok) throw new Error("Server error");
      
      const data = await res.json();
      const folders = Array.isArray(data.folders) ? data.folders : [];
      const files = Array.isArray(data.files) ? data.files : [];

      const mappedFolders: FileItem[] = folders.map((f: any) => ({
        id: f.id.toString(),
        name: f.name,
        type: "folder",
        updatedAt: new Date(f.createdAt).toLocaleDateString('id-ID'),
        category: "Sistem Folder",
        parentId: f.parentId
      }));

      const mappedFiles: FileItem[] = files.map((f: any) => ({
        id: f.id.toString(),
        name: f.perihal || "Tanpa Judul",
        type: "file",
        updatedAt: new Date(f.createdAt).toLocaleDateString('id-ID'),
        category: "Surat Keluar",
        fileUrl: f.fileUrl
      }));

      setItems([...mappedFolders, ...mappedFiles]);
      setSelectedIds([]); 
    } catch (err) {
      console.error("Gagal memuat data surat keluar:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPath]);

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateFolder = async () => {
    if (!folderName) return;
    try {
      const res = await fetch("/api/surat-keluar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: folderName, parentId: currentPath }),
      });
      if (res.ok) {
        setFolderName("");
        setShowCreateModal(false);
        loadData(); 
      }
    } catch (err) {
      alert("Gagal membuat folder.");
    }
  };

  // HANDLER BULK UPLOAD TERPISAH (Satu File = Satu Data Record Baru)
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);

    try {
      // Pecah setiap berkas ke dalam promise fetch individual
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        
        // Bersihkan nama file dari path absolut browser jika ada (mencegah eror upload folder)
        const cleanName = file.name.split(/[\\/]/).pop() || file.name;
        
        // Masukkan hanya SATU file dan SATU nama path per request FormData
        formData.append("files", file);
        formData.append("paths", cleanName);

        // Metadata diset mandiri untuk tiap berkas
        formData.append("folderId", currentPath || "null");
        formData.append("noUrut", "0");
        formData.append("noBerkas", "-");
        formData.append("tujuanSurat", "-"); 
        formData.append("tanggalSurat", new Date().toISOString());
        formData.append("nomorSurat", "-");
        
        // Perihal otomatis menggunakan nama asli dari masing-masing berkas agar terpisah di DB
        formData.append("perihal", cleanName); 

        // Kirim request tunggal untuk berkas ini
        const res = await fetch("/api/surat-keluar", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const text = await res.text();
          let errorMsg = `Gagal mengunggah ${file.name}`;
          try {
            const json = JSON.parse(text);
            errorMsg = json.details || json.error || errorMsg;
          } catch {
            errorMsg = text || errorMsg;
          }
          throw new Error(errorMsg);
        }

        return file.name;
      });

      // Jalankan semua proses upload secara paralel di background
      await Promise.all(uploadPromises);

      alert(`Berhasil mengunggah ${files.length} berkas secara terpisah.`);
      loadData(); 
    } catch (err: any) {
      console.error("Bulk upload error:", err);
      alert(`Terjadi kesalahan saat upload massal:\n${err.message || err}`);
    } finally {
      setLoading(false);
      e.target.value = ""; 
    }
  };

  const startMovingSingle = (id: string, name: string) => {
    setMovingItems({ ids: [id], names: name });
  };

  const startMovingBulk = () => {
    if (selectedIds.length === 0) return;
    const names = `${selectedIds.length} item terpilih`;
    setMovingItems({ ids: selectedIds, names: names });
  };

  const handlePaste = async (targetFolderId: string | null) => {
    if (!movingItems) return;
    
    if (movingItems.ids.includes(targetFolderId as string)) {
      alert("Tidak dapat memindahkan folder ke dalam dirinya sendiri.");
      return;
    }

    setLoading(true);
    try {
      const movePromises = movingItems.ids.map(id => {
        const item = items.find(i => i.id === id);
        return fetch("/api/surat-keluar/move", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            id: id, 
            type: item?.type, 
            targetFolderId: targetFolderId 
          }),
        });
      });

      await Promise.all(movePromises);
      setMovingItems(null);
      loadData();
    } catch (err) {
      alert("Terjadi kesalahan saat memindahkan item.");
    } finally {
      setLoading(false);
    }
  };

  const onDragStart = (e: React.DragEvent, id: string, type: string) => {
    e.dataTransfer.setData("id", id);
    e.dataTransfer.setData("type", type);
  };

  const onDrop = async (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("id");
    const type = e.dataTransfer.getData("type");
    if (draggedId === targetFolderId) return;

    try {
      const res = await fetch("/api/surat-keluar/move", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: draggedId, 
          type: type, 
          targetFolderId: targetFolderId 
        }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, type: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus ${type === 'folder' ? 'folder' : 'file'} ini?`)) return;
    
    setLoading(true);
    try {
      const url = type === "folder" 
        ? `/api/surat-keluar?id=${id}&type=folder` 
        : `/api/surat-keluar/${id}`;

      const res = await fetch(url, { 
        method: "DELETE" 
      });

      if (res.ok) {
        await loadData();
      } else {
        const errorText = await res.text();
        let errorMessage = "Gagal menghapus item.";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        alert(errorMessage);
      }
    } catch (err) { 
      console.error("Delete error:", err);
      alert("Gagal menghapus. Cek konsol browser untuk detail."); 
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Hapus ${selectedIds.length} item terpilih secara permanen?`)) return;
    
    setLoading(true);
    try {
      const deletePromises = selectedIds.map(id => {
        const item = items.find(i => i.id === id);
        const url = item?.type === "folder" 
          ? `/api/surat-keluar?id=${id}&type=folder` 
          : `/api/surat-keluar/${id}`;
          
        return fetch(url, { method: "DELETE" });
      });

      const results = await Promise.all(deletePromises);
      const allOk = results.every(res => res.ok);

      if (allOk) {
        await loadData();
      } else {
        alert("Beberapa item gagal dihapus.");
        await loadData();
      }
    } catch (err) { 
      alert("Gagal menghapus massal."); 
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div style={{ backgroundColor: '#f4f7fa', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* HEADER TEMA MAROON & PUTIH */}
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem 2rem', background: 'white', borderBottom: '1px solid #e2e8f0' }}>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#800000', margin: 0 }}>PENYIMPANAN DIGITAL SURAT KELUAR</h1>
          <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>Dinas Pendidikan Kabupaten Bojonegoro</p>
        </div>
        <button onClick={() => currentPath ? setCurrentPath(null) : router.back()} style={btnSecondaryStyle}>
          {currentPath ? "← KE ROOT" : "← KEMBALI"}
        </button>
      </header>

      <div style={{ padding: '2rem' }}>
        {movingItems && (
          <div style={moveBannerStyle}>
            <span>
              Memindahkan <strong>{movingItems.names}</strong>. Navigasi ke folder tujuan lalu klik Paste.
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => handlePaste(currentPath)} style={btnPasteStyle}>📋 PASTE DI SINI</button>
              <button onClick={() => setMovingItems(null)} style={btnCancelMoveStyle}>BATAL</button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => setShowCreateModal(true)} style={btnPrimaryStyle}>+ FOLDER BARU</button>
            
            <label style={btnSecondaryStyle}>
              📄 UPLOAD FILE <input type="file" hidden multiple onChange={handleUploadFile} />
            </label>

            <label style={btnSecondaryStyle}>
              📁 UPLOAD FOLDER 
              <input 
                type="file" 
                hidden 
                /* @ts-ignore */
                webkitdirectory="" 
                directory="" 
                onChange={handleUploadFile} 
              />
            </label>

            {selectedIds.length > 0 && (
              <>
                <button onClick={startMovingBulk} style={btnMoveBulkStyle}>🚚 PINDAHKAN ({selectedIds.length})</button>
                <button onClick={handleBulkDelete} style={btnDangerStyle}>🗑️ HAPUS ({selectedIds.length})</button>
              </>
            )}
          </div>

          <div style={{ width: '100%', maxWidth: '300px' }}>
            <input 
              type="text" 
              placeholder="Cari arsip surat keluar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={searchFieldStyle}
            />
          </div>
        </div>

        <div style={tableContainerStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ ...thStyle, width: '50px' }}>
                  <input type="checkbox" onChange={(e) => setSelectedIds(e.target.checked ? filteredItems.map(i => i.id) : [])} />
                </th>
                <th style={{ ...thStyle, width: '80px' }}>TIPE</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>NAMA FOLDER / PERIHAL SURAT KELUAR</th>
                <th style={{ ...thStyle, width: '180px', textAlign: 'left' }}>TANGGAL MODIFIKASI</th>
                <th style={{ ...thStyle, width: '220px', borderRight: 'none' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={statusTextStyle}>Memproses data...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={5} style={statusTextStyle}>Folder kosong.</td></tr>
              ) : filteredItems.map((item, index) => (
                <tr 
                  key={item.id} 
                  draggable 
                  onDragStart={(e) => onDragStart(e, item.id, item.type)}
                  onDragOver={(e) => item.type === 'folder' ? e.preventDefault() : undefined}
                  onDrop={(e) => item.type === 'folder' ? onDrop(e, item.id) : undefined}
                  style={{ 
                    background: movingItems?.ids.includes(item.id) ? '#fff7ed' : (index % 2 === 0 ? '#fff' : '#fafafa'), 
                    borderBottom: '1px solid #e2e8f0' 
                  }}
                >
                  <td style={tdStyle}>
                    <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} />
                  </td>
                  <td style={{ ...tdStyle, fontSize: '1.2rem' }}>{item.type === 'folder' ? '📂' : '📄'}</td>
                  <td 
                    onClick={() => item.type === 'folder' && setCurrentPath(item.id)} 
                    style={{ ...tdStyle, textAlign: 'left', cursor: item.type === 'folder' ? 'pointer' : 'default', fontWeight: 700, color: '#1e293b' }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                      {item.name}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'left', fontSize: '0.75rem', color: '#64748b' }}>
                    {item.updatedAt}
                  </td>
                  <td style={{ ...tdStyle, borderRight: 'none' }}>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                      {item.type === 'file' && (
                        <>
                          <Link href={`/surat-keluar/edit/${item.id}`} style={actionLinkBlue}>EDIT</Link>
                          <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#059669', fontWeight: 800, textDecoration: 'none', fontSize: '0.7rem' }}>LIHAT</a>
                        </>
                      )}
                      <button 
                        onClick={() => startMovingSingle(item.id, item.name)} 
                        style={actionMoveBtn}
                      >MOVE</button>
                      <button onClick={() => handleDelete(item.id, item.type)} style={actionDeleteBtn}>HAPUS</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ margin: '0 0 1rem 0', fontWeight: 800, color: '#1e293b' }}>BUAT FOLDER BARU</h3>
            <input 
              type="text" 
              value={folderName} 
              onChange={(e) => setFolderName(e.target.value)} 
              placeholder="Nama folder surat keluar..." 
              style={modalInputStyle} 
              autoFocus
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowCreateModal(false)} style={btnSecondaryStyle}>BATAL</button>
              <button onClick={handleCreateFolder} style={btnPrimaryStyle}>SIMPAN</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// STYLES 
const thStyle: React.CSSProperties = { padding: '1rem', fontSize: '0.65rem', color: '#475569', fontWeight: 900, textTransform: 'uppercase', borderRight: '1px solid #e2e8f0', letterSpacing: '0.05em' };
const tdStyle: React.CSSProperties = { padding: '0.75rem 1rem', textAlign: 'center', borderRight: '1px solid #e2e8f0', verticalAlign: 'middle' };
const btnPrimaryStyle = { background: '#800000', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' };
const btnSecondaryStyle = { background: 'white', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', color: '#475569', display: 'inline-block' };
const btnDangerStyle = { background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' };
const btnMoveBulkStyle = { background: '#f59e0b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' };
const searchFieldStyle = { width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', outline: 'none' };
const tableContainerStyle = { background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };
const statusTextStyle: React.CSSProperties = { textAlign: 'center', padding: '3rem', color: '#94a3b8' };
const actionLinkBlue = { color: '#2563eb', fontWeight: 800, textDecoration: 'none', fontSize: '0.7rem' };
const actionLinkGreen = { color: '#059669', fontWeight: 800, textDecoration: 'none', fontSize: '0.7rem' };
const actionDeleteBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#ef4444', fontWeight: 800, cursor: 'pointer', fontSize: '0.7rem' };
const actionMoveBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#f59e0b', fontWeight: 800, cursor: 'pointer', fontSize: '0.7rem' };
const moveBannerStyle: React.CSSProperties = { background: '#fffbeb', border: '1px solid #fde68a', padding: '1rem 1.5rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#92400e', fontSize: '0.85rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const btnPasteStyle = { background: '#059669', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 800, fontSize: '0.7rem' };
const btnCancelMoveStyle = { background: 'none', border: '1px solid #d1d5db', color: '#6b7280', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 700, fontSize: '0.7rem' };
const modalOverlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' };
const modalContentStyle: React.CSSProperties = { background: 'white', padding: '2rem', borderRadius: '12px', width: '380px' };
const modalInputStyle: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', outline: 'none' };