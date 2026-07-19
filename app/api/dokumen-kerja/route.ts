import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parentId = searchParams.get("parentId");
  const mode = searchParams.get("mode");
  
  const normalizedParentId = parentId === "null" || !parentId ? null : parentId;

  try {
    if (mode === "count") {
      const allFiles = await prisma.dokumenKerja.findMany({
        orderBy: { createdAt: "desc" }
      });
      return NextResponse.json({ files: allFiles });
    }

    const folders = await prisma.folderDokumenKerja.findMany({
      where: { parentId: normalizedParentId },
      orderBy: { createdAt: "desc" }
    });

    const files = await prisma.dokumenKerja.findMany({
      where: { folderId: normalizedParentId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ folders, files });
  } catch (error) {
    console.error("GET Dokumen Kerja Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data dokumen kerja" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const { name, parentId } = await req.json();
      const newFolder = await prisma.folderDokumenKerja.create({
        data: { 
          name, 
          parentId: parentId === "null" || !parentId ? null : parentId 
        }
      });
      return NextResponse.json(newFolder);
    }

    const formData = await req.formData();
    const namaDokumen = (formData.get("namaDokumen") as string) || "-";
    const tempat = (formData.get("tempat") as string) || "-";
    const tanggalInput = formData.get("tanggal") as string;
    const tanggal = tanggalInput ? new Date(tanggalInput) : new Date();

    const files = formData.getAll("files") as File[];
    const paths = formData.getAll("paths") as string[];
    const currentFolderId = formData.get("folderId") === "null" || !formData.get("folderId") 
      ? null 
      : (formData.get("folderId") as string);

    const validFiles = files.filter(file => file && file.size > 0);

    if (validFiles.length === 0) {
      await prisma.dokumenKerja.create({
        data: {
          namaDokumen,
          tanggal,
          tempat,
          fileUrl: null,
          folderId: currentFolderId,
        }
      });
      return NextResponse.json({ success: true, message: "Data dokumen kerja tanpa file berhasil disimpan" });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Koneksi cloud storage Supabase belum dikonfigurasi.");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    let uploadedFileUrls: string[] = [];
    let targetFolderId = currentFolderId;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relativePath = paths[i];
      if (!file || file.size === 0) continue;

      if (relativePath && relativePath.includes("/")) {
        const folderStructure = relativePath.split("/").slice(0, -1);
        let lastParentId = currentFolderId;

        for (const fName of folderStructure) {
          let folder = await prisma.folderDokumenKerja.findFirst({
            where: { name: fName, parentId: lastParentId }
          });
          
          if (!folder) {
            folder = await prisma.folderDokumenKerja.create({
              data: { name: fName, parentId: lastParentId }
            });
          }
          lastParentId = folder.id;
        }
        targetFolderId = lastParentId;
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const rawName = file.name.split(/[\\/]/).pop() || file.name;
      const safeFileName = `${Date.now()}-${rawName.replace(/[^a-z0-9.]/gi, '_')}`;
      
      const { error: uploadError } = await supabase.storage
        .from("dokumen-kerja")
        .upload(safeFileName, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Gagal upload ke Cloud: ${uploadError.message}`);
      }
      uploadedFileUrls.push(safeFileName);
    }

    const finalFileUrlString = uploadedFileUrls.join(",");

    await prisma.dokumenKerja.create({
      data: {
        namaDokumen, 
        tanggal,
        tempat,
        fileUrl: finalFileUrlString,
        folderId: targetFolderId,
      }
    });

    return NextResponse.json({ success: true, message: "Arsip dokumen kerja berhasil disimpan" });
  } catch (error: any) {
    console.error("Upload Dokumen Kerja Error:", error);
    return NextResponse.json({ error: "Gagal simpan data", details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");

    if (!id || type !== "folder") {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const checkFolder = await prisma.folderDokumenKerja.findUnique({
      where: { id: id },
      include: { dokumenKerja: true, children: true }
    });

    if (!checkFolder) {
      return NextResponse.json({ error: "Folder tidak ditemukan" }, { status: 404 });
    }

    if (checkFolder.dokumenKerja.length > 0 || checkFolder.children.length > 0) {
      return NextResponse.json({ error: "Gagal: Folder masih berisi dokumen atau subfolder" }, { status: 400 });
    }

    await prisma.folderDokumenKerja.delete({ where: { id: id } });
    return NextResponse.json({ success: true, message: "Folder berhasil dihapus" });
  } catch (error: any) {
    console.error("Delete Folder Error:", error);
    return NextResponse.json({ error: "Gagal hapus", details: error.message }, { status: 500 });
  }
}