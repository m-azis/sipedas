import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// GET: Mengambil detail dokumen kerja berdasarkan ID
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; // Ini sudah benar menggunakan await
    const data = await prisma.dokumenKerja.findUnique({ 
      where: { id: parseInt(id) },
      include: { folder: true } 
    });
    
    if (!data) {
      return NextResponse.json({ error: "Data dokumen kerja tidak ditemukan" }, { status: 404 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET_ERROR_DOKUMEN_KERJA]:", error);
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

// PUT: Mengupdate data dokumen kerja
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const formData = await req.formData();
    
    const updateData: any = {
      namaDokumen: formData.get("namaDokumen") as string || "Tanpa Nama",
      tanggal: new Date(formData.get("tanggal") as string || new Date()),
      tempat: formData.get("tempat") as string || "-",
    };

    const files = formData.getAll("files") as File[];
    
    if (files.length > 0 && files[0] instanceof File && files[0].size > 0) {
      const uploadDir = path.join(process.cwd(), "public", "uploads", "dokumen-kerja");
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const newFileUrls: string[] = [];
      
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const rawFileName = file.name.split(/[\\/]/).pop() || file.name;
        const safeFileName = `${Date.now()}-${rawFileName.replace(/\s+/g, "_")}`;
        const filePath = path.join(uploadDir, safeFileName);
        
        await writeFile(filePath, buffer);
        newFileUrls.push(`/uploads/dokumen-kerja/${safeFileName}`);
      }

      updateData.fileUrl = newFileUrls.join(", ");
    }

    const updated = await prisma.dokumenKerja.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[UPDATE_ERROR_DOKUMEN_KERJA]:", error);
    return NextResponse.json({ error: "Gagal Update Data Dokumen Kerja" }, { status: 500 });
  }
}

// DELETE: Menghapus data dokumen kerja dan file fisiknya
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const existingData = await prisma.dokumenKerja.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingData) {
      return NextResponse.json({ error: "Data sudah tidak ada" }, { status: 404 });
    }

    if (existingData.fileUrl) {
      const filePaths = existingData.fileUrl.split(", ");
      for (const url of filePaths) {
        try {
          const absolutePath = path.join(process.cwd(), "public", url);
          if (existsSync(absolutePath)) {
            await unlink(absolutePath);
          }
        } catch (err) {
          console.warn(`Gagal menghapus file fisik dokumen kerja: ${url}`, err);
        }
      }
    }

    await prisma.dokumenKerja.delete({ 
      where: { id: parseInt(id) } 
    });

    return NextResponse.json({ 
      success: true, 
      message: "Data dokumen kerja berhasil dihapus" 
    });

  } catch (error) {
    console.error("[DELETE_ERROR_DOKUMEN_KERJA]:", error);
    return NextResponse.json({ error: "Gagal menghapus data dari server" }, { status: 500 });
  }
}