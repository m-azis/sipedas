import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

// GET: Mengambil detail surat berdasarkan ID
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await prisma.suratMasuk.findUnique({ 
      where: { id: parseInt(id) },
      include: { folder: true } // Mengambil data folder terkait
    });
    
    if (!data) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET_ERROR]:", error);
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

// PUT: Mengupdate data surat
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const formData = await req.formData();
    
    // Sesuaikan field dengan model SuratMasuk di schema.prisma
    const updateData: any = {
      noUrut: parseInt(formData.get("noUrut") as string) || 0,
      noBerkas: formData.get("noBerkas") as string || "-",
      alamatPengirim: formData.get("alamatPengirim") as string || "-", // Gunakan alamatPengirim sesuai skema
      nomorSurat: formData.get("nomorSurat") as string || "-",
      tanggalSurat: new Date(formData.get("tanggalSurat") as string || new Date()),
      perihal: formData.get("perihal") as string || "Tanpa Perihal",
      noPetunjuk: formData.get("noPetunjuk") as string || null,
      noPaket: formData.get("noPaket") as string || null,
    };

    const files = formData.getAll("files") as File[];
    
    if (files.length > 0 && files[0] instanceof File && files[0].size > 0) {
      const uploadDir = path.join(process.cwd(), "public", "uploads", "surat-masuk");
      await mkdir(uploadDir, { recursive: true });

      const newFileUrls: string[] = [];
      
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Membersihkan nama file dari karakter path untuk mencegah ENOENT
        const rawFileName = file.name.split(/[\\/]/).pop() || file.name;
        const safeFileName = `${Date.now()}-${rawFileName.replace(/\s+/g, "_")}`;
        const filePath = path.join(uploadDir, safeFileName);
        
        await writeFile(filePath, buffer);
        newFileUrls.push(`/uploads/surat-masuk/${safeFileName}`);
      }

      updateData.fileUrl = newFileUrls.join(", ");
    }

    const updated = await prisma.suratMasuk.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[UPDATE_ERROR]:", error);
    return NextResponse.json({ error: "Gagal Update Data" }, { status: 500 });
  }
}

// DELETE: Menghapus data surat (File)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const existingData = await prisma.suratMasuk.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingData) {
      return NextResponse.json({ error: "Data sudah tidak ada" }, { status: 404 });
    }

    // Hapus file fisik jika ada
    if (existingData.fileUrl) {
      const filePaths = existingData.fileUrl.split(", ");
      for (const url of filePaths) {
        try {
          const absolutePath = path.join(process.cwd(), "public", url);
          await unlink(absolutePath);
        } catch (err) {
          console.warn(`Gagal menghapus file fisik: ${url}`, err);
        }
      }
    }

    await prisma.suratMasuk.delete({ 
      where: { id: parseInt(id) } 
    });

    return NextResponse.json({ 
      success: true, 
      message: "Data berhasil dihapus" 
    });

  } catch (error) {
    console.error("[DELETE_ERROR]:", error);
    return NextResponse.json(
      { error: "Gagal menghapus data dari server" }, 
      { status: 500 }
    );
  }
}