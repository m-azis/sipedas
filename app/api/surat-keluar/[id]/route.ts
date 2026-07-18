import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// GET: Mengambil detail surat keluar berdasarkan ID
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await prisma.suratKeluar.findUnique({ 
      where: { id: parseInt(id) },
      include: { folder: true } 
    });
    
    if (!data) {
      return NextResponse.json({ error: "Data surat keluar tidak ditemukan" }, { status: 404 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET_ERROR_KELUAR]:", error);
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

// PUT: Mengupdate data surat keluar
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const formData = await req.formData();
    
    // Penyesuaian field dengan model SuratKeluar di schema.prisma
    const updateData: any = {
      noUrut: parseInt(formData.get("noUrut") as string) || 0,
      noBerkas: formData.get("noBerkas") as string || "-",
      tujuanSurat: formData.get("tujuanSurat") as string || "-", // Menggunakan tujuanSurat
      nomorSurat: formData.get("nomorSurat") as string || "-",
      tanggalSurat: new Date(formData.get("tanggalSurat") as string || new Date()),
      perihal: formData.get("perihal") as string || "Tanpa Perihal",
      noPetunjuk: formData.get("noPetunjuk") as string || null,
      noPaket: formData.get("noPaket") as string || null,
    };

    const files = formData.getAll("files") as File[];
    
    if (files.length > 0 && files[0] instanceof File && files[0].size > 0) {
      const uploadDir = path.join(process.cwd(), "public", "uploads", "surat-keluar");
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const newFileUrls: string[] = [];
      
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Bersihkan nama file dari path Windows (Pencegahan ENOENT)
        const rawFileName = file.name.split(/[\\/]/).pop() || file.name;
        const safeFileName = `${Date.now()}-${rawFileName.replace(/\s+/g, "_")}`;
        const filePath = path.join(uploadDir, safeFileName);
        
        await writeFile(filePath, buffer);
        newFileUrls.push(`/uploads/surat-keluar/${safeFileName}`);
      }

      updateData.fileUrl = newFileUrls.join(", ");
    }

    const updated = await prisma.suratKeluar.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[UPDATE_ERROR_KELUAR]:", error);
    return NextResponse.json({ error: "Gagal Update Data" }, { status: 500 });
  }
}

// DELETE: Menghapus data surat keluar dan file fisiknya
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const existingData = await prisma.suratKeluar.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingData) {
      return NextResponse.json({ error: "Data sudah tidak ada" }, { status: 404 });
    }

    // Hapus file fisik dari folder uploads/surat-keluar jika ada
    if (existingData.fileUrl) {
      const filePaths = existingData.fileUrl.split(", ");
      for (const url of filePaths) {
        try {
          const absolutePath = path.join(process.cwd(), "public", url);
          if (existsSync(absolutePath)) {
            await unlink(absolutePath);
          }
        } catch (err) {
          console.warn(`Gagal menghapus file fisik surat keluar: ${url}`, err);
        }
      }
    }

    await prisma.suratKeluar.delete({ 
      where: { id: parseInt(id) } 
    });

    return NextResponse.json({ 
      success: true, 
      message: "Data surat keluar berhasil dihapus" 
    });

  } catch (error) {
    console.error("[DELETE_ERROR_KELUAR]:", error);
    return NextResponse.json(
      { error: "Gagal menghapus data dari server" }, 
      { status: 500 }
    );
  }
}