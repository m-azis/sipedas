import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase"; // Import Supabase Client

// GET: Mengambil data folder dan file berdasarkan parentId atau mode count
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parentId = searchParams.get("parentId");
  const mode = searchParams.get("mode");
  
  const normalizedParentId = parentId === "null" || !parentId ? null : parentId;

  try {
    // Logika untuk Statistik Dashboard: Mengambil seluruh file tanpa filter folder
    if (mode === "count") {
      const allFiles = await prisma.suratKeluar.findMany({
        orderBy: { createdAt: "desc" }
      });
      return NextResponse.json({ files: allFiles });
    }

    // Navigasi normal: Ambil folder dan file yang berada langsung di bawah parentId
    const folders = await prisma.folderSuratKeluar.findMany({
      where: { parentId: normalizedParentId },
      orderBy: { createdAt: "desc" }
    });

    const files = await prisma.suratKeluar.findMany({
      where: { folderId: normalizedParentId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ folders, files });
  } catch (error) {
    console.error("GET Surat Keluar Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data surat keluar" }, { status: 500 });
  }
}

// POST: Membuat folder manual atau mengunggah file surat keluar
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // 1. Logika Pembuatan Folder Manual (JSON)
    if (contentType.includes("application/json")) {
      const { name, parentId } = await req.json();
      const newFolder = await prisma.folderSuratKeluar.create({
        data: { 
          name, 
          parentId: parentId === "null" || !parentId ? null : parentId 
        }
      });
      return NextResponse.json(newFolder);
    }

    // 2. Logika Form Data (Upload File Teks / Drag & Drop Folder)
    const formData = await req.formData();
    
    // Ambil input data teks dasar dari form komponen
    const noUrut = formData.get("noUrut") ? Number(formData.get("noUrut")) : 0;
    const noBerkas = (formData.get("noBerkas") as string) || "-";
    const tujuanSurat = (formData.get("tujuanSurat") as string) || "-";
    const nomorSurat = (formData.get("nomorSurat") as string) || "-";
    const perihal = (formData.get("perihal") as string) || "-";
    const tanggalSuratInput = formData.get("tanggalSurat") as string;
    const tanggalSurat = tanggalSuratInput ? new Date(tanggalSuratInput) : new Date();

    // Menangkap field kustom P (noPetunjuk) dan K (noPaket) agar sinkron dengan Surat Masuk
    const noPetunjuk = (formData.get("noPetunjuk") as string) || "-";
    const noPaket = (formData.get("noPaket") as string) || "-";

    const currentFolderId = formData.get("folderId") === "null" || !formData.get("folderId") 
      ? null 
      : (formData.get("folderId") as string);

    const files = formData.getAll("files") as File[];
    const paths = formData.getAll("paths") as string[];

    // Filter berkas asli (abaikan berkas kosong berukuran 0 bytes)
    const validFiles = files.filter(file => file && file.size > 0);

    // KONDISI A: User mengosongkan berkas lampiran (Hanya isi form teks saja)
    if (validFiles.length === 0) {
      await prisma.suratKeluar.create({
        data: {
          noUrut,
          noBerkas,
          tujuanSurat,
          tanggalSurat,
          nomorSurat,
          perihal,
          noPetunjuk, // Disimpan ke database
          noPaket,    // Disimpan ke database
          fileUrl: null, 
          folderId: currentFolderId,
        }
      });

      return NextResponse.json({ success: true, message: "Arsip data teks berhasil disimpan" });
    }

    // KONDISI B: User melampirkan berkas (Proses upload ke Supabase berjalan)
    let uploadedFileUrls: string[] = [];
    let targetFolderId = currentFolderId;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relativePath = paths[i];
      if (!file || file.size === 0) continue;

      // Jika ada struktur rute folder (Drop Folder / Webkit Directory)
      if (relativePath && relativePath.includes("/")) {
        const folderStructure = relativePath.split("/").slice(0, -1);
        let lastParentId = currentFolderId;

        for (const fName of folderStructure) {
          let folder = await prisma.folderSuratKeluar.findFirst({
            where: { name: fName, parentId: lastParentId }
          });
          
          if (!folder) {
            folder = await prisma.folderSuratKeluar.create({
              data: { name: fName, parentId: lastParentId }
            });
          }
          lastParentId = folder.id;
        }
        targetFolderId = lastParentId;
      }

      // --- MULAI UPLOAD KE SUPABASE ---
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const rawName = file.name.split(/[\\/]/).pop() || file.name;
      const safeFileName = `${Date.now()}-${rawName.replace(/[^a-z0-9.]/gi, '_')}`;
      
      // Pastikan bucket 'surat-keluar' sudah ada di Supabase!
      const { data, error } = await supabase.storage
        .from('surat-keluar')
        .upload(safeFileName, buffer, {
          contentType: file.type,
        });

      if (error) {
        console.error("Error upload Surat Keluar ke Supabase:", error);
        throw error;
      }
      
      // Dapatkan URL Publik
      const { data: urlData } = supabase.storage
        .from('surat-keluar')
        .getPublicUrl(safeFileName);

      // Simpan path URL ke array penampung
      uploadedFileUrls.push(urlData.publicUrl);
      // --- SELESAI UPLOAD KE SUPABASE ---
    }

    // Menggabungkan seluruh URL file menjadi satu string yang dipisahkan koma
    // Ini krusial agar komponen tabel UI dapat melakukan .split(/[ ,]+/) dengan benar
    const finalFileUrlString = uploadedFileUrls.join(",");

    // Simpan satu baris data surat utuh ke database (Mencegah duplikasi baris nomor surat)
    await prisma.suratKeluar.create({
      data: {
        noUrut,
        noBerkas,
        tujuanSurat,
        tanggalSurat,
        nomorSurat,
        perihal,
        noPetunjuk,
        noPaket,
        fileUrl: finalFileUrlString,
        folderId: targetFolderId,
      }
    });

    return NextResponse.json({ success: true, message: "Arsip berkas berhasil disimpan ke Cloud" });
  } catch (error: any) {
    console.error("Upload Surat Keluar Error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan data", details: error.message }, 
      { status: 500 }
    );
  }
}

// DELETE: Menghapus folder surat keluar
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");

    if (!id || type !== "folder") {
      return NextResponse.json({ error: "ID atau tipe tidak valid" }, { status: 400 });
    }

    const checkFolder = await prisma.folderSuratKeluar.findUnique({
      where: { id: id },
      include: {
        suratKeluar: true,
        children: true,
      }
    });

    if (!checkFolder) {
      return NextResponse.json({ error: "Folder tidak ditemukan" }, { status: 404 });
    }

    if (checkFolder.suratKeluar.length > 0 || checkFolder.children.length > 0) {
      return NextResponse.json(
        { error: "Gagal hapus: Folder tidak kosong" }, 
        { status: 400 }
      );
    }

    await prisma.folderSuratKeluar.delete({
      where: { id: id }
    });

    return NextResponse.json({ success: true, message: "Folder berhasil dihapus" });
  } catch (error: any) {
    console.error("Delete Folder Error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus folder", details: error.message }, 
      { status: 500 }
    );
  }
}