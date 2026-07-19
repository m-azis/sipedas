import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase"; // Import Supabase Client

// GET: Mengambil data folder dan file dokumentasi berdasarkan parentId atau mode count
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parentId = searchParams.get("parentId");
  const mode = searchParams.get("mode");
  
  const normalizedParentId = parentId === "null" || !parentId ? null : parentId;

  try {
    // Logika untuk Statistik Dashboard: Membaca seluruh file dokumentasi tanpa filter folder
    if (mode === "count") {
      const allFiles = await prisma.dokumentasi.findMany({
        orderBy: { createdAt: "desc" }
      });
      return NextResponse.json({ files: allFiles });
    }

    // Navigasi normal: Ambil folder dan file dokumentasi berdasarkan parentId
    const folders = await prisma.folderDokumentasi.findMany({
      where: { parentId: normalizedParentId },
      orderBy: { createdAt: "desc" }
    });

    const files = await prisma.dokumentasi.findMany({
      where: { folderId: normalizedParentId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ folders, files });
  } catch (error) {
    console.error("GET Dokumentasi Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data dokumentasi" }, { status: 500 });
  }
}

// POST: Membuat folder manual atau mengunggah berkas dokumentasi (Recursive Upload)
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // 1. Buat Folder Dokumentasi Manual
    if (contentType.includes("application/json")) {
      const { name, parentId } = await req.json();
      const newFolder = await prisma.folderDokumentasi.create({
        data: { 
          name, 
          parentId: parentId === "null" || !parentId ? null : parentId 
        }
      });
      return NextResponse.json(newFolder);
    }

    // 2. Upload File & Struktur Folder (Recursive Upload) ke Supabase
    const formData = await req.formData();

    // Ambil data kiriman teks asli dari Form input komponen TambahDokumentasi
    const namaDokumen = (formData.get("namaDokumen") as string) || "-";
    const tempat = (formData.get("tempat") as string) || "-";
    
    const tanggalInput = formData.get("tanggal") as string;
    const tanggal = tanggalInput ? new Date(tanggalInput) : new Date();

    const files = formData.getAll("files") as File[];
    const paths = formData.getAll("paths") as string[];
    const currentFolderId = formData.get("folderId") === "null" || !formData.get("folderId") 
      ? null 
      : (formData.get("folderId") as string);

    // Filter file valid yang diupload (abaikan jika size kosong atau komponen file null)
    const validFiles = files.filter(file => file && file.size > 0);

    // KONDISI JIKA USER TIDAK MENGUNGGAH LAMPIRAN FILE (HANYA SIMPAN DATA FORM TEKS)
    if (validFiles.length === 0) {
      await prisma.dokumentasi.create({
        data: {
          namaDokumen,
          tanggal,
          tempat,
          fileUrl: null, // Berkas dikosongkan
          folderId: currentFolderId,
        }
      });
      return NextResponse.json({ success: true, message: "Data dokumentasi tanpa file berhasil disimpan" });
    }

    // KONDISI JIKA USER MELAMPIRKAN FILE BERKAS/FOLDER
    let uploadedFileUrls: string[] = [];
    let targetFolderId = currentFolderId;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relativePath = paths[i];
      if (!file || file.size === 0) continue;

      // Logika pembuatan folder otomatis jika upload folder/drag-drop
      if (relativePath && relativePath.includes("/")) {
        const folderStructure = relativePath.split("/").slice(0, -1);
        let lastParentId = currentFolderId;

        for (const fName of folderStructure) {
          let folder = await prisma.folderDokumentasi.findFirst({
            where: { name: fName, parentId: lastParentId }
          });
          
          if (!folder) {
            folder = await prisma.folderDokumentasi.create({
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
      
      const { data, error } = await supabase.storage
        .from('dokumentasi') // Pastikan bucket 'dokumentasi' sudah dibuat di Supabase
        .upload(safeFileName, buffer, {
          contentType: file.type,
        });

      if (error) {
        console.error("Error upload dokumentasi ke Supabase:", error);
        throw error;
      }

      // Ambil URL Publik
      const { data: urlData } = supabase.storage
        .from('dokumentasi')
        .getPublicUrl(safeFileName);

      // Kumpulkan URL file ke dalam array penampung
      uploadedFileUrls.push(urlData.publicUrl);
      // --- SELESAI UPLOAD KE SUPABASE ---
    }

    // Menggabungkan seluruh URL menjadi satu string yang dipisahkan koma
    const finalFileUrlString = uploadedFileUrls.join(",");

    // Simpan data rekaman berkas tunggal yang berisi semua string URL lampiran
    await prisma.dokumentasi.create({
      data: {
        namaDokumen, 
        tanggal,
        tempat,
        fileUrl: finalFileUrlString,
        folderId: targetFolderId,
      }
    });

    return NextResponse.json({ success: true, message: "Arsip dokumentasi berhasil disimpan ke Cloud" });
  } catch (error: any) {
    console.error("Upload Dokumentasi Error:", error);
    return NextResponse.json({ error: "Gagal simpan data dokumentasi", details: error.message }, { status: 500 });
  }
}

// DELETE: Menghapus folder dokumentasi
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");

    if (!id || type !== "folder") {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const checkFolder = await prisma.folderDokumentasi.findUnique({
      where: { id: id },
      include: {
        dokumentasi: true,
        children: true,
      }
    });

    if (!checkFolder) {
      return NextResponse.json({ error: "Folder tidak ditemukan" }, { status: 404 });
    }

    // Proteksi agar tidak menghapus folder yang masih berisi file atau subfolder
    if (checkFolder.dokumentasi.length > 0 || checkFolder.children.length > 0) {
      return NextResponse.json(
        { error: "Gagal: Folder masih berisi file dokumentasi atau subfolder" }, 
        { status: 400 }
      );
    }

    await prisma.folderDokumentasi.delete({
      where: { id: id }
    });

    return NextResponse.json({ success: true, message: "Folder berhasil dihapus" });
  } catch (error: any) {
    console.error("Delete Folder Dokumentasi Error:", error);
    return NextResponse.json({ error: "Gagal hapus folder", details: error.message }, { status: 500 });
  }
}