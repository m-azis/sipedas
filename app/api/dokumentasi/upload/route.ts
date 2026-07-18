import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const folderId = formData.get("folderId") as string | null;

    // Ambil data form lainnya jika ada (disesuaikan untuk Dokumentasi Kegiatan)
    // Jika tidak ada, gunakan default sesuai struktur permintaan Anda
    const customNamaDokumen = formData.get("namaDokumen") as string || "Dokumentasi Baru - " + Date.now();
    const customTempat = formData.get("tempat") as string || "Lokasi Belum Ditentukan";
    const customTanggal = formData.get("tanggal") as string ? new Date(formData.get("tanggal") as string) : new Date();

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Tidak ada file dokumentasi yang dipilih" }, { status: 400 });
    }

    // Tentukan direktori penyimpanan khusus untuk dokumentasi (Foto/Video/Lainnya)
    const uploadDir = path.join(process.cwd(), "public", "uploads", "dokumentasi");
    await mkdir(uploadDir, { recursive: true });

    // Array untuk menampung semua URL yang berhasil diupload
    const allFileUrls: string[] = [];

    // 1. Loop untuk menyimpan file fisik ke storage
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Membuat nama file unik untuk menghindari konflik nama file yang sama
      const uniqueFileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      const filePath = path.join(uploadDir, uniqueFileName);
      
      await writeFile(filePath, buffer);
      
      // Simpan path relatif ke array untuk referensi di database
      allFileUrls.push(`/uploads/dokumentasi/${uniqueFileName}`);
    }

    // 2. Simpan ke Database SATU KALI SAJA menggunakan model dokumentasi
    const finalEntry = await prisma.dokumentasi.create({
      data: {
        namaDokumen: customNamaDokumen,
        tanggal: customTanggal,
        tempat: customTempat,
        // SIMPAN SEMUA URL DISINI (dipisah koma) dalam satu kolom fileUrl
        fileUrl: allFileUrls.join(", "), 
        folderId: folderId && folderId !== "null" ? folderId : null,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: `${files.length} berkas dokumentasi berhasil digabungkan dalam satu arsip`,
      data: finalEntry 
    });

  } catch (error) {
    console.error("[UPLOAD_DOKUMENTASI_ERROR]:", error);
    return NextResponse.json({ error: "Gagal memproses unggahan dokumentasi" }, { status: 500 });
  }
}