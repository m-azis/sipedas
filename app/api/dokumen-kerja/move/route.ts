import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const { id, targetFolderId, type } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });
    }

    // Menentukan ID tujuan (null berarti pindah ke root/beranda)
    const destinationId = targetFolderId === "null" || !targetFolderId ? null : targetFolderId;

    if (type === "folder") {
      // Pindahkan FolderDokumenKerja ke folder orang tua (parent) lain
      const updatedFolder = await prisma.folderDokumenKerja.update({
        where: { id: id },
        data: { parentId: destinationId },
      });
      return NextResponse.json(updatedFolder);
    } else {
      // Pindahkan DokumenKerja ke FolderDokumenKerja lain
      const updatedDokumen = await prisma.dokumenKerja.update({
        where: { id: parseInt(id) },
        data: { folderId: destinationId },
      });
      return NextResponse.json(updatedDokumen);
    }
  } catch (error) {
    console.error("Move Dokumen Kerja Error:", error);
    return NextResponse.json({ error: "Gagal memindahkan data dokumen kerja" }, { status: 500 });
  }
}