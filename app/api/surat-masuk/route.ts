import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase"; // Import Supabase Client

// GET: Mengambil data folder dan file berdasarkan parentId
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parentId = searchParams.get("parentId");
  const mode = searchParams.get("mode"); // PENAMBAHAN: Ambil mode dari URL
  
  const normalizedParentId = parentId === "null" || !parentId ? null : parentId;

  try {
    // PENAMBAHAN: Logika untuk Statistik (Membaca semua file di semua folder)
    if (mode === "count") {
      const allFiles = await prisma.suratMasuk.findMany({
        orderBy: { createdAt: "desc" }
      });
      // Mengembalikan semua file tanpa filter folderId untuk statistik akurat
      return NextResponse.json({ files: allFiles });
    }

    // FUNGSI ASLI (TIDAK BERUBAH): Filter berdasarkan folder tertentu
    const folders = await prisma.folderSuratMasuk.findMany({
      where: { parentId: normalizedParentId },
      orderBy: { createdAt: "desc" }
    });
    const files = await prisma.suratMasuk.findMany({
      where: { folderId: normalizedParentId },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json({ folders, files });
  } catch (error) {
    return NextResponse.json({ error: "Gagal ambil data" }, { status: 500 });
  }
}

// POST: Membuat folder manual atau mengunggah file
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // 1. BUAT FOLDER MANUAL
    if (contentType.includes("application/json")) {
      const { name, parentId } = await req.json();
      const newFolder = await prisma.folderSuratMasuk.create({
        data: { name, parentId: parentId === "null" || !parentId ? null : parentId }
      });
      return NextResponse.json(newFolder);
    }

    // 2. UPLOAD FILE & STRUKTUR FOLDER
    const formData = await req.formData();
    
    // Ambil data kiriman teks asli dari Form input komponen
    const noUrut = formData.get("noUrut") ? Number(formData.get("noUrut")) : 0;
    const noBerkas = (formData.get("noBerkas") as string) || "-";
    const alamatPengirim = (formData.get("alamatPengirim") as string) || "-";
    const nomorSurat = (formData.get("nomorSurat") as string) || "-";
    const perihal = (formData.get("perihal") as string) || "-";
    const noPetunjuk = (formData.get("noPetunjuk") as string) || null;
    const noPaket = (formData.get("noPaket") as string) || null;
    
    const tanggalSuratInput = formData.get("tanggalSurat") as string;
    const tanggalSurat = tanggalSuratInput ? new Date(tanggalSuratInput) : new Date();

    const files = formData.getAll("files") as File[];
    const paths = formData.getAll("paths") as string[];
    const currentFolderId = formData.get("folderId") === "null" || !formData.get("folderId") ? null : (formData.get("folderId") as string);

    // Filter file valid yang diupload (abaikan jika size kosong)
    const validFiles = files.filter(file => file && file.size > 0);

    // KONDISI JIKA USER TIDAK MENGUNGGAH LAMPIRAN FILE (HANYA DATA TEKS FORM)
    if (validFiles.length === 0) {
      await prisma.suratMasuk.create({
        data: {
          noUrut,
          noBerkas,
          alamatPengirim,
          tanggalSurat,
          nomorSurat,
          perihal,
          noPetunjuk, 
          noPaket,    
          fileUrl: null, // Berkas kosong
          folderId: currentFolderId,
        }
      });
      return NextResponse.json({ success: true, message: "Data surat masuk tanpa file berhasil disimpan" });
    }

    // KONDISI JIKA USER MELAMPIRKAN FILE BERKAS/FOLDER (Upload ke Supabase)
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relativePath = paths[i];
      if (file.size === 0) continue;

      let targetFolderId = currentFolderId;

      // Buat folder jika upload folder
      if (relativePath && relativePath.includes("/")) {
        const folderStructure = relativePath.split("/").slice(0, -1);
        let lastParentId = currentFolderId;

        for (const fName of folderStructure) {
          let folder = await prisma.folderSuratMasuk.findFirst({
            where: { name: fName, parentId: lastParentId }
          });
          if (!folder) {
            folder = await prisma.folderSuratMasuk.create({
              data: { name: fName, parentId: lastParentId }
            });
          }
          lastParentId = folder.id;
        }
        targetFolderId = lastParentId;
      }

      // --- MULAI UPLOAD FILE FISIK KE SUPABASE ---
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const rawName = file.name.split(/[\\/]/).pop() || file.name;
      const safeFileName = `${Date.now()}-${rawName.replace(/[^a-z0-9.]/gi, '_')}`;
      
      const { data, error } = await supabase.storage
        .from('surat-masuk') // Pastikan bucket 'surat-masuk' sudah ada di Supabase
        .upload(safeFileName, buffer, {
          contentType: file.type,
        });

      if (error) {
        console.error("Error upload Surat Masuk ke Supabase:", error);
        throw error;
      }

      // Dapatkan URL Publik
      const { data: urlData } = supabase.storage
        .from('surat-masuk')
        .getPublicUrl(safeFileName);
      // --- SELESAI UPLOAD ---

      // Simpan ke Database dengan data yang didapatkan dari form input asli
      await prisma.suratMasuk.create({
        data: {
          noUrut,
          noBerkas,
          alamatPengirim, 
          tanggalSurat,
          nomorSurat,
          perihal: files.length > 1 ? rawName : perihal, // Jika banyak berkas gunakan nama berkas, jika tunggal gunakan teks form perihal
          noPetunjuk,
          noPaket,
          fileUrl: urlData.publicUrl, // Gunakan URL dari Supabase
          folderId: targetFolderId,
        }
      });
    }

    return NextResponse.json({ success: true, message: "Berhasil menyimpan ke Cloud Database" });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Gagal simpan", details: error.message }, { status: 500 });
  }
}

// DELETE: Untuk folder
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");

    if (!id || type !== "folder") {
      return NextResponse.json({ error: "ID atau tipe tidak valid" }, { status: 400 });
    }

    const checkFolder = await prisma.folderSuratMasuk.findUnique({
      where: { id: id },
      include: {
        suratMasuk: true,
        children: true,
      }
    });

    if (!checkFolder) {
      return NextResponse.json({ error: "Folder tidak ditemukan" }, { status: 404 });
    }

    if (checkFolder.suratMasuk.length > 0 || checkFolder.children.length > 0) {
      return NextResponse.json(
        { error: "Gagal hapus: Folder masih berisi file atau subfolder" }, 
        { status: 400 }
      );
    }

    await prisma.folderSuratMasuk.delete({
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