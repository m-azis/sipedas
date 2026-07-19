import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";
  return createClient(supabaseUrl, supabaseKey);
};

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

    const supabase = getSupabaseClient();
    const allFileUrls: string[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uniqueFileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("dokumen-kerja")
        .upload(uniqueFileName, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Supabase upload error: ${uploadError.message}`);
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
      message: `${files.length} file berhasil diunggah langsung ke cloud Supabase`,
      data: finalEntry 
    });

  } catch (error: any) {
    console.error("[UPLOAD_DOKUMEN_KERJA_ERROR]:", error);
    return NextResponse.json({ error: error.message || "Gagal memproses unggahan dokumen kerja" }, { status: 500 });
  }
}