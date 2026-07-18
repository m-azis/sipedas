import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Perubahan pada penulisan tipe context params yang sekarang berupa Promise
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // WAJIB di-await terlebih dahulu sebelum mengambil properti 'path'
    const resolvedParams = await params;
    const pathSegments = resolvedParams.path;

    // Menyusun jalur absolut ke folder fisik public/uploads/...
    const filePath = path.join(process.cwd(), "public", "uploads", ...pathSegments);

    // Jika file fisik tidak ditemukan di harddisk laptop klien
    if (!fs.existsSync(filePath)) {
      return new NextResponse("Berkas arsip fisik tidak ditemukan di server lokal.", { 
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    // Membaca isi file menjadi buffer data
    const fileBuffer = fs.readFileSync(filePath);
    
    // Deteksi otomatis tipe ekstensi berkas untuk browser
    const ext = path.extname(filePath).toLowerCase();
    let contentType = "application/octet-stream";
    
    if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".docx") contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    else if (ext === ".doc") contentType = "application/msword";

    // Kembalikan file sebagai response stream
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${path.basename(filePath)}"`,
      },
    });
  } catch (error) {
    return new NextResponse("Terjadi kesalahan internal server saat membaca berkas.", { status: 500 });
  }
}