import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const folderId = formData.get("folderId") as string | null;

    const customNamaDokumen = formData.get("namaDokumen") as string || "Dokumen Kerja Baru - " + Date.now();
    const customTempat = formData.get("tempat") as string || "Upload Mandiri (Multi-Berkas)";
    const customTanggal = formData.get("tanggal") as string ? new Date(formData.get("tanggal") as string) : new Date();

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Tidak ada file yang dipilih" }, { status: 400 });
    }

    // Menggunakan trik folder lokal seperti di Dokumentasi agar aman dari error build time
    const uploadDir = path.join(process.cwd(), "public", "uploads", "dokumen-kerja");
    await mkdir(uploadDir, { recursive: true });

    const allFileUrls: string[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uniqueFileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      const filePath = path.join(uploadDir, uniqueFileName);
      
      await writeFile(filePath, buffer);
      
      // Simpan nama filenya saja ke database agar sinkron dengan mapping URL cloud
      allFileUrls.push(uniqueFileName);
    }

    const finalEntry = await prisma.dokumenKerja.create({
      data: {
        namaDokumen: customNamaDokumen,
        tanggal: customTanggal,
        tempat: customTempat,
        fileUrl: allFileUrls.join(", "), 
        folderId: folderId && folderId !== "null" ? folderId : null,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: `${files.length} file berhasil diproses`,
      data: finalEntry 
    });

  } catch (error) {
    console.error("[UPLOAD_DOKUMEN_KERJA_ERROR]:", error);
    return NextResponse.json({ error: "Gagal memproses unggahan dokumen kerja" }, { status: 500 });
  }
}