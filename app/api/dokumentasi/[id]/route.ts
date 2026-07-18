import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// GET: Mengambil detail dokumentasi berdasarkan ID
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await prisma.dokumentasi.findUnique({ 
      where: { id: parseInt(id) },
      include: { folder: true } 
    });
    
    if (!data) {
      return NextResponse.json({ error: "Data dokumentasi tidak ditemukan" }, { status: 404 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET_ERROR_DOKUMENTASI]:", error);
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

// PUT: Mengupdate data dokumentasi
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const formData = await req.formData();
    
    // Penyesuaian field dengan model dokumentasi
    const updateData: any = {
      namaDokumen: formData.get("namaDokumen") as string || "Tanpa Judul",
      tanggal: new Date(formData.get("tanggal") as string || new Date()),
      tempat: formData.get("tempat") as string || "-",
    };

    const files = formData.getAll("files") as File[];
    
    // Logika penanganan upload file dokumentasi baru jika ada
    if (files.length > 0 && files[0] instanceof File && files[0].size > 0) {
      const uploadDir = path.join(process.cwd(), "public", "uploads", "dokumentasi");
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const newFileUrls: string[] = [];
      
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Pembersihan nama file untuk mencegah error ENOENT pada sistem operasi tertentu
        const rawFileName = file.name.split(/[\\/]/).pop() || file.name;
        const safeFileName = `${Date.now()}-${rawFileName.replace(/\s+/g, "_")}`;
        const filePath = path.join(uploadDir, safeFileName);
        
        await writeFile(filePath, buffer);
        newFileUrls.push(`/uploads/dokumentasi/${safeFileName}`);
      }

      // Mengupdate fileUrl dengan path file yang baru diunggah
      updateData.fileUrl = newFileUrls.join(", ");
    }

    const updated = await prisma.dokumentasi.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[UPDATE_ERROR_DOKUMENTASI]:", error);
    return NextResponse.json({ error: "Gagal Update Data Dokumentasi" }, { status: 500 });
  }
}

// DELETE: Menghapus data dokumentasi dan file fisik (foto/video/pdf)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const existingData = await prisma.dokumentasi.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingData) {
      return NextResponse.json({ error: "Data sudah tidak ada" }, { status: 404 });
    }

    // Hapus file fisik dari folder uploads/dokumentasi jika ada
    if (existingData.fileUrl) {
      const filePaths = existingData.fileUrl.split(", ");
      for (const url of filePaths) {
        try {
          const absolutePath = path.join(process.cwd(), "public", url);
          if (existsSync(absolutePath)) {
            await unlink(absolutePath);
          }
        } catch (err) {
          console.warn(`Gagal menghapus file fisik dokumentasi: ${url}`, err);
        }
      }
    }

    await prisma.dokumentasi.delete({ 
      where: { id: parseInt(id) } 
    });

    return NextResponse.json({ 
      success: true, 
      message: "Data dokumentasi berhasil dihapus" 
    });

  } catch (error) {
    console.error("[DELETE_ERROR_DOKUMENTASI]:", error);
    return NextResponse.json(
      { error: "Gagal menghapus data dari server" }, 
      { status: 500 }
    );
  }
}