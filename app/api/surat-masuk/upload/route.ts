import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const folderId = formData.get("folderId") as string | null;

    // Ambil data form lainnya jika ada (misal user mengisi nomor surat di form)
    // Jika tidak ada, kita gunakan default seperti kode Anda
    const customNomorSurat = formData.get("nomorSurat") as string || "REG/" + Date.now();
    const customPerihal = formData.get("perihal") as string || "Arsip Multi-File";

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Tidak ada file yang dipilih" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    // Array untuk menampung semua URL yang berhasil diupload
    const allFileUrls: string[] = [];

    // 1. Loop hanya untuk menyimpan file fisik ke storage
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uniqueFileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      const filePath = path.join(uploadDir, uniqueFileName);
      
      await writeFile(filePath, buffer);
      
      // Simpan path ke array
      allFileUrls.push(`/uploads/${uniqueFileName}`);
    }

    // 2. Simpan ke Database SATU KALI SAJA (satu baris untuk semua file)
    // Gabungkan array menjadi string dipisah koma: "/uploads/a.pdf, /uploads/b.pdf"
    const finalEntry = await prisma.suratMasuk.create({
      data: {
        noUrut: 0, 
        noBerkas: "BRK-" + Math.random().toString(36).substring(7).toUpperCase(),
        alamatPengirim: "Upload Mandiri (Multi-Berkas)",
        tanggalSurat: new Date(),
        nomorSurat: customNomorSurat,
        perihal: customPerihal, 
        // SIMPAN SEMUA URL DISINI
        fileUrl: allFileUrls.join(", "), 
        folderId: folderId && folderId !== "null" ? folderId : null,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: `${files.length} file berhasil digabungkan dalam satu arsip`,
      data: finalEntry 
    });

  } catch (error) {
    console.error("[UPLOAD_ERROR]:", error);
    return NextResponse.json({ error: "Gagal memproses unggahan" }, { status: 500 });
  }
}