import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

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

    // Menggunakan string mentah dinamis agar Vercel tidak mendeteksi inisialisasi saat build time
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Koneksi cloud storage Supabase belum dikonfigurasi.");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const allFileUrls: string[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uniqueFileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;

      // Upload langsung ke cloud bucket 'dokumen-kerja' (Bypass lokal disk)
      const { error: uploadError } = await supabase.storage
        .from("dokumen-kerja")
        .upload(uniqueFileName, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Gagal upload ke Cloud: ${uploadError.message}`);
      }

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
      message: `${files.length} file berhasil diunggah langsung ke cloud storage`,
      data: finalEntry 
    });

  } catch (error: any) {
    console.error("[UPLOAD_DOKUMEN_KERJA_ERROR]:", error);
    return NextResponse.json({ error: error.message || "Gagal memproses unggahan dokumen kerja" }, { status: 500 });
  }
}